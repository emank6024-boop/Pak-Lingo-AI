/**
 * PakLingo AI - Administrative API Client
 * Automatically sends Authorization: Bearer <token> with all administrative requests.
 */

import {
  AdminUser,
  AdminOverviewStats,
  AppUserRecord,
  UserDetailData,
  ConversationRecord,
  TranslationRecord,
  DocumentRecord,
  AnalyticsData,
  SystemInfo,
  SystemSettingsConfig,
  AdminAuditLog,
  Pagination,
} from './types';

const ADMIN_TOKEN_KEY = 'paklingo_admin_token';

export function getStoredAdminToken(): string | null {
  try {
    return sessionStorage.getItem(ADMIN_TOKEN_KEY) || localStorage.getItem(ADMIN_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredAdminToken(token: string | null): void {
  try {
    if (token) {
      sessionStorage.setItem(ADMIN_TOKEN_KEY, token);
      localStorage.setItem(ADMIN_TOKEN_KEY, token);
    } else {
      sessionStorage.removeItem(ADMIN_TOKEN_KEY);
      localStorage.removeItem(ADMIN_TOKEN_KEY);
    }
  } catch {
    // ignore
  }
}

async function adminFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredAdminToken();
  const headers = new Headers(options.headers || {});

  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  if (response.status === 401 || response.status === 403) {
    // Unauthorized or forbidden admin access
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Administrative authorization required or session expired.');
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Request failed with status ${response.status}`);
  }

  return response.json();
}

export const AdminAPI = {
  async login(email: string, password: string): Promise<{ success: boolean; token: string; admin: AdminUser }> {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Invalid administrator credentials');
    }

    const data = await res.json();
    setStoredAdminToken(data.token);
    return data;
  },

  async logout(): Promise<void> {
    try {
      await adminFetch('/api/admin/logout', { method: 'POST' });
    } finally {
      setStoredAdminToken(null);
    }
  },

  async getMe(): Promise<{ success: boolean; admin: AdminUser }> {
    return adminFetch<{ success: boolean; admin: AdminUser }>('/api/admin/me');
  },

  async getOverview(): Promise<{
    stats: AdminOverviewStats;
    mostUsedFeatures: Array<{ name: string; count: number }>;
    mostUsedLanguages: Array<{ language: string; count: number }>;
    recentActivity: Array<any>;
  }> {
    return adminFetch('/api/admin/overview');
  },

  async getUsers(params: {
    search?: string;
    status?: string;
    language?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  }): Promise<{ users: AppUserRecord[]; pagination: Pagination }> {
    const query = new URLSearchParams();
    if (params.search) query.set('search', params.search);
    if (params.status) query.set('status', params.status);
    if (params.language) query.set('language', params.language);
    if (params.sortBy) query.set('sortBy', params.sortBy);
    if (params.sortOrder) query.set('sortOrder', params.sortOrder);
    if (params.page) query.set('page', params.page.toString());
    if (params.limit) query.set('limit', params.limit.toString());

    return adminFetch(`/api/admin/users?${query.toString()}`);
  },

  async getUserDetail(id: string): Promise<UserDetailData> {
    return adminFetch(`/api/admin/users/${id}`);
  },

  async setUserStatus(id: string, status: 'active' | 'deactivated'): Promise<{ success: boolean; user: AppUserRecord; message: string }> {
    return adminFetch(`/api/admin/users/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  async getConversations(params: {
    search?: string;
    category?: string;
    language?: string;
    page?: number;
    limit?: number;
  }): Promise<{ conversations: ConversationRecord[]; pagination: Pagination }> {
    const query = new URLSearchParams();
    if (params.search) query.set('search', params.search);
    if (params.category) query.set('category', params.category);
    if (params.language) query.set('language', params.language);
    if (params.page) query.set('page', params.page.toString());
    if (params.limit) query.set('limit', params.limit.toString());

    return adminFetch(`/api/admin/conversations?${query.toString()}`);
  },

  async getConversationById(id: string): Promise<ConversationRecord> {
    return adminFetch(`/api/admin/conversations/${id}`);
  },

  async getTranslations(params: {
    search?: string;
    sourceLang?: string;
    targetLang?: string;
    page?: number;
    limit?: number;
  }): Promise<{ translations: TranslationRecord[]; pagination: Pagination }> {
    const query = new URLSearchParams();
    if (params.search) query.set('search', params.search);
    if (params.sourceLang) query.set('sourceLang', params.sourceLang);
    if (params.targetLang) query.set('targetLang', params.targetLang);
    if (params.page) query.set('page', params.page.toString());
    if (params.limit) query.set('limit', params.limit.toString());

    return adminFetch(`/api/admin/translations?${query.toString()}`);
  },

  async getDocuments(params: {
    search?: string;
    status?: string;
    feature?: string;
    page?: number;
    limit?: number;
  }): Promise<{ documents: DocumentRecord[]; pagination: Pagination }> {
    const query = new URLSearchParams();
    if (params.search) query.set('search', params.search);
    if (params.status) query.set('status', params.status);
    if (params.feature) query.set('feature', params.feature);
    if (params.page) query.set('page', params.page.toString());
    if (params.limit) query.set('limit', params.limit.toString());

    return adminFetch(`/api/admin/documents?${query.toString()}`);
  },

  async getAnalytics(timeframe: 'day' | 'week' | 'month' | 'all' = 'week'): Promise<AnalyticsData> {
    return adminFetch(`/api/admin/analytics?timeframe=${timeframe}`);
  },

  async globalSearch(query: string): Promise<{
    query: string;
    users: AppUserRecord[];
    conversations: ConversationRecord[];
    translations: TranslationRecord[];
    documents: DocumentRecord[];
    activities: any[];
    totalMatches: number;
  }> {
    return adminFetch(`/api/admin/search?q=${encodeURIComponent(query)}`);
  },

  async exportData(type: 'users' | 'activity' | 'conversations' | 'documents', format: 'csv' | 'json'): Promise<void> {
    const token = getStoredAdminToken();
    const url = `/api/admin/export?type=${type}&format=${format}`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token || ''}`,
      },
    });

    if (!response.ok) {
      throw new Error('Export authorization failed or denied.');
    }

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `paklingo_admin_${type}_export.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(downloadUrl);
  },

  async getSystemInfo(): Promise<SystemInfo> {
    return adminFetch('/api/admin/system');
  },

  async getSettings(): Promise<SystemSettingsConfig> {
    return adminFetch('/api/admin/settings');
  },

  async updateSettings(settings: Partial<SystemSettingsConfig>): Promise<{ success: boolean; settings: SystemSettingsConfig; message: string }> {
    return adminFetch('/api/admin/settings', {
      method: 'PATCH',
      body: JSON.stringify(settings),
    });
  },

  async getAuditLogs(limit = 50): Promise<AdminAuditLog[]> {
    return adminFetch(`/api/admin/audit-logs?limit=${limit}`);
  },
};
