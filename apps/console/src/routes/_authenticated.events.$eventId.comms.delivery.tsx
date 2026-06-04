import { Button } from "@corral/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@corral/ui/components/card";
import { DataTable, type DataTableColumn } from "@corral/ui/components/data-table";
import { EmptyState } from "@corral/ui/components/empty-state";
import { PendingBanner } from "@corral/ui/components/pending-banner";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

function icon(symbol: string) {
  return function Icon({
    className,
    ...props
  }: {
    className?: string;
    "aria-hidden"?: boolean | "true" | "false";
  }) {
    return (
      <span className={className} {...props}>
        {symbol}
      </span>
    );
  };
}

const AlertTriangle = icon("⚠");
const CheckCircle2 = icon("✓");
const Clock3 = icon("◷");
const MessageCircle = icon("☘");
const RefreshCw = icon("↻");
const Send = icon("➤");

import { formatDate, formatTime } from "../mocks";
import type { Delivery } from "../mocks/types";
import {
  buildDeliveryRows,
  ChannelMark,
  CommPageShell,
  commsDisplayEventId,
  DemoUrls,
  deliveryBadge,
  deliverySummary,
  NoNetworkNote,
  OperationalAlert,
  StatCard,
} from "./-comms-shared";

type DeliveryDemo =
  | "default"
  | "partial-delivery"
  | "failures-present"
  | "webhook-pending"
  | "loading"
  | "empty";
const deliveryDemos = [
  "default",
  "partial-delivery",
  "failures-present",
  "webhook-pending",
  "loading",
  "empty",
] as const;
function parseDeliveryDemo(value: unknown): DeliveryDemo {
  return typeof value === "string" && deliveryDemos.includes(value as DeliveryDemo)
    ? (value as DeliveryDemo)
    : "default";
}

export const Route = createFileRoute("/_authenticated/events/$eventId/comms/delivery")({
  validateSearch: (search): { demo: DeliveryDemo } => ({ demo: parseDeliveryDemo(search.demo) }),
  staticData: { breadcrumb: "Delivery" },
  component: DeliveryRoute,
});

const statusFilters = ["all", "read", "delivered", "webhook-pending", "failed"] as const;
type StatusFilter = (typeof statusFilters)[number];

function DeliveryRoute() {
  const { eventId } = Route.useParams() as { eventId: string };
  const { demo } = Route.useSearch() as { demo: DeliveryDemo };
  const [filter, setFilter] = useState<StatusFilter>(
    demo === "failures-present" ? "failed" : "all",
  );
  const loading = demo === "loading";
  const rows =
    demo === "empty"
      ? []
      : buildDeliveryRows(
          eventId,
          demo === "partial-delivery"
            ? "partial-delivery"
            : demo === "failures-present"
              ? "failures-present"
              : undefined,
        );
  const visibleRows = filter === "all" ? rows : rows.filter((row) => row.status === filter);
  const summary = deliverySummary(rows);

  return (
    <CommPageShell
      eventId={eventId}
      eyebrow="O-23 · Delivery monitor"
      title="Delivery status"
      description="Per-message delivered/read tracking across WhatsApp, SMS, and email. Webhook pending states use the S-11 PendingBanner pattern."
      actions={
        <>
          <Button asChild variant="outline">
            <a href={`/events/${eventId}/comms`}>Back to comms</a>
          </Button>
          <Button asChild variant="whatsapp">
            <a href={`/events/${eventId}/comms/send`}>
              <MessageCircle className="size-4" aria-hidden="true" />
              Send follow-up
            </a>
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        <NoNetworkNote />
        {demo === "webhook-pending" || rows.some((row) => row.status === "webhook-pending") ? (
          <PendingBanner
            status="reconciling"
            title="WhatsApp webhook pending"
            description="Provider callbacks for CODISSIA confirmations are still reconciling. Runners are not double-sent while this state is pending."
            action={
              <Button type="button" variant="outline" size="sm">
                <RefreshCw className="size-3.5" aria-hidden="true" />
                Refresh mock status
              </Button>
            }
          />
        ) : null}
        {demo === "partial-delivery" ? (
          <OperationalAlert
            tone="warning"
            title="Partial delivery"
            description="Some recipients remain queued. Use filters to isolate pending callbacks before resending."
          />
        ) : null}
        {demo === "failures-present" ? (
          <OperationalAlert
            tone="error"
            title="Failures present"
            description="Failed SMS/email fallback rows need retry or manual support follow-up."
          />
        ) : null}

        <div className="grid gap-4 lg:grid-cols-4">
          <StatCard
            icon={<Send className="size-5" />}
            label="Total attempts"
            value={String(summary.total)}
            helper="All channels"
            status="info"
          />
          <StatCard
            icon={<CheckCircle2 className="size-5" />}
            label="Delivered"
            value={String(summary.delivered)}
            helper="Delivered or read"
            status="ok"
          />
          <StatCard
            icon={<MessageCircle className="size-5" />}
            label="Read"
            value={String(summary.read)}
            helper="WhatsApp read receipts"
            status="ok"
          />
          <StatCard
            icon={
              summary.failed > 0 ? (
                <AlertTriangle className="size-5" />
              ) : (
                <Clock3 className="size-5" />
              )
            }
            label="Needs attention"
            value={String(summary.failed + summary.pending)}
            helper={`${summary.failed} failed · ${summary.pending} pending`}
            status={summary.failed > 0 ? "error" : summary.pending > 0 ? "pending" : "ok"}
          />
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <CardTitle className="font-display text-2xl uppercase tracking-tight">
                  Recipient delivery table
                </CardTitle>
                <CardDescription>
                  Status is always icon + label. Filter to failures for retry review.
                </CardDescription>
              </div>
              <fieldset className="flex flex-wrap gap-2">
                <legend className="sr-only">Delivery status filters</legend>
                {statusFilters.map((item) => (
                  <Button
                    key={item}
                    type="button"
                    size="sm"
                    variant={filter === item ? "default" : "outline"}
                    onClick={() => setFilter(item)}
                  >
                    {item === "all" ? "All" : item === "webhook-pending" ? "Webhook pending" : item}
                  </Button>
                ))}
              </fieldset>
            </div>
          </CardHeader>
          <CardContent>
            <DeliveryTable rows={visibleRows} loading={loading} />
          </CardContent>
        </Card>

        <DemoUrls
          urls={[
            `/events/${commsDisplayEventId}/comms/delivery?demo=default`,
            `/events/${commsDisplayEventId}/comms/delivery?demo=partial-delivery`,
            `/events/${commsDisplayEventId}/comms/delivery?demo=failures-present`,
            `/events/${commsDisplayEventId}/comms/delivery?demo=webhook-pending`,
            `/events/${commsDisplayEventId}/comms/delivery?demo=loading`,
          ]}
        />
      </div>
    </CommPageShell>
  );
}

function DeliveryTable({ rows, loading }: { rows: Delivery[]; loading: boolean }) {
  const columns: DataTableColumn<Delivery>[] = [
    {
      id: "recipient",
      header: "Recipient",
      cell: (row) => (
        <div>
          <div className="font-medium">{row.recipientName}</div>
          <div className="text-xs text-muted-foreground">{row.recipientPhone}</div>
        </div>
      ),
    },
    { id: "channel", header: "Channel", cell: (row) => <ChannelMark channel={row.channel} /> },
    { id: "status", header: "Status", cell: (row) => deliveryBadge(row.status) },
    {
      id: "reference",
      header: "Reference",
      cell: (row) => (
        <span className="font-mono text-xs text-muted-foreground">
          {row.providerReference ?? "fallback-local"}
        </span>
      ),
    },
    {
      id: "updated",
      header: "Last update",
      cell: (row) => (
        <span>
          {formatDate(row.lastUpdatedAt)} · {formatTime(row.lastUpdatedAt)}
        </span>
      ),
    },
    {
      id: "notes",
      header: "Notes",
      cell: (row) => (
        <span className={row.errorMessage ? "text-danger-text" : "text-muted-foreground"}>
          {row.errorMessage ??
            (row.status === "webhook-pending" ? "Waiting for callback" : "No action needed")}
        </span>
      ),
    },
    {
      id: "action",
      header: "Action",
      cell: (row) => (
        <Button
          size="sm"
          variant={row.status === "failed" ? "default" : "outline"}
          disabled={row.status !== "failed"}
        >
          Retry
        </Button>
      ),
    },
  ];

  return (
    <DataTable
      data={rows}
      columns={columns}
      getRowId={(row) => row.id}
      loading={loading}
      emptyState={
        <EmptyState
          icon={<Send />}
          title="No delivery rows"
          description="Send a WhatsApp message to create delivery activity."
        />
      }
    />
  );
}
