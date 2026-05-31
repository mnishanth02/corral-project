import type { HealthResponse } from "@corral/schema";
import { Button } from "@corral/ui/components/button";
import { StatusBadge } from "@corral/ui/components/status-badge";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { apiClient } from "../lib/api";

type StatusKind = "ok" | "error" | "warning";

function useHealth() {
  return useQuery({
    queryKey: ["health"],
    queryFn: async () => {
      const res = await apiClient.check();
      if (res.status !== 200 && res.status !== 503) {
        throw new Error("unexpected");
      }
      return res.body;
    },
    refetchInterval: 10000,
  });
}

function formatUptime(seconds?: number) {
  if (seconds === undefined) {
    return "Waiting for telemetry";
  }

  if (seconds < 60) {
    return `${Math.round(seconds)}s online`;
  }

  const minutes = Math.floor(seconds / 60);
  return `${minutes}m online`;
}

function apiStatus(
  data: HealthResponse | undefined,
  isLoading: boolean,
  isError: boolean,
): StatusKind {
  if (isLoading) {
    return "warning";
  }

  return data && !isError ? "ok" : "error";
}

function apiLabel(data: HealthResponse | undefined, isLoading: boolean, isError: boolean) {
  if (isLoading) {
    return "API: Checking";
  }

  return data && !isError ? "API: OK" : "API: Down";
}

export function SystemStatusCard() {
  const { data, isLoading, isError } = useHealth();

  return (
    <section
      aria-labelledby="system-status-heading"
      className="rounded-[2rem] border border-border/80 bg-card/95 p-6 text-card-foreground shadow-2xl shadow-slate-950/10 backdrop-blur md:p-8"
    >
      <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.35em] text-primary">
            Live telemetry
          </p>
          <h2 id="system-status-heading" className="mt-2 font-display text-3xl font-bold uppercase">
            System status
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
            Corral checks the API, database, and Redis cache every 10 seconds so race teams can spot
            service drift before it reaches participants.
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-background px-4 py-3 text-sm text-muted-foreground">
          <span className="block font-mono text-xs uppercase tracking-[0.22em]">Version</span>
          <strong className="text-foreground">{data?.version ?? "pending"}</strong>
        </div>
      </div>

      <div className="mt-7 flex flex-wrap gap-3">
        <StatusBadge
          status={apiStatus(data, isLoading, isError)}
          label={apiLabel(data, isLoading, isError)}
        />
        <StatusBadge status={data?.db ? "ok" : "error"} label={data?.db ? "DB: OK" : "DB: Down"} />
        <StatusBadge
          status={data?.redis ? "ok" : "error"}
          label={data?.redis ? "Redis: OK" : "Redis: Down"}
        />
      </div>

      <dl className="mt-8 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl bg-secondary p-4">
          <dt className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Overall</dt>
          <dd className="mt-2 text-lg font-semibold capitalize">{data?.status ?? "checking"}</dd>
        </div>
        <div className="rounded-2xl bg-secondary p-4">
          <dt className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Uptime</dt>
          <dd className="mt-2 text-lg font-semibold">{formatUptime(data?.uptime)}</dd>
        </div>
        <div className="rounded-2xl bg-secondary p-4">
          <dt className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Timestamp</dt>
          <dd className="mt-2 truncate font-mono text-sm">{data?.timestamp ?? "—"}</dd>
        </div>
      </dl>
    </section>
  );
}

function useRaceDayTheme() {
  const [enabled, setEnabled] = useState(() => document.documentElement.classList.contains("dark"));

  useEffect(() => {
    document.documentElement.classList.toggle("dark", enabled);
  }, [enabled]);

  return { enabled, setEnabled };
}

export function IndexPage() {
  const { enabled, setEnabled } = useRaceDayTheme();

  return (
    <main className="min-h-screen bg-background text-foreground lg:grid lg:grid-cols-[18rem_1fr]">
      <aside className="border-sidebar-border bg-sidebar p-6 text-sidebar-foreground lg:min-h-screen">
        <div className="font-display text-3xl font-black uppercase tracking-tight text-white">
          Corral
        </div>
        <p className="mt-2 text-sm text-sidebar-foreground/70">Race command console</p>
        <nav className="mt-10 grid gap-2 text-sm font-semibold">
          <a
            className="rounded-xl bg-sidebar-accent px-4 py-3 text-sidebar-accent-foreground"
            href="/"
          >
            Operations deck
          </a>
          <a
            className="rounded-xl px-4 py-3 text-sidebar-foreground/75 hover:bg-sidebar-accent"
            href="/"
          >
            Waves
          </a>
          <a
            className="rounded-xl px-4 py-3 text-sidebar-foreground/75 hover:bg-sidebar-accent"
            href="/"
          >
            Incidents
          </a>
        </nav>
      </aside>

      <section className="relative overflow-hidden px-6 py-8 lg:px-10">
        <div className="absolute right-0 top-0 -z-10 h-80 w-80 rounded-full bg-primary/15 blur-3xl" />
        <header className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.35em] text-primary">
              Organizer console
            </p>
            <h1 className="mt-3 font-display text-5xl font-black uppercase tracking-tight md:text-7xl">
              Race-day control tower
            </h1>
            <p className="mt-4 max-w-2xl text-muted-foreground">
              Monitor critical dependencies, coordinate volunteers, and keep the course moving from
              one navy operations surface.
            </p>
          </div>
          <Button
            type="button"
            variant={enabled ? "default" : "outline"}
            onClick={() => setEnabled((value) => !value)}
            aria-pressed={enabled}
          >
            {enabled ? "Race-day dark on" : "Enable race-day dark"}
          </Button>
        </header>

        <div className="mt-10 grid gap-6 xl:grid-cols-[1fr_22rem]">
          <SystemStatusCard />
          <aside className="rounded-[2rem] border border-border bg-card p-6 shadow-xl shadow-slate-950/5">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-primary">Next action</p>
            <h2 className="mt-3 font-display text-3xl font-bold uppercase">Brief captains</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Confirm the API, DB, and Redis are green before opening participant check-in kiosks.
            </p>
          </aside>
        </div>
      </section>
    </main>
  );
}
