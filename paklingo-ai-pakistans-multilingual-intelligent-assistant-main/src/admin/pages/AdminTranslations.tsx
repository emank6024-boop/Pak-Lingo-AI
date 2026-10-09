/**
 * PakLingo AI - Administrative Translation Records
 * Oversight of translation pairs, vernacular conversion queries, and translation tool usage.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Languages,
  Search,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Clock,
  ArrowRight,
  AlertCircle,
  Copy,
  Check,
} from 'lucide-react';
import { AdminAPI } from '../api';
import { TranslationRecord, Pagination } from '../types';

interface AdminTranslationsProps {
  onSelectUserDetail?: (userId: string) => void;
}

export const AdminTranslations: React.FC<AdminTranslationsProps> = ({ onSelectUserDetail }) => {
  const [translations, setTranslations] = useState<TranslationRecord[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sourceLang, setSourceLang] = useState('all');
  const [targetLang, setTargetLang] = useState('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadTranslations = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await AdminAPI.getTranslations({
        search: search.trim() || undefined,
        sourceLang: sourceLang !== 'all' ? sourceLang : undefined,
        targetLang: targetLang !== 'all' ? targetLang : undefined,
        page: pagination.page,
        limit: pagination.limit,
      });
      setTranslations(res.translations);
      setPagination(res.pagination);
    } catch (err: any) {
      setError(err.message || 'Failed to load translation records.');
    } finally {
      setIsLoading(false);
    }
  }, [search, sourceLang, targetLang, pagination.page, pagination.limit]);

  useEffect(() => {
    loadTranslations();
  }, [loadTranslations]);

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div id="admin-translations-page" className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[var(--border)]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)] flex items-center gap-2">
            <Languages className="w-6 h-6 text-[var(--accent)]" />
            <span>Translation Records</span>
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Audit translation history, multi-dialect conversions, and character volume
          </p>
        </div>

        <button
          onClick={loadTranslations}
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

      {/* Filter and Search */}
      <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search text snippets, users..."
            className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
          />
        </div>

        <div>
          <select
            value={sourceLang}
            onChange={(e) => setSourceLang(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] text-xs text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] cursor-pointer"
          >
            <option value="all">All Source Languages</option>
            <option value="English">English</option>
            <option value="Urdu">Urdu (اردو)</option>
            <option value="Punjabi">Punjabi (پنجابی)</option>
            <option value="Pashto">Pashto (پښتو)</option>
            <option value="Sindhi">Sindhi (سنڌي)</option>
            <option value="Balochi">Balochi (بلوچی)</option>
          </select>
        </div>

        <div>
          <select
            value={targetLang}
            onChange={(e) => setTargetLang(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] text-xs text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] cursor-pointer"
          >
            <option value="all">All Target Languages</option>
            <option value="Urdu">Urdu (اردو)</option>
            <option value="English">English</option>
            <option value="Punjabi">Punjabi (پنجابی)</option>
            <option value="Pashto">Pashto (پښتو)</option>
            <option value="Sindhi">Sindhi (سنڌي)</option>
            <option value="Balochi">Balochi (بلوچی)</option>
          </select>
        </div>
      </div>

      {/* Translations Table */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--surface-secondary)]/50 text-[var(--text-muted)]">
                <th className="py-3 px-3.5 font-semibold uppercase tracking-wider">Language Pair</th>
                <th className="py-3 px-3.5 font-semibold uppercase tracking-wider">User</th>
                <th className="py-3 px-3.5 font-semibold uppercase tracking-wider">Tool Origin</th>
                <th className="py-3 px-3.5 font-semibold uppercase tracking-wider">Source Snippet</th>
                <th className="py-3 px-3.5 font-semibold uppercase tracking-wider">Translated Snippet</th>
                <th className="py-3 px-3.5 font-semibold uppercase tracking-wider">Length</th>
                <th className="py-3 px-3.5 font-semibold uppercase tracking-wider">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {translations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[var(--text-muted)]">
                    {isLoading ? 'Loading translation records...' : 'No translations found.'}
                  </td>
                </tr>
              ) : (
                translations.map((tr) => (
                  <tr key={tr.id} className="hover:bg-[var(--surface-secondary)]/40 transition-colors">
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--surface-secondary)] border border-[var(--border)] font-bold text-xs text-[var(--text-primary)]">
                        <span>{tr.sourceLang}</span>
                        <ArrowRight className="w-3 h-3 text-[var(--accent)]" />
                        <span>{tr.targetLang}</span>
                      </div>
                    </td>

                    <td className="py-3 px-3.5">
                      {onSelectUserDetail ? (
                        <button
                          onClick={() => onSelectUserDetail(tr.userId)}
                          className="text-left hover:underline cursor-pointer"
                        >
                          <div className="font-semibold text-[var(--text-primary)]">{tr.userName}</div>
                          <div className="text-[11px] text-[var(--text-muted)]">{tr.userEmail}</div>
                        </button>
                      ) : (
                        <div>
                          <div className="font-semibold text-[var(--text-primary)]">{tr.userName}</div>
                          <div className="text-[11px] text-[var(--text-muted)]">{tr.userEmail}</div>
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-3.5">
                      <span className="px-2 py-0.5 rounded-md bg-[var(--surface-secondary)] border border-[var(--border)] text-[11px] text-[var(--text-secondary)]">
                        {tr.tool}
                      </span>
                    </td>

                    <td className="py-3 px-3.5 max-w-xs truncate text-[var(--text-secondary)]" title={tr.sourceTextSnippet}>
                      "{tr.sourceTextSnippet}"
                    </td>

                    <td className="py-3 px-3.5 max-w-xs truncate font-medium text-[var(--text-primary)]" title={tr.translatedSnippet}>
                      "{tr.translatedSnippet}"
                    </td>

                    <td className="py-3 px-3.5 text-[var(--text-muted)] font-mono">
                      {tr.charCount} chars
                    </td>

                    <td className="py-3 px-3.5 text-[var(--text-muted)] whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(tr.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-[var(--border)] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[var(--text-secondary)]">
          <div>
            Showing <span className="font-semibold text-[var(--text-primary)]">{translations.length}</span> of{' '}
            <span className="font-semibold text-[var(--text-primary)]">{pagination.total}</span> records
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPagination((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
              disabled={pagination.page <= 1 || isLoading}
              className="p-1.5 rounded-lg bg-[var(--surface-secondary)] border border-[var(--border)] disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-medium px-2">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              onClick={() => setPagination((prev) => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
              disabled={pagination.page >= pagination.totalPages || isLoading}
              className="p-1.5 rounded-lg bg-[var(--surface-secondary)] border border-[var(--border)] disabled:opacity-40 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
