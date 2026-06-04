import { Button } from "@corral/ui/components/button";
import { EmptyState } from "@corral/ui/components/empty-state";
import { createFileRoute } from "@tanstack/react-router";

import { getSafeRedirectPath } from "../lib/auth";

type SessionExpiredSearch = {
  redirect?: string;
};

export const Route = createFileRoute("/session-expired")({
  validateSearch: (search): SessionExpiredSearch => ({
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
  }),
  component: SessionExpiredPage,
});

function SessionExpiredPage() {
  const { redirect } = Route.useSearch();
  const loginHref = `/login?redirect=${encodeURIComponent(getSafeRedirectPath(redirect))}`;

  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-3xl items-center">
        <EmptyState
          className="w-full rounded-[2rem] border-solid"
          title="Session expired"
          description="Your console demo session has ended. Sign in again or switch to an active mock persona."
          action={
            <Button asChild>
              <a href={loginHref}>Return to login</a>
            </Button>
          }
        />
      </div>
    </main>
  );
}
