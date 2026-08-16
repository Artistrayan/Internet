import { INetworkMonitor, NetworkMetrics, NetworkType } from '../../core/types';
import { MeasurementEngine } from '../../core/network/MeasurementEngine';

export class WebNetworkMonitor implements INetworkMonitor {
  private timer: any = null;
  private isRunning: boolean = false;

  private detectNetworkType(): NetworkType {
    const nav = navigator as any;
    if (nav.connection) {
      const type = nav.connection.type;
      if (type === 'wifi') return 'wifi';
      if (type === 'cellular') return 'cellular';
      if (type === 'ethernet') return 'ethernet';
      if (type === 'none') return 'none';
      
      const effectiveType = nav.connection.effectiveType;
      if (effectiveType === '4g' || effectiveType === '3g' || effectiveType === '2g') {
        return 'cellular';
      }
    }
    return navigator.onLine ? 'wifi' : 'none';
  }

  public async getMetrics(): Promise<NetworkMetrics> {
    const isDeviceConnected = navigator.onLine;
    const networkType = isDeviceConnected ? this.detectNetworkType() : 'none';

    if (!isDeviceConnected) {
      return {
        isDeviceConnected: false,
        isInternetReachable: false,
        type: 'none',
        latencyMs: null,
        jitterMs: null,
        packetLossPercent: 100,
        endpointMeasurements: [],
        timestamp: Date.now()
      };
    }

    const { results, avgLatency, jitter, packetLoss, isReachable } = await MeasurementEngine.measureAll();

    // Check downlink bandwidth if supported
    const nav = navigator as any;
    const downloadBandwidthMbps = nav.connection?.downlink ? Number(nav.connection.downlink) : null;

    return {
      isDeviceConnected: true,
      isInternetReachable: isReachable,
      type: networkType,
      latencyMs: avgLatency,
      jitterMs: jitter,
      packetLossPercent: packetLoss,
      downloadBandwidthMbps,
      endpointMeasurements: results,
      timestamp: Date.now()
    };
  }

  public startMonitoring(onUpdate: (metrics: NetworkMetrics) => void, intervalMs: number = 4000): void {
    if (this.isRunning) return;
    this.isRunning = true;

    const tick = async () => {
      if (!this.isRunning) return;
      try {
        const metrics = await this.getMetrics();
        if (this.isRunning) {
          onUpdate(metrics);
        }
      } catch (err) {
        console.error('Monitoring probe error:', err);
      }
      if (this.isRunning) {
        this.timer = setTimeout(tick, intervalMs);
      }
    };

    tick();
  }

  public stopMonitoring(): void {
    this.isRunning = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}
