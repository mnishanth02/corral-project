import { AccessDenied } from "@corral/ui/components/access-denied";
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
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";

import {
  getActivePersona,
  getMockSessionResult,
  isPersonaId,
  MockStoreProvider,
  mockEvents,
  mockOrganizers,
  personaIds,
  useMockStore,
} from "../mocks";
import type { PersonaId } from "../mocks/types";

type AdminSearch = {
  as?: PersonaId;
};

function searchStringFromHref(href: string) {
  const index = href.indexOf("?");
  return index === -1 ? "" : href.slice(index);
}

function redirectHrefWithoutPersona(href: string) {
  const url = new URL(href, "http://console.local");
  url.searchParams.delete("as");
  return `${url.pathname}${url.search}${url.hash}`;
}

export const Route = createFileRoute("/admin")({
  validateSearch: (search): AdminSearch => ({
    as: isPersonaId(search.as) ? search.as : undefined,
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
  staticData: { breadcrumb: "Admin" },
  component: AdminLayout,
});

const adminLinks = [
  { label: "Home", href: "/admin" },
  { label: "Organizers", href: "/admin/organizers" },
  { label: "Calendar", href: "/admin/calendar" },
  { label: "Delivery", href: "/admin/delivery" },
  { label: "Support", href: "/admin/support" },
  { label: "Ops", href: "/admin/ops" },
  { label: "Audit", href: "/admin/audit" },
  { label: "Users", href: "/admin/users" },
];

function setPersona(value: string) {
  const url = new URL(window.location.href);
  url.searchParams.set("as", value);
  window.location.href = `${url.pathname}${url.search}${url.hash}`;
}

function useAdminTheme() {
  useEffect(() => {
    const isDarkRoute = window.location.pathname.startsWith("/admin/ops");
    document.documentElement.classList.toggle("dark", isDarkRoute);
    document.documentElement.style.colorScheme = isDarkRoute ? "dark" : "light";

    return () => {
      document.documentElement.classList.remove("dark");
      document.documentElement.style.colorScheme = "light";
    };
  }, []);
}

function formatElapsed(startedAt?: string) {
  if (!startedAt) {
    return "00:00 elapsed";
  }

  const elapsedMs = Math.max(0, Date.now() - new Date(startedAt).getTime());
  const minutes = Math.floor(elapsedMs / 60000);
  const seconds = Math.floor((elapsedMs % 60000) / 1000);
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")} elapsed`;
}

function ImpersonationBanner({ personaId }: { personaId: PersonaId }) {
  const { impersonation, clearImpersonation } = useMockStore();
  const [, forceTick] = useState(0);
  const personaDriven = personaId === "corral-admin-impersonating";
  const organizerId =
    impersonation.organizerId ?? (personaDriven ? "org-kovai-road-runners" : undefined);
  const organizer = mockOrganizers.find((item) => item.id === organizerId);
  const event = mockEvents.find((item) => item.organizerId === organizerId) ?? mockEvents[0];
  const startedAt =
    impersonation.startedAt ?? (personaDriven ? "2026-01-15T09:00:00+05:30" : undefined);
  const visible = Boolean(organizerId || personaDriven);

  useEffect(() => {
    if (!visible) {
      return;
    }

    const timer = window.setInterval(() => forceTick((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [visible]);

  if (!visible) {
    return null;
  }

  return (
    <div
      className="border-b-4 border-amber-300 bg-amber-400 px-5 py-3 text-slate-950 shadow-lg shadow-amber-900/20"
      role="status"
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="font-display text-2xl font-black uppercase tracking-wide">
            Act-on-behalf mode
          </p>
          <p className="text-sm font-semibold">
            {organizer?.name ?? "Kovai Road Runners"} · {event.name} · Staff view: Priya Ramanathan
            · {formatElapsed(startedAt)}
          </p>
        </div>
        <Button
          type="button"
          variant="destructive"
          onClick={() => {
            clearImpersonation();
            setPersona("corral-admin");
          }}
        >
          Exit act-on-behalf
        </Button>
      </div>
    </div>
  );
}

function AdminLayoutInner() {
  const { persona } = Route.useRouteContext();
  useAdminTheme();

  const activePath = typeof window === "undefined" ? "/admin" : window.location.pathname;
  const isDenied = persona.isAccessDenied || !persona.isAdmin;
  const shellTone = useMemo(
    () => (activePath.startsWith("/admin/ops") ? "Command dark" : "Corral staff"),
    [activePath],
  );

  if (isDenied) {
    return (
      <main className="min-h-screen bg-background p-8 text-foreground">
        <AccessDenied
          title="Corral admin access required"
          description="Admin routes are guarded by the corral-admin mock persona. No backend session is required in dev mock mode."
          roleContext={persona.role}
          actions={
            <Button type="button" onClick={() => setPersona("corral-admin")}>
              Switch to corral-admin
            </Button>
          }
        />
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground lg:grid lg:grid-cols-[17rem_1fr]">
      <Sidebar className="sticky top-0 hidden h-screen min-h-screen bg-[#0f172a] lg:flex">
        <SidebarHeader>
          <div>
            <div className="font-display text-3xl font-black uppercase tracking-tight text-white">
              Corral
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sidebar-foreground/60">
              Admin
            </p>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Staff console</SidebarGroupLabel>
            <SidebarMenu>
              {adminLinks.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarItem href={item.href} active={activePath === item.href}>
                    {item.label}
                  </SidebarItem>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <p className="text-xs text-sidebar-foreground/70">{persona.user.name}</p>
          <p className="text-xs text-sidebar-foreground/50">{shellTone}</p>
        </SidebarFooter>
      </Sidebar>
      <main className="min-w-0">
        <ImpersonationBanner personaId={persona.id} />
        <header className="border-b border-border bg-background/95 px-6 py-5 backdrop-blur xl:px-8">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.35em] text-primary">
                {shellTone}
              </p>
              <h1 className="font-display text-4xl font-black uppercase tracking-tight">
                Admin console
              </h1>
            </div>
            {import.meta.env.DEV ? (
              <select
                aria-label="Admin demo persona"
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={persona.id}
                onChange={(event) => setPersona(event.target.value)}
              >
                {personaIds.map((id) => (
                  <option key={id} value={id}>
                    {id}
                  </option>
                ))}
              </select>
            ) : null}
          </div>
        </header>
        <section className="px-6 py-8 xl:px-8">
          <Outlet />
        </section>
      </main>
    </div>
  );
}

function AdminLayout() {
  return (
    <MockStoreProvider>
      <AdminLayoutInner />
    </MockStoreProvider>
  );
}
