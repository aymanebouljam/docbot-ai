# DocBot AI

DocBot AI is a medical-only chatbot built with Next.js, TypeScript, Tailwind CSS, DaisyUI, Prisma, SQLite, and Groq. The project is being delivered slice by slice, with tests required before moving forward.

## Slice Notes

### Slice 0

- Bootstrapped the app around the DocBot AI product brief in `AGENTS.md`.
- Added Prisma with SQLite, Vitest, Testing Library, Zod, and Prettier.
- Added a branded home page smoke target, Prisma client setup, and smoke tests.

### Slice 1

- Replaced the static landing page with a responsive ChatGPT-style medical chat shell.
- Added message bubbles, empty state prompts, composer UX, and assistant loading feedback.
- Added component tests for input render, disabled submit, user message rendering, and loading state.

### Slice 2

- Added Prisma-backed chat persistence through repository and service helpers.
- Added route handlers for creating chats, loading chats, and posting user messages.
- Added repository integration tests and a route test that verifies persisted user messages.

### Slice 3

- Added a deterministic medical domain classifier with rule, phrase, and intent heuristics.
- Covered the classifier with a 25-case unit test matrix across medical, non-medical, and uncertain prompts.

### Slice 4

- Added dedicated non-medical and uncertain fallback response builders with suggested medical follow-up prompts.
- Wired the fallback flow into server-side message processing so blocked prompts persist both the user message and assistant redirect.
- Updated the chat shell so blocked prompts render the friendly fallback and prompt suggestions in the UI.

### Slice 5

- Added a server-only Groq client wrapper with a medical-focused system prompt, timeout handling, and graceful provider failure handling.
- Wired medical prompts through the Groq path while preserving the existing non-medical block before any provider call.
- Added unit tests for Groq success/failure plus integration coverage for medical-path routing and blocked-path behavior.

### Slice 6

- Added a deterministic medical safety checker for emergency and crisis cues.
- Added an urgent escalation response path that bypasses normal medical generation for red-flag prompts.
- Updated the chat shell to show urgent safety guidance in-message and in an emergency banner.

## Getting Started

1. Install dependencies with `pnpm install`.
2. Copy `.env.example` to `.env`.
3. Generate Prisma client with `pnpm prisma:generate`.
4. Start the app with `pnpm dev`.

## Scripts

- `pnpm dev`
- `pnpm build`
- `pnpm start`
- `pnpm lint`
- `pnpm test`
- `pnpm test:all`
- `pnpm prisma:generate`
- `pnpm prisma:migrate`

## Environment

Required variables are documented in `.env.example`.
