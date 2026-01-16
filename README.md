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

### Slice 7

- Added persistent conversation loading so an existing chat can be reopened from the URL and restored from SQLite-backed history.
- Updated message orchestration to pass prior user and assistant turns into the Groq request for medical follow-up context.
- Replaced the local-only chat shell behavior with real chat creation, history loading, and persisted message posting through the app routes.

### Slice 8

- Added a conversation sidebar with a new-chat action and persisted chat list loading from the server.
- Added safe auto-generated chat titles based on the first user message so saved conversations are readable in the sidebar.
- Updated the chat shell to switch between saved chats and return to an empty conversation state without leaving the medical-only UX.

### Slice 9

- Added Zod-based request validation for chat creation and message submission, including prompt and title length limits.
- Added normalization for stored content so persisted messages and titles are trimmed and whitespace-cleaned before saving.
- Added a basic in-memory rate limiter for rapid message submissions with clean `429` handling and retry metadata.

### Slice 10

- Added keyboard-friendly composer behavior so Enter sends and Shift+Enter keeps multiline input.
- Added accessibility refinements including landmark semantics, active-conversation announcement, composer guidance, and alert roles for urgent and failure states.
- Added a root app error boundary and expanded the README with fuller setup, testing, and deployment notes for fresh developers.

## Getting Started

1. Install dependencies with `pnpm install`.
2. Copy `.env.example` to `.env`.
3. Set `GROQ_API_KEY` and optionally `GROQ_MODEL`.
4. Generate Prisma client with `pnpm prisma:generate`.
5. Run the local SQLite migration with `pnpm prisma:migrate`.
6. Start the app with `pnpm dev`.
7. Open `http://localhost:3000`.

## Testing

- Run unit, component, and integration tests with `pnpm test`.
- Run lint checks with `pnpm lint`.
- Run a production build check with `pnpm build`.
- Use `pnpm test && pnpm lint && pnpm build` as the final local QA gate.

## Deployment Notes

- Keep Groq credentials server-side only. Do not expose `GROQ_API_KEY` to the client.
- This project uses SQLite for local development. For production, use durable storage and ensure Prisma migrations are applied before serving traffic.
- The current rate limiter is in-memory and process-local, which is fine for local and simple single-instance deployments but should be replaced with shared storage for multi-instance production use.
- Health, safety, and medical-domain guardrails are enforced in app code before the Groq call. Preserve that order when extending the system.

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
