import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ChatShell } from "@/features/chat/components/chat-shell";

const replace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace,
  }),
}));

describe("chat shell", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    replace.mockReset();
    global.fetch = vi.fn(async (input) => {
      const url = typeof input === "string" ? input : input.toString();

      if (url === "/api/chats") {
        return new Response(
          JSON.stringify({
            chat: {
              id: "chat-1",
            },
          }),
          { status: 201 }
        );
      }

      if (url === "/api/chats/chat-1/messages") {
        return new Response(
          JSON.stringify({
            userMessage: {
              id: "user-1",
              role: "user",
              content: "What causes low iron?",
            },
            assistantMessage: {
              id: "assistant-1",
              role: "assistant",
              content: "Low iron is commonly linked to blood loss or poor intake.",
            },
            suggestedPrompts: [],
            safetyLevel: "standard",
          }),
          { status: 201 }
        );
      }

      return new Response(JSON.stringify({ error: "Unexpected request" }), {
        status: 404,
      });
    });
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it("renders the chat input", () => {
    render(<ChatShell />);

    expect(
      screen.getByLabelText(/your medical question/i)
    ).toBeInTheDocument();
  });

  it("disables the send button when the textarea is empty", () => {
    render(<ChatShell />);

    expect(screen.getByRole("button", { name: /send/i })).toBeDisabled();
  });

  it("shows the user message immediately after submit", async () => {
    const user = userEvent.setup();

    render(<ChatShell />);

    await user.type(
      screen.getByLabelText(/your medical question/i),
      "What causes low iron?"
    );
    await user.click(screen.getByRole("button", { name: /send/i }));

    expect(screen.getByText("What causes low iron?")).toBeInTheDocument();
    await waitFor(() =>
      expect(
        screen.getByText(/low iron is commonly linked to blood loss/i)
      ).toBeInTheDocument()
    );
  });

  it("shows a loading indicator while awaiting an assistant reply", async () => {
    let resolveMessages: ((value: Response) => void) | null = null;

    global.fetch = vi.fn(async (input) => {
      const url = typeof input === "string" ? input : input.toString();

      if (url === "/api/chats") {
        return new Response(
          JSON.stringify({
            chat: {
              id: "chat-1",
            },
          }),
          { status: 201 }
        );
      }

      if (url === "/api/chats/chat-1/messages") {
        return await new Promise<Response>((resolve) => {
          resolveMessages = resolve;
        });
      }

      return new Response(JSON.stringify({ error: "Unexpected request" }), {
        status: 404,
      });
    });

    render(<ChatShell />);

    fireEvent.change(screen.getByLabelText(/your medical question/i), {
      target: { value: "Can dehydration cause dizziness?" },
    });
    fireEvent.click(screen.getByRole("button", { name: /send/i }));

    expect(screen.getByRole("status")).toHaveTextContent(
      /drafting a medical response/i
    );

    await waitFor(() => {
      expect(resolveMessages).not.toBeNull();
    });

    resolveMessages?.(
      new Response(
        JSON.stringify({
          userMessage: {
            id: "user-2",
            role: "user",
            content: "Can dehydration cause dizziness?",
          },
          assistantMessage: {
            id: "assistant-2",
            role: "assistant",
            content: "Yes. Dehydration can sometimes contribute to dizziness.",
          },
          suggestedPrompts: [],
          safetyLevel: "standard",
        }),
        { status: 201 }
      )
    );

    await waitFor(() =>
      expect(
        screen.getByText(/dehydration can sometimes contribute to dizziness/i)
      ).toBeInTheDocument()
    );
  });

  it("loads persisted history when opened with a chat id", async () => {
    global.fetch = vi.fn(async (input) => {
      const url = typeof input === "string" ? input : input.toString();

      if (url === "/api/chats/chat-7") {
        return new Response(
          JSON.stringify({
            chat: {
              id: "chat-7",
              title: "ALT follow-up",
              messages: [
                {
                  id: "user-7",
                  role: "user",
                  content: "What does elevated ALT mean?",
                },
                {
                  id: "assistant-7",
                  role: "assistant",
                  content: "It can point to liver irritation or inflammation.",
                },
              ],
            },
          }),
          { status: 200 }
        );
      }

      return new Response(JSON.stringify({ error: "Unexpected request" }), {
        status: 404,
      });
    });

    render(<ChatShell initialChatId="chat-7" />);

    expect(screen.getByRole("status")).toHaveTextContent(
      /loading conversation history/i
    );

    await waitFor(() =>
      expect(
        screen.getByText(/it can point to liver irritation or inflammation/i)
      ).toBeInTheDocument()
    );
  });
});
