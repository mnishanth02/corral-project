import { Alert, AlertDescription, AlertTitle } from "@corral/ui/components/alert";
import { Button } from "@corral/ui/components/button";
import { EmptyState } from "@corral/ui/components/empty-state";
import type { QueryClient } from "@tanstack/react-query";
import {
  createRootRouteWithContext,
  type ErrorComponentProps,
  Outlet,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

import type { AuthClient } from "../lib/auth";

export interface RouterContext {
  queryClient: QueryClient;
  authClient: AuthClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootRoute,
  notFoundComponent: ConsoleNotFound,
  errorComponent: ConsoleError,
});

function ConsoleNotFound() {
  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-4xl items-center">
        <EmptyState
          className="w-full rounded-[2rem] border-solid"
          title="Console route not found"
          description="This shell is ready, but the requested screen may not be built yet. Use the organizer or admin home while screen agents add route files."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Button asChild>
                <a href="/">Organizer home</a>
              </Button>
              <Button asChild variant="outline">
                <a href="/admin">Admin home</a>
              </Button>
              <Button asChild variant="outline">
                <a href="/login">Login</a>
              </Button>
            </div>
          }
        />
      </div>
    </main>
  );
}

function ConsoleError({ error, reset }: ErrorComponentProps) {
  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-4xl items-center">
        <Alert variant="destructive" className="rounded-[2rem] p-6">
          <AlertTitle className="font-display text-3xl uppercase">Console error</AlertTitle>
          <AlertDescription className="mt-3 grid gap-4">
            <span>{error.message || "Something unexpected happened in the console shell."}</span>
            <span className="flex flex-wrap gap-2">
              <Button type="button" onClick={reset}>
                Retry
              </Button>
              <Button asChild variant="outline">
                <a href="/admin/support">Support route</a>
              </Button>
            </span>
          </AlertDescription>
        </Alert>
      </div>
    </main>
  );
}

function RootRoute() {
  return (
    <>
      <Outlet />
      {import.meta.env.DEV ? <TanStackRouterDevtools position="bottom-right" /> : null}
    </>
  );
}
