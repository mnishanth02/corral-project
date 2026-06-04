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
import { Checkbox } from "@corral/ui/components/checkbox";
import { DataTable, type DataTableColumn } from "@corral/ui/components/data-table";
import { EmptyState } from "@corral/ui/components/empty-state";
import {
  ImportValidation,
  type ImportValidationIssue,
} from "@corral/ui/components/import-validation";
import { Input } from "@corral/ui/components/input";
import { Label } from "@corral/ui/components/label";
import { RadioGroup, RadioGroupItem } from "@corral/ui/components/radio-group";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@corral/ui/components/sheet";
import { StatusBadge, type StatusKind } from "@corral/ui/components/status-badge";
import { Textarea } from "@corral/ui/components/textarea";
import type { ReactNode } from "react";

import { useConsoleShell } from "../components/console-shell-context";
import { findMockEvent, mockPayments, mockRosterParticipants } from "../mocks";
import type { Event, EventDistance, PaymentStatusLabel, RosterParticipant } from "../mocks/types";

export type RosterDemo =
  | "default"
  | "empty"
  | "loading"
  | "filtered-empty"
  | "large-list"
  | "bulk-selected"
  | "drawer-open"
  | "validation-error"
  | "success"
  | "exporting"
  | "ready"
  | "unmapped"
  | "print"
  | "redacted"
  | "permission-denied";
const rosterDemoValues = [
  "default",
  "empty",
  "loading",
  "filtered-empty",
  "large-list",
  "bulk-selected",
  "drawer-open",
  "validation-error",
  "success",
  "exporting",
  "ready",
  "unmapped",
  "print",
  "redacted",
  "permission-denied",
] as const satisfies RosterDemo[];

export type RosterTableSearch = {
  demo: RosterDemo;
  q: string;
  category: "all" | EventDistance;
  payment: "all" | "paid" | "pending" | "review" | "cash" | "comp";
  bib: "all" | "assigned" | "missing";
  sort: "name" | "category" | "payment" | "bib" | "tshirt" | "registered";
  dir: "asc" | "desc";
  page: number;
  drawer?: string;
  selected: string;
};
export type SimpleRosterSearch = { demo: RosterDemo; page: number; q: string; as?: string };
export type RosterRow = RosterParticipant & {
  paymentMode: "UPI" | "Card" | "NetBanking" | "Cash" | "Comp" | "Direct UPI";
  chipCode: string;
  consent: "Complete" | "Needs guardian" | "Medical review";
};

const PAGE_SIZE = 10;
const formatter = new Intl.NumberFormat("en-IN");
const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});
const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

function isRosterDemo(value: unknown): value is RosterDemo {
  return typeof value === "string" && rosterDemoValues.includes(value as RosterDemo);
}
function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}
function asPage(value: unknown) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) && numberValue > 0 ? Math.floor(numberValue) : 1;
}

export function validateRosterTableSearch(search: Record<string, unknown>): RosterTableSearch {
  const categoryValues = ["all", "5K", "10K", "21K"] as const;
  const paymentValues = ["all", "paid", "pending", "review", "cash", "comp"] as const;
  const bibValues = ["all", "assigned", "missing"] as const;
  const sortValues = ["name", "category", "payment", "bib", "tshirt", "registered"] as const;
  return {
    demo: isRosterDemo(search.demo) ? search.demo : "default",
    q: asString(search.q),
    category: categoryValues.includes(search.category as RosterTableSearch["category"])
      ? (search.category as RosterTableSearch["category"])
      : "all",
    payment: paymentValues.includes(search.payment as RosterTableSearch["payment"])
      ? (search.payment as RosterTableSearch["payment"])
      : "all",
    bib: bibValues.includes(search.bib as RosterTableSearch["bib"])
      ? (search.bib as RosterTableSearch["bib"])
      : "all",
    sort: sortValues.includes(search.sort as RosterTableSearch["sort"])
      ? (search.sort as RosterTableSearch["sort"])
      : "name",
    dir: search.dir === "desc" ? "desc" : "asc",
    page: asPage(search.page),
    drawer: asString(search.drawer) || undefined,
    selected: asString(search.selected),
  };
}

export function validateSimpleRosterSearch(search: Record<string, unknown>): SimpleRosterSearch {
  return {
    demo: isRosterDemo(search.demo) ? search.demo : "default",
    page: asPage(search.page),
    q: asString(search.q),
    as: asString(search.as) || undefined,
  };
}

export function useActiveEventFromRoute(eventId: string): Event {
  useConsoleShell();
  const fallbackEvent = findMockEvent("coimbatore-marathon-2026");
  if (!fallbackEvent) {
    throw new Error("Default roster event fixture is missing.");
  }
  return findMockEvent(eventId) ?? fallbackEvent;
}

export function readEventIdFromLocation() {
  if (typeof window === "undefined") return "coimbatore-marathon-2026";
  return window.location.pathname.match(/\/events\/([^/]+)/)?.[1] ?? "coimbatore-marathon-2026";
}

export function readParticipantIdFromLocation() {
  if (typeof window === "undefined") return "";
  return window.location.pathname.match(/\/roster\/([^/?#]+)/)?.[1] ?? "";
}

function searchObjectFromLocation() {
  return Object.fromEntries(
    new URLSearchParams(typeof window === "undefined" ? "" : window.location.search),
  );
}

export function readRosterTableSearchFromLocation() {
  return validateRosterTableSearch(searchObjectFromLocation());
}

export function readSimpleRosterSearchFromLocation() {
  return validateSimpleRosterSearch(searchObjectFromLocation());
}

function seedMode(participant: RosterParticipant): RosterRow["paymentMode"] {
  const payment = mockPayments.find((item) => item.registrationId === participant.registrationId);
  if (participant.registrationId.endsWith("1004")) return "Cash";
  if (participant.registrationId.endsWith("1003")) return "Direct UPI";
  return payment?.method ?? "UPI";
}

function pick<T>(items: readonly [T, ...T[]], index: number): T {
  return items[index % items.length] ?? items[0];
}

const names = [
  ["Meera Subramanian", "Female", "Coimbatore"],
  ["Arjun Prakash", "Male", "Tiruppur"],
  ["Priya Narendran", "Female", "Erode"],
  ["Suresh Balan", "Male", "Coimbatore"],
  ["Nila Ramasamy", "Female", "Pollachi"],
  ["Vikram Rajan", "Male", "Coimbatore"],
  ["Farah Ahmed", "Female", "Mettupalayam"],
  ["Gokul Mani", "Male", "Coimbatore"],
  ["Janani Balaji", "Female", "Tiruppur"],
  ["Rohit Varadarajan", "Male", "Erode"],
  ["Sneha Raj", "Female", "Coimbatore"],
  ["Naveen Kumar", "Male", "Salem"],
  ["Aishwarya Ravi", "Female", "Coimbatore"],
  ["Bharath Kumar", "Male", "Namakkal"],
  ["Lavanya S", "Female", "Coimbatore"],
  ["Manoj G", "Male", "Pollachi"],
  ["Yazhini Murali", "Female", "Coimbatore"],
  ["Joseph Daniel", "Male", "Ooty"],
  ["Keerthana V", "Female", "Tiruppur"],
  ["Pranav Iyer", "Male", "Coimbatore"],
] as const;

export function getRosterRows(eventId: string, demo?: RosterDemo): RosterRow[] {
  if (demo === "empty") return [];
  const base = (mockRosterParticipants as readonly RosterParticipant[])
    .filter((participant) => participant.eventId === eventId)
    .map((participant, index) => ({
      ...participant,
      paymentMode: seedMode(participant),
      chipCode: participant.bibNumber ? `CBE-${participant.bibNumber}` : "—",
      consent: participant.medicalNotes
        ? "Medical review"
        : index === 2
          ? "Needs guardian"
          : "Complete",
    })) satisfies RosterRow[];
  if (eventId !== "coimbatore-marathon-2026") return base;
  const generated = names.map(([name, gender, city], index) => {
    const distance = pick(["5K", "10K", "21K"] as const, index);
    const bibNumber = index % 5 === 0 ? undefined : String(3000 + index);
    const status = pick(
      [
        "Paid & Confirmed",
        "Confirmation Sent",
        "Payment Pending",
        "Needs Review",
        "Settled",
      ] as const,
      index,
    );
    const mode = pick(["UPI", "Card", "Cash", "Comp", "Direct UPI"] as const, index);
    return {
      id: `participant-cbe-extra-${index + 1}`,
      eventId,
      registrationId: `reg-cbe-${1100 + index}`,
      name,
      email: `${name.toLowerCase().replaceAll(" ", ".")}@example.in`,
      phone: `+91 98${76520000 + index}`,
      age: 18 + (index % 39),
      gender: gender as RosterParticipant["gender"],
      city,
      distance,
      bibNumber,
      tshirtSize: pick(["XS", "S", "M", "L", "XL", "XXL"] as const, index),
      emergencyContactName: `${name.split(" ")[0]} family`,
      emergencyContactPhone: `+91 97${90044000 + index}`,
      medicalNotes: index % 7 === 0 ? "Allergy/condition declared; see medical desk" : undefined,
      paymentStatus: status,
      paymentMode: mode,
      checkInStatus: index % 4 === 0 ? "bib-issued" : "not-checked-in",
      registeredAt: `2026-02-${String(10 + (index % 18)).padStart(2, "0")}T0${index % 9}:30:00+05:30`,
      chipCode: bibNumber ? `CBE-${bibNumber}` : "—",
      consent: index % 7 === 0 ? "Medical review" : "Complete",
    } satisfies RosterRow;
  });
  return [...base, ...generated];
}

function statusKind(status: PaymentStatusLabel): StatusKind {
  if (["Paid & Confirmed", "Confirmation Sent", "Settled"].includes(status)) return "ok";
  if (
    ["Failed", "Duplicate Payment", "Refund Requested", "Refund Processing", "Refunded"].includes(
      status,
    )
  )
    return "error";
  if (["Needs Review", "Paid — Awaiting Webhook", "Settlement Pending"].includes(status))
    return "warning";
  return "pending";
}
function paymentBucket(row: RosterRow) {
  if (row.paymentMode === "Cash") return "cash";
  if (row.paymentMode === "Comp") return "comp";
  if (["Paid & Confirmed", "Confirmation Sent", "Settled"].includes(row.paymentStatus))
    return "paid";
  if (row.paymentStatus === "Needs Review") return "review";
  return "pending";
}
function compareRows(a: RosterRow, b: RosterRow, sort: RosterTableSearch["sort"]) {
  const value = (row: RosterRow) =>
    sort === "category"
      ? row.distance
      : sort === "payment"
        ? row.paymentStatus
        : sort === "bib"
          ? (row.bibNumber ?? "99999")
          : sort === "tshirt"
            ? row.tshirtSize
            : sort === "registered"
              ? row.registeredAt
              : row.name;
  return String(value(a)).localeCompare(String(value(b)), "en-IN", { numeric: true });
}
export function filterRoster(rows: RosterRow[], search: RosterTableSearch) {
  const filtered = rows.filter((row) => {
    const q = search.q.trim().toLowerCase();
    const matchesQ =
      !q ||
      [row.name, row.email, row.phone, row.bibNumber ?? "", row.registrationId].some((value) =>
        value.toLowerCase().includes(q),
      );
    return (
      matchesQ &&
      (search.category === "all" || row.distance === search.category) &&
      (search.payment === "all" || paymentBucket(row) === search.payment) &&
      (search.bib === "all" ||
        (search.bib === "assigned" ? Boolean(row.bibNumber) : !row.bibNumber))
    );
  });
  return filtered.sort((a, b) => (search.dir === "asc" ? 1 : -1) * compareRows(a, b, search.sort));
}
function selectedIds(search: RosterTableSearch) {
  return search.selected.split(",").filter(Boolean);
}
function urlWith(
  pathname: string,
  updates: Record<string, string | number | undefined>,
  search?: URLSearchParams,
) {
  const params = new URLSearchParams(
    search ?? (typeof window === "undefined" ? "" : window.location.search),
  );
  Object.entries(updates).forEach(([key, value]) => {
    if (value === undefined || value === "" || value === "all" || value === 1) params.delete(key);
    else params.set(key, String(value));
  });
  const query = params.toString();
  return `${pathname}${query ? `?${query}` : ""}`;
}
function go(updates: Record<string, string | number | undefined>) {
  window.location.href = urlWith(window.location.pathname, updates);
}

export function RosterPageShell({
  event,
  eyebrow,
  title,
  description,
  actions,
  children,
}: {
  event: Event;
  eyebrow: string;
  title: string;
  description: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border bg-card p-6 shadow-xl shadow-slate-950/5">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl space-y-3">
            <Badge variant="secondary" className="uppercase tracking-[0.18em]">
              {eyebrow}
            </Badge>
            <h1 className="font-display text-4xl font-black uppercase leading-none tracking-tight xl:text-5xl">
              {title}
            </h1>
            <p className="text-muted-foreground">{description}</p>
            <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
              <Badge variant="outline">{event.name}</Badge>
              <Badge variant="outline">{event.venueName}</Badge>
              <Badge variant="outline">{dateFormatter.format(new Date(event.date))}</Badge>
            </div>
          </div>
          {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
        </div>
      </div>
      <RosterSubnav eventId={event.id} />
      {children}
    </div>
  );
}
function RosterSubnav({ eventId }: { eventId: string }) {
  const links = [
    ["Roster", `/events/${eventId}/roster`],
    ["Import", `/events/${eventId}/roster/import`],
    ["Export", `/events/${eventId}/roster/export`],
    ["Spot reg", `/events/${eventId}/roster/spot`],
    ["T-shirts", `/events/${eventId}/roster/tshirts`],
    ["Medical", `/events/${eventId}/roster/medical`],
  ];
  return (
    <nav aria-label="Roster tools" className="flex flex-wrap gap-2">
      {links.map(([label, href]) => (
        <Button key={href} asChild variant="outline" size="sm">
          <a href={href}>{label}</a>
        </Button>
      ))}
    </nav>
  );
}
function PaymentBadge({ row }: { row: RosterRow }) {
  return (
    <div className="grid gap-1">
      <StatusBadge status={statusKind(row.paymentStatus)} label={row.paymentStatus} />
      <span className="text-xs text-muted-foreground">Mode: {row.paymentMode}</span>
    </div>
  );
}
function ParticipantSummary({ row }: { row: RosterRow }) {
  return (
    <div>
      <div className="font-medium text-foreground">{row.name}</div>
      <div className="text-xs text-muted-foreground">
        {row.registrationId} · {row.city}
      </div>
    </div>
  );
}

export function RosterIndexScreen({ event, search }: { event: Event; search: RosterTableSearch }) {
  const rows = getRosterRows(event.id, search.demo);
  const tableSearch =
    search.demo === "filtered-empty" ? { ...search, q: "zzzz-no-runner" } : search;
  const filtered = filterRoster(rows, tableSearch);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const page = Math.min(search.page, pageCount);
  const pageRows =
    search.demo === "loading" ? [] : filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const selected =
    search.demo === "bulk-selected" && !search.selected
      ? pageRows.slice(0, 3).map((row) => row.id)
      : selectedIds(search);
  const drawerId =
    search.drawer ?? (search.demo === "drawer-open" ? "participant-ananya-krishnan" : undefined);
  const drawerRow = rows.find((row) => row.id === drawerId);
  const columns: DataTableColumn<RosterRow>[] = [
    {
      id: "name",
      header: "Name",
      sortable: true,
      sortDirection: search.sort === "name" ? search.dir : false,
      onSort: () =>
        go({
          sort: "name",
          dir: search.sort === "name" && search.dir === "asc" ? "desc" : "asc",
          page: 1,
        }),
      cell: (row) => <ParticipantSummary row={row} />,
      className: "min-w-56",
    },
    {
      id: "category",
      header: "Category",
      sortable: true,
      sortDirection: search.sort === "category" ? search.dir : false,
      onSort: () => go({ sort: "category", dir: search.dir === "asc" ? "desc" : "asc", page: 1 }),
      cell: (row) => <Badge variant="secondary">{row.distance}</Badge>,
    },
    {
      id: "payment",
      header: "Payment",
      sortable: true,
      sortDirection: search.sort === "payment" ? search.dir : false,
      onSort: () => go({ sort: "payment", dir: search.dir === "asc" ? "desc" : "asc", page: 1 }),
      cell: (row) => <PaymentBadge row={row} />,
      className: "min-w-56",
    },
    {
      id: "contact",
      header: "Contact",
      cell: (row) => (
        <span className="grid gap-1 text-xs">
          <span>{row.phone}</span>
          <span className="text-muted-foreground">{row.email}</span>
        </span>
      ),
      className: "min-w-52",
    },
    {
      id: "emergency",
      header: "Emergency",
      cell: (row) => (
        <span className="grid gap-1 text-xs">
          <span>{row.emergencyContactName}</span>
          <span className="text-muted-foreground">{row.emergencyContactPhone}</span>
        </span>
      ),
      className: "min-w-48",
    },
    {
      id: "bib",
      header: "BIB",
      sortable: true,
      sortDirection: search.sort === "bib" ? search.dir : false,
      onSort: () => go({ sort: "bib", dir: search.dir === "asc" ? "desc" : "asc", page: 1 }),
      cell: (row) =>
        row.bibNumber ? (
          <span className="font-display text-xl font-black tabular-nums">{row.bibNumber}</span>
        ) : (
          <Badge variant="warning">Missing</Badge>
        ),
    },
    {
      id: "tshirt",
      header: "T-shirt",
      sortable: true,
      sortDirection: search.sort === "tshirt" ? search.dir : false,
      onSort: () => go({ sort: "tshirt", dir: search.dir === "asc" ? "desc" : "asc", page: 1 }),
      cell: (row) => row.tshirtSize,
    },
    {
      id: "actions",
      header: "Quick action",
      cell: (row) => (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={(clickEvent) => {
            clickEvent.stopPropagation();
            go({ drawer: row.id });
          }}
        >
          Correct
        </Button>
      ),
    },
  ];
  return (
    <RosterPageShell
      event={event}
      eyebrow="O-11 roster"
      title="Race roster control"
      description="Search, filter, sort and safely correct runners without leaving the navy organizer console."
      actions={
        <>
          <Button asChild variant="outline">
            <a href={`/events/${event.id}/roster/import`}>Import/update CSV</a>
          </Button>
          <Button asChild>
            <a href={`/events/${event.id}/roster/export`}>Export roster</a>
          </Button>
        </>
      }
    >
      <Card className="rounded-[2rem]">
        <CardHeader>
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <form
              className="grid gap-3 md:grid-cols-[minmax(18rem,1fr)_10rem_12rem_10rem_auto]"
              action={`/events/${event.id}/roster`}
              method="get"
            >
              <Field label="Global search">
                <Input name="q" defaultValue={search.q} placeholder="Ananya, 1042, phone…" />
              </Field>
              <SelectField
                name="category"
                label="Category"
                value={search.category}
                options={["all", "5K", "10K", "21K"]}
              />
              <SelectField
                name="payment"
                label="Payment"
                value={search.payment}
                options={["all", "paid", "pending", "review", "cash", "comp"]}
              />
              <SelectField
                name="bib"
                label="BIB"
                value={search.bib}
                options={["all", "assigned", "missing"]}
              />
              <Button type="submit">Apply</Button>
            </form>
            <div className="text-sm text-muted-foreground" aria-live="polite">
              {formatter.format(filtered.length)} shown · {formatter.format(rows.length)} total
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {[search.category, search.payment, search.bib]
              .filter((item) => item !== "all")
              .map((item) => (
                <Badge key={item} variant="info">
                  Filter: {item}
                </Badge>
              ))}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {selected.length > 0 ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/30 bg-brand-tint p-3">
              <strong>{selected.length} selected</strong>
              <span className="flex gap-2">
                <Button size="sm" asChild>
                  <a href={`/events/${event.id}/roster/export?selected=${selected.join(",")}`}>
                    Export selected
                  </a>
                </Button>
                <Button size="sm" variant="outline">
                  Message selected
                </Button>
              </span>
            </div>
          ) : null}
          <div className="overflow-x-auto">
            <DataTable
              data={pageRows}
              columns={columns}
              getRowId={(row) => row.id}
              loading={search.demo === "loading"}
              isFiltered={Boolean(
                tableSearch.q ||
                  tableSearch.category !== "all" ||
                  tableSearch.payment !== "all" ||
                  tableSearch.bib !== "all",
              )}
              emptyState={
                <EmptyState
                  title="No roster rows yet"
                  description="Imported or paid participants will appear here. Use Spot registration for expo walk-ins."
                />
              }
              filteredEmptyState={
                <EmptyState
                  title="No matching participants"
                  description="Try clearing category, payment, BIB, or search filters."
                />
              }
              onRowClick={(row) => go({ drawer: row.id })}
              bulkSelect={{
                allSelected:
                  pageRows.length > 0 && pageRows.every((row) => selected.includes(row.id)),
                someSelected: selected.length > 0,
                label: "Select roster rows",
                getRowSelected: (row) => selected.includes(row.id),
                onToggleAll: (checked) =>
                  go({ selected: checked ? pageRows.map((row) => row.id).join(",") : undefined }),
                onToggleRow: (row, _index, checked) =>
                  go({
                    selected: checked
                      ? [...selected, row.id].join(",")
                      : selected.filter((id) => id !== row.id).join(","),
                  }),
              }}
            />
          </div>
          <Pagination eventId={event.id} page={page} pageCount={pageCount} search={search} />
        </CardContent>
      </Card>
      <Sheet open={Boolean(drawerRow)} onOpenChange={(open) => !open && go({ drawer: undefined })}>
        <SheetContent className="overflow-y-auto sm:max-w-2xl">
          <SheetHeader>
            <SheetTitle>Participant correction</SheetTitle>
            <SheetDescription>O-12 details shown as a deep-linked roster drawer.</SheetDescription>
          </SheetHeader>
          {drawerRow ? (
            <ParticipantDetailContent event={event} participant={drawerRow} compact />
          ) : null}
        </SheetContent>
      </Sheet>
    </RosterPageShell>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <fieldset className="grid gap-1 text-sm font-medium">
      <legend>{label}</legend>
      {children}
    </fieldset>
  );
}
function SelectField({
  name,
  label,
  value,
  options,
}: {
  name: string;
  label: string;
  value: string;
  options: string[];
}) {
  return (
    <Field label={label}>
      <select
        name={name}
        defaultValue={value}
        className="h-9 rounded-md border border-input bg-background px-3 text-sm"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </Field>
  );
}
function Pagination({
  eventId,
  page,
  pageCount,
  search,
}: {
  eventId: string;
  page: number;
  pageCount: number;
  search: RosterTableSearch;
}) {
  const params = new URLSearchParams();
  Object.entries(search).forEach(([key, value]) => {
    if (value && value !== "all" && value !== 1) params.set(key, String(value));
  });
  return (
    <nav
      aria-label="Roster pagination"
      className="flex items-center justify-between rounded-xl border bg-muted/30 p-3 text-sm"
    >
      <span>
        Page {page} of {pageCount}
      </span>
      <span className="flex gap-2">
        <Button asChild variant="outline" size="sm" aria-disabled={page <= 1}>
          <a href={urlWith(`/events/${eventId}/roster`, { page: Math.max(1, page - 1) }, params)}>
            Previous
          </a>
        </Button>
        <Button asChild variant="outline" size="sm" aria-disabled={page >= pageCount}>
          <a
            href={urlWith(
              `/events/${eventId}/roster`,
              { page: Math.min(pageCount, page + 1) },
              params,
            )}
          >
            Next
          </a>
        </Button>
      </span>
    </nav>
  );
}

export function ParticipantDetailContent({
  event,
  participant,
  compact = false,
  demo = "default",
}: {
  event: Event;
  participant: RosterRow;
  compact?: boolean;
  demo?: RosterDemo;
}) {
  const fee =
    event.categories.find((category) => category.distance === participant.distance)?.feeInPaise ??
    0;
  return (
    <div className={compact ? "space-y-4 px-4 pb-6" : "space-y-6"}>
      {demo === "success" ? (
        <Alert className="border-success/30 bg-success/10">
          <AlertTitle>Participant updated.</AlertTitle>
          <AlertDescription>Mock correction saved locally for this frontend demo.</AlertDescription>
        </Alert>
      ) : null}
      {demo === "validation-error" ? (
        <Alert variant="destructive">
          <AlertTitle>Correction needs review</AlertTitle>
          <AlertDescription>BIB must be unique and emergency phone is required.</AlertDescription>
        </Alert>
      ) : null}
      <div className="grid gap-4 md:grid-cols-3">
        <Stat label="BIB" value={participant.bibNumber ?? "Missing"} />
        <Stat label="Category" value={participant.distance} />
        <Stat label="Fee" value={currencyFormatter.format(fee / 100)} />
      </div>
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Identity & contact</CardTitle>
          <CardDescription>{participant.registrationId}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Field label="Full name">
            <Input name="name" defaultValue={participant.name} />
          </Field>
          <Field label="Phone">
            <Input name="phone" type="tel" defaultValue={participant.phone} />
          </Field>
          <Field label="Email">
            <Input name="email" type="email" defaultValue={participant.email} />
          </Field>
          <Field label="City">
            <Input name="city" defaultValue={participant.city} />
          </Field>
        </CardContent>
      </Card>
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Race fields</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <Field label="Distance">
            <Input defaultValue={participant.distance} />
          </Field>
          <Field label="BIB">
            <Input defaultValue={participant.bibNumber ?? ""} placeholder="Assign BIB" />
          </Field>
          <Field label="T-shirt">
            <Input defaultValue={participant.tshirtSize} />
          </Field>
        </CardContent>
      </Card>
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Payment & emergency</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <Label>Payment status</Label>
            <div className="mt-2">
              <PaymentBadge row={participant} />
            </div>
          </div>
          <Field label="Emergency contact">
            <Input defaultValue={participant.emergencyContactName} />
          </Field>
          <Field label="Emergency phone">
            <Input type="tel" defaultValue={participant.emergencyContactPhone} />
          </Field>
          <Field label="Consent status">
            <Input defaultValue={participant.consent} />
          </Field>
          <div className="md:col-span-2">
            <Field label="Minimal medical note">
              <Textarea
                defaultValue={participant.medicalNotes ?? ""}
                placeholder="No declaration"
              />
            </Field>
          </div>
        </CardContent>
      </Card>
      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="outline" asChild>
          <a href={`/events/${event.id}/roster`}>Back to roster</a>
        </Button>
        <Button type="button">Save correction</Button>
      </div>
    </div>
  );
}
function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-2xl border bg-card p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 font-display text-2xl font-black tabular-nums">{value}</p>
    </div>
  );
}

export function ImportScreen({ event, search }: { event: Event; search: SimpleRosterSearch }) {
  const issues: ImportValidationIssue[] =
    search.demo === "ready"
      ? []
      : [
          {
            id: "row-8",
            rowNumber: 8,
            severity: "warning",
            field: "payment_mode",
            message: "Cash mode will require an audit reason.",
          },
          {
            id: "row-12",
            rowNumber: 12,
            severity: "error",
            field: "bib",
            message: "BIB 1042 is already assigned to Ananya Krishnan.",
          },
        ];
  const unmapped = search.demo === "unmapped";
  return (
    <RosterPageShell
      event={event}
      eyebrow="O-13 import"
      title="CSV import-update"
      description="Backend-free staged import with upload, column mapping and S-09 validation review."
      actions={
        <Button asChild variant="outline">
          <a href={`/events/${event.id}/roster`}>Back to roster</a>
        </Button>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[22rem_1fr]">
        <Card className="rounded-[2rem]">
          <CardHeader>
            <CardTitle>Upload + map</CardTitle>
            <CardDescription>
              Use a private CSV from the timing desk; no storage URLs are exposed.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field label="Roster CSV">
              <Input type="file" accept=".csv" />
            </Field>
            <Mapping label="Full name" value="runner_name" />
            <Mapping label="BIB" value={unmapped ? "Unmapped" : "bib_number"} />
            <Mapping label="Payment mode" value="payment_mode" />
            <Textarea
              aria-label="Audit reason"
              placeholder="Reason for bulk update/payment override"
              defaultValue={search.demo === "ready" ? "Pre-race timing vendor reconciliation" : ""}
            />
          </CardContent>
        </Card>
        <ImportValidation
          title="Roster import validation"
          description="Rows are validated before any mock update is applied."
          summary={{
            validRows: search.demo === "ready" ? 128 : 118,
            warningRows: search.demo === "ready" ? 0 : 9,
            errorRows: search.demo === "ready" ? 0 : 2,
            totalRows: 129,
          }}
          issues={issues}
          columnMapping={
            <div className="grid gap-2 md:grid-cols-3">
              <Mapping label="CSV runner_name" value="Corral name" />
              <Mapping label="CSV bib_number" value={unmapped ? "Needs mapping" : "BIB"} />
              <Mapping label="CSV payment_mode" value="Payment mode" />
            </div>
          }
          actions={
            <>
              <Button variant="outline">Download template</Button>
              <Button disabled={issues.some((issue) => issue.severity === "error") || unmapped}>
                Apply import
              </Button>
            </>
          }
        />
      </div>
    </RosterPageShell>
  );
}
function Mapping({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-muted/30 p-3">
      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}

export function ExportScreen({ event, search }: { event: Event; search: SimpleRosterSearch }) {
  const rows = getRosterRows(event.id, search.demo).length;
  const fields = ["BIB", "Chip", "Name", "Category", "T-shirt", "Emergency contact"];
  return (
    <RosterPageShell
      event={event}
      eyebrow="O-14 export"
      title="Timing-vendor export"
      description="Choose safe fields, scope, format and audit reason before a mock private download."
      actions={
        <Button asChild variant="outline">
          <a href={`/events/${event.id}/roster`}>Back to roster</a>
        </Button>
      }
    >
      <Card className="mx-auto max-w-4xl rounded-[2rem]">
        <CardHeader>
          <CardTitle>Export {formatter.format(rows)} participants as CSV</CardTitle>
          <CardDescription>
            DPDP notice: this file contains personal data. Keep it private and scoped to race
            operations.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert className="border-warning/30 bg-warning/10">
            <AlertTitle>Private handling required</AlertTitle>
            <AlertDescription>
              No public links are generated in this frontend demo; audit reason is mandatory for PII
              exports.
            </AlertDescription>
          </Alert>
          <div className="grid gap-3 md:grid-cols-3">
            {fields.map((field) => (
              <div key={field} className="flex items-center gap-2 rounded-xl border p-3">
                <Checkbox defaultChecked={field !== "Emergency contact"} aria-label={field} />
                <span>{field}</span>
              </div>
            ))}
          </div>
          <RadioGroup defaultValue="all" className="grid gap-3 md:grid-cols-3">
            <RadioOption value="all" label="All roster rows" />
            <RadioOption value="filtered" label="Current filtered rows" />
            <RadioOption value="selected" label="Selected rows" />
          </RadioGroup>
          <Field label="Reason for this PII export">
            <Textarea
              defaultValue={
                search.demo === "validation-error" ? "" : "Timing partner race-week roster sync"
              }
              aria-invalid={search.demo === "validation-error"}
            />
          </Field>
          {search.demo === "exporting" ? (
            <StatusBadge status="pending" label="Preparing private CSV…" />
          ) : null}
          {search.demo === "success" ? (
            <StatusBadge status="ok" label="Mock download ready" />
          ) : null}
          <div className="flex justify-end">
            <Button disabled={search.demo === "validation-error" || rows === 0}>
              Export private CSV
            </Button>
          </div>
        </CardContent>
      </Card>
    </RosterPageShell>
  );
}
function RadioOption({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border p-3">
      <RadioGroupItem value={value} aria-label={label} />
      <span>{label}</span>
    </div>
  );
}

export function SpotRegistrationScreen({
  event,
  search,
}: {
  event: Event;
  search: SimpleRosterSearch;
}) {
  return (
    <RosterPageShell
      event={event}
      eyebrow="O-15 spot"
      title="Expo desk registration"
      description="Add a walk-in with Cash, Direct UPI or Comp mode while preserving consent and audit cues."
      actions={
        <Button asChild variant="outline">
          <a href={`/events/${event.id}/roster`}>Back to roster</a>
        </Button>
      }
    >
      <Card className="rounded-[2rem]">
        <CardHeader>
          <CardTitle>New offline registrant</CardTitle>
          <CardDescription>
            Operator: CODISSIA expo desk · Fee examples use {currencyFormatter.format(899)} /{" "}
            {currencyFormatter.format(1499)}.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 xl:grid-cols-[1fr_20rem]">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Full name">
              <Input defaultValue="Raghav Venkatesh" />
            </Field>
            <Field label="Phone">
              <Input type="tel" defaultValue="+91 98422 55110" />
            </Field>
            <Field label="Email">
              <Input type="email" defaultValue="raghav.venkatesh@example.in" />
            </Field>
            <Field label="Category">
              <select className="h-9 rounded-md border bg-background px-3">
                <option>10K Open</option>
                <option>5K Fun Run</option>
                <option>21K Half Marathon</option>
              </select>
            </Field>
            <Field label="Payment mode">
              <select
                className="h-9 rounded-md border bg-background px-3"
                defaultValue={search.demo === "success" ? "Comp" : "Cash"}
              >
                <option>Cash</option>
                <option>Direct UPI</option>
                <option>Comp</option>
              </select>
            </Field>
            <Field label="T-shirt">
              <Input defaultValue="L" />
            </Field>
            <Field label="Emergency contact">
              <Input defaultValue="Meena V" />
            </Field>
            <Field label="Emergency phone">
              <Input type="tel" defaultValue="+91 98422 55111" />
            </Field>
            <div className="md:col-span-2">
              <Field label="Audit reason">
                <Textarea defaultValue="Expo desk walk-in; cash collected by organizer." />
              </Field>
            </div>
            {search.demo === "validation-error" ? (
              <Alert variant="destructive" className="md:col-span-2">
                <AlertTitle>Duplicate warning</AlertTitle>
                <AlertDescription>
                  Phone matches Karthik Narayanan. Open existing duplicate before saving.
                </AlertDescription>
              </Alert>
            ) : null}
          </div>
          <div className="space-y-4 rounded-2xl border bg-muted/30 p-4">
            <StatusBadge status="ok" label="Waiver consent checked" />
            <StatusBadge status="ok" label="Medical declaration captured" />
            <StatusBadge status="warning" label="Manual payment override audited" />
            <Button className="w-full">Add to roster</Button>
          </div>
        </CardContent>
      </Card>
    </RosterPageShell>
  );
}

export function TshirtScreen({ event, search }: { event: Event; search: SimpleRosterSearch }) {
  const rows = getRosterRows(event.id, search.demo);
  const sizes = ["XS", "S", "M", "L", "XL", "XXL"] as const;
  const counts = sizes.map((size) => ({
    size,
    count: rows.filter((row) => row.tshirtSize === size).length,
    missing: rows.filter(
      (row) => row.tshirtSize === size && row.paymentStatus !== "Paid & Confirmed",
    ).length,
  }));
  const max = Math.max(1, ...counts.map((item) => item.count));
  return (
    <RosterPageShell
      event={event}
      eyebrow="O-16 T-shirts"
      title="T-shirt order summary"
      description="Aggregate demand by size with table alternative, filters and missing-size alert."
      actions={
        <Button asChild variant="outline">
          <a href={`/events/${event.id}/roster?bib=missing`}>Open missing data</a>
        </Button>
      }
    >
      <Alert className="border-warning/30 bg-warning/10">
        <AlertTitle>Order buffer suggested</AlertTitle>
        <AlertDescription>
          12 runners still need size confirmation before the Race Course Road pickup list is final.
        </AlertDescription>
      </Alert>
      <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
        <Card className="rounded-[2rem]">
          <CardHeader>
            <CardTitle>Size count chart</CardTitle>
            <CardDescription>
              Chart uses text labels and a table below; not color-only.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {counts.map((item) => (
              <div key={item.size} className="grid grid-cols-[3rem_1fr_4rem] items-center gap-3">
                <strong>{item.size}</strong>
                <div className="h-5 rounded-full bg-muted">
                  <div
                    className="h-5 rounded-full bg-primary"
                    style={{ width: `${(item.count / max) * 100}%` }}
                  />
                </div>
                <span className="text-right tabular-nums">{item.count}</span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="rounded-[2rem]">
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <SelectField
              name="category"
              label="Category"
              value="all"
              options={["all", "5K", "10K", "21K"]}
            />
            <SelectField
              name="payment"
              label="Payment"
              value="all"
              options={["all", "paid", "pending"]}
            />
            <Button className="w-full">Export aggregate CSV</Button>
            <Button variant="outline" className="w-full">
              Message missing sizes
            </Button>
          </CardContent>
        </Card>
      </div>
      <Card className="rounded-[2rem]">
        <CardContent>
          <DataTable
            data={counts}
            getRowId={(row) => row.size}
            columns={[
              { id: "size", header: "Size", accessor: "size" },
              { id: "count", header: "Confirmed count", cell: (row) => row.count },
              { id: "review", header: "Needs payment/size review", cell: (row) => row.missing },
            ]}
            emptyState="No shirt sizes yet."
          />
        </CardContent>
      </Card>
    </RosterPageShell>
  );
}

export function MedicalScreen({ event, search }: { event: Event; search: SimpleRosterSearch }) {
  const rows = getRosterRows(event.id, search.demo)
    .filter((row) => search.demo !== "redacted" || row.medicalNotes)
    .sort(
      (a, b) =>
        a.distance.localeCompare(b.distance) ||
        (a.bibNumber ?? "99999").localeCompare(b.bibNumber ?? "99999", "en-IN", { numeric: true }),
    );
  if (search.demo === "permission-denied")
    return (
      <RosterPageShell
        event={event}
        eyebrow="O-35 medical"
        title="Medical roster gated"
        description="Health and emergency exports are restricted to owner/admin or assigned race-control duty."
      >
        <Alert variant="destructive">
          <AlertTitle>Export permission denied</AlertTitle>
          <AlertDescription>
            Switch to an authorized persona or add an audit reason through race-control duty
            assignment.
          </AlertDescription>
        </Alert>
      </RosterPageShell>
    );
  return (
    <RosterPageShell
      event={event}
      eyebrow="O-35 medical"
      title="Medical / emergency roster"
      description="Printable A4 race-control sheet with minimal health declarations and emergency contacts."
      actions={
        <>
          <Button variant="outline" onClick={() => window.print()}>
            Print-safe view
          </Button>
          <Button>Export restricted CSV</Button>
        </>
      }
    >
      <Alert className="border-danger/30 bg-danger/10 print:hidden">
        <AlertTitle>DPDP sensitive health data</AlertTitle>
        <AlertDescription>
          Minimal PII only: BIB, name, age/sex, blood group if declared, concise alert flags and
          emergency contact.
        </AlertDescription>
      </Alert>
      <Card className="rounded-[2rem] print:rounded-none print:border-none print:shadow-none">
        <CardHeader>
          <CardTitle>Race-control sheet</CardTitle>
          <CardDescription>
            Grouped by distance, sorted by BIB. Print mode removes sidebar and keeps black-on-white
            contrast.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            data={rows}
            getRowId={(row) => row.id}
            columns={[
              {
                id: "bib",
                header: "BIB",
                cell: (row) => (
                  <span className="font-display text-xl font-black tabular-nums">
                    {row.bibNumber ?? "—"}
                  </span>
                ),
              },
              {
                id: "name",
                header: "Runner",
                cell: (row) => (
                  <span>
                    {row.name}
                    <br />
                    <span className="text-xs text-muted-foreground">
                      {row.age}/{row.gender} · {row.distance}
                    </span>
                  </span>
                ),
              },
              {
                id: "alert",
                header: "Medical alert",
                cell: (row) =>
                  row.medicalNotes ? (
                    <StatusBadge status="error" label={`MEDICAL ALERT — ${row.medicalNotes}`} />
                  ) : (
                    <StatusBadge status="neutral" label="No declaration" />
                  ),
                className: "min-w-72 whitespace-normal",
              },
              {
                id: "emergency",
                header: "Emergency contact",
                cell: (row) => (
                  <span>
                    {row.emergencyContactName}
                    <br />
                    <span className="font-medium tabular-nums">{row.emergencyContactPhone}</span>
                  </span>
                ),
              },
            ]}
            emptyState={
              <EmptyState
                title="No medical roster rows"
                description="No participant declarations are available for this event."
              />
            }
          />
        </CardContent>
      </Card>
    </RosterPageShell>
  );
}
