import { Button } from "@corral/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@corral/ui/components/card";
import { useMemo } from "react";

import { useStickyCta } from "../components/sticky-cta";
import type { PublicDisplayEvent } from "../lib/public-events";
import { publicEventPath } from "../lib/public-events";
import { formatDate, formatINR } from "../mocks/utils";

function activePriceLabel(event: PublicDisplayEvent) {
  const activeTier = event.categories
    .flatMap((category) => category.feeTiers)
    .find((tier) => tier.active);

  return activeTier ? formatINR(activeTier.amount) : "Fees opening soon";
}

export function IndexPage({ events }: { events: PublicDisplayEvent[] }) {
  const featuredEvent = events[0];
  const primaryCta = useMemo(
    () => (
      <Button asChild className="h-12 w-full rounded-2xl text-base shadow-lg shadow-orange-500/25">
        <a href={featuredEvent ? publicEventPath(featuredEvent) : "/calendar"}>
          {featuredEvent ? `Register for ${featuredEvent.title}` : "Browse events"}
        </a>
      </Button>
    ),
    [featuredEvent],
  );

  useStickyCta(primaryCta);

  return (
    <section className="space-y-5 py-3">
      <div className="overflow-hidden rounded-[2rem] border border-orange-100 bg-white shadow-2xl shadow-slate-950/10">
        <div className="relative min-h-[25rem] p-6">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_10%,rgba(255,90,0,0.24),transparent_14rem),linear-gradient(150deg,#fff7ed,#ffffff_48%,#e0f2fe)]" />
          <div className="absolute right-[-4rem] bottom-[-5rem] size-52 rounded-full border-[2rem] border-orange-500/10" />
          <div className="relative flex h-full flex-col justify-between gap-10">
            <div>
              <p className="inline-flex rounded-full border border-orange-200 bg-white/80 px-3 py-1 font-bold text-[0.68rem] uppercase tracking-[0.24em] text-brand-orange-strong">
                Participant app shell
              </p>
              <h1 className="mt-5 font-display font-black text-5xl leading-[0.9] tracking-[-0.06em] text-brand-navy">
                Race day starts here.
              </h1>
              <p className="mt-4 text-base leading-7 text-muted-foreground">
                Browse live published events, review race details, and choose your start line in one
                mobile-first Corral journey.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Button asChild variant="outline" className="h-11 rounded-2xl bg-white/80">
                <a href="/calendar">Calendar</a>
              </Button>
              <Button asChild className="h-11 rounded-2xl">
                <a href={featuredEvent ? publicEventPath(featuredEvent) : "/calendar"}>Featured</a>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Card className="gap-4 rounded-[2rem] border-orange-100 shadow-lg shadow-slate-950/5">
        <CardHeader>
          <CardTitle className="font-display text-2xl tracking-[-0.04em] text-brand-navy">
            {featuredEvent?.title ?? "No published event yet"}
          </CardTitle>
          {featuredEvent ? (
            <CardDescription>
              {formatDate(featuredEvent.startsAt)} · {featuredEvent.venue.name},{" "}
              {featuredEvent.city}
            </CardDescription>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm leading-6 text-muted-foreground">
            {featuredEvent?.summary ?? "Published organizer events will appear here."}
          </p>
          <dl className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-2xl bg-secondary p-3">
              <dt className="text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground">
                From
              </dt>
              <dd className="mt-1 font-bold text-brand-navy">
                {featuredEvent ? activePriceLabel(featuredEvent) : "TBD"}
              </dd>
            </div>
            <div className="rounded-2xl bg-secondary p-3">
              <dt className="text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground">
                Runs
              </dt>
              <dd className="mt-1 font-bold text-brand-navy">
                {featuredEvent
                  ? featuredEvent.categories.map((category) => category.distance).join("-")
                  : "TBD"}
              </dd>
            </div>
            <div className="rounded-2xl bg-secondary p-3">
              <dt className="text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground">
                City
              </dt>
              <dd className="mt-1 font-bold text-brand-navy">{featuredEvent?.city ?? "TBD"}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <div className="rounded-[2rem] border border-dashed border-orange-200 bg-orange-50/70 p-5">
        <p className="font-bold text-sm uppercase tracking-[0.2em] text-brand-orange-strong">
          For screen agents
        </p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          This shell now owns the top navigation, demo state switcher, error/404 surfaces, and the
          shared sticky CTA slot. Public discovery routes now read from the live published-event
          API.
        </p>
      </div>
    </section>
  );
}
