import { BookmarkCheck, LogOut, X } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { Route, Routes } from "react-router";
import { Button } from "./components/ui/button";
import { ChatArea } from "./components/ChatArea";
import { ChatSidebar } from "./components/ChatSidebar";
import {
  ApiError,
  createGeneration,
  fetchGenerationHistory,
  fetchModels,
  fetchSavedItems,
  saveOutput,
  type GenerationHistoryItem,
  type SavedItem
} from "./lib/api";
import { signOut, useSession } from "./lib/auth-client";
import {
  buildContextPrompt,
  createTitleFromPrompt,
  findPromptForAssistant,
  formatDate,
  generateId,
  groupByRecency,
  reconstructMessagesFromGeneration,
  type ChatAttachment,
  type ChatMessage
} from "./lib/chat";
import { SignIn } from "./SignIn";
import { useWorkspaceStore } from "./stores/workspace-store";

export function App() {
  return (
    <Routes>
      <Route path="/sign-in" element={<SignIn />} />
      <Route path="*" element={<Workspace />} />
    </Routes>
  );
}

function Workspace() {
  const queryClient = useQueryClient();
  const selectedModel = useWorkspaceStore((state) => state.selectedModel);
  const setSelectedModel = useWorkspaceStore((state) => state.setSelectedModel);
  const { data: session, isPending: sessionPending } = useSession();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [threadSearch, setThreadSearch] = useState("");
  const [overlay, setOverlay] = useState<null | "saved" | "settings">(null);
  const messagesRef = useRef(messages);
  const attachmentsRef = useRef(attachments);

  const modelsQuery = useQuery({
    enabled: Boolean(session),
    queryFn: fetchModels,
    queryKey: ["models"]
  });
  const historyQuery = useQuery({
    enabled: Boolean(session),
    queryFn: fetchGenerationHistory,
    queryKey: ["generations"]
  });
  const savedQuery = useQuery({
    enabled: Boolean(session),
    queryFn: fetchSavedItems,
    queryKey: ["saved-items"]
  });

  const modelOptions = modelsQuery.data ?? [];
  const activeModel = useMemo(
    () => modelOptions.find((model) => model.id === selectedModel),
    [modelOptions, selectedModel]
  );

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    attachmentsRef.current = attachments;
  }, [attachments]);

  useEffect(() => {
    return () => {
      revokeAttachmentPreviews(attachmentsRef.current);
      revokeAttachmentPreviews(messagesRef.current.flatMap((message) => message.attachments ?? []));
    };
  }, []);

  useEffect(() => {
    const firstModel = modelOptions[0];
    if (firstModel && !modelOptions.some((model) => model.id === selectedModel)) {
      setSelectedModel(firstModel.id);
    }
  }, [modelOptions, selectedModel, setSelectedModel]);

  const runGeneration = useMutation({
    mutationFn: createGeneration,
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["generations"] });
    }
  });
  const saveCurrentOutput = useMutation({
    mutationFn: saveOutput,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["saved-items"] });
    }
  });

  const isSending = runGeneration.isPending;
  const canSend = Boolean(session) && (input.trim().length > 0 || attachments.length > 0) && !isSending;

  function handleNewChat() {
    revokeAttachmentPreviews(attachments);
    revokeAttachmentPreviews(messages.flatMap((message) => message.attachments ?? []));
    setMessages([]);
    setInput("");
    setAttachments([]);
    runGeneration.reset();
  }

  async function handleSend(promptOverride?: string) {
    const raw = (promptOverride ?? input).trim();
    if ((!raw && attachments.length === 0) || !session || isSending) {
      return;
    }

    const history = messages;
    const sentAttachments = promptOverride ? [] : attachments;
    const userMessage: ChatMessage = {
      id: generateId(),
      role: "user",
      content: raw || "Attached content",
      attachments: sentAttachments,
      createdAt: new Date().toISOString()
    };
    const pendingAssistant: ChatMessage = {
      id: generateId(),
      role: "assistant",
      content: "",
      createdAt: new Date().toISOString(),
      status: "pending",
      modelId: selectedModel
    };

    setMessages([...history, userMessage, pendingAssistant]);
    setInput("");
    setAttachments([]);

    const promptToSend = buildContextPrompt([...history, userMessage]);

    try {
      const result = await runGeneration.mutateAsync({
        modelId: selectedModel,
        prompt: promptToSend
      });
      setMessages((prev) =>
        prev.map((m) =>
          m.id === pendingAssistant.id
            ? {
                ...m,
                content: result.output,
                outputId: result.outputId,
                modelId: result.model,
                status: "done"
              }
            : m
        )
      );
    } catch (error) {
      const message =
        error instanceof ApiError || error instanceof Error ? error.message : "The request failed.";
      setMessages((prev) =>
        prev.map((m) =>
          m.id === pendingAssistant.id ? { ...m, status: "error", error: message } : m
        )
      );
    }
  }

  async function handleSaveMessage(message: ChatMessage) {
    if (!message.outputId || message.saved) {
      return;
    }
    try {
      await saveCurrentOutput.mutateAsync({
        outputId: message.outputId,
        title: createTitleFromPrompt(findPromptForAssistant(messages, message))
      });
      setMessages((prev) => prev.map((m) => (m.id === message.id ? { ...m, saved: true } : m)));
    } catch {
      // swallow; user-facing error handling could be added later
    }
  }

  function loadHistoryItem(item: GenerationHistoryItem) {
    revokeAttachmentPreviews(attachments);
    revokeAttachmentPreviews(messages.flatMap((message) => message.attachments ?? []));
    setMessages(reconstructMessagesFromGeneration(item));
    setInput("");
    setAttachments([]);
    runGeneration.reset();
    if (item.modelId) {
      setSelectedModel(item.modelId);
    }
  }

  function loadSavedItem(item: SavedItem) {
    revokeAttachmentPreviews(attachments);
    revokeAttachmentPreviews(messages.flatMap((message) => message.attachments ?? []));
    const created = item.createdAt ?? new Date().toISOString();
    const reconstructed: ChatMessage[] = [];
    if (item.prompt) {
      reconstructed.push({
        id: generateId(),
        role: "user",
        content: item.prompt,
        createdAt: created
      });
    }
    reconstructed.push({
      id: generateId(),
      role: "assistant",
      content: item.output ?? "",
      outputId: item.outputId,
      modelId: item.modelId ?? null,
      createdAt: created,
      status: "done",
      saved: true
    });
    setMessages(reconstructed);
    setAttachments([]);
    setOverlay(null);
    if (item.modelId) {
      setSelectedModel(item.modelId);
    }
  }

  const userDisplayName = session?.user?.name?.split(" ")[0] ?? "there";
  const filteredHistory = useMemo(() => {
    const items = historyQuery.data ?? [];
    if (!threadSearch.trim()) return items;
    const q = threadSearch.trim().toLowerCase();
    return items.filter(
      (i) =>
        i.prompt.toLowerCase().includes(q) ||
        (i.output ?? "").toLowerCase().includes(q) ||
        (i.modelName ?? "").toLowerCase().includes(q)
    );
  }, [historyQuery.data, threadSearch]);

  const groupedHistory = useMemo(() => groupByRecency(filteredHistory), [filteredHistory]);

  return (
    <main className="flex h-screen overflow-hidden bg-(--canvas) text-(--ink)">
      <ChatSidebar
        groups={groupedHistory}
        isLoading={historyQuery.isLoading}
        onNewChat={handleNewChat}
        onOpenHistory={loadHistoryItem}
        onOpenSaved={() => setOverlay("saved")}
        onOpenSettings={() => setOverlay("settings")}
        onSignOut={() => void signOut()}
        search={threadSearch}
        session={session}
        sessionPending={sessionPending}
        setSearch={setThreadSearch}
      />

      <ChatArea
        activeModel={activeModel}
        attachments={attachments}
        canSend={canSend}
        input={input}
        isSending={isSending}
        messages={messages}
        modelOptions={modelOptions}
        onInputChange={setInput}
        onOpenSaved={() => setOverlay("saved")}
        onOpenSettings={() => setOverlay("settings")}
        onAddAttachments={(items) => setAttachments((prev) => [...prev, ...items])}
        onPickSuggestion={setInput}
        onRemoveAttachment={(id) => {
          setAttachments((prev) => {
            const removed = prev.filter((attachment) => attachment.id === id);
            revokeAttachmentPreviews(removed);
            return prev.filter((attachment) => attachment.id !== id);
          });
        }}
        onSaveMessage={handleSaveMessage}
        onSelectModel={setSelectedModel}
        onSubmit={() => void handleSend()}
        selectedModel={selectedModel}
        session={session}
        userName={userDisplayName}
      />

      {overlay === "saved" ? (
        <OverlayPanel onClose={() => setOverlay(null)} title="Saved">
          <SavedList
            isLoading={savedQuery.isLoading}
            items={savedQuery.data ?? []}
            onOpen={loadSavedItem}
          />
        </OverlayPanel>
      ) : null}

      {overlay === "settings" ? (
        <OverlayPanel onClose={() => setOverlay(null)} title="Settings">
          <SettingsPanel session={session} />
        </OverlayPanel>
      ) : null}
    </main>
  );
}

function revokeAttachmentPreviews(attachments: ChatAttachment[]) {
  for (const attachment of attachments) {
    if (attachment.previewUrl) {
      URL.revokeObjectURL(attachment.previewUrl);
    }
  }
}

function OverlayPanel({
  children,
  onClose,
  title
}: {
  children: ReactNode;
  onClose: () => void;
  title: string;
}) {
  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/30 px-4 py-8">
      <div className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-(--hairline) bg-(--surface-card) shadow-xl">
        <div className="flex items-center justify-between border-b border-(--hairline) px-5 py-3">
          <h2 className="text-base font-semibold text-(--ink)">{title}</h2>
          <button
            aria-label="Close"
            className="grid size-8 place-items-center rounded-md text-(--muted) hover:bg-(--surface-strong) hover:text-(--ink)"
            onClick={onClose}
            type="button"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

function SavedList({
  isLoading,
  items,
  onOpen
}: {
  isLoading: boolean;
  items: SavedItem[];
  onOpen: (item: SavedItem) => void;
}) {
  if (isLoading) {
    return <div className="px-5 py-6 text-sm text-(--muted)">Loading saved outputs...</div>;
  }

  if (items.length === 0) {
    return (
      <div className="px-5 py-8 text-center text-sm text-(--body)">
        Save an assistant reply to see it here.
      </div>
    );
  }

  return (
    <div className="divide-y divide-(--hairline)">
      {items.map((item) => (
        <button
          className="grid w-full gap-1.5 px-5 py-4 text-left hover:bg-(--canvas-soft)"
          key={item.id}
          onClick={() => onOpen(item)}
          type="button"
        >
          <div className="flex items-center justify-between gap-3">
            <p className="truncate text-sm font-medium text-(--ink)">{item.title}</p>
            <BookmarkCheck className="size-4 shrink-0 text-(--primary)" aria-hidden="true" />
          </div>
          <div className="flex flex-wrap gap-3 text-xs text-(--muted)">
            <span>{item.modelId ?? "OpenRouter"}</span>
            {item.createdAt ? <span>{formatDate(item.createdAt)}</span> : null}
          </div>
          <p className="line-clamp-2 text-sm leading-6 text-(--body)">
            {item.output ?? "Saved output content is unavailable."}
          </p>
        </button>
      ))}
    </div>
  );
}

function SettingsPanel({ session }: { session: ReturnType<typeof useSession>["data"] }) {
  return (
    <div className="grid gap-4 px-5 py-5 text-sm leading-6 text-(--body)">
      <div className="rounded-lg border border-(--hairline) bg-(--canvas-soft) p-4">
        <p className="font-medium text-(--ink)">Account</p>
        {session ? (
          <p className="mt-1">
            Signed in as <span className="text-(--ink)">{session.user?.email}</span>.
          </p>
        ) : (
          <p className="mt-1">You are not signed in.</p>
        )}
      </div>
      <div className="rounded-lg border border-(--hairline) bg-(--canvas-soft) p-4">
        <p className="font-medium text-(--ink)">OpenRouter</p>
        <p className="mt-1">Model keys remain on the API server through OPENROUTER_API_KEY.</p>
      </div>
      <div className="rounded-lg border border-(--hairline) bg-(--canvas-soft) p-4">
        <p className="font-medium text-(--ink)">Storage</p>
        <p className="mt-1">Generations and saved outputs are stored in your workspace.</p>
      </div>
      {session ? (
        <div>
          <Button onClick={() => void signOut()} type="button" variant="secondary">
            <LogOut aria-hidden="true" />
            Sign out
          </Button>
        </div>
      ) : null}
    </div>
  );
}
