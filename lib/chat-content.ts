const METADATA_LINE_PATTERN =
  /^(User Safety|Content-Type|Safety|Moderation|Category|Finish Reason|Model|Provider):/i;

export function extractMessageContent(content: unknown): string | null {
  if (typeof content === "string") return content;

  if (Array.isArray(content)) {
    const parts = content
      .map((part) => {
        if (typeof part === "string") return part;
        if (!part || typeof part !== "object") return "";

        const record = part as Record<string, unknown>;
        if (typeof record.text === "string") return record.text;
        if (typeof record.content === "string") return record.content;
        return "";
      })
      .filter(Boolean);

    return parts.length > 0 ? parts.join("\n") : null;
  }

  if (content && typeof content === "object") {
    const record = content as Record<string, unknown>;
    if (typeof record.text === "string") return record.text;
    if (typeof record.content === "string") return record.content;
  }

  return null;
}

export function stripMetadata(text: string): string {
  return text
    .split("\n")
    .filter((line) => !METADATA_LINE_PATTERN.test(line.trim()))
    .join("\n")
    .replace(/\b(User Safety|Content-Type):\s*[^\n]+/gi, "")
    .trim();
}
