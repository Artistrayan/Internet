export interface ProbeSample {
  sequence: number;
  latencyMs: number | null;
  succeeded: boolean;
  error?: string;
}

export interface TransferSample {
  megabitsPerSecond: number | null;
  bytesTransferred: number | null;
  durationMs: number | null;
  error?: string;
}

export interface LiveMeasurementResult {
  measuredAt: string;
  probeSamples: ProbeSample[];
  latencyMs: number | null;
  jitterMs: number | null;
  packetLossPercent: number | null;
  download: TransferSample;
  upload: TransferSample;
}

const PROBE_COUNT = 5;
const DOWNLOAD_BYTES = 8 * 1024 * 1024;
const UPLOAD_BYTES = 4 * 1024 * 1024;
const REQUEST_TIMEOUT_MS = 20_000;

function timeoutSignal(timeoutMs: number): { signal: AbortSignal; dispose: () => void } {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  return {
    signal: controller.signal,
    dispose: () => window.clearTimeout(timer),
  };
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function calculateJitter(values: number[]): number | null {
  if (values.length < 2) return null;
  const differences = values.slice(1).map((value, index) => Math.abs(value - values[index]));
  return average(differences);
}

function mbps(bytes: number, durationMs: number): number {
  if (durationMs <= 0) throw new Error('Invalid transfer duration');
  return (bytes * 8) / (durationMs / 1000) / 1_000_000;
}

export class LiveMeasurementClient {
  private readonly baseUrl: string;

  constructor(baseUrl: string | undefined) {
    if (!baseUrl) {
      throw new Error('Measurement API URL is not configured. No network metrics can be collected.');
    }
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  private async probe(sequence: number): Promise<ProbeSample> {
    const { signal, dispose } = timeoutSignal(REQUEST_TIMEOUT_MS);
    const started = performance.now();
    try {
      const response = await fetch(
        `${this.baseUrl}/v1/probe?nonce=${crypto.randomUUID()}`,
        { method: 'GET', cache: 'no-store', credentials: 'omit', signal },
      );
      if (!response.ok && response.status !== 204) {
        throw new Error(`Probe endpoint returned HTTP ${response.status}`);
      }
      return {
        sequence,
        latencyMs: performance.now() - started,
        succeeded: true,
      };
    } catch (error) {
      return {
        sequence,
        latencyMs: null,
        succeeded: false,
        error: error instanceof Error ? error.message : 'Probe failed',
      };
    } finally {
      dispose();
    }
  }

  private async measureDownload(): Promise<TransferSample> {
    const { signal, dispose } = timeoutSignal(REQUEST_TIMEOUT_MS);
    const started = performance.now();
    try {
      const response = await fetch(
        `${this.baseUrl}/v1/download?bytes=${DOWNLOAD_BYTES}&nonce=${crypto.randomUUID()}`,
        { method: 'GET', cache: 'no-store', credentials: 'omit', signal },
      );
      if (!response.ok || !response.body) {
        throw new Error(`Download endpoint returned HTTP ${response.status}`);
      }

      const reader = response.body.getReader();
      let bytesTransferred = 0;
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          bytesTransferred += value.byteLength;
        }
      } finally {
        reader.releaseLock();
      }

      const durationMs = performance.now() - started;
      if (bytesTransferred !== DOWNLOAD_BYTES) {
        throw new Error(`Incomplete download: received ${bytesTransferred} of ${DOWNLOAD_BYTES} bytes`);
      }
      return {
        megabitsPerSecond: mbps(bytesTransferred, durationMs),
        bytesTransferred,
        durationMs,
      };
    } catch (error) {
      return {
        megabitsPerSecond: null,
        bytesTransferred: null,
        durationMs: null,
        error: error instanceof Error ? error.message : 'Download test failed',
      };
    } finally {
      dispose();
    }
  }

  private async measureUpload(): Promise<TransferSample> {
    const payload = new Uint8Array(UPLOAD_BYTES);
    for (let offset = 0; offset < payload.length; offset += 65_536) {
      crypto.getRandomValues(payload.subarray(offset, Math.min(offset + 65_536, payload.length)));
    }

    const { signal, dispose } = timeoutSignal(REQUEST_TIMEOUT_MS);
    const started = performance.now();
    try {
      const response = await fetch(`${this.baseUrl}/v1/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/octet-stream' },
        body: payload,
        cache: 'no-store',
        credentials: 'omit',
        signal,
      });
      if (!response.ok) {
        throw new Error(`Upload endpoint returned HTTP ${response.status}`);
      }

      const receipt = (await response.json()) as { bytesReceived?: number };
      const durationMs = performance.now() - started;
      if (receipt.bytesReceived !== UPLOAD_BYTES) {
        throw new Error('Server did not confirm the complete uploaded byte count');
      }
      return {
        megabitsPerSecond: mbps(receipt.bytesReceived, durationMs),
        bytesTransferred: receipt.bytesReceived,
        durationMs,
      };
    } catch (error) {
      return {
        megabitsPerSecond: null,
        bytesTransferred: null,
        durationMs: null,
        error: error instanceof Error ? error.message : 'Upload test failed',
      };
    } finally {
      dispose();
    }
  }

  async measure(): Promise<LiveMeasurementResult> {
    const probeSamples: ProbeSample[] = [];
    for (let sequence = 1; sequence <= PROBE_COUNT; sequence += 1) {
      probeSamples.push(await this.probe(sequence));
    }

    const successfulLatencies = probeSamples
      .filter((sample) => sample.succeeded && sample.latencyMs !== null)
      .map((sample) => sample.latencyMs as number);

    const successfulCount = successfulLatencies.length;
    const packetLossPercent = (1 - successfulCount / PROBE_COUNT) * 100;
    const [download, upload] = await Promise.all([
      this.measureDownload(),
      this.measureUpload(),
    ]);

    return {
      measuredAt: new Date().toISOString(),
      probeSamples,
      latencyMs: average(successfulLatencies),
      jitterMs: calculateJitter(successfulLatencies),
      packetLossPercent,
      download,
      upload,
    };
  }
}
