# Implementation Checklist

## Project Scaffold

- [x] Create root `package.json`.
- [x] Create `pnpm-workspace.yaml`.
- [x] Create `turbo.json`.
- [x] Add shared TypeScript config.
- [x] Add ESLint.
- [x] Add Prettier.
- [x] Add root scripts: `build`, `lint`, `format`, `format:check`, `typecheck`, `test`.
- [x] Add `.env.example`.

## Web App

- [x] Create `apps/web` with React, Vite, and TypeScript.
- [x] Add Tailwind CSS.
- [x] Add shadcn/ui.
- [x] Add base app shell.
- [x] Add routing.
- [x] Add TanStack Query client.
- [x] Add Zustand store for local workspace state.
- [x] Add sign-in screen.
- [x] Add main workspace layout.
- [x] Add model picker.
- [x] Add prompt composer.
- [x] Add output panel.
- [ ] Add history view.
- [ ] Add saved items view.
- [ ] Add settings page.

## API App

- [x] Create `apps/api` with Node.js and TypeScript.
- [x] Add server startup.
- [x] Add environment validation.
- [x] Add CORS for the web origin.
- [x] Add health endpoint.
- [x] Add Better Auth route handler.
- [x] Add protected route helper.
- [ ] Add model catalog endpoints.
- [ ] Add generation endpoints.
- [ ] Add history endpoints.
- [ ] Add saved item endpoints.
- [ ] Add usage logging.

## Database

- [x] Create `packages/db`.
- [x] Configure Drizzle for MySQL.
- [x] Add MySQL connection client.
- [x] Add Better Auth schema support.
- [x] Add product tables.
- [x] Add migration scripts.
- [x] Add seed script for OpenRouter provider.
- [x] Add seed script for starter model catalog.

## Auth

- [x] Create `packages/auth`.
- [x] Configure Better Auth.
- [x] Add Google OAuth.
- [x] Add Microsoft OAuth.
- [x] Wire auth package into API app.
- [x] Add frontend session query.
- [x] Add sign-out flow.

## AI Provider Layer

- [x] Create `packages/ai`.
- [x] Define internal provider interface.
- [x] Add OpenRouter client.
- [x] Add model list fetcher.
- [x] Add text generation method.
- [x] Normalize provider errors.
- [ ] Normalize response metadata.
- [ ] Add usage/cost metadata fields where available.

## Verification

- [x] Run `pnpm format:check`.
- [x] Run `pnpm lint`.
- [x] Run `pnpm typecheck`.
- [x] Run `pnpm build`.
- [x] Run relevant tests when test scripts exist.
- [x] Do not start the dev server unless the user explicitly asks.
