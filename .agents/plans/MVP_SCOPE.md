# MVP Scope

## MVP Goal

The MVP should prove the core value of AI Suites: one clean productivity workspace where a user can sign in, choose an AI model, generate useful text output, save it, and return to it later.

## In Scope

- pnpm + Turborepo monorepo.
- React + Vite frontend.
- Node.js API backend.
- MySQL database through XAMPP/phpMyAdmin for local development.
- Drizzle ORM schema and migrations.
- Better Auth with Google and Microsoft OAuth.
- OpenRouter as the first model gateway.
- Text/LLM generation workflow.
- Model catalog.
- Prompt composer.
- Output display.
- Generation history.
- Saved outputs.
- Basic usage events.
- Clean UI following `.agents/DESIGN.md`.

## Out Of Scope For MVP

- Payments and subscriptions.
- Team billing.
- Full admin dashboard.
- Direct integrations for every AI provider.
- Video generation.
- Voice generation.
- Advanced workflow automation.
- Browser extension.
- Mobile app.
- Public template marketplace.

## MVP User Journey

1. User opens AI Suites.
2. User signs in with Google or Microsoft.
3. User lands in the workspace.
4. User selects a model from OpenRouter-backed model options.
5. User writes a prompt.
6. User submits the prompt.
7. The app shows output and generation status.
8. The app saves the generation.
9. User can open history and revisit the output.
10. User can save important output into a saved collection.

## MVP Screens

- Sign in screen.
- Main workspace.
- Model picker.
- History panel.
- Saved items view.
- Settings page.

## MVP Data

Required product tables:

- `workspaces`
- `workspace_members`
- `model_providers`
- `models`
- `generation_jobs`
- `generation_outputs`
- `saved_items`
- `usage_events`

Better Auth will create or require its own auth tables.

## Acceptance Criteria

- A user can authenticate with Google or Microsoft.
- A user can generate text with an OpenRouter model.
- The generated result is stored in MySQL.
- The user can view previous generations.
- The user can save a generation.
- Formatting, lint, typecheck, and build scripts are present.
- Agents do not start the dev server unless explicitly asked.
