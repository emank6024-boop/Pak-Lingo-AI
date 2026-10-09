import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import {
  Clock,
  MessageSquare,
  Languages,
  FileText,
  Activity,
  Search,
  Trash2,
  ArrowRight,
  Filter,
  CheckCircle2,
  RefreshCw,
  Cloud,
} from 'lucide-react';
import { PageId } from '../../types';
import { useAuth } from '../../context/AuthContext';
import {
  getUserConversationsFromFirestore,
  deleteConversationFromFirestore,
  clearUserConversationsFromFirestore,
} from '../../lib/firestoreService';

interface HistoryPageProps {
  onSelectPage: (page: PageId) => void;
}

interface HistoryEntry {
  id: string;
  type: 'chat' | 'translate' | 'document' | 'activity';
  title: string;
  subtitle: string;
  module: string;
  targetPage: PageId;
  timestamp: string;
  createdAt?: string;
  language: string;
}

const INITIAL_HISTORY: HistoryEntry[] = [
  {
    id: 'h-1',
    type: 'chat',
    title: 'NADRA Smart NIC renewal guidelines',
    subtitle: 'Detailed verification of required documents, fees (PKR 1,500 executive), and processing timeline.',
    module: 'Government Assistant',
    targetPage: 'government',
    timestamp: '15 mins ago',
    language: 'Urdu',
  },
  {
    id: 'h-2',
    type: 'translate',
    title: 'Residential Lease Agreement Clause 4',
    subtitle: 'Translated 3 paragraphs from English legal terminology into clear Pakistani Pashto.',
    module: 'Live Translator',
    targetPage: 'translate',
    timestamp: '1 hour ago',
    language: 'Pashto',
  },
  {
    id: 'h-3',
    type: 'document',
    title: 'LESCO Electricity Bill Scan (August 2026)',
    subtitle: 'Extracted consumer ref 08-11254-0984321, units 384 kWh, due date 22-Aug, total PKR 18,930.',
    module: 'Document Intelligence',
    targetPage: 'documents',
    timestamp: '3 hours ago',
    language: 'English / Urdu',
  },
  {
    id: 'h-4',
    type: 'chat',
    title: 'Matric Class 9 Physics: Newton’s 3rd Law of Motion',
    subtitle: 'Generated bilingual concept notes and 5 interactive quiz questions with explanations.',
    module: 'AI Teacher',
    targetPage: 'teacher',
    timestamp: 'Yesterday',
    language: 'English',
  },
  {
    id: 'h-5',
    type: 'activity',
    title: 'Wheat leaf yellow rust diagnosis',
    subtitle: 'Identified fungal Puccinia striiformis symptoms and recommended propiconazole spray schedule.',
    module: 'Farmer Assistant',
    targetPage: 'farmer',
    timestamp: '2 days ago',
    language: 'Punjabi',
  },
  {
    id: 'h-6',
    type: 'translate',
    title: 'Medical Discharge Summary translation',
    subtitle: 'Translated prescription instructions and dosage timings from English to Sindhi.',
    module: 'Live Translator',
    targetPage: 'translate',
    timestamp: '3 days ago',
    language: 'Sindhi',
  },
];

function formatTimeAgo(isoString?: string): string {
  if (!isoString) return 'Just now';
  const diffMs = Date.now() - new Date(isoString).getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(isoString).toLocaleDateString();
}

export const HistoryPage: React.FC<HistoryPageProps> = ({ onSelectPage }) => {
  const { user, isAuthenticated } = useAuth();
  const [entries, setEntries] = useState<HistoryEntry[]>(() => {
    try {
      const saved = localStorage.getItem('paklingo_recent_history');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_HISTORY;
  });

  const [isLoadingCloud, setIsLoadingCloud] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const loadHistory = useCallback(async () => {
    let localList: HistoryEntry[] = [];
    try {
      const saved = localStorage.getItem('paklingo_recent_history');
      if (saved) localList = JSON.parse(saved);
    } catch {}

    if (!user?.id) {
      setEntries(localList.length > 0 ? localList : INITIAL_HISTORY);
      return;
    }

    setIsLoadingCloud(true);
    try {
      const firestoreConvs = await getUserConversationsFromFirestore(user.id);
      if (firestoreConvs && firestoreConvs.length > 0) {
        const cloudEntries: HistoryEntry[] = firestoreConvs.map((conv) => {
          let page: PageId = (conv.targetPage as PageId) || 'chat';
          if (!conv.targetPage) {
            const cat = (conv.category || '').toLowerCase();
            if (cat.includes('govern')) page = 'government';
            else if (cat.includes('teach')) page = 'teacher';
            else if (cat.includes('medic')) page = 'medical';
            else if (cat.includes('farm')) page = 'farmer';
            else if (cat.includes('legal')) page = 'legal';
            else if (cat.includes('trans')) page = 'translate';
            else if (cat.includes('doc')) page = 'documents';
          }

          return {
            id: conv.id || `conv_${Date.now()}`,
            type: (conv.type as any) || 'chat',
            title: conv.title,
            subtitle: conv.subtitle || '',
            module: conv.module || conv.category || 'PakLingo AI',
            targetPage: page,
            timestamp: formatTimeAgo(conv.createdAt),
            createdAt: conv.createdAt,
            language: conv.language || 'Urdu',
          };
        });

        // Merge cloud and local deduplicating by ID or title
        const map = new Map<string, HistoryEntry>();
        cloudEntries.forEach((e) => map.set(e.id, e));
        localList.forEach((e) => {
          if (!map.has(e.id) && !Array.from(map.values()).some((item) => item.title === e.title)) {
            map.set(e.id, e);
          }
        });

        const merged = Array.from(map.values());
        setEntries(merged);
        try {
          localStorage.setItem('paklingo_recent_history', JSON.stringify(merged));
        } catch {}
      } else if (localList.length > 0) {
        setEntries(localList);
      } else {
        setEntries(INITIAL_HISTORY);
      }
    } catch (err) {
      console.warn('Error fetching Firestore user history:', err);
      if (localList.length > 0) setEntries(localList);
    } finally {
      setIsLoadingCloud(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const filteredEntries = entries.filter((entry) => {
    const matchesType = filterType === 'all' || entry.type === filterType;
    const matchesSearch =
      searchQuery === '' ||
      entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.module.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const getDateGroup = (timestamp: string): { label: string; labelUrdu: string } => {
    if (timestamp.includes('m ago') || timestamp.includes('h ago') || timestamp.includes('min') || timestamp.includes('hour') || timestamp.toLowerCase() === 'just now') {
      return { label: 'Today', labelUrdu: 'آج' };
    }
    if (timestamp.toLowerCase().includes('yesterday')) {
      return { label: 'Yesterday', labelUrdu: 'گزشتہ روز' };
    }
    if (timestamp.includes('d ago') || timestamp.includes('day')) {
      return { label: 'Earlier this week', labelUrdu: 'اس ہفتے' };
    }
    return { label: 'Older', labelUrdu: 'پہلے' };
  };

  // Group filtered entries by date
  const groupedEntries = filteredEntries.reduce<Record<string, { meta: { label: string; labelUrdu: string }; items: HistoryEntry[] }>>((acc, entry) => {
    const group = getDateGroup(entry.timestamp);
    if (!acc[group.label]) {
      acc[group.label] = { meta: group, items: [] };
    }
    acc[group.label].items.push(entry);
    return acc;
  }, {});

  const handleDeleteItem = async (e: React.MouseEvent, entryId: string) => {
    e.stopPropagation();
    setEntries((prev) => {
      const updated = prev.filter((item) => item.id !== entryId);
      try {
        localStorage.setItem('paklingo_recent_history', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    if (user?.id && !entryId.startsWith('h-')) {
      await deleteConversationFromFirestore(entryId);
    }
  };

  const handleClearHistory = async () => {
    if (window.confirm('Clear all recent activity history?')) {
      setEntries([]);
      try {
        localStorage.removeItem('paklingo_recent_history');
      } catch {}

      if (user?.id) {
        await clearUserConversationsFromFirestore(user.id);
      }
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'chat':
        return <MessageSquare className="w-4 h-4 text-[var(--accent)]" />;
      case 'translate':
        return <Languages className="w-4 h-4 text-[var(--accent)]" />;
      case 'document':
        return <FileText className="w-4 h-4 text-[var(--accent)]" />;
      default:
        return <Activity className="w-4 h-4 text-[var(--accent)]" />;
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 sm:py-12 space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)]">
              Activity & History
            </h1>
            {user && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--accent)] bg-[var(--accent)]/10 px-2.5 py-0.5 rounded-full">
                <Cloud className="w-3 h-3" />
                <span>Cloud Synced</span>
              </span>
            )}
          </div>
          <p className="text-[var(--text-muted)] text-sm sm:text-base">
            Review and resume your previous chats, translations, and processed documents.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {user && (
            <button
              type="button"
              onClick={loadHistory}
              disabled={isLoadingCloud}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-[var(--text-secondary)] bg-[var(--surface-secondary)] hover:bg-[var(--surface-hover)] border border-[var(--border)] transition-all cursor-pointer active:scale-95 shadow-2xs disabled:opacity-50"
              title="Refresh from cloud"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingCloud ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          )}

          {entries.length > 0 && (
            <button
              type="button"
              onClick={handleClearHistory}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-[var(--text-muted)] hover:text-red-500 bg-[var(--surface-secondary)] hover:bg-[var(--surface-hover)] border border-[var(--border)] transition-all cursor-pointer active:scale-95 shadow-2xs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear History</span>
            </button>
          )}
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar">
          {[
            { id: 'all', label: 'All Activity' },
            { id: 'chat', label: 'Chats' },
            { id: 'translate', label: 'Translations' },
            { id: 'document', label: 'Documents' },
            { id: 'activity', label: 'Actions' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterType(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap active:scale-95 ${
                filterType === tab.id
                  ? 'bg-[var(--accent)] text-white shadow-xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] bg-[var(--surface-secondary)] border border-[var(--border)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter history..."
            className="w-full pl-9 pr-3.5 py-2 bg-[var(--surface-secondary)] border border-[var(--border)] rounded-xl text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15 transition-all"
          />
        </div>
      </div>

      {/* History List Table with Date Grouping */}
      {filteredEntries.length > 0 ? (
        <div className="space-y-6">
          {Object.entries(groupedEntries).map(([groupTitle, { meta, items }]) => (
            <div key={groupTitle} className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">
                    {meta.label}
                  </span>
                  <span className="text-xs text-[var(--text-muted)] font-urdu font-medium" dir="rtl">
                    ({meta.labelUrdu})
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-[var(--text-muted)] bg-[var(--surface-secondary)] px-2.5 py-0.5 rounded-full border border-[var(--border)]">
                  {items.length} {items.length === 1 ? 'item' : 'items'}
                </span>
              </div>

              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden divide-y divide-[var(--border)] shadow-xs">
                {items.map((entry) => (
                  <motion.div
                    key={entry.id}
                    whileHover={{ backgroundColor: 'var(--surface-hover)' }}
                    onClick={() => onSelectPage(entry.targetPage)}
                    className="p-4 sm:p-5 flex items-start sm:items-center justify-between gap-4 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] text-[var(--accent)] flex items-center justify-center shrink-0 mt-0.5 sm:mt-0 shadow-2xs group-hover:border-[var(--accent)] transition-colors">
                        {getTypeIcon(entry.type)}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-sm font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors truncate">
                            {entry.title}
                          </span>
                          <span className="text-[11px] font-semibold text-[var(--text-secondary)] bg-[var(--surface-secondary)] px-2 py-0.5 rounded-lg border border-[var(--border)] shrink-0">
                            {entry.module}
                          </span>
                        </div>

                        <p className="text-xs text-[var(--text-muted)] line-clamp-1">
                          {entry.subtitle}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right hidden sm:block">
                        <div className="text-xs font-semibold text-[var(--text-primary)]">{entry.timestamp}</div>
                        <div className="text-[11px] text-[var(--text-muted)]">{entry.language}</div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => handleDeleteItem(e, entry.id)}
                        className="p-2 rounded-xl text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                        title="Delete item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <div className="w-8 h-8 rounded-xl bg-[var(--surface-secondary)] group-hover:bg-[var(--accent)] group-hover:text-white text-[var(--text-muted)] flex items-center justify-center transition-all shadow-2xs">
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-8 shadow-xs">
          <Clock className="w-8 h-8 text-[var(--text-muted)] mx-auto mb-3" />
          <p className="text-sm text-[var(--text-primary)] font-semibold">No activity records found</p>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Activity from Chat, Translate, and Document tools will be logged here.
          </p>
        </div>
      )}
    </div>
  );
};

