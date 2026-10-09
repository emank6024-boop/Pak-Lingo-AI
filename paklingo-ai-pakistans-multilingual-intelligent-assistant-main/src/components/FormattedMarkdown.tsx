import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface FormattedMarkdownProps {
  content: string;
  className?: string;
}

/**
 * Cleanly renders markdown text into structured, accessible UI components.
 * Completely eliminates raw markdown characters (##, **, etc.) from display.
 */
export const FormattedMarkdown: React.FC<FormattedMarkdownProps> = ({ content, className = '' }) => {
  if (!content) return null;

  // Pre-process common anomalies like repeated asterisks or malformed headers
  const sanitizedContent = content
    .replace(/^####\s+/gm, '#### ')
    .replace(/^###\s+/gm, '### ')
    .replace(/^##\s+/gm, '## ')
    .replace(/^#\s+/gm, '# ');

  return (
    <div className={`formatted-markdown text-[var(--text-primary)] text-xs sm:text-sm leading-relaxed space-y-2.5 ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-base sm:text-lg font-bold text-[var(--text-primary)] mt-3 mb-1.5 pb-1 border-b border-[var(--border)]">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-sm sm:text-base font-bold text-[var(--text-primary)] mt-3 mb-1 flex items-center gap-1.5">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-xs sm:text-sm font-semibold text-[var(--text-primary)] mt-2.5 mb-1 text-[var(--accent)]">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-xs sm:text-sm font-semibold text-[var(--text-primary)] mt-2 mb-0.5">
              {children}
            </h4>
          ),
          p: ({ children }) => (
            <p className="leading-relaxed text-[var(--text-secondary)]">
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul className="my-1.5 space-y-1 list-disc list-outside pl-4 text-[var(--text-secondary)]">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="my-1.5 space-y-1 list-decimal list-outside pl-4 text-[var(--text-secondary)] font-medium">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="leading-relaxed">
              {children}
            </li>
          ),
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
          blockquote: ({ children }) => (
            <blockquote className="my-2 p-2.5 bg-[var(--surface-secondary)]/70 border-l-3 border-[var(--accent)] rounded-r-lg text-xs text-[var(--text-muted)] italic">
              {children}
            </blockquote>
          ),
          code: ({ children, className: codeClass }) => {
            const isBlock = codeClass && codeClass.includes('language-');
            if (isBlock) {
              return (
                <div className="my-2 rounded-lg bg-[var(--surface-secondary)] border border-[var(--border)] p-3 overflow-x-auto">
                  <pre className="font-mono text-xs text-[var(--text-primary)]">
                    <code>{children}</code>
                  </pre>
                </div>
              );
            }
            return (
              <code className="px-1.5 py-0.5 rounded bg-[var(--surface-secondary)] text-[var(--accent)] font-mono text-[11px] font-medium border border-[var(--border)]">
                {children}
              </code>
            );
          },
          table: ({ children }) => (
            <div className="my-2.5 overflow-x-auto rounded-lg border border-[var(--border)]">
              <table className="min-w-full divide-y divide-[var(--border)] text-left text-xs">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-[var(--surface-secondary)] text-[var(--text-primary)] font-semibold">
              {children}
            </thead>
          ),
          tbody: ({ children }) => (
            <tbody className="divide-y divide-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)]">
              {children}
            </tbody>
          ),
          tr: ({ children }) => (
            <tr className="hover:bg-[var(--surface-secondary)]/50 transition-colors">
              {children}
            </tr>
          ),
          th: ({ children }) => (
            <th className="px-3 py-2 text-xs font-semibold text-[var(--text-primary)]">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-3 py-2 text-xs text-[var(--text-secondary)]">
              {children}
            </td>
          ),
          hr: () => (
            <hr className="my-3 border-t border-[var(--border)]" />
          ),
        }}
      >
        {sanitizedContent}
      </ReactMarkdown>
    </div>
  );
};
