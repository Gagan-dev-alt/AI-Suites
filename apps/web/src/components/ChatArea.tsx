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
  File as FileIcon,
  FileImage,
  FileText,
  Loader2,
  Paperclip,
  Search,
  Settings as SettingsIcon,
  Sparkles,
  UploadCloud,
  X,
  Zap
} from "lucide-react";
import {
  type ChangeEvent as ReactChangeEvent,
  type ClipboardEvent as ReactClipboardEvent,
  type DragEvent as ReactDragEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  useEffect,
  useRef,
  useState
} from "react";
import type { ModelOption } from "../lib/api";
import type { useSession } from "../lib/auth-client";
import { generateId, type ChatAttachment, type ChatMessage } from "../lib/chat";

type SessionData = ReturnType<typeof useSession>["data"];

type SuggestionCategory = {
  id: "create" | "explore" | "code" | "learn";
  label: string;
  icon: typeof Sparkles;
  prompts: string[];
};

const composerMaxVisibleLines = 12;
const largePasteCharacterThreshold = 1200;
const largePasteLineThreshold = 18;
const maxTextAttachmentCharacters = 20000;

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
  attachments: ChatAttachment[];
  canSend: boolean;
  input: string;
  isSending: boolean;
  messages: ChatMessage[];
  modelOptions: ModelOption[];
  onInputChange: (value: string) => void;
  onAddAttachments: (attachments: ChatAttachment[]) => void;
  onOpenSaved: () => void;
  onOpenSettings: () => void;
  onPickSuggestion: (prompt: string) => void;
  onRemoveAttachment: (id: string) => void;
  onSaveMessage: (message: ChatMessage) => void;
  onSelectModel: (id: string) => void;
  onSubmit: () => void;
  selectedModel: string;
  session: SessionData;
  userName: string;
};

export function ChatArea({
  activeModel,
  attachments,
  canSend,
  input,
  isSending,
  messages,
  modelOptions,
  onInputChange,
  onAddAttachments,
  onOpenSaved,
  onOpenSettings,
  onPickSuggestion,
  onRemoveAttachment,
  onSaveMessage,
  onSelectModel,
  onSubmit,
  selectedModel,
  session,
  userName
}: ChatAreaProps) {
  const [modelMenuOpen, setModelMenuOpen] = useState(false);
  const [composerHeight, setComposerHeight] = useState(0);
  const [isDraggingFiles, setIsDraggingFiles] = useState(false);
  const [previewAttachment, setPreviewAttachment] = useState<ChatAttachment | null>(null);
  const dragDepthRef = useRef(0);

  function handleKeyDown(event: ReactKeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      onSubmit();
    }
  }

  async function addFiles(files: File[]) {
    if (files.length === 0) return;
    const nextAttachments = await Promise.all(files.map(createAttachmentFromFile));
    onAddAttachments(nextAttachments);
  }

  function handleDragEnter(event: ReactDragEvent<HTMLDivElement>) {
    if (!hasDraggedFiles(event.dataTransfer)) return;

    event.preventDefault();
    dragDepthRef.current += 1;
    setIsDraggingFiles(true);
  }

  function handleDragLeave(event: ReactDragEvent<HTMLDivElement>) {
    if (!hasDraggedFiles(event.dataTransfer)) return;

    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
    if (dragDepthRef.current === 0) {
      setIsDraggingFiles(false);
    }
  }

  function handleDragOver(event: ReactDragEvent<HTMLDivElement>) {
    if (!hasDraggedFiles(event.dataTransfer)) return;

    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    setIsDraggingFiles(true);
  }

  function handleDrop(event: ReactDragEvent<HTMLDivElement>) {
    const files = Array.from(event.dataTransfer.files);
    if (files.length === 0) return;

    event.preventDefault();
    dragDepthRef.current = 0;
    setIsDraggingFiles(false);
    void addFiles(files);
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

      <div
        className="relative flex min-h-0 flex-1 flex-col overflow-hidden"
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {messages.length === 0 ? (
          <EmptyChatState
            disabled={!session || isSending}
            hidden={input.length > 0 || attachments.length > 0}
            onPick={onPickSuggestion}
            userName={userName}
          />
        ) : (
          <ChatThread
            composerHeight={composerHeight}
            messages={messages}
            onOpenAttachment={setPreviewAttachment}
            onSave={onSaveMessage}
          />
        )}

        <Composer
          activeModelCost={
            activeModel?.outputCostPerMillion ?? activeModel?.inputCostPerMillion ?? null
          }
          activeModelLabel={activeModel?.name ?? selectedModel}
          attachments={attachments}
          canSend={canSend}
          input={input}
          isSending={isSending}
          modelMenuOpen={modelMenuOpen}
          modelOptions={modelOptions}
          onAddAttachments={onAddAttachments}
          onInputChange={onInputChange}
          onKeyDown={handleKeyDown}
          onOpenAttachment={setPreviewAttachment}
          onRemoveAttachment={onRemoveAttachment}
          onSelectModel={(id) => {
            onSelectModel(id);
            setModelMenuOpen(false);
          }}
          onHeightChange={setComposerHeight}
          onSubmit={onSubmit}
          onToggleModelMenu={() => setModelMenuOpen((prev) => !prev)}
          selectedModel={selectedModel}
          session={session}
        />

        {isDraggingFiles ? <DropOverlay /> : null}
        {previewAttachment ? (
          <AttachmentViewerModal
            attachment={previewAttachment}
            onClose={() => setPreviewAttachment(null)}
          />
        ) : null}
      </div>
    </section>
  );
}

function DropOverlay() {
  return (
    <div className="pointer-events-none absolute inset-0 z-20 bg-(--canvas)/70 p-5 backdrop-blur-md">
      <div className="grid h-full place-items-center rounded-2xl border border-dashed border-(--primary) bg-(--surface-card)/70 shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--primary)_16%,transparent)]">
        <div className="grid place-items-center gap-3 text-center">
          <div className="grid size-14 place-items-center rounded-full bg-(--primary) text-white shadow-lg shadow-orange-500/20">
            <UploadCloud className="size-7" aria-hidden="true" />
          </div>
          <div>
            <p className="text-base font-semibold text-(--ink)">Drop files to attach</p>
            <p className="mt-1 text-sm text-(--muted)">Images, documents, and long text</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyChatState({
  disabled,
  hidden,
  onPick,
  userName
}: {
  disabled: boolean;
  hidden: boolean;
  onPick: (prompt: string) => void;
  userName: string;
}) {
  const [category, setCategory] = useState<SuggestionCategory["id"]>("explore");
  const active = suggestionCategories.find((c) => c.id === category) ?? suggestionCategories[0]!;

  return (
    <div
      aria-hidden={hidden}
      className={`flex min-h-0 flex-1 items-start justify-center px-5 pb-6 pt-16 transition-all duration-300 ease-out sm:pt-24 ${
        hidden ? "pointer-events-none translate-y-2 opacity-0" : "translate-y-0 opacity-100"
      }`}
    >
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
  composerHeight,
  messages,
  onOpenAttachment,
  onSave
}: {
  composerHeight: number;
  messages: ChatMessage[];
  onOpenAttachment: (attachment: ChatAttachment) => void;
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
      <div
        className="mx-auto grid max-w-3xl gap-4 px-4 pt-6"
        style={{ paddingBottom: composerHeight + 32 }}
      >
        {messages.map((message) =>
          message.role === "user" ? (
            <div className="flex justify-end" key={message.id}>
              <div className="grid max-w-[85%] gap-2">
                {message.attachments?.length ? (
                  <AttachmentPreviewList
                    attachments={message.attachments}
                    compact
                    onOpen={onOpenAttachment}
                    tone="sent"
                  />
                ) : null}
                <div className="whitespace-pre-wrap rounded-2xl rounded-tr-sm bg-(--primary) px-4 py-3 text-sm leading-6 text-white">
                  {message.content}
                </div>
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

function AttachmentPreviewList({
  attachments,
  compact = false,
  onOpen,
  onRemove,
  tone = "draft"
}: {
  attachments: ChatAttachment[];
  compact?: boolean;
  onOpen: (attachment: ChatAttachment) => void;
  onRemove?: (id: string) => void;
  tone?: "draft" | "sent";
}) {
  const shellClass =
    tone === "sent"
      ? "flex max-w-full flex-wrap justify-end gap-2"
      : "themed-scrollbar flex max-w-full gap-2 overflow-x-auto border-b border-(--hairline) px-3 py-3";

  return (
    <div className={shellClass}>
      {attachments.map((attachment) => (
        <AttachmentPreview
          attachment={attachment}
          compact={compact}
          key={attachment.id}
          onOpen={onOpen}
          onRemove={onRemove}
          tone={tone}
        />
      ))}
    </div>
  );
}

function AttachmentPreview({
  attachment,
  compact,
  onOpen,
  onRemove,
  tone
}: {
  attachment: ChatAttachment;
  compact: boolean;
  onOpen: (attachment: ChatAttachment) => void;
  onRemove?: (id: string) => void;
  tone: "draft" | "sent";
}) {
  const iconClass = tone === "sent" ? "text-white" : "text-(--primary)";
  const metaClass = tone === "sent" ? "text-white/75" : "text-(--muted)";
  const bodyClass =
    tone === "sent"
      ? "border-white/25 bg-white/15 text-white"
      : "border-(--hairline) bg-(--canvas-soft) text-(--ink)";
  const tileSizeClass = compact ? "size-24" : "size-36";
  const removeButtonClass =
    "absolute left-2 top-2 z-10 grid size-7 place-items-center rounded-full bg-black/65 text-white opacity-0 shadow-sm transition-opacity hover:bg-black focus-visible:opacity-100 group-hover:opacity-100";

  function handleKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onOpen(attachment);
    }
  }

  if (attachment.kind === "image" && attachment.previewUrl) {
    return (
      <div
        className={`group relative shrink-0 cursor-zoom-in overflow-hidden rounded-lg border ${bodyClass} ${tileSizeClass}`}
        onClick={() => onOpen(attachment)}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        title={attachment.name}
      >
        <img
          alt={attachment.name}
          className="h-full w-full object-cover"
          draggable={false}
          src={attachment.previewUrl}
        />
        {onRemove ? (
          <button
            aria-label={`Remove ${attachment.name}`}
            className={removeButtonClass}
            onClick={(event) => {
              event.stopPropagation();
              onRemove(attachment.id);
            }}
            type="button"
          >
            <X className="size-3.5" aria-hidden="true" />
          </button>
        ) : null}
      </div>
    );
  }

  const Icon =
    attachment.kind === "text" ? FileText : attachment.kind === "image" ? FileImage : FileIcon;
  const excerpt = attachment.textContent?.replace(/\s+/g, " ").trim();
  const isPastedText = attachment.kind === "text";

  return (
    <div
      className={`group relative flex shrink-0 cursor-zoom-in flex-col justify-between rounded-lg border p-3 text-left ${bodyClass} ${tileSizeClass}`}
      onClick={() => onOpen(attachment)}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      title={attachment.name}
    >
      {isPastedText ? (
        <>
          <p className={`line-clamp-6 text-xs leading-5 ${metaClass}`}>
            {excerpt || attachment.name}
          </p>
          <span
            className={`w-fit rounded border px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-normal ${
              tone === "sent" ? "border-white/45 text-white" : "border-(--hairline-strong) text-(--body)"
            }`}
          >
            Pasted
          </span>
        </>
      ) : (
        <>
          <div className="min-w-0">
            <Icon className={`mb-2 size-4 ${iconClass}`} aria-hidden="true" />
            <p className="line-clamp-3 text-xs font-semibold leading-4">{attachment.name}</p>
          </div>
          <p className={`truncate text-[11px] ${metaClass}`}>{formatAttachmentMeta(attachment)}</p>
        </>
      )}
      {onRemove ? (
        <button
          aria-label={`Remove ${attachment.name}`}
          className={removeButtonClass}
          onClick={(event) => {
            event.stopPropagation();
            onRemove(attachment.id);
          }}
          type="button"
        >
          <X className="size-3.5" aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}

function formatAttachmentMeta(attachment: ChatAttachment) {
  if (attachment.kind === "text") {
    return `${formatFileSize(attachment.size)} pasted text`;
  }

  return `${formatFileSize(attachment.size)} ${attachment.mimeType || "file"}`;
}

function AttachmentViewerModal({
  attachment,
  onClose
}: {
  attachment: ChatAttachment;
  onClose: () => void;
}) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center bg-black/35 px-4 py-6 backdrop-blur-sm"
      onMouseDown={onClose}
    >
      <div
        className="flex max-h-[88vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-(--hairline) bg-(--surface-card) shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-(--hairline) px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-(--ink)">{attachment.name}</p>
            <p className="mt-0.5 text-xs text-(--muted)">{formatAttachmentMeta(attachment)}</p>
          </div>
          <button
            aria-label="Close preview"
            className="grid size-8 shrink-0 place-items-center rounded-md text-(--muted) hover:bg-(--surface-strong) hover:text-(--ink)"
            onClick={onClose}
            type="button"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>

        <div className="themed-scrollbar min-h-0 flex-1 overflow-auto bg-(--canvas-soft) p-4">
          {attachment.kind === "image" && attachment.previewUrl ? (
            <div className="grid min-h-[50vh] place-items-center">
              <img
                alt={attachment.name}
                className="max-h-[72vh] max-w-full rounded-lg object-contain"
                src={attachment.previewUrl}
              />
            </div>
          ) : attachment.textContent ? (
            <pre className="whitespace-pre-wrap rounded-lg bg-(--surface-card) p-4 font-mono text-xs leading-5 text-(--ink)">
              {attachment.textContent}
            </pre>
          ) : (
            <div className="grid min-h-[40vh] place-items-center text-center">
              <div className="grid max-w-sm place-items-center gap-3">
                <div className="grid size-12 place-items-center rounded-full bg-(--surface-card) text-(--primary)">
                  <FileIcon className="size-6" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm font-medium text-(--ink)">{attachment.name}</p>
                  <p className="mt-1 text-xs text-(--muted)">{formatAttachmentMeta(attachment)}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFilesFromClipboard(data: DataTransfer) {
  return Array.from(data.items)
    .filter((item) => item.kind === "file")
    .map((item) => item.getAsFile())
    .filter((file): file is File => Boolean(file));
}

function hasDraggedFiles(data: DataTransfer) {
  return Array.from(data.types).includes("Files");
}

function isLargePastedText(text: string) {
  if (!text.trim()) return false;
  return (
    text.length >= largePasteCharacterThreshold ||
    text.split(/\r?\n/).length >= largePasteLineThreshold
  );
}

function createPastedTextAttachment(text: string): ChatAttachment {
  return {
    id: generateId(),
    kind: "text",
    mimeType: "text/plain",
    name: "Pasted text",
    size: new Blob([text]).size,
    textContent: limitTextAttachment(text)
  };
}

async function createAttachmentFromFile(file: File): Promise<ChatAttachment> {
  if (file.type.startsWith("image/")) {
    return {
      id: generateId(),
      kind: "image",
      mimeType: file.type,
      name: file.name || "Pasted image",
      previewUrl: URL.createObjectURL(file),
      size: file.size
    };
  }

  return {
    id: generateId(),
    kind: "file",
    mimeType: file.type,
    name: file.name || "Attached file",
    size: file.size,
    textContent: isTextLikeFile(file) ? limitTextAttachment(await file.text()) : undefined
  };
}

function isTextLikeFile(file: File) {
  if (file.type.startsWith("text/")) return true;

  return /\.(csv|css|html?|json|jsx|log|md|py|sql|ts|tsx|txt|xml|ya?ml)$/i.test(file.name);
}

function limitTextAttachment(text: string) {
  if (text.length <= maxTextAttachmentCharacters) return text;

  return `${text.slice(0, maxTextAttachmentCharacters)}\n\n[Content truncated after ${maxTextAttachmentCharacters} characters.]`;
}

function Composer({
  activeModelLabel,
  activeModelCost,
  attachments,
  canSend,
  input,
  isSending,
  modelMenuOpen,
  modelOptions,
  onAddAttachments,
  onInputChange,
  onKeyDown,
  onHeightChange,
  onOpenAttachment,
  onRemoveAttachment,
  onSelectModel,
  onSubmit,
  onToggleModelMenu,
  selectedModel,
  session
}: {
  activeModelLabel: string;
  activeModelCost: number | null;
  attachments: ChatAttachment[];
  canSend: boolean;
  input: string;
  isSending: boolean;
  modelMenuOpen: boolean;
  modelOptions: ModelOption[];
  onAddAttachments: (attachments: ChatAttachment[]) => void;
  onInputChange: (value: string) => void;
  onKeyDown: (event: ReactKeyboardEvent<HTMLTextAreaElement>) => void;
  onHeightChange: (height: number) => void;
  onOpenAttachment: (attachment: ChatAttachment) => void;
  onRemoveAttachment: (id: string) => void;
  onSelectModel: (id: string) => void;
  onSubmit: () => void;
  onToggleModelMenu: () => void;
  selectedModel: string;
  session: SessionData;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const composerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const styles = window.getComputedStyle(textarea);
    const lineHeight = Number.parseFloat(styles.lineHeight) || 24;
    const paddingY =
      Number.parseFloat(styles.paddingTop) + Number.parseFloat(styles.paddingBottom);
    const maxHeight = lineHeight * composerMaxVisibleLines + paddingY;

    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
    textarea.style.overflowY = textarea.scrollHeight > maxHeight ? "auto" : "hidden";
  }, [input]);

  useEffect(() => {
    const composer = composerRef.current;
    if (!composer) return;

    const updateHeight = () => onHeightChange(composer.getBoundingClientRect().height);
    updateHeight();

    const resizeObserver = new ResizeObserver(updateHeight);
    resizeObserver.observe(composer);

    return () => resizeObserver.disconnect();
  }, [onHeightChange]);

  async function addFiles(files: File[]) {
    if (files.length === 0) return;
    const nextAttachments = await Promise.all(files.map(createAttachmentFromFile));
    onAddAttachments(nextAttachments);
  }

  function handleFileInputChange(event: ReactChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    void addFiles(files);
  }

  function handlePaste(event: ReactClipboardEvent<HTMLTextAreaElement>) {
    const files = getFilesFromClipboard(event.clipboardData);
    const pastedText = event.clipboardData.getData("text/plain");
    const shouldAttachText = isLargePastedText(pastedText);

    if (files.length === 0 && !shouldAttachText) {
      return;
    }

    event.preventDefault();

    if (shouldAttachText) {
      onAddAttachments([createPastedTextAttachment(pastedText)]);
    }

    void addFiles(files);
  }

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 px-4 pb-4">
      <div
        className="absolute bottom-0 left-1/2 h-20 w-[calc(100%-2rem)] max-w-3xl -translate-x-1/2 bg-(--canvas)"
        aria-hidden="true"
      />
      <div className="relative z-10 mx-auto w-full max-w-3xl" ref={composerRef}>
        <div
          className="pointer-events-auto rounded-2xl border border-(--hairline-strong) bg-(--surface-card) shadow-sm focus-within:border-(--primary)"
        >
          {attachments.length > 0 ? (
            <AttachmentPreviewList
              attachments={attachments}
              onOpen={onOpenAttachment}
              onRemove={onRemoveAttachment}
            />
          ) : null}
          <textarea
            className="themed-scrollbar block min-h-14 w-full resize-none bg-transparent px-4 py-3 text-sm leading-6 text-(--ink) outline-none placeholder:text-(--muted)"
            disabled={!session}
            onChange={(event) => onInputChange(event.target.value)}
            onKeyDown={onKeyDown}
            onPaste={handlePaste}
            placeholder={session ? "Type your message here..." : "Sign in to start chatting"}
            ref={textareaRef}
            rows={1}
            value={input}
          />
          <input
            className="hidden"
            multiple
            onChange={handleFileInputChange}
            ref={fileInputRef}
            type="file"
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
            <ComposerChip
              icon={Paperclip}
              label="Attach"
              onClick={() => fileInputRef.current?.click()}
            />

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

function ComposerChip({
  icon: Icon,
  label,
  onClick
}: {
  icon: typeof Sparkles;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      className="inline-flex h-8 items-center gap-1.5 rounded-md border border-(--hairline) bg-transparent px-2 text-xs font-medium text-(--body) hover:bg-(--surface-strong) hover:text-(--ink)"
      onClick={onClick}
      type="button"
    >
      <Icon className="size-3.5" aria-hidden="true" />
      {label}
    </button>
  );
}
