import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Square,
  Sparkles,
  Sliders,
  RotateCcw,
  Loader2,
  Info,
  Radio,
  CheckCircle2,
  BotMessageSquare,
  User,
  AlertCircle,
  Globe,
  RefreshCw,
  ExternalLink,
  Keyboard,
  Send,
  HelpCircle,
} from 'lucide-react';
import { LanguageCode } from '../../types';
import { SUPPORTED_LANGUAGES } from '../../data/languages';
import { useVoiceSettings } from '../../context/VoiceSettingsContext';
import { useMultilingualTTS } from '../../hooks/useMultilingualTTS';
import { SpeechPlayerControls } from '../SpeechPlayerControls';
import { FormattedMarkdown } from '../FormattedMarkdown';

interface VoiceAssistantProps {
  selectedLanguage: LanguageCode;
}

export type AssistantState = 'ready' | 'listening' | 'processing' | 'result' | 'error';

const VOICE_SUGGESTIONS = [
  'What is photosynthesis?',
  'اسلام علیکم، مجھے پاسپورٹ بنوانے کا طریقہ بتائیں',
  'What are the best seasonal vegetables to plant this month?',
  'Explain Newton’s second law of motion simply',
  'How do I file my annual tax return on FBR Iris?',
  'Dengue fever symptoms and first aid care',
];

export const VoiceAssistant: React.FC<VoiceAssistantProps> = ({ selectedLanguage }) => {
  const { openVoiceModal } = useVoiceSettings();
  const tts = useMultilingualTTS();

  // Assistant lifecycle state: Ready → Listening → Processing → Result → Error
  const [assistantState, setAssistantState] = useState<AssistantState>('ready');
  const [isListening, setIsListening] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>('');
  const [activeQuestion, setActiveQuestion] = useState<string>('');
  const [assistantReply, setAssistantReply] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [speechSupported, setSpeechSupported] = useState<boolean>(true);
  const [autoVoiceOutput, setAutoVoiceOutput] = useState<boolean>(true);
  const [inputLangMode, setInputLangMode] = useState<'auto' | 'ur' | 'en' | 'roman'>('auto');
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [permissionDeniedNotice, setPermissionDeniedNotice] = useState<boolean>(false);
  const [showManualInput, setShowManualInput] = useState<boolean>(false);
  const [manualInputText, setManualInputText] = useState<string>('');

  const recognitionRef = useRef<any>(null);
  const latestTranscriptRef = useRef<string>('');
  const isProcessingRef = useRef<boolean>(false);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const conversationHistoryRef = useRef<Array<{ role: 'user' | 'model'; text: string }>>([]);

  const isIframe = typeof window !== 'undefined' && window.self !== window.top;

  const currentLangObj =
    SUPPORTED_LANGUAGES.find((l) => l.code === selectedLanguage) || SUPPORTED_LANGUAGES[0];

  const getRecognitionLang = () => {
    if (inputLangMode === 'en') return 'en-US';
    if (inputLangMode === 'ur') return 'ur-PK';
    if (inputLangMode === 'roman') return 'en-PK';
    // auto based on selected app language
    if (selectedLanguage === 'en') return 'en-US';
    if (selectedLanguage === 'ur') return 'ur-PK';
    if (selectedLanguage === 'pa') return 'pa-PK';
    if (selectedLanguage === 'sd') return 'sd-PK';
    if (selectedLanguage === 'ps') return 'ps-PK';
    return 'ur-PK';
  };

  /**
   * Helper to ensure all active microphone tracks are immediately stopped,
   * preventing the browser recording indicator from staying on.
   */
  const stopAllAudioTracks = () => {
    if (mediaStreamRef.current) {
      try {
        mediaStreamRef.current.getTracks().forEach((track) => {
          if (track.readyState === 'live') {
            track.stop();
          }
        });
      } catch (e) {
        console.warn('Error stopping microphone tracks:', e);
      }
      mediaStreamRef.current = null;
    }
  };

  // Check speech recognition capability on mount and clean up on unmount
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
        recognitionRef.current = null;
      }
      stopAllAudioTracks();
    };
  }, []);

  /**
   * Microphone toggle handler:
   * 1. Uses the browser's standard microphone permission API (navigator.mediaDevices.getUserMedia)
   * 2. Requests microphone permission only when user taps "Tap to Speak"
   * 3. If granted, immediately starts speech recognition and releases stream tracks
   * 4. If denied, displays clear instructional steps
   */
  const toggleListening = async () => {
    // If currently listening, clicking again finishes speaking and sends to AI
    if (isListening) {
      try {
        recognitionRef.current?.stop();
      } catch {}
      setIsListening(false);
      stopAllAudioTracks();
      const textToProcess = latestTranscriptRef.current?.trim() || transcript.trim();
      if (textToProcess && !isProcessingRef.current) {
        handleProcessQuery(textToProcess);
      } else {
        setAssistantState(activeQuestion ? 'result' : 'ready');
      }
      return;
    }

    // Reset feedback state for fresh listening session
    tts.stop();
    setErrorNotice(null);
    setPermissionDeniedNotice(false);
    setTranscript('');
    latestTranscriptRef.current = '';

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechSupported(false);
      setAssistantState('error');
      setErrorNotice(
        'Speech recognition is not natively supported in this browser. Please open PakLingo in Google Chrome or Microsoft Edge for voice input.'
      );
      return;
    }

    // STEP 1: Request microphone permission using standard browser getUserMedia API
    if (navigator?.mediaDevices?.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStreamRef.current = stream;
        // Stop the temporary media tracks immediately so the microphone hardware
        // is released for the browser Speech Recognition engine
        stream.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      } catch (mediaErr: any) {
        console.warn('Microphone getUserMedia error:', mediaErr);
        stopAllAudioTracks();
        setIsListening(false);
        setAssistantState('error');

        if (mediaErr.name === 'NotAllowedError' || mediaErr.name === 'PermissionDeniedError') {
          setPermissionDeniedNotice(true);
          setErrorNotice(
            'Microphone access was denied. Please allow microphone permission in your browser.'
          );
          return;
        } else if (mediaErr.name === 'NotFoundError' || mediaErr.name === 'DevicesNotFoundError') {
          setErrorNotice(
            'No microphone detected on your device. Please connect a microphone and try again.'
          );
          return;
        } else {
          setErrorNotice(
            `Could not access microphone: ${mediaErr.message || mediaErr.name}. Please check your browser audio settings.`
          );
          return;
        }
      }
    }

    // STEP 2: Start speech recognition with verified microphone permissions
    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }

      const recognition = new SpeechRecognition();
      recognition.lang = getRecognitionLang();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setAssistantState('listening');
        setErrorNotice(null);
        setPermissionDeniedNotice(false);
      };

      recognition.onresult = (event: any) => {
        let accumulatedFinal = '';
        let interim = '';
        for (let i = 0; i < event.results.length; i++) {
          const item = event.results[i];
          if (item.isFinal) {
            accumulatedFinal += item[0].transcript + ' ';
          } else {
            interim += item[0].transcript;
          }
        }
        const combined = (accumulatedFinal + interim).trim();
        if (combined) {
          latestTranscriptRef.current = combined;
          setTranscript(combined);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error event:', event.error);
        setIsListening(false);
        stopAllAudioTracks();

        if (event.error === 'not-allowed') {
          setPermissionDeniedNotice(true);
          setAssistantState('error');
          setErrorNotice(
            'Microphone access was denied. Please allow microphone permission in your browser.'
          );
        } else if (event.error === 'no-speech') {
          if (!latestTranscriptRef.current) {
            setAssistantState(activeQuestion ? 'result' : 'ready');
            setErrorNotice('No speech detected. Tap the microphone and speak your question clearly.');
          }
        } else if (event.error === 'network') {
          setAssistantState('error');
          setErrorNotice(
            'Network connection error with speech recognition service. Please check your internet connection.'
          );
        } else if (event.error !== 'aborted') {
          setAssistantState('error');
          setErrorNotice(`Speech recognition error: ${event.error}. Please try again.`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        stopAllAudioTracks();
        const textToProcess = latestTranscriptRef.current?.trim();
        if (textToProcess && !isProcessingRef.current) {
          handleProcessQuery(textToProcess);
        } else if (!isProcessingRef.current) {
          setAssistantState((prev) => (prev === 'listening' ? (activeQuestion ? 'result' : 'ready') : prev));
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e: any) {
      console.error('Recognition start error:', e);
      setIsListening(false);
      stopAllAudioTracks();
      setAssistantState('error');
      setErrorNotice('Could not start speech recognition. Please check your browser audio settings.');
    }
  };

  /**
   * Process user speech query with genuine PakLingo AI (/api/chat)
   * Displays the real AI response and automatically reads it aloud if enabled
   */
  const handleProcessQuery = async (queryText: string) => {
    const text = queryText.trim();
    if (!text || isProcessingRef.current) return;

    isProcessingRef.current = true;
    setAssistantState('processing');
    setIsLoading(true);
    setActiveQuestion(text);
    setTranscript(text);
    setAssistantReply('');
    setErrorNotice(null);
    setPermissionDeniedNotice(false);
    tts.stop();

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          language: selectedLanguage,
          history: conversationHistoryRef.current,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || `AI service returned error status ${res.status}`);
      }

      const data = await res.json();
      const reply = data.reply || data.text;
      if (!reply) {
        throw new Error('AI returned an empty response. Please try asking again.');
      }

      setAssistantReply(reply);
      setAssistantState('result');

      conversationHistoryRef.current = [
        ...conversationHistoryRef.current.slice(-10),
        { role: 'user', text },
        { role: 'model', text: reply },
      ];

      // Automatically read the answer aloud if voice output is enabled
      if (autoVoiceOutput) {
        tts.play('voice-assistant-reply', reply, selectedLanguage);
      }
    } catch (err: any) {
      console.error('AI chat error:', err);
      setErrorNotice(err.message || 'Unable to get AI response. Please try again.');
      setAssistantState('error');
    } finally {
      setIsLoading(false);
      isProcessingRef.current = false;
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualInputText.trim()) {
      handleProcessQuery(manualInputText.trim());
      setManualInputText('');
      setShowManualInput(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto animate-in fade-in duration-200">
      {/* Header */}
      <div className="bg-[var(--surface)] rounded-2xl p-5 sm:p-6 border border-[var(--border)] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-[var(--surface-secondary)] text-[var(--accent)] border border-[var(--border)] shadow-xs">
              <Mic className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-[var(--accent)] uppercase tracking-wider">
                Hands-Free Multilingual Speech AI • صوتی معاون
              </span>
              <h1 className="text-xl sm:text-2xl font-extrabold text-[var(--text-primary)]">
                PakLingo Voice Assistant
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Auto Voice Output Toggle */}
            <button
              type="button"
              id="voice-output-toggle-button"
              onClick={() => {
                if (autoVoiceOutput) {
                  tts.stop();
                }
                setAutoVoiceOutput(!autoVoiceOutput);
              }}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border ${
                autoVoiceOutput
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                  : 'bg-[var(--surface-secondary)] border-[var(--border)] text-[var(--text-muted)]'
              }`}
              title={autoVoiceOutput ? 'Voice Output is ON (AI reads answers aloud)' : 'Voice Output is Muted'}
            >
              {autoVoiceOutput ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              <span>{autoVoiceOutput ? 'Audio Speech: ON' : 'Audio Speech: OFF'}</span>
            </button>

            <button
              onClick={openVoiceModal}
              className="px-3.5 py-2 rounded-xl bg-[var(--surface-secondary)] hover:bg-[var(--surface-hover)] text-[var(--text-primary)] text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer border border-[var(--border)]"
            >
              <Sliders className="w-3.5 h-3.5 text-[var(--accent)]" />
              <span>Voice Settings</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-[var(--border)] text-xs text-[var(--text-secondary)]">
          <p>
            Speak naturally in Urdu, Roman Urdu, or English. Your speech is transcribed and automatically answered by the AI.
          </p>

          {/* Voice Input Language Selector Pills */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[11px] text-[var(--text-muted)] font-medium">Mic Mode:</span>
            <button
              type="button"
              onClick={() => setInputLangMode('auto')}
              className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                inputLangMode === 'auto'
                  ? 'bg-[var(--accent)] text-white shadow-xs'
                  : 'bg-[var(--surface-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Auto ({currentLangObj.name})
            </button>
            <button
              type="button"
              onClick={() => setInputLangMode('en')}
              className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                inputLangMode === 'en'
                  ? 'bg-[var(--accent)] text-white shadow-xs'
                  : 'bg-[var(--surface-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              English
            </button>
            <button
              type="button"
              onClick={() => setInputLangMode('ur')}
              className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                inputLangMode === 'ur'
                  ? 'bg-[var(--accent)] text-white shadow-xs'
                  : 'bg-[var(--surface-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              اردو
            </button>
            <button
              type="button"
              onClick={() => setInputLangMode('roman')}
              className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                inputLangMode === 'roman'
                  ? 'bg-[var(--accent)] text-white shadow-xs'
                  : 'bg-[var(--surface-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Roman Urdu
            </button>
          </div>
        </div>
      </div>

      {/* Main Interactive Mic Stage */}
      <div className="bg-[var(--surface)] rounded-3xl p-6 sm:p-8 border border-[var(--border)] shadow-sm text-center space-y-6 flex flex-col items-center justify-center">
        {/* Clear Status State Indicator (Ready → Listening → Processing → Result → Error) */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-[var(--surface-secondary)] border border-[var(--border)]">
          {assistantState === 'ready' && (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-[var(--text-primary)]">Ready • Tap to Speak</span>
            </>
          )}
          {assistantState === 'listening' && (
            <>
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              <span className="text-rose-600 dark:text-rose-400 font-bold">Listening • Speak Now</span>
            </>
          )}
          {assistantState === 'processing' && (
            <>
              <Loader2 className="w-3 h-3 text-amber-500 animate-spin" />
              <span className="text-amber-600 dark:text-amber-400 font-bold">Processing with AI...</span>
            </>
          )}
          {assistantState === 'result' && (
            <>
              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
              <span className="text-emerald-600 dark:text-emerald-400">Response Ready</span>
            </>
          )}
          {assistantState === 'error' && (
            <>
              <AlertCircle className="w-3 h-3 text-rose-500" />
              <span className="text-rose-600 dark:text-rose-400 font-medium">Attention Required</span>
            </>
          )}
        </div>

        {/* Pulsing Visual Indicator & Microphone Button */}
        <div className="relative my-2">
          {isListening && (
            <div className="absolute inset-0 rounded-full bg-rose-500/20 animate-ping scale-150 pointer-events-none" />
          )}

          <button
            id="main-voice-mic-button"
            type="button"
            onClick={toggleListening}
            disabled={isLoading}
            className={`relative w-28 h-28 rounded-full flex flex-col items-center justify-center shadow-lg transition-all duration-300 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
              isListening
                ? 'bg-rose-600 text-white ring-8 ring-rose-400/30 scale-105 animate-pulse'
                : isLoading
                ? 'bg-amber-600 text-white ring-4 ring-amber-400/30'
                : 'bg-[var(--accent)] hover:opacity-90 text-white ring-4 ring-[var(--accent)]/30 hover:scale-105'
            }`}
            title={isListening ? 'Click to finish speaking and send to AI' : 'Tap to speak your question'}
          >
            {isListening ? (
              <>
                <Square className="w-8 h-8" />
                <span className="text-[11px] font-bold mt-1">Tap to Send</span>
              </>
            ) : isLoading ? (
              <>
                <Loader2 className="w-8 h-8 animate-spin" />
                <span className="text-[11px] font-bold mt-1">Thinking...</span>
              </>
            ) : (
              <>
                <Mic className="w-10 h-10" />
                <span className="text-[11px] font-bold mt-1">Tap to Speak</span>
              </>
            )}
          </button>
        </div>

        <div className="space-y-1">
          <p className="text-sm font-bold text-[var(--text-primary)]">
            {isListening
              ? 'Listening to your voice... (speak in Urdu, English, or Roman Urdu)'
              : isLoading
              ? 'PakLingo AI is generating your comprehensive response...'
              : assistantState === 'result'
              ? 'Tap microphone to speak another question'
              : 'Press the microphone and speak your question'}
          </p>
          <span className="text-xs text-[var(--text-muted)]">
            Recognition Language: {getRecognitionLang()} • Automatic speech-to-text & AI response
          </span>
        </div>

        {/* Clear Microphone Permission Denied Instructional Box */}
        {permissionDeniedNotice && (
          <div
            id="microphone-permission-guide"
            className="max-w-xl w-full p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-100 text-xs space-y-3 text-left animate-in fade-in"
          >
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-xs text-amber-950 dark:text-amber-50">
                  Microphone Access Denied
                </h4>
                <p className="text-[11px] text-amber-800 dark:text-amber-200 mt-0.5 leading-relaxed">
                  Your browser blocked microphone access. Follow these steps to allow microphone input:
                </p>
              </div>
            </div>

            <div className="space-y-1.5 pl-6 text-[11px] text-amber-800 dark:text-amber-200 font-medium">
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-amber-500/20 flex items-center justify-center font-bold text-[10px] shrink-0">1</span>
                <span>Click the <strong>Tune / Lock / Camera icon</strong> on the left of your browser address bar.</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-amber-500/20 flex items-center justify-center font-bold text-[10px] shrink-0">2</span>
                <span>Under Site Settings / Permissions, switch <strong>Microphone</strong> to <strong>Allow</strong>.</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-amber-500/20 flex items-center justify-center font-bold text-[10px] shrink-0">3</span>
                <span>Click <strong>Try Again</strong> below to start speaking.</span>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-2">
              <button
                type="button"
                id="voice-mic-retry-btn"
                onClick={toggleListening}
                className="px-3 py-1.5 rounded-lg bg-amber-600 text-white font-semibold text-xs hover:bg-amber-700 transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Try Again</span>
              </button>

              {isIframe && (
                <a
                  href={typeof window !== 'undefined' ? window.location.href : '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-[var(--surface)] text-[var(--text-primary)] border border-amber-500/30 hover:bg-[var(--surface-secondary)] font-semibold text-xs transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open in New Tab</span>
                </a>
              )}

              <button
                type="button"
                onClick={() => setShowManualInput(!showManualInput)}
                className="px-3 py-1.5 rounded-lg bg-transparent text-amber-800 dark:text-amber-200 hover:bg-amber-500/10 font-semibold text-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Keyboard className="w-3.5 h-3.5" />
                <span>Type Question Instead</span>
              </button>
            </div>
          </div>
        )}

        {/* Generic error notice if any other error occurred */}
        {errorNotice && !permissionDeniedNotice && (
          <div className="max-w-xl w-full p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-center justify-between gap-2 text-left animate-in fade-in">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorNotice}</span>
            </div>
            <button
              type="button"
              onClick={() => setShowManualInput(!showManualInput)}
              className="text-[11px] underline font-semibold shrink-0 cursor-pointer"
            >
              Type Instead
            </button>
          </div>
        )}

        {/* Optional Manual Text Query Bar (for accessibility or devices without mic) */}
        {showManualInput && (
          <form
            onSubmit={handleManualSubmit}
            className="max-w-xl w-full p-3 rounded-2xl bg-[var(--surface-secondary)] border border-[var(--border)] flex items-center gap-2 shadow-xs animate-in fade-in"
          >
            <input
              type="text"
              id="voice-manual-query-input"
              value={manualInputText}
              onChange={(e) => setManualInputText(e.target.value)}
              placeholder="Type your question in Urdu, English, or Roman Urdu..."
              className="flex-1 bg-[var(--surface)] text-[var(--text-primary)] text-xs rounded-xl px-3 py-2 border border-[var(--border)] outline-none focus:border-[var(--accent)]"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !manualInputText.trim()}
              className="px-3 py-2 rounded-xl bg-[var(--accent)] text-white text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer flex items-center gap-1"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Ask</span>
            </button>
          </form>
        )}

        {/* 1. You: Transcribed Question Card */}
        {(activeQuestion || transcript) && (
          <div
            id="voice-transcribed-question-card"
            className="max-w-xl w-full p-4 sm:p-5 rounded-2xl bg-[var(--surface-secondary)] border border-[var(--border)] text-left space-y-2 shadow-xs transition-all animate-in fade-in"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-primary)]">
                <div className="w-6 h-6 rounded-full bg-[var(--accent)] text-white flex items-center justify-center text-[11px] shadow-xs">
                  <User className="w-3.5 h-3.5" />
                </div>
                <span>You:</span>
                <span className="text-[10px] font-normal text-[var(--text-muted)]">
                  {isListening ? '(Transcribing live...)' : '(Spoken Question)'}
                </span>
              </div>
            </div>
            <p className="text-sm sm:text-base font-medium text-[var(--text-primary)] pl-8 leading-relaxed">
              &ldquo;{activeQuestion || transcript}&rdquo;
            </p>
          </div>
        )}

        {/* 2. Loading State: AI is generating response */}
        {isLoading && (
          <div
            id="voice-ai-loading-indicator"
            className="max-w-xl w-full p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] text-left flex items-center gap-3 shadow-xs animate-pulse"
          >
            <div className="w-6 h-6 rounded-full bg-[var(--surface-secondary)] text-[var(--accent)] border border-[var(--border)] flex items-center justify-center">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            </div>
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-[var(--accent)] block">
                PakLingo AI: Thinking & Generating Answer...
              </span>
              <span className="text-xs text-[var(--text-secondary)]">
                Processing your question and preparing answer with voice audio
              </span>
            </div>
          </div>
        )}

        {/* 3. AI: Answer Card */}
        {assistantReply && (
          <div
            id="voice-ai-response-card"
            className="max-w-xl w-full p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] text-left space-y-3 shadow-sm transition-all animate-in fade-in"
          >
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[var(--accent)]">
                <div className="w-6 h-6 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/30 text-[var(--accent)] flex items-center justify-center">
                  <BotMessageSquare className="w-3.5 h-3.5" />
                </div>
                <span>AI:</span>
                <span className="text-[10px] font-normal text-[var(--text-muted)]">
                  PakLingo Multilingual Intelligence
                </span>
              </div>

              {/* Speech Player Controls with "Listen" button */}
              <SpeechPlayerControls
                id="voice-assistant-reply"
                speakingId={tts.speakingId}
                playState={tts.playState}
                voiceError={tts.voiceError}
                activeLangName={tts.activeLangName}
                currentChunkIndex={tts.currentChunkIndex}
                totalChunks={tts.totalChunks}
                onPlay={() => tts.play('voice-assistant-reply', assistantReply, selectedLanguage)}
                onPause={tts.pause}
                onResume={tts.resume}
                onStop={tts.stop}
                onClearError={tts.clearError}
              />
            </div>

            <div className="pl-8 leading-relaxed">
              <FormattedMarkdown content={assistantReply} />
            </div>
          </div>
        )}
      </div>

      {/* Suggested Voice Prompts */}
      <div className="bg-[var(--surface)] rounded-2xl p-5 border border-[var(--border)] shadow-xs space-y-3">
        <span className="text-xs font-bold text-[var(--text-secondary)] block">
          Try saying any of these sample queries (نمونہ صوتی سوالات):
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {VOICE_SUGGESTIONS.map((q, idx) => (
            <motion.button
              key={idx}
              type="button"
              whileHover={{ y: -1 }}
              onClick={() => {
                handleProcessQuery(q);
              }}
              className="p-3 rounded-xl text-left text-xs font-medium border border-[var(--border)] bg-[var(--surface-secondary)] hover:bg-[var(--surface-hover)] hover:border-[var(--accent)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all cursor-pointer flex items-center gap-2 active:scale-98 shadow-2xs"
            >
              <Radio className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
              <span className="truncate">{q}</span>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
};
