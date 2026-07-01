import { GlobeIcon } from "@/components/icons";

type WebSearchToggleProps = {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  disabled?: boolean;
};

export function WebSearchToggle({
  enabled,
  onChange,
  disabled = false,
}: WebSearchToggleProps) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!enabled)}
      disabled={disabled}
      aria-label="웹 검색"
      aria-pressed={enabled}
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-[var(--radius-md)] px-2.5 py-1.5 transition-all disabled:cursor-not-allowed ${
        enabled
          ? "border border-clay-coral/50 bg-clay-coral/15 font-semibold text-clay-coral shadow-sm"
          : "border-0 bg-transparent font-medium text-clay-muted hover:text-clay-body dark:text-[var(--text-secondary)]"
      }`}
    >
      <GlobeIcon />
      <span className="text-sm leading-tight">검색</span>
    </button>
  );
}
