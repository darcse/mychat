"use client";

import { useCallback, useState, type RefObject } from "react";
import { MarkdownContent } from "@/components/MarkdownContent";
import { CheckIcon, CopyIcon, ResendIcon } from "@/components/icons";
import { formatModelLabel, stripMarkdown } from "@/lib/markdown-plain";
import type { Message } from "@/types/chat";

export type { Message };

type MessageListProps = {
  messages: Message[];
  bottomRef: RefObject<HTMLDivElement | null>;
  isLoading?: boolean;
  onResend?: (content: string) => void;
};

function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div
        className="inline-flex items-center gap-1.5 rounded-[var(--radius-lg)] border border-clay-mint/50 bg-clay-canvas/95 px-4 py-3 shadow-sm"
        aria-label="응답 생성 중"
        role="status"
      >
        <span
          className="typing-dot h-2.5 w-2.5 rounded-full bg-clay-coral"
          style={{ animationDelay: "0ms" }}
        />
        <span
          className="typing-dot h-2.5 w-2.5 rounded-full bg-clay-lavender"
          style={{ animationDelay: "150ms" }}
        />
        <span
          className="typing-dot h-2.5 w-2.5 rounded-full bg-clay-mint"
          style={{ animationDelay: "300ms" }}
        />
      </div>
    </div>
  );
}

function WebSearchBadge() {
  return (
    <span className="mb-2 inline-flex items-center gap-1 rounded-[var(--radius-pill)] border border-clay-coral/40 bg-clay-coral/10 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-clay-coral uppercase">
      웹 검색 사용
    </span>
  );
}

function CopyButton({
  text,
  className = "",
  label = "복사",
}: {
  text: string;
  className?: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard unavailable
    }
  }, [text]);

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`inline-flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] transition-colors hover:bg-clay-lavender/20 ${className}`}
      aria-label={copied ? "복사됨" : label}
    >
      {copied ? <CheckIcon /> : <CopyIcon />}
    </button>
  );
}

function UserMessageActions({
  content,
  onResend,
}: {
  content: string;
  onResend?: (content: string) => void;
}) {
  return (
    <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
      {onResend && (
        <button
          type="button"
          onClick={() => onResend(content)}
          className="inline-flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] text-clay-muted transition-colors hover:bg-clay-lavender/20 hover:text-clay-coral"
          aria-label="재질문"
        >
          <ResendIcon />
        </button>
      )}
      <CopyButton
        text={content}
        className="text-clay-muted hover:text-clay-coral"
      />
    </div>
  );
}

function AssistantMessageFooter({ message }: { message: Message }) {
  if (message.isError || message.isStreaming || !message.modelId) {
    return null;
  }

  return (
    <div className="mt-2 flex items-center justify-between gap-3 border-t border-clay-hairline/60 pt-2">
      <span className="truncate text-xs text-clay-muted">
        {formatModelLabel(message.modelId)}
      </span>
      <CopyButton
        text={stripMarkdown(message.content)}
        className="shrink-0 text-clay-muted hover:text-clay-coral"
        label="응답 복사"
      />
    </div>
  );
}

function MessageBubble({
  message,
  onResend,
}: {
  message: Message;
  onResend?: (content: string) => void;
}) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="group flex max-w-[85%] flex-col items-end">
        <div className="whitespace-pre-wrap rounded-[var(--radius-lg)] bg-gradient-to-br from-clay-coral to-clay-peach px-4 py-3 text-sm leading-relaxed text-clay-on-primary shadow-sm">
          {message.content}
        </div>
        <UserMessageActions content={message.content} onResend={onResend} />
      </div>
    );
  }

  if (message.isError) {
    return (
      <div className="max-w-[85%] whitespace-pre-wrap rounded-[var(--radius-lg)] border border-red-200 bg-red-50 px-4 py-3 text-sm leading-relaxed text-red-800 shadow-sm">
        {message.content}
      </div>
    );
  }

  return (
    <div className="max-w-[85%] rounded-[var(--radius-lg)] border border-clay-mint/50 bg-clay-canvas/95 px-4 py-3 text-sm leading-relaxed text-clay-body shadow-sm">
      {!message.isError && message.usedWebSearch && <WebSearchBadge />}
      <MarkdownContent content={message.content} />
      <AssistantMessageFooter message={message} />
    </div>
  );
}

export function WelcomeCard() {
  return (
    <div className="relative max-w-md rounded-[var(--radius-xl)] bg-gradient-to-br from-clay-lavender via-clay-peach to-clay-mint p-[1.5px] shadow-sm">
      <div className="rounded-[var(--radius-xl)] bg-clay-canvas/95 px-8 py-10 text-center backdrop-blur-sm">
        <p className="text-xl font-medium tracking-tight text-clay-ink">
          무엇이든 물어보세요
        </p>
        <p className="mt-2 text-sm leading-relaxed text-clay-body">
          멀티 AI 챗을 시작할 준비가 되었습니다.
        </p>
      </div>
    </div>
  );
}

export function MessageList({
  messages,
  bottomRef,
  isLoading = false,
  onResend,
}: MessageListProps) {
  const lastMessage = messages[messages.length - 1];
  const showTypingIndicator =
    isLoading &&
    lastMessage?.role === "assistant" &&
    !lastMessage.content &&
    !lastMessage.isError;

  const visibleMessages = messages.filter(
    (message) => !(message.isStreaming && !message.content),
  );

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col items-stretch justify-start gap-4 px-4 pt-6 pb-2">
      {visibleMessages.map((message) => (
        <div
          key={message.id}
          className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
        >
          <MessageBubble message={message} onResend={onResend} />
        </div>
      ))}
      {showTypingIndicator && <TypingIndicator />}
      <div ref={bottomRef} aria-hidden="true" />
    </div>
  );
}
