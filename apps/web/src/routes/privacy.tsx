import { Button } from "@corral/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@corral/ui/components/card";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";

import { useStickyCta } from "../components/sticky-cta";
import { BackLink, PageHeader, StatusPill, validateDemoSearch } from "./-my-area";

export const Route = createFileRoute("/privacy")({
  validateSearch: validateDemoSearch,
  component: PrivacyScreen,
});

const sections = [
  [
    "What we collect",
    "Registration details, emergency contact, category, payment reference, BIB, timing, certificate and optional insurance status.",
  ],
  [
    "Why we use it",
    "To operate registration, race-day safety, timing, certificates, support, fraud prevention and legal compliance.",
  ],
  [
    "Sharing",
    "Organizers, timing partners, payment processors and optional insurers receive only the fields needed for their role.",
  ],
  [
    "Your choices",
    "You can request access, correction or deletion where law permits. Some race records must remain for safety, audit or certificate integrity.",
  ],
];

function PrivacyScreen() {
  const cta = useMemo(
    () => (
      <Button asChild className="min-h-12 w-full rounded-2xl text-base">
        <a href="mailto:privacy@corral.local">Contact privacy desk</a>
      </Button>
    ),
    [],
  );
  useStickyCta(cta);

  return (
    <section className="space-y-5 py-3">
      <BackLink to="/">Home</BackLink>
      <PageHeader
        eyebrow="S-07 · Privacy"
        title="DPDP privacy notice"
        description="A concise participant notice for Corral's frontend-only build. This page makes consent, sharing and support paths visible before and after registration."
        action={<StatusPill status="info" label="Notice" />}
      />

      <Card className="rounded-[2rem] border-orange-100 bg-white shadow-xl shadow-slate-950/10">
        <CardHeader>
          <CardTitle className="font-display text-2xl tracking-[-0.04em] text-brand-navy">
            Participant data promise
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm leading-6 text-muted-foreground">
          <p>
            Corral uses participant data only to run the event journey: discovery, registration,
            payment confirmation, race-day operations, results, certificates, insurance status and
            support.
          </p>
          <p>
            No screen in this mock build calls a backend or third-party service. Production
            integrations must keep secrets server-side and expose only participant-safe fields.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-3">
        {sections.map(([title, copy]) => (
          <Card key={title} className="rounded-[1.5rem] border-orange-100 bg-white py-4">
            <CardContent>
              <h2 className="font-display text-xl font-bold tracking-[-0.04em] text-brand-navy">
                {title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{copy}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="rounded-[2rem] border border-dashed border-orange-200 bg-orange-50/80 p-5 text-sm leading-6 text-muted-foreground">
        <p className="font-semibold text-brand-navy">Need help?</p>
        <p className="mt-1">
          Email privacy@corral.local with your registration ID. For race-day assistance, use the
          support number shown inside My Area.
        </p>
        <Button asChild variant="ghost" className="mt-3 min-h-11 rounded-2xl px-0">
          <Link
            to="/my/registrations/$registrationId"
            params={{ registrationId: "reg-ananya-10k-confirmed" }}
          >
            Open demo My Area
          </Link>
        </Button>
      </div>
    </section>
  );
}
