import { Button } from "@corral/ui/components/button";
import { StatusBadge } from "@corral/ui/components/status-badge";
import { createFileRoute } from "@tanstack/react-router";

import {
  Chip,
  cells,
  DemoBoundary,
  DetailCard,
  FilterBar,
  KpiCard,
  KpiGrid,
  MiniTable,
  mockAuditEntries,
  PageHeader,
  statusKind,
  validateAdminDemoSearch,
} from "./-admin-screen-kit";

export const Route = createFileRoute("/admin/audit")({
  validateSearch: validateAdminDemoSearch,
  staticData: { breadcrumb: "Audit" },
  component: AdminAuditPage,
});

function AdminAuditPage() {
  const { demo } = Route.useSearch();
  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="A-06 · Compliance trail"
        title="Audit Log"
        description="Filterable record of sensitive admin actions: impersonation, exports, refunds, permission/role changes, publish changes, and manual overrides."
        actions={<Button variant="outline">Export visible audit rows</Button>}
      />
      <DemoBoundary
        demo={demo}
        emptyTitle="No audit rows match"
        emptyDescription="Clear actor, action, date, or event filters to broaden the compliance trail."
      >
        <KpiGrid>
          <KpiCard
            label="Sensitive actions"
            value="428"
            status="info"
            statusLabel="Last 30 days"
            icon={<span aria-hidden="true">log</span>}
          />
          <KpiCard
            label="Impersonations"
            value="37"
            status="warning"
            statusLabel="Reason captured"
            icon={<span aria-hidden="true">audit</span>}
          />
          <KpiCard
            label="PII exports"
            value="12"
            status="warning"
            statusLabel="Private only"
            icon={<span aria-hidden="true">doc</span>}
          />
          <KpiCard
            label="Role changes"
            value="9"
            status="ok"
            statusLabel="Reviewed"
            icon={<span aria-hidden="true">role</span>}
          />
        </KpiGrid>
        <FilterBar placeholder="Filter actor, action, target, event…">
          <Chip>Impersonation</Chip>
          <Chip>Exports</Chip>
          <Chip>Refunds</Chip>
          <Chip>Role changes</Chip>
          <Chip>Manual override</Chip>
        </FilterBar>
        <div className="grid gap-6 xl:grid-cols-[1fr_24rem]">
          <MiniTable
            caption="Audit log table"
            headers={["Timestamp", "Actor", "Action", "Target", "Reason", "Event / Organizer"]}
            rows={mockAuditEntries.map((entry) =>
              cells(
                new Date(entry.createdAt).toLocaleString("en-IN", {
                  timeZone: "Asia/Kolkata",
                  dateStyle: "medium",
                  timeStyle: "short",
                }),
                <span>
                  <strong className="block">{entry.actorName}</strong>
                  <span className="text-muted-foreground">{entry.actorRole}</span>
                </span>,
                <StatusBadge status={statusKind(entry.action)} label={entry.action} />,
                entry.target,
                entry.reason ?? "Reason not required",
                <span>
                  {"eventId" in entry ? entry.eventId : "All events"}
                  <span className="block text-muted-foreground">
                    {"organizerId" in entry ? entry.organizerId : "Corral"}
                  </span>
                </span>,
              ),
            )}
          />
          <DetailCard
            title="Expanded audit detail"
            description="Before/after summaries stay human-readable; no secrets, SQL, stack traces, or private URLs."
          >
            <StatusBadge status="warning" label="Started impersonation" />
            <p>
              <strong>Reason:</strong> Organizer support ticket SUP-1042 requested setup review.
            </p>
            <p>
              <strong>Before:</strong> Admin not acting on behalf.
            </p>
            <p>
              <strong>After:</strong> Acting for Kovai Road Runners · Coimbatore Marathon 2026.
            </p>
            <Button asChild variant="outline">
              <a href="/admin/impersonate?as=corral-admin">Review act-on-behalf</a>
            </Button>
          </DetailCard>
        </div>
      </DemoBoundary>
    </div>
  );
}
