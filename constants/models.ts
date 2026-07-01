export const MODEL_STORAGE_KEY = "mychat-model";
export const DEFAULT_MODEL_ID = "openrouter/free";

export function resolveStoredModelId(stored: string | null): string {
  return stored ?? DEFAULT_MODEL_ID;
}
