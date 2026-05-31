import type { HealthResponse } from "@corral/schema";
import { Button } from "@corral/ui/components/button";
import { StatusBadge } from "@corral/ui/components/status-badge";
import { useQuery } from "@tanstack/react-query";

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

export function IndexPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <div className="absolute inset-x-0 top-0 -z-10 h-96 bg-[radial-gradient(circle_at_top_left,var(--brand-tint),transparent_36rem),linear-gradient(135deg,rgba(255,90,0,0.16),transparent_28rem)]" />
      <section className="mx-auto grid min-h-screen w-full max-w-7xl items-center gap-10 px-6 py-12 lg:grid-cols-[1.05fr_0.95fr] lg:px-10">
        <div className="relative">
          <div className="mb-8 inline-flex rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.32em] text-primary">
            Corral participant portal
          </div>
          <h1 className="font-display text-6xl font-black uppercase leading-[0.9] tracking-tight text-brand-navy md:text-8xl">
            Every start line, calmly in sync.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
            A public race experience for signups, wave updates, and day-of confidence — grounded in
            Corral's orange signal system and always-readable service telemetry.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button>Find my race</Button>
            <Button variant="outline">View wave guide</Button>
          </div>
        </div>
        <SystemStatusCard />
      </section>
    </main>
  );
}
