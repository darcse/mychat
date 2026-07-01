export const WEB_SEARCH_STORAGE_KEY = "mychat-web-search";

export function resolveStoredWebSearch(stored: string | null): boolean {
  return stored === "true";
}
