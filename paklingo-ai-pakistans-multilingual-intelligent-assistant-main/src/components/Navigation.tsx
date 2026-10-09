import React, { useState } from 'react';
import {
  Home,
  BotMessageSquare,
  Building2,
  GraduationCap,
  HeartPulse,
  Sprout,
  Scale,
  ShieldAlert,
  FileText,
  Languages,
  HandHelping,
  Mic,
  LayoutDashboard,
  Settings,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  X,
  Radio,
  Sliders,
} from 'lucide-react';
import { PageId, LanguageCode } from '../types';
import { NAV_ITEMS, SUPPORTED_LANGUAGES } from '../data/languages';
import { useVoiceSettings } from '../context/VoiceSettingsContext';

interface NavigationProps {
  currentPage: PageId;
  onSelectPage: (page: PageId) => void;
  selectedLanguage: LanguageCode;
  onSelectLanguage: (lang: LanguageCode) => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  simpleMode: boolean;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  Home: <Home className="w-4 h-4 shrink-0" />,
  BotMessageSquare: <BotMessageSquare className="w-4 h-4 shrink-0" />,
  Building2: <Building2 className="w-4 h-4 shrink-0" />,
  GraduationCap: <GraduationCap className="w-4 h-4 shrink-0" />,
  HeartPulse: <HeartPulse className="w-4 h-4 shrink-0" />,
  Sprout: <Sprout className="w-4 h-4 shrink-0" />,
  Scale: <Scale className="w-4 h-4 shrink-0" />,
  ShieldAlert: <ShieldAlert className="w-4 h-4 shrink-0" />,
  FileText: <FileText className="w-4 h-4 shrink-0" />,
  Languages: <Languages className="w-4 h-4 shrink-0" />,
  HandHelping: <HandHelping className="w-4 h-4 shrink-0" />,
  Mic: <Mic className="w-4 h-4 shrink-0" />,
  LayoutDashboard: <LayoutDashboard className="w-4 h-4 shrink-0" />,
  Settings: <Settings className="w-4 h-4 shrink-0" />,
};

// Distinct badge / accent colors for specific categories
const ITEM_ACCENTS: Record<string, { light: string; dark: string; dot: string }> = {
  government: { light: 'text-sky-300', dark: 'text-sky-400', dot: 'bg-sky-400' },
  teacher: { light: 'text-indigo-300', dark: 'text-indigo-400', dot: 'bg-indigo-400' },
  medical: { light: 'text-rose-300', dark: 'text-rose-400', dot: 'bg-rose-400' },
  farmer: { light: 'text-emerald-300', dark: 'text-emerald-400', dot: 'bg-emerald-400' },
  legal: { light: 'text-amber-300', dark: 'text-amber-400', dot: 'bg-amber-400' },
  'fake-news': { light: 'text-purple-300', dark: 'text-purple-400', dot: 'bg-purple-400' },
  'ocr-documents': { light: 'text-cyan-300', dark: 'text-cyan-400', dot: 'bg-cyan-400' },
  translator: { light: 'text-teal-300', dark: 'text-teal-400', dot: 'bg-teal-400' },
  'sign-language': { light: 'text-pink-300', dark: 'text-pink-400', dot: 'bg-pink-400' },
  'voice-assistant': { light: 'text-emerald-300', dark: 'text-emerald-400', dot: 'bg-emerald-400' },
};

export const Navigation: React.FC<NavigationProps> = ({
  currentPage,
  onSelectPage,
  selectedLanguage,
  isMobileOpen,
  onCloseMobile,
  simpleMode,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const currentLangObj = SUPPORTED_LANGUAGES.find((l) => l.code === selectedLanguage) || SUPPORTED_LANGUAGES[0];
  const { openVoiceModal } = useVoiceSettings();

  // 5 Logical navigation groups according to Section 4
  const GROUPS = [
    {
      title: 'MAIN',
      titleUrdu: 'مرکزی',
      ids: ['home', 'ai-assistant', 'dashboard'],
    },
    {
      title: 'SERVICES',
      titleUrdu: 'شہری خدمات',
      ids: ['government', 'teacher', 'medical', 'farmer', 'legal'],
    },
    {
      title: 'INTELLIGENCE',
      titleUrdu: 'ذہانت و اوزار',
      ids: ['fake-news', 'ocr-documents', 'translator'],
    },
    {
      title: 'ACCESSIBILITY',
      titleUrdu: 'رسائی و معاونت',
      ids: ['sign-language', 'voice-assistant'],
    },
    {
      title: 'SYSTEM',
      titleUrdu: 'نظام',
      ids: ['settings'],
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          id="mobile-nav-backdrop"
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        id="main-sidebar"
        className={`fixed top-0 bottom-0 left-0 z-50 bg-[#013516] dark:bg-slate-950 text-white flex flex-col flex-shrink-0 border-r border-emerald-900/60 dark:border-slate-800 shadow-xl transition-all duration-300 ease-in-out lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0 w-72' : isCollapsed ? 'lg:w-20 -translate-x-full' : 'lg:w-64 -translate-x-full'
        }`}
        aria-label="Main Navigation"
      >
        {/* Brand Header */}
        <div className="h-16 px-4 border-b border-emerald-900/80 dark:border-slate-800/80 flex items-center justify-between flex-shrink-0">
          <button
            onClick={() => {
              onSelectPage('home');
              onCloseMobile();
            }}
            className="flex items-center gap-3 text-left group min-w-0 cursor-pointer"
            id="brand-logo-btn"
            title="PakLingo AI Home"
          >
            {/* National emblem inspired P logo */}
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-white to-emerald-100 dark:from-emerald-400 dark:to-emerald-600 flex items-center justify-center shadow-md shrink-0 group-hover:scale-105 transition-transform">
              <span className="text-[#01411C] dark:text-slate-950 font-black text-xl leading-none">
                P
              </span>
            </div>

            {(!isCollapsed || isMobileOpen) && (
              <div className="min-w-0 overflow-hidden">
                <div className="flex items-center gap-1.5">
                  <h1 className="text-base font-extrabold tracking-tight text-white uppercase leading-none">
                    PAKLINGO AI
                  </h1>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    PK
                  </span>
                </div>
                <p className="text-[10px] text-emerald-200/80 dark:text-slate-400 font-medium truncate mt-1">
                  Empowering Every Pakistani
                </p>
              </div>
            )}
          </button>

          {/* Mobile close button */}
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 text-emerald-200 hover:text-white hover:bg-white/10 rounded-lg cursor-pointer"
            aria-label="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Desktop collapse toggle */}
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="hidden lg:flex p-1.5 text-emerald-300/80 hover:text-white hover:bg-emerald-900/60 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
            </button>
          )}
        </div>

        {/* Scrollable Navigation Groups */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-4 custom-scrollbar">
          {GROUPS.map((group) => {
            const groupItems = NAV_ITEMS.filter((item) => group.ids.includes(item.id));
            if (groupItems.length === 0) return null;

            return (
              <div key={group.title} className="space-y-1">
                {(!isCollapsed || isMobileOpen) ? (
                  <div className="flex items-center justify-between px-2.5 pt-1 pb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300/80 dark:text-slate-400">
                      {group.title}
                    </span>
                    <span className="text-[10px] font-urdu text-emerald-400/60 dark:text-slate-500">
                      {group.titleUrdu}
                    </span>
                  </div>
                ) : (
                  <div className="h-px bg-emerald-900/60 dark:bg-slate-800 my-2 mx-1" />
                )}

                <div className="space-y-0.5">
                  {groupItems.map((item) => {
                    const isActive = currentPage === item.id;
                    const icon = ICON_MAP[item.icon] || <Sparkles className="w-4 h-4" />;
                    const accent = ITEM_ACCENTS[item.id];

                    return (
                      <div key={item.id} className="relative group/navitem">
                        <button
                          id={`nav-link-${item.id}`}
                          onClick={() => {
                            onSelectPage(item.id);
                            onCloseMobile();
                          }}
                          className={`w-full flex items-center rounded-xl text-left transition-all duration-150 active:scale-[0.98] cursor-pointer ${
                            isCollapsed && !isMobileOpen
                              ? 'justify-center p-2.5'
                              : 'justify-between px-3 py-2'
                          } ${
                            isActive
                              ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 dark:from-emerald-600 dark:to-teal-700 text-white font-bold shadow-md shadow-emerald-950/40'
                              : 'text-emerald-100/85 dark:text-slate-300 hover:bg-white/10 dark:hover:bg-slate-800/80 hover:text-white font-medium'
                          } ${simpleMode ? 'py-3 text-sm' : 'text-xs'}`}
                          title={isCollapsed && !isMobileOpen ? `${item.labelEn} (${item.labelUrdu})` : undefined}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              className={`${
                                isActive
                                  ? 'text-white'
                                  : accent
                                  ? accent.light
                                  : 'text-emerald-300 dark:text-slate-400'
                              } transition-colors`}
                            >
                              {icon}
                            </div>

                            {(!isCollapsed || isMobileOpen) && (
                              <span className="truncate">{item.labelEn}</span>
                            )}
                          </div>

                          {(!isCollapsed || isMobileOpen) && item.labelUrdu && (
                            <span
                              className={`text-[11px] font-urdu truncate shrink-0 ml-1.5 ${
                                isActive ? 'text-emerald-100' : 'text-emerald-300/60 dark:text-slate-500'
                              }`}
                            >
                              {item.labelUrdu}
                            </span>
                          )}

                          {/* Active dot indicator when collapsed */}
                          {isCollapsed && !isMobileOpen && isActive && (
                            <span className="absolute left-1 top-1/2 -translate-y-1/2 w-1 h-5 rounded-full bg-white" />
                          )}
                        </button>

                        {/* Hover Tooltip when collapsed on desktop */}
                        {isCollapsed && !isMobileOpen && (
                          <div className="hidden lg:group-hover/navitem:flex absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 bg-slate-900 dark:bg-slate-800 text-white text-xs px-3 py-1.5 rounded-lg shadow-xl border border-slate-700 whitespace-nowrap items-center gap-2 pointer-events-none animate-in fade-in zoom-in-95 duration-100">
                            <span className="font-bold">{item.labelEn}</span>
                            <span className="text-[10px] font-urdu text-emerald-300">
                              {item.labelUrdu}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Sidebar Footer: Quick Voice Settings & Citizen Dialect Status */}
        <div className="p-3 border-t border-emerald-900/80 dark:border-slate-800 bg-emerald-950/50 dark:bg-slate-900/60 flex-shrink-0">
          {(!isCollapsed || isMobileOpen) ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-emerald-600/80 border border-emerald-400/40 flex items-center justify-center font-bold text-white text-[11px] shrink-0">
                    PK
                  </div>
                  <div className="min-w-0 truncate">
                    <p className="font-semibold text-white truncate text-xs">
                      {currentLangObj.name}
                    </p>
                    <p className="text-[10px] font-urdu text-emerald-300 dark:text-slate-400 truncate">
                      {currentLangObj.nativeName} • فعال
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={openVoiceModal}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-emerald-200 hover:text-white transition-colors cursor-pointer"
                  title="Voice & Speech Settings"
                  aria-label="Voice & Speech Settings"
                >
                  <Sliders className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex items-center gap-1.5 text-[10px] text-emerald-300/80 dark:text-slate-400 px-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="truncate">AI Engine Ready • Pakistani Voices</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={openVoiceModal}
                className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-emerald-200 flex items-center justify-center transition-colors cursor-pointer"
                title="Voice & Speech Settings"
                aria-label="Voice & Speech Settings"
              >
                <Sliders className="w-4 h-4" />
              </button>
              <span className="w-2 h-2 rounded-full bg-emerald-400" title="Online" />
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
