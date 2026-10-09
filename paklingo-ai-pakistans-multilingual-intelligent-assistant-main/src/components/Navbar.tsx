import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Menu,
  X,
  Globe2,
  ChevronDown,
  Volume2,
  Settings as SettingsIcon,
  LogOut,
  User,
  Sun,
  Moon,
  Sparkles,
  ShieldCheck,
  FileText,
  Languages,
  Bot,
  LayoutGrid,
  Check,
} from 'lucide-react';
import { PageId, LanguageCode } from '../types';
import { SUPPORTED_LANGUAGES } from '../data/languages';
import { useAuth } from '../context/AuthContext';
import { useVoiceSettings } from '../context/VoiceSettingsContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

interface NavbarProps {
  currentPage: PageId;
  onSelectPage: (page: PageId) => void;
  selectedLanguage: LanguageCode;
  onSelectLanguage: (lang: LanguageCode) => void;
  onScrollToSection?: (sectionId: string) => void;
  onOpenAuthModal?: () => void;
}

interface NavItem {
  id: PageId;
  label: string;
  labelUrdu: string;
  icon?: React.ComponentType<{ className?: string }>;
  matchIds?: PageId[];
}

const NAV_ITEMS: NavItem[] = [
  { id: 'home', label: 'Home', labelUrdu: 'ہوم' },
  { id: 'chat', label: 'Assistant', matchIds: ['chat', 'ai-assistant'], labelUrdu: 'معاون چیٹ' },
  { id: 'translate', label: 'Translator', matchIds: ['translate', 'translator'], labelUrdu: 'مترجم' },
  { id: 'documents', label: 'Documents', matchIds: ['documents', 'ocr-documents'], labelUrdu: 'دستاویزات' },
  { id: 'fake-news', label: 'Fact Check', matchIds: ['fake-news'], labelUrdu: 'حقائق کی تصدیق' },
  {
    id: 'tools',
    label: 'Modules',
    matchIds: [
      'tools',
      'government',
      'teacher',
      'medical',
      'farmer',
      'legal',
      'sign-language',
      'voice-assistant',
      'history',
      'dashboard',
    ],
    labelUrdu: 'تمام ماڈیولز',
  },
  { id: 'settings', label: 'Accessibility', matchIds: ['settings'], labelUrdu: 'ترتیبات' },
];

export const Navbar: React.FC<NavbarProps> = ({
  currentPage,
  onSelectPage,
  selectedLanguage,
  onSelectLanguage,
  onOpenAuthModal,
}) => {
  const { user, logout } = useAuth();
  const { openVoiceModal } = useVoiceSettings();
  const { t, setSelectedLanguage: setGlobalLanguage, isRTL } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const activeLang =
    SUPPORTED_LANGUAGES.find((l) => l.code === selectedLanguage) ||
    SUPPORTED_LANGUAGES[0];

  const isItemActive = (item: NavItem) => {
    if (item.matchIds) {
      return item.matchIds.includes(currentPage);
    }
    return item.id === currentPage;
  };

  const handleNavClick = (pageId: PageId) => {
    onSelectPage(pageId);
    setIsMobileMenuOpen(false);
  };

  return (
    <header
      id="main-navbar"
      className="sticky top-0 z-50 transition-all duration-200 border-b border-[#132438] bg-[#09131e] text-white"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Tagline */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleNavClick('home')}
              className="flex items-center gap-3 cursor-pointer focus:outline-none group text-left"
              aria-label="PakLingo AI Home"
            >
              <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shadow-xs group-hover:border-emerald-400/60 transition-colors">
                <span className="text-emerald-400 font-extrabold text-xs tracking-tight">PK</span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-base font-bold tracking-tight text-white">
                    PakLingo <span className="text-emerald-400 font-semibold">AI</span>
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse hidden sm:inline-block" />
                </div>
                <span className="hidden xl:inline text-[10px] text-slate-400 font-normal tracking-tight">
                  Empowering Every Pakistani Through AI, Language, and Accessibility
                </span>
              </div>
            </button>
          </div>

              {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1" aria-label="Main Navigation">
            {NAV_ITEMS.map((item) => {
              const active = isItemActive(item);
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`relative px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer ${
                    active
                      ? 'bg-emerald-500 text-white font-semibold shadow-xs'
                      : 'text-slate-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {isRTL ? item.labelUrdu : item.label}
                </button>
              );
            })}
          </nav>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2">
            {/* Theme Toggle (Light / Dark) */}
            <button
              type="button"
              onClick={toggleTheme}
              title={`Switch theme (Current: ${theme})`}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
              aria-label="Toggle visual theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-emerald-400" />}
            </button>

            {/* Speech Settings Quick Toggle */}
            <button
              type="button"
              onClick={openVoiceModal}
              title="Voice & Speech Settings"
              className="p-1.5 rounded-lg text-slate-300 hover:text-emerald-400 hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
              aria-label="Voice and speech settings"
            >
              <Volume2 className="w-4 h-4" />
            </button>

            {/* Language Selector Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 active:scale-95 border border-white/20 text-xs text-white transition-all cursor-pointer"
                aria-label="Select interface language"
              >
                <Globe2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline font-medium">{activeLang.name}</span>
                <span className="sm:hidden font-medium">{activeLang.code.toUpperCase()}</span>
                <ChevronDown className={`w-3 h-3 text-slate-300 transition-transform duration-200 ${isLangDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {isLangDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setIsLangDropdownOpen(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: -6, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.98 }}
                      transition={{ duration: 0.15, ease: 'easeOut' }}
                      className="absolute right-0 mt-2 w-64 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-2xl py-1.5 z-50 max-h-88 overflow-y-auto custom-scrollbar"
                    >
                      <div className="px-3 py-1.5 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider border-b border-[var(--border)]">
                        Pakistani Languages
                      </div>
                      {SUPPORTED_LANGUAGES.map((lang) => {
                        const isSelected = selectedLanguage === lang.code;
                        return (
                          <button
                            key={lang.code}
                            type="button"
                            onClick={() => {
                              onSelectLanguage(lang.code);
                              setGlobalLanguage(lang.code);
                              setIsLangDropdownOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left hover:bg-[var(--surface-hover)] transition-colors cursor-pointer ${
                              isSelected
                                ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 font-semibold'
                                : 'text-[var(--text-primary)]'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {isSelected && <Check className="w-3.5 h-3.5 text-emerald-500" />}
                              <span className="font-medium">{lang.name}</span>
                            </div>
                            <span className="text-[var(--text-muted)] font-urdu text-[11px]" dir="rtl">
                              {lang.nativeName}
                            </span>
                          </button>
                        );
                      })}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Accessibility / Settings Page Button */}
            <button
              type="button"
              onClick={() => handleNavClick('settings')}
              title="Accessibility & Settings"
              className={`p-1.5 rounded-lg active:scale-95 transition-all cursor-pointer ${
                currentPage === 'settings'
                  ? 'bg-emerald-500 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
              aria-label="Settings"
            >
              <SettingsIcon className="w-4 h-4" />
            </button>

            {/* User / Profile & Logout OR Login / Sign Up */}
            {user ? (
              <div className="flex items-center gap-2">
                <div
                  className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-white/5 border border-white/10"
                  title={`Signed in as ${user.name || user.email}`}
                >
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name || user.email}
                      referrerPolicy="no-referrer"
                      className="w-5 h-5 rounded-full object-cover border border-white/20 shrink-0"
                    />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] flex items-center justify-center font-bold shrink-0 border border-emerald-500/30">
                      {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                  )}
                  <span className="text-xs text-slate-200 hidden lg:inline max-w-[100px] truncate font-medium">
                    {user.name || user.email?.split('@')[0]}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={logout}
                  title={`Signed in as ${user.email || 'User'}. Click to Log out`}
                  className="p-1.5 rounded-lg text-slate-300 hover:text-rose-400 hover:bg-white/10 active:scale-95 transition-all cursor-pointer hidden sm:block"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                id="nav-login-btn"
                onClick={onOpenAuthModal}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-xs font-semibold text-white shadow-xs transition-all cursor-pointer"
              >
                <User className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{isRTL ? 'لاگ ان' : 'Login / Sign Up'}</span>
                <span className="sm:hidden">{isRTL ? 'لاگ ان' : 'Login'}</span>
              </button>
            )}

            {/* Mobile Hamburger Toggle */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-1.5 rounded-lg text-slate-200 hover:text-white hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="lg:hidden border-t border-[#132438] bg-[#09131e] px-4 py-3 space-y-1 overflow-hidden"
          >
            {NAV_ITEMS.map((item) => {
              const active = isItemActive(item);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full text-left px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                    active
                      ? 'bg-emerald-500 text-white font-semibold'
                      : 'text-slate-200 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {isRTL ? item.labelUrdu : item.label}
                </button>
              );
            })}
            {user ? (
              <div className="pt-2 border-t border-[#132438] mt-2 space-y-2">
                <div className="px-3 py-1 flex items-center gap-2.5 text-xs text-slate-300">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name || user.email}
                      referrerPolicy="no-referrer"
                      className="w-6 h-6 rounded-full object-cover border border-white/20 shrink-0"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-300 text-xs flex items-center justify-center font-bold shrink-0 border border-emerald-500/30">
                      {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                  )}
                  <div className="truncate min-w-0">
                    <p className="font-semibold text-white truncate">{user.name || user.email?.split('@')[0]}</p>
                    <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm text-rose-300 hover:bg-white/10 flex items-center gap-2 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log out</span>
                </button>
              </div>
            ) : (
              <div className="pt-2 border-t border-[#132438] mt-2">
                <button
                  type="button"
                  id="mobile-nav-login-btn"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onOpenAuthModal?.();
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-semibold text-sm transition-all cursor-pointer shadow-xs"
                >
                  <User className="w-4 h-4" />
                  <span>{isRTL ? 'لاگ ان / اکاؤنٹ بنائیں' : 'Login / Sign Up'}</span>
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
