import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type MarkdownContentProps = {
  content: string;
};

export function MarkdownContent({ content }: MarkdownContentProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[[remarkGfm, { singleTilde: false }]]}
      components={{
        p: ({ children }) => (
          <p className="mb-2 last:mb-0 [&:only-child]:mb-0">{children}</p>
        ),
        strong: ({ children }) => (
          <strong className="font-semibold text-clay-ink">{children}</strong>
        ),
        em: ({ children }) => <em className="italic">{children}</em>,
        ul: ({ children }) => (
          <ul className="mb-2 list-disc space-y-1 pl-5 last:mb-0">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="mb-2 list-decimal space-y-1 pl-5 last:mb-0">
            {children}
          </ol>
        ),
        li: ({ children }) => <li className="leading-relaxed">{children}</li>,
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
              <code className="block overflow-x-auto rounded-[var(--radius-md)] bg-clay-lavender/20 px-3 py-2 font-mono text-[0.8125rem] leading-relaxed text-clay-ink">
                {children}
              </code>
            );
          }
          return (
            <code className="rounded bg-clay-lavender/25 px-1.5 py-0.5 font-mono text-[0.8125rem] text-clay-ink">
              {children}
            </code>
          );
        },
        pre: ({ children }) => (
          <pre className="mb-2 overflow-x-auto rounded-[var(--radius-md)] bg-clay-lavender/20 p-3 font-mono text-[0.8125rem] leading-relaxed text-clay-ink last:mb-0">
            {children}
          </pre>
        ),
        blockquote: ({ children }) => (
          <blockquote className="mb-2 border-l-2 border-clay-mint pl-3 text-clay-body italic last:mb-0">
            {children}
          </blockquote>
        ),
        h1: ({ children }) => (
          <h1 className="mb-2 text-base font-semibold text-clay-ink">{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="mb-2 text-sm font-semibold text-clay-ink">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="mb-1 text-sm font-medium text-clay-ink">{children}</h3>
        ),
        hr: () => <hr className="my-3 border-clay-mint/40" />,
        table: ({ children }) => (
          <div className="mb-2 overflow-x-auto last:mb-0">
            <table className="w-full border-collapse text-left text-sm">
              {children}
            </table>
          </div>
        ),
        th: ({ children }) => (
          <th className="border border-clay-mint/40 bg-clay-lavender/15 px-2 py-1 font-medium">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="border border-clay-mint/40 px-2 py-1">{children}</td>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
