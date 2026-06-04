import { Alert, AlertDescription, AlertTitle } from "@corral/ui/components/alert";
import { Button } from "@corral/ui/components/button";
import { ConfirmDialog } from "@corral/ui/components/confirm-dialog";
import { StatusBadge } from "@corral/ui/components/status-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@corral/ui/components/tabs";
import { createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";

import {
  cells,
  DemoBoundary,
  MiniTable,
  opsIncidents,
  statusKind,
  validateAdminDemoSearch,
} from "./-admin-screen-kit";

export const Route = createFileRoute("/admin/ops")({
  validateSearch: validateAdminDemoSearch,
  staticData: { breadcrumb: "Operations Monitor" },
  component: AdminOpsPage,
});

function DarkMetric({
  label,
  value,
  tone,
  icon,
}: {
  label: string;
  value: string;
  tone: "success" | "warning" | "danger" | "info";
  icon: ReactNode;
}) {
  const color =
    tone === "success"
      ? "text-[#34d399]"
      : tone === "warning"
        ? "text-[#fbbf24]"
        : tone === "danger"
          ? "text-[#ff4d4d]"
          : "text-[#38bdf8]";
  return (
    <div className="rounded-2xl border border-[#1e293b] bg-[#0f172a] p-5 shadow-2xl shadow-black/20">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-[#94a3b8]">{ label }</p>
        <span className={ color } aria-hidden="true">
          { icon }
        </span>
      </div>
      <p className="mt-3 font-display text-4xl font-black leading-none text-[#f1f5f9] tabular-nums">
        { value }
      </p>
      <p className={ `mt-3 inline-flex items-center gap-2 text-sm font-bold ${color}` }>
        { icon }{ " " }
        { tone === "success"
          ? "Healthy"
          : tone === "danger"
            ? "Action now"
            : tone === "warning"
              ? "Watch"
              : "Telemetry" }
      </p>
    </div>
  );
}

function AdminOpsPage() {
  const { demo, tab } = Route.useSearch();
  const activeTab =
    tab ??
    (demo === "webhook-pending" ? "webhooks" : demo === "error" ? "pdf-storage" : "overview");
  const degraded = demo === "offline" || demo === "error" || demo === "webhook-pending";
  const visibleRows = demo === "default" ? opsIncidents.slice(0, 1) : opsIncidents.slice(1);

  return (
    <div
      className="dark -m-8 min-h-screen bg-[#0b1120] p-6 text-[#f1f5f9] xl:p-8"
      style={ { colorScheme: "dark" } }
    >
      <div className="grid gap-6">
        <div className="overflow-hidden rounded-[2rem] border border-[#1e293b] bg-[#0f172a] shadow-2xl shadow-black/30">
          <div className="relative p-6 xl:p-8">
            <div
              className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,#ff5a0033,transparent_45%),linear-gradient(135deg,#38bdf812,transparent_35%)]"
              aria-hidden="true"
            />
            <div className="relative flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.35em] text-[#ff5a00]">
                  A-08 · Dark command center
                </p>
                <h2 className="mt-2 font-display text-5xl font-black uppercase leading-none tracking-tight">
                  Operations Monitor / Job Health
                </h2>
                <p className="mt-3 max-w-3xl text-[#cbd5e1]">
                  Race-day reliability view for workers, webhooks, queues, PDF/comms, storage, and
                  the zero-critical-failure pilot target.
                </p>
                <p className="mt-3 font-mono text-sm text-[#94a3b8]">
                  Last heartbeat { degraded ? "04:18 ago" : "12s ago" } · Pilot · Production ·
                  Coimbatore pilots · 14:42:08 IST
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button>Create incident note</Button>
                <Button variant="outline" className="border-[#334155] bg-[#0b1120] text-[#f1f5f9]">
                  Refresh now
                </Button>
                <ConfirmDialog
                  trigger={
                    <Button
                      variant="outline"
                      className="border-[#334155] bg-[#0b1120] text-[#f1f5f9]"
                    >
                      Export incident report
                    </Button>
                  }
                  title="Export incident report?"
                  description="Incident exports require an audit reason and contain redacted operational details only."
                  requireReason
                  confirmLabel="Export"
                />
              </div>
            </div>
          </div>
        </div>

        { degraded ? (
          <Alert className="border-[#fbbf24]/50 bg-[#fbbf24]/10 text-[#f1f5f9]">
            <span aria-hidden="true">!</span>
            <AlertTitle>Manual backup promise active</AlertTitle>
            <AlertDescription className="text-[#cbd5e1]">
              Safe: registrations and payments are stored. Delayed: certificates and outbound
              confirmations. Owner: Ops on-call Arun. Next check: 5 minutes. Manual backup: latest
              roster snapshot and approved WhatsApp broadcast once queue recovers.
            </AlertDescription>
          </Alert>
        ) : null }

        <DemoBoundary
          demo={
            demo === "error" || demo === "offline" || demo === "webhook-pending" ? "default" : demo
          }
          dark
          emptyTitle="No active incidents"
          emptyDescription="Command center is healthy; keep watching heartbeat and queue latency."
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <DarkMetric
              label="Overall"
              value={ degraded ? "Degraded" : "Healthy" }
              tone={ degraded ? "warning" : "success" }
              icon={ <span aria-hidden="true">health</span> }
            />
            <DarkMetric
              label="Critical incidents"
              value={ demo === "error" ? "2" : "0" }
              tone={ demo === "error" ? "danger" : "success" }
              icon={ <span aria-hidden="true">audit</span> }
            />
            <DarkMetric
              label="Queue latency"
              value={ demo === "offline" ? "08:24" : "00:38" }
              tone={ demo === "offline" ? "warning" : "success" }
              icon={ <span aria-hidden="true">time</span> }
            />
            <DarkMetric
              label="Webhook retries"
              value={ demo === "webhook-pending" ? "12" : "0" }
              tone={ demo === "webhook-pending" ? "warning" : "info" }
              icon={ <span aria-hidden="true">retry</span> }
            />
          </div>

          <Tabs value={ activeTab } className="gap-4 text-[#f1f5f9]">
            <TabsList className="bg-[#1e293b] text-[#cbd5e1]">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="failed-jobs">Failed jobs</TabsTrigger>
              <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
              <TabsTrigger value="queues">Queues</TabsTrigger>
              <TabsTrigger value="pdf-storage">PDF & Storage</TabsTrigger>
            </TabsList>
            <TabsContent value={ activeTab } className="grid gap-4 xl:grid-cols-[1fr_24rem]">
              <div className="rounded-2xl border border-[#1e293b] bg-[#0f172a]">
                <MiniTable
                  caption="Operations incidents"
                  headers={ [
                    "Severity",
                    "Status",
                    "Component",
                    "Event/organizer",
                    "Symptom",
                    "Impact",
                    "Queue/job ID",
                    "Attempts",
                    "Owner",
                  ] }
                  rows={ visibleRows.map((incident) =>
                    cells(
                      incident.severity,
                      <StatusBadge status={ statusKind(incident.status) } label={ incident.status } />,
                      incident.component,
                      incident.event,
                      incident.symptom,
                      incident.impact,
                      <code className="rounded bg-[#020617] px-2 py-1 text-[#38bdf8]">
                        { incident.id }
                      </code>,
                      incident.attempts,
                      incident.owner,
                    ),
                  ) }
                />
              </div>
              <div className="grid gap-4">
                <div className="rounded-2xl border border-[#1e293b] bg-[#0f172a] p-5">
                  <h3 className="font-display text-2xl font-black uppercase">Runbook checklist</h3>
                  <div className="mt-4 grid gap-3">
                    { [
                      "Heartbeat checked",
                      "Worker owner paged",
                      "Support ticket linked",
                      "Audit reason required",
                      "No secrets or stack traces displayed",
                    ].map((item, index) => (
                      <StatusBadge
                        key={ item }
                        status={ index < 2 && degraded ? "warning" : "ok" }
                        label={ item }
                      />
                    )) }
                  </div>
                </div>
                <div className="rounded-2xl border border-[#1e293b] bg-[#0f172a] p-5">
                  <h3 className="font-display text-2xl font-black uppercase">Safe actions</h3>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <ConfirmDialog
                      trigger={ <Button>Retry job</Button> }
                      title="Retry certificate PDF job?"
                      description="This may generate participant-visible files. Add an audit reason."
                      requireReason
                      confirmLabel="Retry job"
                    />
                    <ConfirmDialog
                      trigger={
                        <Button
                          variant="outline"
                          className="border-[#334155] bg-[#0b1120] text-[#f1f5f9]"
                        >
                          Replay webhook
                        </Button>
                      }
                      title="Replay Razorpay webhook?"
                      description="Payment confirmation changes only after signature verification. Add audit reason."
                      requireReason
                      confirmLabel="Replay webhook"
                    />
                    <Button
                      asChild
                      variant="outline"
                      className="border-[#334155] bg-[#0b1120] text-[#f1f5f9]"
                    >
                      <a href="/admin/delivery?demo=webhook-pending&as=corral-admin">Open A-05</a>
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="grid gap-4 md:grid-cols-3">
            <StatusBadge
              className="border-[#34d399]/40 bg-[#34d399]/10 text-[#34d399]"
              status="ok"
              label="PDF success 99.4%"
            />
            <StatusBadge
              className="border-[#38bdf8]/40 bg-[#38bdf8]/10 text-[#38bdf8]"
              status="info"
              label="Delivery worker health"
            />
            <StatusBadge
              className="border-[#ff4d4d]/40 bg-[#ff4d4d]/10 text-[#ff4d4d]"
              status={ demo === "error" ? "error" : "ok" }
              label={ demo === "error" ? "Storage/upload errors" : "Storage uploads healthy" }
            />
          </div>
        </DemoBoundary>
      </div>
    </div>
  );
}
