export type PageId =
  | 'home'
  | 'translate'
  | 'chat'
  | 'tools'
  | 'documents'
  | 'history'
  | 'about'
  // Legacy aliases and sub-tool workspaces
  | 'ai-assistant'
  | 'translator'
  | 'ocr-documents'
  | 'dashboard'
  | 'government'
  | 'teacher'
  | 'medical'
  | 'farmer'
  | 'legal'
  | 'fake-news'
  | 'sign-language'
  | 'voice-assistant'
  | 'settings';

export type LanguageCode =
  | 'ur' // Urdu
  | 'en' // English
  | 'roman_ur' // Roman Urdu
  | 'pa' // Punjabi
  | 'sd' // Sindhi
  | 'ps' // Pashto
  | 'bal' // Balochi
  | 'skr' // Saraiki
  | 'hnd' // Hindko
  | 'ks' // Kashmiri
  | 'brh'; // Brahui

export interface Language {
  code: LanguageCode;
  name: string;
  nativeName: string;
  direction: 'ltr' | 'rtl';
  flagEmoji: string;
  script: string;
  sampleGreeting: string;
  taglineLocal: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: string;
  languageCode?: LanguageCode;
  category?: string;
  sourceNote?: string;
  suggestedActions?: string[];
  sources?: GovVerificationSource[];
  isGovVerified?: boolean;
  officialPortalUrl?: string;
  verifiedOfficialInfo?: string;
  generalGuidance?: string;
  aiExplanation?: string;
  dateChecked?: string;
  query?: string;
  isError?: boolean;
}

export interface GovVerificationSource {
  title: string;
  uri: string;
  domain: string;
  dateChecked: string;
}

export interface GovAssistantResponse {
  text: string;
  verifiedOfficialInfo: string;
  generalGuidance: string;
  needsVerificationInfo?: string;
  aiExplanation: string;
  sources: GovVerificationSource[];
  isVerified: boolean;
  dateChecked: string;
  officialPortalUrl?: string;
  searchQueries?: string[];
}

export interface GovService {
  id: string;
  title: string;
  titleUrdu: string;
  department: string;
  category: 'identity' | 'finance' | 'legal' | 'welfare' | 'transport' | 'civic' | 'employment';
  officialWebsite: string;
  processingDays: string;
  feeEstimate: string;
  whatItIs: string;
  whoNeedsIt: string;
  requiredDocuments: string[];
  steps: string[];
  verificationGuidance: string;
  officialPortalNotice: string;
  verificationQuery: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface CropInfo {
  id: string;
  name: string;
  urduName: string;
  season: 'Rabi (Winter)' | 'Kharif (Summer)' | 'Annual / Multi-Season' | 'Year-round / Perennial';
  commonDiseases: Array<{
    name: string;
    symptoms: string;
    treatment: string;
    prevention: string;
  }>;
  commonPests: Array<{
    name: string;
    identification: string;
    organicRemedy: string;
    chemicalRemedy: string;
  }>;
  idealSoil: string;
  waterRequirement: string;
}

export interface AccessibilitySettings {
  fontSize: 'sm' | 'md' | 'lg' | 'xl';
  highContrast: boolean;
  reducedMotion: boolean;
  simpleMode: boolean; // Low-literacy simple icon mode
  screenReaderMode?: boolean;
  voiceFeedback: boolean;
  speechRate: number;
  theme: 'light' | 'dark' | 'system' | 'contrast';
}

export type AuthAnimationState =
  | 'INITIAL'
  | 'WALKING_IN'
  | 'ARRIVED'
  | 'PLACING_BRIEFCASE'
  | 'FINAL_POSE'
  | 'GESTURING'
  | 'SHOW_LOGIN';
