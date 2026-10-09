/**
 * PakLingo AI - Administrative Conversations Viewer
 * Audit conversation transcripts, view message counts, filter by language/category, and search dialogs.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  MessageSquare,
  Search,
  Filter,
  RefreshCw,
  Eye,
  User,
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  X,
  Copy,
  Check,
  AlertCircle,
  Bot,
} from 'lucide-react';
import { AdminAPI } from '../api';
import { ConversationRecord, Pagination } from '../types';

interface AdminConversationsProps {
  onSelectUserDetail?: (userId: string) => void;
}

export const AdminConversations: React.FC<AdminConversationsProps> = ({ onSelectUserDetail }) => {
  const [conversations, setConversations] = useState<ConversationRecord[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 12, total: 0, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [languageFilter, setLanguageFilter] = useState('all');
  const [selectedConv, setSelectedConv] = useState<ConversationRecord | null>(null);
  const [copiedId, setCopiedId] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadConversations = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await AdminAPI.getConversations({
        search: search.trim() || undefined,
        category: categoryFilter,
        language: languageFilter,
        page: pagination.page,
        limit: pagination.limit,
      });
      setConversations(res.conversations);
      setPagination(res.pagination);
    } catch (err: any) {
      setError(err.message || 'Failed to load conversations.');
    } finally {
      setIsLoading(false);
    }
  }, [search, categoryFilter, languageFilter, pagination.page, pagination.limit]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const handleCopyTranscript = () => {
    if (!selectedConv) return;
    const text = selectedConv.messages
      .map((m) => `[${m.sender.toUpperCase()} - ${new Date(m.timestamp).toLocaleTimeString()}]:\n${m.text}\n`)
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  return (
    <div id="admin-conversations-page" className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[var(--border)]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)] flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-[var(--accent)]" />
            <span>Conversation Records</span>
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Admin oversight of citizen inquiries, civic guidance, and assistant dialogs
          </p>
        </div>

        <button
          onClick={loadConversations}
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

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search transcript, title, user..."
            className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
          />
        </div>

        <div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] text-xs text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] cursor-pointer"
          >
            <option value="all">All Service Categories</option>
            <option value="Civic Services">Civic Services</option>
            <option value="Agriculture">Agriculture</option>
            <option value="Legal Guidance">Legal Guidance</option>
            <option value="Education">Education</option>
            <option value="Medical Assistance">Medical Assistance</option>
            <option value="General Query">General Query</option>
          </select>
        </div>

        <div>
          <select
            value={languageFilter}
            onChange={(e) => setLanguageFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] text-xs text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] cursor-pointer"
          >
            <option value="all">All Languages</option>
            <option value="ur">Urdu (اردو)</option>
            <option value="en">English</option>
            <option value="pa">Punjabi</option>
            <option value="ps">Pashto</option>
            <option value="sd">Sindhi</option>
            <option value="bal">Balochi</option>
          </select>
        </div>
      </div>

      {/* Conversations Grid & Table */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--surface-secondary)]/50 text-[var(--text-muted)]">
                <th className="py-3 px-3.5 font-semibold uppercase tracking-wider">Conversation Title</th>
                <th className="py-3 px-3.5 font-semibold uppercase tracking-wider">Citizen / User</th>
                <th className="py-3 px-3.5 font-semibold uppercase tracking-wider">Category</th>
                <th className="py-3 px-3.5 font-semibold uppercase tracking-wider">Language</th>
                <th className="py-3 px-3.5 font-semibold uppercase tracking-wider">Messages</th>
                <th className="py-3 px-3.5 font-semibold uppercase tracking-wider">Timestamp</th>
                <th className="py-3 px-3.5 font-semibold uppercase tracking-wider text-right">View Transcript</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {conversations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[var(--text-muted)]">
                    {isLoading ? 'Loading conversation records...' : 'No conversations match the selected filters.'}
                  </td>
                </tr>
              ) : (
                conversations.map((c) => (
                  <tr key={c.id} className="hover:bg-[var(--surface-secondary)]/40 transition-colors">
                    <td className="py-3 px-3.5">
                      <div className="font-semibold text-[var(--text-primary)] max-w-xs truncate" title={c.title}>
                        {c.title}
                      </div>
                      <div className="text-[10px] font-mono text-[var(--text-muted)]">ID: {c.id}</div>
                    </td>

                    <td className="py-3 px-3.5">
                      {onSelectUserDetail ? (
                        <button
                          onClick={() => onSelectUserDetail(c.userId)}
                          className="text-left hover:underline cursor-pointer"
                        >
                          <div className="font-semibold text-[var(--text-primary)]">{c.userName}</div>
                          <div className="text-[11px] text-[var(--text-muted)]">{c.userEmail}</div>
                        </button>
                      ) : (
                        <div>
                          <div className="font-semibold text-[var(--text-primary)]">{c.userName}</div>
                          <div className="text-[11px] text-[var(--text-muted)]">{c.userEmail}</div>
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-3.5">
                      <span className="px-2 py-0.5 rounded-md bg-[var(--surface-secondary)] border border-[var(--border)] text-[11px] text-[var(--text-primary)] font-medium">
                        {c.category}
                      </span>
                    </td>

                    <td className="py-3 px-3.5">
                      <span className="font-semibold text-[var(--text-primary)] uppercase">{c.language}</span>
                    </td>

                    <td className="py-3 px-3.5">
                      <span className="font-mono text-xs text-[var(--text-primary)]">{c.messageCount} msgs</span>
                    </td>

                    <td className="py-3 px-3.5 text-[var(--text-secondary)] whitespace-nowrap">
                      {new Date(c.updatedAt).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>

                    <td className="py-3 px-3.5 text-right whitespace-nowrap">
                      <button
                        onClick={() => setSelectedConv(c)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--surface-secondary)] hover:bg-[var(--surface-secondary)]/80 text-[var(--text-primary)] border border-[var(--border)] transition-colors cursor-pointer text-xs font-semibold"
                      >
                        <Eye className="w-3.5 h-3.5 text-[var(--accent)]" />
                        <span>Inspect</span>
                      </button>
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
            Showing <span className="font-semibold text-[var(--text-primary)]">{conversations.length}</span> of{' '}
            <span className="font-semibold text-[var(--text-primary)]">{pagination.total}</span> conversations
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

      {/* Full Conversation Transcript Modal */}
      {selectedConv && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-3xl max-h-[85vh] bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-[var(--border)] flex items-center justify-between bg-[var(--surface-secondary)]/50">
              <div className="min-w-0 pr-4">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-[var(--surface)] border border-[var(--border)] text-[10px] uppercase font-bold text-[var(--accent)]">
                    {selectedConv.category}
                  </span>
                  <span className="text-xs text-[var(--text-muted)] uppercase font-mono">
                    Lang: {selectedConv.language}
                  </span>
                </div>
                <h2 className="text-base font-bold text-[var(--text-primary)] truncate mt-1">
                  {selectedConv.title}
                </h2>
                <div className="text-xs text-[var(--text-muted)]">
                  Citizen: <span className="font-semibold text-[var(--text-primary)]">{selectedConv.userName}</span> ({selectedConv.userEmail})
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleCopyTranscript}
                  className="p-2 rounded-xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--accent)] text-xs text-[var(--text-primary)] flex items-center gap-1.5 cursor-pointer transition-colors"
                  title="Copy complete transcript to clipboard"
                >
                  {copiedId ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  <span className="hidden sm:inline">{copiedId ? 'Copied' : 'Copy'}</span>
                </button>

                <button
                  onClick={() => setSelectedConv(null)}
                  className="p-2 rounded-xl bg-[var(--surface)] border border-[var(--border)] hover:bg-rose-500/10 hover:text-rose-500 text-[var(--text-muted)] transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Transcript Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {selectedConv.messages.map((msg, i) => {
                const isUser = msg.sender === 'user';
                return (
                  <div
                    key={i}
                    className={`flex items-start gap-3 ${isUser ? 'flex-row' : 'flex-row-reverse'}`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full border flex items-center justify-center shrink-0 ${
                        isUser
                          ? 'bg-[var(--surface-secondary)] border-[var(--border)] text-[var(--text-primary)]'
                          : 'bg-[var(--accent)]/10 border-[var(--accent)]/30 text-[var(--accent)]'
                      }`}
                    >
                      {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </div>

                    <div
                      className={`max-w-[80%] rounded-2xl p-4 text-xs space-y-1.5 ${
                        isUser
                          ? 'bg-[var(--surface-secondary)] border border-[var(--border)] text-[var(--text-primary)]'
                          : 'bg-[var(--surface)] border border-[var(--accent)]/40 text-[var(--text-primary)] shadow-sm'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-4 text-[10px] text-[var(--text-muted)] pb-1 border-b border-[var(--border)]/50">
                        <span className="font-bold uppercase tracking-wider">
                          {isUser ? selectedConv.userName : 'PakLingo Assistant'}
                        </span>
                        <span>
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="whitespace-pre-wrap leading-relaxed text-sm">{msg.text}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t border-[var(--border)] bg-[var(--surface-secondary)]/30 flex items-center justify-between text-xs text-[var(--text-muted)]">
              <div>Total Messages: <span className="font-semibold text-[var(--text-primary)]">{selectedConv.messages.length}</span></div>
              <button
                onClick={() => setSelectedConv(null)}
                className="px-4 py-1.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-xs font-semibold text-[var(--text-primary)] hover:border-[var(--accent)] cursor-pointer"
              >
                Close Transcript
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
