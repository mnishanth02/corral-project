import { Button } from "@corral/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@corral/ui/components/card";
import { createFileRoute } from "@tanstack/react-router";

import { parseDemoState } from "../mocks/utils";

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

const MessageCircle = icon("☘");
const Plus = icon("+");
const Send = icon("➤");
const UsersRound = icon("👥");

import {
  audienceCounts,
  buildRecentSends,
  ChannelGuidance,
  CommPageShell,
  commsDisplayEventId,
  commsTemplates,
  DemoUrls,
  EmptyComms,
  LoadingCards,
  NoNetworkNote,
  RecentSendsTable,
  StatCard,
  TemplateCard,
} from "./-comms-shared";

export const Route = createFileRoute("/_authenticated/events/$eventId/comms/")({
  validateSearch: (search) => ({ demo: parseDemoState(search.demo) }),
  staticData: { breadcrumb: "Communications" },
  component: CommsDashboardRoute,
});

function CommsDashboardRoute() {
  const { eventId } = Route.useParams() as { eventId: string };
  const { demo } = Route.useSearch() as { demo: "default" | "empty" | "loading" };
  const loading = demo === "loading";
  const empty = demo === "empty";
  const counts = audienceCounts(eventId);
  const sends = empty ? [] : buildRecentSends(eventId);
  const templates = empty ? [] : commsTemplates.filter((template) => template.eventId === eventId);

  return (
    <CommPageShell
      eventId={eventId}
      eyebrow="O-20 · WhatsApp-first comms"
      title="Communications"
      description="Template library and recent sends overview for CODISSIA runners. Keep WhatsApp primary, with SMS/email fallback visible before every send."
      actions={
        <>
          <Button asChild variant="outline">
            <a href={`/events/${eventId}/comms/templates`}>
              <Plus className="size-4" aria-hidden="true" />
              New template
            </a>
          </Button>
          <Button asChild variant="whatsapp">
            <a href={`/events/${eventId}/comms/send`}>
              <MessageCircle className="size-4" aria-hidden="true" />
              New WhatsApp message
            </a>
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        {empty ? <EmptyComms eventId={eventId} /> : null}
        <div className="grid gap-4 lg:grid-cols-3">
          <StatCard
            icon={<UsersRound className="size-5" />}
            label="Reachable audience"
            value={String(counts.all)}
            helper="Paid + awaiting webhook roster"
            status="info"
          />
          <StatCard
            icon={<MessageCircle className="size-5" />}
            label="WhatsApp approved"
            value={String(
              templates.filter(
                (item) => item.channel === "WhatsApp" && item.lifecycle === "Approved",
              ).length,
            )}
            helper="Ready-to-send templates"
            status="ok"
          />
          <StatCard
            icon={<Send className="size-5" />}
            label="Recent sends"
            value={String(sends.length)}
            helper={empty ? "No sends yet" : "Last 7 days"}
            status={empty ? "neutral" : "ok"}
          />
        </div>

        <NoNetworkNote />
        <ChannelGuidance />

        <section className="space-y-4" aria-labelledby="template-library-title">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2
                id="template-library-title"
                className="font-display text-2xl font-black uppercase tracking-tight"
              >
                Template library
              </h2>
              <p className="text-sm text-muted-foreground">
                Registration, payment, race-day, results, and certificate messages.
              </p>
            </div>
            <Button asChild variant="outline">
              <a href={`/events/${eventId}/comms/templates`}>Manage templates</a>
            </Button>
          </div>
          {loading ? (
            <LoadingCards />
          ) : (
            <div className="grid gap-4 lg:grid-cols-3">
              {templates.map((template) => (
                <TemplateCard key={template.id} template={template} eventId={eventId} />
              ))}
            </div>
          )}
        </section>

        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle className="font-display text-2xl uppercase tracking-tight">
                Recent sends
              </CardTitle>
              <CardDescription>
                Delivered/read snapshots by channel. Open delivery for per-runner status.
              </CardDescription>
            </div>
            <Button asChild variant="outline">
              <a href={`/events/${eventId}/comms/delivery`}>Delivery monitor</a>
            </Button>
          </CardHeader>
          <CardContent>
            <RecentSendsTable rows={sends} loading={loading} />
          </CardContent>
        </Card>

        <DemoUrls
          urls={[
            `/events/${commsDisplayEventId}/comms?demo=default`,
            `/events/${commsDisplayEventId}/comms?demo=empty`,
            `/events/${commsDisplayEventId}/comms?demo=loading`,
          ]}
        />
      </div>
    </CommPageShell>
  );
}
