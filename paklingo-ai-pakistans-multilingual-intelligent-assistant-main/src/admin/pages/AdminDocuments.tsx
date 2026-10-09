/**
 * PakLingo AI - Administrative Document Intelligence Records
 * Audit of OCR document analyses, government forms, utility bills, and medical reports.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  Search,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileCheck,
} from 'lucide-react';
import { AdminAPI } from '../api';
import { DocumentRecord, Pagination } from '../types';

interface AdminDocumentsProps {
  onSelectUserDetail?: (userId: string) => void;
}

export const AdminDocuments: React.FC<AdminDocumentsProps> = ({ onSelectUserDetail }) => {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [featureFilter, setFeatureFilter] = useState('all');
  const [error, setError] = useState<string | null>(null);

  const loadDocuments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await AdminAPI.getDocuments({
        search: search.trim() || undefined,
        status: statusFilter,
        feature: featureFilter,
        page: pagination.page,
        limit: pagination.limit,
      });
      setDocuments(res.documents);
      setPagination(res.pagination);
    } catch (err: any) {
      setError(err.message || 'Failed to load document records.');
    } finally {
      setIsLoading(false);
    }
  }, [search, statusFilter, featureFilter, pagination.page, pagination.limit]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  return (
    <div id="admin-documents-page" className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[var(--border)]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)] flex items-center gap-2">
            <FileText className="w-6 h-6 text-[var(--accent)]" />
            <span>Document Processing Records</span>
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Oversight of citizen bill explanations, legal affidavits, and diagnostic OCR files
          </p>
        </div>

        <button
          onClick={loadDocuments}
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

      {/* Filters */}
      <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search filename, summary, user..."
            className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
          />
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] text-xs text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] cursor-pointer"
          >
            <option value="all">All Processing Statuses</option>
            <option value="completed">Completed Successfully</option>
            <option value="processing">Processing In-Progress</option>
            <option value="failed">Failed / Unrecognized</option>
          </select>
        </div>

        <div>
          <select
            value={featureFilter}
            onChange={(e) => setFeatureFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] text-xs text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] cursor-pointer"
          >
            <option value="all">All Document Modules</option>
            <option value="OCR Document Intelligence">OCR Document Intelligence</option>
            <option value="Government Assistant">Government Assistant</option>
            <option value="Medical Assistant">Medical Assistant</option>
            <option value="Legal Assistant">Legal Assistant</option>
          </select>
        </div>
      </div>

      {/* Documents Table */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--surface-secondary)]/50 text-[var(--text-muted)]">
                <th className="py-3 px-3.5 font-semibold uppercase tracking-wider">Document Name</th>
                <th className="py-3 px-3.5 font-semibold uppercase tracking-wider">User</th>
                <th className="py-3 px-3.5 font-semibold uppercase tracking-wider">Module</th>
                <th className="py-3 px-3.5 font-semibold uppercase tracking-wider">Status</th>
                <th className="py-3 px-3.5 font-semibold uppercase tracking-wider">Extracted Overview</th>
                <th className="py-3 px-3.5 font-semibold uppercase tracking-wider">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {documents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[var(--text-muted)]">
                    {isLoading ? 'Loading document records...' : 'No document records match the criteria.'}
                  </td>
                </tr>
              ) : (
                documents.map((doc) => {
                  const isDone = doc.processingStatus === 'completed';
                  return (
                    <tr key={doc.id} className="hover:bg-[var(--surface-secondary)]/40 transition-colors">
                      <td className="py-3 px-3.5">
                        <div className="flex items-center gap-2 font-semibold text-[var(--text-primary)]">
                          <FileCheck className="w-4 h-4 text-[var(--accent)] shrink-0" />
                          <span className="truncate max-w-[200px]" title={doc.fileName}>{doc.fileName}</span>
                        </div>
                        <div className="text-[10px] text-[var(--text-muted)] font-mono">
                          {doc.fileSize} • {doc.mimeType}
                        </div>
                      </td>

                      <td className="py-3 px-3.5">
                        {onSelectUserDetail ? (
                          <button
                            onClick={() => onSelectUserDetail(doc.userId)}
                            className="text-left hover:underline cursor-pointer"
                          >
                            <div className="font-semibold text-[var(--text-primary)]">{doc.userName}</div>
                            <div className="text-[11px] text-[var(--text-muted)]">{doc.userEmail}</div>
                          </button>
                        ) : (
                          <div>
                            <div className="font-semibold text-[var(--text-primary)]">{doc.userName}</div>
                            <div className="text-[11px] text-[var(--text-muted)]">{doc.userEmail}</div>
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-3.5">
                        <span className="px-2 py-0.5 rounded-md bg-[var(--surface-secondary)] border border-[var(--border)] text-[11px] text-[var(--text-primary)] font-medium">
                          {doc.feature}
                        </span>
                      </td>

                      <td className="py-3 px-3.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            isDone
                              ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30'
                              : 'bg-amber-500/10 text-amber-500 border border-amber-500/30'
                          }`}
                        >
                          {isDone ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                          <span>{doc.processingStatus}</span>
                        </span>
                      </td>

                      <td className="py-3 px-3.5 max-w-sm truncate text-[var(--text-secondary)]" title={doc.summary}>
                        {doc.summary}
                      </td>

                      <td className="py-3 px-3.5 text-[var(--text-muted)] whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{new Date(doc.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-[var(--border)] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[var(--text-secondary)]">
          <div>
            Showing <span className="font-semibold text-[var(--text-primary)]">{documents.length}</span> of{' '}
            <span className="font-semibold text-[var(--text-primary)]">{pagination.total}</span> documents
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
