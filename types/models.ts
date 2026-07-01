export type ModelCategory =
  | "무료"
  | "자동"
  | "Frontier"
  | "가성비"
  | "초고속";

export type ModelOption = {
  id: string;
  name: string;
  category: ModelCategory;
  free: boolean;
  price: string | null;
};

export const CATEGORY_ORDER: ModelCategory[] = [
  "무료",
  "자동",
  "Frontier",
  "가성비",
  "초고속",
];

export type ModelsResponse = {
  models: ModelOption[];
};

export function formatPriceLabel(price: string): string {
  const parts = price.split(" / ").map((part) => part.trim());
  if (parts.length === 2) {
    return `입력 ${parts[0]} / 출력 ${parts[1]} per 1M`;
  }
  return price;
}

export function groupModelsByCategory(
  models: ModelOption[],
): Record<ModelCategory, ModelOption[]> {
  const grouped = Object.fromEntries(
    CATEGORY_ORDER.map((category) => [category, [] as ModelOption[]]),
  ) as Record<ModelCategory, ModelOption[]>;

  for (const model of models) {
    grouped[model.category].push(model);
  }

  return grouped;
}
