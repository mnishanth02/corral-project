import { Button } from "@corral/ui/components/button";
import { ConfirmDialog } from "@corral/ui/components/confirm-dialog";
import { StatusBadge } from "@corral/ui/components/status-badge";
import { createFileRoute } from "@tanstack/react-router";

import {
  AuditReasonBox,
  Chip,
  cells,
  DemoBoundary,
  DetailCard,
  FilterBar,
  KpiCard,
  KpiGrid,
  MiniTable,
  organizerRows,
  PageHeader,
  statusKind,
  validateAdminDemoSearch,
} from "./-admin-screen-kit";

export const Route = createFileRoute("/admin/organizers")({
  validateSearch: validateAdminDemoSearch,
  staticData: { breadcrumb: "Organizers" },
  component: AdminOrganizersPage,
});

function AdminOrganizersPage() {
  const { demo } = Route.useSearch();
  const selected = organizerRows[1];

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="A-02 · Customer management"
        title="Organizer / Customer Management"
        description="Manage customer workspaces, entity/GST readiness, support ownership, and safe staff access."
        actions={
          <>
            <Button>Add organizer</Button>
            <ConfirmDialog
              trigger={
                <Button variant="outline">
                  <span aria-hidden="true">export</span> Export customer CSV
                </Button>
              }
              title="Export customer CSV?"
              description="Exports may contain organizer contact information. Use only for support operations."
              requireReason
              confirmLabel="Export with audit reason"
            />
          </>
        }
      />
      <DemoBoundary
        demo={demo}
        emptyTitle="No organizers yet"
        emptyDescription="Create the first Coimbatore customer workspace, assign a support owner, then complete GST/payment setup."
      >
        <KpiGrid>
          <KpiCard
            label="Active organizers"
            value="18"
            status="ok"
            statusLabel="7 with live events"
            icon={<span aria-hidden="true">org</span>}
          />
          <KpiCard
            label="GST verified"
            value="12"
            status="ok"
            statusLabel="Verified"
            icon={<span aria-hidden="true">safe</span>}
          />
          <KpiCard
            label="Need payment setup"
            value="4"
            status="warning"
            statusLabel="Action needed"
            icon={<span aria-hidden="true">INR</span>}
          />
          <KpiCard
            label="Support overdue"
            value="3"
            status="error"
            statusLabel="Past SLA"
            icon={<span aria-hidden="true">!</span>}
          />
        </KpiGrid>
        <FilterBar placeholder="Search organizer, GSTIN, owner, city…">
          <Chip>All</Chip>
          <Chip>Needs GST</Chip>
          <Chip>Payment setup pending</Chip>
          <Chip>Support overdue</Chip>
          <Chip>Pilot events</Chip>
        </FilterBar>
        <div className="grid gap-6 xl:grid-cols-[1fr_24rem]">
          <MiniTable
            caption="Organizer customer management table"
            headers={[
              "Organizer",
              "Legal entity",
              "GST / KYC",
              "Support owner",
              "Package",
              "Health",
              "Payment",
              "Actions",
            ]}
            rows={organizerRows.map((row) =>
              cells(
                <span>
                  <strong className="block">{row.organizer.name}</strong>
                  <span className="text-muted-foreground">
                    {row.organizer.city} · {row.organizer.eventsCount} events
                  </span>
                </span>,
                row.organizer.legalName,
                <StatusBadge status={statusKind(row.entity)} label={row.entity} />,
                row.owner,
                row.package,
                <StatusBadge status={statusKind(row.health)} label={row.health} />,
                <StatusBadge status={statusKind(row.payment)} label={row.payment} />,
                <span className="flex gap-2">
                  <Button asChild size="sm">
                    <a href={`/admin/impersonate?as=corral-admin&organizer=${row.organizer.id}`}>
                      Act
                    </a>
                  </Button>
                  <Button asChild size="sm" variant="outline">
                    <a href="/admin/audit?as=corral-admin">Audit</a>
                  </Button>
                </span>,
              ),
            )}
          />
          <DetailCard
            title={selected.organizer.name}
            description="Entity & GST detail drawer preview"
          >
            <StatusBadge status="warning" label="GST review pending" />
            <p>
              <strong>Legal entity:</strong> {selected.organizer.legalName}
            </p>
            <p>
              <strong>GSTIN:</strong> {selected.gst}
            </p>
            <p>
              <strong>Finance contact:</strong> Suresh B. · masked phone ending 5221
            </p>
            <p>
              <strong>Latest event:</strong> Pollachi Trail Run 2025
            </p>
            <AuditReasonBox label="Why are you changing organizer billing or access details?" />
            <Button asChild>
              <a href={`/admin/impersonate?as=corral-admin&organizer=${selected.organizer.id}`}>
                Start act-on-behalf
              </a>
            </Button>
          </DetailCard>
        </div>
      </DemoBoundary>
    </div>
  );
}
