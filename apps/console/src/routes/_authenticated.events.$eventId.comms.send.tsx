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
import { Field, FieldDescription, FieldLabel } from "@corral/ui/components/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@corral/ui/components/select";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";

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
const CalendarClock = icon("◷");
const CheckCircle2 = icon("✓");
const MessageCircle = icon("☘");
const Send = icon("➤");
const ShieldAlert = icon("⚑");
const Smartphone = icon("▯");
const UsersRound = icon("👥");

import { useConsoleShell } from "../components/console-shell-context";
import { hasCapability } from "../mocks";
import {
  audienceCounts,
  audienceForEvent,
  type Channel,
  ChannelMark,
  CommPageShell,
  commsDisplayEventId,
  commsTemplates,
  DemoUrls,
  getFallbackTemplate,
  NoNetworkNote,
  OperationalAlert,
  resolveTemplatePreview,
} from "./-comms-shared";

type SendDemo =
  | "default"
  | "template-not-approved"
  | "missing-consent"
  | "partial-delivery"
  | "fallback-triggered"
  | "send-paused"
  | "loading";
const sendDemos = [
  "default",
  "template-not-approved",
  "missing-consent",
  "partial-delivery",
  "fallback-triggered",
  "send-paused",
  "loading",
] as const;
function parseSendDemo(value: unknown): SendDemo {
  return typeof value === "string" && sendDemos.includes(value as SendDemo)
    ? (value as SendDemo)
    : "default";
}

export const Route = createFileRoute("/_authenticated/events/$eventId/comms/send")({
  validateSearch: (search): { demo: SendDemo } => ({ demo: parseSendDemo(search.demo) }),
  staticData: { breadcrumb: "Send Message" },
  component: SendBroadcastRoute,
});

const audienceOptions = [
  { id: "all", label: "All registered runners", helper: "Every active registration" },
  { id: "category", label: "Category · 10K", helper: "10K runners only" },
  {
    id: "payment",
    label: "Payment status · Awaiting webhook",
    helper: "Payment confirmation delayed",
  },
  { id: "bib", label: "BIB pending", helper: "No BIB assigned yet" },
] as const;

function SendBroadcastRoute() {
  const { eventId } = Route.useParams() as { eventId: string };
  const { demo } = Route.useSearch() as { demo: SendDemo };
  const { persona } = useConsoleShell();
  const [audience, setAudience] = useState<(typeof audienceOptions)[number]["id"]>("all");
  const [channel, setChannel] = useState<Channel>("WhatsApp");
  const templates = commsTemplates.filter(
    (template) => template.eventId === eventId && template.channel === channel,
  );
  const fallbackTemplate = getFallbackTemplate();
  const preferredTemplate =
    templates.find((template) => template.lifecycle === "Approved") ??
    templates[0] ??
    fallbackTemplate;
  const [templateId, setTemplateId] = useState(preferredTemplate.id);
  const selectedTemplate =
    templates.find((template) => template.id === templateId) ?? preferredTemplate;
  const counts = audienceCounts(eventId);
  const roster = audienceForEvent(eventId);
  const recipientCount =
    audience === "category"
      ? roster.filter((row) => row.distance === "10K").length
      : audience === "payment"
        ? roster.filter((row) => row.paymentStatus === "Paid — Awaiting Webhook").length
        : audience === "bib"
          ? counts.bibPending
          : counts.all;
  const canSend =
    hasCapability(persona, "comms:send") &&
    demo !== "send-paused" &&
    demo !== "template-not-approved" &&
    demo !== "missing-consent";
  const preview = useMemo(
    () => resolveTemplatePreview(selectedTemplate.body),
    [selectedTemplate.body],
  );

  return (
    <CommPageShell
      eventId={eventId}
      eyebrow="O-21 · Broadcast composer"
      title="Send message"
      description="Build a precise audience, keep WhatsApp as primary, preview variables, then send now or schedule without touching any backend."
      actions={
        <Button asChild variant="outline">
          <a href={`/events/${eventId}/comms`}>Back to dashboard</a>
        </Button>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_25rem]">
        <section className="space-y-6" aria-label="Message setup">
          <NoNetworkNote />
          {demo === "template-not-approved" ? (
            <OperationalAlert
              tone="warning"
              title="Template not approved"
              description="Registration confirmation vNext is pending Meta approval. Choose an approved WhatsApp template or use SMS/email fallback."
            />
          ) : null}
          {demo === "missing-consent" ? (
            <OperationalAlert
              tone="warning"
              title="12 runners missing WhatsApp consent"
              description="Send is blocked for the WhatsApp audience. Use the fallback channel or filter to consented recipients."
            />
          ) : null}
          {demo === "partial-delivery" ? (
            <OperationalAlert
              tone="error"
              title="Partial delivery from last send"
              description="18 recipients did not receive the prior reminder. Review delivery before sending another broad update."
            />
          ) : null}
          {demo === "fallback-triggered" ? (
            <OperationalAlert
              tone="info"
              title="Fallback triggered"
              description="WhatsApp failures will automatically queue SMS for 44 runners with valid mobile consent."
            />
          ) : null}
          {demo === "send-paused" ? (
            <OperationalAlert
              tone="warning"
              title="Send paused by organizer"
              description="Race control paused bulk sends during BIB correction. Resume after the audit note is cleared."
            />
          ) : null}
          {!hasCapability(persona, "comms:send") ? (
            <OperationalAlert
              tone="error"
              title="Read-only communications"
              description="Your current persona can preview messages but cannot send or schedule broadcasts."
            />
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle>1. Audience builder</CardTitle>
              <CardDescription>
                All · category · payment-status · BIB-pending cohorts are deterministic fixtures.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              {audienceOptions.map((option) => {
                const active = audience === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setAudience(option.id)}
                    className={`rounded-xl border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${active ? "border-primary bg-primary/5" : "bg-card hover:bg-muted/60"}`}
                  >
                    <span className="flex items-center justify-between gap-3">
                      <span className="font-medium">{option.label}</span>
                      {active ? (
                        <CheckCircle2 className="size-4 text-success-text" aria-hidden="true" />
                      ) : null}
                    </span>
                    <span className="mt-1 block text-sm text-muted-foreground">
                      {option.helper}
                    </span>
                  </button>
                );
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>2. Channel and template</CardTitle>
              <CardDescription>
                WhatsApp is the primary path. SMS and email are explicit fallbacks.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <fieldset className="grid gap-3 md:grid-cols-3">
                <legend className="sr-only">Delivery channel</legend>
                {(["WhatsApp", "SMS", "Email"] as Channel[]).map((item) => (
                  <button
                    key={item}
                    type="button"
                    aria-pressed={channel === item}
                    onClick={() => setChannel(item)}
                    className={`rounded-xl border p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${channel === item ? "border-[#25d366] bg-[#25d366]/10" : "bg-card hover:bg-muted/60"}`}
                  >
                    <ChannelMark channel={item} />
                    <p className="mt-3 text-sm text-muted-foreground">
                      {item === "WhatsApp"
                        ? "Primary · approved template required"
                        : item === "SMS"
                          ? "Fallback · 160 char segments"
                          : "Fallback · long-form links"}
                    </p>
                  </button>
                ))}
              </fieldset>
              <Field>
                <FieldLabel htmlFor="template">Template</FieldLabel>
                <Select value={selectedTemplate.id} onValueChange={setTemplateId}>
                  <SelectTrigger id="template" className="w-full">
                    <SelectValue placeholder="Select template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name} · {template.lifecycle}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldDescription>
                  Approved WhatsApp templates can send immediately; pending/rejected versions are
                  blocked.
                </FieldDescription>
              </Field>
            </CardContent>
          </Card>
        </section>

        <aside className="space-y-6" aria-label="Preview and send controls">
          <Card className="overflow-hidden">
            <CardHeader className="bg-[#25d366]/10">
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="size-5 text-emerald-700" aria-hidden="true" /> WhatsApp
                preview
              </CardTitle>
              <CardDescription>
                {recipientCount} recipients · {counts.whatsappConsentMissing} missing WhatsApp
                consent
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-5">
              <div
                className="rounded-[2rem] border bg-slate-950 p-3 shadow-inner"
                role="img"
                aria-label={`Resolved message preview: ${preview}`}
              >
                <div className="rounded-[1.5rem] bg-[#e7ffe9] p-4">
                  <div className="rounded-2xl bg-white p-4 text-sm leading-6 shadow-sm">
                    {preview}
                  </div>
                  <div className="mt-3 text-right text-[11px] text-emerald-900">
                    Today 18:30 · Corral
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <Badge variant="secondary" className="justify-center">
                  <UsersRound className="size-3.5" aria-hidden="true" /> {recipientCount} selected
                </Badge>
                <Badge variant="secondary" className="justify-center">
                  <Smartphone className="size-3.5" aria-hidden="true" /> {counts.fallbackReady}{" "}
                  fallback-ready
                </Badge>
              </div>
              <Alert className="border-info/40 bg-info/5">
                <ShieldAlert aria-hidden="true" />
                <AlertTitle>Consent and DPDP guard</AlertTitle>
                <AlertDescription>
                  Communication consent is enforced before send. Missing-consent rows use fallback
                  or remain skipped in this frontend demo.
                </AlertDescription>
              </Alert>
              <div className="flex flex-col gap-2 border-t pt-4">
                <Button variant="whatsapp" disabled={!canSend}>
                  <Send className="size-4" aria-hidden="true" /> Send WhatsApp now
                </Button>
                <Button variant="outline" disabled={!canSend}>
                  <CalendarClock className="size-4" aria-hidden="true" /> Schedule for 6:30 PM
                </Button>
                {!canSend ? (
                  <p className="text-xs text-warning-text">
                    <AlertTriangle className="mr-1 inline size-3.5" aria-hidden="true" /> Send
                    disabled until approval, consent, and pause states are clear.
                  </p>
                ) : null}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Variable preview</CardTitle>
              <CardDescription>
                Sample Coimbatore runner used for deterministic substitution.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {selectedTemplate.variables.map((variable) => (
                <Badge key={variable} variant="secondary">{`{{${variable}}}`}</Badge>
              ))}
            </CardContent>
          </Card>
        </aside>
      </div>
      <DemoUrls
        urls={[
          `/events/${commsDisplayEventId}/comms/send?demo=default`,
          `/events/${commsDisplayEventId}/comms/send?demo=template-not-approved`,
          `/events/${commsDisplayEventId}/comms/send?demo=missing-consent`,
          `/events/${commsDisplayEventId}/comms/send?demo=partial-delivery`,
          `/events/${commsDisplayEventId}/comms/send?demo=fallback-triggered`,
          `/events/${commsDisplayEventId}/comms/send?demo=send-paused`,
        ]}
      />
    </CommPageShell>
  );
}
