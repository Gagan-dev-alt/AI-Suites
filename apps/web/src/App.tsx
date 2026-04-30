import {
  AudioLines,
  Bot,
  ChevronDown,
  Clock3,
  Image,
  LayoutDashboard,
  Play,
  Save,
  Settings,
  Sparkles,
  Video
} from "lucide-react";
import { Route, Routes } from "react-router";
import { AuthStatus } from "./components/AuthStatus";
import { Button } from "./components/ui/button";
import { SignIn } from "./SignIn";
import { useWorkspaceStore } from "./stores/workspace-store";

const navItems = [
  { label: "Workspace", icon: LayoutDashboard, active: true },
  { label: "History", icon: Clock3 },
  { label: "Saved", icon: Save },
  { label: "Settings", icon: Settings }
];

const modelKinds = [
  { label: "LLM", icon: Bot, tone: "bg-[var(--timeline-read)]" },
  { label: "Image", icon: Image, tone: "bg-[var(--timeline-edit)]" },
  { label: "Voice", icon: AudioLines, tone: "bg-[var(--timeline-grep)]" },
  { label: "Video", icon: Video, tone: "bg-[var(--timeline-thinking)]" }
];

export function App() {
  return (
    <Routes>
      <Route path="/sign-in" element={<SignIn />} />
      <Route path="*" element={<Workspace />} />
    </Routes>
  );
}

function Workspace() {
  const selectedModel = useWorkspaceStore((state) => state.selectedModel);

  return (
    <main className="min-h-screen bg-[var(--canvas)] text-[var(--ink)]">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[248px_minmax(0,1fr)]">
        <aside className="border-b border-[var(--hairline)] bg-[var(--canvas)] px-4 py-4 lg:border-b-0 lg:border-r">
          <div className="flex h-full flex-col gap-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
                  AI Suites
                </p>
                <h1 className="mt-1 text-[26px] font-normal leading-tight tracking-[-0.01em]">
                  Workbench
                </h1>
              </div>
              <div className="grid size-10 place-items-center rounded-[8px] bg-[var(--primary)] text-white">
                <Sparkles className="size-4" aria-hidden="true" />
              </div>
            </div>

            <nav className="grid gap-1" aria-label="Primary navigation">
              {navItems.map((item) => (
                <button
                  className={`flex h-10 items-center gap-3 rounded-[8px] px-3 text-left text-sm font-medium ${
                    item.active
                      ? "bg-[var(--surface-card)] text-[var(--ink)] ring-1 ring-[var(--hairline)]"
                      : "text-[var(--body)] hover:bg-[var(--surface-strong)] hover:text-[var(--ink)]"
                  }`}
                  key={item.label}
                  type="button"
                >
                  <item.icon className="size-4" aria-hidden="true" />
                  {item.label}
                </button>
              ))}
            </nav>

            <div className="mt-auto rounded-[12px] border border-[var(--hairline)] bg-[var(--surface-card)] p-4">
              <p className="text-[13px] font-medium text-[var(--ink)]">OpenRouter gateway</p>
              <p className="mt-2 text-sm leading-5 text-[var(--body)]">
                First provider layer is planned. Keys stay on the API server.
              </p>
            </div>
          </div>
        </aside>

        <section className="flex min-w-0 flex-col">
          <header className="flex min-h-16 flex-wrap items-center justify-between gap-3 border-b border-[var(--hairline)] px-5 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <Button variant="secondary">
                {selectedModel}
                <ChevronDown aria-hidden="true" />
              </Button>
              <span className="hidden text-sm text-[var(--muted)] sm:inline">
                Text generation workspace
              </span>
            </div>
            <div className="flex items-center gap-2">
              <AuthStatus />
              <Button>
                <Play aria-hidden="true" />
                Run
              </Button>
            </div>
          </header>

          <div className="grid flex-1 grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="min-w-0 px-5 py-6">
              <div className="mx-auto grid max-w-5xl gap-5">
                <section className="rounded-[12px] border border-[var(--hairline)] bg-[var(--surface-card)]">
                  <div className="border-b border-[var(--hairline)] px-5 py-4">
                    <p className="text-sm font-medium text-[var(--ink)]">Prompt</p>
                  </div>
                  <textarea
                    className="min-h-44 w-full resize-y bg-transparent px-5 py-4 font-mono text-[13px] leading-6 text-[var(--ink)] outline-none placeholder:text-[var(--muted)]"
                    placeholder="Draft the work you want the model to do..."
                  />
                </section>

                <section className="rounded-[12px] border border-[var(--hairline)] bg-[var(--canvas-soft)]">
                  <div className="flex items-center justify-between border-b border-[var(--hairline)] px-5 py-4">
                    <p className="text-sm font-medium text-[var(--ink)]">Output</p>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-[var(--timeline-thinking)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--ink)]">
                        Thinking
                      </span>
                      <span className="rounded-full bg-[var(--timeline-read)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--ink)]">
                        Reading
                      </span>
                      <span className="rounded-full bg-[var(--timeline-done)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-white">
                        Done
                      </span>
                    </div>
                  </div>
                  <div className="min-h-72 px-5 py-5 font-mono text-[13px] leading-6 text-[var(--body)]">
                    Output will appear here once the API and model gateway are connected.
                  </div>
                </section>
              </div>
            </div>

            <aside className="border-t border-[var(--hairline)] bg-[var(--canvas-soft)] px-5 py-6 xl:border-l xl:border-t-0">
              <div className="grid gap-5">
                <section>
                  <h2 className="text-sm font-semibold text-[var(--ink)]">Model modes</h2>
                  <div className="mt-3 grid gap-2">
                    {modelKinds.map((kind) => (
                      <button
                        className="flex h-12 items-center justify-between rounded-[8px] border border-[var(--hairline)] bg-[var(--surface-card)] px-3 text-left text-sm font-medium text-[var(--ink)]"
                        key={kind.label}
                        type="button"
                      >
                        <span className="flex items-center gap-3">
                          <span
                            className={`grid size-7 place-items-center rounded-full ${kind.tone}`}
                          >
                            <kind.icon className="size-3.5" aria-hidden="true" />
                          </span>
                          {kind.label}
                        </span>
                        <ChevronDown className="size-4 text-[var(--muted)]" aria-hidden="true" />
                      </button>
                    ))}
                  </div>
                </section>

                <section className="rounded-[12px] border border-[var(--hairline)] bg-[var(--surface-card)] p-4">
                  <h2 className="text-sm font-semibold text-[var(--ink)]">Run details</h2>
                  <dl className="mt-4 grid gap-3 text-sm">
                    <div className="flex justify-between gap-3">
                      <dt className="text-[var(--muted)]">Provider</dt>
                      <dd className="font-medium text-[var(--ink)]">OpenRouter</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-[var(--muted)]">Status</dt>
                      <dd className="font-medium text-[var(--ink)]">Scaffold</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-[var(--muted)]">Storage</dt>
                      <dd className="font-medium text-[var(--ink)]">MySQL planned</dd>
                    </div>
                  </dl>
                </section>
              </div>
            </aside>
          </div>
        </section>
      </div>
    </main>
  );
}
