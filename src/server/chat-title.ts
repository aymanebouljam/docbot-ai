const MAX_CHAT_TITLE_LENGTH = 60;

function normalizeWhitespace(input: string) {
  return input.replace(/\s+/g, " ").trim();
}

export function buildChatTitleFromMessage(content: string) {
  const normalized = normalizeWhitespace(content)
    .replace(/^["'`]+|["'`]+$/g, "")
    .replace(/[.?!,:;\-–—\s]+$/g, "");

  if (!normalized) {
    return "New medical chat";
  }

  if (normalized.length <= MAX_CHAT_TITLE_LENGTH) {
    return normalized;
  }

  return `${normalized.slice(0, MAX_CHAT_TITLE_LENGTH - 1).trimEnd()}…`;
}
