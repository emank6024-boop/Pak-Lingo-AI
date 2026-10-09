import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Search,
  ArrowRight,
  Sparkles,
  Bot,
  Languages,
  FileText,
  Building2,
  ShieldCheck,
  Sprout,
  HeartPulse,
  Scale,
  GraduationCap,
  Volume2,
  HandHelping,
  CheckCircle2,
  Lock,
  Compass,
  ArrowUpRight,
  Shield,
  Zap,
  User,
} from 'lucide-react';
import { PageId, LanguageCode } from '../../types';
import { SUPPORTED_LANGUAGES } from '../../data/languages';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';

interface HomeProps {
  onSelectPage: (page: PageId) => void;
  selectedLanguage: LanguageCode;
  onSelectLanguage: (lang: LanguageCode) => void;
  onStartChatWithPrompt: (prompt: string) => void;
  onOpenAuthModal?: () => void;
  simpleMode?: boolean;
}

interface ModuleCard {
  id: PageId;
  title: string;
  titleUrdu: string;
  desc: string;
  descUrdu: string;
  badge: string;
  badgeUrdu: string;
  icon: React.ComponentType<{ className?: string }>;
  actionLabel: string;
  actionLabelUrdu: string;
}

const MODULE_CARDS: ModuleCard[] = [
  {
    id: 'chat',
    title: 'AI Conversational Assistant',
    titleUrdu: 'اے آئی گفتگو و معاونت',
    desc: 'Bilingual chat grounded in verified Pakistani civic information, everyday problem-solving, and speech.',
    descUrdu: 'پاکستانی امور، سرکاری معلومات، روزمرہ مسائل اور صوتی فیڈ بیک کے ساتھ ہمہ گیر گفتگو۔',
    badge: 'Core Engine',
    badgeUrdu: 'مرکزی معاون',
    icon: Bot,
    actionLabel: 'Open Assistant',
    actionLabelUrdu: 'چیٹ شروع کریں',
  },
  {
    id: 'translate',
    title: 'Regional Live Translator',
    titleUrdu: 'پاکستانی علاقائی مترجم',
    desc: 'Instant translation across Urdu, Punjabi, Pashto, Sindhi, Balochi, and English with Roman phonetics.',
    descUrdu: 'اردو، پنجابی، پشتو، سندھی، بلوچی اور انگریزی میں فوری اور بااعتماد ترجمہ اور رومن تلفظ۔',
    badge: '10 Languages',
    badgeUrdu: '۱۰ زبانیں',
    icon: Languages,
    actionLabel: 'Translate Now',
    actionLabelUrdu: 'ترجمہ کریں',
  },
  {
    id: 'documents',
    title: 'Document OCR Intelligence',
    titleUrdu: 'دستاویزات و بل تفہیم',
    desc: 'Scan and decode CNIC cards, electricity bills, legal deeds, and official forms in seconds.',
    descUrdu: 'شناختی کارڈ، بجلی و گیس کے بل، عدالتی دستاویزات اور سرکاری فارمز کا فوری تجزیہ اور خلاصہ۔',
    badge: 'Vision AI',
    badgeUrdu: 'بصری اے آئی',
    icon: FileText,
    actionLabel: 'Scan Document',
    actionLabelUrdu: 'دستاویز اسکین کریں',
  },
  {
    id: 'government',
    title: 'Civic & NADRA Services',
    titleUrdu: 'سرکاری و نادرا رہنمائی',
    desc: 'Step-by-step procedures for Smart CNIC, Passports, BISP 8171, and FBR tax return filing.',
    descUrdu: 'نادرا سمارٹ کارڈ، پاسپورٹ، بے نظیر انکم سپورٹ پروگرام اور ایف بی آر فائلنگ کا مرحلہ وار طریقہ۔',
    badge: 'Verified Portals',
    badgeUrdu: 'باضابطہ طریقہ کار',
    icon: Building2,
    actionLabel: 'Check Procedure',
    actionLabelUrdu: 'طریقہ کار دیکھیں',
  },
  {
    id: 'fake-news',
    title: 'Fact Check & Verification',
    titleUrdu: 'حقائق کی تصدیق و تجزیہ',
    desc: 'Forensic evaluation of viral WhatsApp forwards, news headlines, and social media claims.',
    descUrdu: 'سوشل میڈیا اور واٹس ایپ پر گردش کرنے والی خبروں اور دعووں کی غیر جانبدارانہ تحقیق۔',
    badge: 'Grounded Search',
    badgeUrdu: 'مصدقہ ذرائع',
    icon: ShieldCheck,
    actionLabel: 'Verify Claim',
    actionLabelUrdu: 'خبر کی تصدیق کریں',
  },
  {
    id: 'farmer',
    title: 'Kissan Agriculture AI',
    titleUrdu: 'کسان زرعی معاون',
    desc: 'Crop pest remedies, wheat/cotton disease diagnosis, fertilizer timing, and mandi price alerts.',
    descUrdu: 'فصلوں کی بیماریاں، کیڑوں سے بچاؤ کے دیسی علاج، کھاد کے اوقات اور غلہ منڈی کے نرخ۔',
    badge: 'Agri Intelligence',
    badgeUrdu: 'زرعی رہنمائی',
    icon: Sprout,
    actionLabel: 'Consult Kissan AI',
    actionLabelUrdu: 'کسان مشورہ لیں',
  },
  {
    id: 'medical',
    title: 'Health & First-Aid Triage',
    titleUrdu: 'صحت و فوری طبی امداد',
    desc: 'Symptom triage, heatstroke care, seasonal prevention, and direct Rescue 1122 hotline access.',
    descUrdu: 'ابتدائی طبی امداد، گرمی کے اثرات سے بچاؤ، موسمی بیماریاں اور ریسکیو 1122 ہاٹ لائنز۔',
    badge: 'Emergency Triage',
    badgeUrdu: 'ابتدائی طبی رہنمائی',
    icon: HeartPulse,
    actionLabel: 'View Health Guide',
    actionLabelUrdu: 'طبی مشورہ دیکھیں',
  },
  {
    id: 'legal',
    title: 'Legal Rights & Awareness',
    titleUrdu: 'قانونی آگاہی و شہری حقوق',
    desc: 'Clear legal rights regarding residential tenant agreements, labor laws, inheritance, and consumer protection.',
    descUrdu: 'کرایہ داری معاہدات، مزدوروں کے حقوق، وراثت کے بنیادی قوانین اور صارف کے قانونی تحفظ کی تفہیم۔',
    badge: 'Citizen Rights',
    badgeUrdu: 'شہری حقوق',
    icon: Scale,
    actionLabel: 'Explore Legal Rights',
    actionLabelUrdu: 'قانونی رہنمائی لیں',
  },
  {
    id: 'teacher',
    title: 'STEM AI Teacher',
    titleUrdu: 'تعلیمی استاد و تدریس',
    desc: 'Step-by-step problem solver for Matric and Intermediate Math, Physics, and Chemistry.',
    descUrdu: 'میٹرک اور انٹرمیڈیٹ کے طلبہ کے لیے ریاضی، طبیعیات اور کیمیا کے سوالات کا مرحلہ وار حل۔',
    badge: 'Matric & FSc',
    badgeUrdu: 'نصاب تعلیم',
    icon: GraduationCap,
    actionLabel: 'Study With AI',
    actionLabelUrdu: 'سبق شروع کریں',
  },
  {
    id: 'sign-language',
    title: 'Pakistan Sign Language (PSL)',
    titleUrdu: 'پاکستان اشاروں کی زبان',
    desc: 'Interactive PSL gesture dictionary, fingerspelling illustrations, and accessible communication for the deaf.',
    descUrdu: 'پاکستان سائن لینگویج (PSL) لغت، ہجے کے اشارے اور سماعت سے محروم افراد کے لیے معاونت۔',
    badge: 'Accessibility',
    badgeUrdu: 'خصوصی رسائی',
    icon: HandHelping,
    actionLabel: 'Explore PSL',
    actionLabelUrdu: 'اشاروں کی زبان دیکھیں',
  },
];

const SUGGESTED_PROMPTS = [
  {
    label: 'نادرا سمارٹ کارڈ تجدید',
    query: 'NADRA Smart NIC renewal procedure, fees, and required documents in Pakistan',
  },
  {
    label: 'بجلی بل میں ٹیکسز کی تفہیم',
    query: 'Explain fuel price adjustment (FPA), taxes, and surcharges in Pakistani electricity bills',
  },
  {
    label: 'گندم کی فصل کی بیماریاں',
    query: 'Wheat crop yellow rust disease symptoms and organic treatment in Pakistan',
  },
  {
    label: 'بی آئی ایس پی 8171 اہلیت',
    query: 'How to check BISP 8171 financial assistance eligibility and verification process',
  },
];

export const Home: React.FC<HomeProps> = ({
  onSelectPage,
  selectedLanguage,
  onSelectLanguage,
  onStartChatWithPrompt,
  onOpenAuthModal,
}) => {
  const [searchInput, setSearchInput] = useState('');
  const { isRTL, t } = useLanguage();
  const { isAuthenticated } = useAuth();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchInput.trim();
    if (!query) return;
    onStartChatWithPrompt(query);
  };

  return (
    <div
      className="w-full min-h-[calc(100vh-4rem)] flex flex-col bg-[var(--background)] text-[var(--text-primary)] transition-colors duration-200"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* 1. HERO SECTION */}
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-20 pb-12 sm:pb-16 text-center flex flex-col items-center">
        {/* Brand Tagline Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-semibold mb-6 shadow-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>{isRTL ? 'جدید ترین پاکستانی اے آئی سوپر ایپ' : 'Modern Pakistani AI Super-App'}</span>
        </div>

        {/* Strong Main Headline */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[var(--text-primary)] max-w-4xl mx-auto leading-tight sm:leading-tight mb-5">
          {isRTL ? (
            <span className="font-urdu leading-normal block">
              اے آئی، زبان اور رسائی کے ذریعے ہر پاکستانی کو بااختیار بنانا
            </span>
          ) : (
            <>
              Empowering Every Pakistani Through{' '}
              <span className="text-emerald-600 dark:text-emerald-400">AI, Language</span>, and{' '}
              <span className="text-teal-600 dark:text-teal-400">Accessibility</span>
            </>
          )}
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-lg text-[var(--text-secondary)] max-w-2xl mx-auto leading-relaxed mb-8 font-normal">
          {isRTL
            ? 'پاکستان کی ۱۰ علاقائی زبانوں میں مصدقہ سرکاری رہنمائی، فوری کثیر اللسانی ترجمہ، زرعی و طبی معاونت اور دستاویزات کی تفہیم — پرائیویسی کے مکمل تحفظ کے ساتھ۔'
            : 'Next-generation conversational intelligence across 10 Pakistani regional languages. Official civic guidance, instant translation, farming advisories, and document intelligence.'}
        </p>

        {/* Primary CTA Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
          <button
            type="button"
            onClick={() => onSelectPage('chat')}
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-sm font-semibold shadow-xs hover:shadow-md transition-all duration-150 cursor-pointer"
          >
            <Bot className="w-4 h-4" />
            <span>{isRTL ? 'معاون اے آئی شروع کریں' : 'Start Assistant'}</span>
            <ArrowRight className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => {
              const el = document.getElementById('modules-grid');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl bg-[var(--surface)] hover:bg-[var(--surface-hover)] active:scale-95 border border-[var(--border)] text-[var(--text-primary)] text-sm font-medium shadow-xs transition-all cursor-pointer"
          >
            <Compass className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{isRTL ? 'تمام ماڈیولز دیکھیں' : 'Explore Modules'}</span>
          </button>

          {!isAuthenticated && onOpenAuthModal && (
            <button
              type="button"
              id="hero-login-signup-btn"
              onClick={onOpenAuthModal}
              className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 active:scale-95 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-sm font-semibold shadow-xs transition-all cursor-pointer"
            >
              <User className="w-4 h-4" />
              <span>{isRTL ? 'لاگ ان / اکاؤنٹ بنائیں' : 'Login / Sign Up'}</span>
            </button>
          )}
        </div>

        {/* Interactive Search Bar & Prompt Composer */}
        <div className="w-full max-w-2xl mb-4">
          <form
            onSubmit={handleSearchSubmit}
            className="relative flex items-center bg-[var(--surface)] border border-[var(--border)] hover:border-emerald-500/50 focus-within:border-emerald-500 focus-within:ring-3 focus-within:ring-emerald-500/20 rounded-2xl p-2 sm:p-2.5 shadow-sm transition-all duration-200"
          >
            <div className="pl-3 pr-2 text-[var(--text-muted)]">
              <Search className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>

            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={
                isRTL
                  ? 'نادرا، بجلی کا بل، کسان رہنمائی، یا قانونی سوال پوچھیں...'
                  : 'Ask about NADRA, electricity bills, farming, or legal rights...'
              }
              className="w-full bg-transparent border-none text-sm sm:text-base text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none py-1.5 font-medium"
            />

            <button
              type="submit"
              disabled={!searchInput.trim()}
              className="shrink-0 flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-30 text-white active:scale-95 transition-all cursor-pointer disabled:cursor-not-allowed shadow-xs"
              title="Search and Ask PakLingo"
            >
              <ArrowRight className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
            </button>
          </form>

          {/* Quick Suggested Prompt Chips */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-3.5">
            <span className="text-xs text-[var(--text-muted)] font-medium">
              {isRTL ? 'تجویز کردہ:' : 'Try:'}
            </span>
            {SUGGESTED_PROMPTS.map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onStartChatWithPrompt(prompt.query)}
                className="px-3 py-1 rounded-full bg-[var(--surface)] hover:bg-[var(--surface-hover)] active:scale-95 text-xs text-[var(--text-secondary)] border border-[var(--border)] hover:border-emerald-500/50 transition-all cursor-pointer font-medium shadow-2xs"
              >
                {prompt.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 2. ELEGANT LANGUAGE SELECTOR STRIP */}
      <section className="w-full border-y border-[var(--border)] bg-[var(--surface)] py-4 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 shrink-0">
            <Languages className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs font-semibold text-[var(--text-primary)]">
              {isRTL ? 'تمام پاکستانی زبانوں کی مکمل معاونت:' : 'Supported Pakistani Dialects & Languages:'}
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-1.5">
            {SUPPORTED_LANGUAGES.map((lang) => {
              const isSelected = selectedLanguage === lang.code;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => onSelectLanguage(lang.code)}
                  className={`px-2.5 py-1 rounded-lg text-xs transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                      : 'bg-[var(--surface-secondary)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] border border-[var(--border)]'
                  }`}
                >
                  <span className="font-medium">{lang.name}</span>
                  <span className={`text-[10px] ${isSelected ? 'text-emerald-100' : 'text-[var(--text-muted)]'}`}>
                    ({lang.nativeName})
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. REFINED GRID OF ASSISTANT MODULES */}
      <section id="modules-grid" className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isRTL ? 'جامع ماڈیولز' : 'Specialized Capabilities'}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)] mb-3">
            {isRTL ? 'تمام ضروری شعبہ جات کے لیے تیار کردہ ٹولز' : 'Intelligence Tailored to Everyday Pakistani Needs'}
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)]">
            {isRTL
              ? 'ہر ماڈیول باضابطہ قومی ڈیٹا اور جدید بصری و صوتی ماڈلز کے ساتھ لیس ہے۔'
              : 'Each capability is grounded in authentic procedural databases, vision pipelines, and multi-dialect models.'}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {MODULE_CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.id}
                whileHover={{ y: -3 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="group relative flex flex-col justify-between p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] hover:border-emerald-500/50 shadow-xs hover:shadow-md transition-all duration-200"
              >
                <div>
                  {/* Card Header: Icon + Badge */}
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--surface-secondary)] text-[var(--text-muted)] border border-[var(--border)]">
                      {isRTL ? card.badgeUrdu : card.badge}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-base font-bold text-[var(--text-primary)] mb-1.5 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    {isRTL ? card.titleUrdu : card.title}
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-normal mb-6">
                    {isRTL ? card.descUrdu : card.desc}
                  </p>
                </div>

                {/* Card Action Link */}
                <button
                  type="button"
                  onClick={() => onSelectPage(card.id)}
                  className="w-full inline-flex items-center justify-between px-3.5 py-2 rounded-xl bg-[var(--surface-secondary)] hover:bg-emerald-600 hover:text-white text-xs font-semibold text-[var(--text-primary)] border border-[var(--border)] hover:border-emerald-600 active:scale-95 transition-all cursor-pointer shadow-2xs"
                >
                  <span>{isRTL ? card.actionLabelUrdu : card.actionLabel}</span>
                  <ArrowRight className={`w-3.5 h-3.5 ${isRTL ? 'rotate-180' : ''}`} />
                </button>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* 4. "HOW PAKLINGO HELPS" VALUE SECTION */}
      <section className="w-full bg-[var(--surface)] border-y border-[var(--border)] py-16 sm:py-20 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)] mb-3">
              {isRTL ? 'پاک لنگو کس طرح مدد فراہم کرتا ہے؟' : 'How PakLingo Transforms Everyday Access'}
            </h2>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)]">
              {isRTL
                ? 'زبان کی رکاوٹوں اور پیچیدہ سرکاری طریقہ کار کو ختم کر کے شہریوں کو براہ راست بااختیار بنانا۔'
                : 'Eliminating bureaucratic confusion and linguistic barriers for citizens across all provinces.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Benefit 1 */}
            <div className="p-6 rounded-2xl bg-[var(--surface-secondary)] border border-[var(--border)] flex flex-col items-start text-left">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4 border border-emerald-500/20">
                <Building2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-[var(--text-primary)] mb-2">
                {isRTL ? 'شہری و سرکاری سہولت' : 'Civic Empowerment'}
              </h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                {isRTL
                  ? 'نادرا سمارٹ کارڈ کی تجدید، پاسپورٹ فیس، اور بی آئی ایس پی کی اہلیت کو بغیر کسی ایجنٹ کے واضح طور پر سمجھیں۔'
                  : 'Demystifying complex government paperwork, NADRA renewal steps, and BISP 8171 without requiring touts or middlemen.'}
              </p>
            </div>

            {/* Benefit 2 */}
            <div className="p-6 rounded-2xl bg-[var(--surface-secondary)] border border-[var(--border)] flex flex-col items-start text-left">
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-4 border border-teal-500/20">
                <Languages className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-[var(--text-primary)] mb-2">
                {isRTL ? 'لسانی تفریق کا خاتمہ' : 'Linguistic Inclusion'}
              </h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                {isRTL
                  ? 'اردو، پنجابی، پشتو، سندھی اور بلوچی سمیت پاکستان کی تمام بڑی زبانوں میں مقامی طرز پر براہ راست مکالمہ۔'
                  : 'Native Arabic-script rendering, authentic Roman transliteration, and voice synthesis across Pakistan’s rich linguistic tapestry.'}
              </p>
            </div>

            {/* Benefit 3 */}
            <div className="p-6 rounded-2xl bg-[var(--surface-secondary)] border border-[var(--border)] flex flex-col items-start text-left">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4 border border-emerald-500/20">
                <Sprout className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-[var(--text-primary)] mb-2">
                {isRTL ? 'عملی روزمرہ ذہانت' : 'Actionable Grassroots Help'}
              </h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                {isRTL
                  ? 'کھیت میں کسان کے لیے فصل کی تشخیص، طالب علم کے لیے امتحانی رہنمائی، اور گھر کے لیے بجلی کے بل کی تفہیم۔'
                  : 'Fast diagnosis of crop rust in the field, step-by-step STEM equations for students, and exact bill tariff breakdowns.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Optional Sign Up Callout Banner for Unauthenticated Visitors */}
      {!isAuthenticated && onOpenAuthModal && (
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="p-6 sm:p-8 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-1 text-center sm:text-left">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold mb-1">
                <Sparkles className="w-3 h-3" />
                <span>{isRTL ? 'ذاتی کلاؤڈ اکاؤنٹ' : 'Sync & Save History'}</span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-[var(--text-primary)]">
                {isRTL
                  ? 'گفتگو اور دستاویزات کو محفوظ رکھنے کے لیے اکاؤنٹ بنائیں'
                  : 'Create a free account to save your chat & translation history'}
              </h3>
              <p className="text-xs text-[var(--text-secondary)] max-w-xl">
                {isRTL
                  ? 'گوگل یا ای میل کے ذریعے سیکنڈوں میں شامل ہوں۔ آپ کے تمام سوالات اور ترجمے محفوظ رہیں گے۔'
                  : 'Sign in with Google or Email in seconds to store personalized activity and access seamless cross-device syncing.'}
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenAuthModal}
              id="home-cta-signup-btn"
              className="shrink-0 inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
            >
              <User className="w-4 h-4" />
              <span>{isRTL ? 'اکاؤنٹ بنائیں / لاگ ان' : 'Sign In / Create Account'}</span>
            </button>
          </div>
        </div>
      )}

      {/* 5. TRUST, PRIVACY & ACCESSIBILITY SECTION */}
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="p-8 sm:p-10 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
            <div className="lg:col-span-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs font-semibold mb-3">
                <Shield className="w-3.5 h-3.5" />
                <span>{isRTL ? 'اعتماد و شفافیت' : 'Trust & Compliance'}</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] mb-2">
                {isRTL ? 'شہریوں کا بااعتماد ساتھی' : 'Built for Privacy, Authenticity, and Access'}
              </h3>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                {isRTL
                  ? 'پاک لنگو اے آئی فرضی اعداد و شمار کے بجائے باضابطہ حکومتی ذرائع اور آزادانہ تحقیق پر انحصار کرتا ہے۔'
                  : 'PakLingo AI avoids synthetic hallucinations by grounding responses in verified Pakistani public registries and authoritative sources.'}
              </p>
            </div>

            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-[var(--text-primary)] mb-1">
                    {isRTL ? 'باضابطہ سرکاری تصدیق' : 'Official Portal Grounding'}
                  </h4>
                  <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                    {isRTL
                      ? 'نادرا، پاسپورٹ آفس اور ایف بی آر سے تصدیق شدہ لنکس اور طریقہ کار۔'
                      : 'Real links to official government portals (NADRA, DGIP, FBR) with zero mock estimates.'}
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] flex items-start gap-3">
                <Lock className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-[var(--text-primary)] mb-1">
                    {isRTL ? 'مکمل رازداری و تحفظ' : 'Privacy-First Architecture'}
                  </h4>
                  <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                    {isRTL
                      ? 'آپ کی نجی گفتگو اور اسکین شدہ دستاویزات محفوظ اور مقامی رہتی ہیں۔'
                      : 'Uploaded files and conversations are processed securely without unauthorized third-party sharing.'}
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] flex items-start gap-3">
                <Volume2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-[var(--text-primary)] mb-1">
                    {isRTL ? 'صوتی معاونت اور سننا' : 'Multilingual Speech & Audio'}
                  </h4>
                  <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                    {isRTL
                      ? 'تحریر پڑھنے میں دشواری کی صورت میں مکمل آڈیو فیڈ بیک کی سہولت۔'
                      : 'Complete voice typing and text-to-speech reading for low-literacy users and regional speakers.'}
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] flex items-start gap-3">
                <HandHelping className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-[var(--text-primary)] mb-1">
                    {isRTL ? 'خصوصی رسائی اور اشارے' : 'Deaf & PSL Accessibility'}
                  </h4>
                  <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                    {isRTL
                      ? 'پاکستان اشاروں کی زبان (PSL) اور اعلیٰ کنٹراسٹ موڈ کی مکمل فراہمی۔'
                      : 'Pakistan Sign Language dictionary, fingerspelling learning, and WCAG AA high-contrast support.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
