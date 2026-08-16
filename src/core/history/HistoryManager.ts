import { NetworkHistoryEntry, NetworkMetrics, StabilityScore } from '../types';

export class HistoryManager {
  private static readonly STORAGE_KEY = 'guardian_network_history';
  private static readonly MAX_ENTRIES = 30;

  public static getHistory(): NetworkHistoryEntry[] {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.warn('Failed to load history from localStorage', e);
    }
    return [];
  }

  public static addEntry(metrics: NetworkMetrics, score: StabilityScore): NetworkHistoryEntry[] {
    const entry: NetworkHistoryEntry = {
      timestamp: metrics.timestamp,
      score: score.score,
      latencyMs: metrics.latencyMs,
      jitterMs: metrics.jitterMs,
      status: score.grade
    };

    const current = this.getHistory();
    const updated = [entry, ...current].slice(0, this.MAX_ENTRIES);

    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to persist history to localStorage', e);
    }

    return updated;
  }

  public static clearHistory(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (e) {
      // ignore
    }
  }
}
