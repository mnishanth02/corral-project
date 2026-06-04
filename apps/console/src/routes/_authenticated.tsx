import { AccessDenied } from "@corral/ui/components/access-denied";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@corral/ui/components/breadcrumb";
import { Button } from "@corral/ui/components/button";
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
import { createFileRoute, Outlet, redirect, useMatches } from "@tanstack/react-router";
import { useCallback, useMemo, useState } from "react";

import { ConsoleShellProvider } from "../components/console-shell-context";
import {
  activeEventId as defaultEventId,
  getActivePersona,
  getMockSessionResult,
  isPersonaId,
  MockStoreProvider,
  mockEvents,
  personaIds,
} from "../mocks";
import type { DemoState, PersonaId } from "../mocks/types";

type ConsoleSearch = {
  as?: PersonaId;
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

function searchStringFromHref(href: string) {
  const index = href.indexOf("?");
  return index === -1 ? "" : href.slice(index);
}

function redirectHrefWithoutPersona(href: string) {
  const url = new URL(href, "http://console.local");
  url.searchParams.delete("as");
  return `${url.pathname}${url.search}${url.hash}`;
}

export const Route = createFileRoute("/_authenticated")({
  validateSearch: (search): ConsoleSearch => ({
    as: isPersonaId(search.as) ? search.as : undefined,
    demo: isDemoState(search.demo) ? search.demo : "default",
  }),
  beforeLoad: async ({ location }) => {
    const persona = getActivePersona(searchStringFromHref(location.href));
    const result = await getMockSessionResult(persona);

    if (persona.isSessionExpired || !result.data) {
      throw redirect({
        to: "/session-expired",
        search: { redirect: redirectHrefWithoutPersona(location.href) },
      });
    }

    return { session: result.data, persona };
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

function readInitialEventId() {
  if (typeof window === "undefined") {
    return defaultEventId;
  }

  const pathEventId = window.location.pathname.match(/\/events\/([^/]+)/)?.[1];
  if (pathEventId && mockEvents.some((event) => event.id === pathEventId)) {
    return pathEventId;
  }

  const storedEventId = window.localStorage.getItem("corral.console.activeEventId");
  if (storedEventId && mockEvents.some((event) => event.id === storedEventId)) {
    return storedEventId;
  }

  return defaultEventId;
}

function setSearchParam(key: "as" | "demo", value: string) {
  const url = new URL(window.location.href);
  url.searchParams.set(key, value);
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
  const { persona } = Route.useRouteContext();
  const { demo } = Route.useSearch();
  const [activeEventId, setActiveEventIdState] = useState(readInitialEventId);
  const breadcrumbs = useRouteBreadcrumbs();

  const activeEvent = useMemo(
    () => mockEvents.find((event) => event.id === activeEventId) ?? mockEvents[0],
    [activeEventId],
  );

  const setActiveEventId = useCallback((eventId: string) => {
    setActiveEventIdState(eventId);
    window.localStorage.setItem("corral.console.activeEventId", eventId);

    const path = window.location.pathname;
    if (path.startsWith("/events/")) {
      window.location.href =
        path.replace(/\/events\/[^/]+/, `/events/${eventId}`) + window.location.search;
    }
  }, []);

  if (persona.isAccessDenied) {
    return (
      <main className="min-h-screen bg-background p-8 text-foreground">
        <AccessDenied
          title="Organizer access denied"
          description="This demo persona has no organizer console capabilities. Switch personas to continue."
          roleContext={ persona.role }
          actions={
            <Button type="button" onClick={ () => setSearchParam("as", "org-owner") }>
              Use organizer owner
            </Button>
          }
        />
      </main>
    );
  }

  return (
    <MockStoreProvider>
      <ConsoleShellProvider
        activeEventId={ activeEvent.id }
        setActiveEventId={ setActiveEventId }
        persona={ persona }
        demo={ demo }
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
              { navSections.map((section) => (
                <SidebarGroup key={ section.label }>
                  <SidebarGroupLabel>{ section.label }</SidebarGroupLabel>
                  <SidebarMenu>
                    { section.items.map((item) => {
                      const href = item.href(activeEvent.id);
                      const active =
                        typeof window !== "undefined" && window.location.pathname === href;
                      return (
                        <SidebarMenuItem key={ item.label }>
                          <SidebarItem href={ href } active={ active }>
                            { item.label }
                          </SidebarItem>
                        </SidebarMenuItem>
                      );
                    }) }
                  </SidebarMenu>
                </SidebarGroup>
              )) }
            </SidebarContent>
            <SidebarFooter>
              <p className="text-xs text-sidebar-foreground/70">{ persona.user.name }</p>
              <p className="text-xs text-sidebar-foreground/50">{ persona.role }</p>
            </SidebarFooter>
          </Sidebar>

          <main className="min-w-0">
            <header className="sticky top-0 z-20 border-b border-border bg-background/95 px-6 py-4 backdrop-blur xl:px-8">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <Breadcrumb>
                    <BreadcrumbList>
                      { breadcrumbs.flatMap((crumb, index) => {
                        const item = (
                          <BreadcrumbItem key={ crumb.id }>
                            <BreadcrumbPage>{ crumb.label }</BreadcrumbPage>
                          </BreadcrumbItem>
                        );
                        return index > 0
                          ? [<BreadcrumbSeparator key={ `sep-${crumb.id}` } />, item]
                          : [item];
                      }) }
                    </BreadcrumbList>
                  </Breadcrumb>
                  <p className="mt-2 text-sm text-muted-foreground">
                    { activeEvent.name } · { activeEvent.venueName }
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <label className="grid gap-1 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Event context
                    <select
                      className="h-10 min-w-72 rounded-md border border-input bg-background px-3 text-sm font-medium normal-case tracking-normal text-foreground"
                      value={ activeEvent.id }
                      onChange={ (event) => setActiveEventId(event.target.value) }
                    >
                      { mockEvents.map((event) => (
                        <option key={ event.id } value={ event.id }>
                          { event.name }
                        </option>
                      )) }
                    </select>
                  </label>
                  { import.meta.env.DEV ? (
                    <div className="flex flex-wrap gap-2 rounded-xl border border-dashed border-primary/40 bg-brand-tint px-3 py-2">
                      <select
                        aria-label="Demo persona"
                        className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                        value={ persona.id }
                        onChange={ (event) => setSearchParam("as", event.target.value) }
                      >
                        { personaIds.map((id) => (
                          <option key={ id } value={ id }>
                            { id }
                          </option>
                        )) }
                      </select>
                      <select
                        aria-label="Demo state"
                        className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                        value={ demo }
                        onChange={ (event) => setSearchParam("demo", event.target.value) }
                      >
                        { demoStates.map((state) => (
                          <option key={ state } value={ state }>
                            { state }
                          </option>
                        )) }
                      </select>
                    </div>
                  ) : null }
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
