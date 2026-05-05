import type { GenerationHistoryItem } from "./api";

export type ChatAttachment = {
  id: string;
  kind: "file" | "image" | "text";
  name: string;
  mimeType: string;
  previewUrl?: string;
  size: number;
  textContent?: string;
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  attachments?: ChatAttachment[];
  outputId?: string | null;
  modelId?: string | null;
  createdAt: string;
  status?: "pending" | "done" | "error";
  error?: string | null;
  saved?: boolean;
};

export type HistoryGroup = {
  label: string;
  items: GenerationHistoryItem[];
};

export function buildContextPrompt(messages: ChatMessage[]) {
  if (messages.length <= 1) {
    return formatMessageForContext(messages[messages.length - 1]);
  }
  const lines: string[] = [];
  for (const m of messages) {
    const content = formatMessageForContext(m);
    if (!content) continue;
    lines.push(`${m.role === "user" ? "User" : "Assistant"}: ${content}`);
  }
  lines.push("Assistant:");
  return lines.join("\n");
}

function formatMessageForContext(message: ChatMessage | undefined) {
  if (!message) return "";

  const attachmentContext = formatAttachmentsForPrompt(message.attachments ?? []);
  if (!attachmentContext) return message.content;
  if (!message.content.trim()) return attachmentContext;

  return `${message.content}\n\n${attachmentContext}`;
}

function formatAttachmentsForPrompt(attachments: ChatAttachment[]) {
  if (attachments.length === 0) return "";

  const blocks = attachments.map((attachment, index) => {
    const label = `Attachment ${index + 1}: ${attachment.name} (${attachment.mimeType || "unknown"}, ${attachment.size} bytes)`;

    if (attachment.textContent) {
      return `${label}\n${attachment.textContent}`;
    }

    if (attachment.kind === "image") {
      return `${label}\nImage preview is available in the chat UI, but the image bytes are not included in this text-only request.`;
    }

    return `${label}\nFile bytes are not included in this text-only request.`;
  });

  return `Attached content:\n${blocks.join("\n\n")}`;
}

export function reconstructMessagesFromGeneration(item: GenerationHistoryItem): ChatMessage[] {
  const createdAt = item.createdAt ?? new Date().toISOString();
  const parsed = parseStoredContextPrompt(item.prompt, createdAt);
  const messages =
    parsed.length > 0
      ? parsed
      : [
          {
            id: generateId(),
            role: "user" as const,
            content: item.prompt,
            createdAt
          }
        ];

  messages.push({
    id: generateId(),
    role: "assistant",
    content: item.output ?? item.errorMessage ?? "",
    outputId: item.outputId,
    modelId: item.modelId,
    createdAt,
    status: item.status === "failed" ? "error" : "done",
    error: item.errorMessage
  });

  return messages;
}

function parseStoredContextPrompt(prompt: string, createdAt: string): ChatMessage[] {
  const messages: ChatMessage[] = [];
  let role: ChatMessage["role"] | null = null;
  let contentLines: string[] = [];

  function flushMessage() {
    const content = contentLines.join("\n").trim();

    if (role && content) {
      messages.push({
        id: generateId(),
        role,
        content,
        createdAt,
        status: role === "assistant" ? "done" : undefined
      });
    }

    role = null;
    contentLines = [];
  }

  for (const line of prompt.split(/\r?\n/)) {
    const marker = /^(User|Assistant):\s?(.*)$/.exec(line);

    if (marker) {
      flushMessage();
      role = marker[1] === "User" ? "user" : "assistant";
      contentLines = [marker[2] ?? ""];
      continue;
    }

    if (role) {
      contentLines.push(line);
    }
  }

  flushMessage();

  return messages;
}

export function findPromptForAssistant(messages: ChatMessage[], assistant: ChatMessage) {
  const idx = messages.findIndex((m) => m.id === assistant.id);
  for (let i = idx - 1; i >= 0; i--) {
    const candidate = messages[i];
    if (candidate?.role === "user") return candidate.content;
  }
  return assistant.content;
}

export function threadTitle(prompt: string) {
  const normalized = prompt.replace(/\s+/g, " ").trim();
  return normalized.length > 48 ? `${normalized.slice(0, 45)}...` : normalized || "New thread";
}

export function initialsFromUser(
  name: string | undefined | null,
  email: string | undefined | null
) {
  const source = (name ?? email ?? "?").trim();
  if (!source) return "?";
  const parts = source.split(/[\s@._-]+/).filter(Boolean);
  if (parts.length === 0) return source[0]?.toUpperCase() ?? "?";
  const initials = parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
  return initials || "?";
}

export function groupByRecency(items: GenerationHistoryItem[]): HistoryGroup[] {
  const now = Date.now();
  const DAY = 24 * 60 * 60 * 1000;
  const today: GenerationHistoryItem[] = [];
  const last7: GenerationHistoryItem[] = [];
  const last30: GenerationHistoryItem[] = [];
  const older: GenerationHistoryItem[] = [];

  for (const item of items) {
    const ts = new Date(item.createdAt).getTime();
    const diff = now - ts;
    if (diff < DAY) today.push(item);
    else if (diff < 7 * DAY) last7.push(item);
    else if (diff < 30 * DAY) last30.push(item);
    else older.push(item);
  }

  const groups: HistoryGroup[] = [];
  if (today.length) groups.push({ label: "Today", items: today });
  if (last7.length) groups.push({ label: "Last 7 Days", items: last7 });
  if (last30.length) groups.push({ label: "Last 30 Days", items: last30 });
  if (older.length) groups.push({ label: "Older", items: older });
  return groups;
}

export function generateId() {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `id_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
  );
}

export function createTitleFromPrompt(prompt: string) {
  const normalized = prompt.replace(/\s+/g, " ").trim();
  return normalized.length > 70 ? `${normalized.slice(0, 67)}...` : normalized || "Saved output";
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}
