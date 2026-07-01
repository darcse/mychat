import { PlusIcon } from "@/components/icons";

type SidebarHeaderProps = {
  onNewConversation: () => void;
};

export function SidebarHeader({ onNewConversation }: SidebarHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-clay-lavender/20 px-4 py-4 dark:border-[var(--border)]">
      <h1 className="bg-gradient-to-r from-clay-coral to-clay-peach bg-clip-text text-lg font-semibold tracking-tight text-transparent">
        mychat
      </h1>
      <button
        type="button"
        onClick={onNewConversation}
        className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-[var(--radius-md)] bg-gradient-to-r from-clay-coral to-clay-peach px-2.5 font-medium text-clay-on-primary shadow-sm"
        aria-label="새 대화"
      >
        <PlusIcon />
        <span className="text-sm leading-tight">새 대화</span>
      </button>
    </div>
  );
}
