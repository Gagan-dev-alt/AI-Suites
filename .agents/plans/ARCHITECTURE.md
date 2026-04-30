# Architecture Plan

## System Shape

AI Suites will be a TypeScript monorepo with separate apps and shared packages.

```text
ai-suites/
  apps/
    web/
    api/
  packages/
    ai/
    auth/
    db/
    config/
    ui/
```

## Apps

### `apps/web`

Frontend app.

Responsibilities:

- React UI.
- Tailwind CSS styling.
- shadcn/ui components.
- Zustand for local UI state.
- TanStack Query for API/server state.
- Auth-aware routing.
- AI workspace screens.

### `apps/api`

Backend app.

Responsibilities:

- HTTP API.
- Better Auth handler.
- Authenticated user/session access.
- AI generation endpoints.
- Model catalog endpoints.
- Saved items and history endpoints.
- Usage logging.

## Packages

### `packages/db`

Database package.

Responsibilities:

- Drizzle schema.
- MySQL client.
- Migrations.
- Database types.
- Seed scripts for model providers and starter models.

### `packages/auth`

Auth package.

Responsibilities:

- Better Auth configuration.
- Google OAuth config.
- Microsoft OAuth config.
- Shared auth helpers for the API.

### `packages/ai`

AI provider package.

Responsibilities:

- Internal model/provider interfaces.
- OpenRouter integration.
- Request normalization.
- Response normalization.
- Usage metadata extraction where available.
- Future direct providers for OpenAI, Google, image, voice, and video APIs.

### `packages/config`

Shared configuration package.

Responsibilities:

- TypeScript config.
- ESLint config.
- Prettier config.
- Shared Tailwind/design tokens if needed.

### `packages/ui`

Optional shared UI package.

Start only when components are genuinely shared across apps. Early MVP can keep shadcn/ui inside `apps/web`.

## Data Flow

```text
web app
  -> API route
    -> auth/session check
    -> db read/write
    -> packages/ai provider call
    -> db usage/output write
  -> response back to web
```

## Auth Flow

```text
web sign-in button
  -> Better Auth social sign-in
  -> Google/Microsoft OAuth
  -> Better Auth callback
  -> session cookie
  -> web queries session endpoint
```

## AI Flow

```text
user prompt
  -> create generation job
  -> call OpenRouter through packages/ai
  -> receive text output
  -> save generation output
  -> log usage event
  -> return output to frontend
```

## Database Strategy

- Use MySQL locally through XAMPP.
- Use Drizzle schema as source of truth.
- Use generated migrations for durable changes.
- Use `drizzle-kit push` only for rapid early prototyping.
- Store generated binary assets outside MySQL later.
- Store metadata and references in MySQL.

## Design Strategy

Use `.agents/DESIGN.md` as the visual system:

- warm cream page canvas
- near-black text
- orange primary actions used sparingly
- hairline borders
- minimal shadows
- code/prompt surfaces in JetBrains Mono
- AI status timeline colors only for generation progress

## API Design Principles

- Keep provider keys on the backend.
- Never expose OpenRouter keys to the frontend.
- Validate request bodies.
- Return typed, predictable API responses.
- Log provider errors with request IDs when available.
- Store enough metadata to debug generation history.

## Early Architecture Decisions

- Start with OpenRouter as the first AI gateway.
- Keep an internal AI abstraction so OpenRouter can be replaced or supplemented later.
- Use Better Auth for sessions and OAuth.
- Use TanStack Query for API data instead of duplicating server state in Zustand.
- Keep the MVP focused on LLM/text first.
