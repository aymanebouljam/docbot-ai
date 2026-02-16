import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ChatShell } from "@/features/chat/components/chat-shell";

const { replace, push } = vi.hoisted(() => ({
  replace: vi.fn(),
  push: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace,
    push,
  }),
}));

describe("chat shell", () => {
  const originalFetch = global.fetch;
  const composerPlaceholder =
    /describe your symptom, lab result, medication question, or health concern/i;

  beforeEach(() => {
    replace.mockReset();
    push.mockReset();
    global.fetch = vi.fn(async (input, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input.toString();

      if (url === "/api/chats" && init?.method !== "POST") {
        return new Response(
          JSON.stringify({
            chats: [
              {
                id: "chat-1",
                title: "What causes low iron",
                updatedAt: "2026-01-30T00:00:00.000Z",
                createdAt: "2026-01-30T00:00:00.000Z",
              },
            ],
          }),
          { status: 200 }
        );
      }

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
              content:
                "Low iron is commonly linked to blood loss or poor intake.",
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

  it("renders the chat input", async () => {
    render(<ChatShell />);

    expect(
      screen.getByPlaceholderText(composerPlaceholder)
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /docbot/i })).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByPlaceholderText(/search chats/i)).toBeInTheDocument()
    );
  });

  it("collapses the sidebar into an icon rail", async () => {
    render(<ChatShell />);

    fireEvent.click(screen.getByRole("button", { name: /collapse sidebar/i }));

    expect(
      screen.queryByPlaceholderText(/search chats/i)
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /expand sidebar/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /new chat/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /search chats/i })
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
      screen.getByPlaceholderText(composerPlaceholder),
      "What causes low iron?"
    );
    await user.click(screen.getByRole("button", { name: /send message/i }));

    expect(screen.getByText("What causes low iron?")).toBeInTheDocument();
    await waitFor(() =>
      expect(
        screen.getByText(/low iron is commonly linked to blood loss/i)
      ).toBeInTheDocument()
    );
  });

  it("submits from Enter and keeps Shift+Enter for multiline input", async () => {
    const user = userEvent.setup();

    render(<ChatShell />);

    const textarea = screen.getByPlaceholderText(composerPlaceholder);

    await user.type(textarea, "What causes low iron?");
    fireEvent.keyDown(textarea, {
      key: "Enter",
    });

    await waitFor(() =>
      expect(
        screen.getByText(/low iron is commonly linked to blood loss/i)
      ).toBeInTheDocument()
    );

    fireEvent.change(textarea, {
      target: { value: "Line one" },
    });
    fireEvent.keyDown(textarea, {
      key: "Enter",
      shiftKey: true,
    });

    expect(screen.getByDisplayValue("Line one")).toBeInTheDocument();
  });

  it("shows a loading indicator while awaiting an assistant reply", async () => {
    let resolveMessages: ((value: Response) => void) | null = null;

    global.fetch = vi.fn(async (input, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input.toString();

      if (url === "/api/chats" && init?.method !== "POST") {
        return new Response(
          JSON.stringify({
            chats: [],
          }),
          { status: 200 }
        );
      }

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

    fireEvent.change(screen.getByPlaceholderText(composerPlaceholder), {
      target: { value: "Can dehydration cause dizziness?" },
    });
    fireEvent.click(screen.getByRole("button", { name: /send message/i }));

    expect(screen.getByRole("status")).toHaveTextContent(
      /drafting a medical response/i
    );

    await waitFor(() => {
      expect(resolveMessages).not.toBeNull();
    });

    if (!resolveMessages) {
      throw new Error("Expected pending message resolver to exist.");
    }

    const resolvePendingMessages: (value: Response) => void = resolveMessages;

    resolvePendingMessages(
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

      if (url === "/api/chats") {
        return new Response(
          JSON.stringify({
            chats: [
              {
                id: "chat-7",
                title: "ALT follow-up",
                updatedAt: "2026-01-30T00:00:00.000Z",
                createdAt: "2026-01-30T00:00:00.000Z",
              },
            ],
          }),
          { status: 200 }
        );
      }

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

  it("renders chats in the sidebar and opens the selected conversation", async () => {
    global.fetch = vi.fn(async (input) => {
      const url = typeof input === "string" ? input : input.toString();

      if (url === "/api/chats") {
        return new Response(
          JSON.stringify({
            chats: [
              {
                id: "chat-10",
                title: "What causes anemia",
                updatedAt: "2026-01-30T00:00:00.000Z",
                createdAt: "2026-01-30T00:00:00.000Z",
              },
              {
                id: "chat-11",
                title: "High blood pressure follow-up",
                updatedAt: "2026-01-29T00:00:00.000Z",
                createdAt: "2026-01-29T00:00:00.000Z",
              },
            ],
          }),
          { status: 200 }
        );
      }

      if (url === "/api/chats/chat-11") {
        return new Response(
          JSON.stringify({
            chat: {
              id: "chat-11",
              title: "High blood pressure follow-up",
              messages: [
                {
                  id: "user-11",
                  role: "user",
                  content: "My blood pressure is 150/95. Is that high?",
                },
                {
                  id: "assistant-11",
                  role: "assistant",
                  content:
                    "Yes. That reading is elevated and should be reviewed.",
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

    render(<ChatShell />);

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /^What causes anemia$/i })
      ).toBeInTheDocument()
    );

    fireEvent.click(
      screen.getByRole("button", { name: /^High blood pressure follow-up$/i })
    );

    expect(replace).toHaveBeenCalledWith("/?chatId=chat-11", { scroll: false });
  });

  it("deletes a saved conversation from the sidebar trash action", async () => {
    const chats = [
      {
        id: "chat-10",
        title: "What causes anemia",
        updatedAt: "2026-01-30T00:00:00.000Z",
        createdAt: "2026-01-30T00:00:00.000Z",
      },
    ];

    global.fetch = vi.fn(async (input, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input.toString();

      if (url === "/api/chats" && init?.method !== "DELETE") {
        return new Response(JSON.stringify({ chats }), { status: 200 });
      }

      if (url === "/api/chats/chat-10" && init?.method === "DELETE") {
        chats.splice(0, chats.length);
        return new Response(
          JSON.stringify({
            chat: {
              id: "chat-10",
              title: "What causes anemia",
            },
          }),
          { status: 200 }
        );
      }

      return new Response(JSON.stringify({ error: "Unexpected request" }), {
        status: 404,
      });
    });

    render(<ChatShell />);

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /^What causes anemia$/i })
      ).toBeInTheDocument()
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: /delete conversation what causes anemia/i,
      })
    );

    expect(
      screen.getByRole("dialog", { name: /delete conversation/i })
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /^delete$/i }));

    await waitFor(() =>
      expect(
        screen.queryByRole("button", { name: /^What causes anemia$/i })
      ).not.toBeInTheDocument()
    );
  });

  it("marks the active conversation for assistive technology", async () => {
    global.fetch = vi.fn(async (input) => {
      const url = typeof input === "string" ? input : input.toString();

      if (url === "/api/chats") {
        return new Response(
          JSON.stringify({
            chats: [
              {
                id: "chat-7",
                title: "ALT follow-up",
                updatedAt: "2026-01-30T00:00:00.000Z",
                createdAt: "2026-01-30T00:00:00.000Z",
              },
            ],
          }),
          { status: 200 }
        );
      }

      if (url === "/api/chats/chat-7") {
        return new Response(
          JSON.stringify({
            chat: {
              id: "chat-7",
              title: "ALT follow-up",
              messages: [],
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

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /^ALT follow-up$/i })
      ).toHaveAttribute("aria-current", "page")
    );
  });

  it("filters chats from the search field", async () => {
    global.fetch = vi.fn(async (input) => {
      const url = typeof input === "string" ? input : input.toString();

      if (url === "/api/chats") {
        return new Response(
          JSON.stringify({
            chats: [
              {
                id: "chat-10",
                title: "What causes anemia",
                updatedAt: "2026-01-30T00:00:00.000Z",
                createdAt: "2026-01-30T00:00:00.000Z",
              },
              {
                id: "chat-11",
                title: "High blood pressure follow-up",
                updatedAt: "2026-01-29T00:00:00.000Z",
                createdAt: "2026-01-29T00:00:00.000Z",
              },
            ],
          }),
          { status: 200 }
        );
      }

      return new Response(JSON.stringify({ error: "Unexpected request" }), {
        status: 404,
      });
    });

    render(<ChatShell />);

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /^What causes anemia$/i })
      ).toBeInTheDocument()
    );

    fireEvent.change(screen.getByPlaceholderText(/search chats/i), {
      target: { value: "pressure" },
    });

    expect(
      screen.queryByRole("button", { name: /^What causes anemia$/i })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^High blood pressure follow-up$/i })
    ).toBeInTheDocument();
  });

  it("shows the profile menu from the settings button", async () => {
    render(<ChatShell />);

    fireEvent.click(
      screen.getByRole("button", { name: /your account settings/i })
    );

    expect(
      screen.getByRole("menu", { name: /profile menu/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("menuitem", { name: /profile/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("menuitem", { name: /logout/i })
    ).toBeInTheDocument();
  });

  it("downloads the current conversation transcript", async () => {
    const createObjectUrl = vi.fn(() => "blob:test-download");
    const revokeObjectUrl = vi.fn();
    const anchorClick = vi.fn();
    let downloadAnchor: HTMLAnchorElement | undefined;
    const originalCreateObjectURL = URL.createObjectURL;
    const originalRevokeObjectURL = URL.revokeObjectURL;
    const originalCreateElement = document.createElement.bind(document);

    URL.createObjectURL = createObjectUrl;
    URL.revokeObjectURL = revokeObjectUrl;
    document.createElement = vi.fn((tagName: string) => {
      const element = originalCreateElement(tagName);

      if (tagName === "a") {
        element.click = anchorClick;
        downloadAnchor = element as HTMLAnchorElement;
      }

      return element;
    }) as typeof document.createElement;

    global.fetch = vi.fn(async (input) => {
      const url = typeof input === "string" ? input : input.toString();

      if (url === "/api/chats") {
        return new Response(
          JSON.stringify({
            chats: [
              {
                id: "chat-7",
                title: "ALT follow-up",
                updatedAt: "2026-03-30T00:00:00.000Z",
                createdAt: "2026-03-30T00:00:00.000Z",
              },
            ],
          }),
          { status: 200 }
        );
      }

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

    await waitFor(() =>
      expect(
        screen.getByText(/it can point to liver irritation or inflammation/i)
      ).toBeInTheDocument()
    );

    fireEvent.click(
      screen.getByRole("button", { name: /download conversation/i })
    );

    expect(createObjectUrl).toHaveBeenCalledOnce();
    expect(anchorClick).toHaveBeenCalledOnce();

    if (!downloadAnchor) {
      throw new Error("Expected download anchor to be created.");
    }

    expect(downloadAnchor.download).toBe("alt-follow-up.txt");
    expect(revokeObjectUrl).toHaveBeenCalledWith("blob:test-download");

    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
    document.createElement = originalCreateElement;
  });

  it("opens the profile page from the profile menu", async () => {
    render(<ChatShell />);

    fireEvent.click(
      screen.getByRole("button", { name: /your account settings/i })
    );
    fireEvent.click(screen.getByRole("menuitem", { name: /profile/i }));

    expect(push).toHaveBeenCalledWith("/profile");
  });

  it("routes to sign in from the profile menu logout action", async () => {
    render(<ChatShell />);

    fireEvent.click(
      screen.getByRole("button", { name: /your account settings/i })
    );
    fireEvent.click(screen.getByRole("menuitem", { name: /logout/i }));

    expect(push).toHaveBeenCalledWith("/sign-in");
  });

  it("deletes all conversations from the settings menu", async () => {
    const chats = [
      {
        id: "chat-7",
        title: "ALT follow-up",
        updatedAt: "2026-03-30T00:00:00.000Z",
        createdAt: "2026-03-30T00:00:00.000Z",
      },
    ];

    global.fetch = vi.fn(async (input, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input.toString();

      if (
        url === "/api/chats" &&
        init?.method !== "POST" &&
        init?.method !== "DELETE"
      ) {
        return new Response(JSON.stringify({ chats }), { status: 200 });
      }

      if (url === "/api/chats" && init?.method === "DELETE") {
        chats.splice(0, chats.length);
        return new Response(JSON.stringify({ deletedCount: 1 }), {
          status: 200,
        });
      }

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

    await waitFor(() =>
      expect(
        screen.getByText(/what does elevated ALT mean/i)
      ).toBeInTheDocument()
    );

    fireEvent.click(
      screen.getByRole("button", { name: /your account settings/i })
    );
    fireEvent.click(
      screen.getByRole("menuitem", { name: /delete all conversations/i })
    );

    expect(
      screen.getByRole("dialog", { name: /delete all conversations/i })
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /^delete$/i }));

    await waitFor(() =>
      expect(replace).toHaveBeenCalledWith("/", { scroll: false })
    );
    await waitFor(() =>
      expect(
        screen.getByRole("heading", {
          name: /ask a medical question to begin the chat/i,
        })
      ).toBeInTheDocument()
    );
  });

  it("starts a new chat from the sidebar action", async () => {
    global.fetch = vi.fn(async (input) => {
      const url = typeof input === "string" ? input : input.toString();

      if (url === "/api/chats") {
        return new Response(
          JSON.stringify({
            chats: [
              {
                id: "chat-7",
                title: "ALT follow-up",
                updatedAt: "2026-01-30T00:00:00.000Z",
                createdAt: "2026-01-30T00:00:00.000Z",
              },
            ],
          }),
          { status: 200 }
        );
      }

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

    await waitFor(() =>
      expect(
        screen.getByText(/what does elevated ALT mean/i)
      ).toBeInTheDocument()
    );

    fireEvent.click(screen.getByRole("button", { name: /new chat/i }));

    expect(replace).toHaveBeenCalledWith("/", { scroll: false });
    await waitFor(() =>
      expect(
        screen.getByRole("heading", {
          name: /ask a medical question to begin the chat/i,
        })
      ).toBeInTheDocument()
    );
  });

  it("deletes the active conversation from the header menu", async () => {
    global.fetch = vi.fn(async (input, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input.toString();

      if (url === "/api/chats" && init?.method !== "DELETE") {
        return new Response(
          JSON.stringify({
            chats: [
              {
                id: "chat-7",
                title: "ALT follow-up",
                updatedAt: "2026-01-30T00:00:00.000Z",
                createdAt: "2026-01-30T00:00:00.000Z",
              },
            ],
          }),
          { status: 200 }
        );
      }

      if (url === "/api/chats/chat-7") {
        if (init?.method === "DELETE") {
          return new Response(
            JSON.stringify({
              chat: {
                id: "chat-7",
                title: "ALT follow-up",
              },
            }),
            { status: 200 }
          );
        }

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

    await waitFor(() =>
      expect(
        screen.getByText(/what does elevated ALT mean/i)
      ).toBeInTheDocument()
    );

    fireEvent.click(
      screen.getByRole("button", { name: /current conversation actions/i })
    );
    fireEvent.click(
      screen.getByRole("menuitem", { name: /delete conversation/i })
    );
    expect(
      screen.getByRole("dialog", { name: /delete conversation/i })
    ).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalledWith("/", { scroll: false });
    fireEvent.click(screen.getByRole("button", { name: /^delete$/i }));

    await waitFor(() =>
      expect(replace).toHaveBeenCalledWith("/", { scroll: false })
    );
    await waitFor(() =>
      expect(
        screen.getByRole("heading", {
          name: /ask a medical question to begin the chat/i,
        })
      ).toBeInTheDocument()
    );
  });

  it("cancels conversation deletion from the confirmation modal", async () => {
    global.fetch = vi.fn(async (input, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input.toString();

      if (url === "/api/chats" && init?.method !== "DELETE") {
        return new Response(
          JSON.stringify({
            chats: [
              {
                id: "chat-7",
                title: "ALT follow-up",
                updatedAt: "2026-01-30T00:00:00.000Z",
                createdAt: "2026-01-30T00:00:00.000Z",
              },
            ],
          }),
          { status: 200 }
        );
      }

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

    await waitFor(() =>
      expect(
        screen.getByText(/what does elevated ALT mean/i)
      ).toBeInTheDocument()
    );

    fireEvent.click(
      screen.getByRole("button", { name: /current conversation actions/i })
    );
    fireEvent.click(
      screen.getByRole("menuitem", { name: /delete conversation/i })
    );

    expect(
      screen.getByRole("dialog", { name: /delete conversation/i })
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));

    expect(
      screen.queryByRole("dialog", { name: /delete conversation/i })
    ).not.toBeInTheDocument();
    expect(replace).not.toHaveBeenCalledWith("/", { scroll: false });
    expect(
      screen.getByText(/what does elevated ALT mean/i)
    ).toBeInTheDocument();
  });
});
