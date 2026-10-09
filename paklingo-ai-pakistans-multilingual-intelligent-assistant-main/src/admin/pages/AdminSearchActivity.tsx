/**
 * PakLingo AI - Administrative Global Search & Activity Audit Log
 * Global multi-entity search, live activity stream, and immutable administrator audit trail.
 */

import React, { useState, useEffect } from 'react';
import {
  Search,
  Activity,
  Shield,
  Clock,
  Filter,
  Users,
  MessageSquare,
  Languages,
  FileText,
  Eye,
  RefreshCw,
  AlertCircle,
  FileCode,
  Download,
} from 'lucide-react';
import { AdminAPI } from '../api';
import { AdminAuditLog, AppUserRecord, ConversationRecord, TranslationRecord, DocumentRecord } from '../types';

interface AdminSearchActivityProps {
  initialQuery?: string;
  onSelectUserDetail?: (userId: string) => void;
  onSelectConversation?: (convId: string) => void;
}

export const AdminSearchActivity: React.FC<AdminSearchActivityProps> = ({
  initialQuery = '',
  onSelectUserDetail,
  onSelectConversation,
}) => {
  const [activeTab, setActiveTab] = useState<'search' | 'audit' | 'activity'>('search');
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<{
    query: string;
    users: AppUserRecord[];
    conversations: ConversationRecord[];
    translations: TranslationRecord[];
    documents: DocumentRecord[];
    activities: any[];
    totalMatches: number;
  } | null>(null);

  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);
  const [isLoadingAudit, setIsLoadingAudit] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRunSearch = async (queryText: string) => {
    if (!queryText.trim()) return;
    setIsSearching(true);
    setError(null);
    try {
      const res = await AdminAPI.globalSearch(queryText.trim());
      setSearchResults(res);
    } catch (err: any) {
      setError(err.message || 'Search execution failed.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleRunSearch(searchQuery);
  };

  const loadAuditLogs = async () => {
    setIsLoadingAudit(true);
    try {
      const logs = await AdminAPI.getAuditLogs(60);
      setAuditLogs(logs);
    } catch (err: any) {
      setError(err.message || 'Failed to load audit trail.');
    } finally {
      setIsLoadingAudit(false);
    }
  };

  useEffect(() => {
    if (initialQuery) {
      setSearchQuery(initialQuery);
      handleRunSearch(initialQuery);
    }
  }, [initialQuery]);

  useEffect(() => {
    if (activeTab === 'audit') {
      loadAuditLogs();
    }
  }, [activeTab]);

  return (
    <div id="admin-search-activity-page" className="space-y-6">
      {/* Page Title & Mode Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[var(--border)]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)] flex items-center gap-2">
            <Activity className="w-6 h-6 text-[var(--accent)]" />
            <span>Search & Audit Activity</span>
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Deep multi-entity administrative search, telemetry records, and security audit trail
          </p>
        </div>

        {/* Tab Toggle Buttons */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)]">
          <button
            onClick={() => setActiveTab('search')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'search'
                ? 'bg-[var(--surface)] text-[var(--text-primary)] shadow-xs'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            Global Search
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'audit'
                ? 'bg-[var(--surface)] text-[var(--text-primary)] shadow-xs'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            Admin Audit Trail
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Mode 1: Global Administrative Search */}
      {activeTab === 'search' && (
        <div className="space-y-6">
          <form onSubmit={handleFormSubmit} className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xs">
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2">
              Cross-Entity Search
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Enter user name, email, keyword, NADRA, crop, FIR, medical term..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                />
              </div>
              <button
                type="submit"
                disabled={isSearching || !searchQuery.trim()}
                className="px-5 py-2.5 rounded-xl font-semibold text-xs bg-[var(--button-primary-bg)] text-[var(--button-primary-text)] hover:opacity-95 transition-all cursor-pointer shadow-xs disabled:opacity-50 shrink-0"
              >
                {isSearching ? 'Searching...' : 'Execute Search'}
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mt-3 text-[11px] text-[var(--text-muted)]">
              <span>Quick tests:</span>
              <button
                type="button"
                onClick={() => { setSearchQuery('NADRA'); handleRunSearch('NADRA'); }}
                className="hover:text-[var(--accent)] underline cursor-pointer"
              >
                NADRA
              </button>
              <button
                type="button"
                onClick={() => { setSearchQuery('wheat'); handleRunSearch('wheat'); }}
                className="hover:text-[var(--accent)] underline cursor-pointer"
              >
                wheat
              </button>
              <button
                type="button"
                onClick={() => { setSearchQuery('Urdu'); handleRunSearch('Urdu'); }}
                className="hover:text-[var(--accent)] underline cursor-pointer"
              >
                Urdu
              </button>
              <button
                type="button"
                onClick={() => { setSearchQuery('tariq'); handleRunSearch('tariq'); }}
                className="hover:text-[var(--accent)] underline cursor-pointer"
              >
                tariq
              </button>
            </div>
          </form>

          {/* Search Results Display */}
          {searchResults && (
            <div className="space-y-5">
              <div className="text-xs text-[var(--text-secondary)] font-medium">
                Found <span className="font-bold text-[var(--text-primary)]">{searchResults.totalMatches} matches</span> for "{searchResults.query}":
              </div>

              {/* Matching Users */}
              {searchResults.users.length > 0 && (
                <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xs">
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[var(--border)] text-xs font-bold text-[var(--text-primary)]">
                    <Users className="w-4 h-4 text-[var(--accent)]" />
                    <span>Matching Users ({searchResults.users.length})</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {searchResults.users.map((u) => (
                      <div
                        key={u.id}
                        onClick={() => onSelectUserDetail && onSelectUserDetail(u.id)}
                        className="p-3 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] hover:border-[var(--accent)] transition-colors cursor-pointer text-xs space-y-1"
                      >
                        <div className="font-bold text-[var(--text-primary)]">{u.name}</div>
                        <div className="text-[11px] text-[var(--text-muted)] truncate">{u.email}</div>
                        <div className="text-[10px] text-[var(--text-muted)] font-mono">ID: {u.id}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Matching Conversations */}
              {searchResults.conversations.length > 0 && (
                <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xs">
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[var(--border)] text-xs font-bold text-[var(--text-primary)]">
                    <MessageSquare className="w-4 h-4 text-[var(--accent)]" />
                    <span>Matching Conversations ({searchResults.conversations.length})</span>
                  </div>
                  <div className="space-y-2">
                    {searchResults.conversations.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => onSelectConversation && onSelectConversation(c.id)}
                        className="p-3 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] hover:border-[var(--accent)] transition-colors cursor-pointer text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <div className="font-semibold text-[var(--text-primary)]">{c.title}</div>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-[var(--surface)] border border-[var(--border)] text-[var(--text-muted)]">
                            {c.category}
                          </span>
                        </div>
                        <div className="text-[11px] text-[var(--text-muted)] mt-1">
                          By {c.userName} • {c.messageCount} messages • Lang: {c.language.toUpperCase()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Matching Translations */}
              {searchResults.translations.length > 0 && (
                <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xs">
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[var(--border)] text-xs font-bold text-[var(--text-primary)]">
                    <Languages className="w-4 h-4 text-[var(--accent)]" />
                    <span>Matching Translations ({searchResults.translations.length})</span>
                  </div>
                  <div className="space-y-2">
                    {searchResults.translations.map((tr) => (
                      <div key={tr.id} className="p-3 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] text-xs space-y-1">
                        <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)]">
                          <span className="font-semibold uppercase text-[var(--text-primary)]">{tr.sourceLang} → {tr.targetLang}</span>
                          <span>{tr.userName}</span>
                        </div>
                        <p className="italic text-[var(--text-secondary)]">"{tr.sourceTextSnippet}"</p>
                        <p className="font-medium text-[var(--text-primary)]">→ "{tr.translatedSnippet}"</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Matching Documents */}
              {searchResults.documents.length > 0 && (
                <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xs">
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[var(--border)] text-xs font-bold text-[var(--text-primary)]">
                    <FileText className="w-4 h-4 text-[var(--accent)]" />
                    <span>Matching Document Records ({searchResults.documents.length})</span>
                  </div>
                  <div className="space-y-2">
                    {searchResults.documents.map((doc) => (
                      <div key={doc.id} className="p-3 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-[var(--text-primary)]">{doc.fileName}</span>
                          <span className="text-[10px] text-[var(--text-muted)]">{doc.processingStatus}</span>
                        </div>
                        <p className="text-[var(--text-secondary)]">{doc.summary}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {searchResults.totalMatches === 0 && (
                <div className="p-8 rounded-2xl bg-[var(--surface)] border border-[var(--border)] text-center text-xs text-[var(--text-muted)]">
                  No matching records found for "{searchResults.query}". Try searching with different keywords.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Mode 2: Admin Audit Trail */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[var(--text-primary)]">Security Audit Trail</h3>
              <p className="text-[11px] text-[var(--text-muted)]">
                Immutable record of administrative actions, policy adjustments, and data exports
              </p>
            </div>
            <button
              onClick={loadAuditLogs}
              disabled={isLoadingAudit}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--button-primary-bg)] text-[var(--button-primary-text)] text-xs font-semibold hover:opacity-95 transition-all cursor-pointer shadow-xs disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingAudit ? 'animate-spin' : ''}`} />
              <span>Refresh Logs</span>
            </button>
          </div>

          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--surface-secondary)]/50 text-[var(--text-muted)]">
                    <th className="py-3 px-3.5 font-semibold uppercase tracking-wider">Timestamp</th>
                    <th className="py-3 px-3.5 font-semibold uppercase tracking-wider">Admin Officer</th>
                    <th className="py-3 px-3.5 font-semibold uppercase tracking-wider">Action Type</th>
                    <th className="py-3 px-3.5 font-semibold uppercase tracking-wider">Target</th>
                    <th className="py-3 px-3.5 font-semibold uppercase tracking-wider">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-[var(--text-muted)]">
                        {isLoadingAudit ? 'Loading audit trail...' : 'No audit log entries recorded.'}
                      </td>
                    </tr>
                  ) : (
                    auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-[var(--surface-secondary)]/30 transition-colors">
                        <td className="py-2.5 px-3.5 text-[var(--text-muted)] whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </td>
                        <td className="py-2.5 px-3.5 font-semibold text-[var(--text-primary)] font-mono">
                          {log.adminEmail}
                        </td>
                        <td className="py-2.5 px-3.5">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[var(--surface-secondary)] border border-[var(--border)] text-[var(--accent)]">
                            {log.action}
                          </span>
                        </td>
                        <td className="py-2.5 px-3.5 text-[var(--text-secondary)]">
                          {log.targetType} {log.targetId ? `(${log.targetId})` : ''}
                        </td>
                        <td className="py-2.5 px-3.5 text-[var(--text-primary)] max-w-sm truncate" title={log.details}>
                          {log.details}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
