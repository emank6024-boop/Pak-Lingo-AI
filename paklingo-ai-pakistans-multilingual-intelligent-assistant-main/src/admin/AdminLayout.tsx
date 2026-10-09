/**
 * PakLingo AI - Administrative Layout
 * Professional sidebar, header, global administrative search, and responsive shell.
 */

import React, { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  Activity,
  Languages,
  FileText,
  BarChart3,
  Globe,
  Server,
  Settings,
  Shield,
  LogOut,
  ExternalLink,
  Search,
  Menu,
  X,
  UserCheck,
} from 'lucide-react';
import { AdminPageId } from './types';
import { useAdminAuth } from './context/AdminAuthContext';

interface AdminLayoutProps {
  currentPage: AdminPageId;
  onSelectPage: (page: AdminPageId) => void;
  onSelectUserDetail?: (userId: string) => void;
  onGlobalSearchSubmit?: (query: string) => void;
  children: React.ReactNode;
}

interface NavItem {
  id: AdminPageId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'conversations', label: 'Conversations', icon: MessageSquare },
  { id: 'search-activity', label: 'Search & Activity', icon: Activity },
  { id: 'translations', label: 'Translations', icon: Languages },
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'languages', label: 'Languages', icon: Globe },
  { id: 'system', label: 'System', icon: Server },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  currentPage,
  onSelectPage,
  onGlobalSearchSubmit,
  children,
}) => {
  const { admin, logout } = useAdminAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSelectPage('search-activity');
      if (onGlobalSearchSubmit) {
        onGlobalSearchSubmit(searchQuery.trim());
      }
    }
  };

  const handleNavClick = (id: AdminPageId) => {
    onSelectPage(id);
    setMobileMenuOpen(false);
  };

  return (
    <div
      id="admin-layout-root"
      className="min-h-screen flex flex-col md:flex-row bg-[var(--app-bg)] text-[var(--text-primary)]"
    >
      {/* Mobile Header Bar */}
      <div className="md:hidden flex items-center justify-between p-4 bg-[var(--surface)] border-b border-[var(--border)] sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[var(--surface-secondary)] border border-[var(--border)] flex items-center justify-center text-[var(--accent)]">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-sm tracking-tight text-[var(--text-primary)]">PakLingo Admin</div>
            <div className="text-[10px] text-[var(--text-muted)]">Enterprise Operations</div>
          </div>
        </div>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle Navigation Menu"
          className="p-2 rounded-lg bg-[var(--surface-secondary)] text-[var(--text-primary)] border border-[var(--border)] cursor-pointer"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Desktop & Mobile Drawer Sidebar */}
      <aside
        id="admin-sidebar"
        className={`fixed md:sticky top-0 left-0 h-screen w-64 bg-[var(--surface)] border-r border-[var(--border)] flex flex-col z-50 transition-transform duration-200 ease-in-out md:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Brand Header */}
        <div className="p-5 border-b border-[var(--border)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] flex items-center justify-center text-[var(--accent)] shadow-sm">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-sm text-[var(--text-primary)] tracking-tight">PakLingo Admin</div>
              <div className="text-[11px] text-[var(--text-muted)] font-medium">Enterprise Control</div>
            </div>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="md:hidden p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
            Administration
          </div>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id || (item.id === 'users' && currentPage === 'user-detail');

            return (
              <button
                key={item.id}
                id={`admin-nav-${item.id}`}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[var(--button-primary-bg)] text-[var(--button-primary-text)] shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-secondary)]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-inherit' : 'text-[var(--text-muted)]'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                      isActive ? 'bg-white/20 text-white' : 'bg-[var(--surface-secondary)] text-[var(--text-muted)]'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Sidebar Footer: Authenticated Admin Pill & Sign Out */}
        <div className="p-3 border-t border-[var(--border)] bg-[var(--surface-secondary)]/50">
          <div className="flex items-center gap-2.5 p-2 rounded-xl bg-[var(--surface)] border border-[var(--border)] mb-2">
            <div className="w-8 h-8 rounded-full bg-[var(--surface-secondary)] border border-[var(--border)] flex items-center justify-center text-[var(--accent)] font-bold text-xs">
              {admin?.name?.charAt(0) || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-[var(--text-primary)] truncate">
                {admin?.name || 'Administrator'}
              </div>
              <div className="text-[10px] text-[var(--text-muted)] truncate flex items-center gap-1">
                <UserCheck className="w-2.5 h-2.5 text-emerald-500 shrink-0" />
                <span className="capitalize">{admin?.role?.replace('_', ' ') || 'Super Admin'}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-[11px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)] border border-transparent hover:border-[var(--border)] transition-colors"
              title="Open Public User Portal in new tab"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Public App</span>
            </a>

            <button
              id="admin-sign-out-btn"
              onClick={() => logout()}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-[11px] font-semibold text-rose-500 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-colors cursor-pointer"
              title="Sign Out of Administrator Session"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Backdrop overlay for mobile */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-xs"
        />
      )}

      {/* Main Administrative Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {/* Top Control Bar */}
        <header className="h-16 px-4 sm:px-6 lg:px-8 border-b border-[var(--border)] bg-[var(--surface)] flex items-center justify-between gap-4 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)] capitalize">
              {currentPage === 'overview'
                ? 'System Overview'
                : currentPage === 'search-activity'
                ? 'Search & Activity'
                : currentPage === 'user-detail'
                ? 'User Detail'
                : currentPage}
            </h2>
            <div className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[var(--surface-secondary)] border border-[var(--border)] text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
              Admin Shield Active
            </div>
          </div>

          {/* Quick Search in Top Bar */}
          <form onSubmit={handleSearchSubmit} className="relative w-full max-w-xs hidden sm:block">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Quick search users, queries, docs..."
              className="w-full pl-9 pr-4 py-1.5 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            />
          </form>
        </header>

        {/* Page Content Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
