import { Button } from "@corral/ui/components/button";
import { EmptyState } from "@corral/ui/components/empty-state";
import type { ErrorComponentProps } from "@tanstack/react-router";
import { createRootRoute, Link, Outlet, useLocation, useSearch } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

import { DevDemoSwitcher } from "../components/dev-demo-switcher";
import { StickyCtaProvider, useStickyCtaSlot } from "../components/sticky-cta";
import { parseParticipantPersona } from "../mocks/personas";
import type { DemoState, ParticipantPersona } from "../mocks/types";
import { parseDemoState } from "../mocks/utils";

type RootSearch = {
  demo?: DemoState;
  as?: ParticipantPersona;
};

export const Route = createRootRoute({
  validateSearch: (search): RootSearch => {
    const demo = parseDemoState(typeof search.demo === "string" ? search.demo : undefined);
    const persona = parseParticipantPersona(typeof search.as === "string" ? search.as : undefined);

    return {
      demo: demo === "default" ? undefined : demo,
      as: persona === "public" ? undefined : persona,
    };
  },
  component: RootRoute,
  notFoundComponent: ParticipantNotFound,
  errorComponent: ParticipantError,
});

function RootRoute() {
  return (
    <StickyCtaProvider>
      <ParticipantShell />
      {import.meta.env.DEV ? <DevDemoSwitcher /> : null}
      {import.meta.env.DEV ? <TanStackRouterDevtools position="bottom-right" /> : null}
    </StickyCtaProvider>
  );
}

function ParticipantShell() {
  const { hasCta } = useStickyCtaSlot();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,var(--brand-tint),transparent_18rem),linear-gradient(180deg,#fff,#f8fafc_42%)] text-foreground">
      <ParticipantTopBar />
      <main className={`mx-auto w-full max-w-[430px] px-4 pt-4 ${hasCta ? "pb-32" : "pb-8"}`}>
        <Outlet />
      </main>
      <StickyBottomCta />
    </div>
  );
}

function ParticipantTopBar() {
  const location = useLocation();
  const search = useSearch({ strict: false }) as Partial<RootSearch>;
  const pathname = location.pathname;
  const area = getAreaLabel(pathname);
  const mode = search.demo && search.demo !== "default" ? search.demo : (search.as ?? "public");

  return (
    <header className="sticky top-0 z-30 border-b border-orange-100/80 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-[430px] items-center justify-between gap-3 px-4">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            to="/"
            className="group flex items-center gap-2"
            aria-label="Corral participant home"
          >
            <span className="flex size-9 items-center justify-center rounded-2xl bg-primary font-display font-black text-primary-foreground shadow-lg shadow-orange-500/20">
              C
            </span>
            <span className="font-display font-black text-xl tracking-[-0.04em] text-brand-navy">
              Corral
            </span>
          </Link>
          <nav aria-label="Participant navigation" className="flex items-center gap-1 text-sm">
            <Link
              to="/"
              className="rounded-full px-3 py-1.5 font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              Home
            </Link>
            <a
              href="/calendar"
              className="rounded-full px-3 py-1.5 font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              Calendar
            </a>
          </nav>
        </div>
        <div className="min-w-0 text-right">
          <p className="truncate font-semibold text-sm leading-5 text-brand-navy">{area}</p>
          <p className="truncate text-[0.68rem] uppercase tracking-[0.18em] text-brand-orange-strong">
            {mode}
          </p>
        </div>
      </div>
    </header>
  );
}

function getAreaLabel(pathname: string) {
  if (pathname.startsWith("/my/")) {
    return "My race";
  }

  if (pathname.includes("/register")) {
    return "Registration";
  }

  if (pathname.startsWith("/calendar")) {
    return "Calendar";
  }

  if (pathname.startsWith("/events/")) {
    return "Event";
  }

  return "Participant";
}

function StickyBottomCta() {
  const { cta, inputFocused } = useStickyCtaSlot();

  if (!cta) {
    return null;
  }

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-20 border-t border-orange-100/90 bg-white/95 shadow-[0_-18px_45px_rgba(15,23,42,0.12)] backdrop-blur-xl transition-[transform,opacity] duration-200 print:hidden ${
        inputFocused
          ? "pointer-events-none translate-y-full opacity-0"
          : "translate-y-0 opacity-100"
      }`}
    >
      <div className="mx-auto w-full max-w-[430px] px-4 pt-3 pb-[max(0.85rem,env(safe-area-inset-bottom))]">
        {cta}
      </div>
    </div>
  );
}

function ParticipantNotFound() {
  return (
    <div className="py-10">
      <EmptyState
        title="We could not find that Corral page"
        description="The race link may have changed. Head back home or browse the public calendar."
        action={
          <>
            <Button asChild>
              <Link to="/">Go home</Link>
            </Button>
            <Button asChild variant="outline">
              <a href="/calendar">Open calendar</a>
            </Button>
          </>
        }
      />
    </div>
  );
}

function ParticipantError({ error, reset }: ErrorComponentProps) {
  return (
    <div className="py-10">
      <EmptyState
        title="Corral hit a snag"
        description={
          <span>
            Your screen is safe, but this view could not load. Try again or contact support with the
            message: {error.message}
          </span>
        }
        action={
          <>
            <Button type="button" onClick={reset}>
              Retry
            </Button>
            <Button asChild variant="outline">
              <a href="mailto:support@corral.local">Contact support</a>
            </Button>
          </>
        }
      />
    </div>
  );
}
