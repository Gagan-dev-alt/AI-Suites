import {
  AlertCircle,
  ArrowUp,
  BookmarkCheck,
  BookOpen,
  ChevronDown,
  Check,
  Clipboard,
  Code2,
  Compass,
  Loader2,
  Paperclip,
  Search,
  Settings as SettingsIcon,
  Sparkles,
  Zap
} from "lucide-react";
import { type KeyboardEvent as ReactKeyboardEvent, useEffect, useRef, useState } from "react";
import type { ModelOption } from "../lib/api";
import type { useSession } from "../lib/auth-client";
import type { ChatMessage } from "../lib/chat";

type SessionData = ReturnType<typeof useSession>["data"];

type SuggestionCategory = {
  id: "create" | "explore" | "code" | "learn";
  label: string;
  icon: typeof Sparkles;
  prompts: string[];
};

const suggestionCategories: SuggestionCategory[] = [
  {
    id: "create",
    label: "Create",
    icon: Sparkles,
    prompts: [
      "Write a short poem about the ocean at dawn",
      "Draft a friendly email declining a meeting",
      "Give me 5 catchy product names for a note-taking app",
      "Outline a 2-minute pitch for a new coffee shop"
    ]
  },
  {
    id: "explore",
    label: "Explore",
    icon: Compass,
    prompts: [
      "How does AI actually work?",
      "Are black holes real?",
      "What is the meaning of life?",
      "Explain quantum entanglement simply"
    ]
  },
  {
    id: "code",
    label: "Code",
    icon: Code2,
    prompts: [
      "Write a TypeScript function to debounce a callback",
      "Explain the difference between useMemo and useCallback",
      "Give me a Python one-liner to flatten a nested list",
      "Review this SQL query for performance issues"
    ]
  },
  {
    id: "learn",
    label: "Learn",
    icon: BookOpen,
    prompts: [
      "Teach me the basics of linear algebra",
      "Summarize the key ideas of Clean Architecture",
      'How many Rs are in the word "strawberry"?',
      "Give me a 5-step plan to learn Rust"
    ]
  }
];

export type ChatAreaProps = {
  activeModel: ModelOption | undefined;
  canSend: boolean;
  input: string;
  isSending: boolean;
  messages: ChatMessage[];
  modelOptions: ModelOption[];
  onInputChange: (value: string) => void;
  onOpenSaved: () => void;
  onOpenSettings: () => void;
  onPickSuggestion: (prompt: string) => void;
  onSaveMessage: (message: ChatMessage) => void;
  onSelectModel: (id: string) => void;
  onSubmit: () => void;
  selectedModel: string;
  session: SessionData;
  userName: string;
};

export function ChatArea({
  activeModel,
  canSend,
  input,
  isSending,
  messages,
  modelOptions,
  onInputChange,
  onOpenSaved,
  onOpenSettings,
  onPickSuggestion,
  onSaveMessage,
  onSelectModel,
  onSubmit,
  selectedModel,
  session,
  userName
}: ChatAreaProps) {
  const [modelMenuOpen, setModelMenuOpen] = useState(false);

  function handleKeyDown(event: ReactKeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      onSubmit();
    }
  }

  return (
    <section className="flex h-screen min-w-0 flex-1 flex-col overflow-hidden">
      <header className="flex h-14 items-center justify-end gap-2 border-b border-(--hairline) px-4">
        <button
          aria-label="Saved"
          className="grid size-9 place-items-center rounded-lg text-(--body) hover:bg-(--surface-strong) hover:text-(--ink)"
          onClick={onOpenSaved}
          type="button"
        >
          <BookmarkCheck className="size-4" aria-hidden="true" />
        </button>
        <button
          aria-label="Settings"
          className="grid size-9 place-items-center rounded-lg text-(--body) hover:bg-(--surface-strong) hover:text-(--ink)"
          onClick={onOpenSettings}
          type="button"
        >
          <SettingsIcon className="size-4" aria-hidden="true" />
        </button>
      </header>

      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
        {messages.length === 0 ? (
          <EmptyChatState
            disabled={!session || isSending}
            onPick={onPickSuggestion}
            userName={userName}
          />
        ) : (
          <ChatThread messages={messages} onSave={onSaveMessage} />
        )}

        <Composer
          activeModelCost={
            activeModel?.outputCostPerMillion ?? activeModel?.inputCostPerMillion ?? null
          }
          activeModelLabel={activeModel?.name ?? selectedModel}
          canSend={canSend}
          input={input}
          isSending={isSending}
          modelMenuOpen={modelMenuOpen}
          modelOptions={modelOptions}
          onInputChange={onInputChange}
          onKeyDown={handleKeyDown}
          onSelectModel={(id) => {
            onSelectModel(id);
            setModelMenuOpen(false);
          }}
          onSubmit={onSubmit}
          onToggleModelMenu={() => setModelMenuOpen((prev) => !prev)}
          selectedModel={selectedModel}
          session={session}
        />
      </div>
    </section>
  );
}

function EmptyChatState({
  disabled,
  onPick,
  userName
}: {
  disabled: boolean;
  onPick: (prompt: string) => void;
  userName: string;
}) {
  const [category, setCategory] = useState<SuggestionCategory["id"]>("explore");
  const active = suggestionCategories.find((c) => c.id === category) ?? suggestionCategories[0]!;

  return (
    <div className="flex min-h-0 flex-1 items-start justify-center px-5 pb-6 pt-16 sm:pt-24">
      <div className="w-full max-w-2xl">
        <h1 className="text-[28px] font-semibold tracking-tight text-(--ink) sm:text-[32px]">
          How can I help you, {userName}?
        </h1>

        <div className="mt-6 flex flex-wrap gap-2">
          {suggestionCategories.map((c) => {
            const Icon = c.icon;
            const isActive = c.id === category;
            return (
              <button
                className={`inline-flex h-9 items-center gap-2 rounded-full border px-3 text-sm font-medium transition-colors ${
                  isActive
                    ? "border-(--primary) bg-(--primary) text-white"
                    : "border-(--hairline-strong) bg-(--surface-card) text-(--ink) hover:bg-(--surface-strong)"
                }`}
                key={c.id}
                onClick={() => setCategory(c.id)}
                type="button"
              >
                <Icon className="size-4" aria-hidden="true" />
                {c.label}
              </button>
            );
          })}
        </div>

        <div className="mt-5 divide-y divide-(--hairline) rounded-xl">
          {active.prompts.map((prompt) => (
            <button
              className="flex w-full items-center justify-between gap-3 py-3 text-left text-sm text-(--body) transition-colors hover:text-(--primary) disabled:cursor-not-allowed disabled:opacity-60"
              disabled={disabled}
              key={prompt}
              onClick={() => onPick(prompt)}
              type="button"
            >
              <span>{prompt}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function ChatThread({
  messages,
  onSave
}: {
  messages: ChatMessage[];
  onSave: (message: ChatMessage) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages]);

  async function handleCopy(message: ChatMessage) {
    await navigator.clipboard.writeText(message.content);
    setCopiedMessageId(message.id);
    window.setTimeout(() => {
      setCopiedMessageId((current) => (current === message.id ? null : current));
    }, 1600);
  }

  return (
    <div className="themed-scrollbar min-h-0 flex-1 overflow-y-auto" ref={scrollRef}>
      <div className="mx-auto grid max-w-3xl gap-4 px-4 pb-44 pt-6">
        {messages.map((message) =>
          message.role === "user" ? (
            <div className="flex justify-end" key={message.id}>
              <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-tr-sm bg-(--primary) px-4 py-3 text-sm leading-6 text-white">
                {message.content}
              </div>
            </div>
          ) : (
            <div className="flex justify-start" key={message.id}>
              <div className="w-full max-w-[95%] px-5 py-4">
                {message.status === "pending" && !message.content ? (
                  <div className="flex items-center gap-2 text-sm text-(--muted)">
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                    Thinking...
                  </div>
                ) : message.status === "error" ? (
                  <div className="flex items-start gap-2 text-sm leading-6 text-(--ink)">
                    <AlertCircle className="mt-0.5 size-4 shrink-0 text-(--primary)" />
                    <span>{message.error ?? "The request failed."}</span>
                  </div>
                ) : (
                  <MarkdownContent content={message.content} />
                )}

                {message.status === "done" && message.content ? (
                  <div className="mt-5 flex items-center justify-between gap-3 pt-1 text-xs text-(--muted)">
                    <span className="truncate">{message.modelId ?? ""}</span>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <button
                        className="inline-flex h-8 items-center gap-1.5 rounded-md border border-(--hairline) bg-(--surface-card) px-2.5 text-xs font-medium text-(--body) hover:bg-(--surface-strong) hover:text-(--ink)"
                        onClick={() => void handleCopy(message)}
                        type="button"
                      >
                        {copiedMessageId === message.id ? (
                          <Check className="size-3.5" aria-hidden="true" />
                        ) : (
                          <Clipboard className="size-3.5" aria-hidden="true" />
                        )}
                        {copiedMessageId === message.id ? "Copied" : "Copy"}
                      </button>
                      {message.outputId ? (
                        <button
                          className="inline-flex h-8 items-center gap-1.5 rounded-md border border-(--hairline) bg-(--surface-card) px-2.5 text-xs font-medium text-(--body) hover:bg-(--surface-strong) hover:text-(--ink) disabled:opacity-60"
                          disabled={message.saved}
                          onClick={() => onSave(message)}
                          type="button"
                        >
                          <BookmarkCheck className="size-3.5" aria-hidden="true" />
                          {message.saved ? "Saved" : "Save"}
                        </button>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}

function MarkdownContent({ content }: { content: string }) {
  const blocks = parseMarkdownBlocks(content);

  return (
    <div className="grid gap-4 text-[15px] leading-7 text-(--ink)">
      {blocks.map((block, index) => {
        if (block.type === "heading") {
          return (
            <h3 className="pt-1 text-base font-semibold leading-7 text-(--ink)" key={index}>
              {renderInlineMarkdown(block.text)}
            </h3>
          );
        }

        if (block.type === "bullets") {
          return (
            <ul className="grid list-disc gap-2 pl-6" key={index}>
              {block.items.map((item, itemIndex) => (
                <li className="pl-1" key={itemIndex}>
                  {renderInlineMarkdown(item)}
                </li>
              ))}
            </ul>
          );
        }

        if (block.type === "numbers") {
          return (
            <ol className="grid list-decimal gap-2 pl-6" key={index}>
              {block.items.map((item, itemIndex) => (
                <li className="pl-1" key={itemIndex}>
                  {renderInlineMarkdown(item)}
                </li>
              ))}
            </ol>
          );
        }

        return (
          <p className="whitespace-pre-wrap" key={index}>
            {renderInlineMarkdown(block.text)}
          </p>
        );
      })}
    </div>
  );
}

type MarkdownBlock =
  | { text: string; type: "heading" }
  | { text: string; type: "paragraph" }
  | { items: string[]; type: "bullets" }
  | { items: string[]; type: "numbers" };

function parseMarkdownBlocks(content: string): MarkdownBlock[] {
  const blocks: MarkdownBlock[] = [];
  const lines = content.split(/\r?\n/);
  let index = 0;

  while (index < lines.length) {
    const line = lines[index]?.trimEnd() ?? "";

    if (!line.trim()) {
      index += 1;
      continue;
    }

    const heading = /^(#{1,3})\s+(.+)$/.exec(line);
    const boldHeading = /^\*\*(.+)\*\*$/.exec(line.trim());

    if (heading || boldHeading) {
      blocks.push({
        text: heading?.[2] ?? boldHeading?.[1] ?? line,
        type: "heading"
      });
      index += 1;
      continue;
    }

    const bullet = /^\s*[-*]\s+(.+)$/.exec(line);
    if (bullet) {
      const items: string[] = [];
      while (index < lines.length) {
        const match = /^\s*[-*]\s+(.+)$/.exec(lines[index] ?? "");
        if (!match) break;
        items.push(match[1] ?? "");
        index += 1;
      }
      blocks.push({ items, type: "bullets" });
      continue;
    }

    const number = /^\s*\d+\.\s+(.+)$/.exec(line);
    if (number) {
      const items: string[] = [];
      while (index < lines.length) {
        const match = /^\s*\d+\.\s+(.+)$/.exec(lines[index] ?? "");
        if (!match) break;
        items.push(match[1] ?? "");
        index += 1;
      }
      blocks.push({ items, type: "numbers" });
      continue;
    }

    const paragraphLines: string[] = [];
    while (index < lines.length) {
      const current = lines[index] ?? "";
      if (
        !current.trim() ||
        /^(#{1,3})\s+(.+)$/.test(current) ||
        /^\*\*(.+)\*\*$/.test(current.trim()) ||
        /^\s*[-*]\s+(.+)$/.test(current) ||
        /^\s*\d+\.\s+(.+)$/.test(current)
      ) {
        break;
      }
      paragraphLines.push(current);
      index += 1;
    }
    blocks.push({ text: paragraphLines.join("\n").trim(), type: "paragraph" });
  }

  return blocks;
}

function renderInlineMarkdown(text: string) {
  const nodes: React.ReactNode[] = [];
  const strongPattern = /\*\*(.+?)\*\*/g;
  let cursor = 0;
  let match: RegExpExecArray | null;

  while ((match = strongPattern.exec(text))) {
    if (match.index > cursor) {
      nodes.push(renderEmphasis(text.slice(cursor, match.index), nodes.length));
    }

    nodes.push(
      <strong className="font-semibold text-(--ink)" key={`strong-${nodes.length}`}>
        {renderEmphasis(match[1] ?? "", nodes.length)}
      </strong>
    );
    cursor = match.index + match[0].length;
  }

  if (cursor < text.length) {
    nodes.push(renderEmphasis(text.slice(cursor), nodes.length));
  }

  return nodes;
}

function renderEmphasis(text: string, keySeed: number) {
  const parts = text.split(/(\*[^*]+\*)/g);

  return parts.map((part, index) => {
    if (/^\*[^*]+\*$/.test(part)) {
      return (
        <em className="text-(--ink)" key={`${keySeed}-em-${index}`}>
          {part.slice(1, -1)}
        </em>
      );
    }

    return part;
  });
}

function Composer({
  activeModelLabel,
  activeModelCost,
  canSend,
  input,
  isSending,
  modelMenuOpen,
  modelOptions,
  onInputChange,
  onKeyDown,
  onSelectModel,
  onSubmit,
  onToggleModelMenu,
  selectedModel,
  session
}: {
  activeModelLabel: string;
  activeModelCost: number | null;
  canSend: boolean;
  input: string;
  isSending: boolean;
  modelMenuOpen: boolean;
  modelOptions: ModelOption[];
  onInputChange: (value: string) => void;
  onKeyDown: (event: ReactKeyboardEvent<HTMLTextAreaElement>) => void;
  onSelectModel: (id: string) => void;
  onSubmit: () => void;
  onToggleModelMenu: () => void;
  selectedModel: string;
  session: SessionData;
}) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 px-4 pb-4">
      <div
        className="absolute bottom-0 left-1/2 h-20 w-[calc(100%-2rem)] max-w-3xl -translate-x-1/2 bg-(--canvas)"
        aria-hidden="true"
      />
      <div className="relative z-10 mx-auto w-full max-w-3xl">
        <div className="pointer-events-auto rounded-2xl border border-(--hairline-strong) bg-(--surface-card) shadow-sm focus-within:border-(--primary)">
          <textarea
            className="block max-h-56 min-h-14 w-full resize-none bg-transparent px-4 py-3 text-sm leading-6 text-(--ink) outline-none placeholder:text-(--muted)"
            disabled={!session}
            onChange={(event) => onInputChange(event.target.value)}
            onKeyDown={onKeyDown}
            placeholder={session ? "Type your message here..." : "Sign in to start chatting"}
            rows={1}
            value={input}
          />
          <div className="flex flex-wrap items-center gap-2 px-2 pb-2">
            <div className="relative">
              <button
                className="inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-sm font-medium text-(--ink) hover:bg-(--surface-strong)"
                onClick={onToggleModelMenu}
                type="button"
              >
                <span className="max-w-44 truncate">{activeModelLabel}</span>
                {activeModelCost !== null ? (
                  <span className="text-xs text-(--muted)">${activeModelCost.toFixed(2)}</span>
                ) : null}
                <ChevronDown className="size-3.5 text-(--muted)" aria-hidden="true" />
              </button>
              {modelMenuOpen ? (
                <div className="absolute bottom-10 left-0 z-10 max-h-72 w-72 overflow-auto rounded-lg border border-(--hairline) bg-(--surface-card) p-1 shadow-lg">
                  {modelOptions.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-(--muted)">No models available</div>
                  ) : (
                    modelOptions.map((model) => (
                      <button
                        className={`flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-sm hover:bg-(--surface-strong) ${
                          model.id === selectedModel ? "bg-(--surface-strong)" : ""
                        }`}
                        key={model.id}
                        onClick={() => onSelectModel(model.id)}
                        type="button"
                      >
                        <span className="truncate text-(--ink)">{model.name}</span>
                        <span className="shrink-0 text-xs text-(--muted)">{model.provider}</span>
                      </button>
                    ))
                  )}
                </div>
              ) : null}
            </div>

            <ComposerChip icon={Zap} label="Instant" />
            <ComposerChip icon={Search} label="Search" />
            <ComposerChip icon={Paperclip} label="Attach" />

            <div className="ml-auto">
              <button
                aria-label="Send message"
                className="grid size-9 place-items-center rounded-full bg-(--primary) text-white transition-colors hover:bg-(--primary-active) disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!canSend}
                onClick={onSubmit}
                type="button"
              >
                {isSending ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <ArrowUp className="size-4" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ComposerChip({ icon: Icon, label }: { icon: typeof Sparkles; label: string }) {
  return (
    <button
      className="inline-flex h-8 items-center gap-1.5 rounded-md border border-(--hairline) bg-transparent px-2 text-xs font-medium text-(--body) hover:bg-(--surface-strong) hover:text-(--ink)"
      type="button"
    >
      <Icon className="size-3.5" aria-hidden="true" />
      {label}
    </button>
  );
}
