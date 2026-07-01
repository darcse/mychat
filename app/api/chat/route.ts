import { NextRequest, NextResponse } from "next/server";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

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

  let body: { message?: string; model?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "유효하지 않은 JSON 요청입니다." },
      { status: 400 },
    );
  }

  const { message, model } = body;
  if (!message?.trim() || !model?.trim()) {
    return NextResponse.json(
      { error: "message와 model은 필수입니다." },
      { status: 400 },
    );
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
        messages: [{ role: "user", content: message }],
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
      { error: "OpenRouter API 요청에 실패했습니다.", details },
      { status: response.status },
    );
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content;

  if (typeof content !== "string") {
    return NextResponse.json(
      { error: "OpenRouter 응답에서 텍스트를 찾을 수 없습니다." },
      { status: 502 },
    );
  }

  return NextResponse.json({ content });
}
