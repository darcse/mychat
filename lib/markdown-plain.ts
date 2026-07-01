export function stripMarkdown(markdown: string): string {
  let text = markdown;

  text = text.replace(/```[\s\S]*?```/g, (block) =>
    block.replace(/```[^\n]*\n?/g, "").replace(/```/g, "").trim(),
  );
  text = text.replace(/`([^`]+)`/g, "$1");
  text = text.replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1");
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
  text = text.replace(/^#{1,6}\s+/gm, "");
  text = text.replace(/\*\*([^*]+)\*\*/g, "$1");
  text = text.replace(/__([^_]+)__/g, "$1");
  text = text.replace(/\*([^*]+)\*/g, "$1");
  text = text.replace(/_([^_]+)_/g, "$1");
  text = text.replace(/~~([^~]+)~~/g, "$1");
  text = text.replace(/^>\s+/gm, "");
  text = text.replace(/^[-*+]\s+/gm, "");
  text = text.replace(/^\d+\.\s+/gm, "");
  text = text.replace(/^\|(.+)\|$/gm, (line) =>
    line.replace(/^\|/, "").replace(/\|$/, "").replace(/\|/g, " ").trim(),
  );
  text = text.replace(/^[-:| ]+$/gm, "");

  return text.replace(/\n{3,}/g, "\n\n").trim();
}

export function formatModelLabel(modelId: string): string {
  const slashIndex = modelId.lastIndexOf("/");
  if (slashIndex >= 0) return modelId.slice(slashIndex + 1);
  return modelId;
}
