import { useState, useEffect, useRef, useCallback } from 'react';
import {
  findCompatibleVoice,
  detectLanguageAndScript,
  splitTextIntoExactChunks,
  cleanTextForSpeech,
  TTSPlayState,
  URDU_VOICE_MISSING_MESSAGE,
} from '../utils/speech';
import { useVoiceSettings } from '../context/VoiceSettingsContext';

export interface UseMultilingualTTSReturn {
  isSupported: boolean;
  speakingId: string | null;
  playState: TTSPlayState;
  voiceError: string | null;
  activeLangName: string | null;
  currentChunkIndex: number;
  totalChunks: number;
  statusMessage: string | null;
  activeEngine: 'ai' | 'browser' | null;
  play: (id: string, exactText: string, selectedLang?: string) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  clearError: () => void;
  // Friendly aliases for easy consumption across components
  speak: (exactText: string, selectedLang?: string) => void;
  stopSpeaking: () => void;
  isSpeaking: boolean;
  currentlySpeakingText: string | null;
  playSpeech: (id: string, exactText: string, selectedLang?: string) => void;
  pauseSpeech: () => void;
  resumeSpeech: () => void;
  stopSpeech: () => void;
  clearSpeechError: () => void;
}

// In-memory client-side audio cache to avoid duplicate network fetches
const clientAudioCache = new Map<string, string>();

// Module-level reference to prevent browser garbage collection of active utterance
let globalUtteranceHolder: SpeechSynthesisUtterance | null = null;

export function useMultilingualTTS(): UseMultilingualTTSReturn {
  const { settings, availableVoices, isAiTtsAvailable } = useVoiceSettings();

  const [isSupported, setIsSupported] = useState<boolean>(true);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [playState, setPlayState] = useState<TTSPlayState>('idle');
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [activeLangName, setActiveLangName] = useState<string | null>(null);
  const [currentChunkIndex, setCurrentChunkIndex] = useState<number>(0);
  const [totalChunks, setTotalChunks] = useState<number>(0);
  const [activeEngine, setActiveEngine] = useState<'ai' | 'browser' | null>(null);
  const [currentlySpeakingText, setCurrentlySpeakingText] = useState<string | null>(null);

  // References to preserve state across renders & avoid garbage collection
  const chunksRef = useRef<string[]>([]);
  const chunkIndexRef = useRef<number>(0);
  const targetVoiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const targetBcp47Ref = useRef<string>('ur-PK');
  const isPausedRef = useRef<boolean>(false);
  const isCancelledRef = useRef<boolean>(false);
  const activeIdRef = useRef<string | null>(null);
  const activeUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const activeSourceRef = useRef<'ai' | 'browser' | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const startTimerRef = useRef<any>(null);
  const finishedTimerRef = useRef<any>(null);
  const keepAliveTimerRef = useRef<any>(null);

  // Helper to fetch latest voices reliably across all browsers without lag
  const getLatestVoices = useCallback((): SpeechSynthesisVoice[] => {
    if (availableVoices && availableVoices.length > 0) {
      return availableVoices;
    }
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return [];
    }
    try {
      const v = window.speechSynthesis.getVoices();
      if (v && v.length > 0) return v;
      return [];
    } catch {
      return [];
    }
  }, [availableVoices]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
      if (currentAudioRef.current) {
        try {
          currentAudioRef.current.pause();
          currentAudioRef.current.src = '';
        } catch {}
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        try {
          if (window.speechSynthesis.paused) {
            window.speechSynthesis.resume();
          }
          window.speechSynthesis.cancel();
        } catch {}
      }
      globalUtteranceHolder = null;
      if (keepAliveTimerRef.current) {
        clearInterval(keepAliveTimerRef.current);
      }
      if (startTimerRef.current) {
        clearTimeout(startTimerRef.current);
      }
      if (finishedTimerRef.current) {
        clearTimeout(finishedTimerRef.current);
      }
    };
  }, []);

  // Chrome keep-alive: prevent browser speech from pausing unexpectedly on long utterances
  useEffect(() => {
    if (playState === 'speaking' && activeSourceRef.current === 'browser') {
      keepAliveTimerRef.current = setInterval(() => {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
          if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
            window.speechSynthesis.pause();
            window.speechSynthesis.resume();
          }
        }
      }, 8000);
    } else {
      if (keepAliveTimerRef.current) {
        clearInterval(keepAliveTimerRef.current);
        keepAliveTimerRef.current = null;
      }
    }

    return () => {
      if (keepAliveTimerRef.current) {
        clearInterval(keepAliveTimerRef.current);
        keepAliveTimerRef.current = null;
      }
    };
  }, [playState]);

  const clearError = useCallback(() => {
    setVoiceError(null);
  }, []);

  const stop = useCallback(() => {
    isCancelledRef.current = true;
    isPausedRef.current = false;
    activeIdRef.current = null;
    activeUtteranceRef.current = null;
    globalUtteranceHolder = null;
    activeSourceRef.current = null;

    // Abort any pending network fetch
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;

    if (startTimerRef.current) {
      clearTimeout(startTimerRef.current);
      startTimerRef.current = null;
    }
    if (finishedTimerRef.current) {
      clearTimeout(finishedTimerRef.current);
      finishedTimerRef.current = null;
    }
    if (keepAliveTimerRef.current) {
      clearInterval(keepAliveTimerRef.current);
      keepAliveTimerRef.current = null;
    }

    // Stop HTML5 Audio if playing
    if (currentAudioRef.current) {
      try {
        currentAudioRef.current.pause();
        currentAudioRef.current.currentTime = 0;
        currentAudioRef.current.src = '';
      } catch {}
      currentAudioRef.current = null;
    }

    // Stop browser speechSynthesis
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
        window.speechSynthesis.cancel();
      } catch {}
    }

    setSpeakingId(null);
    setPlayState('idle');
    setActiveEngine(null);
    setCurrentChunkIndex(0);
    setTotalChunks(0);
    setCurrentlySpeakingText(null);
  }, []);

  // --------------------------------------------------------------------------
  // BROWSER SPEECH SYNTHESIS ENGINE (Instant 0ms latency)
  // --------------------------------------------------------------------------
  const speakBrowserCurrentChunk = useCallback(() => {
    if (
      isCancelledRef.current ||
      isPausedRef.current ||
      typeof window === 'undefined' ||
      !('speechSynthesis' in window)
    ) {
      return;
    }

    if (chunkIndexRef.current >= chunksRef.current.length) {
      activeUtteranceRef.current = null;
      globalUtteranceHolder = null;
      setPlayState('finished');

      if (finishedTimerRef.current) clearTimeout(finishedTimerRef.current);
      finishedTimerRef.current = setTimeout(() => {
        setPlayState((prev) => (prev === 'finished' ? 'idle' : prev));
        setSpeakingId((prev) => (prev === activeIdRef.current ? null : prev));
        activeIdRef.current = null;
        setActiveEngine(null);
      }, 2500);
      return;
    }

    const chunk = chunksRef.current[chunkIndexRef.current];
    if (!chunk || !chunk.trim()) {
      chunkIndexRef.current += 1;
      setCurrentChunkIndex(chunkIndexRef.current);
      speakBrowserCurrentChunk();
      return;
    }

    try {
      const utterance = new SpeechSynthesisUtterance(chunk);
      activeUtteranceRef.current = utterance;
      globalUtteranceHolder = utterance;

      utterance.lang = targetBcp47Ref.current;
      if (targetVoiceRef.current) {
        utterance.voice = targetVoiceRef.current;
      }
      utterance.rate = settings.speed;
      utterance.pitch = settings.pitch;

      // Provide immediate speaking state feedback
      setPlayState('speaking');
      setActiveEngine('browser');

      utterance.onstart = () => {
        if (isCancelledRef.current || isPausedRef.current) return;
        setPlayState('speaking');
        setActiveEngine('browser');
      };

      utterance.onend = () => {
        activeUtteranceRef.current = null;
        globalUtteranceHolder = null;
        if (isCancelledRef.current || isPausedRef.current) return;
        chunkIndexRef.current += 1;
        setCurrentChunkIndex(chunkIndexRef.current);
        speakBrowserCurrentChunk();
      };

      utterance.onerror = (e: any) => {
        activeUtteranceRef.current = null;
        globalUtteranceHolder = null;
        if (e.error === 'interrupted' || e.error === 'canceled') {
          return;
        }

        if (chunkIndexRef.current < chunksRef.current.length - 1 && !isCancelledRef.current) {
          chunkIndexRef.current += 1;
          setCurrentChunkIndex(chunkIndexRef.current);
          speakBrowserCurrentChunk();
        } else {
          setPlayState('idle');
          setSpeakingId(null);
          activeIdRef.current = null;
          setActiveEngine(null);
        }
      };

      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.error('SpeechSynthesis.speak failed:', err);
      setPlayState('idle');
      setSpeakingId(null);
      activeIdRef.current = null;
      setActiveEngine(null);
    }
  }, [settings.speed, settings.pitch]);

  const speakWithBrowser = useCallback(
    (
      textToSpeak: string,
      targetBcp47: string,
      targetVoice: SpeechSynthesisVoice | null
    ) => {
      activeSourceRef.current = 'browser';
      targetBcp47Ref.current = targetBcp47;
      targetVoiceRef.current = targetVoice;
      setActiveEngine('browser');
      setPlayState('speaking');

      // Safe sentence chunking for browser speech (avoids Chromium speech cut-off)
      const chunks = splitTextIntoExactChunks(textToSpeak, 180);
      chunksRef.current = chunks;
      chunkIndexRef.current = 0;
      setCurrentChunkIndex(0);
      setTotalChunks(chunks.length);

      // Speak IMMEDIATELY without artificial delay
      speakBrowserCurrentChunk();
    },
    [speakBrowserCurrentChunk]
  );

  // --------------------------------------------------------------------------
  // AI GEMINI TTS SPEECH (For Natural High-Quality Audio or Missing Voice Fallback)
  // --------------------------------------------------------------------------
  const playAiChunk = useCallback(
    async (
      index: number,
      chunks: string[],
      targetBcp47: string,
      isUrduRequired: boolean,
      langDisplayName: string,
      currentVoices: SpeechSynthesisVoice[]
    ) => {
      if (isCancelledRef.current) return;

      if (index >= chunks.length) {
        setPlayState('finished');
        if (finishedTimerRef.current) clearTimeout(finishedTimerRef.current);
        finishedTimerRef.current = setTimeout(() => {
          setPlayState((prev) => (prev === 'finished' ? 'idle' : prev));
          setSpeakingId((prev) => (prev === activeIdRef.current ? null : prev));
          activeIdRef.current = null;
          setActiveEngine(null);
        }, 2500);
        return;
      }

      const chunkText = chunks[index];
      if (!chunkText || !chunkText.trim()) {
        chunkIndexRef.current = index + 1;
        setCurrentChunkIndex(index + 1);
        playAiChunk(index + 1, chunks, targetBcp47, isUrduRequired, langDisplayName, currentVoices);
        return;
      }

      setPlayState('preparing');
      setActiveEngine('ai');

      try {
        const cacheKey = `${settings.selectedAiVoice}_${targetBcp47}_${chunkText.trim()}`;
        let audioDataUrl = clientAudioCache.get(cacheKey);

        if (!audioDataUrl) {
          const controller = new AbortController();
          abortControllerRef.current = controller;

          const res = await fetch('/api/tts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: chunkText,
              language: targetBcp47.split('-')[0] || 'ur',
              voice: settings.selectedAiVoice || 'Kore',
            }),
            signal: controller.signal,
          });

          const data = await res.json();
          if (!data.success || !data.audioBase64) {
            // Check if browser voice is available before falling back
            const fallbackVoice = findCompatibleVoice(currentVoices, targetBcp47, settings.selectedVoiceURI);
            if (fallbackVoice || !isUrduRequired) {
              speakWithBrowser(chunks.slice(index).join(' '), targetBcp47, fallbackVoice);
            } else {
              setVoiceError(URDU_VOICE_MISSING_MESSAGE);
              setPlayState('idle');
              setSpeakingId(null);
              activeIdRef.current = null;
              setActiveEngine(null);
            }
            return;
          }

          audioDataUrl = `data:${data.mimeType || 'audio/wav'};base64,${data.audioBase64}`;
          clientAudioCache.set(cacheKey, audioDataUrl);
        }

        if (isCancelledRef.current) return;

        // Clean previous audio instance
        if (currentAudioRef.current) {
          try {
            currentAudioRef.current.pause();
            currentAudioRef.current.src = '';
          } catch {}
        }

        const audio = new Audio(audioDataUrl);
        currentAudioRef.current = audio;
        audio.playbackRate = settings.speed;

        audio.onplay = () => {
          if (isCancelledRef.current) {
            audio.pause();
            return;
          }
          setPlayState('speaking');
          setActiveEngine('ai');
        };

        audio.onpause = () => {
          if (!isCancelledRef.current && chunkIndexRef.current < chunks.length) {
            setPlayState((prev) => (prev === 'speaking' ? 'paused' : prev));
          }
        };

        audio.onended = () => {
          if (isCancelledRef.current) return;
          const nextIndex = index + 1;
          chunkIndexRef.current = nextIndex;
          setCurrentChunkIndex(nextIndex);
          playAiChunk(nextIndex, chunks, targetBcp47, isUrduRequired, langDisplayName, currentVoices);
        };

        audio.onerror = () => {
          const fallbackVoice = findCompatibleVoice(currentVoices, targetBcp47, settings.selectedVoiceURI);
          if (fallbackVoice || !isUrduRequired) {
            speakWithBrowser(chunks.slice(index).join(' '), targetBcp47, fallbackVoice);
          } else {
            setVoiceError(URDU_VOICE_MISSING_MESSAGE);
            setPlayState('idle');
            setSpeakingId(null);
            activeIdRef.current = null;
            setActiveEngine(null);
          }
        };

        await audio.play();
      } catch (err: any) {
        if (err.name === 'AbortError' || isCancelledRef.current) return;
        const fallbackVoice = findCompatibleVoice(currentVoices, targetBcp47, settings.selectedVoiceURI);
        if (fallbackVoice || !isUrduRequired) {
          speakWithBrowser(chunks.slice(index).join(' '), targetBcp47, fallbackVoice);
        } else {
          setVoiceError(URDU_VOICE_MISSING_MESSAGE);
          setPlayState('idle');
          setSpeakingId(null);
          activeIdRef.current = null;
          setActiveEngine(null);
        }
      }
    },
    [settings.selectedAiVoice, settings.speed, settings.selectedVoiceURI, speakWithBrowser]
  );

  // --------------------------------------------------------------------------
  // MAIN PLAY ORCHESTRATOR
  // --------------------------------------------------------------------------
  const play = useCallback(
    (id: string, exactText: string, selectedLang?: string) => {
      // 1. Prevent duplicate click issues: If already speaking this item, toggle pause cleanly
      if (activeIdRef.current === id && speakingId === id) {
        if (playState === 'speaking' || playState === 'playing') {
          pause();
          return;
        }
        if (playState === 'paused') {
          resume();
          return;
        }
      }

      // Clear any prior errors on a new intentional click
      setVoiceError(null);

      if (!exactText || !exactText.trim()) {
        return;
      }

      // 2. Abort previous playback cleanly
      abortControllerRef.current?.abort();
      abortControllerRef.current = null;

      if (startTimerRef.current) {
        clearTimeout(startTimerRef.current);
        startTimerRef.current = null;
      }
      if (finishedTimerRef.current) {
        clearTimeout(finishedTimerRef.current);
        finishedTimerRef.current = null;
      }

      if (currentAudioRef.current) {
        try {
          currentAudioRef.current.pause();
          currentAudioRef.current.currentTime = 0;
          currentAudioRef.current.src = '';
        } catch {}
        currentAudioRef.current = null;
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        try {
          if (window.speechSynthesis.paused) {
            window.speechSynthesis.resume();
          }
          window.speechSynthesis.cancel();
        } catch {}
      }

      isCancelledRef.current = false;
      isPausedRef.current = false;
      activeIdRef.current = id;
      activeUtteranceRef.current = null;
      globalUtteranceHolder = null;

      // 3. Immediate state updates for instant visual response
      setSpeakingId(id);
      setCurrentlySpeakingText(exactText);

      // 4. Resolve language and voice
      const textToSpeak = cleanTextForSpeech(exactText);

      let targetBcp47 = 'ur-PK';
      let langDisplayName = 'Urdu (Pakistan)';
      let isUrduRequired = true;

      if (settings.languageMode === 'en-US') {
        targetBcp47 = 'en-US';
        langDisplayName = 'English (US)';
        isUrduRequired = false;
      } else if (settings.languageMode === 'ur-PK') {
        targetBcp47 = 'ur-PK';
        langDisplayName = 'Urdu (Pakistan)';
        isUrduRequired = true;
      } else if (settings.languageMode === 'roman-urdu') {
        targetBcp47 = 'ur-PK';
        langDisplayName = 'Roman Urdu (Urdu Voice)';
        isUrduRequired = true;
      } else if (settings.languageMode === 'ps') {
        targetBcp47 = 'ps';
        langDisplayName = 'Pashto (پښتو)';
        isUrduRequired = false;
      } else if (settings.languageMode === 'pa-PK') {
        targetBcp47 = 'pa-PK';
        langDisplayName = 'Punjabi (پنجابی)';
        isUrduRequired = false;
      } else if (settings.languageMode === 'sd-PK') {
        targetBcp47 = 'sd-PK';
        langDisplayName = 'Sindhi (سنڌي)';
        isUrduRequired = false;
      } else if (settings.languageMode === 'bal') {
        targetBcp47 = 'bal';
        langDisplayName = 'Balochi (بلوچی)';
        isUrduRequired = false;
      } else if (settings.languageMode === 'skr-PK') {
        targetBcp47 = 'skr-PK';
        langDisplayName = 'Saraiki (سرائیکی)';
        isUrduRequired = false;
      } else {
        const detection = detectLanguageAndScript(textToSpeak, selectedLang);
        targetBcp47 = detection.targetBcp47;
        langDisplayName = detection.targetLangName;
        isUrduRequired = detection.isUrduTarget;
      }

      targetBcp47Ref.current = targetBcp47;
      setActiveLangName(langDisplayName);

      const currentVoices = getLatestVoices();
      const matchedVoice = findCompatibleVoice(currentVoices, targetBcp47, settings.selectedVoiceURI);

      // 5. Smart Engine Selection:
      // A) User specifically selected 'gemini' in Voice Settings modal -> use Gemini AI TTS
      if (settings.preferredEngine === 'gemini') {
        setPlayState('preparing');
        activeSourceRef.current = 'ai';
        setActiveEngine('ai');
        const chunks = splitTextIntoExactChunks(textToSpeak, 800);
        chunksRef.current = chunks;
        chunkIndexRef.current = 0;
        setCurrentChunkIndex(0);
        setTotalChunks(chunks.length);
        playAiChunk(0, chunks, targetBcp47, isUrduRequired, langDisplayName, currentVoices);
        return;
      }

      // B) User specifically selected 'browser' in Voice Settings modal -> use browser voice
      if (settings.preferredEngine === 'browser') {
        if (isUrduRequired && !matchedVoice) {
          // If browser lacks Urdu voice but AI TTS is available, automatically use AI TTS for smooth playback
          if (isAiTtsAvailable) {
            setPlayState('preparing');
            activeSourceRef.current = 'ai';
            setActiveEngine('ai');
            const chunks = splitTextIntoExactChunks(textToSpeak, 800);
            chunksRef.current = chunks;
            chunkIndexRef.current = 0;
            setCurrentChunkIndex(0);
            setTotalChunks(chunks.length);
            playAiChunk(0, chunks, targetBcp47, isUrduRequired, langDisplayName, currentVoices);
            return;
          }
          setVoiceError('An Urdu voice is not installed on this browser. You can enable AI speech in Voice Settings.');
          setPlayState('idle');
          setSpeakingId(null);
          activeIdRef.current = null;
          setActiveEngine(null);
          return;
        }
        speakWithBrowser(textToSpeak, targetBcp47, matchedVoice);
        return;
      }

      // C) Default 'auto' mode:
      // If a suitable voice is available in the browser (e.g. Urdu voice for Urdu or English voice for English),
      // USE IT IMMEDIATELY (0ms delay, no network latency)!
      if (matchedVoice) {
        setVoiceError(null);
        speakWithBrowser(textToSpeak, targetBcp47, matchedVoice);
        return;
      }

      // If Urdu is required but device has no browser Urdu voice installed:
      // Use Gemini AI TTS so the user still hears natural Urdu spoken!
      if (isUrduRequired) {
        if (isAiTtsAvailable) {
          setPlayState('preparing');
          activeSourceRef.current = 'ai';
          setActiveEngine('ai');
          const chunks = splitTextIntoExactChunks(textToSpeak, 800);
          chunksRef.current = chunks;
          chunkIndexRef.current = 0;
          setCurrentChunkIndex(0);
          setTotalChunks(chunks.length);
          playAiChunk(0, chunks, targetBcp47, isUrduRequired, langDisplayName, currentVoices);
          return;
        } else {
          // Both local voice and AI voice are unavailable: show the missing voice guide
          setVoiceError(URDU_VOICE_MISSING_MESSAGE);
          setPlayState('idle');
          setSpeakingId(null);
          activeIdRef.current = null;
          setActiveEngine(null);
          return;
        }
      }

      // For non-Urdu text where no exact match was found:
      const fallbackVoice = currentVoices.find((v) => v.lang.toLowerCase().startsWith('en')) || null;
      if (fallbackVoice) {
        speakWithBrowser(textToSpeak, targetBcp47, fallbackVoice);
      } else if (isAiTtsAvailable) {
        setPlayState('preparing');
        activeSourceRef.current = 'ai';
        setActiveEngine('ai');
        const chunks = splitTextIntoExactChunks(textToSpeak, 800);
        chunksRef.current = chunks;
        chunkIndexRef.current = 0;
        setCurrentChunkIndex(0);
        setTotalChunks(chunks.length);
        playAiChunk(0, chunks, targetBcp47, isUrduRequired, langDisplayName, currentVoices);
      } else {
        setVoiceError(`A voice for ${langDisplayName} is not available on this device.`);
        setPlayState('idle');
        setSpeakingId(null);
        activeIdRef.current = null;
        setActiveEngine(null);
      }
    },
    [
      speakingId,
      playState,
      settings,
      getLatestVoices,
      isAiTtsAvailable,
      speakWithBrowser,
      playAiChunk,
    ]
  );

  const pause = useCallback(() => {
    if (playState !== 'speaking' && playState !== 'preparing') return;

    isPausedRef.current = true;
    setPlayState('paused');

    if (activeSourceRef.current === 'ai' && currentAudioRef.current) {
      try {
        currentAudioRef.current.pause();
      } catch {}
    } else if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.pause();
      } catch {}
    }
  }, [playState]);

  const resume = useCallback(() => {
    if (playState !== 'paused') return;

    isPausedRef.current = false;
    isCancelledRef.current = false;
    setPlayState('speaking');

    if (activeSourceRef.current === 'ai' && currentAudioRef.current) {
      try {
        currentAudioRef.current.play();
      } catch {}
    } else if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        } else {
          speakBrowserCurrentChunk();
        }
      } catch {
        speakBrowserCurrentChunk();
      }
    }
  }, [playState, speakBrowserCurrentChunk]);

  let statusMessage: string | null = null;
  if (playState === 'preparing') {
    statusMessage = 'Preparing natural audio...';
  } else if (playState === 'speaking' || playState === 'playing') {
    statusMessage = 'Speaking...';
  } else if (playState === 'paused') {
    statusMessage = 'Paused';
  } else if (playState === 'finished') {
    statusMessage = 'Finished';
  }

  const isSpeaking = playState === 'speaking' || playState === 'playing' || playState === 'preparing';

  const speak = useCallback(
    (exactText: string, selectedLang?: string) => {
      play('auto-speech-' + Date.now(), exactText, selectedLang);
    },
    [play]
  );

  return {
    isSupported,
    speakingId,
    playState,
    voiceError,
    activeLangName,
    currentChunkIndex,
    totalChunks,
    statusMessage,
    activeEngine,
    play,
    pause,
    resume,
    stop,
    clearError,
    speak,
    stopSpeaking: stop,
    isSpeaking,
    currentlySpeakingText,
    playSpeech: play,
    pauseSpeech: pause,
    resumeSpeech: resume,
    stopSpeech: stop,
    clearSpeechError: clearError,
  };
}
