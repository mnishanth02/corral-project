import { Alert, AlertDescription, AlertTitle } from "@corral/ui/components/alert";
import { Button } from "@corral/ui/components/button";
import { StatusBadge } from "@corral/ui/components/status-badge";
import { createFileRoute } from "@tanstack/react-router";

import {
  cells,
  DemoBoundary,
  iconFor,
  KpiCard,
  KpiGrid,
  MiniTable,
  mockEvents,
  mockOrganizers,
  organizerRows,
  PageHeader,
  statusKind,
  validateAdminDemoSearch,
} from "./-admin-screen-kit";

export const Route = createFileRoute("/admin/")({
  validateSearch: validateAdminDemoSearch,
  staticData: { breadcrumb: "Admin home" },
  component: AdminHomePage,
});

function AdminHomePage() {
  const { demo } = Route.useSearch();
  const liveEvents = mockEvents.filter((event) => event.status === "published").length;

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="A-01 · Corral staff"
        title="Multi-event overview"
        description="Cross-event command surface for Coimbatore pilots, organizer readiness, delivery risk, support SLAs, and safe act-on-behalf entry."
        actions={
          <>
            <Button asChild>
              <a href="/admin/impersonate?as=corral-admin">Act on behalf</a>
            </Button>
            <Button asChild variant="outline">
              <a href="/admin/ops?as=corral-admin">Open ops</a>
            </Button>
          </>
        }
      />

      <DemoBoundary
        demo={demo}
        emptyTitle="No admin events yet"
        emptyDescription="Create or import a Coimbatore organizer workspace before the staff overview can show pilot health."
      >
        <KpiGrid>
          <KpiCard
            label="Active organizers"
            value={String(mockOrganizers.length + 2)}
            status="ok"
            statusLabel="Customer workspaces"
            icon={<span aria-hidden="true">org</span>}
          />
          <KpiCard
            label="Live events"
            value={String(liveEvents + 1)}
            status="ok"
            statusLabel="Paid pilots"
            icon={<span aria-hidden="true">cal</span>}
          />
          <KpiCard
            label="Delivery rate"
            value="98.6%"
            status="ok"
            statusLabel="On target"
            icon={<span aria-hidden="true">msg</span>}
          />
          <KpiCard
            label="SLA risk"
            value="4"
            status="warning"
            statusLabel="Due in 48h"
            icon={<span aria-hidden="true">support</span>}
          />
        </KpiGrid>

        <Alert className="border-info/30 bg-info/10">
          <span aria-hidden="true">*</span>
          <AlertTitle>Pilot trust loop is being watched</AlertTitle>
          <AlertDescription>
            Registration, roster, WhatsApp confirmations, results, certificates, support, audit, and
            ops are linked from this staff home.
          </AlertDescription>
        </Alert>

        <MiniTable
          caption="Cross-event admin overview"
          headers={[
            "Organizer / event",
            "Entity",
            "Event health",
            "Delivery",
            "Support owner",
            "Actions",
          ]}
          rows={organizerRows.map((row, index) => {
            const event = mockEvents[index] ?? mockEvents[0];
            return cells(
              <span>
                <strong className="block">{row.organizer.name}</strong>
                <span className="text-muted-foreground">
                  {event.name} · {event.venueName}
                </span>
              </span>,
              <StatusBadge status={statusKind(row.entity)} label={row.entity} />,
              <StatusBadge status={statusKind(row.health)} label={row.health} />,
              <StatusBadge
                status={index === 1 ? "warning" : "ok"}
                label={index === 1 ? "Fallback queued" : "Healthy"}
              />,
              <span>{row.owner}</span>,
              <span className="flex flex-wrap gap-2">
                <Button asChild size="sm">
                  <a href={`/admin/impersonate?as=corral-admin&event=${event.id}`}>Act</a>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <a href="/admin/audit?as=corral-admin">Audit</a>
                </Button>
              </span>,
            );
          })}
        />

        <div className="grid gap-4 xl:grid-cols-4">
          {[
            ["Organizers", "/admin/organizers", "Entity/GST readiness"],
            ["Calendar", "/admin/calendar", "Public Coimbatore seeding"],
            ["Delivery", "/admin/delivery", "WhatsApp/SMS/email monitor"],
            ["Support", "/admin/support", "Privacy and tickets"],
            ["Ops", "/admin/ops", "Dark command center"],
            ["Audit", "/admin/audit", "Sensitive actions"],
            ["Users", "/admin/users", "Existing mock user admin"],
          ].map(([label, href, copy]) => (
            <a
              key={href}
              href={href ?? "#"}
              className="rounded-2xl border border-border bg-card p-4 shadow-sm hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <span className="flex items-center gap-2 font-display text-2xl font-black uppercase">
                {iconFor(label ?? "")} {label}
              </span>
              <span className="mt-1 block text-sm text-muted-foreground">{copy ?? ""}</span>
            </a>
          ))}
        </div>
      </DemoBoundary>
    </div>
  );
}
