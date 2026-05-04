import { LogOut, UserRound } from "lucide-react";
import { Button } from "./ui/button";
import { signOut, useSession } from "../lib/auth-client";

export function AuthStatus() {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return (
      <div className="h-10 rounded-lg border border-(--hairline) bg-(--surface-card) px-3 py-2 text-sm text-(--muted)">
        Checking session
      </div>
    );
  }

  if (!session) {
    return (
      <Button asChild variant="secondary">
        <a href="/sign-in">Sign in</a>
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="hidden items-center gap-2 rounded-lg border border-(--hairline) bg-(--surface-card) px-3 py-2 text-sm text-(--ink) sm:flex">
        <UserRound className="size-4" aria-hidden="true" />
        <span className="max-w-40 truncate">{session.user.email}</span>
      </div>
      <Button
        aria-label="Sign out"
        onClick={() => {
          void signOut();
        }}
        size="icon"
        type="button"
        variant="secondary"
      >
        <LogOut aria-hidden="true" />
      </Button>
    </div>
  );
}
