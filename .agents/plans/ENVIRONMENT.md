# Environment And API Keys

## Local Runtime

Recommended local runtime:

- Node.js 24 LTS
- pnpm
- XAMPP MySQL
- phpMyAdmin for database inspection

## Required Environment Variables

Backend/API:

```env
NODE_ENV=development
API_PORT=8000
WEB_ORIGIN=http://localhost:5173

DATABASE_URL=mysql://root:@localhost:3306/ai_suites

BETTER_AUTH_SECRET=
BETTER_AUTH_URL=http://localhost:8000

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

MICROSOFT_CLIENT_ID=
MICROSOFT_CLIENT_SECRET=

OPENROUTER_API_KEY=
```

Frontend:

```env
VITE_API_URL=http://localhost:8000
```

## API Key Plan

### OpenRouter

Use OpenRouter as the first AI gateway.

Why:

- one API key for many models
- OpenAI-compatible API shape
- model metadata API
- provider routing
- supports multiple output modalities in model metadata

Environment variable:

```env
OPENROUTER_API_KEY=
```

### Google OAuth

Used for user sign-in.

Environment variables:

```env
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

### Microsoft OAuth

Used for user sign-in.

Environment variables:

```env
MICROSOFT_CLIENT_ID=
MICROSOFT_CLIENT_SECRET=
```

## Future Keys

Add only when the feature needs them:

- Direct OpenAI API key for OpenAI-specific features.
- Direct Google AI key for Gemini-specific features.
- Image provider keys for advanced image generation/editing.
- Voice provider keys for text-to-speech and speech-to-text.
- Video provider keys for long-running generation.
- Object storage keys when generated assets move out of local filesystem storage.

## Secret Rules

- Keep all provider secrets backend-only.
- Do not expose provider API keys through Vite environment variables.
- Never commit real `.env` files.
- Provide `.env.example` when the project scaffold is created.
- Validate required variables during API startup.
