"use client";

import { FormEvent, useState } from "react";

import {
  CHAT_DISCLAIMER,
  SUGGESTED_MEDICAL_PROMPTS,
} from "@/features/chat/constants";
import { classifyDomain } from "@/features/domain/classifier";
import {
  buildDomainFallbackResponse,
  isBlockedDomainClassification,
} from "@/features/domain/fallback";
import type { ChatMessage } from "@/features/chat/types";

const ASSISTANT_PLACEHOLDER_DELAY_MS = 1400;

function buildAssistantPlaceholder(prompt: string) {
  return `Thanks for your question about "${prompt}". Medical answer generation will be connected in a later slice.`;
}

export function ChatShell() {
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isResponding, setIsResponding] = useState(false);

  function queueAssistantReply(prompt: string) {
    const classification = classifyDomain(prompt);

    if (isBlockedDomainClassification(classification)) {
      const fallback = buildDomainFallbackResponse(classification);

      setMessages((currentMessages) => [
        ...currentMessages,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: fallback.content,
          suggestedPrompts: fallback.suggestedPrompts,
        },
      ]);
      return;
    }

    setIsResponding(true);

    window.setTimeout(() => {
      setMessages((currentMessages) => [
        ...currentMessages,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: buildAssistantPlaceholder(prompt),
        },
      ]);
      setIsResponding(false);
    }, ASSISTANT_PLACEHOLDER_DELAY_MS);
  }

  function submitPrompt(prompt: string) {
    const trimmedPrompt = prompt.trim();

    if (!trimmedPrompt || isResponding) {
      return;
    }

    setMessages((currentMessages) => [
      ...currentMessages,
      {
        id: crypto.randomUUID(),
        role: "user",
        content: trimmedPrompt,
      },
    ]);
    setDraft("");
    queueAssistantReply(trimmedPrompt);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    submitPrompt(draft);
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

          <div className="badge badge-outline badge-info badge-lg">
            Slice 1
          </div>
        </header>

        <div className="grid flex-1 gap-5 lg:grid-cols-[0.78fr_1.22fr]">
          <aside className="rounded-[2rem] border border-base-300 bg-base-100/95 p-5 shadow-lg">
            <div className="mb-5">
              <p className="text-sm font-medium text-info">Guided medical scope</p>
              <h2 className="mt-2 text-2xl font-semibold">
                Focused on health and medicine
              </h2>
            </div>

            <div className="space-y-4">
              <div className="rounded-[1.5rem] border border-warning/30 bg-warning/10 p-4">
                <p className="text-sm font-medium">Important disclaimer</p>
                <p className="mt-2 text-sm leading-6 text-base-content/75">
                  {CHAT_DISCLAIMER}
                </p>
              </div>

              <div className="rounded-[1.5rem] border border-base-200 bg-base-200/60 p-4">
                <p className="text-sm font-medium">Example medical topics</p>
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

          <section className="flex min-h-[70vh] flex-col rounded-[2rem] border border-base-300 bg-base-100 shadow-xl shadow-sky-100/80">
            <div className="border-b border-base-200 px-5 py-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">New medical conversation</h2>
                  <p className="text-sm text-base-content/65">
                    Responses are educational and safety-first.
                  </p>
                </div>
                <div className="badge badge-neutral badge-outline">Online UI shell</div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-5">
              {messages.length === 0 ? (
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
              <div className="rounded-[1.7rem] border border-base-300 bg-base-100 p-3 shadow-sm">
                <textarea
                  id="chat-input"
                  className="textarea h-32 w-full resize-none border-0 bg-transparent px-2 text-base leading-7 outline-none focus:outline-none"
                  placeholder="Describe your symptom, lab result, medication question, or health concern..."
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                />
                <div className="mt-3 flex items-center justify-between gap-3 border-t border-base-200 pt-3">
                  <p className="max-w-md text-xs leading-5 text-base-content/60">
                    If symptoms are severe, worsening, or involve trouble breathing,
                    chest pain, confusion, or loss of consciousness, seek urgent care.
                  </p>
                  <button
                    type="submit"
                    className="btn btn-info rounded-full px-6"
                    disabled={draft.trim().length === 0 || isResponding}
                  >
                    Send
                  </button>
                </div>
              </div>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}
