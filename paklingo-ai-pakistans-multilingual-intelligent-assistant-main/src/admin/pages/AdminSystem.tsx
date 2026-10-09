/**
 * PakLingo AI - Administrative System Health & Runtime Diagnostics
 * Live memory diagnostics, node engine, model connectivity, and infrastructure telemetry.
 */

import React, { useState, useEffect } from 'react';
import { Server, Cpu, Database, Shield, Zap, RefreshCw, AlertCircle, CheckCircle, HardDrive, Clock } from 'lucide-react';
import { AdminAPI } from '../api';
import { SystemInfo } from '../types';

export const AdminSystem: React.FC = () => {
  const [info, setInfo] = useState<SystemInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSystem = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await AdminAPI.getSystemInfo();
      setInfo(res);
    } catch (err: any) {
      setError(err.message || 'Failed to query system telemetry.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSystem();
  }, []);

  const formatUptime = (seconds: number) => {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${d > 0 ? `${d}d ` : ''}${h}h ${m}m ${s}s`;
  };

  if (isLoading && !info) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <RefreshCw className="w-8 h-8 text-[var(--accent)] animate-spin" />
        <p className="text-xs text-[var(--text-secondary)] font-medium">Interrogating runtime environment...</p>
      </div>
    );
  }

  if (error || !info) {
    return (
      <div className="p-5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs flex items-center gap-3">
        <AlertCircle className="w-5 h-5 shrink-0" />
        <span>{error || 'System diagnostics unavailable.'}</span>
      </div>
    );
  }

  return (
    <div id="admin-system-page" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[var(--border)]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)] flex items-center gap-2">
            <Server className="w-6 h-6 text-[var(--accent)]" />
            <span>Application & System Health</span>
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Operational telemetry, compute environment, model connectivity, and session diagnostics
          </p>
        </div>

        <button
          onClick={loadSystem}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--button-primary-bg)] text-[var(--button-primary-text)] text-xs font-semibold hover:opacity-95 transition-all cursor-pointer shadow-xs disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Grid of 4 Health Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xs">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)] font-semibold">
            <span>GEMINI ENGINE</span>
            <CheckCircle className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl font-black text-[var(--text-primary)] mt-1">
            {info.geminiConfigured ? 'Connected' : 'Key Configured'}
          </div>
          <div className="text-[11px] text-emerald-500 mt-1">Direct server API bridge</div>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xs">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)] font-semibold">
            <span>SERVER UPTIME</span>
            <Clock className="w-4 h-4 text-[var(--accent)]" />
          </div>
          <div className="text-xl font-black text-[var(--text-primary)] mt-1 font-mono">
            {formatUptime(info.uptimeSeconds)}
          </div>
          <div className="text-[11px] text-[var(--text-muted)] mt-1">Continuous operation</div>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xs">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)] font-semibold">
            <span>HEAP MEMORY</span>
            <HardDrive className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-xl font-black text-[var(--text-primary)] mt-1 font-mono">
            {Math.round(info.memoryUsage.heapUsed / (1024 * 1024))} MB
          </div>
          <div className="text-[11px] text-[var(--text-muted)] mt-1">
            Of {Math.round(info.memoryUsage.heapTotal / (1024 * 1024))} MB allocated
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xs">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)] font-semibold">
            <span>ADMIN SESSIONS</span>
            <Shield className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl font-black text-[var(--text-primary)] mt-1">
            {info.activeAdminSessions} Active
          </div>
          <div className="text-[11px] text-[var(--text-muted)] mt-1">Bearer tokens authorized</div>
        </div>
      </div>

      {/* Diagnostics Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Core Environment */}
        <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-[var(--border)]">
            <Cpu className="w-4 h-4 text-[var(--accent)]" />
            <h3 className="text-sm font-bold text-[var(--text-primary)]">Runtime Container Specifications</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)]">
              <span className="text-[var(--text-secondary)] font-medium">Application Version</span>
              <span className="font-mono font-bold text-[var(--text-primary)]">{info.version}</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)]">
              <span className="text-[var(--text-secondary)] font-medium">Node.js Engine</span>
              <span className="font-mono font-bold text-[var(--text-primary)]">{info.nodeVersion}</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)]">
              <span className="text-[var(--text-secondary)] font-medium">Deployment Environment</span>
              <span className="font-mono font-bold text-[var(--text-primary)] uppercase">{info.environment}</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)]">
              <span className="text-[var(--text-secondary)] font-medium">Server Clock (UTC)</span>
              <span className="font-mono font-bold text-[var(--text-primary)]">
                {new Date(info.serverTime).toUTCString()}
              </span>
            </div>
          </div>
        </div>

        {/* Database & Storage Records */}
        <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-[var(--border)]">
            <Database className="w-4 h-4 text-[var(--accent)]" />
            <h3 className="text-sm font-bold text-[var(--text-primary)]">Data Store & Telemetry Pipeline</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)]">
              <span className="text-[var(--text-secondary)] font-medium">Store Status</span>
              <span className="font-mono font-bold text-emerald-500 capitalize">{info.databaseStatus}</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)]">
              <span className="text-[var(--text-secondary)] font-medium">Total Registered Citizen Profiles</span>
              <span className="font-mono font-bold text-[var(--text-primary)]">{info.totalRegisteredUsers}</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)]">
              <span className="text-[var(--text-secondary)] font-medium">Telemetry Activities Ingested</span>
              <span className="font-mono font-bold text-[var(--text-primary)]">{info.totalLoggedActivities}</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)]">
              <span className="text-[var(--text-secondary)] font-medium">Administrative Audit Trail Logs</span>
              <span className="font-mono font-bold text-[var(--text-primary)]">{info.auditLogCount} entries</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
