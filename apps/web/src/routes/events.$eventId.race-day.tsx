import { Button } from "@corral/ui/components/button";
import { Card, CardContent } from "@corral/ui/components/card";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useMemo } from "react";

import { useStickyCta } from "../components/sticky-cta";
import {
  BackLink,
  DemoSkeleton,
  getEvent,
  InfoCard,
  PageHeader,
  StatusPill,
  validateDemoSearch,
} from "./-my-area";

export const Route = createFileRoute("/events/$eventId/race-day")({
  validateSearch: validateDemoSearch,
  component: RaceDayScreen,
});

const schedule = [
  ["4:45 AM", "21K runners assemble at Race Course Road holding area"],
  ["5:15 AM", "10K Wave A reports at CODISSIA Gate 2"],
  ["5:45 AM", "Warm-up and safety briefing"],
  ["6:00 AM", "5K family run flag-off from Gate 1"],
  ["7:30 AM", "Breakfast counters open near Hall B"],
];

function RaceDayScreen() {
  const { eventId } = Route.useParams();
  const { demo = "default" } = Route.useSearch();
  const event = getEvent(eventId);
  if (!event) {
    throw notFound();
  }

  const cta = useMemo(
    () => (
      <Button asChild className="min-h-12 w-full rounded-2xl text-base">
        <a href="tel:+914225550198">Call race-day support</a>
      </Button>
    ),
    [],
  );
  useStickyCta(cta);

  if (demo === "loading") {
    return <DemoSkeleton />;
  }

  return (
    <section className="space-y-5 py-3">
      <BackLink to="/events/$eventId/leaderboard" params={{ eventId: event.slug }}>
        Event links
      </BackLink>
      <PageHeader
        eyebrow="P-21 · Race day"
        title="Arrive calm. Run sharp."
        description={`${event.venue.name}, ${event.venue.addressLine1}. Hydration every 2.5 km and medical support at CODISSIA, Race Course, and Peelamedu.`}
        action={<StatusPill status="info" label="Guide" />}
      />

      <InfoCard title="Schedule" description="Keep 20 minutes buffer for security and bag drop.">
        <ol className="space-y-3">
          {schedule.map(([time, copy]) => (
            <li
              key={time}
              className="grid grid-cols-[4.25rem_1fr] gap-3 rounded-2xl bg-secondary p-3 text-sm"
            >
              <span className="font-bold text-brand-orange-strong">{time}</span>
              <span className="text-muted-foreground">{copy}</span>
            </li>
          ))}
        </ol>
      </InfoCard>

      <InfoCard title="What to bring">
        <ul className="grid gap-2 text-sm text-muted-foreground">
          {[
            "QR e-ticket and photo ID",
            "Pinned BIB + timing chip",
            "Hydration bottle if preferred",
            "Any prescribed medication",
            "Light rain layer for morning drizzle",
          ].map((item) => (
            <li key={item} className="rounded-2xl bg-white p-3">
              ✓ {item}
            </li>
          ))}
        </ul>
      </InfoCard>

      <Card className="rounded-[2rem] border-info/20 bg-info/10">
        <CardContent className="space-y-3 pt-0 text-sm leading-6 text-muted-foreground">
          <p className="font-semibold text-info-text">Route snapshot</p>
          <p>
            CODISSIA → Avinashi Road service lane → Race Course Road loop → VOC Park hydration →
            CODISSIA finish chute.
          </p>
          <Button asChild variant="outline" className="min-h-11 rounded-2xl bg-white">
            <Link to="/events/$eventId/leaderboard" params={{ eventId: event.slug }}>
              See post-race leaderboard
            </Link>
          </Button>
        </CardContent>
      </Card>
    </section>
  );
}
