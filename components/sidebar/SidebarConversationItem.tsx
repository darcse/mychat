"use client";

import { useEffect, useRef, useState } from "react";
import { MoreVerticalIcon } from "@/components/icons";
import type { Conversation } from "@/types/chat";

type SidebarConversationItemProps = {
  conversation: Conversation;
  isActive: boolean;
  menuOpen: boolean;
  onMenuOpen: () => void;
  onMenuClose: () => void;
  onSelect: () => void;
  onDelete: () => void;
  onUpdateTitle: (title: string) => void;
  onTogglePin: () => void;
};

export function SidebarConversationItem({
  conversation,
  isActive,
  menuOpen,
  onMenuOpen,
  onMenuClose,
  onSelect,
  onDelete,
  onUpdateTitle,
  onTogglePin,
}: SidebarConversationItemProps) {
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
