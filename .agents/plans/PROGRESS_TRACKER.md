# AI Suites Progress Tracker

Last updated: 2026-04-30

Use this file as the quick handoff for every new agent session. Update it after each major task, phase completion, architecture decision, or blocker.

## Current Status

- Phase 1 auth and database setup has started.
- Research and phased planning documents exist in `.agents/plans`.
- Root pnpm/Turborepo workspace and shared config files now exist.
- Root dependencies have been installed and `pnpm-lock.yaml` exists.
- `apps/web` and `apps/api` scaffolds now exist.
- No dev server should be started unless the user explicitly asks.

## Current Phase

Phase 1: Auth And Database

Focus:

- Create Drizzle/MySQL database package.
- Add Better Auth with Google and Microsoft OAuth.
- Wire auth handler into the API.
- Prepare migrations for local XAMPP MySQL.

## Completed

- Added `.agents/AGENTS.md` project instructions.
- Added `.agents/DESIGN.md` design direction.
- Added planning docs:
  - `RESEARCH.md`
  - `ROADMAP.md`
  - `MVP_SCOPE.md`
  - `ARCHITECTURE.md`
  - `ENVIRONMENT.md`
  - `IMPLEMENTATION_CHECKLIST.md`
- Decided core stack:
  - React
  - Tailwind CSS
  - shadcn/ui
  - Zustand
  - TanStack Query
  - Node.js
  - MySQL through XAMPP/phpMyAdmin
  - Drizzle ORM
  - Better Auth
  - Google OAuth
  - Microsoft OAuth
  - OpenRouter as first AI gateway
  - pnpm
  - Turborepo
  - Prettier
- Created root monorepo files:
  - `package.json`
  - `pnpm-workspace.yaml`
  - `turbo.json`
  - `tsconfig.base.json`
  - `eslint.config.js`
  - `.prettierrc.json`
  - `.prettierignore`
  - `.gitignore`
  - `.npmrc`
  - `.env.example`
- Created initial `packages/config` placeholder package.
- Installed root dev dependencies.
- Created `apps/web` with:
  - React 19 + Vite.
  - Tailwind CSS v4.
  - shadcn/ui-compatible structure and starter button.
  - TanStack Query provider.
  - React Router wrapper.
  - Zustand workspace store.
  - First workspace shell with nav, model selector, prompt composer, output panel, and run details.
- Created `apps/api` with:
  - Express 5.
  - CORS configured from `WEB_ORIGIN`.
  - environment validation with Zod.
  - `/health` endpoint.
- Added package-level scripts for web and API build/typecheck/lint/test/dev.
- Created `packages/db` with:
  - Drizzle ORM MySQL client using `mysql2`.
  - Better Auth core tables: `user`, `session`, `account`, `verification`.
  - Product tables: `workspaces`, `workspace_members`, `model_providers`, `models`, `generation_jobs`, `generation_outputs`, `saved_items`, `usage_events`.
  - Drizzle Kit scripts for generate, migrate, push, and studio.
  - First generated migration: `packages/db/drizzle/0000_regular_surge.sql`.
- Created `packages/auth` with:
  - Better Auth config.
  - Drizzle adapter using provider `mysql`.
  - Google OAuth config when env vars are present.
  - Microsoft OAuth config when env vars are present.
  - account linking enabled for trusted Google accounts.
- Wired Better Auth into `apps/api` at `/api/auth/{*any}` before `express.json()`.
- Added API env validation for `DATABASE_URL`, `BETTER_AUTH_URL`, and OAuth variables.
- Created local `.env` for XAMPP MySQL using `DATABASE_URL=mysql://root:@localhost:3306/ai_suites`.
- Updated db env loading so `packages/db` reads the root `.env` reliably.
- Applied the first Drizzle migration to local MariaDB/XAMPP.
- Verified `ai_suites` contains:
  - `__drizzle_migrations`
  - `account`
  - `generation_jobs`
  - `generation_outputs`
  - `model_providers`
  - `models`
  - `saved_items`
  - `session`
  - `usage_events`
  - `user`
  - `verification`
  - `workspace_members`
  - `workspaces`
- Added API auth helper:
  - `getAuthSession(request)` uses Better Auth with `fromNodeHeaders`.
  - `requireAuth` returns `401` for unauthenticated requests.
  - `/api/me` protected route returns current user/session.
- Added web auth client:
  - Better Auth React client in `apps/web/src/lib/auth-client.ts`.
  - `/sign-in` route with Google and Microsoft OAuth buttons.
  - workspace header session status and sign-out action.
- Google OAuth credentials were added to local `.env`.
- Added explicit root `.env` loading in `packages/auth` so OAuth provider config is available regardless of import order.
- Added `dotenv` as a direct `packages/auth` dependency for pnpm correctness.
- Adjusted `apps/web` TypeScript scripts to use `tsc --noEmit` because it is an app and should not emit declaration files.
- Google and Microsoft OAuth were tested locally and are working.
- Added OpenRouter API key to local `.env`.
- Created `packages/ai` with:
  - internal provider types
  - OpenRouter client
  - model metadata fetcher
  - chat completion method
  - free model detection
  - `openrouter/free` as the safe default model for free accounts
- Added `packages/db` seed script `pnpm --filter @ai-suites/db seed:openrouter`.
- Seeded local DB with OpenRouter provider and 21 free text models.
- Verified root checks:
  - `pnpm format` ran.
  - `pnpm format:check` passed.
  - `pnpm lint` passed.
  - `pnpm typecheck` passed.
  - `pnpm build` passed.
  - `pnpm test` passed with placeholder web/API test scripts.

## Next Tasks

1. Add API model catalog endpoints backed by the seeded `models` table.
2. Add generation endpoint using `packages/ai` and free OpenRouter defaults.
3. Add workspace history/saved/settings routes in the web app.
4. Connect model picker to the API model catalog.
5. Add generation job/output persistence.

## Decisions

- Use OpenRouter first for access to many LLM models through one API key.
- Keep an internal `packages/ai` abstraction so direct provider APIs can be added later.
- Use Better Auth for database-backed sessions and social OAuth.
- Use Drizzle ORM with MySQL.
- Keep binary/generated media outside MySQL later; store metadata in MySQL.
- Use TanStack Query for server state and Zustand only for local UI/workspace state.
- Agents must not start the dev server unless explicitly requested.
- Better Auth Express handler must stay mounted before `express.json()`.
- Local `db:migrate` has been applied to XAMPP database `ai_suites`.
- OpenRouter free account should use seeded `:free` models or `openrouter/free` until billing is intentionally enabled.

## Blockers

- None currently.

## Update Rules

Update this file after:

- Finishing a major implementation task.
- Completing a roadmap phase.
- Making or changing an architecture decision.
- Adding/removing important dependencies.
- Finding a blocker.
- Changing setup commands or environment variables.

Keep updates short and practical. This file should be fast to read at the start of a new session.
