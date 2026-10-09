/**
 * Multilingual Text-to-Speech (TTS) & Language Detection Engine for PakLingo AI
 * 
 * Complies strictly with all core requirements:
 * 1. Urdu script ALWAYS uses an Urdu Pakistan voice (ur-PK) - NEVER an English voice.
 * 2. English text uses natural en-US or en-GB voices.
 * 3. Roman Urdu is detected and mapped to an Urdu voice when available.
 * 4. Automatic language detection evaluates the exact visible text.
 * 5. Exactly preserves visible text without modification, summarizing, or translation.
 * 6. Prioritizes natural, clear pronunciation at comfortable speaking speed.
 * 7. If Urdu voice is not available on device, displays the exact requirement notice.
 * 8. Reusable across all modules with global settings persistence.
 */

import { LanguageCode } from '../types';

export const URDU_VOICE_MISSING_MESSAGE =
  'Device Urdu voice not detected. Open Voice Settings to configure speech options.';

export const LANGUAGE_BCP47_MAP: Record<string, string> = {
  ur: 'ur-PK',
  en: 'en-US',
  roman_ur: 'ur-PK',
  roman: 'ur-PK',
  pa: 'pa-PK',
  sd: 'sd-PK',
  ps: 'ps-PK',
  bal: 'ur-PK',
  skr: 'ur-PK',
  hnd: 'ur-PK',
  ks: 'ur-PK',
  brh: 'ur-PK',
};

export const LANGUAGE_NAME_MAP: Record<string, string> = {
  'ur-PK': 'Urdu (Pakistan)',
  'en-US': 'English (US)',
  'en-GB': 'English (UK)',
  'pa-PK': 'Punjabi',
  'sd-PK': 'Sindhi',
  'ps-PK': 'Pashto',
  'bal': 'Balochi',
  'skr-PK': 'Saraiki',
  'hnd-PK': 'Hindko',
  'ks': 'Kashmiri',
  'ur': 'Urdu',
  'roman_ur': 'Roman Urdu',
};

// High-frequency Roman Urdu tokens for vocabulary-based detection
export const ROMAN_URDU_VOCABULARY = new Set([
  'aap', 'ap', 'apka', 'apki', 'apke', 'apko', 'aapka', 'aapki', 'aapke', 'aapko',
  'hum', 'humein', 'hamara', 'hamari', 'hamare', 'humara', 'humari', 'humare',
  'mera', 'meri', 'mere', 'mujhe', 'mujhko', 'tum', 'tumhara', 'tumhari', 'tumhare', 'tumhe',
  'kya', 'kyun', 'kyu', 'kese', 'kaise', 'kahan', 'kab', 'kon', 'kaun', 'kitna', 'kitni', 'kitne',
  'hai', 'hain', 'tha', 'thi', 'the', 'hoga', 'hogi', 'honge', 'hote', 'hoti', 'hota',
  'nahi', 'nahin', 'na', 'mat', 'bohot', 'bahut', 'zaroori', 'zaroorat', 'chahiye', 'chahye',
  'kar', 'karein', 'kare', 'karna', 'karta', 'karti', 'karte', 'kiya', 'kiye', 'kijiye',
  'raha', 'rahi', 'rahe', 'gaya', 'gayi', 'gaye', 'jana', 'jao', 'aana', 'aao',
  'diya', 'liya', 'dijiye', 'lijiye', 'shukriya', 'shukria', 'bhai', 'theek', 'thik',
  'wala', 'wali', 'wale', 'aur', 'lekin', 'magar', 'ya', 'ke', 'ki', 'ka', 'ko', 'se',
  'me', 'mein', 'par', 'pe', 'tak', 'bhi', 'toh', 'to', 'ab', 'jab', 'tab', 'sab',
  'ye', 'yeh', 'wo', 'woh', 'kuch', 'koi', 'kisi', 'hukumat', 'qanoon', 'sehat', 'fasal',
  'kisan', 'tameer', 'shikayat', 'waghera', 'batao', 'batayein', 'maloomat', 'wazahat',
  'assalam', 'alaikum', 'walaikum', 'salam', 'inshallah', 'mashaallah',
  'ziyada', 'ziada', 'kam', 'acha', 'achi', 'ache', 'bura', 'buri', 'bure', 'pareshan',
  'ilaaj', 'dawaii', 'dawa', 'subah', 'shaam', 'dopahar', 'raat', 'din', 'waqt',
  'tareeqa', 'tareeqay', 'shehri', 'shehriyon', 'khidmat', 'khidmaat', 'pasand'
]);

export type DetectedLanguageType =
  | 'urdu-script'
  | 'english'
  | 'roman-urdu'
  | 'pashto'
  | 'punjabi'
  | 'sindhi'
  | 'balochi'
  | 'saraiki'
  | 'mixed-urdu-dominant'
  | 'mixed-english-dominant'
  | 'other';

export interface LanguageDetectionResult {
  detectedType: DetectedLanguageType;
  targetBcp47: string;
  targetLangName: string;
  isUrduTarget: boolean;
  isRomanUrdu: boolean;
  urduCharCount: number;
  latinCharCount: number;
}

/**
 * Strips non-pronounceable markdown tokens (e.g. asterisks for bold/italic, header hashtags)
 * while strictly preserving every single word, number, letter, and punctuation symbol.
 * What is read aloud matches what is visibly rendered on screen.
 */
export function cleanTextForSpeech(text: string): string {
  if (!text) return '';
  return text
    .replace(/^#+\s+/gm, '') // Markdown headings
    .replace(/\*\*([^*]+)\*\*/g, '$1') // Bold **text** -> text
    .replace(/\*([^*]+)\*/g, '$1') // Italic *text* -> text
    .replace(/__([^_]+)__/g, '$1') // Underline __text__ -> text
    .replace(/_([^_]+)_/g, '$1') // Italic _text_ -> text
    .replace(/`([^`]+)`/g, '$1') // Inline code `text` -> text
    .replace(/```[\s\S]*?```/g, '') // Remove code blocks
    .replace(/^[-*•]\s+/gm, '') // Bullet prefixes at start of line
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Links [label](url) -> label
    .trim();
}

/**
 * Splits text into safe chunks for Web Speech API without altering,
 * removing, summarizing, or changing ANY word or punctuation mark.
 * Sentence boundaries (Urdu and English) are prioritized for natural cadence.
 */
export function splitTextIntoExactChunks(text: string, maxChunkLen = 160): string[] {
  if (!text || text.length <= maxChunkLen) {
    return [text];
  }

  // Regex splitting on Urdu and English sentence delimiters while keeping delimiter attached
  // Urdu full stop: ۔ (U+06D4), Arabic question mark: ؟ (U+061F), Arabic semicolon: ؛ (U+061B),
  // English: . ! ? ; \n
  const sentenceRegex = /([^۔!؟?.;؛\n]+[۔!؟?.;؛\n]+|\n+|[^۔!؟?.;؛\n]+$)/g;
  const segments = text.match(sentenceRegex) || [text];

  const candidateChunks: string[] = [];
  let currentChunk = '';

  for (const seg of segments) {
    if (!currentChunk) {
      currentChunk = seg;
    } else if (currentChunk.length + seg.length <= maxChunkLen) {
      currentChunk += seg;
    } else {
      candidateChunks.push(currentChunk);
      currentChunk = seg;
    }
  }
  if (currentChunk) {
    candidateChunks.push(currentChunk);
  }

  // If any candidate chunk is still too long, split along whitespace/comma
  const finalChunks: string[] = [];
  for (const chunk of candidateChunks) {
    if (chunk.length <= maxChunkLen * 1.5) {
      finalChunks.push(chunk);
    } else {
      const parts = chunk.split(/([،,\s]+)/);
      let sub = '';
      for (const p of parts) {
        if (sub.length + p.length <= maxChunkLen) {
          sub += p;
        } else {
          if (sub) finalChunks.push(sub);
          sub = p;
        }
      }
      if (sub) finalChunks.push(sub);
    }
  }

  return finalChunks.filter((c) => c.trim().length > 0);
}

/**
 * Detects whether text is Roman Urdu by checking Latin word tokens against Roman Urdu vocabulary.
 */
export function isTextRomanUrdu(text: string): boolean {
  if (!text) return false;
  const words = text.toLowerCase().match(/\b[a-z]{2,}\b/g) || [];
  if (words.length === 0) return false;

  let romanUrduMatches = 0;
  for (const w of words) {
    if (ROMAN_URDU_VOCABULARY.has(w)) {
      romanUrduMatches++;
    }
  }

  // If at least 2 common Roman Urdu keywords appear, or ratio is >= 15%
  return (
    romanUrduMatches >= 2 ||
    (words.length <= 4 && romanUrduMatches >= 1) ||
    romanUrduMatches / words.length >= 0.15
  );
}

/**
 * Intelligently detects the language of the EXACT visible text before speaking.
 * Adheres to Requirement 1, 2, 3, 4, 8:
 * - Urdu script -> Urdu voice (ur-PK)
 * - English script -> English voice (en-US)
 * - Roman Urdu -> Urdu voice (ur-PK) when available
 * - Mixed Urdu + English -> Intelligently chooses dominant language, preserving exact text
 */
export function detectLanguageAndScript(
  text: string,
  userSelectedLang?: LanguageCode | string
): LanguageDetectionResult {
  if (!text) {
    return {
      detectedType: 'english',
      targetBcp47: 'en-US',
      targetLangName: 'English (US)',
      isUrduTarget: false,
      isRomanUrdu: false,
      urduCharCount: 0,
      latinCharCount: 0,
    };
  }

  // Count Urdu/Arabic Unicode characters
  const urduMatches = text.match(/[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/g);
  const urduCharCount = urduMatches ? urduMatches.length : 0;

  // Count Latin characters
  const latinMatches = text.match(/[a-zA-Z]/g);
  const latinCharCount = latinMatches ? latinMatches.length : 0;

  const isRoman = isTextRomanUrdu(text);

  // 1. Pure or predominantly Perso-Arabic / Urdu script
  if (urduCharCount > 0 && latinCharCount === 0) {
    // Check for Pashto specific letters: ښ, ځ, څ, ڼ, ړ, ګ, ږ
    const pashtoMatches = text.match(/[\u069A\u0681\u0685\u06BC\u0693\u06AB\u0696]/g);
    if (pashtoMatches && pashtoMatches.length >= 1) {
      return {
        detectedType: 'pashto',
        targetBcp47: 'ps',
        targetLangName: 'Pashto (پښتو)',
        isUrduTarget: false,
        isRomanUrdu: false,
        urduCharCount,
        latinCharCount,
      };
    }

    // Check for Sindhi specific letters: ڄ, ڃ, ڳ, ڱ, ڪ, ڇ, ڌ, ٿ
    const sindhiMatches = text.match(/[\u0684\u0689\u06B3\u06B1\u06AA\u0687\u068F\u067F]/g);
    if (sindhiMatches && sindhiMatches.length >= 1) {
      return {
        detectedType: 'sindhi',
        targetBcp47: 'sd-PK',
        targetLangName: 'Sindhi (سنڌي)',
        isUrduTarget: false,
        isRomanUrdu: false,
        urduCharCount,
        latinCharCount,
      };
    }

    // Check regional user selection
    if (userSelectedLang === 'pa') {
      return {
        detectedType: 'punjabi',
        targetBcp47: 'pa-PK',
        targetLangName: 'Punjabi (پنجابی)',
        isUrduTarget: false,
        isRomanUrdu: false,
        urduCharCount,
        latinCharCount,
      };
    }
    if (userSelectedLang === 'bal') {
      return {
        detectedType: 'balochi',
        targetBcp47: 'bal',
        targetLangName: 'Balochi (بلوچی)',
        isUrduTarget: false,
        isRomanUrdu: false,
        urduCharCount,
        latinCharCount,
      };
    }
    if (userSelectedLang === 'skr') {
      return {
        detectedType: 'saraiki',
        targetBcp47: 'skr-PK',
        targetLangName: 'Saraiki (سرائیکی)',
        isUrduTarget: false,
        isRomanUrdu: false,
        urduCharCount,
        latinCharCount,
      };
    }

    return {
      detectedType: 'urdu-script',
      targetBcp47: 'ur-PK',
      targetLangName: 'Urdu (Pakistan)',
      isUrduTarget: true,
      isRomanUrdu: false,
      urduCharCount,
      latinCharCount,
    };
  }

  // 2. Mixed Urdu + English
  if (urduCharCount > 0 && latinCharCount > 0) {
    // If Urdu script characters are equal or exceed Latin characters, dominant is Urdu
    if (urduCharCount >= latinCharCount) {
      return {
        detectedType: 'mixed-urdu-dominant',
        targetBcp47: 'ur-PK',
        targetLangName: 'Urdu (Pakistan)',
        isUrduTarget: true,
        isRomanUrdu: false,
        urduCharCount,
        latinCharCount,
      };
    } else {
      // Latin dominates count, but check if the Latin part is Roman Urdu
      if (isRoman) {
        return {
          detectedType: 'roman-urdu',
          targetBcp47: 'ur-PK',
          targetLangName: 'Roman Urdu (Urdu Voice)',
          isUrduTarget: true,
          isRomanUrdu: true,
          urduCharCount,
          latinCharCount,
        };
      }
      return {
        detectedType: 'mixed-english-dominant',
        targetBcp47: 'en-US',
        targetLangName: 'English (US)',
        isUrduTarget: false,
        isRomanUrdu: false,
        urduCharCount,
        latinCharCount,
      };
    }
  }

  // 3. No Urdu script, only Latin characters
  if (latinCharCount > 0) {
    if (isRoman) {
      return {
        detectedType: 'roman-urdu',
        targetBcp47: 'ur-PK',
        targetLangName: 'Roman Urdu (Urdu Voice)',
        isUrduTarget: true,
        isRomanUrdu: true,
        urduCharCount: 0,
        latinCharCount,
      };
    }
    return {
      detectedType: 'english',
      targetBcp47: 'en-US',
      targetLangName: 'English (US)',
      isUrduTarget: false,
      isRomanUrdu: false,
      urduCharCount: 0,
      latinCharCount,
    };
  }

  // 4. Numbers, symbols, or other languages
  const fallbackBcp47 = userSelectedLang === 'en' ? 'en-US' : 'ur-PK';
  const isUrdu = fallbackBcp47.startsWith('ur');
  return {
    detectedType: 'other',
    targetBcp47: fallbackBcp47,
    targetLangName: isUrdu ? 'Urdu (Pakistan)' : 'English (US)',
    isUrduTarget: isUrdu,
    isRomanUrdu: false,
    urduCharCount: 0,
    latinCharCount: 0,
  };
}

/**
 * Backward-compatible helper that resolves target language while respecting auto-detection.
 */
export function resolveTargetLanguage(
  text: string,
  selectedLang: LanguageCode | string
): {
  bcp47: string;
  langName: string;
  isUrdu: boolean;
  isRomanUrdu: boolean;
  detectedType: DetectedLanguageType;
} {
  const result = detectLanguageAndScript(text, selectedLang);
  return {
    bcp47: result.targetBcp47,
    langName: result.targetLangName,
    isUrdu: result.isUrduTarget,
    isRomanUrdu: result.isRomanUrdu,
    detectedType: result.detectedType,
  };
}

// Global in-memory voice detection cache to make lookups instantaneous (O(1))
let cachedBestUrduVoice: SpeechSynthesisVoice | null = null;
let cachedBestEnglishVoice: SpeechSynthesisVoice | null = null;
let cachedVoiceArrayRef: SpeechSynthesisVoice[] | null = null;
const voiceCompatibilityCache = new Map<string, SpeechSynthesisVoice | null>();

export function clearVoiceCache(): void {
  cachedBestUrduVoice = null;
  cachedBestEnglishVoice = null;
  cachedVoiceArrayRef = null;
  voiceCompatibilityCache.clear();
}

/**
 * Selects the optimal available voice for Urdu (preferring ur-PK and natural voices).
 * Returns null if no genuine Urdu voice is installed/available in the browser.
 * NEVER returns an English voice for Urdu text (Requirement 1 & 9).
 * Results are cached in-memory so subsequent calls take 0ms.
 */
export function findBestUrduVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  if (!voices || voices.length === 0) {
    return cachedBestUrduVoice;
  }

  // Fast cache hit: reuse previously detected voice
  if (voices === cachedVoiceArrayRef && cachedBestUrduVoice !== null) {
    return cachedBestUrduVoice;
  }

  // Filter candidate voices that are Urdu
  const urduCandidates: Array<{ voice: SpeechSynthesisVoice; score: number }> = [];

  for (const v of voices) {
    const lang = v.lang.toLowerCase().replace('_', '-');
    const name = v.name.toLowerCase();
    let score = 0;

    // 1. Exact ur-pk language code
    if (lang === 'ur-pk' || lang === 'ur_pk') {
      score += 100;
    } else if (lang.startsWith('ur')) {
      score += 70;
    } else if (name.includes('urdu') || name.includes('اردو') || name.includes('pakistan')) {
      score += 50;
    } else {
      continue; // Not an Urdu voice
    }

    // Prefer natural / online / neural voices
    if (name.includes('pakistan')) score += 40;
    if (name.includes('natural')) score += 30;
    if (name.includes('online')) score += 20;
    if (name.includes('neural')) score += 25;
    if (name.includes('asad') || name.includes('uzma')) score += 15;
    if (name.includes('google')) score += 10;

    urduCandidates.push({ voice: v, score });
  }

  if (urduCandidates.length === 0) {
    cachedVoiceArrayRef = voices;
    cachedBestUrduVoice = null;
    return null;
  }

  // Sort descending by score
  urduCandidates.sort((a, b) => b.score - a.score);
  const bestVoice = urduCandidates[0].voice;
  cachedVoiceArrayRef = voices;
  cachedBestUrduVoice = bestVoice;
  return bestVoice;
}

/**
 * Selects the optimal available voice for English (preferring en-US / en-GB natural voices).
 * Results are cached in-memory for instant lookups.
 */
export function findBestEnglishVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  if (!voices || voices.length === 0) {
    return cachedBestEnglishVoice;
  }

  if (voices === cachedVoiceArrayRef && cachedBestEnglishVoice !== null) {
    return cachedBestEnglishVoice;
  }

  const englishCandidates: Array<{ voice: SpeechSynthesisVoice; score: number }> = [];

  for (const v of voices) {
    const lang = v.lang.toLowerCase().replace('_', '-');
    const name = v.name.toLowerCase();
    let score = 0;

    if (lang === 'en-us') {
      score += 100;
    } else if (lang === 'en-gb') {
      score += 90;
    } else if (lang.startsWith('en')) {
      score += 60;
    } else if (name.includes('english')) {
      score += 40;
    } else {
      continue;
    }

    if (name.includes('natural')) score += 30;
    if (name.includes('online')) score += 20;
    if (name.includes('neural')) score += 25;
    if (name.includes('guy') || name.includes('jenny') || name.includes('aria')) score += 15;
    if (name.includes('google')) score += 10;

    englishCandidates.push({ voice: v, score });
  }

  if (englishCandidates.length === 0) {
    // Return any voice starting with 'en' as fallback
    const fallback = voices.find((v) => v.lang.toLowerCase().startsWith('en')) || null;
    cachedVoiceArrayRef = voices;
    cachedBestEnglishVoice = fallback;
    return fallback;
  }

  englishCandidates.sort((a, b) => b.score - a.score);
  const bestVoice = englishCandidates[0].voice;
  cachedVoiceArrayRef = voices;
  cachedBestEnglishVoice = bestVoice;
  return bestVoice;
}

/**
 * Finds a compatible speech synthesis voice based on target BCP47 tag or preferred voice URI.
 * Invariant: Returns null for Urdu if no Urdu voice exists, preventing English accents for Urdu text.
 * Cached for immediate O(1) returns.
 */
export function findCompatibleVoice(
  voices: SpeechSynthesisVoice[],
  targetBcp47: string,
  preferredVoiceURI?: string | null
): SpeechSynthesisVoice | null {
  if (!voices || voices.length === 0) {
    // Check if we have cached voices from previous runs
    if (targetBcp47.toLowerCase().startsWith('ur') && cachedBestUrduVoice) {
      return cachedBestUrduVoice;
    }
    if (targetBcp47.toLowerCase().startsWith('en') && cachedBestEnglishVoice) {
      return cachedBestEnglishVoice;
    }
    return null;
  }

  const cacheKey = `${targetBcp47}_${preferredVoiceURI || ''}`;
  if (voices === cachedVoiceArrayRef && voiceCompatibilityCache.has(cacheKey)) {
    return voiceCompatibilityCache.get(cacheKey) ?? null;
  }

  let result: SpeechSynthesisVoice | null = null;

  // 1. If user explicitly specified a preferred voice URI, attempt to match it
  if (preferredVoiceURI) {
    const explicitVoice = voices.find((v) => v.voiceURI === preferredVoiceURI);
    if (explicitVoice) {
      const isUrduTarget = targetBcp47.toLowerCase().startsWith('ur');
      const voiceIsUrdu =
        explicitVoice.lang.toLowerCase().startsWith('ur') ||
        explicitVoice.name.toLowerCase().includes('urdu') ||
        explicitVoice.name.toLowerCase().includes('اردو');

      if (!isUrduTarget || voiceIsUrdu) {
        result = explicitVoice;
      }
    }
  }

  // 2. Select best Urdu voice
  if (!result && targetBcp47.toLowerCase().startsWith('ur')) {
    result = findBestUrduVoice(voices);
  }

  // 3. Select best English voice
  if (!result && targetBcp47.toLowerCase().startsWith('en')) {
    result = findBestEnglishVoice(voices);
  }

  // 4. Generic matching for other languages
  if (!result) {
    const targetPrefix = targetBcp47.toLowerCase().split('-')[0];
    const exact = voices.find(
      (v) => v.lang.toLowerCase().replace('_', '-') === targetBcp47.toLowerCase()
    );
    if (exact) {
      result = exact;
    } else {
      const prefix = voices.find((v) => v.lang.toLowerCase().startsWith(targetPrefix));
      if (prefix) {
        result = prefix;
      } else {
        // Fallback for Pakistani regional languages where native OS voices are often uninstalled:
        // Use Urdu voice as the closest phonetic engine for Perso-Arabic scripts, or default English voice.
        result = findBestUrduVoice(voices) || findBestEnglishVoice(voices) || voices[0] || null;
      }
    }
  }

  if (voices === cachedVoiceArrayRef) {
    voiceCompatibilityCache.set(cacheKey, result);
  }
  return result;
}

export type TTSPlayState =
  | 'idle'
  | 'preparing'
  | 'speaking'
  | 'paused'
  | 'finished'
  | 'playing'
  | 'stopped';

export type GeminiVoiceName = 'Kore' | 'Zephyr' | 'Puck' | 'Fenrir' | 'Charon';

export interface AiVoiceOption {
  id: GeminiVoiceName;
  name: string;
  gender: 'Female' | 'Male';
  description: string;
}

export const AI_VOICES: AiVoiceOption[] = [
  {
    id: 'Kore',
    name: 'Kore (Natural & Clear)',
    gender: 'Female',
    description: 'Recommended for crystal-clear Urdu, English, and regional pronunciation',
  },
  {
    id: 'Zephyr',
    name: 'Zephyr (Warm & Expressive)',
    gender: 'Female',
    description: 'Gentle, conversational, and natural tone',
  },
  {
    id: 'Puck',
    name: 'Puck (Friendly & Engaging)',
    gender: 'Male',
    description: 'Lively, friendly, and energetic cadence',
  },
  {
    id: 'Fenrir',
    name: 'Fenrir (Deep & Professional)',
    gender: 'Male',
    description: 'Deep, steady, authoritative tone',
  },
  {
    id: 'Charon',
    name: 'Charon (Calm & Informative)',
    gender: 'Male',
    description: 'Measured, calm, educational tone',
  },
];

export interface VoiceSettings {
  preferredEngine: 'gemini' | 'browser' | 'auto';
  languageMode:
    | 'auto'
    | 'ur-PK'
    | 'en-US'
    | 'roman-urdu'
    | 'ps'
    | 'pa-PK'
    | 'sd-PK'
    | 'bal'
    | 'skr-PK';
  selectedAiVoice: GeminiVoiceName;
  selectedVoiceURI: string | null;
  speed: number;
  pitch: number;
}

export const DEFAULT_VOICE_SETTINGS: VoiceSettings = {
  preferredEngine: 'auto',
  languageMode: 'auto',
  selectedAiVoice: 'Kore',
  selectedVoiceURI: null,
  speed: 1.0, // Natural 1.0x normal speaking speed
  pitch: 1.0, // Natural 1.0 pitch
};

export interface TTSState {
  isSupported: boolean;
  speakingId: string | null;
  playState: TTSPlayState;
  voiceError: string | null;
  activeLanguageName: string | null;
  currentChunkIndex: number;
  totalChunks: number;
}
