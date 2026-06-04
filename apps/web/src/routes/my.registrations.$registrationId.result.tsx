import { Button } from "@corral/ui/components/button";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useMemo } from "react";

import { useStickyCta } from "../components/sticky-cta";
import {
  BackLink,
  DemoSkeleton,
  getRegistrationBundle,
  InfoCard,
  PageHeader,
  resultVariants,
  StatusPill,
  validateDemoSearch,
} from "./-my-area";

export const Route = createFileRoute("/my/registrations/$registrationId/result")({
  validateSearch: validateDemoSearch,
  component: ResultScreen,
});

function ResultScreen() {
  const { registrationId } = Route.useParams();
  const { demo = "default" } = Route.useSearch();
  const bundle = getRegistrationBundle(registrationId);
  if (!bundle) {
    throw notFound();
  }

  const variant = resultVariants[demo];
  const cta = useMemo(
    () => (
      <Button
        asChild
        className="min-h-12 w-full rounded-2xl text-base"
        disabled={variant.label !== "Finished"}
      >
        <Link to="/my/registrations/$registrationId/certificate" params={{ registrationId }}>
          View certificate
        </Link>
      </Button>
    ),
    [registrationId, variant.label],
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
        eyebrow="P-22 · Result"
        title="Your finish"
        description={`${bundle.event.title} · ${bundle.category.name}. Timing data is mocked locally for the build.`}
        action={<StatusPill status={variant.status} label={variant.label} />}
      />

      <div className="rounded-[2.25rem] border border-orange-100 bg-[linear-gradient(150deg,#fff7ed,#fff,#ecfeff)] p-6 text-center shadow-2xl shadow-slate-950/10">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-muted-foreground">
          Finish time
        </p>
        <p className="mt-2 font-display font-black text-6xl leading-none tracking-[-0.08em] text-brand-navy">
          {variant.time}
        </p>
        <p className="mt-3 text-sm text-muted-foreground">{variant.note}</p>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        {[
          ["Overall", "42 / 642"],
          ["Category", "9 / 118"],
          ["Age group", "3 / 22"],
        ].map(([label, value]) => (
          <div key={label} className="rounded-3xl border border-orange-100 bg-white p-3 shadow-sm">
            <p className="text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground">
              {label}
            </p>
            <p className="mt-2 font-display font-bold text-xl text-brand-navy">
              {variant.label === "Finished" || variant.label === "Results live" ? value : "—"}
            </p>
          </div>
        ))}
      </div>

      <InfoCard title="Explore results">
        <div className="grid gap-3">
          <Button asChild variant="outline" className="min-h-11 rounded-2xl bg-white">
            <Link to="/events/$eventId/leaderboard" params={{ eventId: bundle.event.slug }}>
              See full leaderboard
            </Link>
          </Button>
          <Button asChild variant="ghost" className="min-h-11 rounded-2xl">
            <Link to="/my/registrations/$registrationId/certificate" params={{ registrationId }}>
              Certificate status
            </Link>
          </Button>
        </div>
      </InfoCard>
    </div>
  );
}
