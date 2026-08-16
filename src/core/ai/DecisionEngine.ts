import { NetworkMetrics, NetworkHistoryEntry, DecisionRecommendation } from '../types';

export class DecisionEngine {
  public static analyze(
    metrics: NetworkMetrics | null,
    history: NetworkHistoryEntry[]
  ): DecisionRecommendation[] {
    if (!metrics) {
      return [
        {
          id: 'no-metrics',
          severity: 'info',
          title: 'Awaiting Initial Telemetry',
          description: 'Network Guardian is initializing background probes to evaluate connection quality.',
          suggestedAction: 'Start live monitoring to begin automated diagnostic checks.',
          autoFixAvailable: false
        }
      ];
    }

    const recommendations: DecisionRecommendation[] = [];

    if (!metrics.isDeviceConnected) {
      recommendations.push({
        id: 'rec-offline',
        severity: 'critical',
        title: 'Device Disconnected',
        description: 'Physical network interface reports offline status. No link detected.',
        suggestedAction: 'Verify Wi-Fi or Ethernet cable connection and reset local adapter.',
        autoFixAvailable: true,
        fixType: 'reconnect_probe'
      });
      return recommendations;
    }

    if (!metrics.isInternetReachable) {
      recommendations.push({
        id: 'rec-captive-dns',
        severity: 'critical',
        title: 'Gateway Connected but WAN Unreachable',
        description: 'Local connection is active, but test probes to global Anycast endpoints failed.',
        suggestedAction: 'Execute network route re-probing and clear socket cache.',
        autoFixAvailable: true,
        fixType: 'reconnect_probe'
      });
    }

    if (metrics.packetLossPercent !== null && metrics.packetLossPercent > 15) {
      recommendations.push({
        id: 'rec-packet-loss',
        severity: 'warning',
        title: `High Packet Loss (${metrics.packetLossPercent}%)`,
        description: 'A significant portion of packets are dropped before reaching Anycast CDN nodes.',
        suggestedAction: 'Switch to redundant fallback endpoint routes to bypass congested peering hops.',
        autoFixAvailable: true,
        fixType: 'endpoint_fallback'
      });
    }

    if (metrics.latencyMs !== null && metrics.latencyMs > 250) {
      recommendations.push({
        id: 'rec-latency-bufferbloat',
        severity: 'warning',
        title: `Bufferbloat / Elevated Latency (${metrics.latencyMs}ms)`,
        description: 'Round-trip HTTP time exceeds 250ms, which may lead to sluggish media streaming and interactive delays.',
        suggestedAction: 'Purge local DNS resolution cache and renew socket keep-alives.',
        autoFixAvailable: true,
        fixType: 'dns_switch'
      });
    }

    if (metrics.jitterMs !== null && metrics.jitterMs > 50) {
      recommendations.push({
        id: 'rec-jitter',
        severity: 'warning',
        title: `Jitter Instability (${metrics.jitterMs}ms)`,
        description: 'High packet arrival time variance indicates fluctuating network path queues.',
        suggestedAction: 'Execute TCP socket pool refresh to stabilize route queues.',
        autoFixAvailable: true,
        fixType: 'tcp_reset'
      });
    }

    if (recommendations.length === 0) {
      recommendations.push({
        id: 'rec-optimal',
        severity: 'info',
        title: 'Network Operating at Peak Efficiency',
        description: 'Latency, jitter, and reachability metrics are well within optimal thresholds.',
        suggestedAction: 'Guardian engine will continuously monitor and maintain link stability.',
        autoFixAvailable: false
      });
    }

    return recommendations;
  }
}
