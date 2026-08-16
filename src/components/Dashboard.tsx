import React from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Activity,
  Wifi,
  Signal,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Play,
  Square,
  Wrench,
  RotateCcw,
  Server,
  Zap,
  Globe,
  Trash2
} from 'lucide-react';
import { useNetworkGuardian } from '../hooks/useNetworkGuardian';
import { AutoFixType } from '../core/types';

export const Dashboard: React.FC = () => {
  const {
    state,
    startMonitoring,
    stopMonitoring,
    runSingleDiagnostic,
    executeAutoFix,
    clearHistory
  } = useNetworkGuardian();

  const {
    metrics,
    stabilityScore,
    recommendations,
    history,
    isMonitoring,
    isFixing,
    fixStatusMessage,
    lastUpdated
  } = state;

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
    if (score >= 75) return 'text-teal-400 border-teal-500/30 bg-teal-500/10';
    if (score >= 50) return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
    return 'text-rose-400 border-rose-500/30 bg-rose-500/10';
  };

  const getGradeBadge = (grade: string) => {
    switch (grade) {
      case 'EXCELLENT':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'GOOD':
        return 'bg-teal-500/20 text-teal-300 border-teal-500/30';
      case 'FAIR':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'POOR':
      case 'CRITICAL':
      default:
        return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
    }
  };

  return (
    <div id="guardian-dashboard" className="min-h-screen bg-neutral-950 text-neutral-100 p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header Bar */}
        <header id="header-bar" className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">Internet Guardian</h1>
                <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400 font-medium">v1.2 Active</span>
              </div>
              <p className="text-xs sm:text-sm text-neutral-400 mt-0.5">
                Autonomous network stability telemetry & self-healing auto-fix engine
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {!isMonitoring ? (
              <button
                id="btn-start-monitor"
                onClick={startMonitoring}
                disabled={isFixing}
                className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-50"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Start Monitor</span>
              </button>
            ) : (
              <button
                id="btn-stop-monitor"
                onClick={stopMonitoring}
                disabled={isFixing}
                className="flex items-center space-x-2 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-50"
              >
                <Square className="w-4 h-4 fill-current" />
                <span>Stop Monitor</span>
              </button>
            )}

            <button
              id="btn-run-diagnostic"
              onClick={runSingleDiagnostic}
              disabled={isFixing}
              className="flex items-center space-x-2 px-3.5 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-sm font-medium rounded-lg border border-neutral-700 transition-colors cursor-pointer disabled:opacity-50"
              title="Run instant probe"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">Probe Now</span>
            </button>
          </div>
        </header>

        {/* Real-time Status / Alert Banner if Fixing */}
        {fixStatusMessage && (
          <div id="status-banner" className="p-3.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-cyan-200 text-sm flex items-center space-x-3">
            <Zap className="w-5 h-5 text-cyan-400 animate-pulse shrink-0" />
            <span className="font-mono text-xs sm:text-sm">{fixStatusMessage}</span>
          </div>
        )}

        {/* Top Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Stability Score Card */}
          <div id="card-stability-score" className="p-5 rounded-2xl bg-neutral-900/70 border border-neutral-800 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Stability Index</span>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${getGradeBadge(stabilityScore.grade)}`}>
                {stabilityScore.grade}
              </span>
            </div>

            <div className="my-4 flex items-baseline space-x-3">
              <span className={`text-4xl sm:text-5xl font-bold font-mono ${getScoreColor(stabilityScore.score).split(' ')[0]}`}>
                {stabilityScore.score}
              </span>
              <span className="text-sm text-neutral-500 font-mono">/ 100</span>
            </div>

            <div className="space-y-1">
              {stabilityScore.reasons.slice(0, 2).map((reason, idx) => (
                <p key={idx} className="text-xs text-neutral-400 flex items-center space-x-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-neutral-600"></span>
                  <span className="truncate">{reason}</span>
                </p>
              ))}
            </div>
          </div>

          {/* Connection Overview Card */}
          <div id="card-connection-overview" className="p-5 rounded-2xl bg-neutral-900/70 border border-neutral-800 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Connection State</span>
              <div className="flex items-center space-x-1.5">
                <span className={`w-2 h-2 rounded-full ${metrics?.isInternetReachable ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`}></span>
                <span className="text-xs text-neutral-400 font-medium">
                  {isMonitoring ? 'Live Polling' : 'Idle / Ready'}
                </span>
              </div>
            </div>

            <div className="my-3 grid grid-cols-2 gap-2">
              <div className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800/80">
                <span className="text-[11px] text-neutral-500 block">Link Interface</span>
                <div className="flex items-center space-x-1.5 mt-1">
                  {metrics?.type === 'wifi' ? (
                    <Wifi className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Signal className="w-4 h-4 text-cyan-400" />
                  )}
                  <span className="text-sm font-semibold uppercase text-neutral-200">
                    {metrics?.type || 'UNKNOWN'}
                  </span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800/80">
                <span className="text-[11px] text-neutral-500 block">WAN Reachability</span>
                <div className="flex items-center space-x-1.5 mt-1">
                  {metrics?.isInternetReachable ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-400" />
                  )}
                  <span className="text-sm font-semibold text-neutral-200">
                    {metrics?.isInternetReachable ? 'Online' : 'Offline'}
                  </span>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-neutral-500">
              Last Telemetry: {lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : 'Not measured yet'}
            </p>
          </div>

          {/* Latency & Quality Summary Card */}
          <div id="card-latency-quality" className="p-5 rounded-2xl bg-neutral-900/70 border border-neutral-800 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Round-Trip Quality</span>
              <Activity className="w-4 h-4 text-neutral-400" />
            </div>

            <div className="grid grid-cols-3 gap-2 my-2">
              <div className="p-2 rounded-xl bg-neutral-950 border border-neutral-800/80 text-center">
                <span className="text-[10px] text-neutral-500 uppercase block">Latency</span>
                <span className="text-base font-bold font-mono text-neutral-200 mt-0.5 block">
                  {metrics?.latencyMs != null ? `${metrics.latencyMs}ms` : '--'}
                </span>
              </div>

              <div className="p-2 rounded-xl bg-neutral-950 border border-neutral-800/80 text-center">
                <span className="text-[10px] text-neutral-500 uppercase block">Jitter</span>
                <span className="text-base font-bold font-mono text-neutral-200 mt-0.5 block">
                  {metrics?.jitterMs != null ? `${metrics.jitterMs}ms` : '--'}
                </span>
              </div>

              <div className="p-2 rounded-xl bg-neutral-950 border border-neutral-800/80 text-center">
                <span className="text-[10px] text-neutral-500 uppercase block">Loss</span>
                <span className="text-base font-bold font-mono text-neutral-200 mt-0.5 block">
                  {metrics?.packetLossPercent != null ? `${metrics.packetLossPercent}%` : '--'}
                </span>
              </div>
            </div>

            <div className="text-[11px] text-neutral-400 flex items-center justify-between">
              <span>Bandwidth:</span>
              <span className="font-mono text-neutral-300">
                {metrics?.downloadBandwidthMbps != null ? `~${metrics.downloadBandwidthMbps} Mbps` : 'Auto-detected'}
              </span>
            </div>
          </div>
        </div>

        {/* Middle Section: Edge Endpoint Ping Matrix & Decision Engine */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Anycast Edge Nodes */}
          <div id="card-edge-endpoints" className="p-5 rounded-2xl bg-neutral-900/70 border border-neutral-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Globe className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm font-semibold text-neutral-200">Global Edge Endpoints</h2>
              </div>
              <span className="text-xs text-neutral-500 font-mono">Anycast HTTP RTT</span>
            </div>

            <div className="space-y-2.5">
              {metrics?.endpointMeasurements && metrics.endpointMeasurements.length > 0 ? (
                metrics.endpointMeasurements.map((ep, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-neutral-950 border border-neutral-800/90 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center space-x-2.5">
                      {ep.status === 'reachable' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : ep.status === 'degraded' ? (
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      )}
                      <div>
                        <div className="font-medium text-neutral-200">{ep.name}</div>
                        <div className="text-[10px] text-neutral-500 font-mono truncate max-w-[200px] sm:max-w-xs">
                          {ep.url}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className={`font-mono font-semibold ${ep.latencyMs != null ? 'text-neutral-200' : 'text-rose-400'}`}>
                        {ep.latencyMs != null ? `${ep.latencyMs} ms` : 'Failed'}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 rounded-xl bg-neutral-950/60 border border-neutral-800 text-center text-xs text-neutral-500">
                  Click 'Start Monitor' or 'Probe Now' to measure live edge latency.
                </div>
              )}
            </div>
          </div>

          {/* Smart Decision Engine & Auto-Fix */}
          <div id="card-decision-engine" className="p-5 rounded-2xl bg-neutral-900/70 border border-neutral-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Wrench className="w-4 h-4 text-cyan-400" />
                <h2 className="text-sm font-semibold text-neutral-200">Decision Engine & Self-Healing</h2>
              </div>
              <span className="text-xs text-cyan-400/80 font-mono">Autonomous AI Core</span>
            </div>

            <div className="space-y-3">
              {recommendations.length > 0 ? (
                recommendations.map(rec => (
                  <div
                    key={rec.id}
                    className={`p-3.5 rounded-xl border ${
                      rec.severity === 'critical'
                        ? 'bg-rose-950/20 border-rose-500/30'
                        : rec.severity === 'warning'
                        ? 'bg-amber-950/20 border-amber-500/30'
                        : 'bg-neutral-950 border-neutral-800'
                    } space-y-2`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center space-x-2">
                        {rec.severity === 'critical' ? (
                          <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                        ) : rec.severity === 'warning' ? (
                          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                        ) : (
                          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                        )}
                        <h3 className="text-xs font-semibold text-neutral-200">{rec.title}</h3>
                      </div>
                    </div>

                    <p className="text-[11px] text-neutral-400 leading-relaxed">{rec.description}</p>

                    <div className="pt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-neutral-800/60">
                      <span className="text-[10px] text-neutral-500">{rec.suggestedAction}</span>

                      {rec.autoFixAvailable && rec.fixType && (
                        <button
                          id={`btn-autofix-${rec.id}`}
                          onClick={() => executeAutoFix(rec.fixType as AutoFixType)}
                          disabled={isFixing}
                          className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium rounded-lg shadow-sm transition-colors cursor-pointer shrink-0 disabled:opacity-50 flex items-center space-x-1.5"
                        >
                          <Zap className="w-3 h-3 fill-current" />
                          <span>Apply Auto-Fix</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 rounded-xl bg-neutral-950/60 border border-neutral-800 text-center text-xs text-neutral-500">
                  Ready to analyze network heuristics.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Telemetry History Table */}
        <div id="card-telemetry-history" className="p-5 rounded-2xl bg-neutral-900/70 border border-neutral-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Server className="w-4 h-4 text-neutral-400" />
              <h2 className="text-sm font-semibold text-neutral-200">Live Telemetry History</h2>
            </div>
            {history.length > 0 && (
              <button
                id="btn-clear-history"
                onClick={clearHistory}
                className="text-xs text-neutral-500 hover:text-rose-400 transition-colors flex items-center space-x-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
            )}
          </div>

          {history.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-neutral-800 text-neutral-500 uppercase text-[10px]">
                    <th className="pb-2 font-medium">Timestamp</th>
                    <th className="pb-2 font-medium">Stability</th>
                    <th className="pb-2 font-medium">Latency</th>
                    <th className="pb-2 font-medium">Jitter</th>
                    <th className="pb-2 font-medium text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-850">
                  {history.slice(0, 8).map((entry, idx) => (
                    <tr key={idx} className="hover:bg-neutral-800/20">
                      <td className="py-2 text-neutral-400">
                        {new Date(entry.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="py-2 text-neutral-200">{entry.score}/100</td>
                      <td className="py-2 text-neutral-300">
                        {entry.latencyMs != null ? `${entry.latencyMs}ms` : '--'}
                      </td>
                      <td className="py-2 text-neutral-400">
                        {entry.jitterMs != null ? `${entry.jitterMs}ms` : '--'}
                      </td>
                      <td className="py-2 text-right">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-sans font-medium ${getGradeBadge(entry.status)}`}>
                          {entry.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-4 text-center text-xs text-neutral-500 font-mono">
              No historical log entries recorded.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
