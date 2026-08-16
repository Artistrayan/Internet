import { NetworkMetrics, StabilityScore } from '../types';

export function calculateStabilityScore(metrics: NetworkMetrics | null): StabilityScore {
  if (!metrics) {
    return {
      score: 0,
      grade: 'CRITICAL',
      reasons: ['No telemetry data available']
    };
  }

  if (!metrics.isDeviceConnected) {
    return {
      score: 0,
      grade: 'CRITICAL',
      reasons: ['Device is offline (No network connection)']
    };
  }

  if (!metrics.isInternetReachable) {
    return {
      score: 10,
      grade: 'CRITICAL',
      reasons: ['Network gateway connected but internet endpoints are unreachable']
    };
  }

  let score = 100;
  const reasons: string[] = [];

  // Latency penalty
  const latency = metrics.latencyMs;
  if (latency !== null) {
    if (latency <= 60) {
      // Ideal
    } else if (latency <= 120) {
      score -= 10;
      reasons.push(`Moderate latency (${latency}ms)`);
    } else if (latency <= 250) {
      score -= 25;
      reasons.push(`High latency (${latency}ms) affecting real-time responsiveness`);
    } else {
      score -= 40;
      reasons.push(`Severe latency bottleneck (${latency}ms)`);
    }
  } else {
    score -= 30;
    reasons.push('Could not measure round-trip latency');
  }

  // Jitter penalty
  const jitter = metrics.jitterMs;
  if (jitter !== null) {
    if (jitter <= 15) {
      // Excellent stability
    } else if (jitter <= 40) {
      score -= 10;
      reasons.push(`Mild connection jitter (${jitter}ms variance)`);
    } else if (jitter <= 80) {
      score -= 20;
      reasons.push(`Significant jitter (${jitter}ms) detected`);
    } else {
      score -= 30;
      reasons.push(`Severe jitter spikes (${jitter}ms) causing packet instability`);
    }
  }

  // Packet loss penalty
  const packetLoss = metrics.packetLossPercent;
  if (packetLoss !== null && packetLoss > 0) {
    if (packetLoss <= 10) {
      score -= 15;
      reasons.push(`Minor packet drops (${packetLoss}%)`);
    } else if (packetLoss <= 30) {
      score -= 35;
      reasons.push(`Noticeable packet loss (${packetLoss}%)`);
    } else {
      score -= 50;
      reasons.push(`Critical packet loss (${packetLoss}%)`);
    }
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  let grade: StabilityScore['grade'] = 'EXCELLENT';
  if (score >= 90) {
    grade = 'EXCELLENT';
    if (reasons.length === 0) reasons.push('Ultra-stable line with optimal RTT and zero packet drop');
  } else if (score >= 75) {
    grade = 'GOOD';
    if (reasons.length === 0) reasons.push('Reliable network connection with normal baseline variance');
  } else if (score >= 50) {
    grade = 'FAIR';
  } else if (score >= 25) {
    grade = 'POOR';
  } else {
    grade = 'CRITICAL';
  }

  return {
    score,
    grade,
    reasons
  };
}
