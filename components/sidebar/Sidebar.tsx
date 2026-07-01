"use client";

import { useState } from "react";
import type { Conversation } from "@/types/chat";
import { SidebarConversationItem } from "./SidebarConversationItem";
import { SidebarFooter } from "./SidebarFooter";
import { SidebarHeader } from "./SidebarHeader";

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
        <p className="px-3 pb-1.5 text-xs text-clay-muted-soft dark:text-[var(--text-secondary)]">
          {title}
        </p>
      )}
      <ul className="space-y-0.5">
        {conversations.map((conversation) => (
          <SidebarConversationItem
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
        <SidebarHeader onNewConversation={onNewConversation} />

        <div className="flex min-h-0 flex-1 flex-col px-1.5 pb-4 pt-3">
          {conversations.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center rounded-[var(--radius-xl)] border border-dashed border-clay-lavender/40 bg-clay-surface-soft/80 px-4 py-8 text-center dark:border-[var(--border)] dark:bg-[#1a1a1d]">
              <p className="text-sm text-clay-body dark:text-[var(--text-primary)]">
                아직 대화가 없습니다
              </p>
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

        <SidebarFooter />
      </div>
    </aside>
  );
}
