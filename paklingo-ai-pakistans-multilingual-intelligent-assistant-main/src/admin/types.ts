/**
 * PakLingo AI - Administrative Types & Interfaces
 */

export type AdminPageId =
  | 'overview'
  | 'users'
  | 'user-detail'
  | 'conversations'
  | 'search-activity'
  | 'translations'
  | 'documents'
  | 'analytics'
  | 'languages'
  | 'system'
  | 'settings';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'admin' | 'auditor';
  avatar?: string;
  createdAt: string;
  lastLoginAt: string;
}

export interface AdminOverviewStats {
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
  returningUsers: number;
  totalConversations: number;
  totalSearches: number;
  totalTranslations: number;
  totalDocumentsProcessed: number;
  totalAiRequests: number;
}

export interface AppUserRecord {
  id: string;
  name: string;
  email: string;
  provider: 'google' | 'email' | 'guest';
  status: 'active' | 'deactivated';
  createdAt: string;
  lastActiveAt: string;
  preferredLanguage: string;
  theme: string;
  fontSize: string;
  voicePreference: string;
  mostRecentFeature: string;
  stats: {
    conversationsCount: number;
    searchesCount: number;
    translationsCount: number;
    documentsCount: number;
    aiRequestsCount: number;
    featuresUsed: string[];
    languagesUsed: string[];
  };
}

export interface UserDetailData {
  profile: {
    id: string;
    name: string;
    email: string;
    status: 'active' | 'deactivated';
    provider: 'google' | 'email' | 'guest';
    createdAt: string;
    lastActiveAt: string;
  };
  usage: {
    conversationsCount: number;
    searchesCount: number;
    translationsCount: number;
    documentsCount: number;
    aiRequestsCount: number;
    featuresUsed: string[];
    languagesUsed: string[];
  };
  preferences: {
    selectedTheme: string;
    fontSizePreference: string;
    languagePreference: string;
    voicePreference: string;
  };
  activity: {
    recentActivities: UserActivityEvent[];
    recentConversations: ConversationRecord[];
    recentTranslations: TranslationRecord[];
    recentDocuments: DocumentRecord[];
  };
}

export interface UserActivityEvent {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  type: 'chat' | 'search' | 'translation' | 'document' | 'tool_use' | 'settings_change' | 'auth';
  feature: string;
  language: string;
  summary: string;
  details?: Record<string, any>;
  timestamp: string;
}

export interface ConversationRecord {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  title: string;
  category: string;
  language: string;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
  messages: Array<{
    id: string;
    sender: 'user' | 'assistant' | 'system';
    text: string;
    timestamp: string;
  }>;
}

export interface TranslationRecord {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  sourceLang: string;
  targetLang: string;
  sourceTextSnippet: string;
  translatedSnippet: string;
  charCount: number;
  timestamp: string;
  tool: string;
}

export interface DocumentRecord {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  fileName: string;
  fileSize: string;
  mimeType: string;
  processingStatus: 'completed' | 'processing' | 'failed';
  feature: string;
  language: string;
  summary: string;
  timestamp: string;
}

export interface AnalyticsData {
  timeframe: string;
  mostSearchedTopics: Array<{ topic: string; count: number; category: string }>;
  featureUsageStats: Array<{ feature: string; count: number; percentage: number; trend: string }>;
  languageUsageStats: Array<{ code: string; name: string; native: string; share: number; requestCount: number }>;
  activityTimeline: Array<{ date: string; requests: number; users: number; translations: number }>;
  summary: {
    totalQueries: number;
    averageResponseTimeMs: number;
    cacheHitRate: string;
    successRate: string;
  };
}

export interface SystemInfo {
  version: string;
  nodeVersion: string;
  uptimeSeconds: number;
  memoryUsage: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
  };
  environment: string;
  serverTime: string;
  geminiConfigured: boolean;
  databaseStatus: string;
  activeAdminSessions: number;
  totalRegisteredUsers: number;
  totalLoggedActivities: number;
  auditLogCount: number;
}

export interface SystemSettingsConfig {
  siteName: string;
  maintenanceMode: boolean;
  allowPublicSignups: boolean;
  dataRetentionDays: number;
  rateLimitPerMinute: number;
  defaultLanguage: string;
  enabledFeatures: {
    chat: boolean;
    translate: boolean;
    ocrDocuments: boolean;
    governmentAssistant: boolean;
    teacher: boolean;
    medical: boolean;
    farmer: boolean;
    legal: boolean;
    voiceAssistant: boolean;
    fakeNewsDetector: boolean;
    signLanguage: boolean;
  };
  aiModels: {
    primaryModel: string;
    fallbackModel: string;
    ttsModel: string;
  };
  auditLogRetentionDays: number;
}

export interface AdminAuditLog {
  id: string;
  adminEmail: string;
  action: string;
  targetType: string;
  targetId?: string;
  details: string;
  timestamp: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
