"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChatInput } from "@/components/ChatInput";
import {
  DEFAULT_MODEL_ID,
  MODEL_STORAGE_KEY,
  resolveStoredModelId,
} from "@/constants/models";
import {
  resolveStoredWebSearch,
  WEB_SEARCH_STORAGE_KEY,
} from "@/constants/web-search";
import { useChat } from "@/hooks/useChat";
import { useConversations } from "@/hooks/useConversations";
import { MenuIcon } from "@/components/icons";
import { MessageList, WelcomeCard } from "@/components/MessageList";
import { Sidebar } from "@/components/Sidebar";
import type { Message } from "@/types/chat";

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedModelId, setSelectedModelId] = useState(DEFAULT_MODEL_ID);
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);

  const {
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
  } = useConversations();

  const conversationsRef = useRef(conversations);
  conversationsRef.current = conversations;

  const activeConversationIdRef = useRef(activeConversationId);
  activeConversationIdRef.current = activeConversationId;

  const handleMessagesUpdated = useCallback(
    (nextMessages: Message[]) => {
      const conversationId = activeConversationIdRef.current;
      if (!conversationId) return;
      updateConversation(conversationId, nextMessages, selectedModelId);
    },
    [selectedModelId, updateConversation],
  );

  const { input, setInput, isLoading, sendMessage } = useChat({
    selectedModelId,
    webSearchEnabled,
    messages,
    setMessages,
    onMessagesUpdated: handleMessagesUpdated,
  });

  const bottomRef = useRef<HTMLDivElement>(null);
  const hasMessages = messages.length > 0;

  useEffect(() => {
    const stored = localStorage.getItem(MODEL_STORAGE_KEY);
    setSelectedModelId(resolveStoredModelId(stored));
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem(WEB_SEARCH_STORAGE_KEY);
    setWebSearchEnabled(resolveStoredWebSearch(stored));
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    const conversation = conversationsRef.current.find(
      (item) => item.id === activeConversationId,
    );

    setMessages(conversation?.messages ?? []);
    if (conversation?.modelId) {
      setSelectedModelId(conversation.modelId);
    }
    setInput("");
  }, [activeConversationId, hydrated, setInput]);

  const handleModelChange = useCallback((modelId: string) => {
    setSelectedModelId(modelId);
    localStorage.setItem(MODEL_STORAGE_KEY, modelId);
  }, []);

  const handleWebSearchChange = useCallback((enabled: boolean) => {
    setWebSearchEnabled(enabled);
    localStorage.setItem(WEB_SEARCH_STORAGE_KEY, String(enabled));
  }, []);

  const handleNewConversation = useCallback(() => {
    const conversationId = createConversation(selectedModelId);
    activeConversationIdRef.current = conversationId;
    setMessages([]);
    setInput("");
  }, [createConversation, selectedModelId, setInput]);

  const handleSend = useCallback(async () => {
    let conversationId = activeConversationIdRef.current;
    if (!conversationId) {
      conversationId = createConversation(selectedModelId);
      activeConversationIdRef.current = conversationId;
    }
    await sendMessage();
  }, [createConversation, selectedModelId, sendMessage]);

  const handleResend = useCallback(
    async (content: string) => {
      let conversationId = activeConversationIdRef.current;
      if (!conversationId) {
        conversationId = createConversation(selectedModelId);
        activeConversationIdRef.current = conversationId;
      }
      await sendMessage(content);
    },
    [createConversation, selectedModelId, sendMessage],
  );

  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)");

    const syncSidebar = (matches: boolean) => {
      setSidebarOpen(!matches);
    };

    syncSidebar(media.matches);

    const onChange = (event: MediaQueryListEvent) => {
      syncSidebar(event.matches);
    };

    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (!hasMessages && !isLoading) return;
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isLoading, hasMessages]);

  const headerTitle = activeConversation?.title ?? "새 대화";

  return (
    <div className="flex h-dvh overflow-hidden">
      <Sidebar
        open={sidebarOpen}
        conversations={conversations}
        activeConversationId={activeConversationId}
        onNewConversation={handleNewConversation}
        onSelectConversation={selectConversation}
        onDeleteConversation={deleteConversation}
        onUpdateTitle={updateTitle}
        onTogglePin={togglePin}
      />

      <main className="flex min-w-0 flex-1 flex-col bg-clay-canvas/40">
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-clay-peach/30 bg-clay-canvas/80 px-4 backdrop-blur-sm">
          <button
            type="button"
            onClick={() => setSidebarOpen((open) => !open)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] border border-clay-lavender/50 bg-clay-lavender/15 text-clay-ink"
            aria-label={sidebarOpen ? "사이드바 접기" : "사이드바 펼치기"}
            aria-expanded={sidebarOpen}
          >
            <MenuIcon />
          </button>
          <span className="truncate text-sm font-medium text-clay-body">
            {headerTitle}
          </span>
        </header>

        <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
          <div
            className="pointer-events-none absolute top-1/4 left-1/4 h-52 w-52 rounded-full bg-clay-lavender/30 blur-3xl"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute right-1/5 bottom-1/3 h-60 w-60 rounded-full bg-clay-peach/30 blur-3xl"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute top-1/2 left-1/2 h-44 w-44 -translate-x-1/2 -translate-y-1/2 rounded-full bg-clay-mint/25 blur-3xl"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute right-1/4 bottom-1/4 h-32 w-32 rounded-full bg-clay-coral/15 blur-3xl"
            aria-hidden="true"
          />

          <div
            className={
              hasMessages
                ? "grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)_auto] overflow-hidden"
                : "flex min-h-0 flex-1 flex-col items-center justify-center gap-8 overflow-hidden px-4"
            }
          >
            {hasMessages ? (
              <div className="min-h-0 overflow-y-auto overscroll-contain">
                <MessageList
                  messages={messages}
                  bottomRef={bottomRef}
                  isLoading={isLoading}
                  onResend={handleResend}
                />
              </div>
            ) : (
              <WelcomeCard />
            )}

            <div
              className={
                hasMessages
                  ? "shrink-0 border-t border-clay-mint/40 bg-clay-canvas/85 px-4 pt-4 pb-6 backdrop-blur-sm"
                  : "w-full max-w-3xl"
              }
            >
              <ChatInput
                value={input}
                onChange={setInput}
                onSend={handleSend}
                selectedModelId={selectedModelId}
                onModelChange={handleModelChange}
                webSearchEnabled={webSearchEnabled}
                onWebSearchChange={handleWebSearchChange}
                docked={hasMessages}
                disabled={isLoading}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
