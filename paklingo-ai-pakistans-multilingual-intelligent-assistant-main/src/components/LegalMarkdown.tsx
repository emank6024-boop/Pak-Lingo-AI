import React from 'react';
import { ShieldAlert, AlertTriangle, Scale, BookOpen, CheckCircle2 } from 'lucide-react';

interface LegalMarkdownProps {
  content: string;
  className?: string;
}

// Inline parser for bold, italic, code, and statutory citations
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

export const LegalMarkdown: React.FC<LegalMarkdownProps> = ({ content, className = '' }) => {
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
            className="my-2.5 space-y-1.5 list-disc list-inside pl-1 text-[var(--text-secondary)] text-xs sm:text-sm"
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
            className="my-2.5 space-y-1.5 list-decimal list-inside pl-1 text-[var(--text-secondary)] text-xs sm:text-sm"
          >
            {currentList.items.map((item, idx) => (
              <li key={idx} className="leading-relaxed font-medium">
                {renderInlineText(item)}
              </li>
            ))}
          </ol>
        );
      }
      currentList = null;
    }
  };

  lines.forEach((rawLine, lineIndex) => {
    const trimmed = rawLine.trim();

    // Empty line
    if (!trimmed) {
      flushList();
      return;
    }

    // Unordered List Items
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const itemText = trimmed.slice(2).trim();
      if (!currentList || currentList.type !== 'ul') {
        flushList();
        currentList = { type: 'ul', items: [itemText] };
      } else {
        currentList.items.push(itemText);
      }
      return;
    }

    // Ordered List Items (e.g. 1. 2.)
    const olMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
    if (olMatch) {
      const itemText = olMatch[2].trim();
      if (!currentList || currentList.type !== 'ol') {
        flushList();
        currentList = { type: 'ol', items: [itemText] };
      } else {
        currentList.items.push(itemText);
      }
      return;
    }

    // If we reach here, flush any pending list
    flushList();

    // H1 Heading (# Heading)
    if (trimmed.startsWith('# ')) {
      elements.push(
        <h2
          key={`h1-${lineIndex}`}
          className="text-base sm:text-lg font-extrabold text-[var(--text-primary)] mt-4 mb-2 flex items-center gap-2 border-b border-[var(--border)] pb-1.5"
        >
          <Scale className="w-5 h-5 text-[var(--accent)] shrink-0" />
          <span>{trimmed.slice(2).trim()}</span>
        </h2>
      );
      return;
    }

    // H2 Heading (## Heading)
    if (trimmed.startsWith('## ')) {
      elements.push(
        <h3
          key={`h2-${lineIndex}`}
          className="text-sm sm:text-base font-bold text-[var(--text-primary)] mt-3.5 mb-1.5 flex items-center gap-2"
        >
          <BookOpen className="w-4 h-4 text-[var(--accent)] shrink-0" />
          <span>{trimmed.slice(3).trim()}</span>
        </h3>
      );
      return;
    }

    // H3 Heading (### Heading)
    if (trimmed.startsWith('### ')) {
      elements.push(
        <h4
          key={`h3-${lineIndex}`}
          className="text-xs sm:text-sm font-bold text-[var(--text-primary)] mt-3 mb-1.5 uppercase tracking-wide flex items-center gap-1.5"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] shrink-0" />
          <span>{trimmed.slice(4).trim()}</span>
        </h4>
      );
      return;
    }

    // Disclaimer or Notice Blockquote (> Notice: ...)
    if (trimmed.startsWith('>')) {
      const quoteText = trimmed.replace(/^>\s*/, '');
      const isUrgent =
        quoteText.toLowerCase().includes('disclaimer') ||
        quoteText.toLowerCase().includes('notice') ||
        quoteText.toLowerCase().includes('warning') ||
        quoteText.toLowerCase().includes('lawyer') ||
        quoteText.toLowerCase().includes('advocate') ||
        quoteText.toLowerCase().includes('ex-parte');

      elements.push(
        <div
          key={`quote-${lineIndex}`}
          className={`my-3 p-3.5 rounded-xl border text-xs sm:text-sm flex items-start gap-2.5 ${
            isUrgent
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300'
              : 'bg-[var(--surface-secondary)] border-[var(--border)] text-[var(--text-secondary)]'
          }`}
        >
          {isUrgent ? (
            <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-[var(--accent)] shrink-0 mt-0.5" />
          )}
          <div className="space-y-0.5 leading-relaxed font-medium">
            {renderInlineText(quoteText)}
          </div>
        </div>
      );
      return;
    }

    // Standard Paragraph
    elements.push(
      <p
        key={`p-${lineIndex}`}
        className="my-1.5 text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed"
      >
        {renderInlineText(trimmed)}
      </p>
    );
  });

  flushList();

  return <div className={`space-y-1 font-sans text-[var(--text-secondary)] ${className}`}>{elements}</div>;
};
