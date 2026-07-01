"use client";

import { useCallback, useState } from "react";
import { stripMetadata } from "@/lib/chat-content";
import type { Message } from "@/types/chat";
import { toApiMessages } from "@/types/chat";

type ApiChatResponse = {
  content?: string;
  error?: string;
  details?: string;
};

type UseChatOptions = {
  selectedModelId: string;
  webSearchEnabled: boolean;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  onMessagesUpdated?: (messages: Message[]) => void;
};

function formatApiError(data: ApiChatResponse): string {
  if (data.details && data.details !== data.error) {
    try {
      const parsed = JSON.parse(data.details) as {
        error?: { message?: string };
      };
      if (parsed.error?.message) {
        return parsed.error.message;
      }
    } catch {
      // use combined fallback
    }
    return `${data.error}\n${data.details}`;
  }
  return data.error ?? "알 수 없는 오류가 발생했습니다.";
}

function commitMessages(
  setMessages: UseChatOptions["setMessages"],
  onMessagesUpdated: UseChatOptions["onMessagesUpdated"],
  next: Message[],
) {
  setMessages(next);
  onMessagesUpdated?.(next);
}

function updateAssistantContent(
  setMessages: UseChatOptions["setMessages"],
  assistantId: string,
  content: string,
) {
  setMessages((prev) =>
    prev.map((message) =>
      message.id === assistantId ? { ...message, content } : message,
    ),
  );
}

async function readSseStream(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  onChunk: (content: string) => void,
  onError: (error: string) => void,
) {
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split("\n\n");
    buffer = events.pop() ?? "";

    for (const event of events) {
      const dataLine = event
        .split("\n")
        .find((line) => line.startsWith("data:"));
      if (!dataLine) continue;

      const data = dataLine.slice(5).trim();
      if (!data || data === "[DONE]") continue;

      try {
        const parsed = JSON.parse(data) as {
          content?: string;
          error?: string;
        };
        if (parsed.error) {
          onError(parsed.error);
          return;
        }
        if (parsed.content) {
          onChunk(parsed.content);
        }
      } catch {
        // skip malformed events
      }
    }
  }
}

export function useChat({
  selectedModelId,
  webSearchEnabled,
  messages,
  setMessages,
  onMessagesUpdated,
}: UseChatOptions) {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = useCallback(async (overrideContent?: string) => {
    const trimmed = (overrideContent ?? input).trim();
    if (!trimmed || isLoading) return;

    const now = Date.now();
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: overrideContent ? overrideContent.trimEnd() : input.trimEnd(),
      createdAt: now,
    };

    const conversation = [...messages, userMessage];
    const assistantId = crypto.randomUUID();
    const streamingAssistant: Message = {
      id: assistantId,
      role: "assistant",
      content: "",
      isStreaming: true,
      usedWebSearch: webSearchEnabled,
      modelId: selectedModelId,
      createdAt: Date.now(),
    };

    commitMessages(setMessages, onMessagesUpdated, [
      ...conversation,
      streamingAssistant,
    ]);
    setInput("");
    setIsLoading(true);

    let accumulated = "";
    let streamError: string | null = null;

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: selectedModelId,
          messages: toApiMessages(conversation),
          webSearch: webSearchEnabled,
        }),
      });

      const contentType = response.headers.get("content-type") ?? "";

      if (!response.ok) {
        const data = (await response.json()) as ApiChatResponse;
        const next = [
          ...conversation,
          {
            id: assistantId,
            role: "assistant" as const,
            content: formatApiError(data),
            isError: true,
            createdAt: Date.now(),
          },
        ];
        commitMessages(setMessages, onMessagesUpdated, next);
        return;
      }

      if (!contentType.includes("text/event-stream") || !response.body) {
        const data = (await response.json()) as ApiChatResponse;
        const content = data.content?.trim();
        const next = [
          ...conversation,
          {
            id: assistantId,
            role: "assistant" as const,
            content: content || "응답이 비어 있습니다.",
            isError: !content,
            createdAt: Date.now(),
          },
        ];
        commitMessages(setMessages, onMessagesUpdated, next);
        return;
      }

      await readSseStream(
        response.body.getReader(),
        (chunk) => {
          accumulated += chunk;
          updateAssistantContent(setMessages, assistantId, accumulated);
        },
        (error) => {
          streamError = error;
        },
      );

      if (streamError) {
        const next = [
          ...conversation,
          {
            id: assistantId,
            role: "assistant" as const,
            content: streamError,
            isError: true,
            createdAt: Date.now(),
          },
        ];
        commitMessages(setMessages, onMessagesUpdated, next);
        return;
      }

      const finalContent = stripMetadata(accumulated);
      if (!finalContent) {
        const next = [
          ...conversation,
          {
            id: assistantId,
            role: "assistant" as const,
            content: "응답이 비어 있습니다.",
            isError: true,
            createdAt: Date.now(),
          },
        ];
        commitMessages(setMessages, onMessagesUpdated, next);
        return;
      }

      const next = [
        ...conversation,
        {
          id: assistantId,
          role: "assistant" as const,
          content: finalContent,
          usedWebSearch: webSearchEnabled,
          modelId: selectedModelId,
          createdAt: Date.now(),
        },
      ];
      commitMessages(setMessages, onMessagesUpdated, next);
    } catch {
      const next = [
        ...conversation,
        {
          id: assistantId,
          role: "assistant" as const,
          content: "네트워크 오류가 발생했습니다. 다시 시도해 주세요.",
          isError: true,
          createdAt: Date.now(),
        },
      ];
      commitMessages(setMessages, onMessagesUpdated, next);
    } finally {
      setIsLoading(false);
    }
  }, [
    input,
    isLoading,
    messages,
    onMessagesUpdated,
    selectedModelId,
    webSearchEnabled,
    setMessages,
  ]);

  return {
    input,
    setInput,
    isLoading,
    sendMessage,
  };
}
