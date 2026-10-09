/**
 * PakLingo AI - Administrative User Detail View
 * Complete profile, telemetry metrics, preferences, conversation logs, and status controls.
 */

import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  UserCheck,
  UserX,
  Mail,
  Calendar,
  Clock,
  MessageSquare,
  Search,
  Languages,
  FileText,
  Cpu,
  Palette,
  Volume2,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Shield,
  Layers,
  Sparkles,
} from 'lucide-react';
import { AdminAPI } from '../api';
import { UserDetailData } from '../types';

interface AdminUserDetailProps {
  userId: string;
  onBack: () => void;
  onSelectConversation?: (convId: string) => void;
}

export const AdminUserDetail: React.FC<AdminUserDetailProps> = ({
  userId,
  onBack,
  onSelectConversation,
}) => {
  const [data, setData] = useState<UserDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'activity' | 'conversations' | 'translations' | 'documents'>('activity');

  const loadUserDetail = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await AdminAPI.getUserDetail(userId);
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load user details.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUserDetail();
  }, [userId]);

  const handleToggleStatus = async () => {
    if (!data) return;
    const nextStatus = data.profile.status === 'active' ? 'deactivated' : 'active';
    try {
      await AdminAPI.setUserStatus(data.profile.id, nextStatus);
      setActionSuccess(`User status updated to ${nextStatus}.`);
      setTimeout(() => setActionSuccess(null), 3000);
      loadUserDetail();
    } catch (err: any) {
      setError(err.message || 'Failed to update account status.');
    }
  };

  if (isLoading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <RefreshCw className="w-8 h-8 text-[var(--accent)] animate-spin" />
        <p className="text-xs text-[var(--text-secondary)]">Loading user profile & activity...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] text-xs text-[var(--text-primary)] hover:border-[var(--accent)] cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Users</span>
        </button>

        <div className="p-5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error || 'User not found.'}</span>
        </div>
      </div>
    );
  }

  const { profile, usage, preferences, activity } = data;
  const isActive = profile.status === 'active';

  return (
    <div id="admin-user-detail-page" className="space-y-6">
      {/* Back and Navigation */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] text-xs font-semibold text-[var(--text-primary)] hover:border-[var(--accent)] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Users Roster</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleStatus}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer shadow-xs ${
              isActive
                ? 'bg-rose-500/10 text-rose-500 border-rose-500/30 hover:bg-rose-500/20'
                : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30 hover:bg-emerald-500/20'
            }`}
          >
            {isActive ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
            <span>{isActive ? 'Deactivate Account' : 'Reactivate Account'}</span>
          </button>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* User Header Profile Card */}
      <div className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[var(--surface-secondary)] border border-[var(--border)] flex items-center justify-center text-xl font-black text-[var(--accent)] shadow-inner">
              {profile.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-bold text-[var(--text-primary)] tracking-tight">{profile.name}</h1>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    isActive
                      ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30'
                      : 'bg-rose-500/10 text-rose-500 border border-rose-500/30'
                  }`}
                >
                  {profile.status}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-[var(--surface-secondary)] border border-[var(--border)] text-[10px] uppercase font-mono text-[var(--text-muted)]">
                  {profile.provider}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)] mt-1">
                <Mail className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                <span>{profile.email}</span>
                <span className="text-[var(--text-muted)]">•</span>
                <span className="font-mono text-[11px] text-[var(--text-muted)]">ID: {profile.id}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap sm:flex-col sm:items-end gap-2 text-xs text-[var(--text-muted)]">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>Joined: {new Date(profile.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>Last Active: {new Date(profile.lastActiveAt).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Usage Analytics & Preference Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Usage Overview */}
        <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xs">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-[var(--border)]">
            <Cpu className="w-4 h-4 text-[var(--accent)]" />
            <h3 className="text-sm font-bold text-[var(--text-primary)]">Activity & Usage Metrics</h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
            <div className="p-3 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)]">
              <div className="text-[10px] uppercase font-semibold text-[var(--text-muted)]">Conversations</div>
              <div className="text-lg font-bold text-[var(--text-primary)]">{usage.conversationsCount}</div>
            </div>
            <div className="p-3 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)]">
              <div className="text-[10px] uppercase font-semibold text-[var(--text-muted)]">Searches</div>
              <div className="text-lg font-bold text-[var(--text-primary)]">{usage.searchesCount}</div>
            </div>
            <div className="p-3 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)]">
              <div className="text-[10px] uppercase font-semibold text-[var(--text-muted)]">Translations</div>
              <div className="text-lg font-bold text-[var(--text-primary)]">{usage.translationsCount}</div>
            </div>
            <div className="p-3 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)]">
              <div className="text-[10px] uppercase font-semibold text-[var(--text-muted)]">Documents</div>
              <div className="text-lg font-bold text-[var(--text-primary)]">{usage.documentsCount}</div>
            </div>
            <div className="p-3 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] col-span-2">
              <div className="text-[10px] uppercase font-semibold text-[var(--text-muted)]">Total AI Requests</div>
              <div className="text-lg font-bold text-[var(--accent)]">{usage.aiRequestsCount}</div>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <div>
              <span className="text-[var(--text-muted)] font-medium">Features Engaged: </span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {usage.featuresUsed.map((f, i) => (
                  <span key={i} className="px-2 py-0.5 rounded-md bg-[var(--surface-secondary)] border border-[var(--border)] text-[11px] text-[var(--text-primary)]">
                    {f}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <span className="text-[var(--text-muted)] font-medium">Vernacular Languages Used: </span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {usage.languagesUsed.map((l, i) => (
                  <span key={i} className="px-2 py-0.5 rounded-md bg-[var(--surface-secondary)] border border-[var(--border)] text-[11px] text-[var(--text-primary)] font-semibold">
                    {l}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* User Preferences */}
        <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xs">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-[var(--border)]">
            <Palette className="w-4 h-4 text-[var(--accent)]" />
            <h3 className="text-sm font-bold text-[var(--text-primary)]">User System Preferences</h3>
          </div>

          <div className="space-y-3.5 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)]">
              <span className="text-[var(--text-secondary)] font-medium">Active Theme Selection</span>
              <span className="font-semibold text-[var(--text-primary)] capitalize">{preferences.selectedTheme}</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)]">
              <span className="text-[var(--text-secondary)] font-medium">Font Scale Preference</span>
              <span className="font-semibold text-[var(--text-primary)] uppercase">{preferences.fontSizePreference}</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)]">
              <span className="text-[var(--text-secondary)] font-medium">Primary Language</span>
              <span className="font-semibold text-[var(--text-primary)] uppercase">{preferences.languagePreference}</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)]">
              <span className="text-[var(--text-secondary)] font-medium flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                <span>Voice Persona</span>
              </span>
              <span className="font-semibold text-[var(--text-primary)] capitalize">{preferences.voicePreference}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabbed Activity & Records */}
      <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xs">
        <div className="flex items-center gap-2 border-b border-[var(--border)] pb-3 mb-4 overflow-x-auto">
          <button
            onClick={() => setActiveTab('activity')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'activity'
                ? 'bg-[var(--button-primary-bg)] text-[var(--button-primary-text)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-secondary)]'
            }`}
          >
            Recent Activity ({activity.recentActivities.length})
          </button>
          <button
            onClick={() => setActiveTab('conversations')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'conversations'
                ? 'bg-[var(--button-primary-bg)] text-[var(--button-primary-text)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-secondary)]'
            }`}
          >
            Conversations ({activity.recentConversations.length})
          </button>
          <button
            onClick={() => setActiveTab('translations')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'translations'
                ? 'bg-[var(--button-primary-bg)] text-[var(--button-primary-text)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-secondary)]'
            }`}
          >
            Translations ({activity.recentTranslations.length})
          </button>
          <button
            onClick={() => setActiveTab('documents')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'documents'
                ? 'bg-[var(--button-primary-bg)] text-[var(--button-primary-text)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-secondary)]'
            }`}
          >
            Documents ({activity.recentDocuments.length})
          </button>
        </div>

        {/* Tab 1: Activity Log */}
        {activeTab === 'activity' && (
          <div className="space-y-2.5">
            {activity.recentActivities.length === 0 ? (
              <p className="text-xs text-[var(--text-muted)] py-6 text-center">No stored activity recorded.</p>
            ) : (
              activity.recentActivities.map((act) => (
                <div
                  key={act.id}
                  className="p-3 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] flex items-start justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[var(--text-primary)]">{act.feature}</span>
                      <span className="px-2 py-0.2 rounded-full text-[10px] font-bold uppercase bg-[var(--surface)] border border-[var(--border)] text-[var(--text-muted)]">
                        {act.type}
                      </span>
                      {act.language && (
                        <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase">
                          {act.language}
                        </span>
                      )}
                    </div>
                    <p className="text-[var(--text-secondary)]">{act.summary}</p>
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)] whitespace-nowrap">
                    {new Date(act.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 2: Conversations */}
        {activeTab === 'conversations' && (
          <div className="space-y-3">
            {activity.recentConversations.length === 0 ? (
              <p className="text-xs text-[var(--text-muted)] py-6 text-center">No stored conversations for this user.</p>
            ) : (
              activity.recentConversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => onSelectConversation && onSelectConversation(conv.id)}
                  className="p-4 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] hover:border-[var(--accent)]/50 transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-semibold text-xs text-[var(--text-primary)] flex items-center gap-2">
                      <MessageSquare className="w-3.5 h-3.5 text-[var(--accent)]" />
                      <span>{conv.title}</span>
                    </div>
                    <span className="text-[11px] text-[var(--text-muted)]">
                      {conv.messageCount} messages
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-[var(--text-muted)]">
                    <span className="px-2 py-0.5 rounded bg-[var(--surface)] border border-[var(--border)]">
                      Category: {conv.category}
                    </span>
                    <span>•</span>
                    <span>Lang: {conv.language.toUpperCase()}</span>
                    <span>•</span>
                    <span>{new Date(conv.updatedAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 3: Translations */}
        {activeTab === 'translations' && (
          <div className="space-y-2.5">
            {activity.recentTranslations.length === 0 ? (
              <p className="text-xs text-[var(--text-muted)] py-6 text-center">No translation records recorded.</p>
            ) : (
              activity.recentTranslations.map((tr) => (
                <div
                  key={tr.id}
                  className="p-3 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] text-xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-semibold text-[var(--text-primary)]">
                      <span className="uppercase px-1.5 py-0.5 rounded bg-[var(--surface)] border border-[var(--border)] text-[10px]">
                        {tr.sourceLang} → {tr.targetLang}
                      </span>
                      <span className="text-[11px] text-[var(--text-muted)]">via {tr.tool}</span>
                    </div>
                    <span className="text-[11px] text-[var(--text-muted)]">
                      {new Date(tr.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </span>
                  </div>
                  <div className="text-[var(--text-secondary)] italic pl-2 border-l-2 border-[var(--accent)]">
                    "{tr.sourceTextSnippet}"
                  </div>
                  <div className="text-[var(--text-primary)] font-medium pl-2">
                    → "{tr.translatedSnippet}"
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 4: Documents */}
        {activeTab === 'documents' && (
          <div className="space-y-2.5">
            {activity.recentDocuments.length === 0 ? (
              <p className="text-xs text-[var(--text-muted)] py-6 text-center">No document records found.</p>
            ) : (
              activity.recentDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className="p-3 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-[var(--accent)]" />
                      <span>{doc.fileName}</span>
                      <span className="text-[10px] text-[var(--text-muted)]">({doc.fileSize})</span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        doc.processingStatus === 'completed'
                          ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30'
                          : 'bg-amber-500/10 text-amber-500 border border-amber-500/30'
                      }`}
                    >
                      {doc.processingStatus}
                    </span>
                  </div>
                  <p className="text-[var(--text-secondary)]">{doc.summary}</p>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
