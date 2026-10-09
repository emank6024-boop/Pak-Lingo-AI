/**
 * PakLingo AI - Administrative Overview Dashboard
 * Comprehensive system metrics, active users, feature usage, language breakdown, and real-time activity.
 */

import React, { useState, useEffect } from 'react';
import {
  Users,
  UserCheck,
  UserPlus,
  RotateCcw,
  MessageSquare,
  Search,
  Languages,
  FileText,
  Cpu,
  RefreshCw,
  ArrowUpRight,
  Clock,
  Download,
  AlertCircle,
} from 'lucide-react';
import { AdminAPI } from '../api';
import { AdminOverviewStats, AdminPageId } from '../types';

interface AdminOverviewProps {
  onNavigate: (page: AdminPageId) => void;
  onSelectUserDetail: (userId: string) => void;
}

export const AdminOverview: React.FC<AdminOverviewProps> = ({ onNavigate, onSelectUserDetail }) => {
  const [data, setData] = useState<{
    stats: AdminOverviewStats;
    mostUsedFeatures: Array<{ name: string; count: number }>;
    mostUsedLanguages: Array<{ language: string; count: number }>;
    recentActivity: Array<any>;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOverview = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await AdminAPI.getOverview();
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load system overview statistics.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  if (isLoading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <RefreshCw className="w-8 h-8 text-[var(--accent)] animate-spin" />
        <p className="text-xs text-[var(--text-secondary)] font-medium">Loading administrative overview...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-500 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
        <div>
          <h3 className="text-sm font-bold">Failed to load statistics</h3>
          <p className="text-xs mt-1 text-rose-400">{error || 'Server error'}</p>
          <button
            onClick={fetchOverview}
            className="mt-3 px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-xs font-semibold transition-colors cursor-pointer"
          >
            Retry Loading
          </button>
        </div>
      </div>
    );
  }

  const { stats, mostUsedFeatures, mostUsedLanguages, recentActivity } = data;

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers,
      sub: `${stats.activeUsers} currently active`,
      icon: Users,
      action: () => onNavigate('users'),
    },
    {
      title: 'Active Users',
      value: stats.activeUsers,
      sub: 'Verified accounts',
      icon: UserCheck,
      action: () => onNavigate('users'),
    },
    {
      title: 'New Users',
      value: stats.newUsers,
      sub: 'Last 30 days',
      icon: UserPlus,
      action: () => onNavigate('users'),
    },
    {
      title: 'Returning Users',
      value: stats.returningUsers,
      sub: 'Active repeat usage',
      icon: RotateCcw,
      action: () => onNavigate('users'),
    },
    {
      title: 'Conversations',
      value: stats.totalConversations,
      sub: 'Recorded dialogues',
      icon: MessageSquare,
      action: () => onNavigate('conversations'),
    },
    {
      title: 'Searches & Queries',
      value: stats.totalSearches,
      sub: 'Topic & civic inquiries',
      icon: Search,
      action: () => onNavigate('search-activity'),
    },
    {
      title: 'Translations',
      value: stats.totalTranslations,
      sub: 'Pakistani language pairs',
      icon: Languages,
      action: () => onNavigate('translations'),
    },
    {
      title: 'Documents Processed',
      value: stats.totalDocumentsProcessed,
      sub: 'OCR bills, forms & tests',
      icon: FileText,
      action: () => onNavigate('documents'),
    },
    {
      title: 'AI Requests',
      value: stats.totalAiRequests,
      sub: 'Live Gemini queries',
      icon: Cpu,
      action: () => onNavigate('analytics'),
    },
  ];

  return (
    <div id="admin-overview-page" className="space-y-6">
      {/* Top Banner & Quick Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[var(--border)]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            Operations Dashboard
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Real-time administrative telemetry and system activity oversight
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => AdminAPI.exportData('users', 'csv')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] text-xs font-semibold text-[var(--text-primary)] hover:border-[var(--accent)] transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[var(--text-muted)]" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={fetchOverview}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--button-primary-bg)] text-[var(--button-primary-text)] text-xs font-semibold hover:opacity-95 transition-all cursor-pointer shadow-xs disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Grid of 9 Primary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              onClick={card.action}
              className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--accent)]/60 transition-all cursor-pointer group shadow-xs"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-[var(--text-secondary)] tracking-wide">
                  {card.title}
                </span>
                <div className="w-8 h-8 rounded-lg bg-[var(--surface-secondary)] border border-[var(--border)] flex items-center justify-center text-[var(--accent)] group-hover:scale-105 transition-transform">
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold tracking-tight text-[var(--text-primary)]">
                {card.value.toLocaleString()}
              </div>
              <div className="flex items-center justify-between mt-1 text-[11px] text-[var(--text-muted)]">
                <span>{card.sub}</span>
                <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-[var(--accent)]" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Two-Column Analytics: Most Used Features & Most Used Languages */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Most Used Features */}
        <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-[var(--text-primary)]">Most Used Features</h3>
              <p className="text-[11px] text-[var(--text-muted)]">Citizen interactions across modules</p>
            </div>
            <button
              onClick={() => onNavigate('analytics')}
              className="text-xs font-semibold text-[var(--accent)] hover:underline cursor-pointer"
            >
              Full Analytics
            </button>
          </div>

          <div className="space-y-3">
            {mostUsedFeatures.map((f, i) => {
              const maxVal = mostUsedFeatures[0]?.count || 1;
              const pct = Math.round((f.count / maxVal) * 100);
              return (
                <div key={i} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[var(--text-primary)]">{f.name}</span>
                    <span className="text-[var(--text-secondary)] font-mono">{f.count} calls</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[var(--surface-secondary)] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[var(--button-primary-bg)] transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Most Used Languages */}
        <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-[var(--text-primary)]">Most Used Languages</h3>
              <p className="text-[11px] text-[var(--text-muted)]">Pakistani languages and vernacular scripts</p>
            </div>
            <button
              onClick={() => onNavigate('languages')}
              className="text-xs font-semibold text-[var(--accent)] hover:underline cursor-pointer"
            >
              Language Details
            </button>
          </div>

          <div className="space-y-3">
            {mostUsedLanguages.map((l, i) => {
              const maxVal = mostUsedLanguages[0]?.count || 1;
              const pct = Math.round((l.count / maxVal) * 100);
              return (
                <div key={i} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[var(--text-primary)]">{l.language}</span>
                    <span className="text-[var(--text-secondary)] font-mono">{l.count} requests</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[var(--surface-secondary)] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[var(--accent)] transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent User Activity Table */}
      <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-[var(--text-primary)]">Recent User Activity</h3>
            <p className="text-[11px] text-[var(--text-muted)]">Live incoming telemetry across the platform</p>
          </div>
          <button
            onClick={() => onNavigate('search-activity')}
            className="text-xs font-semibold text-[var(--accent)] hover:underline cursor-pointer"
          >
            View All Activity
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[var(--border)] text-[var(--text-muted)]">
                <th className="py-2.5 px-3 font-semibold uppercase tracking-wider">User</th>
                <th className="py-2.5 px-3 font-semibold uppercase tracking-wider">Type</th>
                <th className="py-2.5 px-3 font-semibold uppercase tracking-wider">Feature</th>
                <th className="py-2.5 px-3 font-semibold uppercase tracking-wider">Summary</th>
                <th className="py-2.5 px-3 font-semibold uppercase tracking-wider">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {recentActivity.map((act, i) => (
                <tr key={i} className="hover:bg-[var(--surface-secondary)]/50 transition-colors">
                  <td className="py-2.5 px-3">
                    <button
                      onClick={() => onSelectUserDetail(act.userId)}
                      className="text-left hover:underline cursor-pointer"
                    >
                      <div className="font-semibold text-[var(--text-primary)]">{act.userName}</div>
                      <div className="text-[11px] text-[var(--text-muted)] font-mono">{act.userEmail}</div>
                    </button>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[var(--surface-secondary)] text-[var(--text-secondary)] border border-[var(--border)]">
                      {act.type}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-medium text-[var(--text-primary)]">{act.feature}</td>
                  <td className="py-2.5 px-3 text-[var(--text-secondary)] max-w-xs truncate" title={act.summary}>
                    {act.summary}
                  </td>
                  <td className="py-2.5 px-3 text-[var(--text-muted)] whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[var(--text-muted)]" />
                      <span>{new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
