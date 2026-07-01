"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CONVERSATIONS_STORAGE_KEY,
  deriveConversationTitle,
  type Conversation,
  type Message,
} from "@/types/chat";

function loadConversations(): Conversation[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(CONVERSATIONS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Conversation[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveConversations(conversations: Conversation[]) {
  localStorage.setItem(CONVERSATIONS_STORAGE_KEY, JSON.stringify(conversations));
}

export function sortConversations(conversations: Conversation[]) {
  return [...conversations].sort((a, b) => {
    const aPinned = a.pinned ? 1 : 0;
    const bPinned = b.pinned ? 1 : 0;
    if (aPinned !== bPinned) return bPinned - aPinned;
    return b.updatedAt - a.updatedAt;
  });
}

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(
    null,
  );
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = sortConversations(loadConversations());
    setConversations(stored);
    setActiveConversationId(stored[0]?.id ?? null);
    setHydrated(true);
  }, []);

  const activeConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === activeConversationId),
    [conversations, activeConversationId],
  );

  const createConversation = useCallback((modelId: string) => {
    const now = Date.now();
    const conversation: Conversation = {
      id: crypto.randomUUID(),
      title: "새 대화",
      modelId,
      messages: [],
      createdAt: now,
      updatedAt: now,
    };

    setConversations((prev) => {
      const next = sortConversations([conversation, ...prev]);
      saveConversations(next);
      return next;
    });
    setActiveConversationId(conversation.id);
    return conversation.id;
  }, []);

  const updateConversation = useCallback(
    (id: string, messages: Message[], modelId?: string) => {
      const now = Date.now();

      setConversations((prev) => {
        const next = sortConversations(
          prev.map((conversation) =>
            conversation.id === id
              ? {
                  ...conversation,
                  messages,
                  modelId: modelId ?? conversation.modelId,
                  title: conversation.titleManuallyEdited
                    ? conversation.title
                    : deriveConversationTitle(messages),
                  updatedAt: now,
                }
              : conversation,
          ),
        );
        saveConversations(next);
        return next;
      });
    },
    [],
  );

  const updateTitle = useCallback((id: string, title: string) => {
    const trimmed = title.trim();
    if (!trimmed) return;

    setConversations((prev) => {
      const next = sortConversations(
        prev.map((conversation) =>
          conversation.id === id
            ? {
                ...conversation,
                title: trimmed,
                titleManuallyEdited: true,
              }
            : conversation,
        ),
      );
      saveConversations(next);
      return next;
    });
  }, []);

  const togglePin = useCallback((id: string) => {
    setConversations((prev) => {
      const next = sortConversations(
        prev.map((conversation) =>
          conversation.id === id
            ? { ...conversation, pinned: !conversation.pinned }
            : conversation,
        ),
      );
      saveConversations(next);
      return next;
    });
  }, []);

  const deleteConversation = useCallback((id: string) => {
    setConversations((prev) => {
      const next = sortConversations(
        prev.filter((conversation) => conversation.id !== id),
      );
      saveConversations(next);

      setActiveConversationId((currentId) =>
        currentId === id ? (next[0]?.id ?? null) : currentId,
      );

      return next;
    });
  }, []);

  const selectConversation = useCallback((id: string) => {
    setActiveConversationId(id);
  }, []);

  return {
    conversations,
    activeConversation,
    activeConversationId,
    hydrated,
    createConversation,
    updateConversation,
    updateTitle,
    togglePin,
    deleteConversation,
    selectConversation,
  };
}
