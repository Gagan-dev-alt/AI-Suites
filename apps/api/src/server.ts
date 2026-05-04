import { createOpenRouterClient, OpenRouterError } from "@ai-suites/ai";
import { auth } from "@ai-suites/auth";
import {
  db,
  generationJobs,
  generationOutputs,
  modelProviders,
  models,
  savedItems,
  workspaceMembers,
  workspaces
} from "@ai-suites/db";
import cors from "cors";
import { and, desc, eq, sql } from "drizzle-orm";
import express, { type Express } from "express";
import { toNodeHandler } from "better-auth/node";
import { randomUUID } from "node:crypto";
import pino from "pino";
import { z } from "zod";
import { requireAuth, type AuthenticatedRequest } from "./auth-context.js";
import { env } from "./env.js";

const logger = pino({
  level: env.NODE_ENV === "production" ? "info" : "debug"
});

export const app: Express = express();

const runGenerationSchema = z.object({
  modelId: z.string().min(1).max(160).optional(),
  prompt: z.string().trim().min(1).max(20_000),
  temperature: z.number().min(0).max(2).optional()
});

const saveOutputSchema = z.object({
  note: z.string().trim().max(2_000).optional(),
  outputId: z.string().uuid(),
  title: z.string().trim().min(1).max(180).optional()
});

app.use(
  cors({
    credentials: true,
    origin: env.WEB_ORIGIN
  })
);

app.all("/api/auth/{*any}", toNodeHandler(auth.handler));

app.use(express.json());

app.get("/health", (_request, response) => {
  response.json({
    name: "ai-suites-api",
    ok: true
  });
});

app.get("/api/me", requireAuth, (request, response) => {
  const session = (request as AuthenticatedRequest).authSession;

  response.json({
    user: session.user,
    session: session.session
  });
});

app.get("/api/models", requireAuth, async (_request, response) => {
  const rows = await db
    .select({
      contextWindow: models.contextWindow,
      id: models.id,
      inputCostPerMillion: models.inputCostPerMillion,
      mode: models.mode,
      name: models.name,
      outputCostPerMillion: models.outputCostPerMillion,
      provider: modelProviders.name,
      slug: models.slug
    })
    .from(models)
    .innerJoin(modelProviders, eq(models.providerId, modelProviders.id))
    .where(and(eq(models.enabled, true), eq(modelProviders.enabled, true), eq(models.mode, "text")))
    .orderBy(models.name)
    .limit(100);

  response.json({
    models:
      rows.length > 0
        ? rows
        : [
            {
              contextWindow: null,
              id: "openrouter/free",
              inputCostPerMillion: null,
              mode: "text",
              name: "OpenRouter free router",
              outputCostPerMillion: null,
              provider: "OpenRouter",
              slug: "openrouter/free"
            }
          ]
  });
});

app.post("/api/generations", requireAuth, async (request, response) => {
  const parsed = runGenerationSchema.safeParse(request.body);

  if (!parsed.success) {
    response.status(400).json({
      error: {
        code: "INVALID_REQUEST",
        message: "Prompt, model, or parameters are invalid.",
        details: z.flattenError(parsed.error).fieldErrors
      }
    });
    return;
  }

  const session = (request as AuthenticatedRequest).authSession;
  const workspace = await ensureDefaultWorkspace(session.user.id, session.user.name);
  const modelId = parsed.data.modelId ?? "openrouter/free";
  const storedModel = await db
    .select({ id: models.id })
    .from(models)
    .where(eq(models.id, modelId))
    .limit(1);
  const jobId = randomUUID();

  await db.insert(generationJobs).values({
    id: jobId,
    modelId: storedModel[0]?.id,
    parameters: {
      temperature: parsed.data.temperature
    },
    prompt: parsed.data.prompt,
    status: "running",
    userId: session.user.id,
    workspaceId: workspace.id
  });

  try {
    const client = createOpenRouterClient(env.OPENROUTER_API_KEY);
    const result = await client.createChatCompletion({
      messages: [
        {
          content: parsed.data.prompt,
          role: "user"
        }
      ],
      model: modelId,
      temperature: parsed.data.temperature
    });
    const outputId = randomUUID();

    await db.insert(generationOutputs).values({
      content: result.content,
      contentType: "text/plain",
      id: outputId,
      jobId,
      metadata: {
        model: result.model
      }
    });

    await db
      .update(generationJobs)
      .set({
        status: "completed",
        updatedAt: sql`CURRENT_TIMESTAMP`
      })
      .where(eq(generationJobs.id, jobId));

    response.status(201).json({
      generation: {
        id: jobId,
        model: result.model,
        output: result.content,
        outputId,
        status: "completed"
      }
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Generation failed before a response was created.";

    await db
      .update(generationJobs)
      .set({
        errorMessage: message,
        status: "failed",
        updatedAt: sql`CURRENT_TIMESTAMP`
      })
      .where(eq(generationJobs.id, jobId));

    const status = error instanceof OpenRouterError ? (error.status ?? 503) : 500;

    response.status(status === 401 ? 502 : status).json({
      error: {
        code: "GENERATION_FAILED",
        message
      }
    });
  }
});

app.get("/api/generations", requireAuth, async (request, response) => {
  const session = (request as AuthenticatedRequest).authSession;
  const workspace = await ensureDefaultWorkspace(session.user.id, session.user.name);
  const rows = await db
    .select({
      content: generationOutputs.content,
      createdAt: generationJobs.createdAt,
      errorMessage: generationJobs.errorMessage,
      id: generationJobs.id,
      modelId: generationJobs.modelId,
      modelName: models.name,
      outputId: generationOutputs.id,
      prompt: generationJobs.prompt,
      status: generationJobs.status,
      updatedAt: generationJobs.updatedAt
    })
    .from(generationJobs)
    .leftJoin(generationOutputs, eq(generationOutputs.jobId, generationJobs.id))
    .leftJoin(models, eq(models.id, generationJobs.modelId))
    .where(and(eq(generationJobs.workspaceId, workspace.id), eq(generationJobs.userId, session.user.id)))
    .orderBy(desc(generationJobs.createdAt))
    .limit(50);

  response.json({
    generations: rows.map((row) => ({
      ...row,
      modelName: row.modelName ?? row.modelId ?? "OpenRouter",
      output: row.content
    }))
  });
});

app.get("/api/saved-items", requireAuth, async (request, response) => {
  const session = (request as AuthenticatedRequest).authSession;
  const workspace = await ensureDefaultWorkspace(session.user.id, session.user.name);
  const rows = await db
    .select({
      content: generationOutputs.content,
      createdAt: savedItems.createdAt,
      id: savedItems.id,
      modelId: generationJobs.modelId,
      note: savedItems.note,
      outputId: savedItems.outputId,
      prompt: generationJobs.prompt,
      title: savedItems.title,
      updatedAt: savedItems.updatedAt
    })
    .from(savedItems)
    .leftJoin(generationOutputs, eq(generationOutputs.id, savedItems.outputId))
    .leftJoin(generationJobs, eq(generationJobs.id, generationOutputs.jobId))
    .where(and(eq(savedItems.workspaceId, workspace.id), eq(savedItems.userId, session.user.id)))
    .orderBy(desc(savedItems.createdAt))
    .limit(50);

  response.json({
    savedItems: rows.map((row) => ({
      ...row,
      output: row.content
    }))
  });
});

app.post("/api/saved-items", requireAuth, async (request, response) => {
  const parsed = saveOutputSchema.safeParse(request.body);

  if (!parsed.success) {
    response.status(400).json({
      error: {
        code: "INVALID_REQUEST",
        message: "Saved item details are invalid.",
        details: z.flattenError(parsed.error).fieldErrors
      }
    });
    return;
  }

  const session = (request as AuthenticatedRequest).authSession;
  const workspace = await ensureDefaultWorkspace(session.user.id, session.user.name);
  const outputRows = await db
    .select({
      content: generationOutputs.content,
      outputId: generationOutputs.id,
      prompt: generationJobs.prompt
    })
    .from(generationOutputs)
    .innerJoin(generationJobs, eq(generationJobs.id, generationOutputs.jobId))
    .where(
      and(
        eq(generationOutputs.id, parsed.data.outputId),
        eq(generationJobs.workspaceId, workspace.id),
        eq(generationJobs.userId, session.user.id)
      )
    )
    .limit(1);
  const output = outputRows[0];

  if (!output) {
    response.status(404).json({
      error: {
        code: "OUTPUT_NOT_FOUND",
        message: "That output was not found in this workspace."
      }
    });
    return;
  }

  const savedId = randomUUID();
  const title = parsed.data.title ?? createSavedTitle(output.prompt);

  await db.insert(savedItems).values({
    id: savedId,
    note: parsed.data.note,
    outputId: output.outputId,
    title,
    userId: session.user.id,
    workspaceId: workspace.id
  });

  response.status(201).json({
    savedItem: {
      id: savedId,
      note: parsed.data.note ?? null,
      output: output.content,
      outputId: output.outputId,
      prompt: output.prompt,
      title
    }
  });
});

function createSavedTitle(prompt: string) {
  const normalized = prompt.replace(/\s+/g, " ").trim();

  return normalized.length > 70 ? `${normalized.slice(0, 67)}...` : normalized || "Saved output";
}

async function ensureDefaultWorkspace(userId: string, userName: string | undefined) {
  const existing = await db
    .select({
      id: workspaces.id,
      name: workspaces.name
    })
    .from(workspaces)
    .where(eq(workspaces.ownerId, userId))
    .limit(1);

  if (existing[0]) {
    return existing[0];
  }

  const workspaceId = randomUUID();

  await db.insert(workspaces).values({
    id: workspaceId,
    name: userName ? `${userName}'s Workspace` : "My Workspace",
    ownerId: userId
  });

  await db.insert(workspaceMembers).values({
    id: randomUUID(),
    role: "owner",
    userId,
    workspaceId
  });

  return {
    id: workspaceId,
    name: userName ? `${userName}'s Workspace` : "My Workspace"
  };
}

app.listen(env.API_PORT, () => {
  logger.info({ port: env.API_PORT }, "AI Suites API ready");
});
