import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Languages,
  Mic,
  HandHelping,
  Building2,
  Scale,
  HeartPulse,
  Sprout,
  GraduationCap,
  ShieldAlert,
  FileText,
  Search,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { PageId } from '../../types';
import { useLanguage } from '../../context/LanguageContext';

interface ToolsPageProps {
  onSelectPage: (page: PageId) => void;
}

interface ToolItem {
  id: PageId;
  name: string;
  nameUrdu: string;
  category: 'Language' | 'Civic & Legal' | 'Health & Agriculture' | 'Education & Media';
  description: string;
  icon: React.ReactNode;
}

const TOOLS: ToolItem[] = [
  // Language
  {
    id: 'translate',
    name: 'Live Translator',
    nameUrdu: 'لائیو مترجم',
    category: 'Language',
    description: 'Instant translation across 10 Pakistani regional languages with romanization and audio.',
    icon: <Languages className="w-5 h-5 text-emerald-400" />,
  },
  {
    id: 'voice-assistant',
    name: 'Voice Assistant',
    nameUrdu: 'صوتی معاون',
    category: 'Language',
    description: 'Hands-free conversational voice assistant with speech recognition and natural pronunciation.',
    icon: <Mic className="w-5 h-5 text-emerald-400" />,
  },
  {
    id: 'sign-language',
    name: 'Sign Language (PSL)',
    nameUrdu: 'پاکستان اشاروں کی زبان',
    category: 'Language',
    description: 'Pakistan Sign Language gesture dictionary, fingerspelling animations, and learning exercises.',
    icon: <HandHelping className="w-5 h-5 text-emerald-400" />,
  },
  // Civic & Legal
  {
    id: 'government',
    name: 'Government Services',
    nameUrdu: 'سرکاری رہنمائی و نادرا',
    category: 'Civic & Legal',
    description: 'Step-by-step verified procedures for NADRA CNIC, Passports, BISP 8171, and tax filing.',
    icon: <Building2 className="w-5 h-5 text-emerald-400" />,
  },
  {
    id: 'legal',
    name: 'Legal Assistant',
    nameUrdu: 'قانونی آگاہی و حقوق',
    category: 'Civic & Legal',
    description: 'Clear legal awareness regarding tenant agreements, labor laws, inheritance, and rights.',
    icon: <Scale className="w-5 h-5 text-emerald-400" />,
  },
  // Health & Agriculture
  {
    id: 'medical',
    name: 'Medical Assistant',
    nameUrdu: 'صحت و طبی معاونت',
    category: 'Health & Agriculture',
    description: 'First-aid triage, heatstroke care, preventive guidance, and local emergency hotlines.',
    icon: <HeartPulse className="w-5 h-5 text-emerald-400" />,
  },
  {
    id: 'farmer',
    name: 'Farmer AI (Kissan)',
    nameUrdu: 'کسان اے آئی',
    category: 'Health & Agriculture',
    description: 'Crop pest identification, organic remedies, mandi price checks, and weather alerts.',
    icon: <Sprout className="w-5 h-5 text-emerald-400" />,
  },
  // Education & Media
  {
    id: 'teacher',
    name: 'AI Teacher',
    nameUrdu: 'تعلیمی استاد',
    category: 'Education & Media',
    description: 'Interactive STEM tutoring for Matric and Intermediate with quizzes and simple explanations.',
    icon: <GraduationCap className="w-5 h-5 text-emerald-400" />,
  },
  {
    id: 'fake-news',
    name: 'Fact Checker',
    nameUrdu: 'حقائق تفتیش',
    category: 'Education & Media',
    description: 'Verify viral social media news, WhatsApp claims, and government circulars.',
    icon: <ShieldAlert className="w-5 h-5 text-emerald-400" />,
  },
];

const CATEGORIES = [
  'All',
  'Language',
  'Civic & Legal',
  'Health & Agriculture',
  'Education & Media',
] as const;

export const ToolsPage: React.FC<ToolsPageProps> = ({ onSelectPage }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const { t, isRTL } = useLanguage();

  const filteredTools = TOOLS.filter((tool) => {
    const matchesCategory =
      selectedCategory === 'All' || tool.category === selectedCategory;
    const matchesSearch =
      searchQuery === '' ||
      tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.nameUrdu.includes(searchQuery);
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)] mb-2">
          {t('tools.title')}
        </h1>
        <p className="text-[var(--text-muted)] text-sm sm:text-base">
          {t('tools.subtitle')}
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-[var(--border)]">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 custom-scrollbar">
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all duration-150 cursor-pointer active:scale-95 ${
                  isActive
                    ? 'bg-[var(--accent)] text-white font-semibold shadow-xs'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] bg-[var(--surface-secondary)] border border-[var(--border)]'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64 shrink-0">
          <Search className={`w-4 h-4 text-[var(--text-muted)] absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 pointer-events-none`} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tools..."
            className={`w-full ${isRTL ? 'pr-9 pl-3 text-right' : 'pl-9 pr-3 text-left'} py-1.5 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15 transition-all`}
          />
        </div>
      </div>

      {/* Tool Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTools.map((tool) => (
          <motion.div
            key={tool.id}
            whileHover={{ y: -3 }}
            onClick={() => onSelectPage(tool.id)}
            className="group relative bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--accent)] rounded-2xl p-5 flex flex-col justify-between transition-all duration-150 hover:bg-[var(--surface-hover)] cursor-pointer shadow-xs hover:shadow-md active:scale-98"
          >
            <div>
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] text-[var(--accent)] flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
                  {tool.icon}
                </div>
                <span className="text-[11px] font-medium text-[var(--text-secondary)] bg-[var(--surface-secondary)] px-2.5 py-0.5 rounded-full border border-[var(--border)]">
                  {tool.category}
                </span>
              </div>

              <div className="flex items-baseline gap-2 mb-1.5">
                <h3 className="text-base font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">
                  {tool.name}
                </h3>
                <span className="text-xs text-[var(--text-muted)] font-urdu font-medium" dir="rtl">
                  {tool.nameUrdu}
                </span>
              </div>

              <p className="text-xs text-[var(--text-muted)] leading-relaxed line-clamp-2">
                {tool.description}
              </p>
            </div>

            <div className="mt-5 pt-3 border-t border-[var(--border)] flex items-center justify-between">
              <span className="text-xs font-medium text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-colors">
                Open workspace
              </span>
              <div className="w-6 h-6 rounded-lg bg-[var(--surface-secondary)] group-hover:bg-[var(--accent)] group-hover:text-white text-[var(--text-muted)] flex items-center justify-center transition-all">
                <ArrowRight className={`w-3.5 h-3.5 ${isRTL ? 'rotate-180' : ''}`} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredTools.length === 0 && (
        <div className="text-center py-16">
          <p className="text-sm text-[var(--text-muted)]">No tools found matching your query.</p>
          <button
            onClick={() => {
              setSelectedCategory('All');
              setSearchQuery('');
            }}
            className="mt-3 text-xs text-[var(--accent)] hover:underline cursor-pointer"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
};
