import { NextRequest, NextResponse } from "next/server";
import { extractMessageContent } from "@/lib/chat-content";
import {
  completeWebSearchChat,
  createErrorEventStream,
  createTextEventStream,
  OPENROUTER_API_URL,
  parseOpenRouterError,
  sseEvent,
  SSE_HEADERS,
} from "@/lib/openrouter-chat";

const VALID_ROLES = new Set(["user", "assistant", "system"]);

type ChatMessage = {
  role: string;
  content: string;
};

export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "OPENROUTER_API_KEY가 설정되지 않았습니다. .env.local에 유효한 키를 입력하세요.",
      },
      { status: 400 },
    );
  }

  if (!/^[\x21-\x7E]+$/.test(apiKey)) {
    return NextResponse.json(
      {
        error:
          "OPENROUTER_API_KEY가 유효하지 않습니다. .env.local의 플레이스홀더를 OpenRouter에서 발급받은 실제 키로 교체하세요.",
      },
      { status: 400 },
    );
  }

  let body: {
    messages?: ChatMessage[];
    model?: string;
    webSearch?: boolean;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "유효하지 않은 JSON 요청입니다." },
      { status: 400 },
    );
  }

  const { messages, model, webSearch } = body;

  if (!model?.trim()) {
    return NextResponse.json(
      { error: "model은 필수입니다." },
      { status: 400 },
    );
  }

  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json(
      { error: "messages 배열이 비어 있습니다." },
      { status: 400 },
    );
  }

  const sanitizedMessages: ChatMessage[] = [];
  for (const message of messages) {
    if (!message?.role || !VALID_ROLES.has(message.role)) {
      return NextResponse.json(
        { error: "messages의 role은 user, assistant, system만 허용됩니다." },
        { status: 400 },
      );
    }
    if (typeof message.content !== "string" || !message.content.trim()) {
      return NextResponse.json(
        { error: "messages의 content는 비어 있을 수 없습니다." },
        { status: 400 },
      );
    }
    sanitizedMessages.push({
      role: message.role,
      content: message.content,
    });
  }

  if (webSearch) {
    const result = await completeWebSearchChat(apiKey, model, sanitizedMessages);
    if ("error" in result) {
      return createErrorEventStream(result.error);
    }
    return createTextEventStream(result.content);
  }

  let response: Response;
  try {
    response = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: sanitizedMessages,
        stream: true,
      }),
    });
  } catch {
    return NextResponse.json(
      { error: "OpenRouter API에 연결하지 못했습니다." },
      { status: 502 },
    );
  }

  if (!response.ok) {
    const details = await response.text();
    return NextResponse.json(
      {
        error: parseOpenRouterError(details),
        details,
      },
      { status: response.status },
    );
  }

  if (!response.body) {
    return NextResponse.json(
      { error: "OpenRouter 스트림 응답을 받지 못했습니다." },
      { status: 502 },
    );
  }

  const upstream = response.body;
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  const stream = new ReadableStream({
    async start(controller) {
      const reader = upstream.getReader();
      let buffer = "";

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data:")) continue;

            const data = trimmed.slice(5).trim();
            if (!data || data === "[DONE]") continue;

            try {
              const parsed = JSON.parse(data) as {
                choices?: Array<{ delta?: { content?: unknown } }>;
                error?: { message?: string };
              };

              if (parsed.error?.message) {
                controller.enqueue(
                  encoder.encode(sseEvent({ error: parsed.error.message })),
                );
                continue;
              }

              const chunk = extractMessageContent(
                parsed.choices?.[0]?.delta?.content,
              );
              if (chunk) {
                controller.enqueue(encoder.encode(sseEvent({ content: chunk })));
              }
            } catch {
              // skip malformed SSE chunks
            }
          }
        }
      } catch {
        controller.enqueue(
          encoder.encode(
            sseEvent({ error: "스트림 수신 중 오류가 발생했습니다." }),
          ),
        );
      } finally {
        controller.enqueue(encoder.encode(sseEvent("[DONE]")));
        controller.close();
        reader.releaseLock();
      }
    },
  });

  return new Response(stream, { headers: SSE_HEADERS });
}
