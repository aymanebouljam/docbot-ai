"use client";

import {
  FormEvent,
  KeyboardEvent,
  useRef,
  useDeferredValue,
  startTransition,
  useEffect,
  useState,
} from "react";
import {
  Download,
  PanelLeft,
  SendHorizontal,
  Settings,
  Stethoscope,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

import { SUGGESTED_MEDICAL_PROMPTS } from "@/features/chat/constants";
import { mapPersistedChatMessages } from "@/features/chat/message-mappers";
import type {
  ChatListEntry,
  ChatMessage,
  PersistedChat,
} from "@/features/chat/types";
import { URGENT_MEDICAL_RESPONSE } from "@/features/medical-safety/response";

type ChatShellProps = {
  initialChatId?: string | null;
  currentUserEmail?: string;
  currentUserName?: string;
  currentUserImage?: string;
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

export function ChatShell({
  initialChatId = null,
  currentUserEmail,
  currentUserName,
  currentUserImage,
}: ChatShellProps) {
  const router = useRouter();
  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatId, setChatId] = useState<string | null>(initialChatId);
  const [chatList, setChatList] = useState<ChatListEntry[]>([]);
  const [chatSearch, setChatSearch] = useState("");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isResponding, setIsResponding] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(Boolean(initialChatId));
  const [isLoadingChatList, setIsLoadingChatList] = useState(true);
  const [emergencyBanner, setEmergencyBanner] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const deferredChatSearch = useDeferredValue(chatSearch);
  const normalizedChatSearch = deferredChatSearch.trim().toLowerCase();
  const fallbackAccountLabel =
    currentUserName?.trim() ||
    currentUserEmail?.split("@")[0]?.replace(/[._-]+/g, " ") ||
    "Your account";
  const filteredChats = chatList.filter((chat) => {
    if (!normalizedChatSearch) {
      return true;
    }

    return (chat.title ?? "New medical chat")
      .toLowerCase()
      .includes(normalizedChatSearch);
  });

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
    function handlePointerDown(event: MouseEvent) {
      if (!isProfileMenuOpen) {
        return;
      }

      if (profileMenuRef.current?.contains(event.target as Node)) {
        return;
      }

      setIsProfileMenuOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [isProfileMenuOpen]);

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
    setChatSearch("");
    setIsProfileMenuOpen(false);
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

    setIsProfileMenuOpen(false);
    setErrorMessage(null);
    startTransition(() => {
      router.replace(`/?chatId=${nextChatId}`, { scroll: false });
    });
  }

  function toggleSidebar() {
    setIsProfileMenuOpen(false);
    setIsSidebarCollapsed((currentState) => !currentState);
  }

  function getInitials(label: string) {
    return label
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("");
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
    <div className="grid min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.16),_transparent_35%),linear-gradient(180deg,_#f7fcfa_0%,_#dcfce7_100%)]">
      <div className="flex min-h-screen w-full flex-col">
        <div
          className={`grid min-h-screen flex-1 ${
            isSidebarCollapsed
              ? "lg:grid-cols-[88px_minmax(0,1fr)]"
              : "lg:grid-cols-[320px_minmax(0,1fr)]"
          }`}
        >
          <aside
            className={`group/sidebar flex min-h-screen flex-col border-r border-[#c9e3df] bg-[linear-gradient(180deg,_rgba(233,247,246,0.98)_0%,_rgba(203,232,228,0.98)_100%)] shadow-lg transition-all ${
              isSidebarCollapsed ? "px-2 py-2" : "px-3 py-2.5"
            }`}
            aria-label="Chat sidebar"
          >
            <div className={`mb-4 ${isSidebarCollapsed ? "px-0.5" : "px-0.5 py-0.5"}`}>
              <div
                className={`group/logo relative flex ${
                  isSidebarCollapsed ? "justify-center" : "items-center justify-between"
                }`}
              >
                {isSidebarCollapsed ? (
                  <div className="group/logo relative h-12 w-12">
                    <div className="grid h-12 w-12 place-items-center text-emerald-600 transition-opacity group-hover/logo:opacity-0 group-focus-within/logo:opacity-0">
                      <Stethoscope />
                    </div>
                    <button
                      type="button"
                      className="pointer-events-none absolute inset-0 m-auto grid h-11 w-11 place-items-center rounded-[0.65rem] border border-base-300 bg-base-100 text-base-content opacity-0 shadow-sm transition-opacity group-hover/logo:pointer-events-auto group-hover/logo:opacity-100 group-focus-within/logo:pointer-events-auto group-focus-within/logo:opacity-100 focus-visible:pointer-events-auto focus-visible:opacity-100"
                      aria-label="Expand sidebar"
                      onClick={toggleSidebar}
                    >
                      <PanelLeft aria-hidden="true" className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="grid h-12 w-12 place-items-center text-emerald-600">
                    <Stethoscope />
                  </div>
                )}
                <button
                  type="button"
                  className={`grid h-11 w-11 place-items-center rounded-[0.65rem] text-base-content transition ${
                    isSidebarCollapsed ? "hidden" : "opacity-100"
                  }`}
                  aria-label="Collapse sidebar"
                  onClick={toggleSidebar}
                >
                  <span className="grid h-11 w-11 place-items-center rounded-[0.65rem] border border-transparent transition hover:bg-base-100 hover:shadow-sm">
                    <PanelLeft aria-hidden="true" className="h-4 w-4" />
                  </span>
                </button>
              </div>
            </div>

            <div className="mb-4 px-1">
              <button
                type="button"
                aria-label="New chat"
                className={`btn rounded-full border-0 bg-emerald-600 text-white hover:bg-emerald-700 ${
                  isSidebarCollapsed ? "btn-square w-full" : "w-full"
                }`}
                onClick={handleStartNewChat}
              >
                {isSidebarCollapsed ? (
                  <svg
                    aria-hidden="true"
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 5v14" />
                    <path d="M5 12h14" />
                  </svg>
                ) : (
                  "+ New chat"
                )}
              </button>
            </div>

            <div className="flex-1 space-y-4 px-1">
              {isSidebarCollapsed ? (
                <div className="space-y-3">
                  <button
                    type="button"
                    aria-label="Search chats"
                    className="btn btn-ghost btn-square w-full rounded-2xl border border-base-200 bg-base-100"
                    onClick={() => setIsSidebarCollapsed(false)}
                  >
                    <svg
                      aria-hidden="true"
                      className="h-5 w-5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="11" cy="11" r="7" />
                      <path d="m21 21-4.3-4.3" />
                    </svg>
                  </button>
                  <div className="rounded-[1.5rem] border border-base-200 bg-base-100 p-2">
                    <p className="mb-2 text-center text-[10px] font-medium uppercase tracking-[0.2em] text-base-content/45">
                      Chats
                    </p>
                    {isLoadingChatList ? (
                      <div className="flex justify-center py-2">
                        <span className="loading loading-spinner loading-sm" />
                      </div>
                    ) : filteredChats.length === 0 ? (
                      <div className="flex justify-center py-2">
                        <span className="text-xs text-base-content/45">0</span>
                      </div>
                    ) : (
                      <nav className="space-y-2" aria-label="Saved conversations">
                        {filteredChats.map((chat) => (
                          <button
                            key={chat.id}
                            type="button"
                            aria-label={chat.title ?? "New medical chat"}
                            aria-current={chat.id === chatId ? "page" : undefined}
                            className={`btn btn-square w-full rounded-2xl border ${
                              chat.id === chatId
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                : "border-base-200 bg-base-100"
                            }`}
                            onClick={() => handleSelectChat(chat.id)}
                          >
                            <svg
                              aria-hidden="true"
                              className="h-5 w-5"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                            </svg>
                          </button>
                        ))}
                      </nav>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  <label className="input input-bordered flex items-center gap-2 rounded-full border-base-200 bg-base-100">
                    <svg
                      aria-hidden="true"
                      className="h-4 w-4 opacity-60"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="11" cy="11" r="7" />
                      <path d="m21 21-4.3-4.3" />
                    </svg>
                    <input
                      type="text"
                      className="grow"
                      placeholder="Search chats"
                      value={chatSearch}
                      onChange={(event) => setChatSearch(event.target.value)}
                    />
                  </label>

                  <div className="rounded-[1.5rem] border border-base-200 bg-base-100 p-3">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <p className="text-xs font-medium uppercase tracking-[0.18em] text-base-content/45">
                        Your chats
                      </p>
                      <p className="text-xs text-base-content/45">
                        {filteredChats.length}
                      </p>
                    </div>
                    {isLoadingChatList ? (
                      <p className="text-sm text-base-content/60">Loading conversations...</p>
                    ) : filteredChats.length === 0 ? (
                      chatSearch.trim() ? (
                        <p className="text-sm leading-6 text-base-content/60">
                          No chats match that search yet.
                        </p>
                      ) : null
                    ) : (
                      <nav className="space-y-2" aria-label="Saved conversations">
                        {filteredChats.map((chat) => (
                          <button
                            key={chat.id}
                            type="button"
                            aria-current={chat.id === chatId ? "page" : undefined}
                            className={`w-full rounded-[1.25rem] border px-4 py-3 text-left transition ${
                              chat.id === chatId
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                : "border-base-200 bg-base-100 hover:border-emerald-200 hover:bg-emerald-50/60"
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
                </>
              )}
            </div>

            <div className="mt-4 border-t border-base-200 px-1 pt-4">
              <div className="relative" ref={profileMenuRef}>
                <button
                  type="button"
                  aria-label={`${fallbackAccountLabel} settings`}
                  className={`flex rounded-[1.5rem] border border-base-200 bg-base-100 text-left transition hover:border-emerald-200 hover:bg-emerald-50 ${
                    isSidebarCollapsed
                      ? "w-full justify-center px-2 py-3"
                      : "w-full items-center gap-4 px-4 py-3.5"
                  }`}
                  aria-expanded={isProfileMenuOpen}
                  aria-haspopup="menu"
                  onClick={() => setIsProfileMenuOpen((currentState) => !currentState)}
                >
                  <div className="avatar placeholder">
                    {currentUserImage ? (
                      <div className="h-11 w-11 overflow-hidden rounded-2xl">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={currentUserImage}
                          alt={`${fallbackAccountLabel} avatar`}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-100 text-emerald-700">
                        <span className="text-sm font-semibold">
                          {getInitials(fallbackAccountLabel)}
                        </span>
                      </div>
                    )}
                  </div>
                  {!isSidebarCollapsed ? (
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {currentUserName ?? fallbackAccountLabel}
                      </p>
                      <p className="truncate text-xs text-base-content/45">
                        {currentUserEmail ?? "Signed in"}
                      </p>
                    </div>
                  ) : null}
                  <Settings
                    aria-hidden="true"
                    className="h-5 w-5 shrink-0 text-base-content/55"
                  />
                </button>

                {isProfileMenuOpen ? (
                  <div
                    className={`absolute bottom-[calc(100%+0.75rem)] rounded-[1.5rem] border border-base-200 bg-base-100 p-2 shadow-2xl ${
                      isSidebarCollapsed ? "left-0 w-52" : "left-0 right-0"
                    }`}
                    role="menu"
                    aria-label="Profile menu"
                  >
                    <button
                      type="button"
                      className="flex w-full items-center justify-between rounded-[1rem] px-3 py-3 text-left text-sm transition hover:bg-base-200"
                      role="menuitem"
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        router.push("/profile");
                      }}
                    >
                      <span>Profile</span>
                      <span className="text-xs text-base-content/45">Open</span>
                    </button>
                    <button
                      type="button"
                      className="flex w-full items-center justify-between rounded-[1rem] px-3 py-3 text-left text-sm text-error transition hover:bg-error/10"
                      role="menuitem"
                      onClick={() => void signOut({ callbackUrl: "/sign-in" })}
                    >
                      <span>Logout</span>
                      <span className="text-xs text-base-content/45">Now</span>
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </aside>

          <main
            className="flex min-h-screen flex-col bg-[linear-gradient(180deg,_rgba(236,253,245,0.78)_0%,_rgba(255,255,255,0.96)_32%,_rgba(236,253,245,0.72)_100%)] px-4 py-5 shadow-xl shadow-emerald-100/80 sm:px-5 sm:py-6"
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
            <div className="px-5 py-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                    DocBot
                  </h2>
                </div>
                <button
                  type="button"
                  className="grid h-11 w-11 place-items-center rounded-[0.65rem] text-base-content transition hover:bg-base-200"
                  aria-label="Download conversation"
                >
                  <Download aria-hidden="true" className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="h-px w-full bg-base-300" />

            <div className="overflow-y-auto px-4 py-5 sm:px-5">
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
                <div className="flex min-h-[18rem] items-start justify-center pt-8">
                  <div className="max-w-xl text-center">
                    <h3 className="text-3xl font-semibold tracking-tight">
                      Ask a medical question to begin the chat.
                    </h3>
                    <div className="mt-6 grid gap-3 sm:grid-cols-2">
                      {SUGGESTED_MEDICAL_PROMPTS.slice(0, 4).map((prompt) => (
                        <button
                          key={prompt}
                          type="button"
                          className="rounded-[1.4rem] border border-emerald-200 bg-emerald-50 px-4 py-4 text-left text-sm leading-6 transition hover:border-emerald-300 hover:bg-emerald-100"
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
                            ? "border border-emerald-500 bg-emerald-600 text-white"
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
                              className="btn btn-xs rounded-full border-emerald-200 bg-white text-emerald-700 hover:border-emerald-300 hover:bg-emerald-50"
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
              className="border-t border-emerald-100 px-4 py-3 sm:px-5"
              onSubmit={handleSubmit}
            >
              <div className="mx-auto w-full max-w-3xl">
                <p id="chat-composer-hint" className="sr-only">
                  Press Enter to send. Press Shift plus Enter to add a new line.
                </p>
                <div className="relative">
                  <textarea
                    id="chat-input"
                    className="textarea h-32 w-full resize-none rounded-[1.4rem] border border-emerald-200 bg-white px-4 py-3 pr-16 text-base leading-7 shadow-sm outline-none focus:outline-none"
                    placeholder="Describe your symptom, lab result, medication question, or health concern..."
                    value={draft}
                    aria-describedby="chat-composer-hint chat-safety-hint"
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={handleComposerKeyDown}
                  />
                  <button
                    type="submit"
                    aria-label="Send message"
                    className={`absolute bottom-3 right-3 grid h-10 w-10 place-items-center rounded-full transition ${
                      draft.trim().length === 0 || isResponding || isLoadingHistory
                        ? "cursor-not-allowed bg-base-200 text-base-content/35"
                        : "bg-emerald-600 text-white shadow-sm hover:bg-emerald-700"
                    }`}
                    disabled={
                      draft.trim().length === 0 || isResponding || isLoadingHistory
                    }
                  >
                    <SendHorizontal aria-hidden="true" className="h-4 w-4" />
                  </button>
                </div>
                <p className="mt-3 text-center text-xs leading-5 text-base-content/55">
                  DocBot provides medical education only and does not replace professional care.
                </p>
              </div>
            </form>

          </main>
        </div>
      </div>
    </div>
  );
}
