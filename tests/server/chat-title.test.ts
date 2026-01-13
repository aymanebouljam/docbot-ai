import { buildChatTitleFromMessage } from "@/server/chat-title";

describe("chat title builder", () => {
  it("builds a trimmed readable title from the first user message", () => {
    expect(
      buildChatTitleFromMessage("  What does elevated ALT usually mean?  ")
    ).toBe("What does elevated ALT usually mean");
  });

  it("truncates very long titles safely", () => {
    expect(
      buildChatTitleFromMessage(
        "This is a very long medical question that should be shortened before it becomes a sidebar title for the chat list"
      )
    ).toMatch(/…$/);
  });
});
