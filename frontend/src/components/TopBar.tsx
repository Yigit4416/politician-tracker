import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/react";
import { Link } from "@tanstack/react-router";
import { ChartLineUp, SignIn, UserPlus } from "@phosphor-icons/react";

import { Button } from "@/components/ui/button";

export function TopBar() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex min-h-14 w-full max-w-6xl flex-wrap items-center justify-between gap-2 px-3 py-2 sm:flex-nowrap sm:px-6">
        <Link
          to="/"
          className="flex min-w-0 items-center gap-2 text-sm font-semibold"
        >
          <ChartLineUp className="size-5 text-primary" weight="duotone" />
          <span className="truncate">Politician Tracker</span>
        </Link>

        <nav className="flex min-w-0 flex-wrap items-center justify-end gap-1.5 sm:flex-nowrap sm:gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link to="/politicians">Politicians</Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link to="/all-trades">Trades</Link>
          </Button>

          <Show when="signed-out">
            <SignInButton mode="modal">
              <Button variant="outline" size="sm">
                <SignIn />
                <span className="hidden min-[380px]:inline">Sign in</span>
              </Button>
            </SignInButton>
            <SignUpButton mode="modal">
              <Button size="sm">
                <UserPlus />
                <span className="hidden min-[380px]:inline">Sign up</span>
              </Button>
            </SignUpButton>
          </Show>

          <Show when="signed-in">
            <UserButton />
          </Show>
        </nav>
      </div>
    </header>
  );
}
