import { Alert, AlertDescription, AlertTitle } from "@corral/ui/components/alert";
import { Button } from "@corral/ui/components/button";
import { ConfirmDialog } from "@corral/ui/components/confirm-dialog";
import { StatusBadge } from "@corral/ui/components/status-badge";
import { createFileRoute } from "@tanstack/react-router";

import {
  Chip,
  calendarSeeds,
  cells,
  DemoBoundary,
  DetailCard,
  FilterBar,
  KpiCard,
  KpiGrid,
  MiniTable,
  PageHeader,
  statusKind,
  validateAdminDemoSearch,
} from "./-admin-screen-kit";

export const Route = createFileRoute("/admin/calendar")({
  validateSearch: validateAdminDemoSearch,
  staticData: { breadcrumb: "Calendar" },
  component: AdminCalendarPage,
});

function AdminCalendarPage() {
  const { demo } = Route.useSearch();
  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="A-04 · Discovery ops"
        title="Calendar Seeding / Management"
        description="Curate the public Coimbatore running calendar with Corral-hosted, club, and external listings before public verification."
        actions={
          <>
            <Button>
              <span aria-hidden="true">+</span> Seed event
            </Button>
            <Button asChild variant="outline">
              <a href="/calendar" target="_blank" rel="noreferrer">
                Public P-01 preview <span aria-hidden="true">link</span>
              </a>
            </Button>
          </>
        }
      />
      <DemoBoundary
        demo={ demo }
        emptyTitle="No calendar seeds"
        emptyDescription="Add a CODISSIA, Race Course, Pollachi, or club listing to feed the participant calendar."
      >
        <KpiGrid>
          <KpiCard
            label="Seeded listings"
            value="24"
            status="ok"
            statusLabel="Coimbatore region"
            icon={ <span aria-hidden="true">+</span> }
          />
          <KpiCard label="Corral hosted" value="6" status="ok" statusLabel="Registration links" />
          <KpiCard
            label="Needs source"
            value="3"
            status="warning"
            statusLabel="Verify before public"
          />
          <KpiCard label="This month" value="5" status="info" statusLabel="Visible in P-01" />
        </KpiGrid>
        <FilterBar placeholder="Search event, venue, club, distance…">
          <Chip>All</Chip>
          <Chip>Corral hosted</Chip>
          <Chip>Club</Chip>
          <Chip>External</Chip>
          <Chip>Needs copy</Chip>
        </FilterBar>
        <div className="grid gap-6 xl:grid-cols-[1fr_24rem]">
          <MiniTable
            caption="Calendar seed table"
            headers={ ["Event", "Date", "Venue", "Type", "Public status", "Owner"] }
            rows={ calendarSeeds.map((item) =>
              cells(
                <span>
                  <strong className="block">{ item.title }</strong>
                  <span className="text-muted-foreground">5K · 10K · 21K tags</span>
                </span>,
                item.date,
                <span className="inline-flex items-center gap-2">
                  <span aria-hidden="true">pin</span>
                  { item.venue }
                </span>,
                item.type,
                <StatusBadge status={ statusKind(item.status) } label={ item.status } />,
                item.owner,
              ),
            ) }
          />
          <DetailCard
            title="Public verification"
            description="A-04 feeds P-01; link opens cross-app participant calendar without network."
          >
            <Alert className="border-info/30 bg-info/10">
              <span aria-hidden="true">link</span>
              <AlertTitle>Cross-app note</AlertTitle>
              <AlertDescription>
                Participant calendar preview lives at /calendar in apps/web. This route only records
                frontend seed content.
              </AlertDescription>
            </Alert>
            <StatusBadge status="warning" label="Race Course Night 10K needs copy review" />
            <p>
              Featured local content: CODISSIA Trade Fair Complex, Race Course Road, Marudhamalai
              foothills, Pollachi loop.
            </p>
            <ConfirmDialog
              trigger={ <Button variant="outline">Publish seed changes</Button> }
              title="Publish calendar seed changes?"
              description="Publishing/unpublishing public listings is sensitive and records an audit reason."
              requireReason
              confirmLabel="Publish with reason"
            />
          </DetailCard>
        </div>
      </DemoBoundary>
    </div>
  );
}
