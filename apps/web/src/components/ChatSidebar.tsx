import {
  BookmarkCheck,
  LogOut,
  MessageSquarePlus,
  Search,
  Settings as SettingsIcon,
  Sparkles,
  UserRound
} from "lucide-react";
import type { GenerationHistoryItem } from "../lib/api";
import type { useSession } from "../lib/auth-client";
import { initialsFromUser, threadTitle, type HistoryGroup } from "../lib/chat";
import { Button } from "./ui/button";

type SessionData = ReturnType<typeof useSession>["data"];

export type ChatSidebarProps = {
  groups: HistoryGroup[];
  isLoading: boolean;
  onNewChat: () => void;
  onOpenHistory: (item: GenerationHistoryItem) => void;
  onOpenSaved: () => void;
  onOpenSettings: () => void;
  onSignOut: () => void;
  search: string;
  session: SessionData;
  sessionPending: boolean;
  setSearch: (value: string) => void;
};

export function ChatSidebar({
  groups,
  isLoading,
  onNewChat,
  onOpenHistory,
  onOpenSaved,
  onOpenSettings,
  onSignOut,
  search,
  session,
  sessionPending,
  setSearch
}: ChatSidebarProps) {
  return (
    <aside className="hidden h-screen w-[340px] max-w-[340px] shrink-0 overflow-x-hidden flex-col border-r border-(--hairline) bg-(--canvas-soft) lg:flex">
      <div className="flex min-w-0 items-center gap-2 px-5 pb-3 pt-5">
        <div className="grid size-7 place-items-center rounded-md bg-(--primary) text-white">
          <Sparkles className="size-3.5" aria-hidden="true" />
        </div>
        <span className="min-w-0 truncate text-[15px] font-semibold tracking-tight text-(--ink)">
          AI Suites
        </span>
      </div>

      <div className="px-4 pb-2 pt-2">
        <Button className="w-full" onClick={onNewChat} type="button">
          <MessageSquarePlus aria-hidden="true" />
          New Chat
        </Button>
      </div>

      <div className="px-4 pb-3 pt-2">
        <label className="relative block">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-(--muted)"
            aria-hidden="true"
          />
          <input
            className="h-9 w-full rounded-lg border border-transparent bg-transparent pl-9 pr-3 text-sm text-(--ink) outline-none placeholder:text-(--muted) focus:border-(--hairline-strong) focus:bg-(--surface-card)"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search your threads..."
            value={search}
          />
        </label>
      </div>

      <div className="themed-scrollbar min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-2 pb-2">
        {isLoading ? (
          <div className="px-3 py-4 text-sm text-(--muted)">Loading threads...</div>
        ) : groups.length === 0 ? (
          <div className="px-3 py-4 text-sm text-(--muted)">
            {session ? "No threads yet" : "Sign in to see your threads"}
          </div>
        ) : (
          groups.map((group) => (
            <div className="mb-3" key={group.label}>
              <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-(--muted)">
                {group.label}
              </p>
              <div className="grid min-w-0">
                {group.items.map((item) => (
                  <button
                    className="flex w-full min-w-0 items-center gap-2 overflow-hidden rounded-md px-3 py-2 text-left text-sm text-(--body) hover:bg-(--surface-strong) hover:text-(--ink)"
                    key={item.id}
                    onClick={() => onOpenHistory(item)}
                    type="button"
                  >
                    <span className="block min-w-0 flex-1 truncate">{threadTitle(item.prompt)}</span>
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="border-t border-(--hairline) p-3">
        <div className="mb-2 grid min-w-0 grid-cols-2 gap-2">
          <button
            className="flex h-9 min-w-0 items-center justify-center gap-2 rounded-md border border-(--hairline) bg-(--surface-card) px-2 text-sm font-medium text-(--ink) hover:bg-(--surface-strong)"
            onClick={onOpenSaved}
            type="button"
          >
            <BookmarkCheck className="size-4" aria-hidden="true" />
            <span className="truncate">Saved</span>
          </button>
          <button
            className="flex h-9 min-w-0 items-center justify-center gap-2 rounded-md border border-(--hairline) bg-(--surface-card) px-2 text-sm font-medium text-(--ink) hover:bg-(--surface-strong)"
            onClick={onOpenSettings}
            type="button"
          >
            <SettingsIcon className="size-4" aria-hidden="true" />
            <span className="truncate">Settings</span>
          </button>
        </div>

        {sessionPending ? (
          <div className="flex h-10 items-center rounded-md px-2 text-sm text-(--muted)">
            Checking session...
          </div>
        ) : session ? (
          <div className="flex items-center gap-2 rounded-md px-1 py-1">
            <div className="grid size-8 shrink-0 place-items-center rounded-full bg-(--primary) text-xs font-semibold text-white">
              {initialsFromUser(session.user?.name, session.user?.email)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-(--ink)">
                {session.user?.name ?? session.user?.email}
              </p>
              <p className="truncate text-xs text-(--muted)">{session.user?.email}</p>
            </div>
            <button
              aria-label="Sign out"
              className="grid size-8 place-items-center rounded-md text-(--muted) hover:bg-(--surface-strong) hover:text-(--ink)"
              onClick={onSignOut}
              type="button"
            >
              <LogOut className="size-4" aria-hidden="true" />
            </button>
          </div>
        ) : (
          <a
            className="flex h-9 items-center justify-center gap-2 rounded-md bg-(--primary) px-3 text-sm font-medium text-white hover:bg-(--primary-active)"
            href="/sign-in"
          >
            <UserRound className="size-4" aria-hidden="true" />
            Sign in
          </a>
        )}
      </div>
    </aside>
  );
}
