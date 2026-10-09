/**
 * PakLingo AI - Administrative Usage & Feature Analytics
 * Detailed analytics on searched topics, feature distribution, daily request timeline, and latency.
 */

import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Search,
  Languages,
  MessageSquare,
  Volume2,
  FileText,
  Clock,
  RefreshCw,
  Calendar,
  AlertCircle,
  Zap,
} from 'lucide-react';
import { AdminAPI } from '../api';
import { AnalyticsData } from '../types';

export const AdminAnalytics: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [timeframe, setTimeframe] = useState<'day' | 'week' | 'month' | 'all'>('week');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAnalytics = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await AdminAPI.getAnalytics(timeframe);
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load analytics.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [timeframe]);

  if (isLoading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <RefreshCw className="w-8 h-8 text-[var(--accent)] animate-spin" />
        <p className="text-xs text-[var(--text-secondary)] font-medium">Computing analytics aggregates...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs flex items-center gap-3">
        <AlertCircle className="w-5 h-5 shrink-0" />
        <span>{error || 'Analytics not available.'}</span>
      </div>
    );
  }

  const { mostSearchedTopics, featureUsageStats, activityTimeline, summary } = data;

  return (
    <div id="admin-analytics-page" className="space-y-6">
      {/* Header & Timeframe Picker */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[var(--border)]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)] flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-[var(--accent)]" />
            <span>Usage & Feature Analytics</span>
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            System throughput, frequent search categories, feature engagement, and latency indicators
          </p>
        </div>

        {/* Timeframe Selector */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 p-1 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] text-xs font-semibold">
            {(['day', 'week', 'month', 'all'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTimeframe(t)}
                className={`px-3 py-1 rounded-lg capitalize transition-colors cursor-pointer ${
                  timeframe === t
                    ? 'bg-[var(--surface)] text-[var(--text-primary)] shadow-xs'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                {t === 'day' ? '24 Hours' : t === 'week' ? '7 Days' : t === 'month' ? '30 Days' : 'All Time'}
              </button>
            ))}
          </div>

          <button
            onClick={loadAnalytics}
            disabled={isLoading}
            className="p-2 rounded-xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--accent)] text-[var(--text-primary)] cursor-pointer"
            title="Refresh analytics"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Summary Stat Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xs">
          <div className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Total Queries</div>
          <div className="text-2xl font-black text-[var(--text-primary)] mt-1">{summary.totalQueries.toLocaleString()}</div>
          <div className="text-[11px] text-[var(--text-muted)] mt-1">Across all models</div>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xs">
          <div className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Avg Latency</div>
          <div className="text-2xl font-black text-[var(--accent)] mt-1">{summary.averageResponseTimeMs} ms</div>
          <div className="text-[11px] text-emerald-500 font-medium mt-1">Optimal response tier</div>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xs">
          <div className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Cache Hit Rate</div>
          <div className="text-2xl font-black text-[var(--text-primary)] mt-1">{summary.cacheHitRate}</div>
          <div className="text-[11px] text-[var(--text-muted)] mt-1">LRU server cache</div>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xs">
          <div className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">API Success Rate</div>
          <div className="text-2xl font-black text-emerald-500 mt-1">{summary.successRate}</div>
          <div className="text-[11px] text-[var(--text-muted)] mt-1">Zero 5xx outages</div>
        </div>
      </div>

      {/* Activity Timeline Chart (Interactive SVG) */}
      <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-[var(--text-primary)]">Daily Activity Velocity</h3>
            <p className="text-[11px] text-[var(--text-muted)]">Citizen query volume over the selected timeframe</p>
          </div>
          <div className="flex items-center gap-3 text-[11px]">
            <span className="flex items-center gap-1 text-[var(--text-secondary)]">
              <span className="w-2.5 h-2.5 rounded-full bg-[var(--accent)]" />
              <span>AI Queries</span>
            </span>
            <span className="flex items-center gap-1 text-[var(--text-secondary)]">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>Active Users</span>
            </span>
          </div>
        </div>

        {/* Scalable Bar Visualizer */}
        <div className="h-44 flex items-end justify-between gap-2 pt-4 px-2 border-b border-[var(--border)]">
          {activityTimeline.map((item, idx) => {
            const maxReq = Math.max(...activityTimeline.map((d) => d.requests), 1);
            const heightPercent = Math.max(12, Math.round((item.requests / maxReq) * 100));

            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                <div className="text-[10px] text-[var(--text-muted)] font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                  {item.requests}
                </div>
                <div className="w-full max-w-[36px] bg-[var(--surface-secondary)] rounded-t-lg overflow-hidden flex flex-col justify-end h-full">
                  <div
                    className="w-full bg-[var(--button-primary-bg)] rounded-t-lg transition-all duration-300 group-hover:brightness-110"
                    style={{ height: `${heightPercent}%` }}
                  />
                </div>
                <div className="text-[10px] text-[var(--text-muted)] font-medium truncate w-full text-center">
                  {item.date}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Two Column Breakdown: Top Search Topics & Feature Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Most Searched Topics */}
        <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xs">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-[var(--border)]">
            <Search className="w-4 h-4 text-[var(--accent)]" />
            <h3 className="text-sm font-bold text-[var(--text-primary)]">Frequent Citizen Queries</h3>
          </div>

          <div className="space-y-3">
            {mostSearchedTopics.map((topic, i) => (
              <div
                key={i}
                className="p-3 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] flex items-center justify-between gap-3 text-xs"
              >
                <div className="min-w-0">
                  <div className="font-semibold text-[var(--text-primary)] truncate">{topic.topic}</div>
                  <div className="text-[10px] text-[var(--text-muted)]">Category: {topic.category}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-bold text-[var(--text-primary)] font-mono">{topic.count} searches</div>
                  <span className="text-[10px] text-emerald-500 font-medium">High civic relevance</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Feature Usage Trends */}
        <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xs">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-[var(--border)]">
            <Zap className="w-4 h-4 text-[var(--accent)]" />
            <h3 className="text-sm font-bold text-[var(--text-primary)]">Module Breakdown & Trajectory</h3>
          </div>

          <div className="space-y-3">
            {featureUsageStats.map((feat, i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[var(--text-primary)]">{feat.feature}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[var(--text-secondary)] font-mono">{feat.count} calls ({feat.percentage}%)</span>
                    <span className="text-[10px] font-bold text-emerald-500 font-mono">{feat.trend}</span>
                  </div>
                </div>
                <div className="w-full h-2 rounded-full bg-[var(--surface-secondary)] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[var(--accent)] transition-all duration-500"
                    style={{ width: `${feat.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
