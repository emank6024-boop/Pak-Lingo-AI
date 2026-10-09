/**
 * PakLingo AI - Administrative User Management
 * Complete user roster, searching, filtering, sorting, status toggles (Deactivate/Reactivate), and pagination.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Search,
  Filter,
  ArrowUpDown,
  Eye,
  UserX,
  UserCheck,
  Download,
  RefreshCw,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  CheckCircle,
} from 'lucide-react';
import { AdminAPI } from '../api';
import { AppUserRecord } from '../types';

interface AdminUsersProps {
  onSelectUserDetail: (userId: string) => void;
}

export const AdminUsers: React.FC<AdminUsersProps> = ({ onSelectUserDetail }) => {
  const [users, setUsers] = useState<AppUserRecord[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [languageFilter, setLanguageFilter] = useState('all');
  const [sortBy, setSortBy] = useState('lastActiveAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 280);
    return () => clearTimeout(timer);
  }, [search]);

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await AdminAPI.getUsers({
        search: debouncedSearch,
        status: statusFilter,
        language: languageFilter,
        sortBy,
        sortOrder,
        page: pagination.page,
        limit: pagination.limit,
      });
      setUsers(res.users);
      setPagination(res.pagination);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch user directory.');
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, statusFilter, languageFilter, sortBy, sortOrder, pagination.page, pagination.limit]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleToggleStatus = async (user: AppUserRecord) => {
    const nextStatus = user.status === 'active' ? 'deactivated' : 'active';
    try {
      await AdminAPI.setUserStatus(user.id, nextStatus);
      setActionSuccess(`User "${user.name}" has been ${nextStatus === 'active' ? 'reactivated' : 'deactivated'}.`);
      setTimeout(() => setActionSuccess(null), 3500);
      loadUsers();
    } catch (err: any) {
      setError(err.message || 'Failed to update user status.');
    }
  };

  const handleSortChange = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  return (
    <div id="admin-users-page" className="space-y-5">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[var(--border)]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)] flex items-center gap-2">
            <Users className="w-6 h-6 text-[var(--accent)]" />
            <span>User Management</span>
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Manage account status, investigate activity records, and review user preferences
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
            onClick={loadUsers}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--button-primary-bg)] text-[var(--button-primary-text)] text-xs font-semibold hover:opacity-95 transition-all cursor-pointer shadow-xs disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Success or Error Notice */}
      {actionSuccess && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, ID..."
            className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
          />
        </div>

        {/* Status Filter */}
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] text-xs text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] cursor-pointer"
          >
            <option value="all">All Account Statuses</option>
            <option value="active">Active Only</option>
            <option value="deactivated">Deactivated Only</option>
          </select>
        </div>

        {/* Language Filter */}
        <div className="relative">
          <select
            value={languageFilter}
            onChange={(e) => setLanguageFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] text-xs text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] cursor-pointer"
          >
            <option value="all">All Preferred Languages</option>
            <option value="ur">Urdu (اردو)</option>
            <option value="en">English</option>
            <option value="pa">Punjabi (پنجابی)</option>
            <option value="ps">Pashto (پښتو)</option>
            <option value="sd">Sindhi (سنڌي)</option>
            <option value="bal">Balochi (بلوچی)</option>
          </select>
        </div>

        {/* Sorting Dropdown */}
        <div className="relative">
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('-');
              setSortBy(field);
              setSortOrder(order as any);
            }}
            className="w-full px-3 py-2 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] text-xs text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] cursor-pointer"
          >
            <option value="lastActiveAt-desc">Recently Active (Newest First)</option>
            <option value="createdAt-desc">Registration (Newest First)</option>
            <option value="name-asc">Name (A-Z)</option>
            <option value="aiRequestsCount-desc">Most AI Requests</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--surface-secondary)]/50 text-[var(--text-muted)]">
                <th className="py-3 px-3.5 font-semibold uppercase tracking-wider">User Details</th>
                <th className="py-3 px-3.5 font-semibold uppercase tracking-wider">Status</th>
                <th className="py-3 px-3.5 font-semibold uppercase tracking-wider">Registered</th>
                <th className="py-3 px-3.5 font-semibold uppercase tracking-wider">Last Active</th>
                <th className="py-3 px-3.5 font-semibold uppercase tracking-wider">Recent Feature</th>
                <th className="py-3 px-3.5 font-semibold uppercase tracking-wider">Preferences</th>
                <th className="py-3 px-3.5 font-semibold uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[var(--text-muted)]">
                    {isLoading ? 'Loading users...' : 'No users match your criteria.'}
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const isActive = u.status === 'active';
                  return (
                    <tr key={u.id} className="hover:bg-[var(--surface-secondary)]/40 transition-colors">
                      {/* Name & ID */}
                      <td className="py-3 px-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-[var(--surface-secondary)] border border-[var(--border)] flex items-center justify-center font-bold text-[var(--text-primary)] shrink-0">
                            {u.name.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                              <span>{u.name}</span>
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-[var(--surface-secondary)] border border-[var(--border)] text-[var(--text-muted)] uppercase">
                                {u.provider}
                              </span>
                            </div>
                            <div className="text-[11px] text-[var(--text-muted)] truncate">{u.email}</div>
                            <div className="text-[10px] font-mono text-[var(--text-muted)]">ID: {u.id}</div>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            isActive
                              ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30'
                              : 'bg-rose-500/10 text-rose-500 border border-rose-500/30'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                          {u.status}
                        </span>
                      </td>

                      {/* Created Date */}
                      <td className="py-3 px-3.5 text-[var(--text-secondary)] whitespace-nowrap">
                        {new Date(u.createdAt).toLocaleDateString([], {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>

                      {/* Last Active */}
                      <td className="py-3 px-3.5 text-[var(--text-secondary)] whitespace-nowrap">
                        {new Date(u.lastActiveAt).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>

                      {/* Most Recent Feature */}
                      <td className="py-3 px-3.5">
                        <span className="px-2 py-0.5 rounded-lg bg-[var(--surface-secondary)] border border-[var(--border)] text-[11px] text-[var(--text-primary)] font-medium">
                          {u.mostRecentFeature || 'Home'}
                        </span>
                      </td>

                      {/* Preferences */}
                      <td className="py-3 px-3.5 text-[11px] text-[var(--text-secondary)]">
                        <div>Lang: <span className="font-semibold uppercase text-[var(--text-primary)]">{u.preferredLanguage}</span></div>
                        <div>Theme: <span className="capitalize">{u.theme}</span></div>
                        <div>Font: <span className="uppercase">{u.fontSize}</span></div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            id={`view-user-${u.id}`}
                            onClick={() => onSelectUserDetail(u.id)}
                            className="p-1.5 rounded-lg bg-[var(--surface-secondary)] hover:bg-[var(--surface-secondary)]/80 text-[var(--text-primary)] border border-[var(--border)] transition-colors cursor-pointer"
                            title="View complete user activity & history"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            id={`toggle-user-status-${u.id}`}
                            onClick={() => handleToggleStatus(u)}
                            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                              isActive
                                ? 'bg-rose-500/10 text-rose-500 border-rose-500/20 hover:bg-rose-500/20'
                                : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20'
                            }`}
                            title={isActive ? 'Deactivate user account' : 'Reactivate user account'}
                          >
                            {isActive ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-[var(--border)] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[var(--text-secondary)]">
          <div>
            Showing <span className="font-semibold text-[var(--text-primary)]">{users.length}</span> of{' '}
            <span className="font-semibold text-[var(--text-primary)]">{pagination.total}</span> registered users
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
