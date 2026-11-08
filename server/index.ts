import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { randomBytes, randomUUID } from 'node:crypto';

const MAX_TEST_BYTES = 16 * 1024 * 1024;
const CHUNK_BYTES = 64 * 1024;
const app = Fastify({
  logger: true,
  disableRequestLogging: true,
  bodyLimit: MAX_TEST_BYTES,
  trustProxy: process.env.TRUST_PROXY === 'true',
});

const allowedOrigins = new Set(
  (process.env.ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean),
);

await app.register(cors, {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.has(origin)) {
      callback(null, true);
      return;
    }
    callback(null, false);
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['content-type'],
  maxAge: 600,
});

await app.register(rateLimit, {
  max: 60,
  timeWindow: '1 minute',
});

app.addContentTypeParser(
  'application/octet-stream',
  { parseAs: 'buffer', bodyLimit: MAX_TEST_BYTES },
  (_request, body, done) => done(null, body),
);

app.get('/healthz', async () => ({
  status: 'ok',
  service: 'internet-measurement-node',
}));

app.get('/v1/probe', async (_request, reply) => {
  reply.header('Cache-Control', 'no-store, no-cache, must-revalidate');
  reply.header('Pragma', 'no-cache');
  return reply.code(204).send();
});

app.get<{ Querystring: { bytes?: string } }>(
  '/v1/download',
  async (request, reply) => {
    const bytes = Number(request.query.bytes);
    if (!Number.isSafeInteger(bytes) || bytes < 256 * 1024 || bytes > MAX_TEST_BYTES) {
      return reply.code(400).send({
        error: 'bytes must be an integer between 262144 and 16777216',
      });
    }

    reply.hijack();
    reply.raw.writeHead(200, {
      'Content-Type': 'application/octet-stream',
      'Content-Length': String(bytes),
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'X-Content-Type-Options': 'nosniff',
    });

    let remaining = bytes;
    while (remaining > 0 && !reply.raw.destroyed) {
      const size = Math.min(CHUNK_BYTES, remaining);
      const chunk = randomBytes(size);
      remaining -= size;
      if (!reply.raw.write(chunk)) {
        await new Promise<void>((resolve) => reply.raw.once('drain', resolve));
      }
    }

    if (!reply.raw.destroyed) reply.raw.end();
  },
);

app.post('/v1/upload', async (request, reply) => {
  const payload = request.body;
  if (!Buffer.isBuffer(payload)) {
    return reply.code(415).send({ error: 'application/octet-stream is required' });
  }
  if (payload.byteLength < 1 || payload.byteLength > MAX_TEST_BYTES) {
    return reply.code(413).send({ error: 'upload size is outside the permitted range' });
  }

  reply.header('Cache-Control', 'no-store');
  return {
    bytesReceived: payload.byteLength,
    receivedAt: new Date().toISOString(),
    requestId: randomUUID(),
  };
});

const port = Number(process.env.PORT ?? 8080);
const host = process.env.HOST ?? '0.0.0.0';

try {
  await app.listen({ port, host });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
