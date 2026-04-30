# AI Suites Roadmap

Date: 2026-04-30

## Phase 0: Foundation

Goal: create a stable monorepo base that every later feature can build on.

Deliverables:

- Turborepo + pnpm workspace scaffold.
- `apps/web` React + Vite + TypeScript app.
- `apps/api` Node.js + TypeScript API app.
- Shared TypeScript, ESLint, and Prettier configuration.
- Tailwind CSS and shadcn/ui installed in the web app.
- Base environment variable validation.
- Root scripts for `dev`, `build`, `lint`, `format`, `format:check`, `typecheck`, and `test`.

Done when:

- `pnpm install` works.
- `pnpm build`, `pnpm lint`, `pnpm format:check`, and `pnpm typecheck` are available.
- No dev server has to be started by agents to complete setup.

## Phase 1: Auth And Database

Goal: users can sign in and the app can persist product data.

Deliverables:

- MySQL database package with Drizzle ORM.
- Initial Drizzle schema and migrations.
- Better Auth configured with database persistence.
- Google OAuth sign-in.
- Microsoft OAuth sign-in.
- Session endpoint for frontend.
- Protected API route pattern.

Done when:

- User sessions can be created, read, and ended.
- Auth secrets stay backend-only.
- Product tables can be migrated into the local XAMPP MySQL database.

## Phase 2: LLM Workspace MVP

Goal: first real usable AI Suites workspace for text models.

Deliverables:

- Workspace shell with left navigation, model bar, main prompt/output area, and right inspector.
- OpenRouter provider integration.
- Model catalog sync or seed from OpenRouter model metadata.
- Chat/text generation endpoint.
- Streaming response support if practical in the first pass.
- Generation jobs and outputs saved to MySQL.
- History view.
- Saved item flow.
- Basic usage event logging.

Done when:

- A signed-in user can choose a model, submit a prompt, receive output, and find it later in history.

## Phase 3: Productivity Layer

Goal: move from model playground to productive workbench.

Deliverables:

- Prompt templates.
- Folders or collections for saved work.
- Model comparison mode.
- Better generation metadata: provider, model, latency, token estimate, cost estimate when available.
- Retry/regenerate actions.
- User settings for default model and UI preferences.

Done when:

- Users can repeat common workflows and organize useful outputs.

## Phase 4: Image Workflows

Goal: add image generation and asset handling.

Deliverables:

- Image model catalog filtering.
- Image generation form with size/style controls.
- Output gallery.
- Saved images.
- Local asset storage adapter for development.
- Metadata stored in MySQL.

Done when:

- Users can generate, view, save, and revisit image outputs.

## Phase 5: Voice And Video Workflows

Goal: support richer media models.

Deliverables:

- Text-to-speech workflow.
- Speech-to-text workflow.
- Video generation job queue design.
- Long-running job status UI.
- Asset library for audio/video outputs.

Done when:

- Voice tasks work end-to-end, and video jobs have a reliable queued workflow.

## Phase 6: Production Readiness

Goal: prepare for real users and real costs.

Deliverables:

- Rate limits.
- Usage quotas.
- Cost tracking.
- Error monitoring.
- Audit logs for provider calls.
- Admin model/provider controls.
- Backup and migration strategy.
- Deployment documentation.

Done when:

- The app is safe to expose beyond local development.
