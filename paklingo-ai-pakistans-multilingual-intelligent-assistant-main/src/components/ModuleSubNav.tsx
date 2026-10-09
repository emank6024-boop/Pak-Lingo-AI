import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  ChevronRight,
  ChevronDown,
  Building2,
  GraduationCap,
  HeartPulse,
  Sprout,
  Scale,
  ShieldAlert,
  HandHelping,
  Mic,
} from 'lucide-react';
import { PageId } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface ModuleSubNavProps {
  currentPage: PageId;
  onSelectPage: (page: PageId) => void;
}

const SUB_TOOL_ITEMS: { id: PageId; key: string; nameFallback: string; icon: React.ReactNode }[] = [
  { id: 'government', key: 'tools.government', nameFallback: 'Government Services', icon: <Building2 className="w-3.5 h-3.5" /> },
  { id: 'teacher', key: 'tools.teacher', nameFallback: 'AI Teacher', icon: <GraduationCap className="w-3.5 h-3.5" /> },
  { id: 'medical', key: 'tools.medical', nameFallback: 'Medical Assistant', icon: <HeartPulse className="w-3.5 h-3.5" /> },
  { id: 'farmer', key: 'tools.farmer', nameFallback: 'Farmer AI', icon: <Sprout className="w-3.5 h-3.5" /> },
  { id: 'legal', key: 'tools.legal', nameFallback: 'Legal Assistant', icon: <Scale className="w-3.5 h-3.5" /> },
  { id: 'fake-news', key: 'tools.fakeNews', nameFallback: 'Fact Checker', icon: <ShieldAlert className="w-3.5 h-3.5" /> },
  { id: 'sign-language', key: 'tools.signLanguage', nameFallback: 'Sign Language', icon: <HandHelping className="w-3.5 h-3.5" /> },
  { id: 'voice-assistant', key: 'tools.voiceAssistant', nameFallback: 'Voice Mode', icon: <Mic className="w-3.5 h-3.5" /> },
];

export const ModuleSubNav: React.FC<ModuleSubNavProps> = ({
  currentPage,
  onSelectPage,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { t, isRTL } = useLanguage();
  const activeTool = SUB_TOOL_ITEMS.find((m) => m.id === currentPage);

  // Only display sub-nav when viewing one of the specialized sub-tools
  if (!activeTool) {
    return null;
  }

  const activeToolName = t(activeTool.key) || activeTool.nameFallback;

  return (
    <div className="bg-[var(--surface-secondary)] border-b border-[var(--border)] px-4 py-2 sticky top-16 z-40 text-[var(--text-secondary)] shadow-2xs backdrop-blur-xs" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Breadcrumb path */}
        <div className="flex items-center gap-2 text-xs shrink-0">
          <button
            onClick={() => onSelectPage('tools')}
            className="inline-flex items-center gap-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer font-medium py-1 px-1.5 -ml-1.5 rounded-md hover:bg-[var(--surface-hover)]"
          >
            <ArrowLeft className={`w-3.5 h-3.5 ${isRTL ? 'rotate-180' : ''}`} />
            <span>{t('nav.tools') || 'Tools'}</span>
          </button>
          <ChevronRight className={`w-3 h-3 text-[var(--text-muted)] ${isRTL ? 'rotate-180' : ''}`} />
          <div className="flex items-center gap-1.5 text-[var(--text-primary)] font-semibold">
            <span className="text-[var(--accent)]">{activeTool.icon}</span>
            <span>{activeToolName}</span>
          </div>
        </div>

        {/* Desktop Quick Category Strip */}
        <div className="hidden md:flex items-center gap-1 overflow-x-auto custom-scrollbar py-0.5">
          {SUB_TOOL_ITEMS.map((item) => {
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectPage(item.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs transition-all duration-150 cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-[var(--surface)] text-[var(--accent)] font-semibold border border-[var(--border)] shadow-xs'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]'
                }`}
              >
                <span className={isActive ? 'text-[var(--accent)]' : 'opacity-70'}>{item.icon}</span>
                <span>{t(item.key) || item.nameFallback}</span>
              </button>
            );
          })}
        </div>

        {/* Mobile / Tablet Quick Switcher Dropdown */}
        <div className="relative shrink-0">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--accent)] text-xs text-[var(--text-primary)] transition-colors cursor-pointer shadow-xs active:scale-95"
            aria-expanded={isDropdownOpen}
          >
            <span>{t('tools.switchTool') || 'Switch Tool'}</span>
            <ChevronDown className={`w-3 h-3 text-[var(--text-muted)] transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {isDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsDropdownOpen(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.98 }}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                  className="absolute right-0 mt-2 w-56 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xl py-1.5 z-50 max-h-80 overflow-y-auto custom-scrollbar"
                >
                  <div className="px-3 py-1 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider border-b border-[var(--border)]">
                    All Specialized Modules
                  </div>
                  {SUB_TOOL_ITEMS.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        onSelectPage(item.id);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left hover:bg-[var(--surface-hover)] transition-colors cursor-pointer ${
                        currentPage === item.id
                          ? 'text-[var(--accent)] bg-[var(--surface-secondary)] font-semibold'
                          : 'text-[var(--text-secondary)]'
                      }`}
                    >
                      <span className={currentPage === item.id ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'}>
                        {item.icon}
                      </span>
                      <span>{t(item.key) || item.nameFallback}</span>
                    </button>
                  ))}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
