"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { DEFAULT_MODEL_ID } from "@/constants/models";
import { useModels } from "@/hooks/useModels";
import { SendIcon } from "@/components/icons";
import { ModelSelectButton, ModelSelectPopover } from "./ModelSelector";
import { WebSearchToggle } from "./WebSearchToggle";

const TEXTAREA_MIN_HEIGHT = 44;
const TEXTAREA_MAX_HEIGHT = 200;

type ChatInputProps = {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  selectedModelId: string;
  onModelChange: (modelId: string) => void;
  webSearchEnabled: boolean;
  onWebSearchChange: (enabled: boolean) => void;
  docked?: boolean;
  disabled?: boolean;
};

export function ChatInput({
  value,
  onChange,
  onSend,
  selectedModelId,
  onModelChange,
  webSearchEnabled,
  onWebSearchChange,
  docked = false,
  disabled = false,
}: ChatInputProps) {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { models, isLoading, isReady, error } = useModels();

  useEffect(() => {
    if (!isReady) return;

    if (models.length === 0) return;

    const exists = models.some((model) => model.id === selectedModelId);
    if (exists) return;

    const fallback =
      models.find((model) => model.id === DEFAULT_MODEL_ID) ?? models[0];

    if (fallback) onModelChange(fallback.id);
  }, [isReady, selectedModelId, onModelChange, models]);

  useEffect(() => {
    if (!popoverOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (
        cardRef.current &&
        !cardRef.current.contains(event.target as Node)
      ) {
        setPopoverOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [popoverOpen]);

  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";
    const nextHeight = Math.min(
      Math.max(textarea.scrollHeight, TEXTAREA_MIN_HEIGHT),
      TEXTAREA_MAX_HEIGHT,
    );
    textarea.style.height = `${nextHeight}px`;
  }, []);

  useEffect(() => {
    adjustTextareaHeight();
  }, [value, adjustTextareaHeight]);

  const handleSend = () => {
    if (!value.trim() || disabled) return;
    onSend();
    requestAnimationFrame(() => {
      const textarea = textareaRef.current;
      if (!textarea) return;
      textarea.style.height = `${TEXTAREA_MIN_HEIGHT}px`;
    });
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (disabled) return;
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  return (
    <form
      className="mx-auto w-full max-w-3xl"
      onSubmit={(event) => {
        event.preventDefault();
        handleSend();
      }}
    >
      <div
        ref={cardRef}
        className={`relative flex flex-col rounded-[var(--radius-xl)] border bg-clay-canvas/95 px-3 pt-3 pb-2 shadow-sm dark:border-[var(--border)] dark:bg-none dark:bg-[var(--input-bg)] ${
          disabled ? "opacity-60" : ""
        } ${
          docked
            ? "border-clay-mint/50"
            : "border-clay-lavender/40 bg-gradient-to-br from-clay-canvas via-clay-canvas to-clay-mint/10"
        }`}
      >
        {popoverOpen && !disabled && (
          <ModelSelectPopover
            selectedModelId={selectedModelId}
            onModelChange={onModelChange}
            onClose={() => setPopoverOpen(false)}
            models={models}
            isLoading={isLoading}
            error={error}
          />
        )}

        <textarea
          ref={textareaRef}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          placeholder="메시지를 입력하세요..."
          disabled={disabled}
          className="max-h-[200px] min-h-[44px] w-full resize-none bg-transparent px-1 text-sm leading-relaxed text-clay-ink outline-none placeholder:text-clay-muted-soft disabled:cursor-not-allowed dark:bg-[var(--input-bg)] dark:text-[var(--text-primary)] dark:placeholder-[var(--text-secondary)]"
          aria-label="메시지 입력"
        />

        <div className="mt-1 flex items-center justify-between gap-2 border-t border-clay-hairline/60 pt-2 dark:border-[var(--border)]">
          <div className="flex min-w-0 items-center gap-1.5">
            <ModelSelectButton
              selectedModelId={selectedModelId}
              models={models}
              isLoading={isLoading}
              disabled={disabled}
              popoverOpen={popoverOpen}
              onPopoverOpenChange={setPopoverOpen}
            />

            <WebSearchToggle
              enabled={webSearchEnabled}
              onChange={onWebSearchChange}
              disabled={disabled}
            />
          </div>

          <button
            type="submit"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-gradient-to-br from-clay-coral to-clay-peach text-clay-on-primary shadow-sm disabled:opacity-40"
            aria-label="메시지 전송"
            disabled={!value.trim() || disabled}
          >
            <SendIcon />
          </button>
        </div>
      </div>
    </form>
  );
}
