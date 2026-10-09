import React, { useState } from 'react';
import {
  X,
  Volume2,
  Sliders,
  Sparkles,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Play,
  Square,
  HelpCircle,
  Cpu,
  Globe,
} from 'lucide-react';
import { useVoiceSettings } from '../context/VoiceSettingsContext';

interface VoiceSettingsModalProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const VoiceSettingsModal: React.FC<VoiceSettingsModalProps> = ({
  isOpen: propIsOpen,
  onClose: propOnClose,
}) => {
  const {
    settings,
    updateSettings,
    resetSettings,
    availableVoices,
    aiVoices,
    isAiTtsAvailable,
    hasUrduVoice,
    bestUrduVoice,
    testVoice,
    stopTest,
    isTesting,
    testError,
    clearTestError,
    isVoiceModalOpen,
    closeVoiceModal,
  } = useVoiceSettings();

  const isOpen = propIsOpen !== undefined ? propIsOpen : isVoiceModalOpen;
  const onClose = propOnClose || closeVoiceModal;

  const [showSetupHelp, setShowSetupHelp] = useState(false);

  if (!isOpen) return null;

  return (
    <div
      id="voice-settings-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="voice-settings-modal-container"
        className="bg-[var(--surface)] rounded-2xl max-w-xl w-full border border-[var(--border)] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-[var(--text-primary)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[var(--surface-secondary)] border-b border-[var(--border)] text-[var(--text-primary)] p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[var(--surface)] text-[var(--accent)] border border-[var(--border)]">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[var(--text-primary)]">
                Voice & Speech Settings
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                طرزِ تکلم، زبان اور آواز کی ترتیبات (Natural Speech Engine)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Test Error Notice if any */}
          {testError && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-300 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div className="flex-1 space-y-1">
                <p className="font-semibold leading-relaxed">{testError}</p>
              </div>
              <button
                onClick={clearTestError}
                className="text-amber-500 hover:text-amber-700 p-1 text-xs"
              >
                ✕
              </button>
            </div>
          )}

          {/* Engine Status Banner */}
          <div className="p-3.5 rounded-xl border text-xs bg-[var(--surface-secondary)] border-[var(--border)] text-[var(--text-secondary)]">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <div className="flex-1 space-y-1">
                <p className="font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                  <span>Natural Multilingual TTS Engine Active</span>
                  <span className="text-[10px] bg-[var(--surface)] text-[var(--text-secondary)] font-medium px-1.5 py-0.5 rounded border border-[var(--border)]">
                    AI-Powered
                  </span>
                </p>
                <p className="text-[12px] text-[var(--text-muted)] leading-relaxed">
                  Urdu script, Roman Urdu, English, and regional languages are pronounced naturally.
                  {hasUrduVoice
                    ? ' Browser Urdu voice is also available as a fallback.'
                    : ' High-definition AI audio requires zero browser voice installations.'}
                </p>
              </div>
            </div>
          </div>

          {/* 1. TTS Engine Preference */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                Speech Synthesis Engine
              </label>
              <span className="text-[11px] text-[var(--text-muted)]">
                انجن کی ترجیح
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => updateSettings({ preferredEngine: 'gemini' })}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  settings.preferredEngine === 'gemini'
                    ? 'bg-[var(--surface-secondary)] border-[var(--accent)] ring-1 ring-[var(--accent)]'
                    : 'bg-[var(--surface)] border-[var(--border)] hover:border-[var(--accent)]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-[var(--text-primary)]">Natural AI TTS (Preferred)</span>
                  <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                </div>
                <p className="text-[11px] text-[var(--text-muted)] font-normal leading-tight">
                  Clear native Pakistani Urdu and English pronunciation with lifelike cadence.
                </p>
              </button>

              <button
                type="button"
                onClick={() => updateSettings({ preferredEngine: 'browser' })}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  settings.preferredEngine === 'browser'
                    ? 'bg-[var(--surface-secondary)] border-[var(--accent)] ring-1 ring-[var(--accent)]'
                    : 'bg-[var(--surface)] border-[var(--border)] hover:border-[var(--accent)]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-[var(--text-primary)]">Browser System Voice</span>
                  <Volume2 className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                </div>
                <p className="text-[11px] text-[var(--text-muted)] font-normal leading-tight">
                  Uses voices installed on your device (Urdu voice required for Urdu text).
                </p>
              </button>
            </div>
          </div>

          {/* 2. Language & Pronunciation Mode */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                Language & Pronunciation Mode
              </label>
              <span className="text-[11px] text-[var(--text-muted)]">
                زبان کا انتخاب
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { mode: 'auto' as const, label: 'Auto Detect', tag: 'auto', desc: 'Evaluates visible text' },
                { mode: 'ur-PK' as const, label: 'Urdu (اردو)', tag: 'ur-PK', desc: 'Native Urdu' },
                { mode: 'en-US' as const, label: 'English', tag: 'en-US', desc: 'Natural English' },
                { mode: 'roman-urdu' as const, label: 'Roman Urdu', tag: 'رومن', desc: 'Urdu phonetics' },
                { mode: 'ps' as const, label: 'Pashto (پښتو)', tag: 'ps', desc: 'Pashto cadence' },
                { mode: 'pa-PK' as const, label: 'Punjabi (پنجابی)', tag: 'pa', desc: 'Punjabi cadence' },
                { mode: 'sd-PK' as const, label: 'Sindhi (سنڌي)', tag: 'sd', desc: 'Sindhi cadence' },
                { mode: 'bal' as const, label: 'Balochi (بلوچی)', tag: 'bal', desc: 'Balochi cadence' },
                { mode: 'skr-PK' as const, label: 'Saraiki (سرائیکی)', tag: 'skr', desc: 'Saraiki cadence' },
              ].map((item) => (
                <button
                  key={item.mode}
                  type="button"
                  onClick={() => updateSettings({ languageMode: item.mode })}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    settings.languageMode === item.mode
                      ? 'bg-[var(--surface-secondary)] border-[var(--accent)] ring-1 ring-[var(--accent)]'
                      : 'bg-[var(--surface)] border-[var(--border)] hover:border-[var(--accent)]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-[var(--text-primary)]">{item.label}</span>
                    <span className="text-[10px] font-semibold bg-[var(--surface-secondary)] text-[var(--text-secondary)] px-1 py-0.5 rounded border border-[var(--border)]">
                      {item.tag}
                    </span>
                  </div>
                  <p className="text-[10px] text-[var(--text-muted)] font-normal leading-tight">
                    {item.desc}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* 3. Voice Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                Voice Selection (آواز)
              </label>
              <span className="text-[11px] text-[var(--text-muted)] font-medium">
                {settings.preferredEngine === 'gemini' ? 'AI Voice Models' : `${availableVoices.length} System Voices`}
              </span>
            </div>

            {settings.preferredEngine === 'gemini' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {aiVoices.map((voice) => (
                  <button
                    key={voice.id}
                    type="button"
                    onClick={() => updateSettings({ selectedAiVoice: voice.id })}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      settings.selectedAiVoice === voice.id
                        ? 'bg-[var(--surface-secondary)] border-[var(--accent)] ring-1 ring-[var(--accent)]'
                        : 'bg-[var(--surface)] border-[var(--border)] hover:border-[var(--accent)]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-[var(--text-primary)]">{voice.name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--surface-secondary)] text-[var(--text-secondary)] border border-[var(--border)] font-medium">
                        {voice.gender}
                      </span>
                    </div>
                    <p className="text-[11px] text-[var(--text-muted)] font-normal leading-tight">
                      {voice.description}
                    </p>
                  </button>
                ))}
              </div>
            ) : (
              <select
                value={settings.selectedVoiceURI || ''}
                onChange={(e) => updateSettings({ selectedVoiceURI: e.target.value || null })}
                className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] focus:outline-hidden focus:ring-1 focus:ring-[var(--accent)]"
              >
                <option value="">
                  Automatic (System Best Voice matching detected language)
                </option>
                {availableVoices.map((v) => (
                  <option key={v.voiceURI} value={v.voiceURI} className="bg-[var(--dropdown-bg)] text-[var(--dropdown-text)]">
                    {v.name} ({v.lang})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* 4. Speaking Speed (Rate) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                Speaking Speed (بولنے کی رفتار)
              </label>
              <span className="text-xs font-semibold text-[var(--text-primary)] bg-[var(--surface-secondary)] px-2 py-0.5 rounded-md border border-[var(--border)]">
                {settings.speed.toFixed(2)}x {settings.speed === 1.0 ? '• Natural' : ''}
              </span>
            </div>
            <input
              type="range"
              min="0.75"
              max="1.4"
              step="0.05"
              value={settings.speed}
              onChange={(e) => updateSettings({ speed: parseFloat(e.target.value) })}
              className="w-full accent-[var(--accent)] cursor-pointer"
            />
            <div className="flex justify-between items-center text-[11px] text-[var(--text-muted)]">
              <button
                type="button"
                onClick={() => updateSettings({ speed: 0.85 })}
                className="hover:text-[var(--text-primary)] cursor-pointer"
              >
                0.85x (Slow & Clear)
              </button>
              <button
                type="button"
                onClick={() => updateSettings({ speed: 1.0 })}
                className="font-semibold text-[var(--text-secondary)] cursor-pointer"
              >
                1.00x (Natural Normal)
              </button>
              <button
                type="button"
                onClick={() => updateSettings({ speed: 1.25 })}
                className="hover:text-[var(--text-primary)] cursor-pointer"
              >
                1.25x (Brisk)
              </button>
            </div>
          </div>

          {/* 5. Pitch */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                Voice Pitch (آواز کا سر)
              </label>
              <span className="text-xs font-semibold text-[var(--text-primary)] bg-[var(--surface-secondary)] px-2 py-0.5 rounded-md border border-[var(--border)]">
                {settings.pitch.toFixed(2)} {settings.pitch === 1.0 ? '• Standard' : ''}
              </span>
            </div>
            <input
              type="range"
              min="0.8"
              max="1.2"
              step="0.05"
              value={settings.pitch}
              onChange={(e) => updateSettings({ pitch: parseFloat(e.target.value) })}
              className="w-full accent-[var(--accent)] cursor-pointer"
            />
            <div className="flex justify-between items-center text-[11px] text-[var(--text-muted)]">
              <span>0.80 (Deeper)</span>
              <button
                type="button"
                onClick={() => updateSettings({ pitch: 1.0 })}
                className="font-semibold text-[var(--text-secondary)] cursor-pointer"
              >
                1.00 (Standard)
              </button>
              <span>1.20 (Higher)</span>
            </div>
          </div>

          {/* 6. Test Voice Controls */}
          <div className="p-4 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <span className="text-xs font-semibold text-[var(--text-primary)] block">
                Test Current Voice Settings (آواز کا معائنہ کریں)
              </span>
              <p className="text-[11px] text-[var(--text-muted)]">
                Plays a natural sample with your configured speed, voice, and language.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {isTesting ? (
                <button
                  type="button"
                  onClick={stopTest}
                  className="px-4 py-2 rounded-xl bg-rose-700 text-white font-semibold text-xs flex items-center gap-1.5 hover:bg-rose-600 transition-colors cursor-pointer"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                  Stop Test
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => testVoice()}
                  className="px-4 py-2 rounded-xl bg-[var(--button-primary-bg)] text-[var(--button-primary-text)] font-semibold text-xs flex items-center gap-1.5 hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  Test Voice
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[var(--surface-secondary)] p-4 px-6 border-t border-[var(--border)] flex items-center justify-between">
          <button
            type="button"
            onClick={resetSettings}
            className="text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset to Default
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-[var(--button-primary-bg)] text-[var(--button-primary-text)] text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
          >
            Save & Close
          </button>
        </div>
      </div>
    </div>
  );
};
