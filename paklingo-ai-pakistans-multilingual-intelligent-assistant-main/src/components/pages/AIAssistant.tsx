import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  ArrowUp,
  Mic,
  MicOff,
  Paperclip,
  File,
  Volume2,
  VolumeX,
  Trash2,
  Copy,
  Check,
  Sparkles,
  Bot,
  User,
  Globe2,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Globe,
  X,
  Plus,
  MessageSquare,
  History,
  RotateCcw,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { ChatMessage, LanguageCode } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { recordUserActivity } from '../../lib/firestoreService';
import { SUPPORTED_LANGUAGES, UI_TRANSLATIONS } from '../../data/languages';
import { useMultilingualTTS } from '../../hooks/useMultilingualTTS';
import { SpeechPlayerControls } from '../SpeechPlayerControls';
import { FormattedMarkdown } from '../FormattedMarkdown';

interface AIAssistantProps {
  selectedLanguage: LanguageCode;
  onSelectLanguage: (lang: LanguageCode) => void;
  initialPrompt?: string;
}

interface SavedSession {
  id: string;
  title: string;
  timestamp: string;
  messages: ChatMessage[];
}

const getInitialWelcomeMessage = (lang: LanguageCode): ChatMessage => ({
  id: 'msg-welcome',
  sender: 'assistant',
  text:
    lang === 'en'
      ? 'Hello! I am PakLingo AI, your conversational assistant. How can I help you today with education, public services, health, farming, legal information, or everyday questions?'
      : 'السلام علیکم! میں پاک لنگو اے آئی ہوں۔ میں آپ کی تعلیم، سرکاری امور، صحت، زراعت، قانونی معلومات اور روزمرہ کے سوالات میں مدد کے لیے حاضر ہوں۔ آپ اردو، انگریزی، رومن اردو یا کسی بھی پاکستانی زبان میں بات کر سکتے ہیں!\n\nWelcome to PakLingo AI. How may I assist you today across Pakistan’s public services, educational topics, or language translation?',
  timestamp: 'Just now',
  category: 'PakLingo AI',
});

const SUGGESTED_PROMPTS_BY_LANG: Record<string, string[]> = {
  ur: [
    'السلام علیکم! آپ کیا کر سکتے ہیں؟',
    'Pakistan mein CNIC renewal ka official process batao',
    'How to check BISP 8171 eligibility?',
    'مجھے ریاضی یا سائنس کا کوئی سبق سمجھائیں',
    'گندم کی فصل کی بیماریاں اور علاج',
    'Translate English text into Pashto',
  ],
  en: [
    'Hello! What can you do?',
    'How do I renew my Pakistani CNIC?',
    'Teach me physics: Newton’s Laws of Motion',
    'Wheat crop disease symptoms & treatment',
    'How to check BISP 8171 eligibility?',
    'Translate English text into Pashto',
  ],
};

function renderInlineFormatted(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      return (
        <strong key={idx} className="font-bold text-slate-900 dark:text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length >= 2 && !part.startsWith('**')) {
      return (
        <em key={idx} className="italic text-slate-800 dark:text-slate-200">
          {part.slice(1, -1)}
        </em>
      );
    }
    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      return (
        <code
          key={idx}
          className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-emerald-800 dark:text-emerald-300 font-mono text-[11px]"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

function renderFormattedMessage(text: string): React.ReactNode {
  if (!text) return null;

  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let currentList: { type: 'ul' | 'ol'; items: string[] } | null = null;

  const flushList = () => {
    if (currentList) {
      if (currentList.type === 'ul') {
        elements.push(
          <ul
            key={`list-${elements.length}`}
            className="my-1.5 space-y-1 list-disc list-inside pl-1 text-slate-800 dark:text-slate-200"
          >
            {currentList.items.map((item, idx) => (
              <li key={idx} className="leading-relaxed">
                {renderInlineFormatted(item)}
              </li>
            ))}
          </ul>
        );
      } else {
        elements.push(
          <ol
            key={`list-${elements.length}`}
            className="my-1.5 space-y-1 list-decimal list-inside pl-1 text-slate-800 dark:text-slate-200"
          >
            {currentList.items.map((item, idx) => (
              <li key={idx} className="leading-relaxed">
                {renderInlineFormatted(item)}
              </li>
            ))}
          </ol>
        );
      }
      currentList = null;
    }
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();

    if (!trimmed) {
      flushList();
      elements.push(<div key={`blank-${idx}`} className="h-1" />);
      return;
    }

    if (trimmed.startsWith('### ')) {
      flushList();
      elements.push(
        <h4 key={`h4-${idx}`} className="font-bold text-slate-900 dark:text-white mt-2 mb-1 text-xs sm:text-sm">
          {renderInlineFormatted(trimmed.slice(4))}
        </h4>
      );
      return;
    }
    if (trimmed.startsWith('## ')) {
      flushList();
      elements.push(
        <h3 key={`h3-${idx}`} className="font-bold text-slate-900 dark:text-white mt-2.5 mb-1 text-sm sm:text-base">
          {renderInlineFormatted(trimmed.slice(3))}
        </h3>
      );
      return;
    }

    const ulMatch = trimmed.match(/^[-*•]\s+(.*)$/);
    if (ulMatch) {
      if (!currentList || currentList.type !== 'ul') {
        flushList();
        currentList = { type: 'ul', items: [] };
      }
      currentList.items.push(ulMatch[1]);
      return;
    }

    const olMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
    if (olMatch) {
      if (!currentList || currentList.type !== 'ol') {
        flushList();
        currentList = { type: 'ol', items: [] };
      }
      currentList.items.push(olMatch[2]);
      return;
    }

    flushList();
    elements.push(
      <p key={`p-${idx}`} className="leading-relaxed my-0.5 text-slate-800 dark:text-slate-200">
        {renderInlineFormatted(trimmed)}
      </p>
    );
  });

  flushList();
  return <div className="space-y-0.5">{elements}</div>;
}

export const AIAssistant: React.FC<AIAssistantProps> = ({
  selectedLanguage,
  onSelectLanguage,
  initialPrompt,
}) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    getInitialWelcomeMessage(selectedLanguage),
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [autoVoiceOutput, setAutoVoiceOutput] = useState(true);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [savedSessions, setSavedSessions] = useState<SavedSession[]>(() => {
    try {
      const saved = localStorage.getItem('paklingo_chat_sessions');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [attachment, setAttachment] = useState<{ name: string; size: string; type: string; content?: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const sizeKB = (file.size / 1024).toFixed(1) + ' KB';
    if (file.type.startsWith('text/') || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setAttachment({
          name: file.name,
          size: sizeKB,
          type: file.type,
          content: event.target?.result as string,
        });
      };
      reader.readAsText(file);
    } else {
      setAttachment({
        name: file.name,
        size: sizeKB,
        type: file.type,
      });
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const voiceTranscriptRef = useRef<string>('');
  const isTypingRef = useRef<boolean>(false);

  const {
    playSpeech,
    pauseSpeech,
    resumeSpeech,
    stopSpeech,
    clearSpeechError,
    speakingId,
    playState,
    voiceError,
    activeLangName,
    currentChunkIndex,
    totalChunks,
    statusMessage,
  } = useMultilingualTTS();

  const currentLang =
    SUPPORTED_LANGUAGES.find((l) => l.code === selectedLanguage) || SUPPORTED_LANGUAGES[0];

  // Auto-scroll on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Handle initial prompt if passed
  useEffect(() => {
    if (initialPrompt && initialPrompt.trim()) {
      handleSend(initialPrompt.trim());
    }
  }, [initialPrompt]);

  // Save session when messages change
  useEffect(() => {
    if (messages.length > 1) {
      const firstUserMsg = messages.find((m) => m.sender === 'user');
      const lastMsg = messages[messages.length - 1];
      const title = firstUserMsg ? firstUserMsg.text.slice(0, 45) + (firstUserMsg.text.length > 45 ? '...' : '') : 'Conversation';
      const updatedSessions: SavedSession = {
        id: `sess-${Date.now()}`,
        title,
        timestamp: new Date().toLocaleDateString([], { month: 'short', day: 'numeric' }),
        messages,
      };

      setSavedSessions((prev) => {
        const filtered = prev.filter((s) => s.title !== title);
        const next = [updatedSessions, ...filtered].slice(0, 10);
        try {
          localStorage.setItem('paklingo_chat_sessions', JSON.stringify(next));
        } catch {
          // ignore
        }
        return next;
      });

      // Record activity if the last message is from assistant
      if (lastMsg && lastMsg.sender === 'assistant') {
        recordUserActivity({
          userId: user?.id,
          type: 'chat',
          title,
          subtitle: lastMsg.text.slice(0, 140) + (lastMsg.text.length > 140 ? '...' : ''),
          module: 'AI Assistant',
          targetPage: 'chat',
          language: currentLang.name,
        }).catch(() => {});
      }
    }
  }, [messages.length, user?.id, currentLang.name]);

  // Cleanup speech recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
        recognitionRef.current = null;
      }
    };
  }, []);

  const handleToggleListening = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setMicError('Voice recognition is not supported in this browser. Please use Chrome/Edge.');
      return;
    }

    if (isListening) {
      try {
        recognitionRef.current?.stop();
      } catch {}
      setIsListening(false);
      const textToSend = voiceTranscriptRef.current?.trim() || input.trim();
      if (textToSend && !isTypingRef.current) {
        voiceTranscriptRef.current = '';
        setInput('');
        handleSend(textToSend, false, true);
      }
    } else {
      setMicError(null);
      voiceTranscriptRef.current = '';
      setInput('');

      try {
        if (recognitionRef.current) {
          try {
            recognitionRef.current.abort();
          } catch {}
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang =
          selectedLanguage === 'ur'
            ? 'ur-PK'
            : selectedLanguage === 'en'
            ? 'en-US'
            : selectedLanguage === 'pa'
            ? 'pa-PK'
            : selectedLanguage === 'sd'
            ? 'sd-PK'
            : selectedLanguage === 'ps'
            ? 'ps-PK'
            : 'en-US';

        recognition.onstart = () => {
          setIsListening(true);
          setMicError(null);
        };

        recognition.onresult = (event: any) => {
          let finalStr = '';
          let interimStr = '';
          for (let i = 0; i < event.results.length; i++) {
            const item = event.results[i];
            if (item.isFinal) {
              finalStr += item[0].transcript + ' ';
            } else {
              interimStr += item[0].transcript;
            }
          }
          const transcript = (finalStr + interimStr).trim();
          if (transcript) {
            voiceTranscriptRef.current = transcript;
            setInput(transcript);
          }
        };

        recognition.onerror = (event: any) => {
          setIsListening(false);
          if (event.error === 'not-allowed') {
            setMicError('Microphone access denied. Please grant permission in your browser.');
          } else if (event.error === 'no-speech') {
            if (!voiceTranscriptRef.current) {
              setMicError('No speech detected. Please speak clearly into your mic.');
            }
          }
        };

        recognition.onend = () => {
          setIsListening(false);
          const textToSend = voiceTranscriptRef.current?.trim();
          if (textToSend && !isTypingRef.current) {
            voiceTranscriptRef.current = '';
            setInput('');
            handleSend(textToSend, false, true);
          }
        };

        recognitionRef.current = recognition;
        recognition.start();
      } catch (err) {
        console.error('Mic start error:', err);
        setIsListening(false);
        setMicError('Microphone failed to activate. Please check browser permissions.');
      }
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSend = async (customText?: string, isRetry = false, isVoiceInput = false) => {
    const query = (customText || input).trim();
    if (!query || isTypingRef.current) return;

    isTypingRef.current = true;
    setIsTyping(true);

    let updatedMessages = messages;

    if (!isRetry) {
      const displayQuery = attachment ? `${query}\n\n📎 [${attachment.name} • ${attachment.size}]` : query;
      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        sender: 'user',
        text: displayQuery,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);
      setInput('');
    }

    const queryToSend = attachment
      ? `${query}\n\n[Attached File: ${attachment.name} (${attachment.size})]${attachment.content ? `\nContent:\n${attachment.content.slice(0, 1200)}` : ''}`
      : query;

    if (attachment) {
      setAttachment(null);
    }

    const conversationHistory = updatedMessages
      .filter((m) => !m.isError && m.text)
      .map((m) => ({
        role: m.sender === 'user' ? ('user' as const) : ('model' as const),
        text: m.text,
      }));

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: queryToSend,
          language: selectedLanguage,
          history: conversationHistory.slice(0, -1),
        }),
      });

      if (!res.ok) {
        let errDetails = '';
        try {
          const errJson = await res.json();
          errDetails = errJson?.message || '';
        } catch {
          // ignore
        }
        throw new Error(errDetails || `Server responded with status ${res.status}`);
      }

      const data = await res.json();
      if (!data || !data.reply) {
        throw new Error('Received an empty response from AI model.');
      }

      const aiMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'assistant',
        text: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        category: 'PakLingo AI',
        sources: data.sources,
        officialPortalUrl: data.officialPortalUrl,
      };

      setMessages((prev) => [...prev.filter((m) => !m.isError), aiMessage]);

      // Automatically read the answer aloud if voice input or autoVoiceOutput is enabled
      if (isVoiceInput || autoVoiceOutput) {
        playSpeech(aiMessage.id, data.reply, selectedLanguage);
      }
    } catch (err: any) {
      console.error('AI Assistant request failed:', err);
      const errorMessage: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        text:
          selectedLanguage === 'ur'
            ? 'معذرت، اے آئی ماڈل سے رابطہ قائم نہیں ہو سکا۔ براہ کرم اپنا انٹرنیٹ کنکشن چیک کریں اور "دوبارہ کوشش کریں" پر کلک فرمائیں۔'
            : 'Unable to connect to the AI model right now. Please check your connection and click Retry to try again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        category: 'System Notice',
        isError: true,
        query: query,
      };
      setMessages((prev) => [...prev.filter((m) => !m.isError), errorMessage]);
    } finally {
      setIsTyping(false);
      isTypingRef.current = false;
    }
  };

  const handleRegenerateLast = () => {
    const userMsgs = messages.filter((m) => m.sender === 'user');
    if (userMsgs.length > 0) {
      const lastUser = userMsgs[userMsgs.length - 1];
      handleSend(lastUser.text, true);
    }
  };

  const handleNewChat = () => {
    stopSpeech();
    setMessages([getInitialWelcomeMessage(selectedLanguage)]);
  };

  const handleLoadSession = (session: SavedSession) => {
    stopSpeech();
    setMessages(session.messages);
    setIsHistoryOpen(false);
  };

  const activeSuggestedPrompts =
    selectedLanguage === 'en'
      ? SUGGESTED_PROMPTS_BY_LANG.en
      : SUGGESTED_PROMPTS_BY_LANG.ur;

  return (
    <div className="flex h-[calc(100vh-8.5rem)] min-h-[540px] max-w-5xl mx-auto bg-[var(--surface)] rounded-2xl border border-[var(--border)] shadow-xl overflow-hidden">
      {/* Optional Conversation History Sidebar */}
      <div
        className={`${
          isHistoryOpen ? 'w-64' : 'w-0'
        } transition-all duration-300 ease-in-out border-r border-[var(--border)] bg-[var(--surface-secondary)] flex flex-col shrink-0 overflow-hidden`}
      >
        <div className="p-3 border-b border-[var(--border)] flex items-center justify-between">
          <span className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
            <History className="w-3.5 h-3.5 text-[var(--accent)]" />
            Chat History
          </span>
          <button
            onClick={() => setIsHistoryOpen(false)}
            className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded cursor-pointer"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>

        <div className="p-2">
          <button
            onClick={handleNewChat}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-[var(--accent)] hover:opacity-90 text-white text-xs font-medium transition-colors cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>New Chat</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar text-xs">
          {savedSessions.length === 0 ? (
            <div className="p-4 text-center text-[var(--text-muted)] text-xs">No saved history yet</div>
          ) : (
            savedSessions.map((s, idx) => (
              <button
                key={idx}
                onClick={() => handleLoadSession(s)}
                className="w-full text-left p-2 rounded-lg hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] transition-colors cursor-pointer truncate"
              >
                <div className="font-medium truncate">{s.title}</div>
                <div className="text-[10px] text-[var(--text-muted)]">{s.timestamp}</div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Interface */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Control Header */}
        <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--surface)] flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              onClick={() => setIsHistoryOpen(!isHistoryOpen)}
              className="p-1.5 rounded-lg text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] cursor-pointer"
              title="Toggle History Sidebar"
            >
              {isHistoryOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
            </button>

            <div className="w-7 h-7 rounded-lg bg-[var(--surface-secondary)] border border-[var(--border)] text-[var(--accent)] flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
              <Bot className="w-4 h-4" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-[var(--text-primary)]">
                  AI Conversation
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-[var(--surface-secondary)] text-[var(--text-secondary)] font-medium border border-[var(--border)]">
                  {currentLang.name}
                </span>
              </div>
            </div>
          </div>

          {/* Controls: New Chat, Voice Output, Language Selector & Clear */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (autoVoiceOutput) {
                  stopSpeech();
                }
                setAutoVoiceOutput(!autoVoiceOutput);
              }}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                autoVoiceOutput
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                  : 'bg-[var(--surface-secondary)] border-[var(--border)] text-[var(--text-muted)]'
              }`}
              title={autoVoiceOutput ? 'Voice Output: ON (AI reads answers aloud)' : 'Voice Output: Muted'}
            >
              {autoVoiceOutput ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{autoVoiceOutput ? 'Voice: On' : 'Voice: Muted'}</span>
            </button>

            <button
              onClick={handleNewChat}
              className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[var(--surface-secondary)] hover:bg-[var(--surface-hover)] text-[var(--text-primary)] text-xs font-medium border border-[var(--border)] transition-colors cursor-pointer"
              title="Start a fresh conversation"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New</span>
            </button>

            <div className="flex items-center gap-1.5 text-xs bg-[var(--surface-secondary)] border border-[var(--border)] rounded-lg px-2.5 py-1">
              <Globe2 className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              <select
                id="ai-assistant-lang-select"
                value={selectedLanguage}
                onChange={(e) => onSelectLanguage(e.target.value as LanguageCode)}
                className="bg-transparent text-[var(--text-primary)] text-xs font-medium focus:outline-none cursor-pointer"
              >
                {SUPPORTED_LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code} className="bg-[var(--dropdown-bg)] text-[var(--dropdown-text)]">
                    {l.name} ({l.nativeName})
                  </option>
                ))}
              </select>
            </div>

            <button
              id="clear-conversation-button"
              onClick={handleNewChat}
              className="p-1.5 text-[var(--text-muted)] hover:text-red-500 hover:bg-[var(--surface-hover)] rounded-lg text-xs transition-colors cursor-pointer"
              title="Clear conversation"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 custom-scrollbar bg-[var(--background)]">
          {messages.length <= 1 && (!messages[0] || messages[0].id === 'welcome') ? (
            <div className="h-full min-h-[360px] flex flex-col items-center justify-center text-center p-4 max-w-xl mx-auto my-auto space-y-6">
              <div className="w-12 h-12 rounded-2xl bg-[var(--surface)] border border-[var(--border)] text-[var(--accent)] flex items-center justify-center shadow-md">
                <Bot className="w-6 h-6" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)]">
                  {selectedLanguage === 'ur' ? (
                    <span className="font-urdu">آج پاک لنگو آپ کی کیا معاونت کر سکتا ہے؟</span>
                  ) : (
                    'How can PakLingo assist you today?'
                  )}
                </h2>
                <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed max-w-md mx-auto">
                  {selectedLanguage === 'ur'
                    ? 'باضابطہ سرکاری رہنمائی، کثیر لسانی ترجمہ، تحریر و درخواست نگاری اور دستاویزات کی تفہیم'
                    : 'Certified civic guidance, official drafting, multilingual translation, and everyday conversational intelligence.'}
                </p>
              </div>

              {/* Categorized starter prompt cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full text-left">
                {[
                  {
                    category: selectedLanguage === 'ur' ? 'سرکاری و نادرا' : 'Civic & NADRA',
                    title: selectedLanguage === 'ur' ? 'نادرا شناختی کارڈ رہنمائی' : 'NADRA Smart NIC Renewal',
                    desc: selectedLanguage === 'ur' ? 'تجدید کے مراحل، فیس اور مطلوبہ کاغذات' : 'Step-by-step renewal and fee structure',
                    prompt: 'NADRA Smart NIC renewal procedure, fee structure, and required documents in Pakistan',
                  },
                  {
                    category: selectedLanguage === 'ur' ? 'درخواست نگاری' : 'Official Drafting',
                    title: selectedLanguage === 'ur' ? 'سرکاری درخواست کا نمونہ' : 'Draft Official Application',
                    desc: selectedLanguage === 'ur' ? 'باضابطہ اردو یا انگریزی درخواست تیار کریں' : 'Formal letter or job application in Urdu/English',
                    prompt: 'Write a professional official application letter for government department in Pakistan',
                  },
                  {
                    category: selectedLanguage === 'ur' ? 'یوٹیلٹی بلز' : 'Utility Bills',
                    title: selectedLanguage === 'ur' ? 'بجلی بل میں ٹیکسز کی تفہیم' : 'Electricity Bill Breakdown',
                    desc: selectedLanguage === 'ur' ? 'فیول ایڈجسٹمنٹ اور سرچارجز کی وضاحت' : 'Fuel price adjustment (FPA) and tariff taxes breakdown',
                    prompt: 'Explain fuel price adjustment (FPA), taxes, and surcharges in Pakistani electricity bill',
                  },
                  {
                    category: selectedLanguage === 'ur' ? 'سماجی امداد' : 'Social Relief',
                    title: selectedLanguage === 'ur' ? 'بی آئی ایس پی پروگرام اہلیت' : 'BISP 8171 Eligibility',
                    desc: selectedLanguage === 'ur' ? 'رجسٹریشن چیک کرنے کا باضابطہ طریقہ' : 'Check status and registration requirements',
                    prompt: 'How to check BISP 8171 financial assistance registration and eligibility?',
                  },
                ].map((card, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSend(card.prompt)}
                    className="p-3.5 rounded-2xl bg-[var(--surface)] hover:bg-[var(--surface-hover)] border border-[var(--border)] hover:border-emerald-500/50 transition-all duration-150 text-left cursor-pointer shadow-2xs group flex flex-col justify-between"
                  >
                    <div>
                      <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 mb-1.5 border border-emerald-500/20">
                        {card.category}
                      </span>
                      <div className="text-xs font-semibold text-[var(--text-primary)] group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors mb-0.5">
                        {card.title}
                      </div>
                      <div className="text-[11px] text-[var(--text-muted)] line-clamp-1">
                        {card.desc}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => {
            const isUser = msg.sender === 'user';
            const isSpeaking = speakingId === msg.id;

            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-3xl ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'} ${
                  isSpeaking
                    ? 'p-2 rounded-xl ring-2 ring-[var(--accent)] bg-[var(--surface-secondary)] transition-all duration-150'
                    : ''
                }`}
              >
                {/* Avatar */}
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-medium ${
                    isUser
                      ? 'bg-[var(--accent)] text-white shadow-xs'
                      : 'bg-[var(--surface)] text-[var(--accent)] border border-[var(--border)]'
                  }`}
                >
                  {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                </div>

                {/* Message Bubble Container */}
                <div className="space-y-1.5 max-w-[88%] sm:max-w-[82%]">
                  {msg.isError ? (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3.5 space-y-2 text-red-600 dark:text-red-300">
                      <div className="flex items-center gap-1.5 text-red-500 font-semibold text-xs">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>AI Service Notice</span>
                      </div>
                      <p className="text-xs leading-relaxed">{msg.text}</p>
                      {msg.query && (
                        <button
                          type="button"
                          onClick={() => handleSend(msg.query, true)}
                          disabled={isTyping}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--accent)] hover:opacity-90 text-white font-medium text-xs transition-colors cursor-pointer"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${isTyping ? 'animate-spin' : ''}`} />
                          <span>Retry Query</span>
                        </button>
                      )}
                    </div>
                  ) : isUser ? (
                    /* User Bubble */
                    <div className="p-3 sm:p-3.5 rounded-xl text-xs sm:text-sm leading-relaxed whitespace-pre-line bg-[var(--accent)] text-white font-medium shadow-xs">
                      {msg.text}
                    </div>
                  ) : (
                    /* Assistant Bubble */
                    <div className="bg-[var(--surface)] text-[var(--text-primary)] border border-[var(--border)] rounded-xl p-3.5 sm:p-4 shadow-xs space-y-2.5">
                      <div className="text-xs sm:text-sm leading-relaxed">
                        <FormattedMarkdown content={msg.text} />
                      </div>

                      {/* Official Sources Cited */}
                      {msg.sources && msg.sources.length > 0 && (
                        <div className="pt-2.5 border-t border-[var(--border)] space-y-1.5">
                          <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1">
                            <Globe className="w-3 h-3 text-[var(--accent)]" />
                            Official Sources
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
                            {msg.sources.map((src, idx) => (
                              <div
                                key={idx}
                                className="p-2 bg-[var(--surface-secondary)] rounded-lg border border-[var(--border)] text-[11px] flex items-center justify-between"
                              >
                                <span className="font-medium text-[var(--text-primary)] truncate mr-1">
                                  {src.title}
                                </span>
                                <a
                                  href={src.uri}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[var(--accent)] hover:underline font-medium shrink-0 flex items-center gap-0.5"
                                >
                                  <span>{src.domain}</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Message Actions */}
                  <div
                    className={`flex items-center gap-2 text-[11px] text-[var(--text-muted)] px-1 flex-wrap ${
                      isUser ? 'justify-end' : ''
                    }`}
                  >
                    <span>{msg.timestamp}</span>
                    {!isUser && !msg.isError && (
                      <>
                        <span>•</span>
                        <button
                          onClick={() => handleCopy(msg.id, msg.text)}
                          className="hover:text-[var(--text-primary)] flex items-center gap-1 cursor-pointer font-medium"
                          title="Copy message"
                        >
                          {copiedId === msg.id ? (
                            <Check className="w-3 h-3 text-emerald-500" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                          <span>{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
                        </button>
                        <span>•</span>
                        <button
                          onClick={handleRegenerateLast}
                          disabled={isTyping}
                          className="hover:text-[var(--text-primary)] flex items-center gap-1 cursor-pointer font-medium disabled:opacity-50"
                          title="Regenerate response"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Regenerate</span>
                        </button>
                        <span>•</span>
                        {/* Hybrid Multilingual TTS Controls */}
                        <SpeechPlayerControls
                          id={msg.id}
                          speakingId={speakingId}
                          playState={playState}
                          voiceError={voiceError}
                          activeLangName={activeLangName}
                          currentChunkIndex={currentChunkIndex}
                          totalChunks={totalChunks}
                          statusMessage={statusMessage}
                          onPlay={() => playSpeech(msg.id, msg.text, selectedLanguage)}
                          onPause={pauseSpeech}
                          onResume={resumeSpeech}
                          onStop={stopSpeech}
                          onClearError={clearSpeechError}
                        />
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex gap-3 max-w-md mr-auto animate-in fade-in duration-150">
              <div className="w-7 h-7 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[var(--accent)] flex items-center justify-center shrink-0 shadow-xs">
                <Bot className="w-3.5 h-3.5" />
              </div>
              <div className="bg-[var(--surface)] border border-[var(--border)] p-3 rounded-xl flex items-center gap-2 shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-bounce"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-bounce [animation-delay:0.4s]"></span>
                <span className="text-xs text-[var(--text-secondary)] font-medium pl-1">
                  Generating response...
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* ChatGPT-Style Floating Bottom Composer */}
        <div className="p-3 sm:p-4 border-t border-[var(--border)] bg-[var(--surface)] shrink-0">
          <div className="max-w-3xl mx-auto w-full">
            {/* Mic Error Notice */}
            {micError && (
              <div className="mb-2 p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-600 dark:text-amber-300 text-xs flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>{micError}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setMicError(null)}
                  className="text-amber-500 hover:text-[var(--text-primary)] p-0.5 rounded cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}

            {/* Selected Attachment Badge */}
            {attachment && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] text-xs text-[var(--text-primary)] w-fit mb-2 animate-in fade-in duration-150">
                <File className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
                <span className="font-medium truncate max-w-[220px]">{attachment.name}</span>
                <span className="text-[10px] text-[var(--text-muted)]">({attachment.size})</span>
                <button
                  type="button"
                  onClick={() => setAttachment(null)}
                  className="text-[var(--text-muted)] hover:text-red-500 p-0.5 rounded cursor-pointer"
                  title="Remove attachment"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}

            {/* Hidden File Input for Attachments */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
              accept=".pdf,.doc,.docx,.txt,.csv,.jpg,.jpeg,.png"
            />

            {/* Composer Box */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="relative flex items-center gap-1.5 bg-[var(--background)] border border-[var(--border)] hover:border-[var(--accent)] focus-within:border-[var(--accent)] focus-within:ring-2 focus-within:ring-[var(--accent)]/15 rounded-2xl p-1.5 sm:p-2 shadow-sm transition-all"
            >
              {/* Attachment Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)] transition-colors cursor-pointer shrink-0"
                title="Attach Document or Image"
              >
                <Paperclip className="w-4 h-4" />
              </button>

              {/* Voice Typing Button */}
              <button
                type="button"
                id="assistant-mic-button"
                onClick={handleToggleListening}
                className={`p-2 rounded-xl transition-all shrink-0 cursor-pointer ${
                  isListening
                    ? 'bg-red-500 text-white animate-pulse'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)]'
                }`}
                title={isListening ? 'Listening... click to stop' : 'Voice Typing Input'}
              >
                {isListening ? (
                  <MicOff className="w-4 h-4" />
                ) : (
                  <Mic className="w-4 h-4 text-[var(--accent)]" />
                )}
              </button>

              {/* Text Input */}
              <input
                id="assistant-chat-input"
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isTyping}
                placeholder={
                  isListening
                    ? 'Listening to microphone...'
                    : selectedLanguage === 'ur'
                    ? 'پاک لنگو سے کچھ بھی پوچھیں، دستاویزات منسلک کریں...'
                    : 'Ask anything in Urdu, Roman Urdu, or English...'
                }
                className="w-full py-1.5 px-2 bg-transparent text-xs sm:text-sm text-[var(--input-text)] placeholder-[var(--input-placeholder)] focus:outline-none transition-colors disabled:opacity-60"
              />

              {/* Send Button */}
              <button
                type="submit"
                id="assistant-send-button"
                disabled={(!input.trim() && !attachment) || isTyping}
                className="w-8 h-8 rounded-xl bg-[var(--accent)] hover:opacity-90 disabled:opacity-30 text-white flex items-center justify-center transition-all shrink-0 cursor-pointer disabled:cursor-not-allowed shadow-xs"
                title="Send message"
              >
                <ArrowUp className="w-4 h-4" />
              </button>
            </form>

            <p className="text-[10px] text-center text-[var(--text-muted)] mt-2">
              {selectedLanguage === 'ur'
                ? 'پاک لنگو اے آئی سرکاری رہنمائی فراہم کرتا ہے۔ اہم معاملات میں متعلقہ سرکاری اداروں سے رجوع کریں۔'
                : 'PakLingo AI provides civic intelligence. Always verify official regulatory details with NADRA/FBR.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
