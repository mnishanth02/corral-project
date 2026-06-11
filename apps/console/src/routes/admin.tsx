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
import { createFileRoute, Outlet, redirect, useRouter } from "@tanstack/react-router";
import { useEffect, useMemo } from "react";

import { type AuthSession, isAdminUser } from "../lib/auth";
import { MockStoreProvider } from "../mocks";

function redirectHref(href: string) {
  const url = new URL(href, "http://console.local");
  return `${url.pathname}${url.search}${url.hash}`;
}

export const Route = createFileRoute("/admin")({
  beforeLoad: async ({ context, location }) => {
    const result = await context.authClient.getSession();

    if (!result.data) {
      throw redirect({
        to: "/login",
        search: { redirect: redirectHref(location.href), demo: "default" },
      });
    }

    return { session: result.data, isAdmin: isAdminUser(result.data.user) };
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

function AdminLayoutInner() {
  const { session, isAdmin } = Route.useRouteContext() as {
    session: AuthSession;
    isAdmin: boolean;
  };
  const router = useRouter();
  useAdminTheme();

  const activePath = typeof window === "undefined" ? "/admin" : window.location.pathname;
  const shellTone = useMemo(
    () => (activePath.startsWith("/admin/ops") ? "Command dark" : "Corral staff"),
    [activePath],
  );

  async function handleSignOut() {
    const { authClient } = await import("../lib/auth");
    await authClient.signOut();
    await router.navigate({ to: "/login", search: { demo: "default" } });
  }

  if (!isAdmin) {
    return (
      <main className="min-h-screen bg-background p-8 text-foreground">
        <AccessDenied
          title="Corral admin access required"
          description="Your signed-in account does not have the Better Auth admin role."
          roleContext={session.user.email}
          actions={<Button onClick={handleSignOut}>Sign out</Button>}
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
          <p className="text-xs text-sidebar-foreground/70">{session.user.name}</p>
          <p className="text-xs text-sidebar-foreground/50">{shellTone}</p>
        </SidebarFooter>
      </Sidebar>
      <main className="min-w-0">
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
            <Button type="button" variant="outline" onClick={handleSignOut}>
              Sign out
            </Button>
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
