/**
 * PakLingo AI - Administrative Pakistani Language Analytics
 * Distribution of regional languages: Urdu, Punjabi, Pashto, Sindhi, Balochi, Saraiki, English, etc.
 */

import React, { useState, useEffect } from 'react';
import { Globe, Languages, ArrowRight, RefreshCw, AlertCircle, BarChart2 } from 'lucide-react';
import { AdminAPI } from '../api';
import { AnalyticsData } from '../types';

export const AdminLanguages: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLanguages = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await AdminAPI.getAnalytics('all');
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load language metrics.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLanguages();
  }, []);

  const languagePairs = [
    { from: 'English', to: 'Urdu (اردو)', count: 3410, share: 41 },
    { from: 'Urdu (اردو)', to: 'English', count: 2120, share: 26 },
    { from: 'English', to: 'Punjabi (پنجابی)', count: 980, share: 12 },
    { from: 'English', to: 'Pashto (پښتو)', count: 740, share: 9 },
    { from: 'English', to: 'Sindhi (سنڌي)', count: 580, share: 7 },
    { from: 'English', to: 'Balochi (بلوچی)', count: 320, share: 4 },
    { from: 'Roman Urdu', to: 'Nastaliq Urdu', count: 290, share: 3.5 },
  ];

  if (isLoading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <RefreshCw className="w-8 h-8 text-[var(--accent)] animate-spin" />
        <p className="text-xs text-[var(--text-secondary)] font-medium">Computing language distribution...</p>
      </div>
    );
  }

  return (
    <div id="admin-languages-page" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[var(--border)]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)] flex items-center gap-2">
            <Globe className="w-6 h-6 text-[var(--accent)]" />
            <span>Pakistani Language Analytics</span>
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Vernacular query adoption, regional dialect distribution, and translation routing
          </p>
        </div>

        <button
          onClick={loadLanguages}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--button-primary-bg)] text-[var(--button-primary-text)] text-xs font-semibold hover:opacity-95 transition-all cursor-pointer shadow-xs disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Language Share Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {data?.languageUsageStats.map((lang) => (
          <div
            key={lang.code}
            className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-[var(--text-primary)]">{lang.name}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--surface-secondary)] border border-[var(--border)] uppercase font-semibold text-[var(--text-muted)]">
                  {lang.code}
                </span>
              </div>
              <div className="text-xl font-bold text-[var(--accent)] mt-0.5">{lang.native}</div>
            </div>

            <div className="mt-4 pt-3 border-t border-[var(--border)] space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[var(--text-muted)]">Share of Total</span>
                <span className="font-bold text-[var(--text-primary)] font-mono">{lang.share}%</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-[var(--surface-secondary)] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[var(--button-primary-bg)]"
                  style={{ width: `${lang.share}%` }}
                />
              </div>
              <div className="text-[10px] text-[var(--text-muted)]">
                {lang.requestCount.toLocaleString()} citizen requests
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Language Pairs Table & Deep Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Popular Language Translation Pairs */}
        <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xs">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-[var(--border)]">
            <Languages className="w-4 h-4 text-[var(--accent)]" />
            <h3 className="text-sm font-bold text-[var(--text-primary)]">Most Frequent Translation Corridors</h3>
          </div>

          <div className="space-y-3">
            {languagePairs.map((pair, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-2 font-semibold text-[var(--text-primary)]">
                  <span>{pair.from}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[var(--accent)]" />
                  <span>{pair.to}</span>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold text-[var(--text-primary)]">{pair.count.toLocaleString()} queries</div>
                  <div className="text-[10px] text-[var(--text-muted)]">{pair.share}% volume</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Vernacular Voice & Audio Telemetry */}
        <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-[var(--border)]">
            <BarChart2 className="w-4 h-4 text-[var(--accent)]" />
            <h3 className="text-sm font-bold text-[var(--text-primary)]">Acoustic & Script Observations</h3>
          </div>

          <div className="space-y-3 text-xs text-[var(--text-secondary)]">
            <div className="p-3.5 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)]">
              <div className="font-bold text-[var(--text-primary)] mb-1">Nastaliq Urdu Prevalence</div>
              <p className="leading-relaxed">
                67% of citizen queries utilize native Nastaliq script for Nadra, Land Records, and Health diagnostics.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)]">
              <div className="font-bold text-[var(--text-primary)] mb-1">Roman Urdu Conversational Input</div>
              <p className="leading-relaxed">
                22% of youth and mobile users submit prompt queries in phonetic Roman Urdu (e.g. "mera cnic expire ho gaya hai"). The dual-pass normalizer converts these transparently to formal legal Urdu.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)]">
              <div className="font-bold text-[var(--text-primary)] mb-1">Regional Provincial Dialects</div>
              <p className="leading-relaxed">
                Punjabi (Shahmukhi) and Pashto show highest adoption in agricultural advisory and legal deed explanations.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
