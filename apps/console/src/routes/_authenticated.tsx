import type { ConsoleMembership, ConsoleMeResponse } from "@corral/schema";
import { AccessDenied } from "@corral/ui/components/access-denied";
import { Badge } from "@corral/ui/components/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@corral/ui/components/breadcrumb";
import { Button } from "@corral/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@corral/ui/components/card";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarItem,
  SidebarMenu,
  SidebarMenuItem,
} from "@corral/ui/components/sidebar";
import { createFileRoute, Outlet, redirect, useMatches, useRouter } from "@tanstack/react-router";
import { type FormEvent, useCallback, useMemo, useState } from "react";

import { type ConsolePersona, ConsoleShellProvider } from "../components/console-shell-context";
import { consoleApiClient } from "../lib/api";
import { authClient } from "../lib/auth";
import { activeEventId as defaultEventId, MockStoreProvider } from "../mocks";
import type { DemoState } from "../mocks/types";

type ConsoleSearch = {
  demo: DemoState;
};

const demoStates = [
  "default",
  "empty",
  "loading",
  "error",
  "validation-error",
  "success",
  "permission-denied",
  "offline",
  "webhook-pending",
] as const satisfies DemoState[];

function isDemoState(value: unknown): value is DemoState {
  return typeof value === "string" && demoStates.includes(value as DemoState);
}

function redirectHref(href: string) {
  const url = new URL(href, "http://console.local");
  return `${url.pathname}${url.search}${url.hash}`;
}

export const Route = createFileRoute("/_authenticated")({
  validateSearch: (search): ConsoleSearch => ({
    demo: isDemoState(search.demo) ? search.demo : "default",
  }),
  beforeLoad: async ({ context, location }) => {
    const sessionResult = await context.authClient.getSession();

    if (!sessionResult.data) {
      throw redirect({
        to: "/login",
        search: { redirect: redirectHref(location.href), demo: "default" },
      });
    }

    const response = await consoleApiClient.me({ headers: {} });

    if (response.status === 401) {
      throw redirect({
        to: "/login",
        search: { redirect: redirectHref(location.href), demo: "default" },
      });
    }

    if (response.status !== 200) {
      throw new Error(response.body.message);
    }

    const isOnboardingRoute = location.pathname.startsWith("/onboarding");
    const hasMembership = response.body.memberships.length > 0;

    if (sessionResult.data.user.emailVerified === false) {
      throw redirect({
        to: "/check-email",
        search: { email: sessionResult.data.user.email },
      });
    }

    if (!hasMembership && !response.body.user.isPlatformAdmin && !isOnboardingRoute) {
      throw redirect({
        to: "/onboarding",
        search: { demo: "default" },
      });
    }

    if (!hasMembership && response.body.user.isPlatformAdmin && !isOnboardingRoute) {
      throw redirect({ to: "/admin", search: { demo: "default" } });
    }

    return { session: sessionResult.data, consoleContext: response.body };
  },
  staticData: { breadcrumb: "Console" },
  component: AuthenticatedLayout,
});

const navSections = [
  {
    label: "Command",
    items: [
      { label: "Events", href: (eventId: string) => `/events/${eventId}/setup/basics` },
      { label: "Roster", href: (eventId: string) => `/events/${eventId}/roster` },
      { label: "BIBs", href: (eventId: string) => `/events/${eventId}/bibs` },
      { label: "Comms", href: (eventId: string) => `/events/${eventId}/comms` },
      { label: "Results", href: (eventId: string) => `/events/${eventId}/results/upload` },
    ],
  },
  {
    label: "Trust loop",
    items: [
      {
        label: "Certificates",
        href: (eventId: string) => `/events/${eventId}/certificates/status`,
      },
      { label: "Payments", href: (eventId: string) => `/events/${eventId}/payments` },
      { label: "Permissions", href: (eventId: string) => `/events/${eventId}/permissions` },
      { label: "Settings / Team", href: () => "/settings/team" },
    ],
  },
];

function readInitialEventId(events: Array<{ id: string }>) {
  if (typeof window === "undefined") {
    return events[0]?.id ?? defaultEventId;
  }

  const pathEventId = window.location.pathname.match(/\/events\/([^/]+)/)?.[1];
  if (pathEventId && events.some((event) => event.id === pathEventId)) {
    return pathEventId;
  }

  const storedEventId = window.localStorage.getItem("corral.console.activeEventId");
  if (storedEventId && events.some((event) => event.id === storedEventId)) {
    return storedEventId;
  }

  return events[0]?.id ?? defaultEventId;
}

function setDemoSearchParam(value: string) {
  const url = new URL(window.location.href);
  url.searchParams.set("demo", value);
  window.location.href = `${url.pathname}${url.search}${url.hash}`;
}

function useRouteBreadcrumbs() {
  const matches = useMatches();
  const crumbs = matches.flatMap((match) => {
    const breadcrumb = (match.staticData as { breadcrumb?: string } | undefined)?.breadcrumb;
    return breadcrumb ? [{ id: match.id, label: breadcrumb }] : [];
  });

  return crumbs.length > 0 ? crumbs : [{ id: "console", label: "Console" }];
}

function AuthenticatedLayout() {
  const router = useRouter();
  const { consoleContext } = Route.useRouteContext();
  const { demo } = Route.useSearch();
  const [activeEventId, setActiveEventIdState] = useState(() =>
    readInitialEventId(consoleContext.events),
  );
  const [eventName, setEventName] = useState("");
  const [createEventError, setCreateEventError] = useState<string | null>(null);
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const breadcrumbs = useRouteBreadcrumbs();
  const activeConsoleEvent = useMemo(
    () => consoleContext.events.find((event) => event.id === activeEventId),
    [activeEventId, consoleContext.events],
  );
  const activeMembership = useMemo(
    () =>
      activeConsoleEvent
        ? consoleContext.memberships.find(
            (membership) => membership.organizer.id === activeConsoleEvent.organizerId,
          )
        : undefined,
    [activeConsoleEvent, consoleContext.memberships],
  );
  const firstMembership = consoleContext.memberships[0];
  const persona = useMemo(
    () => buildConsolePersona(consoleContext, activeMembership),
    [activeMembership, consoleContext],
  );

  const setActiveEventId = useCallback(
    (eventId: string) => {
      if (!consoleContext.events.some((event) => event.id === eventId)) {
        return;
      }

      setActiveEventIdState(eventId);
      window.localStorage.setItem("corral.console.activeEventId", eventId);

      const path = window.location.pathname;
      if (path.startsWith("/events/")) {
        window.location.href =
          path.replace(/\/events\/[^/]+/, `/events/${eventId}`) + window.location.search;
      }
    },
    [consoleContext.events],
  );

  async function handleSignOut() {
    await authClient.signOut();
    await router.navigate({ to: "/login", search: { demo: "default" } });
  }

  async function handleCreateFirstEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!firstMembership) {
      return;
    }

    const name = eventName.trim();

    if (name.length < 2) {
      setCreateEventError("Enter at least 2 characters for the event name.");
      return;
    }

    setIsCreatingEvent(true);
    setCreateEventError(null);

    try {
      const response = await consoleApiClient.createOrganizerEvent({
        headers: {},
        params: { organizerId: firstMembership.organizer.id },
        body: { name },
      });

      if (response.status !== 201) {
        setCreateEventError(response.body.message);
        return;
      }

      window.localStorage.setItem("corral.console.activeEventId", response.body.event.id);
      await router.invalidate();
      await router.navigate({
        to: "/events/$eventId/setup/basics",
        params: { eventId: response.body.event.id },
        search: { demo },
      });
    } catch (error) {
      setCreateEventError(error instanceof Error ? error.message : "Event creation failed.");
    } finally {
      setIsCreatingEvent(false);
    }
  }

  if (!activeMembership && window.location.pathname.startsWith("/onboarding")) {
    return (
      <main className="min-h-screen bg-background text-foreground">
        <header className="border-b border-border bg-background/95 px-6 py-5 backdrop-blur xl:px-8">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.35em] text-primary">
                Organizer onboarding
              </p>
              <h1 className="font-display text-4xl font-black uppercase tracking-tight">Corral</h1>
            </div>
            <Button type="button" variant="outline" onClick={handleSignOut}>
              Sign out
            </Button>
          </div>
        </header>
        <section className="px-6 py-8 xl:px-8">
          <Outlet />
        </section>
      </main>
    );
  }

  if (firstMembership && !activeConsoleEvent) {
    const canCreateEvent =
      firstMembership.organizer.reviewStatus === "approved" &&
      firstMembership.capabilities.includes("events:write");

    return (
      <main className="min-h-screen bg-background p-8 text-foreground">
        <div className="mx-auto max-w-4xl">
          <Card className="overflow-hidden rounded-[2rem]">
            <CardHeader className="bg-[#0f172a] text-white">
              <Badge variant="outline" className="w-fit border-white/20 text-white">
                {firstMembership.organizer.reviewStatus}
              </Badge>
              <CardTitle className="font-display text-5xl uppercase leading-none">
                Create your first event
              </CardTitle>
              <CardDescription className="text-slate-300">
                {firstMembership.organizer.name} is connected to your account. Create a draft event
                now, then complete basics, fees, policies, readiness, and publishing in setup.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 p-6">
              <p className="text-sm text-muted-foreground">
                {profileStatusMessage(firstMembership.organizer.reviewStatus)}
              </p>
              {canCreateEvent ? (
                <form
                  className="grid gap-3 rounded-2xl border p-4"
                  onSubmit={handleCreateFirstEvent}
                >
                  <label
                    className="grid gap-2 text-sm font-medium text-foreground"
                    htmlFor="first-event-name"
                  >
                    Event name
                    <input
                      id="first-event-name"
                      className="h-11 rounded-md border border-input bg-background px-3 text-sm font-normal"
                      placeholder="Coimbatore Marathon 2026"
                      value={eventName}
                      onChange={(inputEvent) => setEventName(inputEvent.currentTarget.value)}
                      disabled={isCreatingEvent}
                    />
                  </label>
                  {createEventError ? (
                    <p className="text-sm font-medium text-destructive">{createEventError}</p>
                  ) : null}
                  <div className="flex flex-wrap gap-3">
                    <Button type="submit" disabled={isCreatingEvent}>
                      {isCreatingEvent ? "Creating..." : "Create draft event"}
                    </Button>
                    <Button asChild variant="outline">
                      <a href="/onboarding">View organizer profile</a>
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="rounded-2xl border border-warning/30 bg-warning/10 p-4 text-sm text-warning-text">
                  Event creation unlocks after Corral approves this organizer profile.
                </div>
              )}
              <div className="flex flex-wrap gap-3">
                <Button onClick={handleSignOut}>Sign out</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  if (!activeMembership || !activeConsoleEvent) {
    return (
      <main className="min-h-screen bg-background p-8 text-foreground">
        <AccessDenied
          title="Organizer access required"
          description="Your Corral account is signed in, but it is not assigned to an organizer for this event."
          roleContext={consoleContext.user.email}
          actions={<Button onClick={handleSignOut}>Sign out</Button>}
        />
      </main>
    );
  }

  return (
    <MockStoreProvider>
      <ConsoleShellProvider
        activeEventId={activeConsoleEvent.id}
        setActiveEventId={setActiveEventId}
        persona={persona}
        consoleContext={consoleContext}
        demo={demo}
      >
        <div className="min-h-screen bg-background text-foreground lg:grid lg:grid-cols-[17rem_1fr]">
          <Sidebar className="sticky top-0 hidden h-screen min-h-screen bg-[#0f172a] lg:flex">
            <SidebarHeader className="border-sidebar-border/70">
              <div>
                <div className="font-display text-3xl font-black uppercase tracking-tight text-white">
                  Corral
                </div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sidebar-foreground/60">
                  Organizer
                </p>
              </div>
            </SidebarHeader>
            <SidebarContent>
              {navSections.map((section) => (
                <SidebarGroup key={section.label}>
                  <SidebarGroupLabel>{section.label}</SidebarGroupLabel>
                  <SidebarMenu>
                    {section.items.map((item) => {
                      const href = item.href(activeConsoleEvent.id);
                      const active =
                        typeof window !== "undefined" && window.location.pathname === href;
                      return (
                        <SidebarMenuItem key={item.label}>
                          <SidebarItem href={href} active={active}>
                            {item.label}
                          </SidebarItem>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroup>
              ))}
            </SidebarContent>
            <SidebarFooter>
              <p className="text-xs text-sidebar-foreground/70">{persona.user.name}</p>
              <p className="text-xs text-sidebar-foreground/50">{persona.role}</p>
            </SidebarFooter>
          </Sidebar>

          <main className="min-w-0">
            <header className="sticky top-0 z-20 border-b border-border bg-background/95 px-6 py-4 backdrop-blur xl:px-8">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <Breadcrumb>
                    <BreadcrumbList>
                      {breadcrumbs.flatMap((crumb, index) => {
                        const item = (
                          <BreadcrumbItem key={crumb.id}>
                            <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                          </BreadcrumbItem>
                        );
                        return index > 0
                          ? [<BreadcrumbSeparator key={`sep-${crumb.id}`} />, item]
                          : [item];
                      })}
                    </BreadcrumbList>
                  </Breadcrumb>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {activeConsoleEvent.name} · {activeConsoleEvent.venueName ?? "Venue pending"}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <label className="grid gap-1 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Event context
                    <select
                      id="console-active-event"
                      name="activeEventId"
                      className="h-10 min-w-72 rounded-md border border-input bg-background px-3 text-sm font-medium normal-case tracking-normal text-foreground"
                      value={activeConsoleEvent.id}
                      onChange={(event) => setActiveEventId(event.target.value)}
                    >
                      {consoleContext.events.map((event) => (
                        <option key={event.id} value={event.id}>
                          {event.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  {import.meta.env.DEV ? (
                    <div className="flex flex-wrap gap-2 rounded-xl border border-dashed border-primary/40 bg-brand-tint px-3 py-2">
                      <select
                        aria-label="Demo state"
                        id="console-demo-state"
                        name="demo"
                        className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                        value={demo}
                        onChange={(event) => setDemoSearchParam(event.target.value)}
                      >
                        {demoStates.map((state) => (
                          <option key={state} value={state}>
                            {state}
                          </option>
                        ))}
                      </select>
                      <Button type="button" variant="outline" size="sm" onClick={handleSignOut}>
                        Sign out
                      </Button>
                    </div>
                  ) : (
                    <Button type="button" variant="outline" onClick={handleSignOut}>
                      Sign out
                    </Button>
                  )}
                </div>
              </div>
            </header>
            <section className="px-6 py-8 xl:px-8">
              <Outlet />
            </section>
          </main>
        </div>
      </ConsoleShellProvider>
    </MockStoreProvider>
  );
}

function buildConsolePersona(
  consoleContext: ConsoleMeResponse,
  activeMembership: ConsoleMembership | undefined,
): ConsolePersona {
  const platformAdmin = consoleContext.user.isPlatformAdmin;

  if (!activeMembership) {
    return {
      id: platformAdmin ? "platform-admin" : "no-organizer-membership",
      label: platformAdmin ? "Corral admin" : "No organizer membership",
      user: {
        id: consoleContext.user.id,
        name: consoleContext.user.name,
        email: consoleContext.user.email,
      },
      role: platformAdmin ? "Corral Admin" : "Read-only Viewer",
      capabilities: platformAdmin ? consoleContext.user.platformCapabilities : [],
      isAdmin: platformAdmin,
      isSessionExpired: false,
      isAccessDenied: false,
    };
  }

  return {
    id: consoleContext.user.isPlatformAdmin
      ? "corral-admin"
      : roleCompatibilityId(activeMembership.role),
    label: activeMembership.organizer.name,
    user: {
      id: consoleContext.user.id,
      name: consoleContext.user.name,
      email: consoleContext.user.email,
    },
    role: activeMembership.role,
    capabilities: activeMembership.capabilities,
    organizerId: activeMembership.organizer.id,
    isAdmin: platformAdmin,
    isSessionExpired: false,
    isAccessDenied: false,
  };
}

function profileStatusMessage(reviewStatus: ConsoleMembership["organizer"]["reviewStatus"]) {
  if (reviewStatus === "approved") {
    return "Your organizer is approved. Event draft creation is the next organizer/event domain slice.";
  }

  if (reviewStatus === "changes-requested") {
    return "Corral requested changes to this organizer profile. Update support details when profile editing is available, or contact support.";
  }

  if (reviewStatus === "rejected") {
    return "This organizer profile was rejected. Contact Corral support before creating events.";
  }

  if (reviewStatus === "suspended") {
    return "This organizer is suspended. Event publishing and payments remain unavailable.";
  }

  return "Corral admins can review and approve this organizer from the admin queue. Publishing and payments remain blocked until approval gates are enforced in the event slice.";
}

function roleCompatibilityId(role: ConsoleMembership["role"]) {
  if (role === "Read-only Viewer") {
    return "org-readonly";
  }

  if (role === "Support/Check-in") {
    return "org-staff";
  }

  return "org-owner";
}
