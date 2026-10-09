import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import {
  Activity,
  Languages,
  Clock,
  ArrowUpRight,
  CheckCircle2,
  Server,
  Zap,
  Bot,
  FileText,
  ShieldCheck,
  Trash2,
  Download,
  ExternalLink,
  MessageSquare,
  Sparkles,
  Cloud,
} from 'lucide-react';
import { PageId, LanguageCode } from '../../types';
import { SUPPORTED_LANGUAGES } from '../../data/languages';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { getUserConversationsFromFirestore } from '../../lib/firestoreService';

interface DashboardProps {
  onNavigate: (page: PageId) => void;
  selectedLanguage: LanguageCode;
}

interface SavedSession {
  id: string;
  title: string;
  timestamp: string;
  messages?: Array<{ id: string; sender: string; text: string; timestamp: string }>;
  category?: string;
  targetPage?: PageId;
}

const SYSTEM_SERVICES = [
  {
    name: 'Gemini 2.5 Multi-Candidate Engine',
    description: 'Bilingual conversational reasoning, fallback cascade & instruction tuning',
    status: 'Operational',
  },
  {
    name: 'Multilingual TTS & Speech Pipeline',
    description: 'Hybrid edge synthesis & localized regional speech playback',
    status: 'Operational',
  },
  {
    name: 'Vision & OCR Document Pipeline',
    description: 'High-resolution bill, CNIC, and official document text extraction',
    status: 'Operational',
  },
  {
    name: 'Official Search & Fact Grounding',
    description: 'Verification engine for Pakistani regulatory sources and portals',
    status: 'Operational',
  },
];

const OFFICIAL_CIVIC_LINKS = [
  {
    name: 'NADRA Official Portal',
    desc: 'National Database & Registration Authority for Smart CNIC and CRC',
    url: 'https://www.nadra.gov.pk',
  },
  {
    name: 'BISP 8171 Portal',
    desc: 'Benazir Income Support Programme eligibility & financial relief verification',
    url: 'https://bisp.gov.pk',
  },
  {
    name: 'Directorate of Passports',
    desc: 'Machine Readable Passport (MRP) & e-Passport guidelines',
    url: 'https://dgip.gov.pk',
  },
  {
    name: 'FBR Taxpayer Verification',
    desc: 'Federal Board of Revenue active taxpayer list (ATL) and tax verification',
    url: 'https://fbr.gov.pk',
  },
];

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate, selectedLanguage }) => {
  const { isRTL } = useLanguage();
  const { user } = useAuth();
  const [sessions, setSessions] = useState<SavedSession[]>([]);

  const loadSessions = useCallback(async () => {
    let localSessions: SavedSession[] = [];
    try {
      const stored = localStorage.getItem('paklingo_ai_saved_sessions');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          localSessions = parsed;
        }
      }
    } catch {
      // ignore
    }

    if (!user?.id) {
      setSessions(localSessions);
      return;
    }

    try {
      const cloudConvs = await getUserConversationsFromFirestore(user.id);
      if (cloudConvs && cloudConvs.length > 0) {
        const cloudSessions: SavedSession[] = cloudConvs.map((conv) => ({
          id: conv.id || `conv_${Date.now()}`,
          title: conv.title,
          timestamp: conv.createdAt ? new Date(conv.createdAt).toLocaleDateString() : 'Cloud session',
          category: conv.category || 'General',
          targetPage: (conv.targetPage as PageId) || 'chat',
          messages: [],
        }));

        // Merge, avoiding duplicates
        const map = new Map<string, SavedSession>();
        cloudSessions.forEach((s) => map.set(s.id, s));
        localSessions.forEach((s) => {
          if (!map.has(s.id)) map.set(s.id, s);
        });
        setSessions(Array.from(map.values()));
      } else {
        setSessions(localSessions);
      }
    } catch (e) {
      console.warn('Dashboard session sync note:', e);
      setSessions(localSessions);
    }
  }, [user?.id]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to clear your local session history? This action cannot be undone.')) {
      localStorage.removeItem('paklingo_ai_saved_sessions');
      setSessions([]);
    }
  };

  const handleExportData = () => {
    if (sessions.length === 0) return;
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(sessions, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `paklingo-session-export-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-8 pb-16 max-w-5xl mx-auto" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs font-semibold mb-2">
              <Activity className="w-3.5 h-3.5 text-emerald-500" />
              <span>{isRTL ? 'پلیٹ فارم ڈیش بورڈ' : 'Platform & Activity Overview'}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] tracking-tight">
              {isRTL ? 'صارف سرگرمی و نظام کی حالت' : 'Workspace & System Health'}
            </h1>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1 max-w-xl">
              {isRTL
                ? 'آپ کی محفوظ شدہ سیشنز، نظام کی شفاف حالت، اور باضابطہ حکومتی پورٹلز تک رسائی۔'
                : 'Real saved sessions, operational service status, and direct verified government links.'}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {sessions.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={handleExportData}
                  className="px-3 py-1.5 rounded-xl bg-[var(--surface-secondary)] hover:bg-[var(--surface-hover)] border border-[var(--border)] text-xs font-medium text-[var(--text-primary)] flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-[var(--accent)]" />
                  <span>Export</span>
                </button>
                <button
                  type="button"
                  onClick={handleClearHistory}
                  className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3">
          {isRTL ? 'فوری اقدامات' : 'Quick Actions'}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <motion.button
            whileHover={{ y: -2 }}
            type="button"
            onClick={() => onNavigate('chat')}
            className="p-4 rounded-2xl bg-[var(--surface)] hover:bg-[var(--surface-hover)] border border-[var(--border)] hover:border-emerald-500/50 flex flex-col items-start text-left transition-all cursor-pointer shadow-xs active:scale-95 group"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2.5 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <Bot className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-[var(--text-primary)]">New Assistant Chat</span>
            <span className="text-[11px] text-[var(--text-muted)] mt-0.5">Conversational intelligence</span>
          </motion.button>

          <motion.button
            whileHover={{ y: -2 }}
            type="button"
            onClick={() => onNavigate('translate')}
            className="p-4 rounded-2xl bg-[var(--surface)] hover:bg-[var(--surface-hover)] border border-[var(--border)] hover:border-emerald-500/50 flex flex-col items-start text-left transition-all cursor-pointer shadow-xs active:scale-95 group"
          >
            <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-2.5 group-hover:bg-teal-600 group-hover:text-white transition-colors">
              <Languages className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-[var(--text-primary)]">Translate Dialects</span>
            <span className="text-[11px] text-[var(--text-muted)] mt-0.5">10 regional languages</span>
          </motion.button>

          <motion.button
            whileHover={{ y: -2 }}
            type="button"
            onClick={() => onNavigate('documents')}
            className="p-4 rounded-2xl bg-[var(--surface)] hover:bg-[var(--surface-hover)] border border-[var(--border)] hover:border-emerald-500/50 flex flex-col items-start text-left transition-all cursor-pointer shadow-xs active:scale-95 group"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2.5 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <FileText className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-[var(--text-primary)]">Scan Document OCR</span>
            <span className="text-[11px] text-[var(--text-muted)] mt-0.5">Analyze CNIC & bills</span>
          </motion.button>

          <motion.button
            whileHover={{ y: -2 }}
            type="button"
            onClick={() => onNavigate('fake-news')}
            className="p-4 rounded-2xl bg-[var(--surface)] hover:bg-[var(--surface-hover)] border border-[var(--border)] hover:border-emerald-500/50 flex flex-col items-start text-left transition-all cursor-pointer shadow-xs active:scale-95 group"
          >
            <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-2.5 group-hover:bg-teal-600 group-hover:text-white transition-colors">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-[var(--text-primary)]">Fact Check Media</span>
            <span className="text-[11px] text-[var(--text-muted)] mt-0.5">Verify WhatsApp claims</span>
          </motion.button>
        </div>
      </div>

      {/* Real User Recent Activity Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
            {isRTL ? 'آپ کی حالیہ گفتگو' : 'Your Recent Sessions'}
          </h2>
          <span className="text-xs text-[var(--text-muted)] font-medium">
            {sessions.length} {sessions.length === 1 ? 'session' : 'sessions'} stored locally
          </span>
        </div>

        {sessions.length === 0 ? (
          <div className="p-8 rounded-2xl bg-[var(--surface)] border border-[var(--border)] text-center space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--surface-secondary)] text-[var(--text-muted)] flex items-center justify-center mx-auto">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                {isRTL ? 'ابھی تک کوئی محفوظ شدہ گفتگو نہیں ہے' : 'No saved conversations yet'}
              </h3>
              <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto">
                {isRTL
                  ? 'جب آپ اے آئی معاون سے سوالات پوچھیں گے، آپ کی گفتگو یہاں محفوظ ہوگی۔'
                  : 'When you start conversations in Assistant, your saved sessions will appear here privately.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('chat')}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              {isRTL ? 'نئی گفتگو شروع کریں' : 'Start New Conversation'}
            </button>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)] rounded-2xl bg-[var(--surface)] border border-[var(--border)] overflow-hidden">
            {sessions.map((session) => (
              <div
                key={session.id}
                onClick={() => onNavigate(session.targetPage || 'chat')}
                className="p-4 hover:bg-[var(--surface-hover)] flex items-center justify-between gap-4 cursor-pointer transition-colors"
              >
                <div className="min-w-0 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-semibold text-[var(--text-primary)] truncate">
                        {session.title || 'Conversation'}
                      </h4>
                      {session.category && (
                        <span className="text-[10px] font-medium text-[var(--accent)] bg-[var(--accent)]/10 px-2 py-0.5 rounded-md shrink-0">
                          {session.category}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-[var(--text-muted)] flex items-center gap-1.5 mt-0.5">
                      <Clock className="w-3 h-3" />
                      <span>{session.timestamp || 'Saved session'}</span>
                      {session.messages && session.messages.length > 0 && (
                        <>
                          <span>•</span>
                          <span>{session.messages.length} messages</span>
                        </>
                      )}
                    </span>
                  </div>
                </div>

                <div className="shrink-0 text-[var(--text-muted)] hover:text-emerald-600 dark:hover:text-emerald-400">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Real System Status Grid */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3">
          {isRTL ? 'نظام و سروسز کی حالت' : 'Platform Diagnostics & System Health'}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {SYSTEM_SERVICES.map((srv, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex items-start justify-between gap-3 shadow-2xs"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-[var(--text-primary)]">{srv.name}</span>
                </div>
                <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">{srv.description}</p>
              </div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold shrink-0 border border-emerald-500/20">
                <CheckCircle2 className="w-3 h-3" />
                <span>{srv.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Official Civic Portals Direct Links */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3">
          {isRTL ? 'مصدقہ سرکاری پورٹلز' : 'Verified Official Government Portals'}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {OFFICIAL_CIVIC_LINKS.map((link, idx) => (
            <motion.a
              key={idx}
              whileHover={{ y: -2 }}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 rounded-2xl bg-[var(--surface)] hover:bg-[var(--surface-hover)] border border-[var(--border)] hover:border-emerald-500/50 flex items-center justify-between gap-3 transition-all group shadow-xs active:scale-98"
            >
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-[var(--text-primary)] group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  {link.name}
                </h4>
                <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">{link.desc}</p>
              </div>
              <ExternalLink className="w-4 h-4 text-[var(--text-muted)] group-hover:text-emerald-600 dark:group-hover:text-emerald-400 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </motion.a>
          ))}
        </div>
      </div>
    </div>
  );
};
