import { Alert, AlertDescription, AlertTitle } from "@corral/ui/components/alert";
import { Badge } from "@corral/ui/components/badge";
import { Button } from "@corral/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@corral/ui/components/card";
import { ConfirmDialog } from "@corral/ui/components/confirm-dialog";
import { DataTable, type DataTableColumn } from "@corral/ui/components/data-table";
import { DegradedBanner } from "@corral/ui/components/degraded-banner";
import { EmptyState } from "@corral/ui/components/empty-state";
import { Input } from "@corral/ui/components/input";
import { Label } from "@corral/ui/components/label";
import { PendingBanner } from "@corral/ui/components/pending-banner";
import { Progress } from "@corral/ui/components/progress";
import { CardSkeleton, TableSkeleton } from "@corral/ui/components/skeletons";
import { StatusBadge, type StatusKind } from "@corral/ui/components/status-badge";
import { Textarea } from "@corral/ui/components/textarea";
import { type ReactNode, useMemo, useState } from "react";

import { useConsoleShell } from "../components/console-shell-context";
import {
  findMockEvent,
  formatDate,
  formatINR,
  hasCapability,
  mockPayments,
  paymentStatusLabels,
} from "../mocks";
import type { DemoState, Payment, PaymentStatusLabel } from "../mocks/types";

const displayEventId = "coimbatore-marathon-2026";
type PageProps = { eventId: string; search: { demo: DemoState } };
type StatTone = "ok" | "warning" | "info" | "danger" | "neutral";
type GstRow = {
  id: string;
  eventId: string;
  invoiceNo: string;
  date: string;
  participantName: string;
  category: string;
  buyerState: string;
  taxableValueInPaise: number;
  cgstInPaise: number;
  sgstInPaise: number;
  igstInPaise: number;
  totalInPaise: number;
  status: PaymentStatusLabel;
  refundAmountInPaise?: number;
  entityProfileId: "gst" | "non-gst";
};
type RefundRow = {
  id: string;
  eventId: string;
  participantName: string;
  bib: string;
  orderId: string;
  amountPaidInPaise: number;
  refundableAmountInPaise: number;
  methodMasked: string;
  paymentStatus: PaymentStatusLabel;
  refundStatus?: PaymentStatusLabel;
  requestedBy?: string;
  requestedAt?: string;
  reasonCategory?: string;
  failureReason?: string;
  settlementEta?: Payment["settlementEta"];
  blockedReason?: string;
};
type PermissionStatus = "not-started" | "due-soon" | "blocked" | "done" | "attachment-uploaded";
type PermissionItem = {
  id: string;
  eventId: string;
  name: string;
  authority: string;
  status: PermissionStatus;
  dueDate: string;
  assignee: string;
  attachments: { id: string; fileName: string; type: string; size: string }[];
  notes: string;
  reminderEnabled: boolean;
  applicable: boolean;
  lastUpdatedBy: string;
  activity: string[];
};

const statusKindByPaymentStatus: Record<PaymentStatusLabel, StatusKind> = {
  "Payment Started": "neutral",
  "Payment Pending": "pending",
  "Paid — Awaiting Webhook": "pending",
  "Paid & Confirmed": "ok",
  "Confirmation Sent": "ok",
  "Settlement Pending": "pending",
  Settled: "ok",
  "Refund Requested": "warning",
  "Refund Processing": "pending",
  Refunded: "ok",
  Failed: "error",
  "User Abandoned": "neutral",
  "Duplicate Payment": "warning",
  "Needs Review": "error",
};
const permissionStatusMeta: Record<PermissionStatus, { label: string; kind: StatusKind }> = {
  "not-started": { label: "Not started", kind: "neutral" },
  "due-soon": { label: "Due soon", kind: "warning" },
  blocked: { label: "Blocked", kind: "error" },
  done: { label: "Done", kind: "ok" },
  "attachment-uploaded": { label: "Attachment uploaded", kind: "info" },
};

const gstRows: GstRow[] = [
  {
    id: "gst-1042",
    eventId: displayEventId,
    invoiceNo: "INV-CBE-2026-1042",
    date: "2026-02-04",
    participantName: "Ananya Krishnan",
    category: "21K Half Marathon",
    buyerState: "Tamil Nadu",
    taxableValueInPaise: 127034,
    cgstInPaise: 11433,
    sgstInPaise: 11433,
    igstInPaise: 0,
    totalInPaise: 149900,
    status: "Paid & Confirmed",
    entityProfileId: "gst",
  },
  {
    id: "gst-1188",
    eventId: displayEventId,
    invoiceNo: "INV-CBE-2026-1188",
    date: "2026-02-06",
    participantName: "Karthik Narayanan",
    category: "10K Open",
    buyerState: "Karnataka",
    taxableValueInPaise: 76186,
    cgstInPaise: 0,
    sgstInPaise: 0,
    igstInPaise: 13714,
    totalInPaise: 89900,
    status: "Settlement Pending",
    entityProfileId: "gst",
  },
  {
    id: "gst-1203",
    eventId: displayEventId,
    invoiceNo: "INV-CBE-2026-1203",
    date: "2026-02-02",
    participantName: "Rohit Varadarajan",
    category: "5K Fun Run",
    buyerState: "Tamil Nadu",
    taxableValueInPaise: 42288,
    cgstInPaise: 3806,
    sgstInPaise: 3806,
    igstInPaise: 0,
    totalInPaise: 49900,
    status: "Refunded",
    refundAmountInPaise: 49900,
    entityProfileId: "gst",
  },
  {
    id: "gst-1219",
    eventId: displayEventId,
    invoiceNo: "RPT-CBE-2026-1219",
    date: "2026-02-10",
    participantName: "Mohammed Faisal",
    category: "21K Half Marathon",
    buyerState: "Tamil Nadu",
    taxableValueInPaise: 149900,
    cgstInPaise: 0,
    sgstInPaise: 0,
    igstInPaise: 0,
    totalInPaise: 149900,
    status: "Needs Review",
    entityProfileId: "non-gst",
  },
];

const refundRows: RefundRow[] = [
  {
    id: "refund-sanjay",
    eventId: displayEventId,
    participantName: "Sanjay Mohan",
    bib: "2181",
    orderId: "order_demo_refreq",
    amountPaidInPaise: 149900,
    refundableAmountInPaise: 149900,
    methodMasked: "UPI · sanjay••@oksbi",
    paymentStatus: "Paid & Confirmed",
    refundStatus: "Refund Requested",
    requestedBy: "Nandhini S · Finance",
    requestedAt: "2026-02-09T10:00:00+05:30",
    reasonCategory: "Participant request",
    settlementEta: "T+2",
  },
  {
    id: "refund-janani",
    eventId: displayEventId,
    participantName: "Janani B",
    bib: "1194",
    orderId: "order_demo_refproc",
    amountPaidInPaise: 89900,
    refundableAmountInPaise: 44900,
    methodMasked: "Card · Visa •••• 1188",
    paymentStatus: "Settled",
    refundStatus: "Refund Processing",
    requestedBy: "Priya Ramanathan · Owner",
    requestedAt: "2026-02-09T15:20:00+05:30",
    reasonCategory: "Organizer goodwill",
    settlementEta: "T+3",
  },
  {
    id: "refund-rohit",
    eventId: displayEventId,
    participantName: "Rohit Varadarajan",
    bib: "0542",
    orderId: "order_demo_refunded",
    amountPaidInPaise: 49900,
    refundableAmountInPaise: 0,
    methodMasked: "NetBanking · HDFC •••• 2201",
    paymentStatus: "Refunded",
    refundStatus: "Refunded",
    requestedBy: "Nandhini S · Finance",
    requestedAt: "2026-02-05T18:40:00+05:30",
    reasonCategory: "Duplicate payment",
    settlementEta: "T+2",
  },
  {
    id: "refund-blocked",
    eventId: displayEventId,
    participantName: "Karthik Narayanan",
    bib: "1042",
    orderId: "order_demo_2188",
    amountPaidInPaise: 89900,
    refundableAmountInPaise: 89900,
    methodMasked: "Card · Mastercard •••• 4421",
    paymentStatus: "Settlement Pending",
    settlementEta: "T+3",
    blockedReason: "This payment has not settled yet — refunds unlock after T+3.",
  },
  {
    id: "refund-failed",
    eventId: displayEventId,
    participantName: "Ramesh Kannan",
    bib: "2107",
    orderId: "order_demo_duplicate",
    amountPaidInPaise: 89900,
    refundableAmountInPaise: 89900,
    methodMasked: "Card · source unavailable",
    paymentStatus: "Duplicate Payment",
    refundStatus: "Failed",
    requestedBy: "Priya Ramanathan · Owner",
    requestedAt: "2026-02-10T12:03:00+05:30",
    reasonCategory: "Duplicate payment",
    failureReason: "Original payment method unavailable — moved to Needs Review.",
    settlementEta: "T+3",
  },
];

const permissionItems: PermissionItem[] = [
  {
    id: "police-traffic-noc",
    eventId: displayEventId,
    name: "Police / Traffic NOC",
    authority: "Coimbatore City Police (Traffic)",
    status: "due-soon",
    dueDate: "2026-06-21",
    assignee: "Arun Velusamy",
    attachments: [],
    notes: "Route map and junction deployment plan ready for Traffic Inspector review.",
    reminderEnabled: true,
    applicable: true,
    lastUpdatedBy: "Arun Velusamy",
    activity: ["Reminder scheduled for T-21 and T-14", "Route map added to notes"],
  },
  {
    id: "ccmc-permission",
    eventId: displayEventId,
    name: "CCMC permission",
    authority: "Coimbatore City Municipal Corporation (CCMC)",
    status: "blocked",
    dueDate: "2026-06-18",
    assignee: "Priya Ramanathan",
    attachments: [
      { id: "att-ccmc", fileName: "ccmc-application-draft.pdf", type: "PDF", size: "412 KB" },
    ],
    notes: "Awaiting CCMC ground-availability confirmation for CODISSIA frontage.",
    reminderEnabled: true,
    applicable: true,
    lastUpdatedBy: "Priya Ramanathan",
    activity: ["Blocked by venue availability", "Application draft attached"],
  },
  {
    id: "ambulance-108",
    eventId: displayEventId,
    name: "Ambulance / 108 + first-aid",
    authority: "108 EMS / Ganga Medical Centre first-aid partner",
    status: "done",
    dueDate: "2026-06-25",
    assignee: "Karthik R",
    attachments: [
      { id: "att-108", fileName: "108-ambulance-confirmation.pdf", type: "PDF", size: "288 KB" },
    ],
    notes: "Two ambulances confirmed: CODISSIA gate and Race Course hydration point.",
    reminderEnabled: true,
    applicable: true,
    lastUpdatedBy: "Karthik R",
    activity: ["Medical partner confirmed", "Attachment uploaded"],
  },
  {
    id: "fire-safety-noc",
    eventId: displayEventId,
    name: "Fire & safety NOC",
    authority: "TN Fire & Rescue Services (where needed)",
    status: "attachment-uploaded",
    dueDate: "2026-06-28",
    assignee: "Suresh Balasubramanian",
    attachments: [
      { id: "att-fire", fileName: "fire-safety-self-declaration.jpg", type: "JPG", size: "1.1 MB" },
    ],
    notes: "Applicability marked for stage/power area only; final NOC review pending.",
    reminderEnabled: false,
    applicable: true,
    lastUpdatedBy: "Suresh Balasubramanian",
    activity: ["Applicability confirmed", "Declaration image attached"],
  },
  {
    id: "music-license",
    eventId: displayEventId,
    name: "IPRS/PPL music license",
    authority: "IPRS / PPL",
    status: "done",
    dueDate: "2026-06-30",
    assignee: "Meena S",
    attachments: [
      { id: "att-music", fileName: "ppl-event-license.pdf", type: "PDF", size: "340 KB" },
    ],
    notes: "DJ zone and warm-up music covered for 05:00–09:00.",
    reminderEnabled: false,
    applicable: true,
    lastUpdatedBy: "Meena S",
    activity: ["PPL license attached", "Marked done"],
  },
  {
    id: "participant-insurance",
    eventId: displayEventId,
    name: "Participant insurance",
    authority: "Digit / ICICI Lombard / Acko",
    status: "done",
    dueDate: "2026-06-15",
    assignee: "Nandhini S",
    attachments: [
      {
        id: "att-insurance",
        fileName: "participant-insurance-cover-note.pdf",
        type: "PDF",
        size: "528 KB",
      },
    ],
    notes: "₹2L accident cover configured for all distances; add-on copy reviewed.",
    reminderEnabled: true,
    applicable: true,
    lastUpdatedBy: "Nandhini S",
    activity: ["Insurance add-on linked", "Cover note attached"],
  },
];

function getEventName(eventId: string) {
  return findMockEvent(eventId)?.name ?? "Coimbatore Marathon 2026";
}
function Icon({ label }: { label: string }) {
  return (
    <span aria-hidden="true" className="text-base leading-none">
      {label}
    </span>
  );
}
function PaymentBadge({ status }: { status: PaymentStatusLabel }) {
  return <StatusBadge status={statusKindByPaymentStatus[status]} label={status} />;
}
function PermissionBadge({ status }: { status: PermissionStatus }) {
  const meta = permissionStatusMeta[status];
  return <StatusBadge status={meta.kind} label={meta.label} />;
}

function PageShell({
  eventId,
  eyebrow,
  title,
  description,
  actions,
  children,
}: {
  eventId: string;
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <main
      className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 lg:px-8"
      aria-labelledby="page-title"
    >
      <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        <div className="relative isolate p-6 lg:p-8">
          <div className="absolute inset-y-0 right-0 -z-10 w-1/2 bg-[radial-gradient(circle_at_top_right,rgba(255,90,0,0.16),transparent_48%),linear-gradient(135deg,transparent,rgba(15,23,42,0.05))]" />
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl space-y-2">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-brand-orange-strong">
                {eyebrow}
              </p>
              <h1
                id="page-title"
                className="font-display text-3xl font-black uppercase tracking-tight text-foreground lg:text-4xl"
              >
                {title}
              </h1>
              <p className="text-muted-foreground">{description}</p>
              <p className="text-sm text-muted-foreground">
                Active event:{" "}
                <span className="font-medium text-foreground">{getEventName(eventId)}</span>
              </p>
            </div>
            {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
          </div>
        </div>
      </div>
      {children}
    </main>
  );
}
function DemoUrls({ urls }: { urls: string[] }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="font-display text-xl uppercase">Demo URLs</CardTitle>
        <CardDescription>
          Deterministic states for review. No network or backend calls.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="grid gap-2 text-sm lg:grid-cols-3">
          {urls.map((url) => (
            <li
              key={url}
              className="rounded-md border bg-muted/30 px-3 py-2 font-mono text-xs text-muted-foreground"
            >
              {url}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
function StatCard({
  icon,
  label,
  value,
  helper,
  tone = "neutral",
}: {
  icon: ReactNode;
  label: string;
  value: string;
  helper: string;
  tone?: StatTone;
}) {
  const toneClass = {
    ok: "border-success/30 bg-success/10 text-success-text",
    warning: "border-warning/30 bg-warning/10 text-warning-text",
    info: "border-info/30 bg-info/10 text-info-text",
    danger: "border-danger/30 bg-danger/10 text-danger-text",
    neutral: "border-muted bg-muted/60 text-muted-foreground",
  }[tone];
  return (
    <Card>
      <CardContent className="flex items-start gap-4 p-5">
        <span
          className={`flex size-11 shrink-0 items-center justify-center rounded-xl border ${toneClass}`}
          aria-hidden="true"
        >
          {icon}
        </span>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="font-display text-3xl font-black tracking-tight">{value}</p>
          <p className="text-xs text-muted-foreground">{helper}</p>
        </div>
      </CardContent>
    </Card>
  );
}
function GuidanceAlerts({
  demo,
  kind,
}: {
  demo: DemoState;
  kind: "payments" | "exports" | "refunds" | "permissions";
}) {
  return (
    <div className="space-y-3">
      {demo === "offline" && (
        <DegradedBanner
          mode="offline"
          title="Offline demo mode"
          description="Actions are simulated locally. No backend, provider, or download network calls run."
        />
      )}
      {demo === "webhook-pending" && (
        <PendingBanner
          status="reconciling"
          title="Payment reconciliation pending"
          description="Webhook and settlement rows are intentionally paused in this demo state."
        />
      )}
      {demo === "error" && (
        <DegradedBanner
          mode="degraded"
          title="Demo failure state"
          description="This state shows retry copy without calling a payment provider or authority portal."
        />
      )}
      {kind === "refunds" && (
        <Alert className="border-info/40 bg-info/10 text-info-text">
          <Icon label="🛡" />
          <AlertTitle>RBI PA-PG guardrails</AlertTitle>
          <AlertDescription className="text-info-text/90">
            Refunds return to the original payment instrument, cannot exceed captured amount, unlock
            after confirmation/settlement, and are processed by the licensed payment partner. Corral
            never holds funds.
          </AlertDescription>
        </Alert>
      )}
      {kind === "permissions" && (
        <Alert className="border-info/40 bg-info/10 text-info-text">
          <Icon label="☑" />
          <AlertTitle>Checklist only — not automated filing</AlertTitle>
          <AlertDescription className="text-info-text/90">
            Corral helps your team track permits, reminders, notes, and attachments. The organizer
            files with each Coimbatore/TN authority.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

export function PaymentsDashboard({ eventId, search }: PageProps) {
  const { demo } = search;
  const rows = (
    demo === "empty" ? [] : mockPayments.filter((payment) => payment.eventId === eventId)
  ) as Payment[];
  const shownRows =
    demo === "webhook-pending"
      ? rows.filter((row) =>
          ["Paid — Awaiting Webhook", "Settlement Pending", "Refund Processing"].includes(
            row.status,
          ),
        )
      : rows;
  const collected = rows
    .filter((row) =>
      ["Paid & Confirmed", "Confirmation Sent", "Settlement Pending", "Settled"].includes(
        row.status,
      ),
    )
    .reduce((sum, row) => sum + row.amountInPaise, 0);
  const pending = rows
    .filter((row) =>
      ["Payment Pending", "Paid — Awaiting Webhook", "Settlement Pending"].includes(row.status),
    )
    .reduce((sum, row) => sum + row.amountInPaise, 0);
  const settled = rows
    .filter((row) => row.status === "Settled" || row.settlementDate)
    .reduce((sum, row) => sum + row.amountInPaise, 0);
  const needsReview = rows.filter(
    (row) => row.status === "Needs Review" || row.status === "Duplicate Payment",
  ).length;
  const columns = useMemo<DataTableColumn<Payment>[]>(
    () => [
      {
        id: "participant",
        header: "Participant",
        cell: (row) => (
          <div>
            <p className="font-medium">{row.participantName}</p>
            <p className="text-xs text-muted-foreground">{row.registrationId}</p>
          </div>
        ),
      },
      {
        id: "amount",
        header: "Amount",
        cell: (row) => (
          <span className="font-mono tabular-nums">{formatINR(row.amountInPaise)}</span>
        ),
        className: "text-right",
      },
      { id: "status", header: "Status", cell: (row) => <PaymentBadge status={row.status} /> },
      { id: "method", header: "Method", accessor: "method" },
      {
        id: "settlement",
        header: "Settlement",
        cell: (row) => (
          <div className="space-y-1">
            <Badge variant={row.settlementEta === "Manual" ? "muted" : "info"}>
              {row.settlementEta}
            </Badge>
            <p className="text-xs text-muted-foreground">
              {row.settlementDate ? formatDate(row.settlementDate) : "Awaiting partner"}
            </p>
          </div>
        ),
      },
      {
        id: "updated",
        header: "Updated",
        cell: (row) => <span className="text-sm">{formatDate(row.updatedAt)}</span>,
      },
    ],
    [],
  );
  return (
    <PageShell
      eventId={eventId}
      eyebrow="O-31 · Payments + settlement"
      title="Payments / Settlement Dashboard"
      description="Track checkout intent, gateway success, webhook confirmation, refunds, and T+2/T+3 settlement using one shared payment vocabulary."
      actions={
        <>
          <Button asChild variant="outline">
            <a href={`/events/${eventId}/payments/exports`}>
              <Icon label="▣" /> GST exports
            </a>
          </Button>
          <Button asChild>
            <a href={`/events/${eventId}/payments/refunds`}>
              <Icon label="↻" /> Refunds
            </a>
          </Button>
        </>
      }
    >
      <GuidanceAlerts demo={demo} kind="payments" />
      <div className="grid gap-4 lg:grid-cols-4">
        <StatCard
          icon={<Icon label="₹" />}
          label="Collected"
          value={formatINR(collected)}
          helper="Confirmed + settlement rows"
          tone="ok"
        />
        <StatCard
          icon={<Icon label="⏱" />}
          label="Pending"
          value={formatINR(pending)}
          helper="Webhook or T+2/T+3"
          tone="warning"
        />
        <StatCard
          icon={<Icon label="🏦" />}
          label="Settled / dated"
          value={formatINR(settled)}
          helper="Bank settlement confirmed"
          tone="info"
        />
        <StatCard
          icon={<Icon label="!" />}
          label="Needs review"
          value={String(needsReview)}
          helper="Duplicate/cash/manual"
          tone={needsReview ? "danger" : "neutral"}
        />
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-2xl uppercase">
            Shared reconciliation labels
          </CardTitle>
          <CardDescription>
            All 14 labels appear as icon + text to prevent drift across checkout, roster,
            settlement, exports, and refunds.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {paymentStatusLabels.map((label) => (
            <PaymentBadge key={label} status={label} />
          ))}
        </CardContent>
      </Card>
      {demo === "loading" ? (
        <TableSkeleton />
      ) : shownRows.length === 0 ? (
        <EmptyState
          icon={<Icon label="▤" />}
          title="No payments in this view"
          description="Try the default demo to see Coimbatore transactions, settlement timing, and refund states."
        />
      ) : (
        <DataTable
          data={shownRows}
          columns={columns}
          getRowId={(row) => row.id}
          className="overflow-x-auto"
        />
      )}
      <DemoUrls
        urls={[
          `/events/${displayEventId}/payments?demo=default`,
          `/events/${displayEventId}/payments?demo=webhook-pending`,
          `/events/${displayEventId}/payments?demo=empty`,
          `/events/${displayEventId}/payments?demo=loading`,
        ]}
      />
    </PageShell>
  );
}

export function PaymentExportsScreen({ eventId, search }: PageProps) {
  const { persona } = useConsoleShell();
  const { demo } = search;
  const [reason, setReason] = useState(
    demo === "success" ? "Monthly GST reconciliation for finance review." : "",
  );
  const canExport = hasCapability(persona, "payments:export") && demo !== "permission-denied";
  const entity = demo === "offline" ? "non-gst" : "gst";
  const scopedRows = (demo === "empty" ? [] : gstRows).filter(
    (row) => row.eventId === eventId && (entity === "gst" ? row.entityProfileId === "gst" : true),
  );
  const taxable = scopedRows.reduce((sum, row) => sum + row.taxableValueInPaise, 0),
    cgst = scopedRows.reduce((sum, row) => sum + row.cgstInPaise, 0),
    sgst = scopedRows.reduce((sum, row) => sum + row.sgstInPaise, 0),
    igst = scopedRows.reduce((sum, row) => sum + row.igstInPaise, 0),
    total = scopedRows.reduce((sum, row) => sum + row.totalInPaise, 0),
    refunds = scopedRows.reduce((sum, row) => sum + (row.refundAmountInPaise ?? 0), 0);
  const columns = useMemo<DataTableColumn<GstRow>[]>(
    () => [
      {
        id: "invoice",
        header: "Invoice",
        cell: (row) => (
          <div>
            <p className="font-medium">{row.invoiceNo}</p>
            <p className="text-xs text-muted-foreground">{formatDate(row.date)}</p>
          </div>
        ),
      },
      {
        id: "buyer",
        header: "Buyer",
        cell: (row) => (
          <div>
            <p>{row.participantName}</p>
            <p className="text-xs text-muted-foreground">
              {row.category} · {row.buyerState}
            </p>
          </div>
        ),
      },
      {
        id: "taxable",
        header: "Taxable",
        cell: (row) => formatINR(row.taxableValueInPaise),
        className: "text-right font-mono tabular-nums",
      },
      {
        id: "tax",
        header: "Tax",
        cell: (row) =>
          row.igstInPaise
            ? `IGST ${formatINR(row.igstInPaise)}`
            : `CGST ${formatINR(row.cgstInPaise)} + SGST ${formatINR(row.sgstInPaise)}`,
      },
      {
        id: "total",
        header: "Total",
        cell: (row) => formatINR(row.totalInPaise),
        className: "text-right font-mono tabular-nums",
      },
      {
        id: "status",
        header: "Payment status",
        cell: (row) => <PaymentBadge status={row.status} />,
      },
    ],
    [],
  );
  return (
    <PageShell
      eventId={eventId}
      eyebrow="O-32 · GST + payment reports"
      title="GST Invoice / Report Export"
      description="Export GST invoices and payment reports with explicit PII permission, statutory fields, and audit reason capture."
      actions={
        <>
          <Button asChild variant="outline">
            <a href={`/events/${eventId}/payments`}>
              <Icon label="↔" /> Settlement
            </a>
          </Button>
          <Button asChild variant="outline">
            <a href={`/events/${eventId}/payments/refunds`}>
              Refunds <Icon label="↗" />
            </a>
          </Button>
        </>
      }
    >
      <GuidanceAlerts demo={demo} kind="exports" />
      {demo === "loading" ? (
        <CardSkeleton />
      ) : (
        <div className="grid gap-4 lg:grid-cols-5">
          <StatCard
            icon={<Icon label="₹" />}
            label="Collected"
            value={formatINR(total)}
            helper="Gross report value"
            tone="ok"
          />
          <StatCard
            icon={<Icon label="▤" />}
            label="Taxable"
            value={formatINR(taxable)}
            helper="HSN/SAC event entry"
            tone="info"
          />
          <StatCard
            icon={<Icon label="§" />}
            label="CGST + SGST"
            value={formatINR(cgst + sgst)}
            helper="Tamil Nadu (33)"
            tone="warning"
          />
          <StatCard
            icon={<Icon label="🏦" />}
            label="IGST"
            value={formatINR(igst)}
            helper="Inter-state buyers"
            tone="neutral"
          />
          <StatCard
            icon={<Icon label="↻" />}
            label="Refunds"
            value={formatINR(refunds)}
            helper="GST adjustment rows"
            tone="danger"
          />
        </div>
      )}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="font-display text-2xl uppercase">
                Export configuration
              </CardTitle>
              <Badge variant={entity === "gst" ? "info" : "muted"}>
                {entity === "gst" ? "GST-registered · GSTIN 33ABCDE1234F1Z5" : "Non-GST club/trust"}
              </Badge>
            </div>
            <CardDescription>
              PII/payment exports are restricted to Finance, Admin, and Owner roles.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="report-type">Report type</Label>
              <Input id="report-type" value="Payment + GST report" readOnly />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date-range">Date range</Label>
              <Input id="date-range" value="01 Feb 2026 — 29 Feb 2026" readOnly />
            </div>
            <div className="space-y-2">
              <Label htmlFor="format">Format</Label>
              <Input id="format" value="CSV + PDF summary" readOnly />
            </div>
            <div className="space-y-2">
              <Label>Status scope</Label>
              <div className="flex flex-wrap gap-2">
                {["Paid & Confirmed", "Settlement Pending", "Refunded"].map((status) => (
                  <PaymentBadge key={status} status={status as PaymentStatusLabel} />
                ))}
              </div>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="export-reason">Audit reason</Label>
              <Textarea
                id="export-reason"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                aria-invalid={demo === "validation-error" || !reason.trim()}
                aria-describedby="export-reason-help"
                placeholder="Why are you exporting this report? (contains participant PII — recorded in the audit log)"
              />
              <p
                id="export-reason-help"
                className={
                  demo === "validation-error" || !reason.trim()
                    ? "text-danger-text text-sm"
                    : "text-muted-foreground text-sm"
                }
              >
                {reason.trim() ? "Reason ready for audit log." : "Add a reason to export PII."}
              </p>
            </div>
            <div className="md:col-span-2">
              <ConfirmDialog
                requireReason
                title="Export GST/payment report?"
                description="This mock export includes participant PII and payment data. The audit reason is required and no backend download is called."
                confirmLabel={demo === "success" ? "Export ready" : "Mock export"}
                reasonValue={reason}
                onReasonChange={setReason}
                confirmDisabled={!canExport}
                trigger={
                  <Button disabled={!canExport || !reason.trim()}>
                    <Icon label="↓" /> {demo === "success" ? "Export complete" : "Export report"}
                  </Button>
                }
              />
            </div>
            {!canExport && (
              <p className="text-danger-text text-sm md:col-span-2">
                <Icon label="🔒" />
                Your role can view reports but cannot export PII/payment files.
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-2xl uppercase">
              {entity === "gst" ? "GST invoice preview" : "Non-GST report"}
            </CardTitle>
            <CardDescription>
              {entity === "gst"
                ? "Statutory fields shown before export."
                : "No tax invoice is generated for a non-GST club/trust."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {entity === "gst" ? (
              <>
                <p>
                  <strong>Organizer:</strong> Kovai Road Runners Association · GSTIN 33ABCDE1234F1Z5
                </p>
                <p>
                  <strong>Corral:</strong> GSTIN/PAN on platform fee invoice
                </p>
                <p>
                  <strong>Place of supply:</strong> Tamil Nadu (33)
                </p>
                <p>
                  <strong>HSN/SAC:</strong> 999659 · Event entry / race registration
                </p>
                <p>
                  <strong>Tax:</strong> CGST 9% + SGST 9%, or IGST 18% outside TN
                </p>
              </>
            ) : (
              <p>
                This organizer runs under a club/trust without GST registration — only a payment
                report is available. GST applies to Corral's platform fee separately.
              </p>
            )}
            <Alert className="border-warning/40 bg-warning/10 text-warning-text">
              <Icon label="!" />
              <AlertTitle>Organizer-absorbed fee</AlertTitle>
              <AlertDescription className="text-warning-text/90">
                Convenience fee is absorbed by the organizer — participants are not charged a
                separate fee.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
      {demo === "loading" ? (
        <TableSkeleton />
      ) : scopedRows.length === 0 ? (
        <EmptyState
          icon={<Icon label="▤" />}
          title="No transactions in this range"
          description="Adjust the date range or use the default demo to preview GST rows."
        />
      ) : (
        <DataTable
          data={scopedRows}
          columns={columns}
          getRowId={(row) => row.id}
          className="overflow-x-auto"
        />
      )}
      <DemoUrls
        urls={[
          `/events/${displayEventId}/payments/exports?demo=default`,
          `/events/${displayEventId}/payments/exports?demo=success`,
          `/events/${displayEventId}/payments/exports?demo=validation-error`,
          `/events/${displayEventId}/payments/exports?demo=permission-denied&as=org-readonly`,
          `/events/${displayEventId}/payments/exports?demo=empty`,
        ]}
      />
    </PageShell>
  );
}

export function RefundsScreen({ eventId, search }: PageProps) {
  const { persona } = useConsoleShell();
  const { demo } = search;
  const [reason, setReason] = useState(
    demo === "success" ? "Participant requested medical withdrawal; within policy." : "",
  );
  const canRefund = hasCapability(persona, "payments:refund") && demo !== "permission-denied";
  const rows = demo === "empty" ? [] : refundRows.filter((row) => row.eventId === eventId);
  const visibleRows =
    demo === "webhook-pending"
      ? rows.filter(
          (row) =>
            row.refundStatus === "Refund Processing" || row.paymentStatus === "Settlement Pending",
        )
      : demo === "error"
        ? rows.filter((row) => row.refundStatus === "Failed")
        : rows;
  const summary = {
    requested: rows
      .filter((row) => row.refundStatus === "Refund Requested")
      .reduce((sum, row) => sum + row.refundableAmountInPaise, 0),
    processing: rows
      .filter((row) => row.refundStatus === "Refund Processing")
      .reduce((sum, row) => sum + row.refundableAmountInPaise, 0),
    refunded: rows
      .filter((row) => row.refundStatus === "Refunded")
      .reduce((sum, row) => sum + row.amountPaidInPaise, 0),
    failed: rows.filter((row) => row.refundStatus === "Failed").length,
  };
  const columns = useMemo<DataTableColumn<RefundRow>[]>(
    () => [
      {
        id: "participant",
        header: "Participant",
        cell: (row) => (
          <div>
            <p className="font-medium">{row.participantName}</p>
            <p className="text-xs text-muted-foreground">
              BIB {row.bib} · {row.orderId}
            </p>
          </div>
        ),
      },
      {
        id: "amount",
        header: "Paid / refundable",
        cell: (row) => (
          <div className="text-right font-mono tabular-nums">
            <p>{formatINR(row.amountPaidInPaise)}</p>
            <p className="text-xs text-muted-foreground">
              {formatINR(row.refundableAmountInPaise)} refundable
            </p>
          </div>
        ),
        className: "text-right",
      },
      { id: "method", header: "Original method", accessor: "methodMasked" },
      {
        id: "payment",
        header: "Payment status",
        cell: (row) => <PaymentBadge status={row.paymentStatus} />,
      },
      {
        id: "refund",
        header: "Refund status",
        cell: (row) =>
          row.refundStatus ? (
            <PaymentBadge status={row.refundStatus} />
          ) : (
            <StatusBadge status="neutral" label="Not started" />
          ),
      },
      {
        id: "requested",
        header: "Requested by",
        cell: (row) =>
          row.requestedBy ? (
            <div>
              <p>{row.requestedBy}</p>
              <p className="text-xs text-muted-foreground">
                {row.requestedAt ? formatDate(row.requestedAt) : "—"}
              </p>
            </div>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
      {
        id: "action",
        header: "Action",
        cell: (row) => (
          <ConfirmDialog
            requireReason
            destructive
            title={`Refund ${formatINR(row.refundableAmountInPaise)}?`}
            description={`Refund to ${row.participantName} (${row.methodMasked}). This cannot exceed captured amount and returns to the original instrument.`}
            confirmLabel="Initiate mock refund"
            reasonValue={reason}
            onReasonChange={setReason}
            confirmDisabled={!canRefund || Boolean(row.blockedReason)}
            trigger={
              <Button
                size="sm"
                variant={row.blockedReason ? "outline" : "destructive"}
                disabled={!canRefund || Boolean(row.blockedReason)}
              >
                <Icon label="↻" /> Refund
              </Button>
            }
          />
        ),
      },
    ],
    [canRefund, reason],
  );
  return (
    <PageShell
      eventId={eventId}
      eyebrow="O-33 · Refund operations"
      title="Refunds"
      description="Initiate and track full or partial refunds within RBI PA-PG limits with mandatory audit reasons."
      actions={
        <>
          <Button asChild variant="outline">
            <a href={`/events/${eventId}/payments`}>Settlement</a>
          </Button>
          <Button asChild variant="outline">
            <a href={`/events/${eventId}/payments/exports`}>GST impact</a>
          </Button>
        </>
      }
    >
      <GuidanceAlerts demo={demo} kind="refunds" />
      <div className="grid gap-4 lg:grid-cols-4">
        <StatCard
          icon={<Icon label="?" />}
          label="Requested"
          value={formatINR(summary.requested)}
          helper="Waiting partner acceptance"
          tone="warning"
        />
        <StatCard
          icon={<Icon label="↻" />}
          label="Processing"
          value={formatINR(summary.processing)}
          helper="Partner callback pending"
          tone="info"
        />
        <StatCard
          icon={<Icon label="✓" />}
          label="Refunded"
          value={formatINR(summary.refunded)}
          helper="Returned to source"
          tone="ok"
        />
        <StatCard
          icon={<Icon label="!" />}
          label="Failed"
          value={String(summary.failed)}
          helper="Needs review branch"
          tone={summary.failed ? "danger" : "neutral"}
        />
      </div>
      <Card>
        <CardContent className="grid gap-3 p-5 lg:grid-cols-4">
          <p className="font-medium lg:col-span-4">RBI checklist shown in every refund action:</p>
          {[
            "Refunds return to the original payment method",
            "Cannot exceed amount paid",
            "Only after payment is confirmed/settled",
            "Processed by licensed payment partner",
          ].map((item) => (
            <div key={item} className="flex items-center gap-2 text-sm">
              <Icon label="✓" />
              {item}
            </div>
          ))}
          <div className="space-y-2 lg:col-span-4">
            <Label htmlFor="refund-reason">Bulk/action audit reason</Label>
            <Textarea
              id="refund-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Reason for this refund (recorded in the audit log)."
              aria-invalid={demo === "validation-error" || !reason.trim()}
            />
            {(demo === "validation-error" || !reason.trim()) && (
              <p className="text-danger-text text-sm" aria-live="polite">
                Enter a reason to continue. Refund can't exceed captured amount.
              </p>
            )}
          </div>
          {!canRefund && (
            <p className="text-danger-text text-sm lg:col-span-4">
              <Icon label="🔒" />
              Only Finance, Owner, or Admin can initiate refunds.
            </p>
          )}
        </CardContent>
      </Card>
      {demo === "loading" ? (
        <TableSkeleton />
      ) : visibleRows.length === 0 ? (
        <EmptyState
          icon={<Icon label="↻" />}
          title="No refund-eligible transactions"
          description="Confirmed or settled payments will appear here when they can be refunded."
        />
      ) : (
        <DataTable
          data={visibleRows}
          columns={columns}
          getRowId={(row) => row.id}
          className="overflow-x-auto"
          rowClassName={(row) => (row.blockedReason ? "bg-warning/5" : undefined)}
        />
      )}
      {visibleRows.some((row) => row.blockedReason || row.failureReason) && (
        <Alert className="border-warning/40 bg-warning/10 text-warning-text">
          <Icon label="!" />
          <AlertTitle>Blocked / needs review examples</AlertTitle>
          <AlertDescription className="text-warning-text/90">
            {visibleRows.find((row) => row.blockedReason || row.failureReason)?.blockedReason ??
              visibleRows.find((row) => row.failureReason)?.failureReason}
          </AlertDescription>
        </Alert>
      )}
      <DemoUrls
        urls={[
          `/events/${displayEventId}/payments/refunds?demo=default`,
          `/events/${displayEventId}/payments/refunds?demo=webhook-pending`,
          `/events/${displayEventId}/payments/refunds?demo=validation-error`,
          `/events/${displayEventId}/payments/refunds?demo=permission-denied&as=org-readonly`,
          `/events/${displayEventId}/payments/refunds?demo=empty`,
        ]}
      />
    </PageShell>
  );
}

export function PermissionsScreen({ eventId, search }: PageProps) {
  const { persona } = useConsoleShell();
  const { demo } = search;
  const canManage = hasCapability(persona, "permissions:manage") && demo !== "permission-denied";
  const rows = demo === "empty" ? [] : permissionItems.filter((item) => item.eventId === eventId);
  const complete = rows.filter(
      (item) => item.status === "done" || item.status === "attachment-uploaded",
    ).length,
    blocked = rows.filter((item) => item.status === "blocked").length,
    dueSoon = rows.filter((item) => item.status === "due-soon").length,
    percent = rows.length ? Math.round((complete / rows.length) * 100) : 0;
  const columns = useMemo<DataTableColumn<PermissionItem>[]>(
    () => [
      {
        id: "item",
        header: "Checklist item",
        cell: (row) => (
          <div>
            <p className="font-medium">{row.name}</p>
            <p className="text-xs text-muted-foreground">{row.authority}</p>
          </div>
        ),
      },
      { id: "status", header: "Status", cell: (row) => <PermissionBadge status={row.status} /> },
      {
        id: "due",
        header: "Due date",
        cell: (row) => (
          <div>
            <p>{formatDate(row.dueDate)}</p>
            <p className="text-xs text-muted-foreground">Suggested by T-21 days</p>
          </div>
        ),
      },
      { id: "assignee", header: "Assignee", accessor: "assignee" },
      {
        id: "attachments",
        header: "Attachments",
        cell: (row) => (
          <span className="inline-flex items-center gap-1">
            <Icon label="📎" />
            {row.attachments.length} files
          </span>
        ),
      },
      {
        id: "notes",
        header: "Notes",
        cell: (row) => <p className="max-w-xs text-sm text-muted-foreground">{row.notes}</p>,
      },
      {
        id: "action",
        header: "Action",
        cell: (row) => (
          <ConfirmDialog
            requireReason
            title={`Update ${row.name}`}
            description="Status changes and official attachments are recorded in the audit log. Attach signed NOC/license PDFs or JPGs when available."
            confirmLabel={demo === "success" ? "Uploaded" : "Mock update"}
            reasonPlaceholder="Why are you updating this permission item?"
            confirmDisabled={!canManage}
            trigger={
              <Button size="sm" variant="outline" disabled={!canManage}>
                <Icon label="↑" /> Update
              </Button>
            }
          >
            <div className="grid gap-3 rounded-lg border bg-muted/40 p-3 text-sm">
              <p>
                <strong>Authority:</strong> {row.authority}
              </p>
              <p>
                <strong>Latest:</strong> {row.activity[0]}
              </p>
              <p>
                <strong>Attachment helper:</strong> Attach the signed NOC / license (PDF/JPG).
                Visible to your team only.
              </p>
            </div>
          </ConfirmDialog>
        ),
      },
    ],
    [canManage, demo],
  );
  return (
    <PageShell
      eventId={eventId}
      eyebrow="O-34 · TN / Coimbatore trust tools"
      title="Permissions Checklist"
      description="Track permits, NOCs, licenses, reminders, notes, and attachments for Coimbatore race-day readiness."
      actions={
        <>
          <Button asChild variant="outline">
            <a href={`/events/${eventId}/setup/publish`}>
              <Icon label="☑" /> Publish readiness
            </a>
          </Button>
          <Button asChild variant="outline">
            <a href={`/events/${eventId}/setup/basics`}>Event settings</a>
          </Button>
        </>
      }
    >
      <GuidanceAlerts demo={demo} kind="permissions" />
      {demo === "loading" ? (
        <CardSkeleton />
      ) : (
        <Card>
          <CardContent className="space-y-4 p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="font-display text-3xl font-black uppercase">
                  {complete} of {rows.length || 6} ready
                </p>
                <p className="text-sm text-muted-foreground">
                  {dueSoon} due soon · {blocked} blocked ·{" "}
                  {rows.filter((item) => item.status === "not-started").length} not started
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <StatusBadge status="ok" label="Done" />
                <StatusBadge status="warning" label="Due soon" />
                <StatusBadge status="error" label="Blocked" />
                <StatusBadge status="info" label="Attachment uploaded" />
              </div>
            </div>
            <Progress value={percent} aria-label={`${percent}% permissions complete`} />
          </CardContent>
        </Card>
      )}
      <div className="grid gap-4 lg:grid-cols-3">
        <StatCard
          icon={<Icon label="⚑" />}
          label="Police / CCMC"
          value={`${rows.filter((item) => item.id.includes("police") || item.id.includes("ccmc")).length}/2`}
          helper="Traffic NOC + municipal permission"
          tone={blocked ? "danger" : "warning"}
        />
        <StatCard
          icon={<Icon label="🛡" />}
          label="Safety + medical"
          value={`${rows.filter((item) => item.id.includes("ambulance") || item.id.includes("fire")).length}/2`}
          helper="108, first aid, fire"
          tone="info"
        />
        <StatCard
          icon={<Icon label="§" />}
          label="Licenses + cover"
          value={`${rows.filter((item) => item.id.includes("music") || item.id.includes("insurance")).length}/2`}
          helper="IPRS/PPL and insurance"
          tone="ok"
        />
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-2xl uppercase">Checklist details</CardTitle>
          <CardDescription>
            Police/traffic NOC, CCMC permission, ambulance/108 + first-aid, fire/safety NOC,
            IPRS/PPL music license, and participant insurance.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-lg border bg-muted/30 p-3 text-sm">
              <p className="font-medium">Reminder copy</p>
              <p className="text-muted-foreground">
                We'll remind your team on WhatsApp 7 and 3 days before the due date.
              </p>
            </div>
            <div className="rounded-lg border bg-muted/30 p-3 text-sm">
              <p className="font-medium">Insurance link</p>
              <a
                className="text-brand-orange-strong underline-offset-4 hover:underline"
                href={`/events/${eventId}/setup/fees`}
              >
                Set up the insurance add-on →
              </a>
            </div>
          </div>
          {!canManage && (
            <p className="text-danger-text text-sm">
              <Icon label="🔒" />
              Read-only users can view the checklist but cannot update status or attachments.
            </p>
          )}
          {demo === "validation-error" && (
            <p className="text-danger-text text-sm" aria-live="polite">
              Mark Done requires an attachment confirmation or explicit audit reason.
            </p>
          )}
        </CardContent>
      </Card>
      {demo === "loading" ? (
        <TableSkeleton />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={<Icon label="☑" />}
          title="No checklist seeded"
          description="Seed the Coimbatore checklist to track statutory readiness for this event."
          action={
            <Button>
              <Icon label="☑" /> Seed Coimbatore checklist
            </Button>
          }
        />
      ) : (
        <DataTable
          data={rows}
          columns={columns}
          getRowId={(row) => row.id}
          className="overflow-x-auto"
        />
      )}
      <DemoUrls
        urls={[
          `/events/${displayEventId}/permissions?demo=default`,
          `/events/${displayEventId}/permissions?demo=success`,
          `/events/${displayEventId}/permissions?demo=validation-error`,
          `/events/${displayEventId}/permissions?demo=permission-denied&as=org-readonly`,
          `/events/${displayEventId}/permissions?demo=empty`,
        ]}
      />
    </PageShell>
  );
}
