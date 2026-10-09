/**
 * Global Multilingual System Directives for PakLingo AI (Backend)
 * 
 * Enforces strict adherence to user selected language across all endpoints
 * (Chat, Government Assistant, Farmer, Medical, Legal, Teacher, Fact Check, PSL, OCR).
 * 
 * Invariant: Even if the user submits input in English, Urdu, or another dialect,
 * the AI MUST understand the query and answer entirely in the targeted selected language.
 */

export const LANGUAGE_DISPLAY_NAMES: Record<string, string> = {
  ur: 'Urdu (اردو)',
  en: 'English',
  roman_ur: 'Roman Urdu (Pakistani Urdu written in Latin/English alphabet)',
  roman: 'Roman Urdu (Pakistani Urdu written in Latin/English alphabet)',
  pa: 'Punjabi (پنجابی - شاہ مکھی)',
  sd: 'Sindhi (سنڌي)',
  ps: 'Pashto (پښتو)',
  bal: 'Balochi (بلوچی)',
  skr: 'Saraiki (سرائیکی)',
  hnd: 'Hindko (ہندکو)',
  ks: 'Kashmiri (کشمیری)',
  brh: 'Brahui (براہوئی)',
};

export function getLanguageName(code: string): string {
  const normalized = (code || 'ur').toLowerCase().trim();
  return LANGUAGE_DISPLAY_NAMES[normalized] || LANGUAGE_DISPLAY_NAMES['ur'];
}

export function getGlobalLanguageDirective(languageCode: string): string {
  const code = (languageCode || 'ur').toLowerCase().trim();

  switch (code) {
    case 'ps':
      return `CRITICAL MULTILINGUAL REQUIREMENT:
The user has actively selected PASHTO (پښتو) as their interface language.
1. You MUST generate your ENTIRE response, explanations, guidance, steps, advice, and titles in authentic, fluent Pashto (پښتو / Pashto Arabic script).
2. The user's input might be in English, Urdu, Roman Urdu, or Pashto. Understand their question in whatever language they used, but provide your complete, detailed answer ONLY in Pashto (پښتو).
3. Do NOT respond in English or standard Urdu. Use authentic Pashto vocabulary and natural phrasing.`;

    case 'bal':
      return `CRITICAL MULTILINGUAL REQUIREMENT:
The user has actively selected BALOCHI (بلوچی) as their interface language.
1. You MUST generate your ENTIRE response, explanations, guidance, steps, advice, and titles in authentic, natural Balochi (بلوچی / Balochi script).
2. The user's input might be in English, Urdu, or Balochi. Understand their question and provide your complete answer ONLY in Balochi (بلوچی).
3. Do NOT default to English or standard Urdu.`;

    case 'sd':
      return `CRITICAL MULTILINGUAL REQUIREMENT:
The user has actively selected SINDHI (سنڌي) as their interface language.
1. You MUST generate your ENTIRE response, explanations, guidance, steps, advice, and titles in authentic, fluent Sindhi (سنڌي / Sindhi Arabic script with proper Sindhi characters: ڄ, ڃ, ڳ, ڱ, ڪ, ڇ, ڌ, ٿ).
2. The user's input might be in English, Urdu, or Sindhi. Understand their question and provide your complete answer ONLY in Sindhi (سنڌي).
3. Do NOT default to English or Urdu.`;

    case 'pa':
      return `CRITICAL MULTILINGUAL REQUIREMENT:
The user has actively selected PUNJABI (پنجابی) as their interface language.
1. You MUST generate your ENTIRE response, explanations, guidance, steps, advice, and titles in authentic, natural Pakistani Punjabi (پنجابی / Shahmukhi script).
2. The user's input might be in English, Urdu, or Punjabi. Understand their question and provide your complete answer ONLY in Punjabi (پنجابی).
3. Do NOT default to English or standard Urdu.`;

    case 'skr':
      return `CRITICAL MULTILINGUAL REQUIREMENT:
The user has actively selected SARAIKI (سرائیکی) as their interface language.
1. You MUST generate your ENTIRE response, explanations, guidance, steps, advice, and titles in authentic, sweet Saraiki (سرائیکی / Saraiki script with characters: ݙ, ڳ, ݨ, ڄ, ٻ).
2. Understand the question in whatever language the user typed, and answer completely in Saraiki (سرائیکی).
3. Do NOT default to English.`;

    case 'hnd':
      return `CRITICAL MULTILINGUAL REQUIREMENT:
The user has actively selected HINDKO (ہندکو) as their interface language.
1. You MUST generate your ENTIRE response, explanations, guidance, steps, and advice in authentic Hindko (ہندکو / Hindko script).
2. Understand the question and provide the response in Hindko.`;

    case 'ks':
      return `CRITICAL MULTILINGUAL REQUIREMENT:
The user has actively selected KASHMIRI (کشمیری) as their interface language.
1. You MUST generate your ENTIRE response, explanations, guidance, steps, and advice in authentic Kashmiri (کشمیری / Kashmiri Perso-Arabic script: چھُ, کٔرِتھ, پریتھ).
2. Understand the question and provide the response in Kashmiri.`;

    case 'brh':
      return `CRITICAL MULTILINGUAL REQUIREMENT:
The user has actively selected BRAHUI (براہوئی) as their interface language.
1. You MUST generate your ENTIRE response, explanations, guidance, steps, and advice in authentic Brahui (براہوئی / Brahui script).
2. Understand the question and provide the response in Brahui.`;

    case 'roman_ur':
    case 'roman':
      return `CRITICAL MULTILINGUAL REQUIREMENT:
The user has actively selected ROMAN URDU as their interface language (Urdu written in Latin / English alphabet).
1. You MUST generate your ENTIRE response in natural, fluent, easy-to-read Roman Urdu (e.g., "Yeh aam tor par... Iske liye aapko pehle...").
2. Understand the input in English, Urdu script, or Roman Urdu, and provide your full response in conversational Roman Urdu.`;

    case 'en':
      return `CRITICAL MULTILINGUAL REQUIREMENT:
The user has actively selected ENGLISH as their interface language.
1. You MUST generate your ENTIRE response in clear, concise, professional, grammatically sound English.`;

    case 'ur':
    default:
      return `CRITICAL MULTILINGUAL REQUIREMENT:
The user has actively selected URDU (اردو) as their interface language.
1. You MUST generate your ENTIRE response, explanations, guidance, steps, and advice in authentic, clear, respectful Urdu (اردو رسم الخط / Nastaliq script).
2. Understand questions asked in English or Urdu, and answer completely in Urdu.`;
  }
}
