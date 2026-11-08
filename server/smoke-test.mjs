const baseUrl = process.env.TEST_BASE_URL ?? 'http://127.0.0.1:8080';

async function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const health = await fetch(`${baseUrl}/healthz`, { cache: 'no-store' });
await assert(health.status === 200, `health check returned ${health.status}`);
const healthBody = await health.json();
await assert(healthBody.status === 'ok', 'health response was not successful');

const probe = await fetch(`${baseUrl}/v1/probe?smoke=${crypto.randomUUID()}`, { cache: 'no-store' });
await assert(probe.status === 204, `probe returned ${probe.status}`);

const requestedBytes = 1024 * 1024;
const download = await fetch(`${baseUrl}/v1/download?bytes=${requestedBytes}`, { cache: 'no-store' });
await assert(download.status === 200, `download returned ${download.status}`);
const downloaded = new Uint8Array(await download.arrayBuffer());
await assert(downloaded.byteLength === requestedBytes, `download size mismatch: ${downloaded.byteLength}`);

const uploadPayload = crypto.getRandomValues(new Uint8Array(64 * 1024));
const upload = await fetch(`${baseUrl}/v1/upload`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/octet-stream' },
  body: uploadPayload,
});
await assert(upload.status === 200, `upload returned ${upload.status}`);
const uploadReceipt = await upload.json();
await assert(uploadReceipt.bytesReceived === uploadPayload.byteLength, 'server did not confirm uploaded byte count');

console.log('HTTP integration checks passed: health, probe, exact download bytes, exact upload receipt.');
