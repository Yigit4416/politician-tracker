import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/react";
import { Link } from "@tanstack/react-router";
import { ChartLineUp, SignIn, UserPlus } from "@phosphor-icons/react";

import { Button } from "@/components/ui/button";

export function TopBar() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2 text-sm font-semibold">
          <ChartLineUp className="size-5 text-primary" weight="duotone" />
          <span>Politician Tracker</span>
        </Link>

        <nav className="flex items-center gap-2">
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
                Sign in
              </Button>
            </SignInButton>
            <SignUpButton mode="modal">
              <Button size="sm">
                <UserPlus />
                Sign up
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
