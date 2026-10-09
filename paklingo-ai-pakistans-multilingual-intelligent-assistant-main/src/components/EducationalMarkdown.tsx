import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Check,
  Copy,
  Code as CodeIcon,
  Lightbulb,
  AlertTriangle,
  BookOpen,
  Target,
  FileText,
  Brain,
  Sparkles,
  Laptop,
} from 'lucide-react';

interface EducationalMarkdownProps {
  content: string;
  className?: string;
  subjectIcon?: string;
  mode?: 'full' | 'compact' | 'inline';
}

// Preprocessor to clean raw markdown artifacts before parsing
export function sanitizeAndFormatMarkdown(text: string): string {
  if (!text) return '';

  let cleaned = text;

  // 1. Remove escaped markdown characters (\* -> *, \# -> #, \_ -> _, \` -> `)
  cleaned = cleaned.replace(/\\([*#_`~[\]()<>])/g, '$1');

  // 2. Strip unintentional 2 to 4 space leading indents outside fenced code blocks
  // (Prevents CommonMark from mistakenly rendering text as raw indented monospace code)
  cleaned = cleaned.replace(/^( {2,4})(?=[#*+-\d\w])/gm, '');

  // 3. Fix missing space after hashes (e.g., "###Concept" -> "### Concept")
  cleaned = cleaned.replace(/^(#{1,6})([^\s#])/gm, '$1 $2');

  // 4. Ensure headings have clean line breaks before and after
  cleaned = cleaned.replace(/([^\n])\n*(#{1,6}\s+[^\n]+)/g, '$1\n\n$2\n\n');

  // 5. Fix bold property labels ending in colon on their own line (e.g., "**Properties:**")
  cleaned = cleaned.replace(/([^\n])\n+(\*\*[^*]+:\*\*)/g, '$1\n\n$2\n\n');

  // 6. Fix list items so they have proper linebreaks and no merged text
  // Convert bullet symbols like • ● ▪ to standard markdown -
  cleaned = cleaned.replace(/^[ \t]*[•●▪]\s*/gm, '- ');

  // If a bullet item follows regular text directly without blank line, add blank line
  cleaned = cleaned.replace(/([^\n])\n([*+-]\s+)/g, '$1\n\n$2');

  // 7. Ensure horizontal rules have blank lines
  cleaned = cleaned.replace(/([^\n])\n(-{3,}|\*{3,})\n/g, '$1\n\n$2\n\n');

  // 8. Ensure code fences have clean newlines
  cleaned = cleaned.replace(/([^\n])```/g, '$1\n```');

  // 9. Clean HTML non-standard tags
  cleaned = cleaned.replace(/<\/?(font|center|marquee)[^>]*>/gi, '');

  return cleaned.trim();
}

// Code Block with Language Badge, Monospace Syntax Styling, and Copy Button
const CodeBlock: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => {
  const [copied, setCopied] = useState(false);

  const codeString = React.Children.toArray(children)
    .map((child) => (typeof child === 'string' ? child : ''))
    .join('');

  const match = /language-(\w+)/.exec(className || '');
  const language = match ? match[1].toUpperCase() : 'CODE';

  const handleCopy = () => {
    if (!codeString) return;
    navigator.clipboard.writeText(codeString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-3.5 rounded-xl border border-[var(--border)] bg-[#0d1117] text-neutral-100 overflow-hidden shadow-xs">
      <div className="flex items-center justify-between px-3.5 py-2 bg-[#161b22] border-b border-neutral-800 text-[11px] font-mono">
        <div className="flex items-center gap-1.5 text-neutral-400">
          <CodeIcon className="w-3.5 h-3.5 text-sky-400" />
          <span className="font-semibold text-neutral-300">{language}</span>
        </div>
        <button
          onClick={handleCopy}
          type="button"
          className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors cursor-pointer border border-neutral-700"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400 font-medium">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3 text-neutral-400" />
              <span>Copy Code</span>
            </>
          )}
        </button>
      </div>

      <div className="p-3.5 overflow-x-auto font-mono text-xs sm:text-[13px] leading-relaxed text-emerald-300/90 selection:bg-emerald-900 selection:text-white">
        <code>{children}</code>
      </div>
    </div>
  );
};

// Section structure for visual card breakdown
interface EducationalSection {
  id: string;
  type: 'concept' | 'easy_idea' | 'how_it_works' | 'example' | 'key_points' | 'exam_tip' | 'common_mistake' | 'general';
  title: string;
  body: string;
}

function parseEducationalSections(markdown: string): EducationalSection[] {
  // Check if content has section headings
  if (!/(?:^|\n)#{2,3}\s+/.test(markdown)) {
    return [{ id: 'main', type: 'general', title: '', body: markdown }];
  }

  const lines = markdown.split('\n');
  const sections: EducationalSection[] = [];
  let currentSection: EducationalSection | null = null;
  let introLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const headingMatch = line.match(/^#{2,3}\s+(.+)$/);

    if (headingMatch) {
      if (currentSection) {
        currentSection.body = currentSection.body.trim();
        sections.push(currentSection);
      } else if (introLines.length > 0 && introLines.join('').trim()) {
        sections.push({
          id: 'intro',
          type: 'general',
          title: '',
          body: introLines.join('\n').trim(),
        });
      }

      const rawTitle = headingMatch[1].trim();
      const lower = rawTitle.toLowerCase();

      let type: EducationalSection['type'] = 'general';
      if (lower.includes('concept')) type = 'concept';
      else if (lower.includes('easy idea') || lower.includes('simple words') || lower.includes('intuition')) type = 'easy_idea';
      else if (lower.includes('how it works') || lower.includes('mechanics') || lower.includes('step-by-step')) type = 'how_it_works';
      else if (lower.includes('example') || lower.includes('real-life') || lower.includes('real life') || lower.includes('in action')) type = 'example';
      else if (lower.includes('key point') || lower.includes('takeaway') || lower.includes('summary')) type = 'key_points';
      else if (lower.includes('exam tip') || lower.includes('board exam') || lower.includes('fbise') || lower.includes('bise')) type = 'exam_tip';
      else if (lower.includes('common mistake') || lower.includes('misconception') || lower.includes('pitfall') || lower.includes('warning')) type = 'common_mistake';

      // Clean title: remove any leftover markdown tokens or number prefixes
      const cleanTitle = rawTitle
        .replace(/^[\d.]+\s*/, '')
        .replace(/[*_#]/g, '')
        .trim();

      currentSection = {
        id: `sec-${sections.length}-${type}`,
        type,
        title: cleanTitle,
        body: '',
      };
    } else {
      if (currentSection) {
        currentSection.body += line + '\n';
      } else {
        introLines.push(line);
      }
    }
  }

  if (currentSection) {
    currentSection.body = currentSection.body.trim();
    sections.push(currentSection);
  }

  if (sections.length === 0) {
    return [{ id: 'main', type: 'general', title: '', body: markdown }];
  }

  return sections;
}

// Markdown renderer for a single block of content with sanitization
const RenderMarkdownBlock: React.FC<{ content: string; className?: string }> = ({ content, className = '' }) => {
  const sanitized = sanitizeAndFormatMarkdown(content);

  return (
    <div className={`educational-markdown text-[var(--text-secondary)] text-xs sm:text-sm leading-relaxed ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-base sm:text-lg font-bold text-[var(--text-primary)] mt-4 mb-2 pb-1 border-b border-[var(--border)]">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-sm sm:text-base font-bold text-[var(--text-primary)] mt-3 mb-1.5">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-xs sm:text-sm font-semibold text-[var(--text-primary)] mt-2.5 mb-1">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-xs font-semibold text-[var(--text-primary)] mt-2 mb-1">
              {children}
            </h4>
          ),
          p: ({ children }) => {
            return (
              <p className="mb-2.5 text-[var(--text-secondary)] leading-relaxed last:mb-0">
                {children}
              </p>
            );
          },
          strong: ({ children }) => (
            <strong className="font-semibold text-[var(--text-primary)]">
              {children}
            </strong>
          ),
          em: ({ children }) => (
            <em className="italic text-[var(--text-secondary)]">
              {children}
            </em>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-outside pl-4 space-y-1.5 my-2.5 text-[var(--text-secondary)] marker:text-[var(--accent)]">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-outside pl-4 space-y-1.5 my-2.5 text-[var(--text-secondary)] marker:font-semibold marker:text-[var(--accent)]">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="leading-relaxed pl-1 text-xs sm:text-sm">
              {children}
            </li>
          ),
          blockquote: ({ children }) => (
            <blockquote className="my-3 pl-3.5 py-1.5 border-l-2 border-[var(--accent)] bg-[var(--surface-secondary)]/50 rounded-r-lg text-xs italic text-[var(--text-secondary)]">
              {children}
            </blockquote>
          ),
          hr: () => <hr className="my-3 border-[var(--border)]" />,
          table: ({ children }) => (
            <div className="my-3 overflow-x-auto rounded-xl border border-[var(--border)] shadow-xs">
              <table className="w-full text-left border-collapse text-xs">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-[var(--surface-secondary)] border-b border-[var(--border)] font-semibold text-[var(--text-primary)]">
              {children}
            </thead>
          ),
          tbody: ({ children }) => (
            <tbody className="divide-y divide-[var(--border)]">
              {children}
            </tbody>
          ),
          tr: ({ children }) => (
            <tr className="hover:bg-[var(--surface-hover)] transition-colors">
              {children}
            </tr>
          ),
          th: ({ children }) => (
            <th className="p-2.5 text-[11px] uppercase tracking-wider font-semibold">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="p-2.5 text-[var(--text-secondary)]">
              {children}
            </td>
          ),
          code: ({ className: codeClassName, children, ...props }) => {
            const isInline = !codeClassName && typeof children === 'string' && !children.includes('\n');
            if (isInline) {
              return (
                <code
                  className="px-1.5 py-0.5 rounded bg-[var(--surface-secondary)] border border-[var(--border)] text-[var(--text-primary)] font-mono text-[11px] sm:text-xs"
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return <CodeBlock className={codeClassName}>{children}</CodeBlock>;
          },
          pre: ({ children }) => <>{children}</>,
        }}
      >
        {sanitized}
      </ReactMarkdown>
    </div>
  );
};

export const EducationalMarkdown: React.FC<EducationalMarkdownProps> = ({
  content,
  className = '',
  subjectIcon = '📚',
  mode = 'full',
}) => {
  if (!content) return null;

  // In inline or compact mode (e.g. inside quiz explanation or flashcards), render directly
  if (mode === 'inline' || mode === 'compact') {
    return <RenderMarkdownBlock content={content} className={className} />;
  }

  // Parse structured educational sections
  const sections = parseEducationalSections(content);

  // If there's only one general section, render it cleanly
  if (sections.length === 1 && sections[0].type === 'general' && !sections[0].title) {
    return (
      <div className={`p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-xs ${className}`}>
        <RenderMarkdownBlock content={sections[0].body} />
      </div>
    );
  }

  return (
    <div className={`space-y-3.5 ${className}`}>
      {sections.map((section) => {
        switch (section.type) {
          case 'concept':
            return (
              <div
                key={section.id}
                className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-xs space-y-2.5"
              >
                <div className="flex items-center gap-2 pb-2 border-b border-[var(--border)]">
                  <div className="w-7 h-7 rounded-lg bg-[var(--surface-secondary)] border border-[var(--border)] flex items-center justify-center text-[var(--accent)] shrink-0">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent)] block">
                      Core Concept
                    </span>
                    <h3 className="text-xs sm:text-sm font-bold text-[var(--text-primary)]">
                      {section.title || 'Concept Overview'}
                    </h3>
                  </div>
                </div>
                <RenderMarkdownBlock content={section.body} />
              </div>
            );

          case 'easy_idea':
            return (
              <div
                key={section.id}
                className="p-4 rounded-xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/30 shadow-xs space-y-2.5"
              >
                <div className="flex items-center gap-2 pb-2 border-b border-amber-500/20">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                    <Lightbulb className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 block">
                      Easy Idea (Simple Intuition)
                    </span>
                    <h3 className="text-xs sm:text-sm font-bold text-[var(--text-primary)]">
                      {section.title || 'In Plain Words'}
                    </h3>
                  </div>
                </div>
                <RenderMarkdownBlock content={section.body} />
              </div>
            );

          case 'how_it_works':
            return (
              <div
                key={section.id}
                className="p-4 rounded-xl bg-sky-500/5 dark:bg-sky-500/10 border border-sky-500/30 shadow-xs space-y-2.5"
              >
                <div className="flex items-center gap-2 pb-2 border-b border-sky-500/20">
                  <div className="w-7 h-7 rounded-lg bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-600 dark:text-sky-400 shrink-0">
                    <Brain className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400 block">
                      Step-by-Step Mechanics
                    </span>
                    <h3 className="text-xs sm:text-sm font-bold text-[var(--text-primary)]">
                      {section.title || 'How It Works'}
                    </h3>
                  </div>
                </div>
                <RenderMarkdownBlock content={section.body} />
              </div>
            );

          case 'example':
            return (
              <div
                key={section.id}
                className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-xs space-y-2.5"
              >
                <div className="flex items-center gap-2 pb-2 border-b border-[var(--border)]">
                  <div className="w-7 h-7 rounded-lg bg-[var(--surface-secondary)] border border-[var(--border)] flex items-center justify-center text-emerald-600 dark:text-emerald-400 text-sm shrink-0">
                    {subjectIcon || <Laptop className="w-4 h-4" />}
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
                      Real-Life Example
                    </span>
                    <h3 className="text-xs sm:text-sm font-bold text-[var(--text-primary)]">
                      {section.title || 'Practical Application'}
                    </h3>
                  </div>
                </div>
                <RenderMarkdownBlock content={section.body} />
              </div>
            );

          case 'key_points':
            return (
              <div
                key={section.id}
                className="p-4 rounded-xl bg-teal-500/5 dark:bg-teal-500/10 border border-teal-500/30 shadow-xs space-y-2.5"
              >
                <div className="flex items-center gap-2 pb-2 border-b border-teal-500/20">
                  <div className="w-7 h-7 rounded-lg bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-600 dark:text-teal-400 shrink-0">
                    <Target className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 block">
                      Key Takeaways
                    </span>
                    <h3 className="text-xs sm:text-sm font-bold text-[var(--text-primary)]">
                      {section.title || 'Essential Points'}
                    </h3>
                  </div>
                </div>
                <RenderMarkdownBlock content={section.body} />
              </div>
            );

          case 'exam_tip':
            return (
              <div
                key={section.id}
                className="p-4 rounded-xl bg-indigo-500/5 dark:bg-indigo-500/10 border border-indigo-500/30 shadow-xs space-y-2.5"
              >
                <div className="flex items-center gap-2 pb-2 border-b border-indigo-500/20">
                  <div className="w-7 h-7 rounded-lg bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block">
                        Board Exam Tip (FBISE / BISE)
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 font-semibold uppercase">
                        High Yield
                      </span>
                    </div>
                    <h3 className="text-xs sm:text-sm font-bold text-[var(--text-primary)]">
                      {section.title || 'Exam Preparation Advice'}
                    </h3>
                  </div>
                </div>
                <RenderMarkdownBlock content={section.body} />
              </div>
            );

          case 'common_mistake':
            return (
              <div
                key={section.id}
                className="p-4 rounded-xl bg-rose-500/5 dark:bg-rose-500/10 border border-rose-500/30 shadow-xs space-y-2.5"
              >
                <div className="flex items-center gap-2 pb-2 border-b border-rose-500/20">
                  <div className="w-7 h-7 rounded-lg bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 block">
                      Common Mistake to Avoid
                    </span>
                    <h3 className="text-xs sm:text-sm font-bold text-[var(--text-primary)]">
                      {section.title || 'Watch Out'}
                    </h3>
                  </div>
                </div>
                <RenderMarkdownBlock content={section.body} />
              </div>
            );

          default:
            return (
              <div
                key={section.id}
                className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-xs space-y-2"
              >
                {section.title && (
                  <div className="flex items-center gap-2 pb-2 border-b border-[var(--border)]">
                    <Sparkles className="w-4 h-4 text-[var(--accent)] shrink-0" />
                    <h3 className="text-xs sm:text-sm font-bold text-[var(--text-primary)]">
                      {section.title}
                    </h3>
                  </div>
                )}
                <RenderMarkdownBlock content={section.body} />
              </div>
            );
        }
      })}
    </div>
  );
};
