"use client";

import { useEffect, useRef, useState } from "react";
import type { Conversation } from "@/types/chat";
import { useTheme } from "@/hooks/useTheme";
import { MoreVerticalIcon, PlusIcon } from "./icons";

type Theme = "light" | "dark" | "system";

const THEME_CYCLE: Theme[] = ["light", "dark", "system"];

const THEME_ICONS: Record<Theme, string> = {
  light: "☀️",
  dark: "🌙",
  system: "💻",
};

const THEME_LABELS: Record<Theme, string> = {
  light: "라이트",
  dark: "다크",
  system: "시스템",
};

function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const handleCycle = () => {
    const index = THEME_CYCLE.indexOf(theme);
    setTheme(THEME_CYCLE[(index + 1) % THEME_CYCLE.length]);
  };

  return (
    <button
      type="button"
      onClick={handleCycle}
      className="inline-flex w-full items-center gap-2 rounded-[var(--radius-md)] px-3 py-2 text-sm text-clay-body transition-colors hover:bg-clay-surface-soft/80 dark:text-[var(--text-primary)] dark:hover:bg-[var(--surface)]"
      aria-label={`테마: ${THEME_LABELS[theme]}`}
    >
      <span className="text-base leading-none" aria-hidden="true">
        {THEME_ICONS[theme]}
      </span>
      <span className="text-sm leading-tight">{THEME_LABELS[theme]}</span>
    </button>
  );
}

type SidebarProps = {
  open: boolean;
  conversations: Conversation[];
  activeConversationId: string | null;
  onNewConversation: () => void;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  onUpdateTitle: (id: string, title: string) => void;
  onTogglePin: (id: string) => void;
};

function ConversationItem({
  conversation,
  isActive,
  menuOpen,
  onMenuOpen,
  onMenuClose,
  onSelect,
  onDelete,
  onUpdateTitle,
  onTogglePin,
}: {
  conversation: Conversation;
  isActive: boolean;
  menuOpen: boolean;
  onMenuOpen: () => void;
  onMenuClose: () => void;
  onSelect: () => void;
  onDelete: () => void;
  onUpdateTitle: (title: string) => void;
  onTogglePin: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(conversation.title);
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const isPinned = Boolean(conversation.pinned);

  useEffect(() => {
    if (!isEditing) return;
    inputRef.current?.focus();
    inputRef.current?.select();
  }, [isEditing]);

  useEffect(() => {
    if (!menuOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        onMenuClose();
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [menuOpen, onMenuClose]);

  const saveTitle = () => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== conversation.title) {
      onUpdateTitle(trimmed);
    }
    setEditValue(conversation.title);
    setIsEditing(false);
  };

  const cancelEdit = () => {
    setEditValue(conversation.title);
    setIsEditing(false);
  };

  const startEdit = () => {
    setEditValue(conversation.title);
    setIsEditing(true);
  };

  const itemSurfaceClass = isActive
    ? "bg-clay-peach/45 text-clay-ink dark:bg-[var(--surface-elevated)] dark:text-[var(--text-primary)]"
    : "bg-transparent text-clay-body hover:bg-clay-surface-soft/80 dark:text-[var(--text-primary)] dark:hover:bg-[var(--surface)]";

  return (
    <li className={`min-w-0 ${menuOpen ? "relative z-50" : ""}`}>
      <div
        className={`group relative min-w-0 rounded-[var(--radius-md)] text-sm transition-colors ${itemSurfaceClass}`}
      >
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={editValue}
            onChange={(event) => setEditValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                saveTitle();
              }
              if (event.key === "Escape") {
                event.preventDefault();
                cancelEdit();
              }
            }}
            onBlur={saveTitle}
            className="w-full bg-transparent px-3 py-2 text-inherit text-clay-ink outline-none"
            aria-label="대화 제목 편집"
          />
        ) : (
          <button
            type="button"
            onClick={onSelect}
            onDoubleClick={(event) => {
              event.preventDefault();
              startEdit();
            }}
            className={`block w-full truncate px-3 py-2 pr-9 text-left text-inherit ${
              isActive ? "font-medium text-clay-ink" : "font-normal"
            }`}
          >
            {conversation.title}
          </button>
        )}

        {!isEditing && (
          <div
            ref={menuRef}
            className="absolute top-1/2 right-1 -translate-y-1/2"
          >
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                if (menuOpen) {
                  onMenuClose();
                } else {
                  onMenuOpen();
                }
              }}
              className={`flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] text-clay-muted transition-opacity hover:bg-clay-lavender/20 hover:text-clay-ink ${
                menuOpen
                  ? "opacity-100"
                  : "opacity-0 group-hover:opacity-100"
              }`}
              aria-label="더보기"
              aria-expanded={menuOpen}
              aria-haspopup="menu"
            >
              <MoreVerticalIcon />
            </button>

            {menuOpen && (
              <div
                className="absolute top-full right-0 z-50 mt-1 min-w-[9.5rem] overflow-hidden rounded-[var(--radius-md)] border border-clay-hairline/80 bg-clay-canvas py-1 shadow-lg dark:border-[var(--border)] dark:bg-[var(--surface-elevated)]"
                role="menu"
              >
                <button
                  type="button"
                  role="menuitem"
                  onClick={(event) => {
                    event.stopPropagation();
                    onTogglePin();
                    onMenuClose();
                  }}
                  className="flex w-full px-3 py-2 text-left text-sm text-clay-body hover:bg-clay-surface-soft/90 dark:text-[var(--text-primary)] dark:hover:bg-[var(--surface)]"
                >
                  {isPinned ? "고정 해제" : "고정"}
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={(event) => {
                    event.stopPropagation();
                    onMenuClose();
                    startEdit();
                  }}
                  className="flex w-full px-3 py-2 text-left text-sm text-clay-body hover:bg-clay-surface-soft/90 dark:text-[var(--text-primary)] dark:hover:bg-[var(--surface)]"
                >
                  이름 변경
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={(event) => {
                    event.stopPropagation();
                    onDelete();
                    onMenuClose();
                  }}
                  className="flex w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                >
                  삭제
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </li>
  );
}

function ConversationSection({
  title,
  conversations,
  activeConversationId,
  openMenuId,
  onMenuOpen,
  onMenuClose,
  onSelectConversation,
  onDeleteConversation,
  onUpdateTitle,
  onTogglePin,
}: {
  title?: string;
  conversations: Conversation[];
  activeConversationId: string | null;
  openMenuId: string | null;
  onMenuOpen: (id: string) => void;
  onMenuClose: () => void;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  onUpdateTitle: (id: string, title: string) => void;
  onTogglePin: (id: string) => void;
}) {
  if (conversations.length === 0) return null;

  return (
    <div className="min-h-0">
      {title && (
        <p className="px-3 pb-1.5 text-xs text-clay-muted-soft dark:text-[var(--text-secondary)]">{title}</p>
      )}
      <ul className="space-y-0.5">
        {conversations.map((conversation) => (
          <ConversationItem
            key={conversation.id}
            conversation={conversation}
            isActive={conversation.id === activeConversationId}
            menuOpen={openMenuId === conversation.id}
            onMenuOpen={() => onMenuOpen(conversation.id)}
            onMenuClose={onMenuClose}
            onSelect={() => onSelectConversation(conversation.id)}
            onDelete={() => onDeleteConversation(conversation.id)}
            onUpdateTitle={(title) => onUpdateTitle(conversation.id, title)}
            onTogglePin={() => onTogglePin(conversation.id)}
          />
        ))}
      </ul>
    </div>
  );
}

export function Sidebar({
  open,
  conversations,
  activeConversationId,
  onNewConversation,
  onSelectConversation,
  onDeleteConversation,
  onUpdateTitle,
  onTogglePin,
}: SidebarProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const pinnedConversations = conversations.filter(
    (conversation) => conversation.pinned,
  );
  const regularConversations = conversations.filter(
    (conversation) => !conversation.pinned,
  );
  const hasPinned = pinnedConversations.length > 0;
  const hasRegular = regularConversations.length > 0;

  const sectionProps = {
    activeConversationId,
    openMenuId,
    onMenuOpen: setOpenMenuId,
    onMenuClose: () => setOpenMenuId(null),
    onSelectConversation,
    onDeleteConversation,
    onUpdateTitle,
    onTogglePin,
  };

  return (
    <aside
      className={`flex shrink-0 flex-col overflow-hidden border-r border-clay-lavender/35 bg-clay-surface-strong/95 backdrop-blur-md transition-[width] duration-300 ease-in-out dark:border-[var(--border)] dark:bg-[#131314] dark:text-[var(--text-primary)] dark:backdrop-blur-none ${
        open ? "w-72" : "w-0 border-r-0"
      }`}
      aria-hidden={!open}
    >
      <div className="flex h-full w-72 flex-col">
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

        <div className="flex min-h-0 flex-1 flex-col px-1.5 pb-4 pt-3">
          {conversations.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center rounded-[var(--radius-xl)] border border-dashed border-clay-lavender/40 bg-clay-surface-soft/80 px-4 py-8 text-center dark:border-[var(--border)] dark:bg-[#1a1a1d]">
              <p className="text-sm text-clay-body dark:text-[var(--text-primary)]">아직 대화가 없습니다</p>
              <p className="mt-1 text-xs text-clay-muted-soft dark:text-[var(--text-secondary)]">
                새 대화를 시작해 보세요
              </p>
            </div>
          ) : hasPinned ? (
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
              <ConversationSection
                title="고정됨"
                conversations={pinnedConversations}
                {...sectionProps}
              />

              {hasRegular && (
                <>
                  <div
                    className="my-3 border-t border-clay-hairline/40"
                    aria-hidden="true"
                  />
                  <ConversationSection
                    title="최근 항목"
                    conversations={regularConversations}
                    {...sectionProps}
                  />
                </>
              )}
            </div>
          ) : (
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
              <ConversationSection
                conversations={conversations}
                {...sectionProps}
              />
            </div>
          )}
        </div>

        <div className="shrink-0 border-t border-clay-lavender/20 px-1.5 py-2 dark:border-[var(--border)]">
          <ThemeToggle />
        </div>
      </div>
    </aside>
  );
}
