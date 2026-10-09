/**
 * PakLingo AI - Administrative Application Root
 * High-security admin gateway, view router, and authorization boundary.
 */

import React, { useState } from 'react';
import { AdminAuthProvider, useAdminAuth } from './context/AdminAuthContext';
import { AdminLogin } from './AdminLogin';
import { AdminLayout } from './AdminLayout';
import { AdminPageId } from './types';
import { AdminOverview } from './pages/AdminOverview';
import { AdminUsers } from './pages/AdminUsers';
import { AdminUserDetail } from './pages/AdminUserDetail';
import { AdminConversations } from './pages/AdminConversations';
import { AdminSearchActivity } from './pages/AdminSearchActivity';
import { AdminTranslations } from './pages/AdminTranslations';
import { AdminDocuments } from './pages/AdminDocuments';
import { AdminAnalytics } from './pages/AdminAnalytics';
import { AdminLanguages } from './pages/AdminLanguages';
import { AdminSystem } from './pages/AdminSystem';
import { AdminSettings } from './pages/AdminSettings';
import { RefreshCw, Shield } from 'lucide-react';

const AdminContent: React.FC = () => {
  const { isAuthenticated, isLoading } = useAdminAuth();
  const [currentPage, setCurrentPage] = useState<AdminPageId>('overview');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[var(--app-bg)] text-[var(--text-primary)] gap-3">
        <div className="w-12 h-12 rounded-2xl bg-[var(--surface-secondary)] border border-[var(--border)] flex items-center justify-center text-[var(--accent)] shadow-md">
          <Shield className="w-6 h-6 animate-pulse" />
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-secondary)]">
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          <span>Verifying Administrative Session...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AdminLogin />;
  }

  const handleSelectUserDetail = (userId: string) => {
    setSelectedUserId(userId);
    setCurrentPage('user-detail');
  };

  const handleGlobalSearchSubmit = (query: string) => {
    setSearchQuery(query);
    setCurrentPage('search-activity');
  };

  return (
    <AdminLayout
      currentPage={currentPage}
      onSelectPage={(page) => {
        if (page !== 'user-detail') {
          setSelectedUserId(null);
        }
        setCurrentPage(page);
      }}
      onSelectUserDetail={handleSelectUserDetail}
      onGlobalSearchSubmit={handleGlobalSearchSubmit}
    >
      {currentPage === 'overview' && (
        <AdminOverview
          onNavigate={(page) => setCurrentPage(page)}
          onSelectUserDetail={handleSelectUserDetail}
        />
      )}

      {currentPage === 'users' && (
        <AdminUsers onSelectUserDetail={handleSelectUserDetail} />
      )}

      {currentPage === 'user-detail' && selectedUserId && (
        <AdminUserDetail
          userId={selectedUserId}
          onBack={() => setCurrentPage('users')}
        />
      )}

      {currentPage === 'conversations' && (
        <AdminConversations onSelectUserDetail={handleSelectUserDetail} />
      )}

      {currentPage === 'search-activity' && (
        <AdminSearchActivity
          initialQuery={searchQuery}
          onSelectUserDetail={handleSelectUserDetail}
          onSelectConversation={() => setCurrentPage('conversations')}
        />
      )}

      {currentPage === 'translations' && (
        <AdminTranslations onSelectUserDetail={handleSelectUserDetail} />
      )}

      {currentPage === 'documents' && (
        <AdminDocuments onSelectUserDetail={handleSelectUserDetail} />
      )}

      {currentPage === 'analytics' && <AdminAnalytics />}

      {currentPage === 'languages' && <AdminLanguages />}

      {currentPage === 'system' && <AdminSystem />}

      {currentPage === 'settings' && <AdminSettings />}
    </AdminLayout>
  );
};

export const AdminApp: React.FC = () => {
  return (
    <AdminAuthProvider>
      <AdminContent />
    </AdminAuthProvider>
  );
};
