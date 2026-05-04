const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export type ModelOption = {
  contextWindow: number | null;
  id: string;
  inputCostPerMillion: number | null;
  mode: "text" | "image" | "voice" | "video" | "embedding";
  name: string;
  outputCostPerMillion: number | null;
  provider: string;
  slug: string;
};

export type GenerationResult = {
  id: string;
  model: string;
  output: string;
  outputId: string;
  status: "completed";
};

export type GenerationHistoryItem = {
  createdAt: string;
  errorMessage: string | null;
  id: string;
  modelId: string | null;
  modelName: string;
  output: string | null;
  outputId: string | null;
  prompt: string;
  status: "queued" | "running" | "completed" | "failed" | "cancelled";
  updatedAt: string;
};

export type SavedItem = {
  createdAt?: string;
  id: string;
  modelId?: string | null;
  note: string | null;
  output: string | null;
  outputId: string | null;
  prompt: string | null;
  title: string;
  updatedAt?: string;
};

type ApiErrorPayload = {
  error?: {
    code?: string;
    message?: string;
  };
};

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function fetchModels() {
  const payload = await apiFetch<{ models: ModelOption[] }>("/api/models");

  return payload.models;
}

export async function createGeneration(input: {
  modelId: string;
  prompt: string;
  temperature?: number;
}) {
  const payload = await apiFetch<{ generation: GenerationResult }>("/api/generations", {
    body: JSON.stringify(input),
    headers: {
      "Content-Type": "application/json"
    },
    method: "POST"
  });

  return payload.generation;
}

export async function fetchGenerationHistory() {
  const payload = await apiFetch<{ generations: GenerationHistoryItem[] }>("/api/generations");

  return payload.generations;
}

export async function fetchSavedItems() {
  const payload = await apiFetch<{ savedItems: SavedItem[] }>("/api/saved-items");

  return payload.savedItems;
}

export async function saveOutput(input: { note?: string; outputId: string; title?: string }) {
  const payload = await apiFetch<{ savedItem: SavedItem }>("/api/saved-items", {
    body: JSON.stringify(input),
    headers: {
      "Content-Type": "application/json"
    },
    method: "POST"
  });

  return payload.savedItem;
}

async function apiFetch<T>(path: string, init?: RequestInit) {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: "include"
  });
  const payload = (await response.json().catch(() => null)) as unknown;

  if (!response.ok) {
    const errorPayload = parseApiErrorPayload(payload);
    const message = errorPayload.error?.message ?? "The API request failed.";

    throw new ApiError(message, response.status);
  }

  return payload as T;
}

function parseApiErrorPayload(payload: unknown): ApiErrorPayload {
  if (!payload || typeof payload !== "object" || !("error" in payload)) {
    return {};
  }

  return payload as ApiErrorPayload;
}
