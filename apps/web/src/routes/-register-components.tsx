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
import { Progress } from "@corral/ui/components/progress";
import { CardSkeleton, FormSkeleton } from "@corral/ui/components/skeletons";
import { Link, notFound, Outlet, useLocation } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { participantEvents } from "../mocks/events";
import { defaultInsurancePolicy } from "../mocks/insurance";
import type { Category, DemoState, Event, ParticipantFormData } from "../mocks/types";
import { formatDate, formatINR, parseDemoState } from "../mocks/utils";

export type RegisterSearch = {
  demo?: DemoState;
  reason?: "gateway-fail" | "user-abandoned" | "webhook-pending" | "duplicate";
};

export function validateRegisterSearch(search: Record<string, unknown>): RegisterSearch {
  const demo = parseDemoState(typeof search.demo === "string" ? search.demo : undefined);
  const reason = typeof search.reason === "string" ? search.reason : undefined;

  return {
    demo: demo === "default" ? undefined : demo,
    reason:
      reason === "user-abandoned" || reason === "webhook-pending" || reason === "duplicate"
        ? reason
        : reason === "gateway-fail"
          ? reason
          : undefined,
  };
}

export function getDemo(search: Partial<RegisterSearch>) {
  return search.demo ?? "default";
}

export function findEvent(eventId: string): Event {
  const event = participantEvents.find((item) => item.id === eventId || item.slug === eventId);

  if (!event) {
    throw notFound();
  }

  return event;
}

export function activeTier(category: Category) {
  const fallback = category.feeTiers[0];
  if (!fallback) {
    throw new Error("Category has no fee tiers");
  }

  return category.feeTiers.find((tier) => tier.active) ?? fallback;
}

export function categoryById(event: Event, categoryId?: string) {
  const fallback = event.categories[0];
  if (!fallback) {
    throw new Error("Event has no categories");
  }

  return event.categories.find((category) => category.id === categoryId) ?? fallback;
}

export function capacityLabel(category: Category) {
  const remaining = Math.max(category.capacity - category.registeredCount, 0);

  if (category.status === "sold-out") {
    return "⛔ Sold out";
  }

  if (remaining <= 25) {
    return `⚠ ${remaining} spots left`;
  }

  return `✓ ${remaining.toLocaleString("en-IN")} spots open`;
}

export function participantName(participant: ParticipantFormData) {
  return `${participant.firstName} ${participant.lastName}`.trim() || "Runner";
}

export function calculateAge(dateOfBirth?: string) {
  if (!dateOfBirth) {
    return undefined;
  }

  const dob = new Date(dateOfBirth);

  if (Number.isNaN(dob.getTime())) {
    return undefined;
  }

  const raceDate = new Date("2026-07-19T05:00:00+05:30");
  let age = raceDate.getFullYear() - dob.getFullYear();
  const monthDiff = raceDate.getMonth() - dob.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && raceDate.getDate() < dob.getDate())) {
    age -= 1;
  }

  return age;
}

export function ageGroupLabel(age?: number) {
  if (age === undefined) {
    return "DOB sets your race age group";
  }

  if (age < 18) {
    return `Under 18 · guardian consent required · race age ${age}`;
  }

  if (age >= 40) {
    return `Masters · race age ${age}`;
  }

  return `Open · race age ${age}`;
}

export function nextAfterConsent(eventId: string, isMinor: boolean, hasGuardian: boolean) {
  return isMinor && !hasGuardian
    ? `/events/${eventId}/register/guardian`
    : `/events/${eventId}/register/insurance`;
}

export function selectedInsurance() {
  if (!defaultInsurancePolicy) {
    throw new Error("Missing default insurance policy");
  }

  return defaultInsurancePolicy;
}

export function WizardLayout({ event }: { event: Event }) {
  const { pathname } = useLocation();
  const steps = [
    ["category", "Distance"],
    ["form", "Runner"],
    ["waiver", "Consent"],
    ["insurance", "Add-ons"],
    ["summary", "Pay"],
    ["success", "Done"],
  ] as const;
  const activeIndex = Math.max(
    0,
    steps.findIndex(([segment]) => pathname.includes(`/register/${segment}`)),
  );
  const progress = ((activeIndex + 1) / steps.length) * 100;

  return (
    <section className="space-y-4 py-3">
      <Card className="overflow-hidden rounded-[2rem] border-orange-100 bg-white shadow-xl shadow-slate-950/5">
        <CardHeader className="gap-3 pb-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-bold text-[0.68rem] uppercase tracking-[0.22em] text-brand-orange-strong">
                Registration checkout
              </p>
              <CardTitle className="font-display text-3xl tracking-[-0.05em] text-brand-navy">
                {event.title}
              </CardTitle>
              <CardDescription>
                {formatDate(event.startsAt)} · {event.venue.name}
              </CardDescription>
            </div>
            <Badge className="rounded-full bg-orange-50 text-brand-orange-strong">
              Light · 390px
            </Badge>
          </div>
          <Progress value={progress} aria-label="Registration progress" />
          <ol className="grid grid-cols-3 gap-2 text-[0.68rem] sm:grid-cols-6">
            {steps.map(([segment, label], index) => (
              <li
                key={segment}
                className={`rounded-full px-2 py-1 text-center font-semibold ${
                  index <= activeIndex
                    ? "bg-orange-50 text-brand-orange-strong"
                    : "bg-secondary text-muted-foreground"
                }`}
              >
                {label}
              </li>
            ))}
          </ol>
        </CardHeader>
      </Card>
      <Outlet />
    </section>
  );
}

export function RegisterScreen({
  eyebrow,
  title,
  description,
  children,
  demo,
  demoUrls,
}: {
  eyebrow: string;
  title: string;
  description: ReactNode;
  children: ReactNode;
  demo: DemoState;
  demoUrls: string[];
}) {
  if (demo === "loading") {
    return (
      <div className="space-y-4" aria-busy="true">
        <CardSkeleton />
        <FormSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {demo === "offline" ? (
        <DegradedBanner
          mode="offline"
          title="Offline demo"
          description="This frontend-only checkout keeps your draft locally; no backend call is made."
        />
      ) : null}
      {demo === "error" ? (
        <DegradedBanner
          mode="degraded"
          title="Demo error state"
          description="Use retry or a back link; the mocked checkout never calls a network."
        />
      ) : null}
      <div className="rounded-[2rem] border border-orange-100 bg-[linear-gradient(145deg,#fff7ed,#ffffff_48%,#eff6ff)] p-5 shadow-lg shadow-slate-950/5">
        <p className="font-bold text-[0.68rem] uppercase tracking-[0.24em] text-brand-orange-strong">
          {eyebrow}
        </p>
        <h1 className="mt-3 font-display text-4xl leading-[0.95] tracking-[-0.06em] text-brand-navy">
          {title}
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
      {children}
      <Card className="rounded-[1.5rem] border-dashed border-orange-200 bg-orange-50/50">
        <CardContent className="space-y-2 p-4">
          <p className="font-bold text-xs uppercase tracking-[0.2em] text-brand-orange-strong">
            Demo URLs
          </p>
          <ul className="space-y-1 text-xs text-muted-foreground">
            {demoUrls.map((url) => (
              <li key={url} className="break-all">
                {url}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

export function StickyLinkCta({ to, label }: { to: string; label: string }) {
  return (
    <Button asChild className="h-12 w-full rounded-2xl text-base shadow-lg shadow-orange-500/25">
      <Link to={to as never}>{label}</Link>
    </Button>
  );
}

export function MoneyRow({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number;
  tone?: "default" | "discount" | "muted";
}) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className={tone === "muted" ? "text-muted-foreground" : "text-foreground"}>
        {label}
      </span>
      <span
        className={`font-semibold ${tone === "discount" ? "text-success-text" : "text-brand-navy"}`}
      >
        {tone === "discount" && value > 0 ? "−" : ""}
        {formatINR(value)}
      </span>
    </div>
  );
}
