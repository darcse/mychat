import { NextResponse } from "next/server";
import type { ModelOption } from "@/types/models";

export const revalidate = 3600;

const MODELS: ModelOption[] = [
  // 무료
  {
    id: "openrouter/free",
    name: "Auto (무료)",
    category: "무료",
    free: true,
    price: null,
  },
  // 자동
  {
    id: "openrouter/auto",
    name: "Auto (유료)",
    category: "자동",
    free: false,
    price: null,
  },
  {
    id: "openai/gpt-latest",
    name: "GPT Latest",
    category: "자동",
    free: false,
    price: null,
  },
  {
    id: "openai/gpt-mini-latest",
    name: "GPT Mini Latest",
    category: "자동",
    free: false,
    price: null,
  },
  // Frontier
  {
    id: "anthropic/claude-opus-4.7",
    name: "Claude Opus 4.7",
    category: "Frontier",
    free: false,
    price: "$5 / $25",
  },
  // 가성비
  {
    id: "anthropic/claude-sonnet-4.6",
    name: "Claude Sonnet 4.6",
    category: "가성비",
    free: false,
    price: "$3 / $15",
  },
  {
    id: "google/gemini-2.5-flash-lite",
    name: "Gemini 2.5 Flash Lite",
    category: "가성비",
    free: false,
    price: "$0.10 / $0.40",
  },
  {
    id: "deepseek/deepseek-v4-flash",
    name: "DeepSeek V4 Flash",
    category: "가성비",
    free: false,
    price: "$0.14 / $0.28",
  },
  // 초고속
  {
    id: "anthropic/claude-haiku-4.5",
    name: "Claude Haiku 4.5",
    category: "초고속",
    free: false,
    price: "$1 / $5",
  },
  {
    id: "deepseek/deepseek-v4-pro",
    name: "DeepSeek V4 Pro",
    category: "초고속",
    free: false,
    price: "$0.44 / $0.87",
  },
];

export async function GET() {
  return NextResponse.json({ models: MODELS });
}
