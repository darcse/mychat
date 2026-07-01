import type { Message } from "@/types/chat";

export function createErrorMessage(
  conversation: Message[],
  assistantId: string,
  content: string,
): Message[] {
  return [
    ...conversation,
    {
      id: assistantId,
      role: "assistant" as const,
      content,
      isError: true,
      createdAt: Date.now(),
    },
  ];
}
