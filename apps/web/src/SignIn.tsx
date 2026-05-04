import { ArrowRight, KeyRound, Sparkles } from "lucide-react";
import { Button } from "./components/ui/button";
import { signIn, useSession } from "./lib/auth-client";

const providers = [
  {
    id: "google",
    label: "Continue with Google"
  },
  {
    id: "microsoft",
    label: "Continue with Microsoft"
  }
] as const;

export function SignIn() {
  const { data: session, isPending } = useSession();

  return (
    <main className="grid min-h-screen bg-(--canvas) px-5 py-6 text-(--ink) lg:grid-cols-[minmax(0,1fr)_520px] lg:p-8">
      <section className="flex min-h-[42vh] flex-col justify-between border-b border-(--hairline) pb-8 lg:min-h-0 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-10">
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-lg bg-(--primary) text-white">
            <Sparkles className="size-4" aria-hidden="true" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-(--muted)">
              AI Suites
            </p>
            <p className="text-sm font-medium text-(--ink)">Productive AI under one roof</p>
          </div>
        </div>

        <div className="max-w-3xl py-12 lg:py-0">
          <h1 className="text-[44px] font-normal leading-[1.05] tracking-[-0.02em] text-(--ink) sm:text-[64px]">
            Sign in to your AI workbench.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-(--body)">
            One workspace for models, prompts, generated work, and saved outputs.
          </p>
        </div>

        <div className="grid max-w-xl grid-cols-3 gap-2">
          <span className="h-2 rounded-full bg-(--timeline-thinking)" />
          <span className="h-2 rounded-full bg-(--timeline-read)" />
          <span className="h-2 rounded-full bg-(--timeline-done)" />
        </div>
      </section>

      <section className="flex items-center justify-center py-8 lg:pl-10">
        <div className="w-full max-w-md rounded-xl border border-(--hairline) bg-(--surface-card) p-5">
          <div className="flex items-center gap-3 border-b border-(--hairline) pb-4">
            <div className="grid size-9 place-items-center rounded-lg bg-(--canvas-soft) text-(--ink)">
              <KeyRound className="size-4" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-(--ink)">Welcome back</h2>
              <p className="text-sm text-(--muted)">
                {session ? "Session active" : "Choose an OAuth provider"}
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-3">
            {providers.map((provider) => (
              <Button
                disabled={isPending}
                key={provider.id}
                onClick={() => {
                  void signIn.social({
                    callbackURL: window.location.origin,
                    provider: provider.id
                  });
                }}
                type="button"
                variant="secondary"
              >
                {provider.label}
                <ArrowRight aria-hidden="true" />
              </Button>
            ))}
          </div>

          <p className="mt-5 text-sm leading-6 text-(--body)">
            Add Google and Microsoft OAuth credentials to `.env` before testing provider redirects.
          </p>
        </div>
      </section>
    </main>
  );
}
