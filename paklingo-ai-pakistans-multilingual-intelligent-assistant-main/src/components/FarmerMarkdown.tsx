import React from 'react';
import { AlertTriangle, ShieldAlert, CheckCircle2, Sprout, Info } from 'lucide-react';

interface FarmerMarkdownProps {
  content: string;
  className?: string;
}

// Inline parser for bold, italic, code, and technical agricultural terms
function renderInlineText(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      return (
        <strong key={idx} className="font-bold text-[var(--text-primary)]">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length >= 2 && !part.startsWith('**')) {
      return (
        <em key={idx} className="italic text-[var(--text-secondary)]">
          {part.slice(1, -1)}
        </em>
      );
    }
    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      return (
        <code
          key={idx}
          className="px-1.5 py-0.5 rounded bg-[var(--surface-secondary)] text-[var(--accent)] font-mono text-xs font-semibold border border-[var(--border)]"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

export const FarmerMarkdown: React.FC<FarmerMarkdownProps> = ({ content, className = '' }) => {
  if (!content) return null;

  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let currentList: { type: 'ul' | 'ol'; items: string[] } | null = null;

  const flushList = () => {
    if (currentList) {
      if (currentList.type === 'ul') {
        elements.push(
          <ul
            key={`list-${elements.length}`}
            className="my-2 space-y-1.5 list-disc list-inside pl-1 text-[var(--text-secondary)] text-xs sm:text-sm"
          >
            {currentList.items.map((item, idx) => (
              <li key={idx} className="leading-relaxed">
                {renderInlineText(item)}
              </li>
            ))}
          </ul>
        );
      } else {
        elements.push(
          <ol
            key={`list-${elements.length}`}
            className="my-2 space-y-1.5 list-decimal list-inside pl-1 text-[var(--text-secondary)] text-xs sm:text-sm"
          >
            {currentList.items.map((item, idx) => (
              <li key={idx} className="leading-relaxed">
                {renderInlineText(item)}
              </li>
            ))}
          </ol>
        );
      }
      currentList = null;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    if (!line) {
      flushList();
      continue;
    }

    // Safety Alert Box / Disclaimers
    if (
      line.startsWith('> [!CAUTION]') ||
      line.startsWith('> [!WARNING]') ||
      line.startsWith('> **Warning:**') ||
      line.startsWith('> **Caution:**') ||
      line.startsWith('> **Important:**') ||
      line.toLowerCase().includes('consult a qualified agricultural expert') ||
      line.toLowerCase().includes('محکمہ زراعت توسیع') ||
      line.toLowerCase().includes('safety note:')
    ) {
      flushList();
      const cleanText = line
        .replace(/^>\s*\[!(CAUTION|WARNING|IMPORTANT|NOTE)\]/i, '')
        .replace(/^>\s*/, '')
        .trim();

      elements.push(
        <div
          key={`alert-${elements.length}`}
          className="my-3 p-3.5 rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300 flex items-start gap-2.5 shadow-2xs"
        >
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm font-medium leading-relaxed">
            {renderInlineText(cleanText)}
          </div>
        </div>
      );
      continue;
    }

    // Official Notice / Advisory Notice Box
    if (
      line.startsWith('> Notice:') ||
      line.startsWith('> Note:') ||
      line.startsWith('> **Notice:**') ||
      line.startsWith('> تنبیہ:') ||
      line.startsWith('> ضروری نوٹ:')
    ) {
      flushList();
      const cleanText = line.replace(/^>\s*/, '').trim();
      elements.push(
        <div
          key={`notice-${elements.length}`}
          className="my-3 p-3 rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 flex items-start gap-2.5"
        >
          <Sprout className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
          <div className="text-xs text-emerald-800 dark:text-emerald-200 leading-relaxed font-medium">
            {renderInlineText(cleanText)}
          </div>
        </div>
      );
      continue;
    }

    // General Blockquote
    if (line.startsWith('>')) {
      flushList();
      const cleanText = line.replace(/^>\s*/, '').trim();
      elements.push(
        <blockquote
          key={`quote-${elements.length}`}
          className="my-2 pl-3 border-l-4 border-[var(--accent)] text-[var(--text-secondary)] italic text-xs sm:text-sm py-1 bg-[var(--surface-secondary)] rounded-r-lg"
        >
          {renderInlineText(cleanText)}
        </blockquote>
      );
      continue;
    }

    // Headings
    if (line.startsWith('### ')) {
      flushList();
      elements.push(
        <h4
          key={`h4-${elements.length}`}
          className="mt-3.5 mb-1.5 text-sm font-bold text-[var(--text-primary)] flex items-center gap-1.5"
        >
          <span className="w-1.5 h-3.5 bg-[var(--accent)] rounded-full inline-block"></span>
          {renderInlineText(line.slice(4))}
        </h4>
      );
      continue;
    }

    if (line.startsWith('## ')) {
      flushList();
      elements.push(
        <h3
          key={`h3-${elements.length}`}
          className="mt-4 mb-2 text-base font-bold text-[var(--text-primary)] border-b border-[var(--border)] pb-1 flex items-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4 text-[var(--accent)]" />
          {renderInlineText(line.slice(3))}
        </h3>
      );
      continue;
    }

    if (line.startsWith('# ')) {
      flushList();
      elements.push(
        <h2
          key={`h2-${elements.length}`}
          className="mt-4 mb-2 text-lg font-extrabold text-[var(--text-primary)] flex items-center gap-2"
        >
          <Sprout className="w-5 h-5 text-[var(--accent)]" />
          {renderInlineText(line.slice(2))}
        </h2>
      );
      continue;
    }

    // Unordered List Items (- or *)
    const ulMatch = line.match(/^[-*]\s+(.*)$/);
    if (ulMatch) {
      if (!currentList || currentList.type !== 'ul') {
        flushList();
        currentList = { type: 'ul', items: [] };
      }
      currentList.items.push(ulMatch[1]);
      continue;
    }

    // Ordered List Items (1. 2.)
    const olMatch = line.match(/^\d+\.\s+(.*)$/);
    if (olMatch) {
      if (!currentList || currentList.type !== 'ol') {
        flushList();
        currentList = { type: 'ol', items: [] };
      }
      currentList.items.push(olMatch[1]);
      continue;
    }

    // Regular Paragraph
    flushList();
    elements.push(
      <p key={`p-${elements.length}`} className="my-1.5 text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
        {renderInlineText(line)}
      </p>
    );
  }

  flushList();

  return <div className={`farmer-markdown space-y-1 text-[var(--text-secondary)] ${className}`}>{elements}</div>;
};
