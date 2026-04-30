import type { AiModel, AiProvider, ChatCompletionRequest, ChatCompletionResult } from "./types.js";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1";
const FREE_ROUTER_MODEL = "openrouter/free";

type OpenRouterModel = {
  id: string;
  name?: string;
  context_length?: number;
  architecture?: {
    modality?: string;
    input_modalities?: string[];
    output_modalities?: string[];
  };
  pricing?: {
    prompt?: string;
    completion?: string;
    image?: string;
    request?: string;
  };
  [key: string]: unknown;
};

type OpenRouterModelsResponse = {
  data?: OpenRouterModel[];
};

type OpenRouterChatResponse = {
  model?: string;
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

export class OpenRouterError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly details?: unknown
  ) {
    super(message);
    this.name = "OpenRouterError";
  }
}

export class OpenRouterClient implements AiProvider {
  constructor(
    private readonly apiKey: string,
    private readonly siteUrl = "http://localhost:5173",
    private readonly appName = "AI Suites"
  ) {}

  async listModels(): Promise<AiModel[]> {
    const response = await fetch(`${OPENROUTER_API_URL}/models`);

    if (!response.ok) {
      throw new OpenRouterError("Failed to fetch OpenRouter models.", response.status);
    }

    const payload = (await response.json()) as OpenRouterModelsResponse;

    return (payload.data ?? []).map(mapOpenRouterModel);
  }

  async createChatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResult> {
    const response = await fetch(`${OPENROUTER_API_URL}/chat/completions`, {
      body: JSON.stringify({
        messages: request.messages,
        model: request.model ?? FREE_ROUTER_MODEL,
        temperature: request.temperature
      }),
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": this.siteUrl,
        "X-Title": this.appName
      },
      method: "POST"
    });

    const payload = (await response.json().catch(() => null)) as OpenRouterChatResponse | null;

    if (!response.ok) {
      throw new OpenRouterError("OpenRouter chat completion failed.", response.status, payload);
    }

    const content = payload?.choices?.[0]?.message?.content;

    if (!content) {
      throw new OpenRouterError(
        "OpenRouter response did not include text content.",
        response.status,
        payload
      );
    }

    return {
      content,
      model: payload.model ?? request.model ?? FREE_ROUTER_MODEL,
      raw: payload
    };
  }
}

export function createOpenRouterClient(apiKey = process.env.OPENROUTER_API_KEY) {
  if (!apiKey) {
    throw new OpenRouterError("OPENROUTER_API_KEY is required.");
  }

  return new OpenRouterClient(apiKey);
}

export function isFreeOpenRouterModel(model: AiModel) {
  return model.id === FREE_ROUTER_MODEL || model.id.endsWith(":free") || model.isFree;
}

function mapOpenRouterModel(model: OpenRouterModel): AiModel {
  const promptPrice = Number(model.pricing?.prompt ?? Number.NaN);
  const completionPrice = Number(model.pricing?.completion ?? Number.NaN);
  const inputModalities = model.architecture?.input_modalities ?? [];
  const outputModalities = model.architecture?.output_modalities ?? [];
  const mode = inferMode(inputModalities, outputModalities, model.architecture?.modality);

  return {
    contextWindow: model.context_length ?? null,
    id: model.id,
    inputCostPerMillion: priceToCentsPerMillion(model.pricing?.prompt),
    isFree:
      model.id.endsWith(":free") ||
      model.id === FREE_ROUTER_MODEL ||
      (Number.isFinite(promptPrice) &&
        promptPrice === 0 &&
        Number.isFinite(completionPrice) &&
        completionPrice === 0),
    metadata: model as Record<string, unknown>,
    mode,
    name: model.name ?? model.id,
    outputCostPerMillion: priceToCentsPerMillion(model.pricing?.completion)
  };
}

function inferMode(
  inputModalities: string[],
  outputModalities: string[],
  modality: string | undefined
): AiModel["mode"] {
  const joined = [...inputModalities, ...outputModalities, modality ?? ""].join(" ").toLowerCase();

  if (joined.includes("image")) {
    return "image";
  }

  if (joined.includes("audio")) {
    return "voice";
  }

  if (joined.includes("video")) {
    return "video";
  }

  return "text";
}

function priceToCentsPerMillion(price: string | undefined) {
  if (!price) {
    return null;
  }

  const numericPrice = Number(price);

  if (!Number.isFinite(numericPrice)) {
    return null;
  }

  return Math.round(numericPrice * 1_000_000 * 100);
}
