import { Alert, AlertDescription, AlertTitle } from "@corral/ui/components/alert";
import { Button } from "@corral/ui/components/button";
import { ConfirmDialog } from "@corral/ui/components/confirm-dialog";
import { StatusBadge } from "@corral/ui/components/status-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@corral/ui/components/tabs";
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
  PageHeader,
  statusKind,
  supportTickets,
  validateAdminDemoSearch,
} from "./-admin-screen-kit";

export const Route = createFileRoute("/admin/support")({
  validateSearch: validateAdminDemoSearch,
  staticData: { breadcrumb: "Support Tickets" },
  component: AdminSupportPage,
});

function AdminSupportPage() {
  const { demo, tab, ticket } = Route.useSearch();
  const activeTab =
    tab ?? (demo === "success" ? "resolved" : demo === "validation-error" ? "verifying" : "open");
  const selected =
    supportTickets.find((item) => item.id === ticket) ??
    supportTickets.find(
      (item) =>
        item.id ===
        (demo === "success" ? "CRL-2399" : demo === "validation-error" ? "CRL-2409" : "CRL-2407"),
    ) ??
    supportTickets[0];
  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="A-07 · Support and DPDP"
        title="Support / Ticket View"
        description="Resolve organizer support and privacy/data requests with identity verification, SLA tracking, resolution notes, and audit history."
        actions={
          <>
            <Button>Create internal ticket</Button>
            <ConfirmDialog
              trigger={ <Button variant="outline">Export ticket report</Button> }
              title="Export ticket report?"
              description="Ticket reports can expose requester metadata. Add an audit reason."
              requireReason
              confirmLabel="Export"
            />
          </>
        }
      />
      <Alert className="border-info/30 bg-info/10">
        <span aria-hidden="true">safe</span>
        <AlertTitle>Privacy/data requests are staff-assisted for MVP</AlertTitle>
        <AlertDescription>
          Verify identity before access, correction, export, or erasure. Do not paste sensitive data
          into notes.
        </AlertDescription>
      </Alert>
      <DemoBoundary
        demo={ demo === "validation-error" || demo === "success" ? "default" : demo }
        emptyTitle="No support tickets"
        emptyDescription="Support, delivery, and privacy requests will queue here once seeded."
      >
        <KpiGrid>
          <KpiCard
            label="Open tickets"
            value="23"
            status="info"
            statusLabel="Queue active"
            icon={ <span aria-hidden="true">support</span> }
          />
          <KpiCard
            label="Due in 48h"
            value="4"
            status="warning"
            statusLabel="SLA risk"
            icon={ <span aria-hidden="true">time</span> }
          />
          <KpiCard
            label="Verifying identity"
            value="6"
            status="warning"
            statusLabel="Awaiting proof"
            icon={ <span aria-hidden="true">verify</span> }
          />
          <KpiCard
            label="Resolved this week"
            value="18"
            status="ok"
            statusLabel="Closed"
            icon={ <span aria-hidden="true">ok</span> }
          />
        </KpiGrid>
        <Tabs value={ activeTab } className="gap-4">
          <TabsList>
            <TabsTrigger value="open">Open 23</TabsTrigger>
            <TabsTrigger value="verifying">Verifying 6</TabsTrigger>
            <TabsTrigger value="resolved">Resolved 128</TabsTrigger>
            <TabsTrigger value="privacy">Privacy requests 9</TabsTrigger>
          </TabsList>
          <TabsContent value={ activeTab } className="grid gap-4">
            <FilterBar placeholder="Search ticket ID, requester, event, request type…">
              <Chip>DPDP access</Chip>
              <Chip>Correction</Chip>
              <Chip>Erasure</Chip>
              <Chip>Guardian</Chip>
            </FilterBar>
            <div className="grid gap-6 xl:grid-cols-[1fr_26rem]">
              <MiniTable
                caption="Support ticket queue"
                headers={ [
                  "Ticket",
                  "Requester",
                  "Organizer/Event",
                  "Type",
                  "Verification",
                  "SLA due",
                  "Status",
                  "Owner",
                ] }
                rows={ supportTickets.map((item) =>
                  cells(
                    <a
                      className="font-bold text-primary"
                      href={ `/admin/support?ticket=${item.id}&as=corral-admin` }
                    >
                      { item.id }
                    </a>,
                    item.requester,
                    item.context,
                    item.type,
                    <StatusBadge
                      status={ statusKind(item.verification) }
                      label={ item.verification }
                    />,
                    item.due,
                    <StatusBadge status={ statusKind(item.status) } label={ item.status } />,
                    item.owner,
                  ),
                ) }
              />
              <DetailCard
                title={ `${selected.id} · ${selected.type}` }
                description="Selected ticket detail panel"
              >
                <StatusBadge status={ statusKind(selected.status) } label={ selected.status } />
                <p>
                  <strong>Requester:</strong> { selected.requester }
                </p>
                <p>
                  <strong>Context:</strong> { selected.context }
                </p>
                <p>
                  <strong>SLA:</strong> Due by { selected.due } · DPDP support target active.
                </p>
                { demo === "validation-error" ? (
                  <Alert className="border-warning/30 bg-warning/10">
                    <span aria-hidden="true">minor</span>
                    <AlertTitle>Guardian proof needed</AlertTitle>
                    <AlertDescription>
                      Verification dialog is missing required evidence note for a minor request.
                    </AlertDescription>
                  </Alert>
                ) : null }
                <AuditReasonBox label="Add audit reason for privacy action" />
                <ConfirmDialog
                  trigger={ <Button>Export access report</Button> }
                  title="Add audit reason for privacy action"
                  description="Required before exporting, correcting, erasing, or viewing sensitive participant data."
                  requireReason
                  confirmLabel="Generate signed link"
                />
              </DetailCard>
            </div>
          </TabsContent>
        </Tabs>
      </DemoBoundary>
    </div>
  );
}
