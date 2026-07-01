import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/cn";

const dark = {
  text: "dark:text-[var(--text-primary)]",
  surface: "dark:bg-[var(--surface)]",
  border: "dark:border-[var(--border)]",
} as const;

type MarkdownContentProps = {
  content: string;
};

export function MarkdownContent({ content }: MarkdownContentProps) {
  return (
    <div className={dark.text}>
      <ReactMarkdown
        remarkPlugins={[[remarkGfm, { singleTilde: false }]]}
        components={{
          p: ({ children }) => (
            <p className={cn("mb-2 last:mb-0 [&:only-child]:mb-0", dark.text)}>
              {children}
            </p>
          ),
          strong: ({ children }) => (
            <strong className={cn("font-semibold text-clay-ink", dark.text)}>
              {children}
            </strong>
          ),
          em: ({ children }) => (
            <em className={cn("italic", dark.text)}>{children}</em>
          ),
          ul: ({ children }) => (
            <ul className="mb-2 list-disc space-y-1 pl-5 last:mb-0">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-2 list-decimal space-y-1 pl-5 last:mb-0">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className={cn("leading-relaxed", dark.text)}>{children}</li>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-clay-coral underline decoration-clay-coral/40 underline-offset-2 hover:decoration-clay-coral"
            >
              {children}
            </a>
          ),
          code: ({ className, children }) => {
            const isBlock = Boolean(className);
            if (isBlock) {
              return (
                <code
                  className={cn(
                    "block overflow-x-auto rounded-[var(--radius-md)] bg-clay-lavender/20 px-3 py-2 font-mono text-[0.8125rem] leading-relaxed text-clay-ink",
                    dark.surface,
                    dark.text,
                  )}
                >
                  {children}
                </code>
              );
            }
            return (
              <code
                className={cn(
                  "rounded bg-clay-lavender/25 px-1.5 py-0.5 font-mono text-[0.8125rem] text-clay-ink",
                  dark.surface,
                  dark.text,
                )}
              >
                {children}
              </code>
            );
          },
          pre: ({ children }) => (
            <pre
              className={cn(
                "mb-2 overflow-x-auto rounded-[var(--radius-md)] bg-clay-lavender/20 p-3 font-mono text-[0.8125rem] leading-relaxed text-clay-ink last:mb-0",
                dark.surface,
                dark.text,
              )}
            >
              {children}
            </pre>
          ),
          blockquote: ({ children }) => (
            <blockquote
              className={cn(
                "mb-2 border-l-2 border-clay-mint pl-3 text-clay-body italic last:mb-0",
                dark.border,
                dark.text,
              )}
            >
              {children}
            </blockquote>
          ),
          h1: ({ children }) => (
            <h1 className={cn("mb-2 text-base font-semibold text-clay-ink", dark.text)}>
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className={cn("mb-2 text-sm font-semibold text-clay-ink", dark.text)}>
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className={cn("mb-1 text-sm font-medium text-clay-ink", dark.text)}>
              {children}
            </h3>
          ),
          hr: () => (
            <hr className={cn("my-3 border-clay-mint/40", dark.border)} />
          ),
          table: ({ children }) => (
            <div className="mb-2 overflow-x-auto last:mb-0">
              <table className={cn("w-full border-collapse text-left text-sm", dark.text)}>
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className={dark.text}>{children}</thead>
          ),
          tbody: ({ children }) => (
            <tbody className={dark.text}>{children}</tbody>
          ),
          tr: ({ children }) => <tr className={dark.text}>{children}</tr>,
          th: ({ children }) => (
            <th
              className={cn(
                "border border-clay-mint/40 bg-clay-lavender/15 px-2 py-1 font-medium",
                dark.border,
                dark.surface,
                dark.text,
              )}
            >
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td
              className={cn(
                "border border-clay-mint/40 px-2 py-1",
                dark.border,
                dark.text,
              )}
            >
              {children}
            </td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
