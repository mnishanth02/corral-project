import { Alert, AlertDescription, AlertTitle } from "@corral/ui/components/alert";
import { Button } from "@corral/ui/components/button";
import { ConfirmDialog } from "@corral/ui/components/confirm-dialog";
import { StatusBadge } from "@corral/ui/components/status-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@corral/ui/components/tabs";
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
  mockDeliveries,
  mockEvents,
  PageHeader,
  statusKind,
  validateAdminDemoSearch,
} from "./-admin-screen-kit";

export const Route = createFileRoute("/admin/delivery")({
  validateSearch: validateAdminDemoSearch,
  staticData: { breadcrumb: "Delivery Monitor" },
  component: AdminDeliveryPage,
});

const deliveryLabels = [
  "Queued",
  "Sent to Provider",
  "Delivered",
  "Read",
  "Email Opened",
  "Bounced",
  "Failed",
  "Retry Scheduled",
  "Fallback SMS Sent",
  "Fallback Email Sent",
  "Paused",
  "Needs Review",
];

function AdminDeliveryPage() {
  const { demo, tab } = Route.useSearch();
  const activeTab = tab ?? (demo === "error" ? "failures" : "all");
  const rows = mockDeliveries.map((delivery, index) => {
    const event = mockEvents.find((item) => item.id === delivery.eventId) ?? mockEvents[0];
    return {
      delivery,
      event,
      trigger: index === 3 ? "Certificate available" : "Registration confirmation",
      payment: index === 2 ? "Paid — Awaiting Webhook" : "Paid & Confirmed",
      reason:
        ("errorMessage" in delivery ? delivery.errorMessage : undefined) ??
        (delivery.status === "webhook-pending" ? "Provider webhook pending" : "Meta accepted"),
    };
  });
  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="A-05 · Communications trust"
        title="Global Delivery-Status Monitor"
        description="Track WhatsApp, SMS, and email delivery across all events. Delivery status is separate from payment and settlement."
        actions={
          <>
            <ConfirmDialog
              trigger={ <Button>Retry selected failures</Button> }
              title="Retry 18 failed messages?"
              description="Retries use approved templates. SMS fallback only runs for recipients with communication consent."
              requireReason
              confirmLabel="Retry with audit reason"
            />
            <ConfirmDialog
              trigger={ <Button variant="outline">Export delivery report</Button> }
              title="Export delivery report?"
              requireReason
              confirmLabel="Export"
            />
          </>
        }
      />
      { demo === "error" || demo === "offline" || demo === "webhook-pending" ? (
        <Alert className="border-warning/40 bg-warning/10">
          <span aria-hidden="true">!</span>
          <AlertTitle>Delivery issue detected</AlertTitle>
          <AlertDescription>
            { demo === "offline"
              ? "Safe: registrations remain recorded. Delayed: confirmation messages. Owner: Corral Support. Next follow-up: 15 minutes."
              : "WhatsApp template registration_confirm_v2 has failures; SMS fallback is queued for consented recipients." }
          </AlertDescription>
        </Alert>
      ) : null }
      <DemoBoundary
        demo={ demo === "error" ? "default" : demo }
        emptyTitle="No delivery attempts"
        emptyDescription="Messages appear here after frontend fixtures seed event communications."
      >
        <KpiGrid>
          <KpiCard
            label="Confirmation delivery"
            value="98.6%"
            status="ok"
            statusLabel="On target"
            icon={ <span aria-hidden="true">ok</span> }
          />
          <KpiCard
            label="WhatsApp delivered"
            value="1,284"
            status="ok"
            statusLabel="Delivered"
            icon={ <span aria-hidden="true">msg</span> }
          />
          <KpiCard
            label="Fallback SMS sent"
            value="76"
            status="warning"
            statusLabel="Fallback active"
            icon={ <span aria-hidden="true">sms</span> }
          />
          <KpiCard
            label="Webhook lag"
            value="01:42"
            status={ demo === "webhook-pending" ? "warning" : "info" }
            statusLabel="Provider callbacks"
            icon={ <span aria-hidden="true">time</span> }
          />
        </KpiGrid>
        <Tabs value={ activeTab } className="gap-4">
          <TabsList>
            <TabsTrigger value="all">All messages</TabsTrigger>
            <TabsTrigger value="failures">Failures</TabsTrigger>
            <TabsTrigger value="providers">Provider health</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
          </TabsList>
          <TabsContent value={ activeTab } className="grid gap-4">
            <FilterBar placeholder="Filter by channel, status, event, template…">
              <Chip>WhatsApp</Chip>
              <Chip>SMS</Chip>
              <Chip>Email</Chip>
              <Chip>Payment context separate</Chip>
            </FilterBar>
            <MiniTable
              caption="Global delivery attempts"
              headers={ [
                "Sent",
                "Event",
                "Recipient",
                "Trigger",
                "Channel",
                "Delivery status",
                "Fallback",
                "Payment status",
                "Provider reason",
              ] }
              rows={ rows.map(({ delivery, event, trigger, payment, reason }) =>
                cells(
                  `10:4${delivery.id.slice(-1)}`,
                  event.name,
                  <span>
                    { delivery.recipientName }
                    <span className="block text-muted-foreground">
                      phone ending { delivery.recipientPhone.slice(-4) }
                    </span>
                  </span>,
                  trigger,
                  delivery.channel,
                  <StatusBadge
                    status={ statusKind(delivery.status) }
                    label={ delivery.status === "read" ? "Read" : delivery.status }
                  />,
                  delivery.status === "failed" ? (
                    <StatusBadge status="warning" label="Fallback Email Sent" />
                  ) : (
                    "No fallback"
                  ),
                  <StatusBadge status={ statusKind(payment) } label={ payment } />,
                  reason,
                ),
              ) }
            />
          </TabsContent>
        </Tabs>
        <DetailCard
          title="Delivery label set"
          description="Every status is icon + text; payment status appears only as context."
        >
          { deliveryLabels.map((label) => (
            <StatusBadge key={ label } status={ statusKind(label) } label={ label } />
          )) }
          <Button asChild variant="outline">
            <a href="/admin/ops?demo=webhook-pending&tab=webhooks&as=corral-admin">
              Open A-08 webhook-pending
            </a>
          </Button>
        </DetailCard>
      </DemoBoundary>
    </div>
  );
}
