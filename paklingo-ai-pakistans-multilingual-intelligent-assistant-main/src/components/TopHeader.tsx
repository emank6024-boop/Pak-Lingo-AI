import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  Globe2,
  Mic,
  SlidersHorizontal,
  ChevronDown,
  Check,
  Eye,
  Type,
  Sun,
  Moon,
  Monitor,
  ShieldCheck,
  Volume2,
  Sparkles,
} from 'lucide-react';
import { PageId, LanguageCode, AccessibilitySettings } from '../types';
import { SUPPORTED_LANGUAGES, NAV_ITEMS, UI_TRANSLATIONS } from '../data/languages';
import { useTheme, THEMES_LIST, ThemeName } from '../context/ThemeContext';
import { useVoiceSettings } from '../context/VoiceSettingsContext';

interface TopHeaderProps {
  currentPage: PageId;
  onSelectPage: (page: PageId) => void;
  selectedLanguage: LanguageCode;
  onSelectLanguage: (lang: LanguageCode) => void;
  onToggleMobileNav: () => void;
  accessibility: AccessibilitySettings;
  onUpdateAccessibility: (settings: Partial<AccessibilitySettings>) => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  currentPage,
  onSelectPage,
  selectedLanguage,
  onSelectLanguage,
  onToggleMobileNav,
  accessibility,
  onUpdateAccessibility,
}) => {
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [isAccessOpen, setIsAccessOpen] = useState(false);
  const [isThemeOpen, setIsThemeOpen] = useState(false);

  const langRef = useRef<HTMLDivElement>(null);
  const accessRef = useRef<HTMLDivElement>(null);
  const themeRef = useRef<HTMLDivElement>(null);

  const { theme, resolvedTheme, setTheme } = useTheme();
  const { openVoiceModal } = useVoiceSettings();

  const activeNavItem = NAV_ITEMS.find((n) => n.id === currentPage) || NAV_ITEMS[0];
  const activeLang = SUPPORTED_LANGUAGES.find((l) => l.code === selectedLanguage) || SUPPORTED_LANGUAGES[0];
  const t = UI_TRANSLATIONS[selectedLanguage] || UI_TRANSLATIONS.en;

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(event.target as Node)) {
        setIsLangOpen(false);
      }
      if (accessRef.current && !accessRef.current.contains(event.target as Node)) {
        setIsAccessOpen(false);
      }
      if (themeRef.current && !themeRef.current.contains(event.target as Node)) {
        setIsThemeOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header
      id="app-top-header"
      className="h-16 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-3 sm:px-6 sticky top-0 z-30 transition-colors"
    >
      {/* Left: Mobile Menu Toggle, Status Pill & Breadcrumb */}
      <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
        <button
          id="mobile-menu-button"
          onClick={onToggleMobileNav}
          className="p-2 -ml-1 text-slate-700 dark:text-slate-300 hover:text-emerald-800 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl lg:hidden transition-colors cursor-pointer"
          aria-label="Open Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* System Online Status Badge */}
        <div className="flex items-center gap-2 bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-semibold text-emerald-900 dark:text-emerald-200 shrink-0">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600 dark:bg-emerald-400" />
          </span>
          <span className="hidden xs:inline">System Active</span>
          <span className="text-[11px] font-urdu text-emerald-700 dark:text-emerald-300">
            فعال
          </span>
        </div>

        {/* Active Page Breadcrumb */}
        <div className="hidden sm:flex items-center gap-2 min-w-0">
          <span className="text-slate-300 dark:text-slate-700 font-bold">•</span>
          <span className="font-bold text-slate-800 dark:text-slate-100 text-xs sm:text-sm truncate">
            {activeNavItem.labelEn}
          </span>
          {activeNavItem.labelUrdu && (
            <span className="text-xs font-urdu text-emerald-700 dark:text-emerald-400 hidden md:inline">
              ({activeNavItem.labelUrdu})
            </span>
          )}
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-1.5 sm:gap-2.5">
        {/* Language Selector Dropdown */}
        <div className="relative" ref={langRef}>
          <button
            id="header-language-dropdown-toggle"
            onClick={() => setIsLangOpen(!isLangOpen)}
            className="flex items-center gap-1.5 text-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl px-2.5 sm:px-3 py-1.5 font-semibold text-slate-800 dark:text-slate-200 transition-colors cursor-pointer border border-transparent hover:border-slate-300 dark:hover:border-slate-700"
            aria-haspopup="listbox"
            aria-expanded={isLangOpen}
            title="Select Pakistani Dialect"
          >
            <span className="text-sm">{activeLang.flagEmoji}</span>
            <span className="max-w-[80px] sm:max-w-[100px] truncate">{activeLang.name}</span>
            <span className="text-[11px] font-urdu text-emerald-700 dark:text-emerald-400 hidden sm:inline">
              ({activeLang.nativeName})
            </span>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform ${isLangOpen ? 'rotate-180' : ''}`} />
          </button>

          {isLangOpen && (
            <div
              id="header-language-menu"
              className="absolute right-0 mt-2 w-64 max-h-84 overflow-y-auto bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 custom-scrollbar"
              role="listbox"
            >
              <div className="px-3.5 py-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Select Pakistani Language
                </p>
                <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-urdu">
                  ۱۰ علاقائی و قومی زبانیں
                </p>
              </div>

              {SUPPORTED_LANGUAGES.map((lang) => {
                const isSelected = lang.code === selectedLanguage;
                return (
                  <button
                    key={lang.code}
                    id={`lang-option-${lang.code}`}
                    onClick={() => {
                      onSelectLanguage(lang.code);
                      setIsLangOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2 text-left text-xs transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-[#01411C] dark:text-emerald-300 font-bold'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                    role="option"
                    aria-selected={isSelected}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-sm">{lang.flagEmoji}</span>
                      <div className="truncate">
                        <div className="font-semibold">{lang.name}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-urdu">
                          {lang.nativeName}
                        </div>
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Global Theme Switcher (Light / Dark / System) */}
        <div className="relative" ref={themeRef}>
          <button
            id="header-theme-toggle"
            onClick={() => setIsThemeOpen(!isThemeOpen)}
            className="w-9 h-9 rounded-xl flex items-center justify-center bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer border border-transparent hover:border-slate-300 dark:hover:border-slate-700"
            title={`Theme: ${theme} (${resolvedTheme})`}
            aria-label="Toggle Theme"
          >
            {resolvedTheme === 'dark' ? (
              <Moon className="w-4 h-4 text-amber-300" />
            ) : (
              <Sun className="w-4 h-4 text-amber-600" />
            )}
          </button>

          {isThemeOpen && (
            <div
              id="header-theme-menu"
              className="absolute right-0 mt-2 w-48 bg-[#14171c] rounded-2xl shadow-xl border border-neutral-700 p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-0.5"
            >
              {THEMES_LIST.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setTheme(t.id);
                    setIsThemeOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                    theme === t.id
                      ? 'bg-neutral-800 text-white'
                      : 'text-neutral-300 hover:bg-neutral-850 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full border border-black/30 shrink-0"
                      style={{ backgroundColor: t.accentPreview }}
                    />
                    <span>{t.name}</span>
                  </div>
                  {theme === t.id && <Check className="w-3.5 h-3.5 text-neutral-200" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Voice Assistant / Speech Settings Button */}
        <button
          id="header-voice-btn"
          onClick={openVoiceModal}
          className="w-9 h-9 rounded-xl flex items-center justify-center bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer border border-transparent hover:border-slate-300 dark:hover:border-slate-700"
          title="Natural Voice & Speech Settings"
          aria-label="Voice & Speech Settings"
        >
          <Volume2 className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
        </button>

        {/* Accessibility Quick Panel */}
        <div className="relative" ref={accessRef}>
          <button
            id="header-accessibility-toggle"
            onClick={() => setIsAccessOpen(!isAccessOpen)}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors cursor-pointer border ${
              accessibility.highContrast || accessibility.simpleMode || accessibility.fontSize !== 'md'
                ? 'bg-emerald-100 dark:bg-emerald-950/80 text-[#01411C] dark:text-emerald-300 border-emerald-400/80'
                : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-transparent'
            }`}
            title="Accessibility Quick Options"
            aria-label="Accessibility Options"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>

          {isAccessOpen && (
            <div
              id="header-accessibility-menu"
              className="absolute right-0 mt-2 w-76 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-4 z-50 space-y-3.5 animate-in fade-in zoom-in-95 duration-150"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                  {t.accessibilityMode || 'Accessibility'}
                </span>
                <button
                  onClick={() => {
                    onSelectPage('settings');
                    setIsAccessOpen(false);
                  }}
                  className="text-[11px] text-emerald-700 dark:text-emerald-400 hover:underline font-semibold"
                >
                  All Settings →
                </button>
              </div>

              {/* Font Size Selector */}
              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                  <Type className="w-3 h-3" />
                  {t.textSize || 'Text Scaling'}
                </label>
                <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs">
                  {(['sm', 'md', 'lg', 'xl'] as const).map((size) => (
                    <button
                      key={size}
                      onClick={() => onUpdateAccessibility({ fontSize: size })}
                      className={`py-1 rounded-lg font-semibold transition-colors ${
                        accessibility.fontSize === size
                          ? 'bg-white dark:bg-slate-700 text-emerald-900 dark:text-emerald-300 shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {size === 'sm' ? 'A' : size === 'md' ? 'A+' : size === 'lg' ? 'A++' : 'A+++'}
                    </button>
                  ))}
                </div>
              </div>

              {/* High Contrast Toggle */}
              <div className="flex items-center justify-between pt-1">
                <div className="text-xs">
                  <p className="font-semibold text-slate-800 dark:text-slate-200">
                    {t.highContrast || 'High Contrast'}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    Enhanced borders & clarity
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    onUpdateAccessibility({ highContrast: !accessibility.highContrast })
                  }
                  className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${
                    accessibility.highContrast ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`block w-3.5 h-3.5 rounded-full bg-white transition-transform ${
                      accessibility.highContrast ? 'translate-x-4.5' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>

              {/* Simple Mode Toggle */}
              <div className="flex items-center justify-between pt-1">
                <div className="text-xs">
                  <p className="font-semibold text-slate-800 dark:text-slate-200">
                    {t.simpleMode || 'Simple Icon Mode'}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    Larger touch targets
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    onUpdateAccessibility({ simpleMode: !accessibility.simpleMode })
                  }
                  className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${
                    accessibility.simpleMode ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`block w-3.5 h-3.5 rounded-full bg-white transition-transform ${
                      accessibility.simpleMode ? 'translate-x-4.5' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
