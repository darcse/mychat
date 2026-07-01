import { extractMessageContent, stripMetadata } from "@/lib/chat-content";

export const OPENROUTER_API_URL =
  "https://openrouter.ai/api/v1/chat/completions";

export const WEB_SEARCH_TOOLS = [
  {
    type: "openrouter:web_search",
    parameters: { max_results: 5 },
  },
] as const;

export const MAX_WEB_SEARCH_TOOL_ROUNDS = 2;

type OpenRouterToolCall = {
  id: string;
  type?: string;
  function?: {
    name?: string;
    arguments?: string;
  };
};

type OpenRouterAssistantMessage = {
  role: "assistant";
  content?: string | null;
  tool_calls?: OpenRouterToolCall[];
  reasoning_details?: unknown;
};

type OpenRouterChoice = {
  finish_reason?: string | null;
  native_finish_reason?: string | null;
  message?: OpenRouterAssistantMessage;
  error?: { message?: string };
};

export type OpenRouterChatMessage = {
  role: string;
  content?: string | null;
  tool_calls?: OpenRouterToolCall[];
  tool_call_id?: string;
  reasoning_details?: unknown;
};

export function parseOpenRouterError(details: string): string {
  try {
    const parsed = JSON.parse(details) as {
      error?: { message?: string } | string;
      message?: string;
    };
    if (typeof parsed.error === "object" && parsed.error?.message) {
      return parsed.error.message;
    }
    if (typeof parsed.error === "string") return parsed.error;
    if (parsed.message) return parsed.message;
  } catch {
    // plain text fallback
  }
  return details || "OpenRouter API 요청에 실패했습니다.";
}

export function isWebSearchToolCall(toolCall: OpenRouterToolCall): boolean {
  const name = toolCall.function?.name ?? toolCall.type ?? "";
  return (
    name === "openrouter:web_search" ||
    name === "web_search" ||
    name.includes("web_search")
  );
}

function buildAssistantToolCallMessage(
  message: OpenRouterAssistantMessage,
): OpenRouterChatMessage {
  const next: OpenRouterChatMessage = {
    role: "assistant",
    content: message.content ?? "",
    tool_calls: message.tool_calls,
  };

  if (message.reasoning_details !== undefined) {
    next.reasoning_details = message.reasoning_details;
  }

  return next;
}

function buildToolResultMessage(toolCall: OpenRouterToolCall): OpenRouterChatMessage {
  return {
    role: "tool",
    tool_call_id: toolCall.id,
    content: "Web search completed.",
  };
}

export async function callOpenRouterChat(
  apiKey: string,
  body: Record<string, unknown>,
): Promise<Response> {
  return fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

export async function completeWebSearchChat(
  apiKey: string,
  model: string,
  messages: OpenRouterChatMessage[],
): Promise<{ content: string } | { error: string; status?: number }> {
  const conversation: OpenRouterChatMessage[] = messages.map((message) => ({
    ...message,
  }));

  for (let round = 0; round <= MAX_WEB_SEARCH_TOOL_ROUNDS; round++) {
    let response: Response;
    try {
      response = await callOpenRouterChat(apiKey, {
        model,
        messages: conversation,
        tools: WEB_SEARCH_TOOLS,
        stream: false,
        max_tool_calls: 3,
      });
    } catch {
      return { error: "OpenRouter API에 연결하지 못했습니다.", status: 502 };
    }

    if (!response.ok) {
      const details = await response.text();
      return {
        error: parseOpenRouterError(details),
        status: response.status,
      };
    }

    let data: { choices?: OpenRouterChoice[] };
    try {
      data = (await response.json()) as { choices?: OpenRouterChoice[] };
    } catch {
      return { error: "OpenRouter 응답을 파싱하지 못했습니다.", status: 502 };
    }

    const choice = data.choices?.[0];
    if (!choice) {
      return { error: "OpenRouter 응답 형식이 올바르지 않습니다.", status: 502 };
    }

    if (choice.error?.message) {
      return { error: choice.error.message, status: 502 };
    }

    const assistantMessage = choice.message;
    if (!assistantMessage) {
      return {
        error: "OpenRouter 응답에서 메시지를 찾을 수 없습니다.",
        status: 502,
      };
    }

    const finishReason =
      choice.finish_reason ?? choice.native_finish_reason ?? null;
    const toolCalls = assistantMessage.tool_calls ?? [];

    if (finishReason === "tool_calls" && toolCalls.length > 0) {
      if (round >= MAX_WEB_SEARCH_TOOL_ROUNDS) {
        return {
          error:
            "웹 검색 처리 시간이 초과되었습니다. 잠시 후 다시 시도해 주세요.",
          status: 504,
        };
      }

      const unsupported = toolCalls.find((toolCall) => !isWebSearchToolCall(toolCall));
      if (unsupported) {
        const toolName = unsupported.function?.name ?? unsupported.type ?? "unknown";
        return {
          error: `지원하지 않는 도구 호출입니다: ${toolName}`,
          status: 502,
        };
      }

      conversation.push(buildAssistantToolCallMessage(assistantMessage));
      for (const toolCall of toolCalls) {
        conversation.push(buildToolResultMessage(toolCall));
      }
      continue;
    }

    const extracted = extractMessageContent(assistantMessage.content);
    if (!extracted) {
      return {
        error: "웹 검색 응답에서 텍스트를 찾을 수 없습니다.",
        status: 502,
      };
    }

    return { content: stripMetadata(extracted) };
  }

  return { error: "웹 검색 응답을 완료하지 못했습니다.", status: 502 };
}

export function sseEvent(payload: Record<string, unknown> | string): string {
  const data =
    typeof payload === "string" ? payload : JSON.stringify(payload);
  return `data: ${data}\n\n`;
}

export const SSE_HEADERS = {
  "Content-Type": "text/event-stream; charset=utf-8",
  "Cache-Control": "no-cache, no-transform",
  Connection: "keep-alive",
} as const;

export function createTextEventStream(content: string): Response {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const chunkSize = 32;
      for (let index = 0; index < content.length; index += chunkSize) {
        const chunk = content.slice(index, index + chunkSize);
        controller.enqueue(encoder.encode(sseEvent({ content: chunk })));
      }
      controller.enqueue(encoder.encode(sseEvent("[DONE]")));
      controller.close();
    },
  });

  return new Response(stream, { headers: SSE_HEADERS });
}

export function createErrorEventStream(error: string): Response {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(sseEvent({ error })));
      controller.enqueue(encoder.encode(sseEvent("[DONE]")));
      controller.close();
    },
  });

  return new Response(stream, { headers: SSE_HEADERS });
}
