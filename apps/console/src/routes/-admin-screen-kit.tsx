import { Alert, AlertDescription, AlertTitle } from "@corral/ui/components/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@corral/ui/components/card";
import { EmptyState } from "@corral/ui/components/empty-state";
import { Input } from "@corral/ui/components/input";
import { Skeleton } from "@corral/ui/components/skeleton";
import { StatusBadge, type StatusKind } from "@corral/ui/components/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@corral/ui/components/table";
import { Textarea } from "@corral/ui/components/textarea";
import type { ReactNode } from "react";

import {
  mockAuditEntries,
  mockDeliveries,
  mockEvents,
  mockJobs,
  mockOpsHealth,
  mockOrganizers,
  parseDemoState,
} from "../mocks";
import type { DemoState, PersonaId } from "../mocks/types";

export type AdminDemoSearch = {
  demo: DemoState;
  as?: PersonaId;
  tab?: string;
  ticket?: string;
  component?: string;
  q?: string;
};

const personas: PersonaId[] = [
  "org-owner",
  "org-staff",
  "org-readonly",
  "corral-admin",
  "corral-admin-impersonating",
  "session-expired",
  "access-denied",
];

export function validateAdminDemoSearch(search: Record<string, unknown>): AdminDemoSearch {
  const as =
    typeof search.as === "string" && personas.includes(search.as as PersonaId)
      ? (search.as as PersonaId)
      : undefined;
  return {
    demo: parseDemoState(search.demo),
    as,
    tab: typeof search.tab === "string" ? search.tab : undefined,
    ticket: typeof search.ticket === "string" ? search.ticket : undefined,
    component: typeof search.component === "string" ? search.component : undefined,
    q: typeof search.q === "string" ? search.q : undefined,
  };
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-[2rem] border border-border bg-card shadow-xl shadow-slate-950/5">
      <div className="relative p-6 xl:p-8">
        <div
          className="absolute inset-y-0 right-0 hidden w-1/3 bg-[radial-gradient(circle_at_top_right,#ff5a0022,transparent_58%)] xl:block"
          aria-hidden="true"
        />
        <div className="relative flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.35em] text-primary">{eyebrow}</p>
            <h2 className="mt-2 font-display text-5xl font-black uppercase leading-none tracking-tight text-foreground">
              {title}
            </h2>
            <p className="mt-3 max-w-2xl text-muted-foreground">{description}</p>
          </div>
          {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
        </div>
      </div>
    </div>
  );
}

export function KpiCard({
  label,
  value,
  status,
  statusLabel,
  icon,
}: {
  label: string;
  value: string;
  status: StatusKind;
  statusLabel: string;
  icon?: ReactNode;
}) {
  return (
    <Card className="rounded-2xl shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-muted-foreground">
              {label}
            </p>
            <p className="mt-2 font-display text-4xl font-black leading-none">{value}</p>
          </div>
          <span className="rounded-xl bg-secondary p-2 text-primary" aria-hidden="true">
            {icon ?? <span aria-hidden="true">safe</span>}
          </span>
        </div>
        <StatusBadge className="mt-4" status={status} label={statusLabel} />
      </CardContent>
    </Card>
  );
}

export function KpiGrid({ children }: { children: ReactNode }) {
  return <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{children}</div>;
}

export function DemoBoundary({
  demo,
  children,
  emptyTitle = "No records for this view",
  emptyDescription = "Adjust filters or switch demo state to default.",
  dark = false,
}: {
  demo: DemoState;
  children: ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  dark?: boolean;
}) {
  if (demo === "loading") {
    return (
      <div className="grid gap-4">
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    );
  }
  if (demo === "empty") {
    return (
      <EmptyState
        icon={<span aria-hidden="true">doc</span>}
        title={emptyTitle}
        description={emptyDescription}
      />
    );
  }
  if (demo === "permission-denied") {
    return (
      <Alert
        className={
          dark
            ? "border-[#fbbf24]/40 bg-[#fbbf24]/10 text-[#f1f5f9]"
            : "border-warning/30 bg-warning/10"
        }
      >
        <span aria-hidden="true">lock</span>
        <AlertTitle>Sensitive action blocked</AlertTitle>
        <AlertDescription className={dark ? "text-[#cbd5e1]" : undefined}>
          Owner/Admin permission and an audit reason are required before changing billing, exports,
          retries, payloads, or access.
        </AlertDescription>
      </Alert>
    );
  }
  if (demo === "error") {
    return (
      <Alert
        className={
          dark
            ? "border-[#ff4d4d]/50 bg-[#ff4d4d]/10 text-[#f1f5f9]"
            : "border-danger/30 bg-danger/10"
        }
      >
        <span aria-hidden="true">x</span>
        <AlertTitle>Demo failure state</AlertTitle>
        <AlertDescription className={dark ? "text-[#cbd5e1]" : undefined}>
          The fixture intentionally shows a recoverable failure. No network or backend request was
          made.
        </AlertDescription>
      </Alert>
    );
  }
  return <>{children}</>;
}

export function FilterBar({
  placeholder = "Search Coimbatore fixtures…",
  children,
}: {
  placeholder?: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm xl:flex-row xl:items-center">
      <Input className="min-h-11 xl:max-w-sm" placeholder={placeholder} aria-label={placeholder} />
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

export function Chip({ children }: { children: ReactNode }) {
  return (
    <button
      type="button"
      className="min-h-10 rounded-full border border-border bg-background px-3 text-sm font-semibold text-foreground hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      {children}
    </button>
  );
}

export function cells(...items: ReactNode[]) {
  return items;
}

function cellText(cell: ReactNode) {
  if (typeof cell === "string" || typeof cell === "number") {
    return String(cell);
  }
  return "";
}

export function MiniTable({
  headers,
  rows,
  caption,
}: {
  headers: string[];
  rows: ReactNode[][];
  caption: string;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <Table>
        <caption className="sr-only">{caption}</caption>
        <TableHeader className="bg-secondary/70">
          <TableRow>
            {headers.map((header) => (
              <TableHead key={header} scope="col" className="px-4 py-3 font-bold text-foreground">
                {header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={`${caption}-${row.map(cellText).join("-")}`}>
              {row.map((cell, cellIndex) => (
                <TableCell key={headers[cellIndex]} className="px-4 py-4 align-top">
                  {cell}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function DetailCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle className="font-display text-2xl uppercase">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 text-sm">{children}</CardContent>
    </Card>
  );
}

export function AuditReasonBox({ label = "Audit reason required" }: { label?: string }) {
  return (
    <div className="grid gap-2 rounded-2xl border border-warning/30 bg-warning/10 p-4">
      <label className="text-sm font-bold text-warning-text" htmlFor="audit-reason">
        {label}
      </label>
      <Textarea
        id="audit-reason"
        placeholder="Example: Organizer requested support after phone verification; record reason before proceeding."
      />
    </div>
  );
}

export const organizerRows = [
  {
    organizer: mockOrganizers[0],
    entity: "GST verified",
    health: "Healthy",
    owner: "Meena S.",
    package: "Assisted Event Pack",
    payment: "Razorpay Route active",
    gst: "33AABTC4587F1Z2",
  },
  {
    organizer: mockOrganizers[1],
    entity: "GST submitted — review",
    health: "Publish gate warnings",
    owner: "Arun P.",
    package: "Race-Day Support Pack",
    payment: "Payment account pending",
    gst: "33AAFCW7720P1Z8",
  },
  {
    organizer: {
      ...mockOrganizers[0],
      id: "org-codissia",
      name: "CODISSIA Fitness Forum",
      legalName: "CODISSIA Industrial Parks Ltd",
      city: "Coimbatore",
      eventsCount: 1,
    },
    entity: "GST missing",
    health: "Needs setup",
    owner: "Priya N.",
    package: "Starter Pilot",
    payment: "Not started",
    gst: "Missing",
  },
  {
    organizer: {
      ...mockOrganizers[1],
      id: "org-pollachi",
      name: "Pollachi Runners Collective",
      legalName: "Individual proprietor",
      city: "Pollachi",
      eventsCount: 0,
    },
    entity: "Unregistered entity",
    health: "Onboarding",
    owner: "Unassigned",
    package: "Design Partner",
    payment: "Manual review",
    gst: "N/A",
  },
] as const;

export const calendarSeeds = [
  {
    title: "Coimbatore Marathon 2026",
    date: "12 Jul 2026",
    venue: "CODISSIA Trade Fair Complex",
    type: "Corral hosted",
    status: "Published",
    owner: "Kovai Road Runners",
  },
  {
    title: "Race Course Night 10K",
    date: "03 Oct 2026",
    venue: "Race Course Road",
    type: "Corral draft",
    status: "Needs copy",
    owner: "Kovai Road Runners",
  },
  {
    title: "Pollachi Half Marathon",
    date: "15 Nov 2026",
    venue: "Pollachi bus stand loop",
    type: "Club listing",
    status: "Seeded",
    owner: "Pollachi Runners Collective",
  },
  {
    title: "Marudhamalai Hill Repeats",
    date: "06 Dec 2026",
    venue: "Marudhamalai foothills",
    type: "External",
    status: "Verify source",
    owner: "CFR Running Club",
  },
] as const;

export const supportTickets = [
  {
    id: "CRL-2407",
    requester: "Nisha Varadarajan · +91 98•••2244",
    context: "Race Course 10K · CFR Running Club",
    type: "DPDP access request",
    verification: "Verification needed",
    due: "18 Jul, 17:00",
    status: "Open",
    owner: "Meena",
  },
  {
    id: "CRL-2408",
    requester: "Arvind B.",
    context: "Coimbatore Marathon 2026",
    type: "Registration correction",
    verification: "Verified",
    due: "Tomorrow",
    status: "In progress",
    owner: "Arun",
  },
  {
    id: "CRL-2409",
    requester: "Parent: Lakshmi R. for minor Aditya R.",
    context: "Kids Fun Run",
    type: "Minor guardian request",
    verification: "Guardian proof needed",
    due: "2 days",
    status: "Waiting on requester",
    owner: "Priya",
  },
  {
    id: "CRL-2399",
    requester: "Divya S.",
    context: "Pollachi Trail Run",
    type: "DPDP correction request",
    verification: "Verified",
    due: "Closed",
    status: "Resolved",
    owner: "Priya",
  },
] as const;

export const opsIncidents = [
  {
    severity: "Info",
    status: "Healthy",
    component: "Worker: comms",
    event: "All events",
    symptom: "Processing normally",
    impact: "No participant impact",
    id: "comms:*",
    attempts: "0 retries",
    owner: "Ops",
    updated: "12s ago",
  },
  {
    severity: "Critical",
    status: "Failed jobs",
    component: "PDF worker",
    event: "Coimbatore Marathon 2026",
    symptom: "Certificate PDF render failed for 23 records",
    impact: "Certificates delayed; results safe",
    id: "pdf:cert:94821",
    attempts: "3/5",
    owner: "Arun",
    updated: "2 min ago",
  },
  {
    severity: "Warning",
    status: "Webhook retrying",
    component: "Razorpay webhook",
    event: "Race Course 10K",
    symptom: "Paid — Awaiting Webhook records not confirmed yet",
    impact: "Payment confirmation delayed; registration saved",
    id: "webhook:rzp:7720",
    attempts: "2/8",
    owner: "Meena",
    updated: "4 min ago",
  },
  {
    severity: "Warning",
    status: "Queue backlog",
    component: "Comms queue",
    event: "Pollachi Half Marathon",
    symptom: "1,240 WhatsApp messages queued",
    impact: "Delivery delayed; fallback not needed yet",
    id: "queue:comms",
    attempts: "08:24 latency",
    owner: "Priya",
    updated: "6 min ago",
  },
  {
    severity: "Critical",
    status: "PDF/storage errors",
    component: "Storage uploads",
    event: "Kovai Trail Run",
    symptom: "Timing CSV upload failing",
    impact: "Result import delayed; manual backup available",
    id: "storage:r2:csv",
    attempts: "4/5",
    owner: "Arun",
    updated: "8 min ago",
  },
];

export function statusKind(label: string): StatusKind {
  if (/healthy|verified|delivered|read|resolved|published|active|none/i.test(label)) return "ok";
  if (/failed|missing|critical|error|rejected|overdue/i.test(label)) return "error";
  if (/pending|review|warning|retry|queued|waiting|backlog|needed|risk|delayed/i.test(label))
    return "warning";
  if (/open|draft|seeded|sent|progress/i.test(label)) return "info";
  return "neutral";
}

export function iconFor(label: string) {
  if (/calendar/i.test(label)) return <span aria-hidden="true">cal</span>;
  if (/support|ticket/i.test(label)) return <span aria-hidden="true">support</span>;
  if (/audit|privacy|gst|verified/i.test(label)) return <span aria-hidden="true">safe</span>;
  if (/due|pending|queue|elapsed/i.test(label)) return <span aria-hidden="true">time</span>;
  if (/failed|error|critical/i.test(label)) return <span aria-hidden="true">!</span>;
  return <span aria-hidden="true">ok</span>;
}

export { mockAuditEntries, mockDeliveries, mockEvents, mockJobs, mockOpsHealth, mockOrganizers };
