"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { DEFAULT_MODEL_ID } from "@/constants/models";
import { useModels } from "@/hooks/useModels";
import {
  CATEGORY_ORDER,
  formatPriceLabel,
  groupModelsByCategory,
  type ModelOption,
} from "@/types/models";
import { ChevronDownIcon, GlobeIcon, SendIcon } from "./icons";

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

function ModelBadge({ model }: { model: ModelOption }) {
  if (model.free) {
    return (
      <span className="shrink-0 rounded-[var(--radius-pill)] bg-clay-mint/40 px-2 py-0.5 text-[10px] font-semibold text-clay-teal">
        FREE
      </span>
    );
  }

  if (!model.price) return null;

  return (
    <span className="shrink-0 rounded-[var(--radius-pill)] bg-clay-peach/35 px-2 py-0.5 text-[10px] font-semibold text-clay-ink">
      {model.price}
    </span>
  );
}

function ModelCard({
  model,
  selected,
  onSelect,
}: {
  model: ModelOption;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex flex-col gap-1.5 rounded-[var(--radius-md)] border p-2.5 text-left transition-colors ${
        selected
          ? "border-clay-coral/60 bg-clay-lavender/25 ring-1 ring-clay-coral/30"
          : "border-clay-hairline bg-clay-canvas/90 hover:border-clay-lavender/50 hover:bg-clay-surface-card/80"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-semibold leading-tight text-clay-ink">
          {model.name}
        </span>
        <ModelBadge model={model} />
      </div>
      <p className="truncate text-xs text-clay-muted">{model.id}</p>
      {!model.free && model.price && (
        <p className="text-[10px] text-clay-muted-soft">
          {formatPriceLabel(model.price)}
        </p>
      )}
    </button>
  );
}

function ModelPopoverSpinner() {
  return (
    <div className="flex items-center justify-center py-10" role="status">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-clay-lavender/30 border-t-clay-coral" />
      <span className="sr-only">모델 목록 로딩 중</span>
    </div>
  );
}

function ModelPopover({
  selectedModelId,
  onModelChange,
  onClose,
  models,
  isLoading,
  error,
}: {
  selectedModelId: string;
  onModelChange: (modelId: string) => void;
  onClose: () => void;
  models: ModelOption[];
  isLoading: boolean;
  error: string | null;
}) {
  const grouped = groupModelsByCategory(models);

  const handleSelect = (model: ModelOption) => {
    onModelChange(model.id);
    onClose();
  };

  return (
    <div
      className="absolute bottom-full left-0 right-0 z-50 mb-3 rounded-[var(--radius-xl)] border border-clay-lavender/50 bg-clay-canvas/98 p-4 shadow-lg backdrop-blur-md dark:border-[var(--border)] dark:bg-[var(--surface-elevated)]"
      role="dialog"
      aria-label="모델 선택"
    >
      {isLoading ? (
        <ModelPopoverSpinner />
      ) : error ? (
        <p className="py-8 text-center text-sm text-red-700">
          모델 목록을 불러오지 못했습니다
        </p>
      ) : models.length === 0 ? (
        <p className="py-8 text-center text-sm text-clay-muted">
          표시할 모델이 없습니다
        </p>
      ) : (
        <div className="max-h-80 space-y-4 overflow-y-auto overscroll-contain pr-1">
          {CATEGORY_ORDER.map((category) => {
            const categoryModels = grouped[category];
            if (categoryModels.length === 0) return null;

            return (
              <section key={category}>
                <h3 className="mb-2 text-xs font-semibold tracking-wide text-clay-muted uppercase">
                  {category}
                </h3>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {categoryModels.map((model) => (
                    <ModelCard
                      key={model.id}
                      model={model}
                      selected={model.id === selectedModelId}
                      onSelect={() => handleSelect(model)}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

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
  const modelsRef = useRef(models);
  modelsRef.current = models;

  const selectedModel = models.find((model) => model.id === selectedModelId);

  useEffect(() => {
    if (!isReady) return;

    const currentModels = modelsRef.current;
    if (currentModels.length === 0) return;

    const exists = currentModels.some((model) => model.id === selectedModelId);
    if (exists) return;

    const fallback =
      currentModels.find((model) => model.id === DEFAULT_MODEL_ID) ??
      currentModels[0];

    if (fallback) onModelChange(fallback.id);
  }, [isReady, selectedModelId, onModelChange]);

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

  const modelButtonLabel = isLoading
    ? "모델 로딩..."
    : (selectedModel?.name ?? selectedModelId);

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
        className={`relative flex flex-col rounded-[var(--radius-xl)] border bg-clay-canvas/95 px-3 pt-3 pb-2 shadow-sm dark:border-[var(--border)] dark:bg-[var(--input-bg)] ${
          disabled ? "opacity-60" : ""
        } ${
          docked
            ? "border-clay-mint/50"
            : "border-clay-lavender/40 bg-gradient-to-br from-clay-canvas via-clay-canvas to-clay-mint/10"
        }`}
      >
        {popoverOpen && !disabled && (
          <ModelPopover
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
          className="max-h-[200px] min-h-[44px] w-full resize-none bg-transparent px-1 text-sm leading-relaxed text-clay-ink outline-none placeholder:text-clay-muted-soft disabled:cursor-not-allowed dark:text-[var(--text-primary)] dark:placeholder-[var(--text-secondary)]"
          aria-label="메시지 입력"
        />

        <div className="mt-1 flex items-center justify-between gap-2 border-t border-clay-hairline/60 pt-2 dark:border-[var(--border)]">
          <div className="flex min-w-0 items-center gap-1.5">
            <button
              type="button"
              onClick={() => !disabled && setPopoverOpen((prev) => !prev)}
              disabled={disabled}
              className="inline-flex max-w-[9rem] items-center gap-1 rounded-[var(--radius-md)] px-2 py-1.5 font-medium text-clay-body hover:bg-clay-lavender/15 disabled:cursor-not-allowed disabled:hover:bg-transparent sm:max-w-[12rem] dark:bg-[var(--surface)] dark:text-[var(--text-primary)] dark:hover:bg-[var(--surface-elevated)]"
              aria-label="모델 선택"
              aria-expanded={popoverOpen}
              aria-haspopup="dialog"
            >
              <span className="truncate text-sm leading-tight">
                {modelButtonLabel}
              </span>
              <ChevronDownIcon />
            </button>

            <button
              type="button"
              onClick={() => !disabled && onWebSearchChange(!webSearchEnabled)}
              disabled={disabled}
              aria-label="웹 검색"
              aria-pressed={webSearchEnabled}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-[var(--radius-md)] px-2.5 py-1.5 transition-all disabled:cursor-not-allowed ${
                webSearchEnabled
                  ? "border border-clay-coral/50 bg-clay-coral/15 font-semibold text-clay-coral shadow-sm"
                  : "border-0 bg-transparent font-medium text-clay-muted hover:text-clay-body dark:text-[var(--text-secondary)]"
              }`}
            >
              <GlobeIcon />
              <span className="text-sm leading-tight">검색</span>
            </button>
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
