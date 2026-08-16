export type NetworkType = 'wifi' | 'cellular' | 'ethernet' | 'none' | 'unknown';

export interface EndpointResult {
  name: string;
  url: string;
  latencyMs: number | null;
  status: 'reachable' | 'unreachable' | 'degraded';
  error?: string;
  timestamp: number;
}

export interface NetworkMetrics {
  isDeviceConnected: boolean;
  isInternetReachable: boolean;
  type: NetworkType;
  latencyMs: number | null;
  jitterMs: number | null;
  packetLossPercent: number | null;
  downloadBandwidthMbps?: number | null;
  endpointMeasurements: EndpointResult[];
  timestamp: number;
}

export interface StabilityScore {
  score: number; // 0 to 100
  grade: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'CRITICAL';
  reasons: string[];
}

export interface DecisionRecommendation {
  id: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  suggestedAction: string;
  autoFixAvailable: boolean;
  fixType?: AutoFixType;
}

export type AutoFixType = 
  | 'reconnect_probe'
  | 'dns_switch'
  | 'cache_reset'
  | 'endpoint_fallback'
  | 'tcp_reset';

export interface AutoFixAction {
  id: string;
  type: AutoFixType;
  name: string;
  status: 'idle' | 'running' | 'success' | 'failed';
  message?: string;
  timestamp?: number;
}

export interface NetworkHistoryEntry {
  timestamp: number;
  score: number;
  latencyMs: number | null;
  jitterMs: number | null;
  status: string;
}

export interface INetworkMonitor {
  getMetrics(): Promise<NetworkMetrics>;
  startMonitoring(onUpdate: (metrics: NetworkMetrics) => void, intervalMs?: number): void;
  stopMonitoring(): void;
}
