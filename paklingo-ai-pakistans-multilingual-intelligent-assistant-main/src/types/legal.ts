import { LanguageCode } from '../types';

export type LegalTab =
  | 'ask'
  | 'explain-doc'
  | 'contract'
  | 'property'
  | 'court-notice'
  | 'rights'
  | 'terms';

export type LegalLanguageMedium = 'en' | 'ur' | 'roman_ur';

export type QuickActionDomain =
  | 'contracts'
  | 'property'
  | 'court-notices'
  | 'employment'
  | 'consumer-rights'
  | 'family-law'
  | 'general';

export interface LegalTermItem {
  term: string;
  urduTerm: string;
  romanUrdu: string;
  category: 'revenue' | 'civil' | 'family' | 'criminal' | 'procedure';
  shortSummary: string;
  statutoryRef?: string;
}
