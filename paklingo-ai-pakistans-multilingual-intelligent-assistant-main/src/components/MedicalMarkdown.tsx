import React from 'react';
import { AlertOctagon, AlertTriangle, ShieldCheck, Info } from 'lucide-react';

interface MedicalMarkdownProps {
  content: string;
  className?: string;
}

// Inline parser for bold, italic, code, and emphasis
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

export const MedicalMarkdown: React.FC<MedicalMarkdownProps> = ({ content, className = '' }) => {
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
            className="my-2 space-y-1.5 list-decimal list-inside pl-1 text-[var(--text-secondary)] text-xs sm:text-sm font-medium"
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

  lines.forEach((line, lineIdx) => {
    const trimmed = line.trim();

    if (!trimmed) {
      flushList();
      elements.push(<div key={`spacer-${lineIdx}`} className="h-1.5" />);
      return;
    }

    const lower = trimmed.toLowerCase();

    // 1. Critical Emergency Alert Banner
    if (
      lower.includes('urgent emergency alert') ||
      lower.includes('emergency alert') ||
      lower.startsWith('🚨') ||
      lower.includes('immediate emergency attention')
    ) {
      flushList();
      elements.push(
        <div
          key={`emergency-${lineIdx}`}
          className="my-3 p-4 rounded-xl bg-rose-500/10 border-2 border-rose-500 text-rose-600 dark:text-rose-300 text-xs sm:text-sm shadow-2xs space-y-1.5 animate-pulse"
        >
          <div className="flex items-center gap-2 font-black text-rose-700 dark:text-rose-200 text-sm sm:text-base">
            <AlertOctagon className="w-5 h-5 text-rose-500 shrink-0" />
            <span>{renderInlineText(trimmed.replace(/^🚨\s*/, ''))}</span>
          </div>
        </div>
      );
      return;
    }

    // 2. Red Flags or Warning Callouts
    if (
      lower.startsWith('warning:') ||
      lower.startsWith('red flag:') ||
      lower.startsWith('red flags:') ||
      lower.startsWith('caution:') ||
      lower.startsWith('strict warning:') ||
      lower.startsWith('when to see a doctor:')
    ) {
      flushList();
      elements.push(
        <div
          key={`warning-${lineIdx}`}
          className="my-2 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs sm:text-sm leading-relaxed space-y-1"
        >
          <div className="flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-200">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
            <span>{renderInlineText(trimmed)}</span>
          </div>
        </div>
      );
      return;
    }

    // 3. Mandatory Educational Disclaimer / Notice Callout
    if (
      lower.startsWith('notice:') ||
      lower.startsWith('disclaimer:') ||
      lower.includes('educational information — not a diagnosis') ||
      lower.includes('not a substitute for a qualified')
    ) {
      flushList();
      elements.push(
        <div
          key={`disclaimer-${lineIdx}`}
          className="my-2.5 p-3 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-[11px] sm:text-xs leading-relaxed flex items-start gap-2"
        >
          <ShieldCheck className="w-4 h-4 text-[var(--text-muted)] shrink-0 mt-0.5" />
          <div className="font-medium text-[var(--text-primary)]">
            {renderInlineText(trimmed)}
          </div>
        </div>
      );
      return;
    }

    // 4. Markdown Headers
    if (trimmed.startsWith('### ')) {
      flushList();
      elements.push(
        <h4
          key={`h4-${lineIdx}`}
          className="font-bold text-sm sm:text-base text-[var(--text-primary)] mt-3.5 mb-1.5 flex items-center gap-1.5 border-b border-[var(--border)] pb-1"
        >
          {renderInlineText(trimmed.slice(4))}
        </h4>
      );
      return;
    }

    if (trimmed.startsWith('## ')) {
      flushList();
      elements.push(
        <h3
          key={`h3-${lineIdx}`}
          className="font-extrabold text-base sm:text-lg text-[var(--text-primary)] mt-4 mb-2 flex items-center gap-2"
        >
          {renderInlineText(trimmed.slice(3))}
        </h3>
      );
      return;
    }

    if (trimmed.startsWith('# ')) {
      flushList();
      elements.push(
        <h2
          key={`h2-${lineIdx}`}
          className="font-black text-lg sm:text-xl text-[var(--text-primary)] mt-4 mb-2"
        >
          {renderInlineText(trimmed.slice(2))}
        </h2>
      );
      return;
    }

    // 5. Unordered list item (- , * , •)
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('• ')) {
      const itemText = trimmed.replace(/^[-*•]\s+/, '');
      if (currentList && currentList.type === 'ul') {
        currentList.items.push(itemText);
      } else {
        flushList();
        currentList = { type: 'ul', items: [itemText] };
      }
      return;
    }

    // 6. Ordered list item (1. , 2. , etc.)
    const orderedMatch = trimmed.match(/^(\d+)[.)]\s+(.*)/);
    if (orderedMatch) {
      const itemText = orderedMatch[2];
      if (currentList && currentList.type === 'ol') {
        currentList.items.push(itemText);
      } else {
        flushList();
        currentList = { type: 'ol', items: [itemText] };
      }
      return;
    }

    // 7. Regular paragraph
    flushList();
    elements.push(
      <p key={`p-${lineIdx}`} className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
        {renderInlineText(trimmed)}
      </p>
    );
  });

  flushList();

  return <div className={`space-y-1 text-[var(--text-secondary)] ${className}`}>{elements}</div>;
};
