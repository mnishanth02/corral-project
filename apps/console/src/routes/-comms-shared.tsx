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
import { DataTable, type DataTableColumn } from "@corral/ui/components/data-table";
import { EmptyState } from "@corral/ui/components/empty-state";
import { CardSkeleton, TableSkeleton } from "@corral/ui/components/skeletons";
import { StatusBadge, type StatusKind } from "@corral/ui/components/status-badge";
import type { ReactNode } from "react";

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
const BellRing = icon("🔔");
const CheckCircle2 = icon("✓");
const Clock3 = icon("◷");
const Mail = icon("✉");
const MessageCircle = icon("☘");
const PauseCircle = icon("Ⅱ");
const Radio = icon("◉");
const Send = icon("➤");
const Smartphone = icon("▯");

import {
  findMockEvent,
  formatDate,
  formatTime,
  mockCommsMessages,
  mockCommsTemplates,
  mockDeliveries,
  mockRosterParticipants,
} from "../mocks";
import type { CommsMessage, CommsTemplate, Delivery, RosterParticipant } from "../mocks/types";

export const commsDisplayEventId = "coimbatore-marathon-2026";
export type Channel = CommsTemplate["channel"];
export type TemplateLifecycle = "Draft" | "Pending approval" | "Approved" | "Rejected";
export type TemplateTrigger =
  | "Registration confirmation"
  | "Payment received"
  | "Payment pending"
  | "Race-day instructions"
  | "Results published"
  | "Certificate ready"
  | "Manual / broadcast";

export type TemplateDraft = CommsTemplate & {
  trigger: TemplateTrigger;
  lifecycle: TemplateLifecycle;
  version: number;
  locale: "en";
  lastEditedBy: string;
  category?: "Utility" | "Marketing";
  submittedAt?: string;
  approvedAt?: string;
  rejectedReason?: string;
};

export const templateTriggers: TemplateTrigger[] = [
  "Registration confirmation",
  "Payment received",
  "Payment pending",
  "Race-day instructions",
  "Results published",
  "Certificate ready",
  "Manual / broadcast",
];

export const templateVariables = [
  { label: "Name", token: "{{name}}" },
  { label: "BIB", token: "{{bib}}" },
  { label: "Event name", token: "{{event_name}}" },
  { label: "Event date", token: "{{event_date}}" },
  { label: "Category", token: "{{category}}" },
  { label: "Amount", token: "{{amount}}" },
  { label: "Venue", token: "{{venue}}" },
  { label: "Result link", token: "{{result_link}}" },
  { label: "Cert link", token: "{{certificate_link}}" },
] as const;

const lifecycleByTemplate: Record<string, Omit<TemplateDraft, keyof CommsTemplate>> = {
  "tpl-confirmation-whatsapp": {
    trigger: "Registration confirmation",
    lifecycle: "Approved",
    version: 3,
    locale: "en",
    lastEditedBy: "Priya Ramanathan",
    category: "Utility",
    submittedAt: "2026-01-12T18:10:00+05:30",
    approvedAt: "2026-01-13T10:05:00+05:30",
  },
  "tpl-kit-pickup-sms": {
    trigger: "Race-day instructions",
    lifecycle: "Draft",
    version: 1,
    locale: "en",
    lastEditedBy: "Arun Velusamy",
    category: "Utility",
  },
  "tpl-results-email": {
    trigger: "Results published",
    lifecycle: "Pending approval",
    version: 2,
    locale: "en",
    lastEditedBy: "Suresh Balasubramanian",
    submittedAt: "2026-01-15T10:00:00+05:30",
  },
};

const defaultLifecycle: Omit<TemplateDraft, keyof CommsTemplate> = {
  trigger: "Registration confirmation",
  lifecycle: "Draft",
  version: 1,
  locale: "en",
  lastEditedBy: "Priya Ramanathan",
  category: "Utility",
};

export const commsTemplates: TemplateDraft[] = [
  ...mockCommsTemplates.map((template): TemplateDraft => {
    const lifecycle = lifecycleByTemplate[template.id] ?? defaultLifecycle;
    return { ...template, ...lifecycle };
  }),
  {
    id: "tpl-payment-pending-wa",
    eventId: commsDisplayEventId,
    name: "Payment pending nudge",
    channel: "WhatsApp",
    trigger: "Payment pending",
    lifecycle: "Rejected",
    version: 1,
    locale: "en",
    category: "Utility",
    subject: undefined,
    body: "Hi {{name}}, your {{event_name}} payment of {{amount}} is still pending. Complete it today to lock your BIB. — Team Corral",
    variables: ["name", "event_name", "amount"],
    updatedAt: "2026-01-16T16:20:00+05:30",
    lastEditedBy: "Priya Ramanathan",
    submittedAt: "2026-01-16T16:35:00+05:30",
    rejectedReason:
      "Avoid urgency wording that implies guaranteed allocation before payment confirmation.",
  },
  {
    id: "tpl-certificate-ready-wa",
    eventId: commsDisplayEventId,
    name: "Certificate ready",
    channel: "WhatsApp",
    trigger: "Certificate ready",
    lifecycle: "Draft",
    version: 1,
    locale: "en",
    category: "Utility",
    body: "Great run, {{name}}! Your {{event_name}} certificate is ready: {{certificate_link}}",
    variables: ["name", "event_name", "certificate_link"],
    updatedAt: "2026-01-18T09:20:00+05:30",
    lastEditedBy: "Meera Iyer",
  },
];

export const sampleRunner = {
  name: "Karthik Narayanan",
  bib: "1042",
  event_name: "Coimbatore Marathon 2026",
  event_date: "12 Jul 2026",
  category: "10K",
  amount: "₹1,499",
  venue: "CODISSIA Trade Fair Complex",
  result_link: "corral.local/my/results/1042",
  certificate_link: "corral.local/my/certificates/1042",
  distance: "10K",
  bibNumber: "1042",
};

export function getEventName(eventId: string) {
  return findMockEvent(eventId)?.name ?? "Coimbatore Marathon 2026";
}

export function resolveTemplatePreview(body: string) {
  return body
    .replaceAll("{{name}}", sampleRunner.name)
    .replaceAll("{{bib}}", sampleRunner.bib)
    .replaceAll("{{bibNumber}}", sampleRunner.bibNumber)
    .replaceAll("{{distance}}", sampleRunner.distance)
    .replaceAll("{{event_name}}", sampleRunner.event_name)
    .replaceAll("{{event_date}}", sampleRunner.event_date)
    .replaceAll("{{category}}", sampleRunner.category)
    .replaceAll("{{amount}}", sampleRunner.amount)
    .replaceAll("{{venue}}", sampleRunner.venue)
    .replaceAll("{{result_link}}", sampleRunner.result_link)
    .replaceAll("{{certificate_link}}", sampleRunner.certificate_link);
}

export function unknownTokens(body: string) {
  const known = new Set<string>(templateVariables.map((item) => item.token));
  return Array.from(body.matchAll(/{{[^}]+}}/g))
    .map((match) => match[0])
    .filter((token) => !known.has(token) && token !== "{{distance}}" && token !== "{{bibNumber}}");
}

export function ChannelMark({ channel }: { channel: Channel }) {
  const Icon = channel === "WhatsApp" ? MessageCircle : channel === "SMS" ? Smartphone : Mail;
  const className =
    channel === "WhatsApp"
      ? "border-[#25d366]/40 bg-[#25d366]/10 text-emerald-700"
      : channel === "SMS"
        ? "border-info/30 bg-info/10 text-info-text"
        : "border-muted bg-muted text-muted-foreground";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium ${className}`}
    >
      <Icon className="size-3.5" aria-hidden="true" />
      <span>{channel}</span>
    </span>
  );
}

export function lifecycleBadge(lifecycle: TemplateLifecycle) {
  const map: Record<TemplateLifecycle, { status: StatusKind; label: string }> = {
    Draft: { status: "neutral", label: "Draft" },
    "Pending approval": { status: "pending", label: "Pending approval" },
    Approved: { status: "ok", label: "Approved" },
    Rejected: { status: "error", label: "Rejected" },
  };
  return <StatusBadge {...map[lifecycle]} />;
}

export function deliveryBadge(status: Delivery["status"]) {
  const map: Record<Delivery["status"], { status: StatusKind; label: string }> = {
    queued: { status: "pending", label: "Queued" },
    sent: { status: "info", label: "Sent" },
    delivered: { status: "ok", label: "Delivered" },
    read: { status: "ok", label: "Read" },
    failed: { status: "error", label: "Failed" },
    "webhook-pending": { status: "pending", label: "Webhook pending" },
  };
  return <StatusBadge {...map[status]} />;
}

export function messageBadge(status: CommsMessage["status"]) {
  const map: Record<CommsMessage["status"], { status: StatusKind; label: string }> = {
    draft: { status: "neutral", label: "Draft" },
    scheduled: { status: "pending", label: "Scheduled" },
    sending: { status: "info", label: "Sending" },
    sent: { status: "ok", label: "Sent" },
    failed: { status: "error", label: "Failed" },
  };
  return <StatusBadge {...map[status]} />;
}

export function CommPageShell({
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
      className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-6 xl:px-8"
      aria-labelledby="page-title"
    >
      <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        <div className="relative isolate grid gap-6 p-6 md:grid-cols-[1fr_auto] md:items-end">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,rgba(37,211,102,0.18),transparent_34%),linear-gradient(135deg,rgba(255,241,234,0.9),rgba(255,255,255,0.6))]" />
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#25d366]/30 bg-[#25d366]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
              <Radio className="size-3.5" aria-hidden="true" />
              {eyebrow}
            </div>
            <div>
              <h1
                id="page-title"
                className="font-display text-4xl font-black uppercase tracking-tight text-foreground"
              >
                {title}
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                {description}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">{actions}</div>
        </div>
        <div className="border-t bg-muted/30 px-6 py-3 text-xs text-muted-foreground">
          Active event: <span className="font-medium text-foreground">{getEventName(eventId)}</span>{" "}
          · WhatsApp-first, SMS/email fallback · frontend mock mode only
        </div>
      </div>
      {children}
    </main>
  );
}

export function DemoUrls({ urls }: { urls: string[] }) {
  return (
    <Card className="border-dashed">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Demo URLs</CardTitle>
        <CardDescription>Use these to verify deterministic states.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        {urls.map((url) => (
          <code key={url} className="rounded-md bg-muted px-2.5 py-1 text-xs text-muted-foreground">
            {url}
          </code>
        ))}
      </CardContent>
    </Card>
  );
}

export function LoadingCards() {
  return (
    <div
      className="grid gap-4 lg:grid-cols-3"
      role="status"
      aria-label="Loading communications cards"
    >
      <CardSkeleton />
      <CardSkeleton />
      <CardSkeleton />
    </div>
  );
}

export function StatCard({
  icon,
  label,
  value,
  helper,
  status = "info",
}: {
  icon: ReactNode;
  label: string;
  value: string;
  helper: string;
  status?: StatusKind;
}) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-4 p-5">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-2 font-display text-3xl font-black uppercase tracking-tight">{value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{helper}</p>
        </div>
        <div className="rounded-full bg-muted p-3 text-muted-foreground" aria-hidden="true">
          {icon}
        </div>
      </CardContent>
      <div className="px-5 pb-5">
        <StatusBadge status={status} label={helper} />
      </div>
    </Card>
  );
}

export function getFallbackTemplate() {
  const template = commsTemplates[0];
  if (!template) {
    throw new Error("No communication templates configured.");
  }
  return template;
}

export function audienceForEvent(eventId: string): RosterParticipant[] {
  return mockRosterParticipants.filter((participant) => participant.eventId === eventId);
}

export function buildRecentSends(eventId: string) {
  return (mockCommsMessages as readonly CommsMessage[])
    .filter((message) => message.eventId === eventId)
    .map((message) => {
      const deliveries = (mockDeliveries as readonly Delivery[]).filter(
        (delivery) => delivery.messageId === message.id,
      );
      const template = commsTemplates.find((item) => item.id === message.templateId);
      return {
        ...message,
        templateName: template?.name ?? "Template",
        delivered: deliveries.filter(
          (item) => item.status === "delivered" || item.status === "read",
        ).length,
        read: deliveries.filter((item) => item.status === "read").length,
        failed: deliveries.filter((item) => item.status === "failed").length,
        pending: deliveries.filter(
          (item) => item.status === "webhook-pending" || item.status === "queued",
        ).length,
      };
    });
}

export type RecentSendRow = ReturnType<typeof buildRecentSends>[number];

export function RecentSendsTable({
  rows,
  loading = false,
}: {
  rows: RecentSendRow[];
  loading?: boolean;
}) {
  const columns: DataTableColumn<RecentSendRow>[] = [
    {
      id: "template",
      header: "Message",
      cell: (row) => (
        <div>
          <div className="font-medium">{row.templateName}</div>
          <div className="text-xs text-muted-foreground">{row.audience}</div>
        </div>
      ),
    },
    { id: "channel", header: "Channel", cell: (row) => <ChannelMark channel={row.channel} /> },
    { id: "status", header: "Status", cell: (row) => messageBadge(row.status) },
    {
      id: "delivery",
      header: "Delivery",
      cell: (row) => (
        <span className="text-sm">
          <strong>{row.delivered}</strong> delivered · <strong>{row.read}</strong> read ·{" "}
          <strong>{row.failed}</strong> failed
        </span>
      ),
    },
    {
      id: "time",
      header: "When",
      cell: (row) => (
        <span>
          {row.sentAt
            ? `${formatDate(row.sentAt)} ${formatTime(row.sentAt)}`
            : row.scheduledFor
              ? `Scheduled ${formatDate(row.scheduledFor)}`
              : "Draft"}
        </span>
      ),
    },
    {
      id: "action",
      header: "Action",
      cell: () => (
        <Button asChild size="sm" variant="outline">
          <a href={`/events/${commsDisplayEventId}/comms/delivery`}>Open delivery</a>
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
          title="No sends yet"
          description="Start with a WhatsApp confirmation or kit pickup reminder."
        />
      }
    />
  );
}

export function EmptyComms({ eventId }: { eventId: string }) {
  return (
    <EmptyState
      icon={<BellRing />}
      title="No communication activity yet"
      description="Create approved WhatsApp templates, then send registration confirmations and kit reminders to CODISSIA runners."
      action={
        <Button asChild variant="whatsapp">
          <a href={`/events/${eventId}/comms/send`}>
            <MessageCircle className="size-4" aria-hidden="true" />
            New WhatsApp message
          </a>
        </Button>
      }
    />
  );
}

export function OperationalAlert({
  tone,
  title,
  description,
}: {
  tone: "warning" | "error" | "info" | "success";
  title: string;
  description: string;
}) {
  const Icon =
    tone === "success"
      ? CheckCircle2
      : tone === "info"
        ? Clock3
        : tone === "error"
          ? AlertTriangle
          : PauseCircle;
  const className =
    tone === "success"
      ? "border-success/40 bg-success/5 text-success-text"
      : tone === "info"
        ? "border-info/40 bg-info/5 text-info-text"
        : tone === "error"
          ? "border-danger/40 bg-danger/5 text-danger-text"
          : "border-warning/40 bg-warning/5 text-warning-text";
  return (
    <Alert className={className}>
      <Icon aria-hidden="true" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{description}</AlertDescription>
    </Alert>
  );
}

export function tableLoadingOrEmpty(loading: boolean, rows: unknown[], label: string) {
  if (loading) return <TableSkeleton role="status" aria-label={`Loading ${label}`} />;
  if (rows.length === 0) return <EmptyComms eventId={commsDisplayEventId} />;
  return null;
}

export function audienceCounts(eventId: string) {
  const rows = audienceForEvent(eventId);
  const paid = rows.filter(
    (row) => row.paymentStatus === "Paid & Confirmed" || row.paymentStatus === "Confirmation Sent",
  ).length;
  const bibPending = rows.filter((row) => !row.bibNumber).length;
  return { all: rows.length, paid, bibPending, whatsappConsentMissing: 12, fallbackReady: 44 };
}

export function TemplateCard({ template, eventId }: { template: TemplateDraft; eventId: string }) {
  return (
    <Card className="group overflow-hidden transition hover:-translate-y-0.5 hover:shadow-md motion-reduce:hover:translate-y-0">
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">{template.name}</CardTitle>
            <CardDescription>
              {template.trigger} · v{template.version}
            </CardDescription>
          </div>
          {lifecycleBadge(template.lifecycle)}
        </div>
        <ChannelMark channel={template.channel} />
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="line-clamp-3 min-h-14 text-sm text-muted-foreground">
          {resolveTemplatePreview(template.body)}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {template.variables.slice(0, 4).map((variable) => (
            <Badge key={variable} variant="secondary">{`{{${variable}}}`}</Badge>
          ))}
        </div>
        <div className="flex items-center justify-between border-t pt-3 text-xs text-muted-foreground">
          <span>Updated {formatDate(template.updatedAt)}</span>
          <Button asChild size="sm" variant="outline">
            <a href={`/events/${eventId}/comms/templates?demo=editor`}>Edit</a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function ChannelGuidance() {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      <div className="rounded-xl border border-[#25d366]/30 bg-[#25d366]/10 p-4">
        <ChannelMark channel="WhatsApp" />
        <p className="mt-3 text-sm text-emerald-800">
          Primary channel for confirmations, race-day instructions, and results nudges. Requires
          approved template and consent.
        </p>
      </div>
      <div className="rounded-xl border bg-card p-4">
        <ChannelMark channel="SMS" />
        <p className="mt-3 text-sm text-muted-foreground">
          Fallback when WhatsApp consent is missing or delivery fails. Segment count is shown before
          send.
        </p>
      </div>
      <div className="rounded-xl border bg-card p-4">
        <ChannelMark channel="Email" />
        <p className="mt-3 text-sm text-muted-foreground">
          Best for result links, certificates, and longer organizer notes.
        </p>
      </div>
    </div>
  );
}

export function NoNetworkNote() {
  return (
    <OperationalAlert
      tone="info"
      title="Frontend-only mock"
      description="No provider calls, no network requests, and no secrets are used. Delivery and approval states are deterministic demo fixtures."
    />
  );
}

export function buildDeliveryRows(eventId: string, mode?: "partial-delivery" | "failures-present") {
  const base = (mockDeliveries as readonly Delivery[]).filter(
    (delivery) => delivery.eventId === eventId,
  );
  const extras: Delivery[] = [
    {
      id: "delivery-sms-2001",
      messageId: "msg-kit-reminder",
      eventId,
      recipientName: "Mohammed Faisal",
      recipientPhone: "+91 93612 44011",
      channel: "SMS",
      status: mode === "failures-present" ? "failed" : "sent",
      lastUpdatedAt: "2026-02-10T20:08:00+05:30",
      errorMessage:
        mode === "failures-present" ? "Carrier rejected; fallback call queued" : undefined,
    },
    {
      id: "delivery-email-2002",
      messageId: "msg-kit-reminder",
      eventId,
      recipientName: "Sanjana R",
      recipientPhone: "+91 98430 88222",
      channel: "Email",
      status: mode === "partial-delivery" ? "queued" : "delivered",
      lastUpdatedAt: "2026-02-10T20:09:00+05:30",
    },
  ];
  return [...base, ...extras];
}

export function deliverySummary(rows: Delivery[]) {
  return {
    total: rows.length,
    delivered: rows.filter((row) => row.status === "delivered" || row.status === "read").length,
    read: rows.filter((row) => row.status === "read").length,
    failed: rows.filter((row) => row.status === "failed").length,
    pending: rows.filter((row) => row.status === "queued" || row.status === "webhook-pending")
      .length,
  };
}

export const communicationLifecycle = [
  "Draft",
  "Submit",
  "Meta approval",
  "Ready to send",
] as const;
