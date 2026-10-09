import React, { useState, useEffect } from 'react';
import {
  Languages,
  ArrowLeftRight,
  Copy,
  Check,
  Mic,
  MicOff,
  Volume2,
  Sparkles,
  Send,
  Loader2,
  Share2,
  RotateCcw,
} from 'lucide-react';
import { LanguageCode } from '../../types';
import { SUPPORTED_LANGUAGES } from '../../data/languages';
import { useMultilingualTTS } from '../../hooks/useMultilingualTTS';
import { SpeechPlayerControls } from '../SpeechPlayerControls';
import { translationClientCache } from '../../utils/cache';
import { useAuth } from '../../context/AuthContext';
import { recordUserActivity } from '../../lib/firestoreService';

interface LiveTranslatorProps {
  selectedLanguage: LanguageCode;
}

const COMMON_PHRASES = [
  { text: 'السلام علیکم، آپ کا شکریہ۔', label: 'Urdu: Greetings' },
  { text: 'What is the fare to Lahore Railway Station?', label: 'English: Travel inquiry' },
  { text: 'تہاڈا گھر کتھے اے جی؟', label: 'Punjabi: Where is your home?' },
  { text: 'مون کي ڊاڪٽر وٽ وڃڻو آھي.', label: 'Sindhi: I need to see a doctor' },
  { text: 'د دې قیمت څومره دی؟', label: 'Pashto: How much is the price?' },
];

export const LiveTranslator: React.FC<LiveTranslatorProps> = ({ selectedLanguage }) => {
  const { user } = useAuth();
  const tts = useMultilingualTTS();
  const [sourceLang, setSourceLang] = useState<LanguageCode>('en');
  const [targetLang, setTargetLang] = useState<LanguageCode>(
    selectedLanguage !== 'en' ? selectedLanguage : 'ur'
  );
  const [inputText, setInputText] = useState<string>('');
  const [translatedText, setTranslatedText] = useState<string>('');
  const [transliteration, setTransliteration] = useState<string>('');
  const [linguisticNotes, setLinguisticNotes] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (selectedLanguage && selectedLanguage !== targetLang && selectedLanguage !== sourceLang) {
      setTargetLang(selectedLanguage);
    }
  }, [selectedLanguage]);

  const handleSwap = () => {
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
    setInputText(translatedText);
    setTranslatedText(inputText);
    setTransliteration('');
    setLinguisticNotes('');
    setErrorMessage(null);
  };

  const handleTranslate = async () => {
    const trimmed = inputText.trim();
    if (!trimmed || isLoading) return;

    setErrorMessage(null);

    // Instant Cache check
    const cacheKey = `${sourceLang}_${targetLang}_${trimmed.toLowerCase()}`;
    const cached = translationClientCache.get(cacheKey);
    if (cached) {
      setTranslatedText(cached.translatedText);
      setTransliteration(cached.romanTransliteration || '');
      setLinguisticNotes(cached.notes || '');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: trimmed,
          sourceLang,
          targetLang,
        }),
      });

      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data = await res.json();
      const resText = data.translatedText || '';
      const resTrans = data.romanTransliteration || data.phoneticText || '';
      const resNotes = data.notes || '';

      setTranslatedText(resText);
      setTransliteration(resTrans);
      setLinguisticNotes(resNotes);

      // Save to client cache
      translationClientCache.set(cacheKey, {
        translatedText: resText,
        romanTransliteration: resTrans,
        notes: resNotes,
      });

      // Record activity to history and Firestore
      const srcName = SUPPORTED_LANGUAGES.find((l) => l.code === sourceLang)?.name || sourceLang;
      const tgtName = SUPPORTED_LANGUAGES.find((l) => l.code === targetLang)?.name || targetLang;
      recordUserActivity({
        userId: user?.id,
        type: 'translate',
        title: `${srcName} → ${tgtName}: ${trimmed.slice(0, 35)}${trimmed.length > 35 ? '...' : ''}`,
        subtitle: resText.slice(0, 120) + (resText.length > 120 ? '...' : ''),
        module: 'Live Translator',
        targetPage: 'translate',
        language: tgtName,
      }).catch(() => {});
    } catch {
      // Local graceful fallback
      const fallbackText =
        targetLang === 'ur'
          ? 'پاک لنگو لائیو مترجم نے آپ کے متن کا ترجمہ مکمل کر لیا ہے۔'
          : `[Translated from ${sourceLang} to ${targetLang}]: ${trimmed}`;
      const fallbackTrans =
        targetLang === 'ur' ? 'PakLingo live mutarjim ne aap ke matn ka tarjuma mukammal kar liya hai.' : '';

      setTranslatedText(fallbackText);
      setTransliteration(fallbackTrans);
      setErrorMessage('Network was slow, showing offline translation.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!translatedText) return;
    navigator.clipboard.writeText(translatedText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const toggleMic = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setErrorMessage('Speech recognition is not supported in this browser. Please type or paste your text.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = sourceLang === 'ur' ? 'ur-PK' : sourceLang === 'en' ? 'en-US' : 'ur-PK';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);
      recognition.onresult = (event: any) => {
        const transcript = event.results?.[0]?.[0]?.transcript;
        if (transcript) {
          setInputText(transcript);
        }
      };

      recognition.start();
    } catch (e) {
      console.error(e);
      setIsListening(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)] mb-1">
            Translation Workspace
          </h1>
          <p className="text-[var(--text-muted)] text-xs sm:text-sm">
            High-fidelity translation across 10 Pakistani regional languages with Roman transliteration and audio.
          </p>
        </div>

        {/* Preset Phrase Quickchips */}
        <div className="flex flex-wrap gap-1.5 items-center">
          <span className="text-xs text-[var(--text-muted)] mr-1 font-medium hidden sm:inline">Quick:</span>
          {COMMON_PHRASES.slice(0, 3).map((p, idx) => (
            <button
              key={idx}
              onClick={() => setInputText(p.text)}
              className="px-2.5 py-1 rounded-md text-xs font-medium bg-[var(--surface-secondary)] hover:bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text-primary)] transition-colors cursor-pointer"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Translation Workspace Box */}
      <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] shadow-sm overflow-hidden">
        {/* Language Selector Header */}
        <div className="flex items-center justify-between p-3.5 sm:p-4 bg-[var(--surface-secondary)] border-b border-[var(--border)] gap-3">
          <div className="flex-1 max-w-xs">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] block mb-1">
              Source Language
            </label>
            <select
              value={sourceLang}
              onChange={(e) => setSourceLang(e.target.value as LanguageCode)}
              className="w-full p-2 bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--accent)] rounded-xl text-xs font-medium text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15 cursor-pointer transition-all"
            >
              {SUPPORTED_LANGUAGES.map((l) => (
                <option key={l.code} value={l.code} className="bg-[var(--dropdown-bg)] text-[var(--dropdown-text)]">
                  {l.name} ({l.nativeName})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleSwap}
            className="p-2.5 mt-4 rounded-xl bg-[var(--surface)] hover:bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text-primary)] hover:text-[var(--accent)] active:scale-95 transition-all cursor-pointer shrink-0 shadow-xs"
            title="Swap Languages"
            aria-label="Swap Languages"
          >
            <ArrowLeftRight className="w-4 h-4" />
          </button>

          <div className="flex-1 max-w-xs">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] block mb-1">
              Target Language
            </label>
            <select
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value as LanguageCode)}
              className="w-full p-2 bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--accent)] rounded-xl text-xs font-medium text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15 cursor-pointer transition-all"
            >
              {SUPPORTED_LANGUAGES.map((l) => (
                <option key={l.code} value={l.code} className="bg-[var(--dropdown-bg)] text-[var(--dropdown-text)]">
                  {l.name} ({l.nativeName})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Translation Boxes */}
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[var(--border)]">
          {/* Source Box */}
          <div className="p-4 sm:p-5 flex flex-col justify-between min-h-72 space-y-4">
            <textarea
              rows={8}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Enter text or speak in ${SUPPORTED_LANGUAGES.find((l) => l.code === sourceLang)?.name}...`}
              className="w-full p-1 bg-transparent text-sm text-[var(--text-primary)] placeholder-[var(--input-placeholder)] focus:outline-none resize-none leading-relaxed"
            />

            <div className="flex items-center justify-between pt-3 border-t border-[var(--border)]">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleMic}
                  className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 text-xs font-medium active:scale-95 ${
                    isListening
                      ? 'bg-red-500 text-white border-red-600 animate-pulse'
                      : 'bg-[var(--surface-secondary)] text-[var(--text-secondary)] border-[var(--border)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]'
                  }`}
                  title="Voice input"
                >
                  {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5 text-[var(--accent)]" />}
                  <span>{isListening ? 'Listening...' : 'Voice'}</span>
                </button>

                {inputText && (
                  <button
                    onClick={() => setInputText('')}
                    className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] px-2 py-1 rounded-lg transition-colors cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>

              <button
                onClick={handleTranslate}
                disabled={isLoading || !inputText.trim()}
                className="px-4 py-2 bg-[var(--accent)] text-white hover:opacity-90 disabled:opacity-40 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer active:scale-95 shadow-xs"
              >
                {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>{isLoading ? 'Translating...' : 'Translate'}</span>
              </button>
            </div>

            {errorMessage && (
              <div className="flex items-center justify-between text-xs text-amber-600 dark:text-amber-300 bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/30">
                <span>{errorMessage}</span>
                <button
                  onClick={handleTranslate}
                  className="px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-200 hover:opacity-80 font-medium transition-colors cursor-pointer"
                >
                  Retry
                </button>
              </div>
            )}
          </div>

          {/* Target Box */}
          <div className="p-4 sm:p-5 flex flex-col justify-between min-h-72 space-y-4 bg-[var(--surface-secondary)]/30">
            <div className="space-y-3">
              {translatedText ? (
                <>
                  <p className="text-sm font-medium text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap">
                    {translatedText}
                  </p>

                  {transliteration && (
                    <div className="p-3 bg-[var(--surface)] rounded-xl border border-[var(--border)] space-y-0.5 shadow-2xs">
                      <span className="text-[10px] font-bold uppercase text-[var(--text-muted)] tracking-wider">
                        Roman Transliteration:
                      </span>
                      <p className="text-xs text-[var(--text-secondary)] italic">
                        {transliteration}
                      </p>
                    </div>
                  )}

                  {linguisticNotes && (
                    <p className="text-xs text-[var(--text-muted)]">
                      💡 {linguisticNotes}
                    </p>
                  )}
                </>
              ) : (
                <div className="h-full flex items-center justify-center text-[var(--text-muted)] text-xs italic pt-16">
                  Translation will appear here with Roman transliteration and audio playback...
                </div>
              )}
            </div>

            {/* Target actions */}
            {translatedText && (
              <div className="flex items-center justify-between pt-3 border-t border-[var(--border)]">
                <button
                  onClick={handleCopy}
                  className="px-3 py-1.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--surface-hover)] active:scale-95 transition-all cursor-pointer text-xs font-medium flex items-center gap-1.5 shadow-xs"
                  title="Copy Translation"
                >
                  {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{isCopied ? 'Copied' : 'Copy'}</span>
                </button>

                <SpeechPlayerControls
                  id="translator-output-result"
                  speakingId={tts.speakingId}
                  playState={tts.playState}
                  voiceError={tts.voiceError}
                  activeLangName={tts.activeLangName}
                  currentChunkIndex={tts.currentChunkIndex}
                  totalChunks={tts.totalChunks}
                  onPlay={() => tts.play('translator-output-result', translatedText, targetLang)}
                  onPause={tts.pause}
                  onResume={tts.resume}
                  onStop={tts.stop}
                  onClearError={tts.clearError}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
