# DocBot AI

A focused medical chatbot designed to answer only health-related questions, providing relevant and meaningful interactions.

## Project Demo

[![Watch on YouTube](https://img.shields.io/badge/Watch%20on-YouTube-FF0000?logo=youtube&logoColor=white)](https://youtu.be/49XmlydHS3A)

## Features

- Medical-only chat experience with deterministic domain and safety guardrails.
- Friendly non-medical fallback responses with suggested medical follow-ups.
- Persistent conversations with local SQLite storage through Prisma.
- Groq-powered medical educational answers with server-side API boundaries.
- Chat sidebar with search, saved conversations, and auto-generated titles.
- Input validation, normalization, and basic rate limiting.
- First-party email/password registration and login with signed HTTP-only session cookies.

## Tech Stack

- Next.js
- TypeScript
- Tailwind CSS + DaisyUI
- Prisma + SQLite
- Groq API

## Getting Started

1. Install dependencies with `pnpm install`.
2. Copy `.env.example` to `.env`.
3. Set `GROQ_API_KEY` and optionally `GROQ_MODEL`.
4. Generate Prisma client with `pnpm prisma:generate`.
5. Run the local SQLite migration with `pnpm prisma:migrate`.
6. Start the app with `pnpm dev`.
7. Open `http://localhost:3000`.
8. Start chatting in the local workspace.

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
- `pnpm typecheck`
- `pnpm format`
- `pnpm test`
- `pnpm test:all`
- `pnpm prisma:generate`
- `pnpm prisma:migrate`

## Environment

Required variables are documented in `.env.example`.
