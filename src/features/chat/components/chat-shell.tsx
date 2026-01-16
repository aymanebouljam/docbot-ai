"use client";

import {
  FormEvent,
  KeyboardEvent,
  startTransition,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import {
  CHAT_DISCLAIMER,
  SUGGESTED_MEDICAL_PROMPTS,
} from "@/features/chat/constants";
import { mapPersistedChatMessages } from "@/features/chat/message-mappers";
import type {
  ChatListEntry,
  ChatMessage,
  PersistedChat,
} from "@/features/chat/types";
import { URGENT_MEDICAL_RESPONSE } from "@/features/medical-safety/response";

type ChatShellProps = {
  initialChatId?: string | null;
};

type CreateChatResponse = {
  chat: {
    id: string;
  };
};

type ChatResponse = {
  chat: PersistedChat;
};

type ChatListResponse = {
  chats: ChatListEntry[];
};

type PostMessageResponse = {
  userMessage: {
    id: string;
    role: "user";
    content: string;
  };
  assistantMessage: {
    id: string;
    role: "assistant";
    content: string;
  } | null;
  suggestedPrompts?: string[];
  safetyLevel?: "standard" | "urgent";
};

function isUrgentMessage(message: ChatMessage | null | undefined) {
  return (
    message?.role === "assistant" &&
    message.tone === "urgent" &&
    message.content === URGENT_MEDICAL_RESPONSE
  );
}

function buildUiMessage(input: {
  id: string;
  role: "user" | "assistant";
  content: string;
  suggestedPrompts?: string[];
  safetyLevel?: "standard" | "urgent";
}): ChatMessage {
  return {
    id: input.id,
    role: input.role,
    content: input.content,
    suggestedPrompts: input.suggestedPrompts,
    tone:
      input.role === "assistant" && input.safetyLevel === "urgent"
        ? "urgent"
        : "standard",
  };
}

export function ChatShell({ initialChatId = null }: ChatShellProps) {
  const router = useRouter();
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatId, setChatId] = useState<string | null>(initialChatId);
  const [chatList, setChatList] = useState<ChatListEntry[]>([]);
  const [isResponding, setIsResponding] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(Boolean(initialChatId));
  const [isLoadingChatList, setIsLoadingChatList] = useState(true);
  const [emergencyBanner, setEmergencyBanner] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function refreshChatList() {
    setIsLoadingChatList(true);

    try {
      const response = await fetch("/api/chats");

      if (!response.ok) {
        throw new Error("Unable to load chat list.");
      }

      const payload = (await response.json()) as ChatListResponse;
      setChatList(payload.chats);
    } catch {
      setErrorMessage((currentError) => {
        return currentError ?? "Unable to load your conversations right now.";
      });
    } finally {
      setIsLoadingChatList(false);
    }
  }

  useEffect(() => {
    void refreshChatList();
  }, []);

  useEffect(() => {
    setChatId(initialChatId);

    if (!initialChatId) {
      setMessages([]);
      setEmergencyBanner(null);
      setIsLoadingHistory(false);
      return;
    }

    let isActive = true;

    async function loadHistory() {
      setIsLoadingHistory(true);
      setErrorMessage(null);

      try {
        const response = await fetch(`/api/chats/${initialChatId}`);

        if (!response.ok) {
          throw new Error("Unable to load chat history.");
        }

        const payload = (await response.json()) as ChatResponse;

        if (!isActive) {
          return;
        }

        const nextMessages = mapPersistedChatMessages(payload.chat);
        const latestAssistantMessage = [...nextMessages]
          .reverse()
          .find((message) => message.role === "assistant");

        setMessages(nextMessages);
        setEmergencyBanner(
          isUrgentMessage(latestAssistantMessage) ? URGENT_MEDICAL_RESPONSE : null
        );
      } catch {
        if (!isActive) {
          return;
        }

        setErrorMessage("Unable to load this conversation right now.");
      } finally {
        if (isActive) {
          setIsLoadingHistory(false);
        }
      }
    }

    void loadHistory();

    return () => {
      isActive = false;
    };
  }, [initialChatId]);

  async function ensureChatSession() {
    if (chatId) {
      return chatId;
    }

    const response = await fetch("/api/chats", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      throw new Error("Unable to create a chat.");
    }

    const payload = (await response.json()) as CreateChatResponse;

    setChatId(payload.chat.id);
    await refreshChatList();
    startTransition(() => {
      router.replace(`/?chatId=${payload.chat.id}`, { scroll: false });
    });

    return payload.chat.id;
  }

  function handleStartNewChat() {
    setChatId(null);
    setMessages([]);
    setDraft("");
    setEmergencyBanner(null);
    setErrorMessage(null);
    setIsLoadingHistory(false);
    startTransition(() => {
      router.replace("/", { scroll: false });
    });
  }

  function handleSelectChat(nextChatId: string) {
    if (nextChatId === chatId) {
      return;
    }

    setErrorMessage(null);
    startTransition(() => {
      router.replace(`/?chatId=${nextChatId}`, { scroll: false });
    });
  }

  async function submitPrompt(prompt: string) {
    const trimmedPrompt = prompt.trim();

    if (!trimmedPrompt || isResponding || isLoadingHistory) {
      return;
    }

    const optimisticMessageId = crypto.randomUUID();

    setIsResponding(true);
    setErrorMessage(null);
    setMessages((currentMessages) => [
      ...currentMessages,
      {
        id: optimisticMessageId,
        role: "user",
        content: trimmedPrompt,
        tone: "standard",
      },
    ]);
    setDraft("");

    try {
      const activeChatId = await ensureChatSession();
      const response = await fetch(`/api/chats/${activeChatId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: trimmedPrompt,
        }),
      });

      if (!response.ok) {
        throw new Error("Unable to send a message.");
      }

      const payload = (await response.json()) as PostMessageResponse;
      const nextMessages = [
        buildUiMessage(payload.userMessage),
        ...(payload.assistantMessage
          ? [
              buildUiMessage({
                ...payload.assistantMessage,
                suggestedPrompts: payload.suggestedPrompts,
                safetyLevel: payload.safetyLevel,
              }),
            ]
          : []),
      ];

      setMessages((currentMessages) => [
        ...currentMessages.filter((message) => message.id !== optimisticMessageId),
        ...nextMessages,
      ]);
      setEmergencyBanner(
        payload.safetyLevel === "urgent" ? URGENT_MEDICAL_RESPONSE : null
      );
      await refreshChatList();
    } catch {
      setMessages((currentMessages) =>
        currentMessages.filter((message) => message.id !== optimisticMessageId)
      );
      setErrorMessage("Unable to send your message right now. Please try again.");
    } finally {
      setIsResponding(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submitPrompt(draft);
  }

  function handleComposerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (
      event.key !== "Enter" ||
      event.shiftKey ||
      event.nativeEvent.isComposing ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey
    ) {
      return;
    }

    event.preventDefault();
    void submitPrompt(draft);
  }

  return (
    <div className="grid min-h-screen bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.16),_transparent_35%),linear-gradient(180deg,_#f8fafc_0%,_#e0f2fe_100%)]">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-5 flex flex-col gap-4 rounded-[2rem] border border-info/20 bg-base-100/85 px-5 py-5 shadow-sm backdrop-blur md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium uppercase tracking-[0.28em] text-info">
              DocBot AI
            </p>
            <div>
              <h1 className="text-2xl font-semibold">Medical-only chat assistant</h1>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-base-content/70">
                Ask about symptoms, medications, conditions, prevention, or lab
                results in a calm, ChatGPT-style workspace.
              </p>
            </div>
          </div>

          <div className="badge badge-outline badge-info badge-lg">Slice 8</div>
        </header>

        <div className="grid flex-1 gap-5 lg:grid-cols-[0.78fr_1.22fr]">
          <aside
            className="rounded-[2rem] border border-base-300 bg-base-100/95 p-5 shadow-lg"
            aria-label="Chat sidebar"
          >
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-info">Conversations</p>
                <h2 className="mt-2 text-2xl font-semibold">Recent medical chats</h2>
              </div>
              <button
                type="button"
                className="btn btn-info btn-sm rounded-full"
                onClick={handleStartNewChat}
              >
                New chat
              </button>
            </div>

            <div className="space-y-4">
              <div className="rounded-[1.5rem] border border-base-200 bg-base-100 p-3">
                {isLoadingChatList ? (
                  <p className="text-sm text-base-content/60">Loading conversations...</p>
                ) : chatList.length === 0 ? (
                  <p className="text-sm leading-6 text-base-content/60">
                    No saved chats yet. Start with a medical question and your
                    conversation will appear here.
                  </p>
                ) : (
                  <nav className="space-y-2" aria-label="Saved conversations">
                    {chatList.map((chat) => (
                      <button
                        key={chat.id}
                        type="button"
                        aria-current={chat.id === chatId ? "page" : undefined}
                        className={`w-full rounded-[1.25rem] border px-4 py-3 text-left transition ${
                          chat.id === chatId
                            ? "border-info/40 bg-info/10"
                            : "border-base-200 bg-base-100 hover:border-info/25 hover:bg-base-200/50"
                        }`}
                        onClick={() => handleSelectChat(chat.id)}
                      >
                        <p className="text-sm font-medium leading-6">
                          {chat.title ?? "New medical chat"}
                        </p>
                        <p className="mt-1 text-xs uppercase tracking-[0.18em] text-base-content/45">
                          {chat.id === chatId ? "Current chat" : "Open chat"}
                        </p>
                      </button>
                    ))}
                  </nav>
                )}
              </div>

              <div className="rounded-[1.5rem] border border-warning/30 bg-warning/10 p-4">
                <p className="text-sm font-medium">Important disclaimer</p>
                <p className="mt-2 text-sm leading-6 text-base-content/75">
                  {CHAT_DISCLAIMER}
                </p>
              </div>

              <div className="rounded-[1.5rem] border border-base-200 bg-base-200/60 p-4">
                <p className="text-sm font-medium">Supported medical topics</p>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-base-content/75">
                  <li>Symptoms and possible causes</li>
                  <li>Medication side effects and precautions</li>
                  <li>Lab values and common interpretations</li>
                  <li>Prevention, wellness, and urgent warning signs</li>
                </ul>
              </div>

              <div className="rounded-[1.5rem] border border-base-200 bg-base-100 p-4">
                <p className="text-sm font-medium">Suggested prompts</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {SUGGESTED_MEDICAL_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      className="btn btn-sm btn-outline btn-info h-auto whitespace-normal rounded-full px-4 py-2 text-left font-normal"
                      onClick={() => setDraft(prompt)}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          <main
            className="flex min-h-[70vh] flex-col rounded-[2rem] border border-base-300 bg-base-100 shadow-xl shadow-sky-100/80"
            aria-busy={isLoadingHistory || isResponding}
          >
            {emergencyBanner ? (
              <div
                className="border-b border-error/30 bg-error/10 px-5 py-4 text-sm leading-6 text-error-content"
                role="alert"
              >
                <p className="font-semibold text-error">Urgent safety guidance</p>
                <p className="mt-1 text-base-content/80">{emergencyBanner}</p>
              </div>
            ) : null}
            {errorMessage ? (
              <div
                className="border-b border-warning/30 bg-warning/10 px-5 py-4 text-sm leading-6 text-base-content"
                role="alert"
              >
                {errorMessage}
              </div>
            ) : null}
            <div className="border-b border-base-200 px-5 py-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">
                    {chatId ? "Medical conversation" : "New medical conversation"}
                  </h2>
                  <p className="text-sm text-base-content/65">
                    {chatId
                      ? "Conversation history is loaded from local persistence."
                      : "Responses are educational and safety-first."}
                  </p>
                </div>
                <div className="badge badge-neutral badge-outline">
                  {chatId ? "Persistent chat" : "Ready to start"}
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-5">
              {isLoadingHistory ? (
                <div className="flex h-full min-h-[22rem] items-center justify-center">
                  <div
                    className="chat-bubble bg-base-200 text-base-content"
                    role="status"
                  >
                    <span className="loading loading-dots loading-md" />
                    <span className="ml-3 align-middle">
                      Loading conversation history...
                    </span>
                  </div>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex h-full min-h-[22rem] items-center justify-center">
                  <div className="max-w-xl text-center">
                    <p className="text-sm font-medium uppercase tracking-[0.22em] text-info">
                      Start here
                    </p>
                    <h3 className="mt-3 text-3xl font-semibold tracking-tight">
                      Ask a medical question to begin the chat.
                    </h3>
                    <p className="mt-3 text-base leading-7 text-base-content/70">
                      Try a symptom question, a medication question, or ask what a
                      lab result might mean.
                    </p>
                    <div className="mt-6 grid gap-3 sm:grid-cols-2">
                      {SUGGESTED_MEDICAL_PROMPTS.slice(0, 4).map((prompt) => (
                        <button
                          key={prompt}
                          type="button"
                          className="rounded-[1.4rem] border border-info/20 bg-info/5 px-4 py-4 text-left text-sm leading-6 transition hover:border-info/40 hover:bg-info/10"
                          onClick={() => setDraft(prompt)}
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <article
                      key={message.id}
                      className={`chat ${
                        message.role === "user" ? "chat-end" : "chat-start"
                      }`}
                    >
                      <div className="chat-header mb-2 px-1 text-xs uppercase tracking-[0.18em] text-base-content/45">
                        {message.role === "user" ? "You" : "DocBot AI"}
                      </div>
                      <div
                        className={`chat-bubble max-w-[85%] whitespace-pre-wrap text-sm leading-6 sm:text-base ${
                          message.role === "user"
                            ? "chat-bubble-info text-info-content"
                            : message.tone === "urgent"
                              ? "border border-error/30 bg-error/10 text-base-content"
                              : "bg-base-200 text-base-content"
                        }`}
                      >
                        {message.content}
                      </div>
                      {message.role === "assistant" &&
                      message.suggestedPrompts?.length ? (
                        <div className="mt-3 flex max-w-[85%] flex-wrap gap-2">
                          {message.suggestedPrompts.map((prompt) => (
                            <button
                              key={`${message.id}-${prompt}`}
                              type="button"
                              className="btn btn-xs btn-outline btn-info rounded-full"
                              onClick={() => setDraft(prompt)}
                            >
                              {prompt}
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </article>
                  ))}

                  {isResponding ? (
                    <article className="chat chat-start" aria-live="polite">
                      <div className="chat-header mb-2 px-1 text-xs uppercase tracking-[0.18em] text-base-content/45">
                        DocBot AI
                      </div>
                      <div
                        className="chat-bubble bg-base-200 text-base-content"
                        role="status"
                      >
                        <span className="loading loading-dots loading-md" />
                        <span className="ml-3 align-middle">
                          Drafting a medical response...
                        </span>
                      </div>
                    </article>
                  ) : null}
                </div>
              )}
            </div>

            <form
              className="border-t border-base-200 px-4 py-4 sm:px-5"
              onSubmit={handleSubmit}
            >
              <label className="mb-3 block text-sm font-medium" htmlFor="chat-input">
                Your medical question
              </label>
              <p id="chat-composer-hint" className="sr-only">
                Press Enter to send. Press Shift plus Enter to add a new line.
              </p>
              <div className="rounded-[1.7rem] border border-base-300 bg-base-100 p-3 shadow-sm">
                <textarea
                  id="chat-input"
                  className="textarea h-32 w-full resize-none border-0 bg-transparent px-2 text-base leading-7 outline-none focus:outline-none"
                  placeholder="Describe your symptom, lab result, medication question, or health concern..."
                  value={draft}
                  aria-describedby="chat-composer-hint chat-safety-hint"
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={handleComposerKeyDown}
                />
                <div className="mt-3 flex items-center justify-between gap-3 border-t border-base-200 pt-3">
                  <p
                    id="chat-safety-hint"
                    className="max-w-md text-xs leading-5 text-base-content/60"
                  >
                    If symptoms are severe, worsening, or involve trouble breathing,
                    chest pain, confusion, or loss of consciousness, seek urgent care.
                  </p>
                  <button
                    type="submit"
                    className="btn btn-info rounded-full px-6"
                    disabled={
                      draft.trim().length === 0 || isResponding || isLoadingHistory
                    }
                  >
                    Send
                  </button>
                </div>
              </div>
            </form>
          </main>
        </div>
      </div>
    </div>
  );
}
