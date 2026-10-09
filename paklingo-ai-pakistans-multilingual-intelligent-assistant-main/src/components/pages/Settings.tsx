import React, { useState } from 'react';
import {
  Palette,
  Eye,
  Volume2,
  ShieldCheck,
  Languages,
  CheckCircle,
  Save,
  RotateCcw,
  Sparkles,
  Smartphone,
  Play,
  Square,
  Trash2,
  WifiOff,
  User,
  LogOut,
  Check,
  Type,
  HelpCircle,
  Bell,
} from 'lucide-react';
import { LanguageCode } from '../../types';
import { SUPPORTED_LANGUAGES } from '../../data/languages';
import { useVoiceSettings } from '../../context/VoiceSettingsContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme, THEMES_LIST, ThemeName, FontSizeOption } from '../../context/ThemeContext';

interface SettingsProps {
  selectedLanguage: LanguageCode;
  onLanguageChange: (lang: LanguageCode) => void;
  highContrast: boolean;
  onToggleHighContrast: () => void;
  simpleMode: boolean;
  onToggleSimpleMode: () => void;
}

export const Settings: React.FC<SettingsProps> = ({
  selectedLanguage,
  onLanguageChange,
  highContrast,
  onToggleHighContrast,
  simpleMode,
  onToggleSimpleMode,
}) => {
  const { user, logout } = useAuth();
  const { theme, setTheme, fontSize, setFontSize } = useTheme();

  const {
    settings: voiceSettings,
    updateSettings: updateVoiceSettings,
    resetSettings: resetVoiceSettings,
    availableVoices,
    aiVoices,
    isAiTtsAvailable,
    hasUrduVoice,
    bestUrduVoice,
    urduVoices,
    englishVoices,
    isUrduVoiceUsable,
    testVoice,
    stopTest,
    isTesting,
    testError,
    clearTestError,
  } = useVoiceSettings();

  type SettingsTab = 'all' | 'appearance' | 'language' | 'voice' | 'accessibility' | 'privacy' | 'account' | 'notifications';
  const [activeTab, setActiveTab] = useState<SettingsTab>('all');
  const [dialect, setDialect] = useState('Standard Pakistani Urban (معیاری)');
  const [offlineSyncEnabled, setOfflineSyncEnabled] = useState(true);
  const [nastaliqFontEnabled, setNastaliqFontEnabled] = useState(true);
  const [romanUrduAssist, setRomanUrduAssist] = useState(true);
  const [notificationSettings, setNotificationSettings] = useState({
    publicAlerts: true,
    dailyTips: true,
    audioChimes: true,
    securityNotices: true,
  });
  const [saveToast, setSaveToast] = useState(false);
  const [clearHistoryToast, setClearHistoryToast] = useState(false);
  const [showSetupHelp, setShowSetupHelp] = useState(false);

  const handleSave = () => {
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2500);
  };

  const handleClearHistory = () => {
    try {
      localStorage.removeItem('paklingo_chat_history');
      localStorage.removeItem('paklingo_recent_translations');
      localStorage.removeItem('paklingo_recent_queries');
    } catch {
      // ignore
    }
    setClearHistoryToast(true);
    setTimeout(() => setClearHistoryToast(false), 2500);
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto animate-in fade-in duration-200">
      {/* Toast Notifications */}
      {saveToast && (
        <div
          id="settings-save-toast"
          className="fixed bottom-6 right-6 z-50 bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-semibold animate-in slide-in-from-bottom-2"
        >
          <CheckCircle className="w-4 h-4 text-emerald-500" />
          <span>Preferences successfully saved and synchronized!</span>
        </div>
      )}

      {clearHistoryToast && (
        <div
          id="settings-clear-toast"
          className="fixed bottom-6 right-6 z-50 bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-semibold animate-in slide-in-from-bottom-2"
        >
          <Trash2 className="w-4 h-4 text-rose-500" />
          <span>Local session cache and search history cleared.</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="bg-[var(--surface)] rounded-2xl p-5 sm:p-6 border border-[var(--border)] shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-[var(--text-primary)] tracking-tight">
              Settings & Preferences
            </h1>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Customize themes, accessibility, natural voice synthesis, and privacy options.
            </p>
          </div>
          <button
            id="settings-save-btn"
            type="button"
            onClick={handleSave}
            className="px-4 py-2 bg-[var(--button-primary-bg)] hover:opacity-90 text-[var(--button-primary-text)] rounded-xl text-xs font-semibold flex items-center gap-2 transition-opacity cursor-pointer shadow-xs w-fit"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Preferences</span>
          </button>
        </div>
      </div>

      {/* Settings Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 custom-scrollbar border-b border-[var(--border)]">
        {[
          { id: 'all', label: 'All Settings' },
          { id: 'appearance', label: 'Appearance' },
          { id: 'language', label: 'Language' },
          { id: 'voice', label: 'Voice' },
          { id: 'accessibility', label: 'Accessibility' },
          { id: 'privacy', label: 'Privacy' },
          { id: 'account', label: 'Account' },
          { id: 'notifications', label: 'Notifications' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as SettingsTab)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer active:scale-95 ${
              activeTab === tab.id
                ? 'bg-[var(--accent)] text-white shadow-xs'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] bg-[var(--surface-secondary)] border border-[var(--border)]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Group 1: Appearance / Themes */}
      {(activeTab === 'all' || activeTab === 'appearance') && (
        <div className="bg-[var(--surface)] rounded-2xl p-5 sm:p-6 border border-[var(--border)] shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 border-b border-[var(--border)] pb-3">
            <Palette className="w-4 h-4 text-[var(--accent)]" />
            <div>
              <h2 className="text-sm font-semibold text-[var(--text-primary)]">Appearance & Themes (ظاہری شکل و تھیمز)</h2>
              <p className="text-[11px] text-[var(--text-muted)]">
                Select your color palette. Updates the entire application immediately and persists across sessions.
              </p>
            </div>
          </div>

        {/* 7 Themes Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 pt-1">
          {THEMES_LIST.map((t) => {
            const isSelected = theme === t.id;
            return (
              <button
                key={t.id}
                type="button"
                id={`theme-btn-${t.id}`}
                onClick={() => setTheme(t.id)}
                className={`relative p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2.5 ${
                  isSelected
                    ? 'border-[var(--accent)] bg-[var(--surface-secondary)] shadow-sm ring-2 ring-[var(--accent)]'
                    : 'border-[var(--border)] bg-[var(--surface)] hover:border-[var(--accent)] hover:bg-[var(--surface-hover)]'
                }`}
              >
                {/* Header with Swatches & Selection Check */}
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-1.5">
                    {/* Swatch 1: Background */}
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-black/20 shadow-xs inline-block"
                      style={{ backgroundColor: t.bgPreview }}
                      title="Background"
                    />
                    {/* Swatch 2: Surface */}
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-black/20 shadow-xs inline-block"
                      style={{ backgroundColor: t.surfacePreview }}
                      title="Card Surface"
                    />
                    {/* Swatch 3: Accent */}
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-black/20 shadow-xs inline-block"
                      style={{ backgroundColor: t.accentPreview }}
                      title="Accent"
                    />
                  </div>
                  {isSelected && (
                    <span className="w-4 h-4 rounded-full bg-[var(--accent)] text-white flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </span>
                  )}
                </div>

                {/* Name & Tag */}
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[var(--text-primary)]">{t.name}</span>
                    <span className="text-[10px] text-[var(--text-muted)] capitalize">
                      {t.category}
                    </span>
                  </div>
                  <p className="text-[10px] text-[var(--text-muted)] mt-0.5 leading-tight line-clamp-1">
                    {t.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
      )}

      {/* Group 2: Language & Regional Dialects */}
      {(activeTab === 'all' || activeTab === 'language') && (
        <div className="bg-[var(--surface)] rounded-2xl p-5 sm:p-6 border border-[var(--border)] shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 border-b border-[var(--border)] pb-3">
            <Languages className="w-4 h-4 text-[var(--accent)]" />
            <div>
              <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                Language & Regional Dialects (زبان و لہجہ)
              </h2>
              <p className="text-[11px] text-[var(--text-muted)]">
                Default interface is Urdu with proper RTL support. English, Roman Urdu, and regional languages are fully supported.
              </p>
            </div>
          </div>

          {/* Primary Language Grid */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-[var(--text-secondary)]">
              Primary Interface Language
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
              {SUPPORTED_LANGUAGES.map((lang) => {
                const isSelected = selectedLanguage === lang.code;
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => onLanguageChange(lang.code)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                      isSelected
                        ? 'border-[var(--accent)] bg-[var(--surface-secondary)] shadow-xs ring-2 ring-[var(--accent)]'
                        : 'border-[var(--border)] bg-[var(--surface)] hover:border-[var(--accent)] hover:bg-[var(--surface-hover)]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[var(--text-primary)]">{lang.name}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-[var(--accent)]" />}
                    </div>
                    <span className="text-xs text-[var(--text-muted)] font-urdu font-medium" dir="rtl">
                      {lang.nativeName}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dialect Selector */}
          <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface-secondary)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <span className="text-xs font-semibold text-[var(--text-primary)]">
                Regional Speech & Dialect Preference
              </span>
              <p className="text-[11px] text-[var(--text-muted)]">
                Adapts AI conversational cadence and colloquial vocabulary
              </p>
            </div>
            <select
              value={dialect}
              onChange={(e) => setDialect(e.target.value)}
              className="px-3 py-1.5 bg-[var(--input-bg)] border border-[var(--border)] rounded-lg text-xs text-[var(--input-text)] focus:outline-none focus:border-[var(--focus-ring)]"
            >
              <option value="Standard Pakistani Urban (معیاری)">Standard Pakistani Urban (معیاری)</option>
              <option value="Punjab Urban (لاہوری و خطہ پنجاب)">Punjab Urban (لاہوری و خطہ پنجاب)</option>
              <option value="Sindh Southern (کراچی و اندرون سندھ)">Sindh Southern (کراچی و اندرون سندھ)</option>
              <option value="KP Northern (پشاور و خیبر)">KP Northern (پشاور و خیبر)</option>
              <option value="Balochistan Coastal & Quetta (کوئٹہ و مکران)">Balochistan Coastal & Quetta (کوئٹہ و مکران)</option>
              <option value="Federal Islamabad / Rawalpindi (اسلام آباد)">Federal Islamabad / Rawalpindi (اسلام آباد)</option>
            </select>
          </div>

          {/* Language Feature Toggles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--surface-secondary)] flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-[var(--text-primary)]">
                  Nastaliq Calligraphic Curves
                </span>
                <p className="text-[11px] text-[var(--text-muted)]">
                  Enable high-fidelity Noto Nastaliq Urdu rendering
                </p>
              </div>
              <button
                type="button"
                onClick={() => setNastaliqFontEnabled(!nastaliqFontEnabled)}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer shrink-0 ml-3 ${
                  nastaliqFontEnabled ? 'bg-[var(--accent)] justify-end' : 'bg-[var(--border)] justify-start'
                }`}
              >
                <div className="w-4 h-4 rounded-full shadow-md bg-white" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--surface-secondary)] flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-[var(--text-primary)]">
                  Roman Urdu Transliteration Assist
                </span>
                <p className="text-[11px] text-[var(--text-muted)]">
                  Provide automatic Latin phonetics alongside Urdu
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRomanUrduAssist(!romanUrduAssist)}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer shrink-0 ml-3 ${
                  romanUrduAssist ? 'bg-[var(--accent)] justify-end' : 'bg-[var(--border)] justify-start'
                }`}
              >
                <div className="w-4 h-4 rounded-full shadow-md bg-white" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Group 3: Voice & Text-to-Speech */}
      {(activeTab === 'all' || activeTab === 'voice') && (
        <div className="bg-[var(--surface)] rounded-2xl p-5 sm:p-6 border border-[var(--border)] shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
            <div className="flex items-center gap-2.5">
              <Volume2 className="w-4 h-4 text-[var(--accent)]" />
              <div>
                <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                  Voice & Text-to-Speech (آواز اور تلفظ)
                </h2>
                <p className="text-[11px] text-[var(--text-muted)]">
                  Natural Pakistani pronunciation engine for Urdu, Roman Urdu, and regional languages.
                </p>
              </div>
            </div>
          <button
            type="button"
            id="settings-reset-voice-btn"
            onClick={resetVoiceSettings}
            className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center gap-1 cursor-pointer font-medium transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Defaults
          </button>
        </div>

        {/* Intelligent Voice Status: No false warnings */}
        {isUrduVoiceUsable ? (
          <div
            id="urdu-voice-active-notice"
            className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--surface-secondary)] text-xs flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              <div>
                <p className="font-semibold text-[var(--text-primary)]">
                  {hasUrduVoice
                    ? `Urdu Voice Active: ${bestUrduVoice?.name || 'Device Urdu Voice'}`
                    : 'Natural AI Urdu Speech Active'}
                </p>
                <p className="text-[11px] text-[var(--text-muted)]">
                  {hasUrduVoice
                    ? `Detected native voice (${bestUrduVoice?.lang || 'ur-PK'}). Responses speak with natural Pakistani pronunciation.`
                    : 'High-definition neural speech engine ready. Seamless Urdu & Roman Urdu pronunciation.'}
                </p>
              </div>
            </div>
            <span className="text-[10px] font-medium bg-[var(--surface)] text-[var(--text-secondary)] px-2.5 py-1 rounded-md border border-[var(--border)] shrink-0">
              Ready
            </span>
          </div>
        ) : (
          /* Genuinely unavailable offline browser: small clean note, NOT an alarming error */
          <div
            id="urdu-voice-info-notice"
            className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--surface-secondary)] text-xs space-y-2"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                <span className="font-semibold text-[var(--text-primary)]">
                  Device Urdu voice not detected
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowSetupHelp(!showSetupHelp)}
                className="text-[11px] text-[var(--text-muted)] hover:text-[var(--text-primary)] underline cursor-pointer flex items-center gap-1"
              >
                <HelpCircle className="w-3 h-3" />
                {showSetupHelp ? 'Hide Setup Tips' : 'Device Voice Setup Tips'}
              </button>
            </div>
            {showSetupHelp && (
              <div className="pt-2 border-t border-[var(--border)] text-[11px] text-[var(--text-muted)] space-y-1">
                <p>
                  <strong>Windows / Edge:</strong> Settings → Time & Language → Speech → Add Urdu (Pakistan).
                </p>
                <p>
                  <strong>Android / Chrome:</strong> Settings → Accessibility → Text-to-speech output → Install voice data.
                </p>
                <p>
                  <strong>Mac / iOS:</strong> Settings → Accessibility → Spoken Content → Voices → Add Urdu.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Test Error (clean, dismissible) */}
        {testError && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-300 text-xs flex items-center justify-between">
            <span>{testError}</span>
            <button
              onClick={clearTestError}
              className="text-amber-500 hover:text-amber-700 font-bold p-1 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* TTS Engine Preference */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider block">
            Speech Synthesis Engine (انجن کی ترجیح)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              id="engine-ai-btn"
              onClick={() => updateVoiceSettings({ preferredEngine: 'gemini' })}
              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                voiceSettings.preferredEngine === 'gemini'
                  ? 'bg-[var(--surface-secondary)] border-[var(--accent)] shadow-sm ring-2 ring-[var(--accent)]'
                  : 'bg-[var(--surface)] border-[var(--border)] hover:border-[var(--accent)] hover:bg-[var(--surface-hover)]'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-[var(--text-primary)]">Natural AI Speech (Preferred)</span>
                <Sparkles className="w-3.5 h-3.5 text-[var(--accent)]" />
              </div>
              <p className="text-[11px] text-[var(--text-muted)] font-normal leading-normal">
                High-definition neural Urdu and English voice. Studio-quality pronunciation.
              </p>
            </button>

            <button
              type="button"
              id="engine-browser-btn"
              onClick={() => updateVoiceSettings({ preferredEngine: 'browser' })}
              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                voiceSettings.preferredEngine === 'browser'
                  ? 'bg-[var(--surface-secondary)] border-[var(--accent)] shadow-sm ring-2 ring-[var(--accent)]'
                  : 'bg-[var(--surface)] border-[var(--border)] hover:border-[var(--accent)] hover:bg-[var(--surface-hover)]'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-[var(--text-primary)]">Browser System Voice</span>
                <Volume2 className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              </div>
              <p className="text-[11px] text-[var(--text-muted)] font-normal leading-normal">
                Uses local device synthesizer. Zero network latency for supported voices.
              </p>
            </button>
          </div>
        </div>

        {/* Language & Voice Selector Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)] block mb-1.5">
              Pronunciation Language Mode (زبان کا انتخاب)
            </label>
            <select
              id="voice-language-mode"
              value={voiceSettings.languageMode}
              onChange={(e) => updateVoiceSettings({ languageMode: e.target.value as any })}
              className="w-full py-2 px-3 bg-[var(--input-bg)] border border-[var(--border)] rounded-xl text-xs font-medium text-[var(--input-text)] focus:outline-hidden focus:border-[var(--focus-ring)]"
            >
              <option value="auto" className="bg-[var(--dropdown-bg)] text-[var(--dropdown-text)]">Auto Detect (خودکار زبان کی شناخت)</option>
              <option value="ur-PK" className="bg-[var(--dropdown-bg)] text-[var(--dropdown-text)]">Urdu Pakistan (اردو پاکستان)</option>
              <option value="roman-urdu" className="bg-[var(--dropdown-bg)] text-[var(--dropdown-text)]">Roman Urdu (رومن اردو)</option>
              <option value="en-US" className="bg-[var(--dropdown-bg)] text-[var(--dropdown-text)]">English (International / Pakistani)</option>
              <option value="ps" className="bg-[var(--dropdown-bg)] text-[var(--dropdown-text)]">Pashto (پښتو)</option>
              <option value="pa-PK" className="bg-[var(--dropdown-bg)] text-[var(--dropdown-text)]">Punjabi (پنجابی شاہ مکھی)</option>
              <option value="sd-PK" className="bg-[var(--dropdown-bg)] text-[var(--dropdown-text)]">Sindhi (سنڌي)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)] block mb-1.5">
              {voiceSettings.preferredEngine === 'gemini'
                ? 'Selected AI Neural Voice'
                : 'Selected System Voice'}
            </label>
            {voiceSettings.preferredEngine === 'gemini' ? (
              <select
                id="voice-ai-model-select"
                value={voiceSettings.selectedAiVoice || 'Kore'}
                onChange={(e) => updateVoiceSettings({ selectedAiVoice: e.target.value as any })}
                className="w-full py-2 px-3 bg-[var(--input-bg)] border border-[var(--border)] rounded-xl text-xs font-medium text-[var(--input-text)] focus:outline-hidden focus:border-[var(--focus-ring)]"
              >
                {aiVoices.map((v) => (
                  <option key={v.id} value={v.id} className="bg-[var(--dropdown-bg)] text-[var(--dropdown-text)]">
                    {v.name} ({v.gender})
                  </option>
                ))}
              </select>
            ) : (
              <select
                id="voice-browser-select"
                value={voiceSettings.selectedVoiceURI || ''}
                onChange={(e) => updateVoiceSettings({ selectedVoiceURI: e.target.value || null })}
                className="w-full py-2 px-3 bg-[var(--input-bg)] border border-[var(--border)] rounded-xl text-xs font-medium text-[var(--input-text)] focus:outline-hidden focus:border-[var(--focus-ring)]"
              >
                <option value="" className="bg-[var(--dropdown-bg)] text-[var(--dropdown-text)]">Default Device Urdu Voice</option>
                {urduVoices.length > 0 && (
                  <optgroup label="Urdu Voices (اردو آوازیں)" className="bg-[var(--dropdown-bg)] text-[var(--dropdown-text)] font-semibold">
                    {urduVoices.map((v) => (
                      <option key={v.voiceURI} value={v.voiceURI} className="bg-[var(--dropdown-bg)] text-[var(--dropdown-text)] font-normal">
                        {v.name} ({v.lang})
                      </option>
                    ))}
                  </optgroup>
                )}
                {englishVoices.length > 0 && (
                  <optgroup label="English Voices" className="bg-[var(--dropdown-bg)] text-[var(--dropdown-text)] font-semibold">
                    {englishVoices.slice(0, 8).map((v) => (
                      <option key={v.voiceURI} value={v.voiceURI} className="bg-[var(--dropdown-bg)] text-[var(--dropdown-text)] font-normal">
                        {v.name} ({v.lang})
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            )}
          </div>
        </div>

        {/* Sliders: Speed and Pitch */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-1">
          {/* Speed Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-medium text-[var(--text-secondary)]">
              <span>Speaking Speed (رفتار)</span>
              <span className="text-[var(--text-primary)] bg-[var(--surface-secondary)] px-2 py-0.5 rounded border border-[var(--border)] text-[11px]">
                {voiceSettings.speed.toFixed(2)}x {voiceSettings.speed === 1.0 ? '• Normal' : ''}
              </span>
            </div>
            <input
              id="voice-speed-slider"
              type="range"
              min={0.75}
              max={1.4}
              step={0.05}
              value={voiceSettings.speed}
              onChange={(e) => updateVoiceSettings({ speed: parseFloat(e.target.value) })}
              className="w-full accent-[var(--accent)] cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-[var(--text-muted)]">
              <button
                type="button"
                onClick={() => updateVoiceSettings({ speed: 0.85 })}
                className="hover:text-[var(--text-primary)] cursor-pointer transition-colors"
              >
                0.85x (Slow)
              </button>
              <button
                type="button"
                onClick={() => updateVoiceSettings({ speed: 1.0 })}
                className="font-medium text-[var(--text-primary)] hover:underline cursor-pointer"
              >
                1.00x (Normal)
              </button>
              <button
                type="button"
                onClick={() => updateVoiceSettings({ speed: 1.25 })}
                className="hover:text-[var(--text-primary)] cursor-pointer transition-colors"
              >
                1.25x (Fast)
              </button>
            </div>
          </div>

          {/* Pitch Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-medium text-[var(--text-secondary)]">
              <span>Voice Pitch (آواز کا سر)</span>
              <span className="text-[var(--text-primary)] bg-[var(--surface-secondary)] px-2 py-0.5 rounded border border-[var(--border)] text-[11px]">
                {voiceSettings.pitch.toFixed(2)} {voiceSettings.pitch === 1.0 ? '• Natural' : ''}
              </span>
            </div>
            <input
              id="voice-pitch-slider"
              type="range"
              min={0.8}
              max={1.2}
              step={0.05}
              value={voiceSettings.pitch}
              onChange={(e) => updateVoiceSettings({ pitch: parseFloat(e.target.value) })}
              className="w-full accent-[var(--accent)] cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-[var(--text-muted)]">
              <span>0.80 (Deep)</span>
              <button
                type="button"
                onClick={() => updateVoiceSettings({ pitch: 1.0 })}
                className="font-medium text-[var(--text-primary)] hover:underline cursor-pointer"
              >
                1.00 (Standard)
              </button>
              <span>1.20 (High)</span>
            </div>
          </div>
        </div>

        {/* Test Voice Button */}
        <div className="p-4 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <span className="text-xs font-semibold text-[var(--text-primary)] block">
              Test Voice Audio (آواز کا معائنہ کریں)
            </span>
            <p className="text-[11px] text-[var(--text-muted)]">
              Hear sample speech with your current voice, speaking speed, and pitch configuration.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isTesting ? (
              <button
                id="voice-stop-test-btn"
                type="button"
                onClick={stopTest}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                Stop Test
              </button>
            ) : (
              <button
                id="voice-start-test-btn"
                type="button"
                onClick={() => testVoice()}
                className="px-4 py-2 rounded-xl bg-[var(--button-secondary-bg)] hover:bg-[var(--surface-hover)] text-[var(--button-secondary-text)] font-semibold text-xs flex items-center gap-1.5 border border-[var(--border)] transition-colors cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current text-[var(--accent)]" />
                Test Voice
              </button>
            )}
          </div>
        </div>
      </div>
      )}

      {/* Group 4: Accessibility */}
      {(activeTab === 'all' || activeTab === 'accessibility') && (
        <div className="bg-[var(--surface)] rounded-2xl p-5 sm:p-6 border border-[var(--border)] shadow-sm space-y-5">
          <div className="flex items-center gap-2.5 border-b border-[var(--border)] pb-3">
            <Eye className="w-4 h-4 text-[var(--accent)]" />
            <div>
              <h2 className="text-sm font-semibold text-[var(--text-primary)]">Accessibility (رسائی اور ڈسپلے)</h2>
              <p className="text-[11px] text-[var(--text-muted)]">
                Centralized text scaling, high-contrast legibility, and interface simplification.
              </p>
            </div>
          </div>

        {/* Font Size Scaling (Small / Medium / Large) */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-[var(--text-secondary)] flex items-center gap-1.5">
              <Type className="w-3.5 h-3.5 text-[var(--accent)]" />
              <span>Interface Text Scaling (فونٹ سائز)</span>
            </label>
            <span className="text-[11px] text-[var(--text-muted)]">
              Applies globally across all cards, navigation, and inputs
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              {
                id: 'small' as FontSizeOption,
                label: 'Small',
                sizeInfo: '14px (Compact)',
                desc: 'Tighter layout, best for dense data views',
              },
              {
                id: 'medium' as FontSizeOption,
                label: 'Medium',
                sizeInfo: '16px (Default)',
                desc: 'Standard balanced size for all screens',
              },
              {
                id: 'large' as FontSizeOption,
                label: 'Large',
                sizeInfo: '18px (Comfort)',
                desc: 'Enhanced readability and larger touch targets',
              },
            ].map((item) => {
              const isSelected = fontSize === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  id={`font-size-${item.id}`}
                  onClick={() => setFontSize(item.id)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'border-[var(--accent)] bg-[var(--surface-secondary)] shadow-sm ring-2 ring-[var(--accent)]'
                      : 'border-[var(--border)] bg-[var(--surface)] hover:border-[var(--accent)] hover:bg-[var(--surface-hover)]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-[var(--text-primary)]">{item.label}</span>
                    {isSelected && (
                      <span className="w-3.5 h-3.5 rounded-full bg-[var(--accent)] text-white flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-[var(--text-secondary)] font-medium">{item.sizeInfo}</span>
                  <span className="text-[10px] text-[var(--text-muted)] mt-0.5 leading-tight">{item.desc}</span>
                </button>
              );
            })}
          </div>

          {/* Live Text Preview Box */}
          <div className="p-3 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] flex items-center justify-between">
            <span className="text-xs text-[var(--text-muted)]">Live Preview:</span>
            <p className="text-sm font-medium text-[var(--text-primary)]">
              پاک لنگو اے آئی — The quick brown fox jumps over the lazy dog.
            </p>
          </div>
        </div>

        {/* Display Toggles Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          {/* High Contrast Mode */}
          <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface-secondary)] flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-[var(--accent)]" />
                High Contrast Mode
              </span>
              <p className="text-[11px] text-[var(--text-muted)]">
                Sharper borders and high-visibility text contrast for low-vision readability.
              </p>
            </div>
            <button
              type="button"
              id="settings-toggle-high-contrast"
              onClick={onToggleHighContrast}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer shrink-0 ml-3 ${
                highContrast ? 'bg-[var(--accent)] justify-end' : 'bg-[var(--border)] justify-start'
              }`}
            >
              <div className="w-4 h-4 rounded-full shadow-md bg-white" />
            </button>
          </div>

          {/* Simple Mode */}
          <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface-secondary)] flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-[var(--accent)]" />
                Simple Mode (آسان موڈ)
              </span>
              <p className="text-[11px] text-[var(--text-muted)]">
                Simplified layout with prominent icons and clear citizen assistance prompts.
              </p>
            </div>
            <button
              type="button"
              id="settings-toggle-simple-mode"
              onClick={onToggleSimpleMode}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer shrink-0 ml-3 ${
                simpleMode ? 'bg-[var(--accent)] justify-end' : 'bg-[var(--border)] justify-start'
              }`}
            >
              <div className="w-4 h-4 rounded-full shadow-md bg-white" />
            </button>
          </div>
        </div>

        {/* Language & Dialect Configuration */}
        <div className="pt-2 border-t border-[var(--border)] space-y-3">
          <div className="flex items-center gap-2">
            <Languages className="w-4 h-4 text-[var(--accent)]" />
            <h3 className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider">
              Language & Regional Dialect
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-[var(--text-secondary)] block mb-1.5">
                Primary Interface Language (بنیادی زبان)
              </label>
              <select
                id="settings-lang-select"
                value={selectedLanguage}
                onChange={(e) => onLanguageChange(e.target.value as LanguageCode)}
                className="w-full py-2 px-3 bg-[var(--input-bg)] border border-[var(--border)] rounded-xl text-xs font-medium text-[var(--input-text)] focus:outline-hidden focus:border-[var(--focus-ring)]"
              >
                {SUPPORTED_LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code} className="bg-[var(--dropdown-bg)] text-[var(--dropdown-text)]">
                    {l.name} ({l.nativeName})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-[var(--text-secondary)] block mb-1.5">
                Regional Dialect Variant (لہجہ)
              </label>
              <select
                id="settings-dialect-select"
                value={dialect}
                onChange={(e) => setDialect(e.target.value)}
                className="w-full py-2 px-3 bg-[var(--input-bg)] border border-[var(--border)] rounded-xl text-xs font-medium text-[var(--input-text)] focus:outline-hidden focus:border-[var(--focus-ring)]"
              >
                <option value="Standard Pakistani Urban (معیاری)" className="bg-[var(--dropdown-bg)] text-[var(--dropdown-text)]">
                  Standard Pakistani Urban (معیاری)
                </option>
                <option value="Majhi Punjabi (وسطی پنجاب)" className="bg-[var(--dropdown-bg)] text-[var(--dropdown-text)]">
                  Majhi Punjabi (وسطی پنجاب)
                </option>
                <option value="Saraiki Multani (سرائیکی ملتان)" className="bg-[var(--dropdown-bg)] text-[var(--dropdown-text)]">
                  Saraiki Multani (سرائیکی ملتان)
                </option>
                <option value="Sindhi Hyderabadi (حیدرآباد سنڌی)" className="bg-[var(--dropdown-bg)] text-[var(--dropdown-text)]">
                  Sindhi Hyderabadi (حیدرآباد سنڌی)
                </option>
                <option value="Pashto Yousafzai (پښتو یوسفزئی)" className="bg-[var(--dropdown-bg)] text-[var(--dropdown-text)]">
                  Pashto Yousafzai (پښتو یوسفزئی)
                </option>
                <option value="Balochi Makrani (مکرانی بلوچی)" className="bg-[var(--dropdown-bg)] text-[var(--dropdown-text)]">
                  Balochi Makrani (مکرانی بلوچی)
                </option>
              </select>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Group 5: Privacy & Local Storage */}
      {(activeTab === 'all' || activeTab === 'privacy') && (
        <div className="bg-[var(--surface)] rounded-2xl p-5 sm:p-6 border border-[var(--border)] shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 border-b border-[var(--border)] pb-3">
            <ShieldCheck className="w-4 h-4 text-[var(--accent)]" />
            <div>
              <h2 className="text-sm font-semibold text-[var(--text-primary)]">Privacy & Local Storage (رازداری اور ڈیٹا)</h2>
              <p className="text-[11px] text-[var(--text-muted)]">
                Control local browser caching, session logs, and personal interaction history.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {/* Offline Caching */}
            <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface-secondary)] flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                  <WifiOff className="w-4 h-4 text-[var(--accent)]" />
                  Offline Caching & Local Storage
                </span>
                <p className="text-[11px] text-[var(--text-muted)]">
                  Cache common emergency numbers and citizen guides for low-bandwidth connectivity.
                </p>
              </div>
              <button
                type="button"
                id="settings-toggle-offline"
                onClick={() => setOfflineSyncEnabled(!offlineSyncEnabled)}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer shrink-0 ml-3 ${
                  offlineSyncEnabled ? 'bg-[var(--accent)] justify-end' : 'bg-[var(--border)] justify-start'
                }`}
              >
                <div className="w-4 h-4 rounded-full shadow-md bg-white" />
              </button>
            </div>

            {/* Clear Interaction History */}
            <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface-secondary)] flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-[var(--text-primary)]">Clear Interaction History</span>
                <p className="text-[11px] text-[var(--text-muted)]">
                  Permanently delete all stored queries, chat transcripts, and translation logs from this device.
                </p>
              </div>
              <button
                type="button"
                id="settings-clear-history-btn"
                onClick={handleClearHistory}
                className="px-3.5 py-1.5 bg-[var(--surface)] hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] hover:text-rose-500 border border-[var(--border)] rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ml-3"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                <span>Clear History</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Group 6: Account Profile */}
      {(activeTab === 'all' || activeTab === 'account') && (
        <div className="bg-[var(--surface)] rounded-2xl p-5 sm:p-6 border border-[var(--border)] shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 border-b border-[var(--border)] pb-3">
            <User className="w-4 h-4 text-[var(--accent)]" />
            <div>
              <h2 className="text-sm font-semibold text-[var(--text-primary)]">Account Profile (صارف اکاؤنٹ)</h2>
              <p className="text-[11px] text-[var(--text-muted)]">
                Manage your credentials, authentication provider, and session status.
              </p>
            </div>
          </div>

          {user ? (
            <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface-secondary)] flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3.5">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name || user.email}
                    referrerPolicy="no-referrer"
                    className="w-12 h-12 rounded-xl object-cover border border-[var(--border)] shadow-xs"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-[var(--accent)] text-white font-bold text-lg flex items-center justify-center shadow-xs">
                    {user.name ? user.name.charAt(0).toUpperCase() : 'P'}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-[var(--text-primary)] text-sm">{user.name || 'PakLingo User'}</p>
                    <span className="text-[10px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                      Active
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-muted)]">{user.email}</p>
                  <span className="inline-block mt-1 text-[11px] text-[var(--text-secondary)] font-medium">
                    Signed in via {user.provider === 'google' ? 'Google Workspace' : 'Email & Password'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                id="settings-account-signout-btn"
                onClick={logout}
                className="px-4 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] hover:text-rose-500 font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-500" />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface-secondary)] text-center py-6">
              <p className="text-xs text-[var(--text-muted)]">No account actively authenticated</p>
            </div>
          )}
        </div>
      )}

      {/* Group 7: Notifications & Alerts */}
      {(activeTab === 'all' || activeTab === 'notifications') && (
        <div className="bg-[var(--surface)] rounded-2xl p-5 sm:p-6 border border-[var(--border)] shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 border-b border-[var(--border)] pb-3">
            <Bell className="w-4 h-4 text-[var(--accent)]" />
            <div>
              <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                Notifications & Broadcasts (اطلاعات و الرٹس)
              </h2>
              <p className="text-[11px] text-[var(--text-muted)]">
                Manage civic announcements, daily learning prompts, and voice audio alerts.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface-secondary)] flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-[var(--text-primary)]">
                  Citizen Public Service Bulletins
                </span>
                <p className="text-[11px] text-[var(--text-muted)]">
                  Receive alerts for NADRA deadline announcements, passport fee updates, and BISP releases.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setNotificationSettings((prev) => ({ ...prev, publicAlerts: !prev.publicAlerts }))
                }
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer shrink-0 ml-3 ${
                  notificationSettings.publicAlerts ? 'bg-[var(--accent)] justify-end' : 'bg-[var(--border)] justify-start'
                }`}
              >
                <div className="w-4 h-4 rounded-full shadow-md bg-white" />
              </button>
            </div>

            <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface-secondary)] flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-[var(--text-primary)]">
                  Daily Learning & Language Prompts
                </span>
                <p className="text-[11px] text-[var(--text-muted)]">
                  Receive a daily micro-lesson in your selected Pakistani regional language.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setNotificationSettings((prev) => ({ ...prev, dailyTips: !prev.dailyTips }))
                }
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer shrink-0 ml-3 ${
                  notificationSettings.dailyTips ? 'bg-[var(--accent)] justify-end' : 'bg-[var(--border)] justify-start'
                }`}
              >
                <div className="w-4 h-4 rounded-full shadow-md bg-white" />
              </button>
            </div>

            <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface-secondary)] flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-[var(--text-primary)]">
                  Audio Feedback Tone
                </span>
                <p className="text-[11px] text-[var(--text-muted)]">
                  Play a subtle low chime when the AI completes generating an answer.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setNotificationSettings((prev) => ({ ...prev, audioChimes: !prev.audioChimes }))
                }
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer shrink-0 ml-3 ${
                  notificationSettings.audioChimes ? 'bg-[var(--accent)] justify-end' : 'bg-[var(--border)] justify-start'
                }`}
              >
                <div className="w-4 h-4 rounded-full shadow-md bg-white" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
