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
