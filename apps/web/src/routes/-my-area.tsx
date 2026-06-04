import { Button } from "@corral/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@corral/ui/components/card";
import { EmptyState } from "@corral/ui/components/empty-state";
import { Skeleton } from "@corral/ui/components/skeleton";
import { StatusBadge, type StatusKind } from "@corral/ui/components/status-badge";
import type { LinkProps } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { featuredEvent, participantEvents } from "../mocks/events";
import { participantInsurancePolicies } from "../mocks/insurance";
import { participantRegistrations } from "../mocks/registrations";
import { participantResults } from "../mocks/results";
import { participantTickets } from "../mocks/tickets";
import type { DemoState, Event, Registration, Result, Ticket } from "../mocks/types";
import { formatDate, formatINR, formatTime, parseDemoState } from "../mocks/utils";

export type DemoSearch = {
  demo?: DemoState;
  q?: string;
  view?: "overall" | "category" | "age-group";
};

export function validateDemoSearch(search: Record<string, unknown>): DemoSearch {
  const view = search.view === "category" || search.view === "age-group" ? search.view : "overall";

  return {
    demo: parseDemoState(typeof search.demo === "string" ? search.demo : undefined),
    q: typeof search.q === "string" ? search.q : undefined,
    view,
  };
}

export function getEvent(eventId: string) {
  return participantEvents.find((event) => event.slug === eventId || event.id === eventId);
}

export function getRegistrationBundle(registrationId: string) {
  const registration = participantRegistrations.find((item) => item.id === registrationId);
  if (!registration) {
    return undefined;
  }

  const event = getEvent(registration.eventId) ?? featuredEvent;
  const category =
    event.categories.find((item) => item.id === registration.categoryId) ?? event.categories[0];
  if (!category) {
    return undefined;
  }
  const ticket = participantTickets.find((item) => item.registrationId === registration.id);
  const result = participantResults.find((item) => item.registrationId === registration.id);
  const policy = participantInsurancePolicies.find(
    (item) => item.registrationId === registration.id,
  );

  return { registration, event, category, ticket, result, policy };
}

export function demoTicketState(
  demo: DemoState,
  registration: Registration,
  ticket?: Ticket,
  result?: Result,
) {
  if (demo === "validation-error") {
    return { label: "OTP required", status: "warning" as StatusKind, bib: "TBD", locked: true };
  }
  if (demo === "error") {
    return { label: "Magic link expired", status: "error" as StatusKind, bib: "TBD", locked: true };
  }
  if (demo === "loading") {
    return { label: "Loading ticket", status: "pending" as StatusKind, bib: "TBD", locked: false };
  }
  if (demo === "empty") {
    return { label: "BIB assigning soon", status: "info" as StatusKind, bib: "TBD", locked: false };
  }
  if (registration.paymentStatus === "pending" || demo === "webhook-pending") {
    return { label: "Payment pending", status: "pending" as StatusKind, bib: "TBD", locked: false };
  }
  if (demo === "success" || result?.certificateReady) {
    return {
      label: "Certificate ready",
      status: "ok" as StatusKind,
      bib: ticket?.bibNumber ?? "1042",
      locked: false,
    };
  }
  if (demo === "offline" || result?.status === "live") {
    return {
      label: "Results live",
      status: "ok" as StatusKind,
      bib: ticket?.bibNumber ?? "1042",
      locked: false,
    };
  }
  if (ticket && ticket.bibNumber !== "TBD") {
    return {
      label: `BIB assigned: ${ticket.bibNumber}`,
      status: "ok" as StatusKind,
      bib: ticket.bibNumber,
      locked: false,
    };
  }

  return { label: "Confirmed", status: "ok" as StatusKind, bib: "TBD", locked: false };
}

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-bold text-[0.68rem] uppercase tracking-[0.24em] text-brand-orange-strong">
            {eyebrow}
          </p>
          <h1 className="mt-2 font-display font-black text-4xl leading-[0.9] tracking-[-0.06em] text-brand-navy">
            {title}
          </h1>
        </div>
        {action}
      </div>
      <p className="text-sm leading-6 text-muted-foreground">{description}</p>
    </div>
  );
}

export function BackLink({
  children,
  to,
  params,
}: {
  children: ReactNode;
  to: LinkProps["to"];
  params?: LinkProps["params"];
}) {
  return (
    <Button asChild variant="ghost" className="min-h-11 rounded-2xl px-0 text-muted-foreground">
      <Link to={to} params={params}>
        ← {children}
      </Link>
    </Button>
  );
}

export function DemoSkeleton() {
  return (
    <section className="space-y-4 py-3" aria-label="Loading screen preview">
      <Skeleton className="h-28 rounded-[2rem]" />
      <Skeleton className="h-64 rounded-[2rem]" />
      <Skeleton className="h-40 rounded-[2rem]" />
    </section>
  );
}

export function InfoCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card className="rounded-[1.75rem] border-orange-100 shadow-lg shadow-slate-950/5">
      <CardHeader>
        <CardTitle className="font-display text-2xl tracking-[-0.04em] text-brand-navy">
          {title}
        </CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export function FieldList({ rows }: { rows: Array<{ label: string; value: ReactNode }> }) {
  return (
    <dl className="divide-y divide-border rounded-3xl border bg-white">
      {rows.map((row) => (
        <div key={row.label} className="grid grid-cols-[7rem_1fr] gap-3 px-4 py-3 text-sm">
          <dt className="text-muted-foreground">{row.label}</dt>
          <dd className="font-semibold text-brand-navy">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function NavTile({
  title,
  description,
  to,
  params,
  disabled,
}: {
  title: string;
  description: string;
  to: LinkProps["to"];
  params?: LinkProps["params"];
  disabled?: boolean;
}) {
  const content = (
    <div
      className={`min-h-20 rounded-3xl border p-4 text-left transition ${disabled ? "border-dashed bg-muted/60 text-muted-foreground" : "border-orange-100 bg-white shadow-sm shadow-slate-950/5 hover:-translate-y-0.5 hover:border-orange-200 motion-reduce:hover:translate-y-0"}`}
    >
      <p className="font-display font-bold text-lg tracking-[-0.03em] text-brand-navy">{title}</p>
      <p className="mt-1 text-sm leading-5 text-muted-foreground">{description}</p>
    </div>
  );

  if (disabled) {
    return <div aria-disabled="true">{content}</div>;
  }

  return (
    <Link
      to={to}
      params={params}
      className="block rounded-3xl focus:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
    >
      {content}
    </Link>
  );
}

const qrCells = Array.from({ length: 26 }, (_, index) => {
  const x = 48 + ((index * 13) % 56);
  const y = 48 + ((index * 19) % 58);
  const size = index % 3 === 0 ? 10 : 6;

  return { id: `cell-${x}-${y}-${size}`, x, y, size };
});

export function InlineQr({ label }: { label: string }) {
  return (
    <svg
      role="img"
      aria-label={`QR ticket placeholder for ${label}`}
      viewBox="0 0 120 120"
      className="size-44 rounded-[1.5rem] bg-white p-3 shadow-inner"
    >
      <rect width="120" height="120" rx="18" fill="white" />
      <g fill="#0f172a">
        <rect x="10" y="10" width="30" height="30" rx="4" />
        <rect x="80" y="10" width="30" height="30" rx="4" />
        <rect x="10" y="80" width="30" height="30" rx="4" />
        {qrCells.map((cell) => (
          <rect key={cell.id} x={cell.x} y={cell.y} width={cell.size} height={cell.size} rx="1" />
        ))}
      </g>
      <text
        x="60"
        y="67"
        textAnchor="middle"
        className="fill-brand-orange-strong font-bold text-[8px]"
      >
        CORRAL
      </text>
    </svg>
  );
}

export function StatusPill({ status, label }: { status: StatusKind; label: string }) {
  return <StatusBadge status={status} label={label} className="min-h-8 rounded-full px-3" />;
}

export function MissingState({
  title = "Nothing to show yet",
  description,
}: {
  title?: string;
  description: ReactNode;
}) {
  return (
    <EmptyState
      title={title}
      description={description}
      className="rounded-[2rem] border-orange-100 bg-white"
    />
  );
}

export function eventDateLine(event: Event) {
  return `${formatDate(event.startsAt)} · ${formatTime(event.startsAt)} · ${event.venue.name}`;
}

export function categoryName(event: Event, categoryId: string) {
  return event.categories.find((category) => category.id === categoryId)?.name ?? "Open category";
}

export function ticketAmount(registration: Registration) {
  return formatINR(registration.orderSummary.total);
}

export const resultVariants: Record<
  DemoState,
  { status: StatusKind; label: string; time: string; note: string }
> = {
  default: { status: "ok", label: "Finished", time: "00:54:18", note: "Net 54:12 · Gun 55:04" },
  empty: { status: "neutral", label: "DNS", time: "DNS", note: "Did not start · no certificate" },
  loading: {
    status: "pending",
    label: "Loading",
    time: "—",
    note: "Fetching published timing packet",
  },
  error: { status: "error", label: "DQ", time: "DQ", note: "Disqualified after timing review" },
  "validation-error": {
    status: "warning",
    label: "DNF",
    time: "DNF",
    note: "Started but did not finish",
  },
  success: { status: "ok", label: "Finished", time: "00:54:18", note: "Age graded 68.4%" },
  "permission-denied": {
    status: "error",
    label: "DQ",
    time: "DQ",
    note: "Result withheld pending organizer support",
  },
  offline: {
    status: "warning",
    label: "DNS",
    time: "DNS",
    note: "Offline copy · reconnect for final rank",
  },
  "webhook-pending": {
    status: "ok",
    label: "Results live",
    time: "00:54:18",
    note: "Provisional rankings live",
  },
};
