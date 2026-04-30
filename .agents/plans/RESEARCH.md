# AI Suites Research

Date: 2026-04-30

## Project Summary

AI Suites is an AI wrapper and productivity workspace that brings multiple popular AI model categories under one roof. The product should support real productive work across LLMs, image models, voice models, video models, and future AI tools through one clean interface.

The product direction is not a demo playground. It should feel like a practical workbench where users can choose the right model, compare outputs, save useful results, manage usage, and keep their AI work organized.

## Core Product Goals

- Provide one account and one workspace for multiple AI model providers.
- Support text, image, voice, and video generation workflows.
- Make model switching simple without making the UI feel technical or messy.
- Track usage, cost, model history, and saved outputs.
- Let users build repeatable productive workflows, not only one-off prompts.
- Keep the interface clean, tasteful, and fast.

## Confirmed Stack

- Monorepo: Turborepo
- Package manager: pnpm
- Formatting: Prettier
- Frontend: React, TypeScript, Vite
- Styling: Tailwind CSS
- UI components: shadcn/ui
- Client state: Zustand
- Server state: TanStack Query
- Backend: Node.js, TypeScript
- Database: MySQL through XAMPP / phpMyAdmin for local development
- ORM: Drizzle ORM
- Auth: Better Auth
- OAuth providers: Google and Microsoft

## Recommended Monorepo Shape

```text
ai-suites/
  apps/
    web/              # React + Vite frontend
    api/              # Node.js API server
  packages/
    db/               # Drizzle schema, migrations, database client
    auth/             # Better Auth config shared by API
    config/           # shared eslint, tsconfig, tailwind tokens
    ui/               # optional shared shadcn/ui wrappers later
    ai/               # provider abstraction for LLM/image/voice/video
  plan/
    RESEARCH.md
  pnpm-workspace.yaml
  turbo.json
  package.json
```

This keeps frontend, backend, database, auth, and AI provider logic separated while still sharing types and utilities through pnpm workspaces.

## Frontend Research

Use React with TypeScript and Vite for the web app. Vite officially supports a `react-ts` template and gives a lightweight SPA setup that fits this project well.

Use Tailwind CSS for the design system implementation. Tailwind CSS v4 is the current major version and focuses on performance and a newer configuration model.

Use shadcn/ui for component foundations. Treat shadcn components as editable source code, not a locked component library. This matches the need for a clean custom product UI.

Use Zustand for small client-only state:

- selected model
- temporary prompt settings
- open panels and UI preferences
- draft prompt state
- local workflow builder state

Use TanStack Query for server state:

- current user/session data
- model catalog
- prompt history
- saved generations
- billing/usage summaries
- API mutations for generation jobs

Do not put API cache state in Zustand. Zustand should stay focused on local UI and interaction state.

## UI Direction

Follow `.agents/DESIGN.md` as the visual base:

- warm cream canvas
- near-black warm ink
- restrained orange primary action
- hairline borders instead of shadows
- editorial spacing
- JetBrains Mono for prompt, code, and model output surfaces
- pastel timeline colors only for AI/action progress states

AI Suites should feel like a refined productivity tool, not a loud AI toy. The first screen should be the actual workspace: model selector, prompt/input surface, output area, generation history, and saved work controls.

Recommended app surfaces:

- left rail for workspace, history, saved items, settings
- top model bar for provider/model/category selection
- main work surface for prompt and output
- right inspector for parameters, cost estimate, metadata, and run history
- AI timeline/status pills for queued, thinking, reading, generating, complete, failed

Use the local `frontend-design` skill guidance when building UI: commit to a clear aesthetic direction, polish typography/spacing, avoid generic AI gradients, and make the interface feel intentionally designed.

## Backend Research

Use Node.js with TypeScript for the API. Node.js 24 is the active LTS line as of April 2026, so prefer Node 24 for new project setup.

Recommended API choices:

- Fastify for a fast typed API server, or Express if Better Auth integration simplicity is the top priority.
- Zod for environment validation and request/response validation.
- Pino for structured server logs.
- CORS locked to the frontend origin.
- Cookie-based sessions through Better Auth.

Better Auth supports Node server frameworks and has documented Express integration. If using Express v5, its route matching syntax changed, so Better Auth catch-all routes need the newer named wildcard style documented by Better Auth.

## Database And ORM

Use MySQL locally through XAMPP/phpMyAdmin. Use Drizzle ORM with `mysql2`.

Recommended local connection shape:

```env
DATABASE_URL=mysql://root:@localhost:3306/ai_suites
```

Expected database package responsibilities:

- define Drizzle schema
- export database client
- keep migrations in a committed `drizzle/` directory
- provide scripts for generate, migrate, and studio if needed

Recommended scripts:

```json
{
  "db:generate": "drizzle-kit generate",
  "db:migrate": "drizzle-kit migrate",
  "db:push": "drizzle-kit push",
  "db:studio": "drizzle-kit studio"
}
```

Use `drizzle-kit generate` plus `drizzle-kit migrate` for durable schema changes. `drizzle-kit push` is useful during early prototyping, but generated migrations are safer once the schema starts to matter.

## Auth Research

Use Better Auth with a database-backed session model.

Required OAuth providers:

- Google
- Microsoft

Better Auth supports social providers and has provider-specific Microsoft documentation. It also supports Drizzle as a database adapter.

Auth design notes:

- Keep auth routes on the API server under `/api/auth/*`.
- Store provider account links in Better Auth tables.
- Use secure HTTP-only cookies for sessions.
- Keep OAuth client IDs/secrets only in backend environment variables.
- Add account linking rules carefully so a verified Google/Microsoft email can attach to an existing user only when safe.
- Plan for organization/workspace membership tables outside the core auth tables.

## AI Provider Layer

The project needs an internal AI provider abstraction because it will support multiple categories:

- LLM text/chat
- image generation/editing
- speech-to-text
- text-to-speech
- video generation
- embeddings later

Recommended starting approach:

- Create `packages/ai`.
- Define internal provider interfaces first.
- Start with direct SDK integrations for the first few providers.
- Add an AI gateway later if usage, cost tracking, fallback routing, or provider normalization becomes painful.

Useful options:

- Vercel AI SDK: good TypeScript-first abstraction for text streaming and provider switching. AI SDK 5 added broader provider abstraction and speech support.
- LiteLLM Gateway: useful later if the product needs one OpenAI-compatible gateway, rate limits, virtual keys, spend tracking, and fallbacks across many LLM providers.
- Direct provider SDKs: best when a model category has unique APIs, especially image, voice, and video.

Recommendation: start with a TypeScript internal abstraction and direct SDKs/Vercel AI SDK for MVP. Evaluate LiteLLM when cost tracking, routing, or many LLM providers become core product needs.

## MVP Feature Scope

Phase 1 should focus on a strong text/LLM workspace:

- user sign in with Google and Microsoft
- model catalog table
- provider/model selector
- prompt composer
- streamed text output
- generation history
- saved generations
- basic usage tracking
- settings page for profile and connected accounts

Phase 2 can add image workflows:

- image prompt composer
- size/style controls
- output gallery
- saved images
- provider/model comparison

Phase 3 can add voice and video:

- text-to-speech
- speech-to-text
- video generation queue
- long-running job status
- asset library

## Suggested Tables

Better Auth will own its required auth tables. Product tables can include:

- `workspaces`
- `workspace_members`
- `model_providers`
- `models`
- `generation_jobs`
- `generation_outputs`
- `saved_items`
- `usage_events`
- `api_keys` if users later bring their own provider keys
- `folders`
- `prompt_templates`

Keep generated files and binary assets outside MySQL. Store metadata in MySQL and files in object storage later. During local development, use local filesystem storage behind an adapter.

## Engineering Rules For This Project

- Use pnpm commands, not npm or yarn, for project scripts.
- Use Prettier for formatting and expose `pnpm format` plus `pnpm format:check` scripts.
- Do not start the dev server automatically; the user will run it manually.
- Check existing scripts before running format, lint, tests, typecheck, or build.
- Keep packages typed with shared TypeScript config.
- Validate environment variables at startup.
- Keep provider secrets backend-only.
- Treat database migrations as source-controlled project artifacts.

## Open Questions

- Should the backend use Express for simplest Better Auth setup, or Fastify for the main API with a small compatibility layer?
- Should users bring their own provider API keys, or will AI Suites bill centrally?
- Which AI provider should be first for LLMs?
- Should the first release be local-only or production-deployable from day one?
- Will video generation be synchronous provider calls or queued background jobs?

## Source Notes

- React 19.2 release notes: https://react.dev/blog/2025/10/01/react-19-2
- Vite React TypeScript template docs: https://vite.dev/guide/
- Tailwind CSS v4 announcement: https://tailwindcss.com/blog/tailwindcss-v4
- shadcn/ui CLI and registry docs: https://ui.shadcn.com/docs/cli
- Zustand TypeScript guide: https://zustand.docs.pmnd.rs/learn/guides/beginner-typescript
- TanStack Query React docs: https://tanstack.com/query/latest/docs/react/
- Turborepo workspace guide: https://turborepo.com/docs/guides/workspaces
- pnpm workspace docs: https://pnpm.io/workspaces
- Node.js release schedule: https://nodejs.org/en/about/releases/
- Drizzle MySQL guide: https://orm.drizzle.team/docs/get-started/mysql-existing
- Drizzle migrations guide: https://orm.drizzle.team/docs/migrations
- Better Auth installation: https://better-auth.com/docs/installation
- Better Auth Drizzle adapter: https://www.better-auth.com/docs/adapters/drizzle
- Better Auth OAuth concepts: https://better-auth.com/docs/concepts/oauth
- Better Auth Microsoft provider: https://better-auth.com/docs/authentication/microsoft
- Microsoft identity OAuth/OIDC docs: https://learn.microsoft.com/en-us/entra/identity-platform/v2-protocols
- Vercel AI SDK 5 announcement: https://vercel.com/blog/ai-sdk-5
- LiteLLM docs: https://docs.litellm.ai/
