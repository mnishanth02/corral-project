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
import { EmptyState } from "@corral/ui/components/empty-state";
import { Field, FieldDescription, FieldError, FieldLabel } from "@corral/ui/components/field";
import { Input } from "@corral/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@corral/ui/components/select";
import { Tabs, TabsList, TabsTrigger } from "@corral/ui/components/tabs";
import { Textarea } from "@corral/ui/components/textarea";
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
const CheckCircle2 = icon("✓");
const Edit3 = icon("✎");
const MessageCircle = icon("☘");
const Plus = icon("+");
const Send = icon("➤");
const Sparkles = icon("✦");

import { useConsoleShell } from "../components/console-shell-context";
import { hasCapability } from "../mocks";
import {
  type Channel,
  ChannelMark,
  CommPageShell,
  commsDisplayEventId,
  commsTemplates,
  DemoUrls,
  getFallbackTemplate,
  lifecycleBadge,
  NoNetworkNote,
  resolveTemplatePreview,
  TemplateCard,
  type TemplateTrigger,
  templateTriggers,
  templateVariables,
  unknownTokens,
} from "./-comms-shared";

type TemplatesDemo =
  | "default"
  | "list"
  | "empty"
  | "editor"
  | "validation-error"
  | "webhook-pending"
  | "success"
  | "permission-denied"
  | "error"
  | "offline"
  | "loading";
const templateDemos = [
  "default",
  "list",
  "empty",
  "editor",
  "validation-error",
  "webhook-pending",
  "success",
  "permission-denied",
  "error",
  "offline",
  "loading",
] as const;
function parseTemplatesDemo(value: unknown): TemplatesDemo {
  return typeof value === "string" && templateDemos.includes(value as TemplatesDemo)
    ? (value as TemplatesDemo)
    : "default";
}

export const Route = createFileRoute("/_authenticated/events/$eventId/comms/templates")({
  validateSearch: (search): { demo: TemplatesDemo } => ({ demo: parseTemplatesDemo(search.demo) }),
  staticData: { breadcrumb: "Templates" },
  component: TemplatesRoute,
});

function TemplatesRoute() {
  const { eventId } = Route.useParams() as { eventId: string };
  const { demo } = Route.useSearch() as { demo: TemplatesDemo };
  const { persona } = useConsoleShell();
  const listMode = demo === "default" || demo === "list" || demo === "empty";
  const rows =
    demo === "empty" ? [] : commsTemplates.filter((template) => template.eventId === eventId);

  return (
    <CommPageShell
      eventId={eventId}
      eyebrow="O-22 · Trigger templates"
      title="Templates"
      description="Create approved WhatsApp templates and SMS/email fallbacks for CODISSIA Run 2025. English-only, no provider calls."
      actions={
        <>
          <Button asChild variant="outline">
            <a href={`/events/${eventId}/comms`}>Back to comms</a>
          </Button>
          <Button asChild variant="whatsapp">
            <a href={`/events/${eventId}/comms/send`}>
              <Send className="size-4" aria-hidden="true" />
              Send message
            </a>
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        {demo === "offline" ? <NoNetworkNote /> : null}
        {demo === "success" ? (
          <Alert className="border-success/40 bg-success/5 text-success-text">
            <CheckCircle2 aria-hidden="true" />
            <AlertTitle>Draft saved locally</AlertTitle>
            <AlertDescription>
              This demo saved the template without any provider request.
            </AlertDescription>
          </Alert>
        ) : null}
        {demo === "permission-denied" || !hasCapability(persona, "comms:send") ? (
          <Alert className="border-danger/40 bg-danger/5 text-danger-text">
            <AlertTriangle aria-hidden="true" />
            <AlertTitle>Read-only template controls</AlertTitle>
            <AlertDescription>
              Your current persona can inspect templates but cannot save or submit for approval.
            </AlertDescription>
          </Alert>
        ) : null}
        {demo === "error" ? (
          <Alert className="border-danger/40 bg-danger/5 text-danger-text">
            <AlertTriangle aria-hidden="true" />
            <AlertTitle>Meta rejected this template</AlertTitle>
            <AlertDescription>
              Reason: Avoid urgency wording that implies guaranteed allocation before payment
              confirmation. Fix and resubmit.
            </AlertDescription>
          </Alert>
        ) : null}

        {listMode ? (
          <section className="space-y-4" aria-labelledby="templates-list-title">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2
                  id="templates-list-title"
                  className="font-display text-2xl font-black uppercase tracking-tight"
                >
                  Reusable template library
                </h2>
                <p className="text-sm text-muted-foreground">
                  Draft, pending approval, approved, and rejected lifecycle states are shown with
                  icon + label.
                </p>
              </div>
              <Button asChild>
                <a href={`/events/${eventId}/comms/templates?demo=editor`}>
                  <Plus className="size-4" aria-hidden="true" />
                  Create template
                </a>
              </Button>
            </div>
            {rows.length === 0 ? (
              <EmptyState
                icon={<Sparkles />}
                title="No templates yet"
                description="Start with a registration confirmation WhatsApp template and add SMS/email fallbacks."
                action={
                  <Button asChild variant="whatsapp">
                    <a href={`/events/${eventId}/comms/templates?demo=editor`}>
                      <MessageCircle className="size-4" aria-hidden="true" />
                      Create WhatsApp template
                    </a>
                  </Button>
                }
              />
            ) : (
              <div className="grid gap-4 lg:grid-cols-3">
                {rows.map((template) => (
                  <TemplateCard key={template.id} template={template} eventId={eventId} />
                ))}
              </div>
            )}
          </section>
        ) : (
          <TemplateEditor
            demo={demo}
            readOnly={demo === "permission-denied" || !hasCapability(persona, "comms:send")}
          />
        )}

        <DemoUrls
          urls={[
            `/events/${commsDisplayEventId}/comms/templates?demo=list`,
            `/events/${commsDisplayEventId}/comms/templates?demo=empty`,
            `/events/${commsDisplayEventId}/comms/templates?demo=editor`,
            `/events/${commsDisplayEventId}/comms/templates?demo=validation-error`,
            `/events/${commsDisplayEventId}/comms/templates?demo=webhook-pending`,
          ]}
        />
      </div>
    </CommPageShell>
  );
}

function TemplateEditor({ demo, readOnly }: { demo: TemplatesDemo; readOnly: boolean }) {
  const fallbackTemplate = getFallbackTemplate();
  const base =
    demo === "webhook-pending"
      ? (commsTemplates.find((template) => template.lifecycle === "Pending approval") ??
        fallbackTemplate)
      : demo === "error"
        ? (commsTemplates.find((template) => template.lifecycle === "Rejected") ?? fallbackTemplate)
        : fallbackTemplate;
  const [name, setName] = useState(base.name);
  const [trigger, setTrigger] = useState<TemplateTrigger>(base.trigger);
  const [channel, setChannel] = useState<Channel>(base.channel);
  const [subject, setSubject] = useState(base.subject ?? "Your Coimbatore Marathon update");
  const [body, setBody] = useState(
    demo === "validation-error"
      ? "Hi {{naem}}, your {{event_name}} BIB is {{bib}}."
      : base.body.replaceAll("{{distance}}", "{{category}}").replaceAll("{{bibNumber}}", "{{bib}}"),
  );
  const preview = useMemo(() => resolveTemplatePreview(body), [body]);
  const unknown = unknownTokens(body);
  const locked = readOnly || demo === "webhook-pending";
  const smsSegments = Math.max(1, Math.ceil(body.length / 160));

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_25rem]">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Edit3 className="size-5" aria-hidden="true" />
            Template editor
          </CardTitle>
          <CardDescription>
            Editing an approved WhatsApp template creates a new draft version for re-approval.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {demo === "webhook-pending" ? (
            <Alert className="border-warning/40 bg-warning/5 text-warning-text">
              <AlertTriangle aria-hidden="true" />
              <AlertTitle>Pending Meta approval</AlertTitle>
              <AlertDescription>
                Body is read-only until approval is resolved. No provider call is made in this demo.
              </AlertDescription>
            </Alert>
          ) : null}
          {unknown.length > 0 ? (
            <Alert className="border-danger/40 bg-danger/5 text-danger-text">
              <AlertTriangle aria-hidden="true" />
              <AlertTitle>Unknown token</AlertTitle>
              <AlertDescription>{unknown.join(", ")} is not a known variable.</AlertDescription>
            </Alert>
          ) : null}

          <Field>
            <FieldLabel htmlFor="template-name">Template name</FieldLabel>
            <Input
              id="template-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              disabled={locked}
              name="templateName"
            />
          </Field>
          <div className="grid gap-4 md:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="trigger">Trigger</FieldLabel>
              <Select
                value={trigger}
                onValueChange={(value) => setTrigger(value as TemplateTrigger)}
                disabled={locked}
              >
                <SelectTrigger id="trigger" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {templateTriggers.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel>Channel</FieldLabel>
              <Tabs value={channel} onValueChange={(value) => setChannel(value as Channel)}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="WhatsApp">WhatsApp</TabsTrigger>
                  <TabsTrigger value="SMS">SMS</TabsTrigger>
                  <TabsTrigger value="Email">Email</TabsTrigger>
                </TabsList>
              </Tabs>
            </Field>
          </div>
          {channel === "Email" ? (
            <Field>
              <FieldLabel htmlFor="subject">Email subject</FieldLabel>
              <Input
                id="subject"
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                disabled={locked}
                name="subject"
              />
            </Field>
          ) : null}
          <Field>
            <FieldLabel htmlFor="body">Message body</FieldLabel>
            <Textarea
              id="body"
              value={body}
              onChange={(event) => setBody(event.target.value)}
              disabled={locked}
              rows={8}
              aria-invalid={unknown.length > 0}
              aria-describedby="body-help body-error"
            />
            <FieldDescription id="body-help">
              WhatsApp templates need Meta approval before they can be sent. English-only for now.{" "}
              {channel === "SMS"
                ? `1 segment = 160 chars. This message uses ${smsSegments} segment${smsSegments > 1 ? "s" : ""}.`
                : null}
            </FieldDescription>
            <FieldError id="body-error">
              {unknown.length > 0 ? `Unknown token: ${unknown.join(", ")}` : null}
            </FieldError>
          </Field>
          <div className="space-y-2">
            <p className="text-sm font-medium">Variable palette</p>
            <div className="flex flex-wrap gap-2">
              {templateVariables.map((item) => (
                <Button
                  key={item.token}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setBody((current) => `${current} ${item.token}`)}
                  disabled={locked}
                  aria-label={`Insert ${item.label} token`}
                >
                  {item.label}
                </Button>
              ))}
            </div>
          </div>
          <div className="sticky bottom-0 -mx-6 -mb-6 flex flex-wrap justify-end gap-2 border-t bg-card/95 p-4 backdrop-blur">
            <Button variant="outline" disabled={readOnly}>
              Save draft
            </Button>
            <Button
              variant="whatsapp"
              disabled={readOnly || unknown.length > 0 || demo === "webhook-pending"}
            >
              Submit for approval
            </Button>
            <Button variant="outline" disabled={readOnly}>
              Edit as new version
            </Button>
          </div>
        </CardContent>
      </Card>

      <aside className="space-y-6" aria-label="Template preview">
        <Card className="overflow-hidden">
          <CardHeader className="bg-[#25d366]/10">
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle>Live preview</CardTitle>
                <CardDescription>
                  {channel} · {trigger}
                </CardDescription>
              </div>
              <ChannelMark channel={channel} />
            </div>
          </CardHeader>
          <CardContent className="space-y-4 p-5">
            <div
              className="rounded-[2rem] border bg-slate-950 p-3"
              role="img"
              aria-label={`Resolved preview: ${preview}`}
            >
              <div className="rounded-[1.5rem] bg-[#e7ffe9] p-4">
                <div className="rounded-2xl bg-white p-4 text-sm leading-6 shadow-sm">
                  {channel === "Email" ? (
                    <>
                      <strong>{subject}</strong>
                      <br />
                      {preview}
                    </>
                  ) : (
                    preview
                  )}
                </div>
              </div>
            </div>
            <div className="rounded-xl border p-4">
              <p className="text-sm font-medium">Lifecycle</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {lifecycleBadge(
                  demo === "webhook-pending"
                    ? "Pending approval"
                    : demo === "error"
                      ? "Rejected"
                      : "Draft",
                )}
              </div>
              <ol className="mt-4 space-y-2 text-sm text-muted-foreground">
                {["Draft", "Submit", "Meta approval", "Ready to send"].map((step, index) => (
                  <li key={step} className="flex items-center gap-2">
                    <span className="flex size-6 items-center justify-center rounded-full bg-muted text-xs">
                      {index + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
            <div className="flex flex-wrap gap-2">
              {templateVariables.slice(0, 5).map((item) => (
                <Badge key={item.token} variant="secondary">
                  {item.token}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}
