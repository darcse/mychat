import { ChevronDownIcon } from "@/components/icons";
import {
  CATEGORY_ORDER,
  formatPriceLabel,
  groupModelsByCategory,
  type ModelOption,
} from "@/types/models";

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

type ModelSelectPopoverProps = {
  selectedModelId: string;
  onModelChange: (modelId: string) => void;
  onClose: () => void;
  models: ModelOption[];
  isLoading: boolean;
  error: string | null;
};

export function ModelSelectPopover({
  selectedModelId,
  onModelChange,
  onClose,
  models,
  isLoading,
  error,
}: ModelSelectPopoverProps) {
  return (
    <ModelPopover
      selectedModelId={selectedModelId}
      onModelChange={onModelChange}
      onClose={onClose}
      models={models}
      isLoading={isLoading}
      error={error}
    />
  );
}

type ModelSelectButtonProps = {
  selectedModelId: string;
  models: ModelOption[];
  isLoading: boolean;
  disabled?: boolean;
  popoverOpen: boolean;
  onPopoverOpenChange: (open: boolean) => void;
};

export function ModelSelectButton({
  selectedModelId,
  models,
  isLoading,
  disabled = false,
  popoverOpen,
  onPopoverOpenChange,
}: ModelSelectButtonProps) {
  const selectedModel = models.find((model) => model.id === selectedModelId);
  const modelButtonLabel = isLoading
    ? "모델 로딩..."
    : (selectedModel?.name ?? selectedModelId);

  return (
    <button
      type="button"
      onClick={() => !disabled && onPopoverOpenChange(!popoverOpen)}
      disabled={disabled}
      className="inline-flex max-w-[9rem] items-center gap-1 rounded-[var(--radius-md)] px-2 py-1.5 font-medium text-clay-body hover:bg-clay-lavender/15 disabled:cursor-not-allowed disabled:hover:bg-transparent sm:max-w-[12rem] dark:bg-[var(--surface)] dark:text-[var(--text-primary)] dark:hover:bg-[var(--surface-elevated)]"
      aria-label="모델 선택"
      aria-expanded={popoverOpen}
      aria-haspopup="dialog"
    >
      <span className="truncate text-sm leading-tight">{modelButtonLabel}</span>
      <ChevronDownIcon />
    </button>
  );
}
