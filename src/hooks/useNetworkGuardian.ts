import { useState, useEffect, useRef, useCallback } from 'react';
import {
  NetworkMetrics,
  StabilityScore,
  DecisionRecommendation,
  NetworkHistoryEntry,
  AutoFixType
} from '../core/types';
import { WebNetworkMonitor } from '../adapters/web/WebNetworkMonitor';
import { calculateStabilityScore } from '../core/monitoring/StabilityScore';
import { DecisionEngine } from '../core/ai/DecisionEngine';
import { AutoFixEngine } from '../core/autofix/AutoFixEngine';
import { HistoryManager } from '../core/history/HistoryManager';

export interface GuardianState {
  metrics: NetworkMetrics | null;
  stabilityScore: StabilityScore;
  recommendations: DecisionRecommendation[];
  history: NetworkHistoryEntry[];
  isMonitoring: boolean;
  isFixing: boolean;
  fixStatusMessage: string | null;
  lastUpdated: number | null;
}

export function useNetworkGuardian() {
  const monitorRef = useRef<WebNetworkMonitor | null>(null);

  const [state, setState] = useState<GuardianState>({
    metrics: null,
    stabilityScore: { score: 100, grade: 'EXCELLENT', reasons: ['System ready. Start live monitor or run diagnostic.'] },
    recommendations: [],
    history: [],
    isMonitoring: false,
    isFixing: false,
    fixStatusMessage: null,
    lastUpdated: null
  });

  // Initialize history
  useEffect(() => {
    const saved = HistoryManager.getHistory();
    setState(prev => ({ ...prev, history: saved }));
    monitorRef.current = new WebNetworkMonitor();

    return () => {
      if (monitorRef.current) {
        monitorRef.current.stopMonitoring();
      }
    };
  }, []);

  const handleMetricsUpdate = useCallback((metrics: NetworkMetrics) => {
    const score = calculateStabilityScore(metrics);
    const history = HistoryManager.addEntry(metrics, score);
    const recommendations = DecisionEngine.analyze(metrics, history);

    setState(prev => ({
      ...prev,
      metrics,
      stabilityScore: score,
      recommendations,
      history,
      lastUpdated: Date.now()
    }));
  }, []);

  const startMonitoring = useCallback(() => {
    if (!monitorRef.current) {
      monitorRef.current = new WebNetworkMonitor();
    }
    setState(prev => ({ ...prev, isMonitoring: true }));
    monitorRef.current.startMonitoring(handleMetricsUpdate, 4000);
  }, [handleMetricsUpdate]);

  const stopMonitoring = useCallback(() => {
    if (monitorRef.current) {
      monitorRef.current.stopMonitoring();
    }
    setState(prev => ({ ...prev, isMonitoring: false }));
  }, []);

  const runSingleDiagnostic = useCallback(async () => {
    if (!monitorRef.current) {
      monitorRef.current = new WebNetworkMonitor();
    }
    setState(prev => ({ ...prev, fixStatusMessage: 'Running full edge probe diagnostic...' }));
    try {
      const metrics = await monitorRef.current.getMetrics();
      handleMetricsUpdate(metrics);
    } finally {
      setState(prev => ({ ...prev, fixStatusMessage: null }));
    }
  }, [handleMetricsUpdate]);

  const executeAutoFix = useCallback(async (type: AutoFixType) => {
    setState(prev => ({ ...prev, isFixing: true, fixStatusMessage: 'Initiating auto-fix routine...' }));
    try {
      const result = await AutoFixEngine.executeFix(type, (msg) => {
        setState(prev => ({ ...prev, fixStatusMessage: msg }));
      });

      setState(prev => ({ ...prev, fixStatusMessage: result.message }));

      // Run fresh measurement after fix
      if (monitorRef.current) {
        const fresh = await monitorRef.current.getMetrics();
        handleMetricsUpdate(fresh);
      }

      setTimeout(() => {
        setState(prev => ({ ...prev, isFixing: false, fixStatusMessage: null }));
      }, 3500);
    } catch (e: any) {
      setState(prev => ({
        ...prev,
        isFixing: false,
        fixStatusMessage: `Auto-fix encountered an issue: ${e?.message || 'Unknown error'}`
      }));
      setTimeout(() => {
        setState(prev => ({ ...prev, fixStatusMessage: null }));
      }, 4000);
    }
  }, [handleMetricsUpdate]);

  const clearHistory = useCallback(() => {
    HistoryManager.clearHistory();
    setState(prev => ({ ...prev, history: [] }));
  }, []);

  return {
    state,
    startMonitoring,
    stopMonitoring,
    runSingleDiagnostic,
    executeAutoFix,
    clearHistory
  };
}
