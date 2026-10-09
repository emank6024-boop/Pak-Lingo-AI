/**
 * PakLingo AI - Non-blocking Client Telemetry & Synchronization
 * Sends legitimate anonymized user activity to the backend for administrative oversight.
 */

export const Telemetry = {
  syncUser(user: {
    id: string;
    name: string;
    email: string;
    provider?: string;
    preferredLanguage?: string;
    theme?: string;
    fontSize?: string;
  }) {
    fetch('/api/telemetry/user-sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user),
    }).catch(() => {});
  },

  recordEvent(event: {
    userId?: string;
    userName?: string;
    userEmail?: string;
    type: 'chat' | 'search' | 'translation' | 'document' | 'tool_use' | 'settings_change' | 'auth';
    feature: string;
    language?: string;
    summary: string;
    details?: Record<string, any>;
  }) {
    fetch('/api/telemetry/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
    }).catch(() => {});
  },

  recordConversation(conv: {
    userId: string;
    userName: string;
    userEmail: string;
    title: string;
    category: string;
    language: string;
    messages: Array<{ sender: 'user' | 'assistant' | 'system'; text: string }>;
  }) {
    fetch('/api/telemetry/conversation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(conv),
    }).catch(() => {});
  },

  recordTranslation(tr: {
    userId: string;
    userName: string;
    userEmail: string;
    sourceLang: string;
    targetLang: string;
    sourceTextSnippet: string;
    translatedSnippet: string;
    charCount: number;
    tool: string;
  }) {
    fetch('/api/telemetry/translation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tr),
    }).catch(() => {});
  },

  recordDocument(doc: {
    userId: string;
    userName: string;
    userEmail: string;
    fileName: string;
    fileSize: string;
    mimeType: string;
    processingStatus: 'completed' | 'processing' | 'failed';
    feature: string;
    language: string;
    summary: string;
  }) {
    fetch('/api/telemetry/document', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(doc),
    }).catch(() => {});
  },
};
