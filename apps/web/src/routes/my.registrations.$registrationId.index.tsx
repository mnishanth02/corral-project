import { Button } from "@corral/ui/components/button";
import { Card, CardContent } from "@corral/ui/components/card";
import { Input } from "@corral/ui/components/input";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useMemo } from "react";

import { useStickyCta } from "../components/sticky-cta";
import {
  BackLink,
  DemoSkeleton,
  demoTicketState,
  eventDateLine,
  FieldList,
  getRegistrationBundle,
  InlineQr,
  NavTile,
  PageHeader,
  StatusPill,
  ticketAmount,
  validateDemoSearch,
} from "./-my-area";

export const Route = createFileRoute("/my/registrations/$registrationId/")({
  validateSearch: validateDemoSearch,
  component: TicketScreen,
});

function TicketScreen() {
  const { registrationId } = Route.useParams();
  const { demo = "default" } = Route.useSearch();
  const bundle = getRegistrationBundle(registrationId);

  if (!bundle) {
    throw notFound();
  }

  const ticketState = demoTicketState(demo, bundle.registration, bundle.ticket, bundle.result);
  const cta = useMemo(
    () => (
      <Button
        asChild
        className="min-h-12 w-full rounded-2xl text-base shadow-lg shadow-orange-500/25"
      >
        <Link to="/my/registrations/$registrationId/kit" params={{ registrationId }}>
          View kit collection
        </Link>
      </Button>
    ),
    [registrationId],
  );
  useStickyCta(cta);

  if (demo === "loading") {
    return <DemoSkeleton />;
  }

  const needsOtp = demo === "validation-error" || demo === "error";

  return (
    <div className="space-y-5">
      <BackLink to="/">Home</BackLink>
      <PageHeader
        eyebrow="P-19 · E-ticket"
        title="Your race pass"
        description={`${eventDateLine(bundle.event)}. Show this QR at the kit desk and race-day gate.`}
        action={<StatusPill status={ticketState.status} label={ticketState.label} />}
      />

      {needsOtp ? (
        <Card className="rounded-[2rem] border-warning/30 bg-warning/10">
          <CardContent className="space-y-3 pt-0">
            <p className="font-semibold text-warning-text">Secure re-entry needed</p>
            <p className="text-sm leading-6 text-muted-foreground">
              This magic link is expired or opened on a new device. Enter the OTP sent to your
              registered mobile ending 0420.
            </p>
            <label className="block text-sm font-medium" htmlFor="otp">
              One-time password
            </label>
            <Input
              id="otp"
              inputMode="numeric"
              maxLength={6}
              placeholder="6-digit OTP"
              className="min-h-12 rounded-2xl bg-white"
            />
            <Button className="min-h-11 rounded-2xl">Verify OTP</Button>
          </CardContent>
        </Card>
      ) : null}

      <div className="overflow-hidden rounded-[2.25rem] border border-orange-100 bg-[linear-gradient(150deg,#fff7ed,#ffffff_52%,#e0f2fe)] p-5 shadow-2xl shadow-slate-950/10">
        <div className="flex flex-col items-center gap-4 text-center">
          <InlineQr label={bundle.ticket?.qrLabel ?? bundle.registration.id} />
          <div>
            <p className="font-display font-black text-3xl tracking-[-0.05em] text-brand-navy">
              {bundle.registration.participantName}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {bundle.category.name} ·{" "}
              {ticketState.bib === "TBD" ? "BIB pending" : `BIB ${ticketState.bib}`}
            </p>
          </div>
        </div>
      </div>

      <FieldList
        rows={[
          { label: "Event", value: bundle.event.title },
          { label: "Amount", value: ticketAmount(bundle.registration) },
          {
            label: "Report",
            value: bundle.ticket
              ? `${formatTime(bundle.ticket.reportingTime)} · ${bundle.ticket.gate}`
              : "To be announced",
          },
          { label: "Registration", value: bundle.registration.id },
        ]}
      />

      <div className="grid gap-3">
        <NavTile
          title="BIB & kit"
          description="Collection window, BIB number and ID checklist."
          to="/my/registrations/$registrationId/kit"
          params={{ registrationId }}
        />
        <NavTile
          title="Race-day guide"
          description="Schedule, venue, what to bring and route notes."
          to="/events/$eventId/race-day"
          params={{ eventId: bundle.event.slug }}
        />
        <NavTile
          title="My result"
          description="Finish time and rankings once results are live."
          to="/my/registrations/$registrationId/result"
          params={{ registrationId }}
          disabled={ticketState.label === "Payment pending"}
        />
        <NavTile
          title="Certificate"
          description="Download and share your finisher certificate."
          to="/my/registrations/$registrationId/certificate"
          params={{ registrationId }}
          disabled={ticketState.label !== "Certificate ready"}
        />
        <NavTile
          title="Insurance"
          description="Coverage, policy status and support path."
          to="/my/registrations/$registrationId/insurance"
          params={{ registrationId }}
        />
      </div>
    </div>
  );
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(value));
}
