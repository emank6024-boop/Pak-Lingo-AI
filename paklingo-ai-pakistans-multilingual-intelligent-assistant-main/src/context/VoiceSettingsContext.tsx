import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  VoiceSettings,
  DEFAULT_VOICE_SETTINGS,
  AI_VOICES,
  AiVoiceOption,
  findBestUrduVoice,
  findBestEnglishVoice,
  clearVoiceCache,
  URDU_VOICE_MISSING_MESSAGE,
} from '../utils/speech';

interface VoiceSettingsContextType {
  settings: VoiceSettings;
  updateSettings: (newSettings: Partial<VoiceSettings>) => void;
  resetSettings: () => void;
  availableVoices: SpeechSynthesisVoice[];
  aiVoices: AiVoiceOption[];
  isAiTtsAvailable: boolean;
  hasUrduVoice: boolean;
  bestUrduVoice: SpeechSynthesisVoice | null;
  bestEnglishVoice: SpeechSynthesisVoice | null;
  urduVoices: SpeechSynthesisVoice[];
  englishVoices: SpeechSynthesisVoice[];
  isUrduVoiceUsable: boolean;
  testVoice: (customText?: string) => void;
  stopTest: () => void;
  isTesting: boolean;
  testError: string | null;
  clearTestError: () => void;
  isVoiceModalOpen: boolean;
  openVoiceModal: () => void;
  closeVoiceModal: () => void;
}

const STORAGE_KEY = 'paklingo_voice_settings_v4';

const VoiceSettingsContext = createContext<VoiceSettingsContextType | undefined>(undefined);

export const VoiceSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<VoiceSettings>(() => {
    if (typeof window === 'undefined') return DEFAULT_VOICE_SETTINGS;
    try {
      const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('paklingo_voice_settings_v3');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          preferredEngine: parsed.preferredEngine === 'gemini' ? 'auto' : (parsed.preferredEngine || DEFAULT_VOICE_SETTINGS.preferredEngine),
          languageMode: parsed.languageMode || DEFAULT_VOICE_SETTINGS.languageMode,
          selectedAiVoice: parsed.selectedAiVoice || DEFAULT_VOICE_SETTINGS.selectedAiVoice,
          selectedVoiceURI: parsed.selectedVoiceURI ?? null,
          speed: typeof parsed.speed === 'number' ? parsed.speed : DEFAULT_VOICE_SETTINGS.speed,
          pitch: typeof parsed.pitch === 'number' ? parsed.pitch : DEFAULT_VOICE_SETTINGS.pitch,
        };
      }
    } catch {
      // ignore
    }
    return DEFAULT_VOICE_SETTINGS;
  });

  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        const v = window.speechSynthesis.getVoices();
        if (v && v.length > 0) return v;
      } catch {
        // ignore
      }
    }
    return [];
  });
  const [isAiTtsAvailable, setIsAiTtsAvailable] = useState<boolean>(true);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testError, setTestError] = useState<string | null>(null);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState<boolean>(false);

  const openVoiceModal = useCallback(() => setIsVoiceModalOpen(true), []);
  const closeVoiceModal = useCallback(() => setIsVoiceModalOpen(false), []);

  const testUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const testAudioRef = useRef<HTMLAudioElement | null>(null);

  // Check server-side Gemini TTS availability on mount
  useEffect(() => {
    fetch('/api/tts/status')
      .then((res) => res.json())
      .then((data) => {
        if (typeof data.geminiTTSAvailable === 'boolean') {
          setIsAiTtsAvailable(data.geminiTTSAvailable);
        }
      })
      .catch(() => {
        // Keep true by default, fallback will handle if offline
      });
  }, []);

  // Load voices from browser
  const refreshVoices = useCallback(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setAvailableVoices([]);
      return;
    }

    try {
      const voices = window.speechSynthesis.getVoices();
      if (voices && voices.length > 0) {
        clearVoiceCache();
        setAvailableVoices(voices);
      }
    } catch {
      setAvailableVoices([]);
    }
  }, []);

  useEffect(() => {
    refreshVoices();

    // Multi-stage polling for asynchronous browser speech engines
    const timer1 = setTimeout(refreshVoices, 100);
    const timer2 = setTimeout(refreshVoices, 400);
    const timer3 = setTimeout(refreshVoices, 1200);

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = refreshVoices;
    }
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, [refreshVoices]);

  // Derived categorized voices with memoization
  const urduVoices = useMemo(() => {
    return availableVoices.filter((v) => {
      const lang = v.lang.toLowerCase();
      const name = v.name.toLowerCase();
      return lang.startsWith('ur') || name.includes('urdu') || name.includes('اردو') || name.includes('pakistan');
    });
  }, [availableVoices]);

  const englishVoices = useMemo(() => {
    return availableVoices.filter((v) => {
      const lang = v.lang.toLowerCase();
      return lang.startsWith('en');
    });
  }, [availableVoices]);

  const bestUrduVoice = useMemo(() => findBestUrduVoice(availableVoices), [availableVoices]);
  const bestEnglishVoice = useMemo(() => findBestEnglishVoice(availableVoices), [availableVoices]);
  const hasUrduVoice = bestUrduVoice !== null;
  // A usable Urdu voice is available if the device has an Urdu voice OR if AI TTS can be used by the application
  const isUrduVoiceUsable = hasUrduVoice || isAiTtsAvailable;

  // Automatically use Urdu voice when available and clear any error state
  useEffect(() => {
    if (bestUrduVoice) {
      // If no voice is selected or selected voice is invalid, automatically adopt the best Urdu voice
      if (!settings.selectedVoiceURI || !availableVoices.some((v) => v.voiceURI === settings.selectedVoiceURI)) {
        setSettings((prev) => ({ ...prev, selectedVoiceURI: bestUrduVoice.voiceURI }));
      }
      setTestError(null);
    }
  }, [bestUrduVoice, availableVoices, settings.selectedVoiceURI]);

  // Persist settings changes
  const updateSettings = useCallback((newSettings: Partial<VoiceSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_VOICE_SETTINGS);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_VOICE_SETTINGS));
    } catch {
      // ignore
    }
  }, []);

  const clearTestError = useCallback(() => {
    setTestError(null);
  }, []);

  const stopTest = useCallback(() => {
    setIsTesting(false);
    if (testAudioRef.current) {
      try {
        testAudioRef.current.pause();
        testAudioRef.current.currentTime = 0;
        testAudioRef.current.src = '';
      } catch {}
      testAudioRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
        window.speechSynthesis.cancel();
      } catch {}
    }
    testUtteranceRef.current = null;
    setTestError(null);
  }, []);

  const testVoice = useCallback(
    async (customText?: string) => {
      setTestError(null);
      stopTest();

      // Determine sample text based on language mode
      let sampleText = customText;
      let targetLang = 'ur';
      let isUrdu = true;

      if (settings.languageMode === 'en-US') {
        sampleText =
          sampleText ||
          'Hello! Welcome to PakLingo AI. Voice synthesis is functioning naturally.';
        targetLang = 'en';
        isUrdu = false;
      } else if (settings.languageMode === 'ps') {
        sampleText = sampleText || 'سلام! پاک لنگو ای آی ته ښه راغلاست.';
        targetLang = 'ps';
        isUrdu = false;
      } else if (settings.languageMode === 'sd-PK') {
        sampleText = sampleText || 'ڀلي ڪري آيا! پاڪ لنگو اي آئي ۾ ڀليڪار.';
        targetLang = 'sd';
        isUrdu = false;
      } else if (settings.languageMode === 'pa-PK') {
        sampleText = sampleText || 'جی آیاں نوں! پاک لنگو اے آئی وچ خوش آمدید۔';
        targetLang = 'pa';
        isUrdu = false;
      } else if (settings.languageMode === 'roman-urdu') {
        sampleText = sampleText || 'Assalam-o-Alaikum! PakLingo AI mein khushamdeed. Awaz theek chal rahi hai.';
        targetLang = 'ur';
        isUrdu = true;
      } else {
        // Auto or Urdu mode
        sampleText = sampleText || 'السلام علیکم! پاک لنگو اے آئی میں خوش آمدید۔ آواز کا نظام فعال ہے۔';
        targetLang = 'ur';
        isUrdu = true;
      }

      // 1. Try Gemini AI TTS if preferred
      if (settings.preferredEngine !== 'browser') {
        setIsTesting(true);
        try {
          const res = await fetch('/api/tts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: sampleText,
              language: targetLang,
              voice: settings.selectedAiVoice || 'Kore',
            }),
          });

          const data = await res.json();
          if (data.success && data.audioBase64) {
            const audio = new Audio(`data:${data.mimeType || 'audio/wav'};base64,${data.audioBase64}`);
            testAudioRef.current = audio;
            audio.playbackRate = settings.speed;

            audio.onended = () => {
              setIsTesting(false);
              testAudioRef.current = null;
            };
            audio.onerror = () => {
              setIsTesting(false);
              testAudioRef.current = null;
            };

            await audio.play();
            return;
          }
        } catch {
          // Proceed to browser test fallback
        }
      }

      // 2. Browser Voice fallback test
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        setIsTesting(false);
        setTestError('Speech synthesis is not supported on this browser.');
        return;
      }

      let targetVoice: SpeechSynthesisVoice | null = isUrdu ? bestUrduVoice : bestEnglishVoice;
      let targetBcp47 = isUrdu ? 'ur-PK' : 'en-US';

      if (settings.selectedVoiceURI) {
        const explicit = availableVoices.find((v) => v.voiceURI === settings.selectedVoiceURI);
        if (explicit) {
          targetVoice = explicit;
          targetBcp47 = explicit.lang;
        }
      }

      if (isUrdu && !targetVoice) {
        setIsTesting(false);
        setTestError(URDU_VOICE_MISSING_MESSAGE);
        return;
      }

      if (!isUrdu && !targetVoice) {
        targetVoice = availableVoices.find((v) => v.lang.toLowerCase().startsWith('en')) || null;
      }

      try {
        setIsTesting(true);
        const utterance = new SpeechSynthesisUtterance(sampleText);
        testUtteranceRef.current = utterance;
        utterance.lang = targetBcp47;
        if (targetVoice) {
          utterance.voice = targetVoice;
        }
        utterance.rate = settings.speed;
        utterance.pitch = settings.pitch;

        utterance.onstart = () => {
          setIsTesting(true);
        };
        utterance.onend = () => {
          setIsTesting(false);
          testUtteranceRef.current = null;
        };
        utterance.onerror = (e: any) => {
          setIsTesting(false);
          testUtteranceRef.current = null;
          if (e.error !== 'interrupted' && e.error !== 'canceled') {
            setTestError(`Voice playback error: ${e.error || 'Unknown error'}`);
          }
        };

        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
        window.speechSynthesis.speak(utterance);
      } catch (err: any) {
        setIsTesting(false);
        setTestError(err?.message || 'Could not start test voice playback.');
      }
    },
    [settings, bestUrduVoice, bestEnglishVoice, availableVoices, stopTest]
  );

  return (
    <VoiceSettingsContext.Provider
      value={{
        settings,
        updateSettings,
        resetSettings,
        availableVoices,
        aiVoices: AI_VOICES,
        isAiTtsAvailable,
        hasUrduVoice,
        bestUrduVoice,
        bestEnglishVoice,
        urduVoices,
        englishVoices,
        isUrduVoiceUsable,
        testVoice,
        stopTest,
        isTesting,
        testError,
        clearTestError,
        isVoiceModalOpen,
        openVoiceModal,
        closeVoiceModal,
      }}
    >
      {children}
    </VoiceSettingsContext.Provider>
  );
};

export const useVoiceSettings = () => {
  const context = useContext(VoiceSettingsContext);
  if (!context) {
    throw new Error('useVoiceSettings must be used within a VoiceSettingsProvider');
  }
  return context;
};
