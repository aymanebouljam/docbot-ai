"use client";

import { useEffect, useMemo, useState } from "react";

const SHOWCASE_CONVERSATIONS = [
  {
    title: "Understand symptoms faster",
    prompt: "I've had a sore throat, fever, and fatigue for two days.",
    reply:
      "Those symptoms can happen with several infections. Watch for worsening pain, trouble swallowing, breathing difficulty, or dehydration, and consider getting evaluated if symptoms are getting worse.",
  },
  {
    title: "Get medication guidance",
    prompt: "What are common side effects of amoxicillin?",
    reply:
      "Common side effects can include nausea, diarrhea, and mild rash. Seek medical care urgently for trouble breathing, facial swelling, or a severe spreading rash.",
  },
  {
    title: "Ask about lab results",
    prompt: "What does elevated ALT usually mean?",
    reply:
      "Elevated ALT can be associated with liver irritation or inflammation. The context matters, so the next step is usually to review symptoms, medications, alcohol use, and the rest of the lab panel.",
  },
];

const TYPING_INTERVAL_MS = 28;
const HOLD_INTERVAL_MS = 1800;
const FADE_INTERVAL_MS = 320;

export function AuthShowcase() {
  const conversations = useMemo(() => SHOWCASE_CONVERSATIONS, []);
  const [conversationIndex, setConversationIndex] = useState(0);
  const [typedLength, setTypedLength] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  const activeConversation = conversations[conversationIndex];

  useEffect(() => {
    const typingTimer = window.setInterval(() => {
      setTypedLength((currentLength) => {
        if (currentLength >= activeConversation.reply.length) {
          window.clearInterval(typingTimer);
          return currentLength;
        }

        return currentLength + 1;
      });
    }, TYPING_INTERVAL_MS);

    return () => {
      window.clearInterval(typingTimer);
    };
  }, [activeConversation]);

  useEffect(() => {
    if (typedLength < activeConversation.reply.length) {
      return;
    }

    const holdTimer = window.setTimeout(() => {
      setIsVisible(false);
    }, HOLD_INTERVAL_MS);

    return () => {
      window.clearTimeout(holdTimer);
    };
  }, [activeConversation.reply.length, typedLength]);

  useEffect(() => {
    if (isVisible) {
      return;
    }

    const fadeTimer = window.setTimeout(() => {
      setConversationIndex(
        (currentIndex) => (currentIndex + 1) % conversations.length
      );
      setTypedLength(0);
      setIsVisible(true);
    }, FADE_INTERVAL_MS);

    return () => {
      window.clearTimeout(fadeTimer);
    };
  }, [conversations.length, isVisible]);

  return (
    <div
      className={`max-w-2xl transition duration-300 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
    >
      <p className="text-sm font-medium uppercase tracking-[0.24em] text-emerald-200/80">
        Guided Medical Conversations
      </p>
      <h2 className="mt-5 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
        {activeConversation.title}
      </h2>
      <div className="mt-10 flex w-full max-w-full flex-col gap-4 sm:w-[42rem]">
        <div className="flex justify-end">
          <div className="w-fit max-w-[75%] rounded-[1.7rem] rounded-br-md bg-white/12 px-5 py-4 text-sm leading-7 text-white/90 shadow-[0_20px_60px_rgba(0,0,0,0.18)] backdrop-blur">
            {activeConversation.prompt}
          </div>
        </div>
        <div className="w-[85%] rounded-[1.7rem] rounded-bl-md border border-white/12 bg-white/95 px-5 py-4 text-sm leading-7 text-slate-700 shadow-[0_28px_80px_rgba(15,23,42,0.2)]">
          {activeConversation.reply.slice(0, typedLength)}
          <span
            className="ml-1 inline-block h-5 w-px translate-y-1 animate-pulse bg-emerald-600"
            aria-hidden="true"
          />
        </div>
      </div>
    </div>
  );
}
