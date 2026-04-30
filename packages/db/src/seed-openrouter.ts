import { createOpenRouterClient, isFreeOpenRouterModel } from "@ai-suites/ai";
import { sql } from "drizzle-orm";
import { db, pool } from "./client.js";
import { modelProviders, models } from "./schema.js";

const OPENROUTER_PROVIDER_ID = "openrouter";
const MAX_STARTER_MODELS = 25;

async function seedOpenRouterModels() {
  const client = createOpenRouterClient();
  const allModels = await client.listModels();
  const freeTextModels = allModels
    .filter((model) => model.mode === "text" && isFreeOpenRouterModel(model))
    .sort((first, second) => first.name.localeCompare(second.name))
    .slice(0, MAX_STARTER_MODELS);

  await db
    .insert(modelProviders)
    .values({
      id: OPENROUTER_PROVIDER_ID,
      name: "OpenRouter",
      slug: "openrouter"
    })
    .onDuplicateKeyUpdate({
      set: {
        enabled: true,
        name: "OpenRouter",
        updatedAt: sql`CURRENT_TIMESTAMP`
      }
    });

  for (const model of freeTextModels) {
    await db
      .insert(models)
      .values({
        contextWindow: model.contextWindow,
        enabled: true,
        id: model.id,
        inputCostPerMillion: model.inputCostPerMillion,
        metadata: model.metadata,
        mode: model.mode,
        name: model.name,
        outputCostPerMillion: model.outputCostPerMillion,
        providerId: OPENROUTER_PROVIDER_ID,
        slug: model.id
      })
      .onDuplicateKeyUpdate({
        set: {
          contextWindow: model.contextWindow,
          enabled: true,
          inputCostPerMillion: model.inputCostPerMillion,
          metadata: model.metadata,
          mode: model.mode,
          name: model.name,
          outputCostPerMillion: model.outputCostPerMillion,
          updatedAt: sql`CURRENT_TIMESTAMP`
        }
      });
  }

  console.log(`Seeded ${freeTextModels.length} free OpenRouter text models.`);
}

try {
  await seedOpenRouterModels();
} finally {
  await pool.end();
}
