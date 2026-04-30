export type AiModelMode = "text" | "image" | "voice" | "video" | "embedding";

export type AiModel = {
  id: string;
  name: string;
  mode: AiModelMode;
  contextWindow: number | null;
  inputCostPerMillion: number | null;
  outputCostPerMillion: number | null;
  isFree: boolean;
  metadata: Record<string, unknown>;
};

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type ChatCompletionRequest = {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
};

export type ChatCompletionResult = {
  content: string;
  model: string;
  raw: unknown;
};

export type AiProvider = {
  listModels: () => Promise<AiModel[]>;
  createChatCompletion: (request: ChatCompletionRequest) => Promise<ChatCompletionResult>;
};
