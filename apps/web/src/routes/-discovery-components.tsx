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
import { DegradedBanner } from "@corral/ui/components/degraded-banner";
import { EmptyState } from "@corral/ui/components/empty-state";
import { Separator } from "@corral/ui/components/separator";
import { CardSkeleton, ListSkeleton } from "@corral/ui/components/skeletons";
import { Link, notFound } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useMemo } from "react";

import { useStickyCta } from "../components/sticky-cta";
import { participantEvents } from "../mocks/events";
import type { Category, DemoState, Event, FeeTier } from "../mocks/types";
import { formatDate, formatINR, formatTime, parseDemoState } from "../mocks/utils";

export type DiscoverySearch = {
  demo?: DemoState;
};

export function validateDemoSearch(search: Record<string, unknown>): DiscoverySearch {
  const demo = parseDemoState(typeof search.demo === "string" ? search.demo : undefined);

  return { demo: demo === "default" ? undefined : demo };
}

export function getEventOrThrow(eventId: string): Event {
  const event = participantEvents.find((item) => item.slug === eventId || item.id === eventId);

  if (!event) {
    throw notFound();
  }

  return event;
}

function demoValue(demo: DemoState | undefined): DemoState {
  return demo ?? "default";
}

function registerPath(event: Event) {
  return `/events/${event.slug}/register/category`;
}

function activeTier(category: Category): FeeTier {
  const tier = category.feeTiers.find((item) => item.active) ?? category.feeTiers[0];

  if (!tier) {
    throw new Error(`Missing fee tier for ${category.name}`);
  }

  return tier;
}

function seatsLeft(category: Category) {
  return Math.max(category.capacity - category.registeredCount, 0);
}

function lowestFee(event: Event) {
  return Math.min(...event.categories.map((category) => activeTier(category).amount.amount));
}

function soldOut(event: Event) {
  return (
    event.status === "sold-out" ||
    event.categories.every((category) => category.status === "sold-out")
  );
}

type LandingStatus =
  | "registration-open"
  | "early-bird-active"
  | "closing-soon"
  | "closed"
  | "sold-out";

function landingStatus(event: Event, demo: DemoState): LandingStatus {
  if (demo === "validation-error" || soldOut(event)) {
    return "sold-out";
  }

  if (demo === "offline") {
    return "closed";
  }

  if (demo === "webhook-pending") {
    return "closing-soon";
  }

  if (demo === "success") {
    return "early-bird-active";
  }

  return "registration-open";
}

function statusContent(status: LandingStatus) {
  const copy: Record<
    LandingStatus,
    { icon: string; label: string; tone: "success" | "warning" | "muted" }
  > = {
    "registration-open": { icon: "●", label: "Registration open", tone: "success" },
    "early-bird-active": { icon: "↯", label: "Early bird active", tone: "success" },
    "closing-soon": { icon: "!", label: "Closing soon", tone: "warning" },
    closed: { icon: "■", label: "Registration closed", tone: "muted" },
    "sold-out": { icon: "×", label: "Sold out", tone: "warning" },
  };

  return copy[status];
}

function RegisterCta({
  event,
  disabled,
  reason,
}: {
  event: Event;
  disabled?: boolean;
  reason?: string;
}) {
  if (disabled) {
    return (
      <div className="space-y-2" aria-live="polite">
        <Button disabled className="h-12 w-full rounded-2xl text-base">
          Registration unavailable
        </Button>
        {reason ? <p className="text-center text-muted-foreground text-xs">{reason}</p> : null}
      </div>
    );
  }

  return (
    <Button asChild className="h-12 w-full rounded-2xl text-base shadow-lg">
      <Link to={registerPath(event) as never}>Register now</Link>
    </Button>
  );
}

function BackLink({ event, label = "Back to event" }: { event: Event; label?: string }) {
  return (
    <Button asChild variant="ghost" className="min-h-11 rounded-2xl px-0 text-muted-foreground">
      <Link to="/events/$eventId" params={{ eventId: event.slug }}>
        ← {label}
      </Link>
    </Button>
  );
}

function PolicyBackCta({ event }: { event: Event }) {
  return (
    <div className="grid grid-cols-[1fr_auto] gap-2">
      <Button asChild className="h-12 rounded-2xl text-base">
        <Link to={registerPath(event) as never}>Back to registration</Link>
      </Button>
      <Button
        type="button"
        variant="outline"
        className="h-12 rounded-2xl"
        onClick={() => window.print()}
      >
        Print
      </Button>
    </div>
  );
}

function PageKicker({ children }: { children: ReactNode }) {
  return (
    <p className="font-bold text-[0.68rem] uppercase tracking-[0.24em] text-brand-orange-strong">
      {children}
    </p>
  );
}

function StatusBadge({ status }: { status: LandingStatus }) {
  const content = statusContent(status);

  return (
    <Badge variant={content.tone} className="rounded-full px-3 py-1">
      <span aria-hidden="true">{content.icon}</span>
      {content.label}
    </Badge>
  );
}

function DistanceChip({
  category,
  forceSoldOut = false,
}: {
  category: Category;
  forceSoldOut?: boolean;
}) {
  const tier = activeTier(category);
  const left = seatsLeft(category);
  const isSoldOut = forceSoldOut || category.status === "sold-out" || left === 0;

  return (
    <div className="rounded-3xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-display font-black text-3xl text-brand-navy tracking-[-0.04em]">
            {category.distance}
          </p>
          <p className="text-muted-foreground text-xs">{category.name}</p>
        </div>
        <Badge
          variant={isSoldOut ? "warning" : category.status === "early-bird" ? "success" : "info"}
        >
          <span aria-hidden="true">
            {isSoldOut ? "×" : category.status === "early-bird" ? "↯" : "●"}
          </span>
          {isSoldOut ? "Sold out" : category.status === "early-bird" ? "Early bird" : "Open"}
        </Badge>
      </div>
      <div className="mt-4 flex items-end justify-between gap-3">
        <div>
          <p className="text-muted-foreground text-[0.68rem] uppercase tracking-[0.18em]">Fee</p>
          <p className="font-bold text-brand-navy">{formatINR(tier.amount)}</p>
        </div>
        <p className="text-right text-muted-foreground text-xs">
          {isSoldOut ? "Waitlist opens soon" : `${left} spots left`}
        </p>
      </div>
    </div>
  );
}

function EventMeta({ event }: { event: Event }) {
  return (
    <dl className="grid grid-cols-3 gap-2 text-center">
      <div className="rounded-2xl bg-secondary p-3">
        <dt className="text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground">From</dt>
        <dd className="mt-1 font-bold text-brand-navy">{formatINR(lowestFee(event))}</dd>
      </div>
      <div className="rounded-2xl bg-secondary p-3">
        <dt className="text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground">Starts</dt>
        <dd className="mt-1 font-bold text-brand-navy">{formatTime(event.startsAt)}</dd>
      </div>
      <div className="rounded-2xl bg-secondary p-3">
        <dt className="text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground">BIB</dt>
        <dd className="mt-1 font-bold text-brand-navy">1042</dd>
      </div>
    </dl>
  );
}

export function CalendarPage({ demo }: DiscoverySearch) {
  const state = demoValue(demo);
  const events = state === "empty" ? [] : participantEvents;

  const cta = useMemo(
    () => (
      <Button asChild className="h-12 w-full rounded-2xl text-base">
        <Link to="/calendar" search={{ demo: "default" }}>
          Browse upcoming races
        </Link>
      </Button>
    ),
    [],
  );

  useStickyCta(cta);

  if (state === "loading") {
    return (
      <section className="space-y-5 py-3" aria-busy="true">
        <PageKicker>P-01 · Coimbatore calendar</PageKicker>
        <CardSkeleton className="rounded-[2rem]" />
        <ListSkeleton />
      </section>
    );
  }

  return (
    <section className="space-y-5 py-3">
      <div className="rounded-[2rem] border border-orange-100 bg-card p-6 shadow-lg">
        <PageKicker>P-01 · Discovery</PageKicker>
        <h1 className="mt-4 font-display font-black text-5xl leading-[0.9] tracking-[-0.06em] text-brand-navy">
          Coimbatore running calendar.
        </h1>
        <p className="mt-4 text-muted-foreground text-sm leading-6">
          Curated race weekends around CODISSIA, Race Course Road, and community clubs — ready for
          Ananya Krishnan and Karthik Narayanan to pick their next start line.
        </p>
      </div>

      {events.length === 0 ? (
        <EmptyState
          title="No upcoming Coimbatore races"
          description="The discovery list is intentionally empty in this demo state. Check back after the admin calendar seed."
          action={
            <Button asChild variant="outline" className="min-h-11 rounded-2xl">
              <Link to="/calendar" search={{ demo: "default" }}>
                Show seeded events
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {events.map((event) => (
            <Card
              key={event.id}
              className="overflow-hidden rounded-[2rem] border-orange-100 shadow-md"
            >
              <div
                role="img"
                aria-label={event.heroImageAlt}
                className="h-32 bg-[radial-gradient(circle_at_28%_20%,var(--brand-tint),transparent_12rem),linear-gradient(135deg,var(--secondary),var(--card))]"
              />
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="font-display text-3xl tracking-[-0.04em] text-brand-navy">
                      {event.title}
                    </CardTitle>
                    <CardDescription>
                      {formatDate(event.startsAt)} · {formatTime(event.startsAt)} · {event.city}
                    </CardDescription>
                  </div>
                  <Badge variant="success" className="rounded-full">
                    <span aria-hidden="true">●</span> Open
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground text-sm leading-6">{event.summary}</p>
                <EventMeta event={event} />
                <Button asChild className="min-h-11 w-full rounded-2xl">
                  <Link to="/events/$eventId" params={{ eventId: event.slug }}>
                    View event
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}

export function EventLandingPage({ event, demo }: { event: Event; demo?: DemoState }) {
  const state = demoValue(demo);
  const status = landingStatus(event, state);
  const disabled = status === "closed" || status === "sold-out";
  const reason =
    status === "closed"
      ? "Registration closed on 15 Jun 2026."
      : status === "sold-out"
        ? "All public categories are full."
        : undefined;

  const cta = useMemo(
    () => <RegisterCta event={event} disabled={disabled} reason={reason} />,
    [event, disabled, reason],
  );

  useStickyCta(cta);

  if (state === "loading") {
    return (
      <section className="space-y-5 py-3" aria-busy="true">
        <CardSkeleton className="rounded-[2rem]" />
        <ListSkeleton />
      </section>
    );
  }

  return (
    <section className="space-y-5 py-3">
      <Button asChild variant="ghost" className="min-h-11 rounded-2xl px-0 text-muted-foreground">
        <Link to="/calendar">← Calendar</Link>
      </Button>

      <article className="overflow-hidden rounded-[2rem] border border-orange-100 bg-card shadow-xl">
        <div className="relative min-h-80 p-5">
          <div
            role="img"
            aria-label={event.heroImageAlt}
            className="absolute inset-0 bg-[radial-gradient(circle_at_22%_12%,var(--brand-tint),transparent_14rem),linear-gradient(150deg,var(--secondary),var(--card)_54%,var(--brand-tint))]"
          />
          <div className="absolute right-5 top-5 flex size-16 items-center justify-center rounded-3xl border border-orange-100 bg-card/90 font-display font-black text-3xl text-primary shadow-sm">
            CBE
          </div>
          <div className="relative flex min-h-72 flex-col justify-end gap-4">
            <div className="flex flex-wrap gap-2">
              <StatusBadge status={status} />
              <Badge variant="info" className="rounded-full">
                <span aria-hidden="true">⌁</span> 6.8 km from Race Course
              </Badge>
            </div>
            <div>
              <h1 className="font-display font-black text-5xl leading-[0.9] tracking-[-0.06em] text-brand-navy">
                {event.title}
              </h1>
              <p className="mt-3 font-semibold text-brand-navy">
                {formatDate(event.startsAt)} · {formatTime(event.startsAt)} flag-off
              </p>
            </div>
          </div>
        </div>
      </article>

      <Card className="rounded-[2rem] border-orange-100">
        <CardHeader>
          <CardTitle className="text-lg text-brand-navy">Venue</CardTitle>
          <CardDescription>
            {event.venue.name}, {event.venue.addressLine1}, {event.venue.locality}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button asChild variant="outline" className="min-h-11 w-full rounded-2xl">
            <a href="#venue-map">View map landmark</a>
          </Button>
          <div
            id="venue-map"
            className="rounded-3xl bg-secondary p-4 text-muted-foreground text-sm leading-6"
          >
            Start arch faces Avinashi Road; kit counters open near Hall E, CODISSIA Trade Fair
            Complex.
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {event.categories.map((category) => (
          <DistanceChip
            key={category.id}
            category={category}
            forceSoldOut={status === "sold-out"}
          />
        ))}
      </div>

      <Card className="rounded-[2rem] border-orange-100">
        <CardContent className="space-y-4 pt-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[0.68rem] uppercase tracking-[0.18em] text-muted-foreground">
                Early bird
              </p>
              <p className="font-display font-black text-4xl text-brand-navy tabular-nums">
                {status === "closing-soon" ? "02d 04h" : "12d 08h"}
              </p>
            </div>
            <Badge
              variant={status === "closing-soon" ? "warning" : "success"}
              className="rounded-full"
            >
              <span aria-hidden="true">{status === "closing-soon" ? "!" : "↯"}</span>
              {status === "closing-soon" ? "Last window" : "Save on fees"}
            </Badge>
          </div>
          <Separator />
          <ul className="flex flex-wrap gap-2" aria-label="Sponsors">
            {["Kongu Runners", "ASICS", "CODISSIA", "PSG Hospitals"].map((sponsor) => (
              <li key={sponsor}>
                <Badge variant="secondary" className="rounded-full px-3 py-1">
                  {sponsor}
                </Badge>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Button asChild variant="outline" className="min-h-11 rounded-2xl">
          <Link to="/events/$eventId/details" params={{ eventId: event.slug }}>
            Full details
          </Link>
        </Button>
        <Button asChild variant="outline" className="min-h-11 rounded-2xl">
          <Link to="/events/$eventId/policy/waiver" params={{ eventId: event.slug }}>
            Read waiver
          </Link>
        </Button>
      </div>
    </section>
  );
}

export function EventDetailsPage({ event, demo }: { event: Event; demo?: DemoState }) {
  const state = demoValue(demo);
  const cta = useMemo(() => <RegisterCta event={event} />, [event]);

  useStickyCta(cta);

  if (state === "loading") {
    return (
      <section className="space-y-5 py-3" aria-busy="true">
        <BackLink event={event} />
        <CardSkeleton className="rounded-[2rem]" />
        <CardSkeleton className="rounded-[2rem]" />
      </section>
    );
  }

  const schedule = [
    ["04:45 AM", "Reporting opens at CODISSIA Hall E"],
    ["05:20 AM", "Warm-up led by Karthik Narayanan"],
    ["05:30 AM", "21K flag-off"],
    ["05:45 AM", "10K flag-off"],
    ["06:15 AM", "5K flag-off with Ananya Krishnan"],
    ["09:30 AM", "Breakfast, medals, and medical desk close"],
  ];

  return (
    <article className="space-y-5 py-3">
      <BackLink event={event} />
      <header className="rounded-[2rem] border border-orange-100 bg-card p-6 shadow-lg">
        <PageKicker>P-03 · Event details</PageKicker>
        <h1 className="mt-4 font-display font-black text-4xl leading-none tracking-[-0.05em] text-brand-navy">
          Everything before your start line.
        </h1>
        <p className="mt-4 text-muted-foreground text-sm leading-6">
          {event.summary} Hydration points are placed every 2.5 km, with medical teams stationed
          near Race Course Road and CODISSIA.
        </p>
      </header>

      <Section title="About the race">
        <p>
          The Coimbatore Marathon 2026 is a community-first Sunday race across 5K, 10K, and 21K
          categories. Your fee includes timing chip, BIB 1042-style race identification, breakfast,
          and a finisher medal.
        </p>
      </Section>

      <Section title="Schedule">
        <ol className="space-y-3">
          {schedule.map(([time, item]) => (
            <li
              key={time}
              className="grid grid-cols-[5.25rem_1fr] gap-3 rounded-2xl bg-secondary p-3"
            >
              <span className="font-display font-black text-brand-navy tabular-nums">{time}</span>
              <span>{item}</span>
            </li>
          ))}
        </ol>
      </Section>

      <Section title="Race instructions">
        <ul className="list-disc space-y-2 pl-5">
          <li>Carry a government ID and your confirmation SMS/email for kit pickup.</li>
          <li>Pin the BIB visibly on your chest; do not fold the timing chip strip.</li>
          <li>
            Use the left lane on Race Course Road and follow marshal instructions at every turn.
          </li>
          <li>Cut-off: 5K 1h 10m, 10K 2h, 21K 3h 30m.</li>
        </ul>
      </Section>

      <Section title="Contact">
        <div className="grid gap-2">
          <Button asChild variant="outline" className="min-h-11 justify-start rounded-2xl">
            <a href="tel:+919876543210">Call support · +91 98765 43210</a>
          </Button>
          <Button asChild variant="whatsapp" className="min-h-11 justify-start rounded-2xl">
            <a href="https://wa.me/919876543210">WhatsApp race desk</a>
          </Button>
          <Button asChild variant="outline" className="min-h-11 justify-start rounded-2xl">
            <a href="mailto:support@coimbatorerunners.example">Email organizer</a>
          </Button>
        </div>
      </Section>
    </article>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-[2rem] border border-border bg-card p-5 text-sm leading-6 text-muted-foreground shadow-sm">
      <h2 className="font-display font-black text-2xl tracking-[-0.03em] text-brand-navy">
        {title}
      </h2>
      <div className="mt-4 space-y-3">{children}</div>
    </section>
  );
}

const refundSections = [
  [
    "At a glance",
    "Cancel up to 14 days before race day for a 90% refund. Within 14 days, registrations are non-transferable and non-refundable except where the organizer cancels the event.",
  ],
  [
    "Cancellation by the participant",
    "Requests received on or before 05 Jul 2026 are eligible for the published refund window. After that date, medical exceptions are reviewed by the organizer support desk.",
  ],
  [
    "Cancellation or postponement by the organizer",
    "If CODISSIA access, weather, civic restrictions, or safety guidance require postponement, your entry moves to the new date or may be refunded under organizer instructions.",
  ],
  [
    "Refund timelines",
    "Approved refunds are processed within 5–7 business days to your original payment method.",
  ],
  [
    "How refunds are issued",
    "Track a refund as Refund Requested → Refund Processing → Refunded on your registration page.",
  ],
  [
    "Non-refundable items",
    "Personal travel, accommodation, merchandise already collected, and payment gateway deductions are outside the refundable race fee.",
  ],
  [
    "How to request a refund",
    "Email support@coimbatorerunners.example with your registration ID, participant name, category, and reason.",
  ],
  ["Contact", "Coimbatore Runners Trust, Race Course Road desk, WhatsApp +91 98765 43210."],
] as const;

export function RefundPolicyPage({ event, demo }: { event: Event; demo?: DemoState }) {
  const state = demoValue(demo);
  const cta = useMemo(() => <PolicyBackCta event={event} />, [event]);

  useStickyCta(cta);

  if (state === "loading") {
    return <PolicyLoading title="Refund & cancellation policy" event={event} />;
  }

  if (state === "error") {
    return (
      <section className="space-y-5 py-3">
        <BackLink event={event} />
        <EmptyState
          title="Refund policy unavailable"
          description="This demo simulates a missing organizer policy."
          action={
            <Button asChild>
              <Link to="/events/$eventId" params={{ eventId: event.slug }}>
                Return to event
              </Link>
            </Button>
          }
        />
      </section>
    );
  }

  return (
    <PolicyLayout
      event={event}
      title="Refund & Cancellation Policy"
      label="P-04 · Legal"
      demo={state}
      sections={refundSections}
    />
  );
}

const waiverSections = [
  [
    "Medical self-declaration",
    "I confirm that I am medically fit to participate in the selected 5K, 10K, or 21K category and have disclosed relevant medical conditions before race day.",
  ],
  [
    "Assumption of risk",
    "I understand distance running includes risks such as dehydration, falls, heat stress, traffic proximity, and crowding. I choose to participate voluntarily.",
  ],
  [
    "Race-day conduct",
    "I will follow marshal, medical, police, and organizer instructions, remain on the marked route, and stop if advised by the medical team.",
  ],
  [
    "Emergency care",
    "I authorize first aid, ambulance support, and reasonable emergency medical care if I am unable to consent during the event.",
  ],
  [
    "Media and results",
    "I permit the organizer to publish my name, BIB number, category, timing result, and event photographs for race operations and certificates.",
  ],
  [
    "Guardian declaration",
    "For minors, a parent or guardian confirms consent, emergency contact details, and responsibility for truthful medical information.",
  ],
  [
    "Privacy notice",
    "Corral and the organizer use participant data only for registration, race operations, communications, results, certificates, and support.",
  ],
  [
    "Acknowledgement",
    "By continuing registration, I acknowledge this waiver and medical declaration for Coimbatore Marathon 2026.",
  ],
] as const;

export function WaiverPolicyPage({ event, demo }: { event: Event; demo?: DemoState }) {
  const state = demoValue(demo);
  const cta = useMemo(() => <PolicyBackCta event={event} />, [event]);

  useStickyCta(cta);

  if (state === "loading") {
    return <PolicyLoading title="Waiver & medical declaration" event={event} />;
  }

  return (
    <PolicyLayout
      event={event}
      title="Waiver & Medical Declaration"
      label="P-05 · Full text"
      demo={state}
      sections={waiverSections}
    />
  );
}

function PolicyLoading({ title, event }: { title: string; event: Event }) {
  return (
    <section className="space-y-5 py-3" aria-busy="true">
      <BackLink event={event} />
      <h1 className="font-display font-black text-4xl text-brand-navy">{title}</h1>
      <CardSkeleton className="rounded-[2rem]" />
      <CardSkeleton className="rounded-[2rem]" />
    </section>
  );
}

function PolicyLayout({
  event,
  title,
  label,
  demo,
  sections,
}: {
  event: Event;
  title: string;
  label: string;
  demo: DemoState;
  sections: readonly (readonly [string, string])[];
}) {
  const anchors = useMemo(
    () =>
      sections.map(([heading]) => heading.toLowerCase().replaceAll(" ", "-").replaceAll("/", "-")),
    [sections],
  );

  return (
    <article className="space-y-5 py-3">
      <BackLink event={event} />
      {demo === "offline" ? (
        <DegradedBanner
          mode="offline"
          title="Offline copy"
          description="Showing cached policy text. Registration actions stay local in this frontend demo."
        />
      ) : null}
      <header className="rounded-[2rem] border border-orange-100 bg-card p-6 shadow-lg">
        <PageKicker>{label}</PageKicker>
        <h1 className="mt-4 font-display font-black text-4xl leading-none tracking-[-0.05em] text-brand-navy">
          {title}
        </h1>
        <p className="mt-3 text-muted-foreground text-sm">
          {event.title} · Last updated 02 Jun 2026 · v1.2
        </p>
        <nav className="mt-5 flex flex-wrap gap-2" aria-label="Policy sections">
          {sections.map(([heading], index) => (
            <Button
              key={heading}
              asChild
              variant="outline"
              size="sm"
              className="min-h-11 rounded-full"
            >
              <a href={`#${anchors[index]}`}>
                {index + 1}. {heading}
              </a>
            </Button>
          ))}
        </nav>
      </header>

      <Alert className="border-info/30 bg-info/10 text-info-text">
        <span aria-hidden="true">ⓘ</span>
        <AlertTitle>At a glance</AlertTitle>
        <AlertDescription className="text-info-text/90">
          Race date {formatDate(event.startsAt)} at {event.venue.name}. Keep a copy of this page
          with your registration confirmation.
        </AlertDescription>
      </Alert>

      {sections.map(([heading, body], index) => (
        <section
          key={heading}
          id={anchors[index]}
          className="scroll-mt-24 rounded-[2rem] border border-border bg-card p-5 text-sm leading-7 text-muted-foreground shadow-sm"
        >
          <h2 className="font-display font-black text-2xl tracking-[-0.03em] text-brand-navy">
            {index + 1}. {heading}
          </h2>
          <p className="mt-3">{body}</p>
        </section>
      ))}
    </article>
  );
}
