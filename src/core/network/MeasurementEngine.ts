import { EndpointResult } from '../types';
import { EndpointManager, NetworkEndpoint } from './EndpointManager';

export class MeasurementEngine {
  private static latencyHistory: number[] = [];

  public static async measureEndpoint(endpoint: NetworkEndpoint, timeoutMs: number = 4000): Promise<EndpointResult> {
    const start = performance.now();
    const cacheBuster = `?_t=${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const url = `${endpoint.url}${endpoint.url.includes('?') ? '&' : ''}${cacheBuster}`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      // Use mode: 'no-cors' so that cross-origin endpoints won't throw CORS errors while measuring HTTP connection RTT
      const response = await fetch(url, {
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-store',
        signal: controller.signal
      }).catch(async () => {
        // Fallback to GET with no-cors if HEAD is rejected by server
        return fetch(url, {
          method: 'GET',
          mode: 'no-cors',
          cache: 'no-store',
          signal: controller.signal
        });
      });

      clearTimeout(timer);
      const elapsed = Math.round(performance.now() - start);

      let status: 'reachable' | 'unreachable' | 'degraded' = 'reachable';
      if (elapsed > 400) {
        status = 'degraded';
      }

      return {
        name: endpoint.name,
        url: endpoint.url,
        latencyMs: elapsed,
        status,
        timestamp: Date.now()
      };
    } catch (err: any) {
      clearTimeout(timer);
      const isTimeout = err.name === 'AbortError';
      return {
        name: endpoint.name,
        url: endpoint.url,
        latencyMs: null,
        status: 'unreachable',
        error: isTimeout ? 'Timed out (> 4s)' : 'Connection Failed / Blocked',
        timestamp: Date.now()
      };
    }
  }

  public static async measureAll(endpoints?: NetworkEndpoint[]): Promise<{
    results: EndpointResult[];
    avgLatency: number | null;
    jitter: number | null;
    packetLoss: number;
    isReachable: boolean;
  }> {
    const targets = endpoints || EndpointManager.getEndpoints();
    const results = await Promise.all(targets.map(ep => this.measureEndpoint(ep)));

    const successful = results.filter(r => r.latencyMs !== null && r.status !== 'unreachable');
    const totalCount = results.length;
    const failedCount = totalCount - successful.length;
    const packetLoss = totalCount > 0 ? Math.round((failedCount / totalCount) * 100) : 0;

    let avgLatency: number | null = null;
    let jitter: number | null = null;

    if (successful.length > 0) {
      const latencies = successful.map(r => r.latencyMs as number);
      avgLatency = Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length);

      this.latencyHistory.push(avgLatency);
      if (this.latencyHistory.length > 10) {
        this.latencyHistory.shift();
      }

      if (this.latencyHistory.length >= 2) {
        let diffSum = 0;
        for (let i = 1; i < this.latencyHistory.length; i++) {
          diffSum += Math.abs(this.latencyHistory[i] - this.latencyHistory[i - 1]);
        }
        jitter = Math.round(diffSum / (this.latencyHistory.length - 1));
      } else {
        jitter = 0;
      }
    }

    return {
      results,
      avgLatency,
      jitter,
      packetLoss,
      isReachable: successful.length > 0
    };
  }
}
