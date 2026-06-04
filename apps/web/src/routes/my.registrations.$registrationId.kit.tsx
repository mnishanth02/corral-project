import { Button } from "@corral/ui/components/button";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useMemo } from "react";

import { useStickyCta } from "../components/sticky-cta";
import {
  BackLink,
  DemoSkeleton,
  FieldList,
  getRegistrationBundle,
  InfoCard,
  MissingState,
  PageHeader,
  StatusPill,
  validateDemoSearch,
} from "./-my-area";

export const Route = createFileRoute("/my/registrations/$registrationId/kit")({
  validateSearch: validateDemoSearch,
  component: KitScreen,
});

function KitScreen() {
  const { registrationId } = Route.useParams();
  const { demo = "default" } = Route.useSearch();
  const bundle = getRegistrationBundle(registrationId);
  if (!bundle) {
    throw notFound();
  }

  const assigned =
    demo !== "empty" && bundle.ticket?.bibNumber && bundle.ticket.bibNumber !== "TBD";
  const cta = useMemo(
    () => (
      <Button asChild className="min-h-12 w-full rounded-2xl text-base">
        <Link to="/events/$eventId/race-day" params={{ eventId: bundle.event.slug }}>
          Open race-day guide
        </Link>
      </Button>
    ),
    [bundle.event.slug],
  );
  useStickyCta(cta);

  if (demo === "loading") {
    return <DemoSkeleton />;
  }

  return (
    <div className="space-y-5">
      <BackLink to="/my/registrations/$registrationId" params={{ registrationId }}>
        Back to ticket
      </BackLink>
      <PageHeader
        eyebrow="P-20 · Kit"
        title="BIB & kit collection"
        description="Collect your race kit before event week. Bring photo ID and the QR ticket on your phone."
        action={
          <StatusPill
            status={assigned ? "ok" : "info"}
            label={assigned ? "BIB assigned" : "Pre-BIB"}
          />
        }
      />

      {assigned ? (
        <div className="rounded-[2.25rem] border border-orange-100 bg-white p-6 text-center shadow-xl shadow-slate-950/10">
          <p className="font-bold text-xs uppercase tracking-[0.25em] text-muted-foreground">
            Your BIB
          </p>
          <p className="mt-2 font-display font-black text-7xl leading-none tracking-[-0.08em] text-brand-navy">
            {bundle.ticket?.bibNumber}
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            {bundle.ticket?.wave} · {bundle.ticket?.gate}
          </p>
        </div>
      ) : (
        <MissingState
          title="BIB will be assigned soon"
          description="The organizer will publish BIB numbers after roster lock. Your ticket remains confirmed."
        />
      )}

      <InfoCard title="Collection desk" description="CODISSIA pre-race expo">
        <FieldList
          rows={[
            { label: "When", value: "11 Jul 2026 · 10:00 AM–6:00 PM" },
            { label: "Where", value: "Hall C, CODISSIA Trade Fair Complex" },
            { label: "Bring", value: "Photo ID, QR ticket, consent for minors" },
            { label: "Support", value: "+91 422 555 0198" },
          ]}
        />
      </InfoCard>
    </div>
  );
}
