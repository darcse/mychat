export type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  isError?: boolean;
  isStreaming?: boolean;
  usedWebSearch?: boolean;
  modelId?: string;
  createdAt: number;
};

export type Conversation = {
  id: string;
  title: string;
  modelId: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  pinned?: boolean;
  titleManuallyEdited?: boolean;
};

export const CONVERSATIONS_STORAGE_KEY = "mychat-conversations";

export function deriveConversationTitle(messages: Message[]): string {
  const firstUser = messages.find((message) => message.role === "user");
  if (!firstUser) return "새 대화";

  const text = firstUser.content.trim();
  if (!text) return "새 대화";
  return text.length > 20 ? `${text.slice(0, 20)}...` : text;
}

export function toApiMessages(messages: Message[]) {
  return messages
    .filter((message) => !message.isError && !message.isStreaming)
    .map((message) => ({
      role: message.role,
      content: message.content,
    }));
}
