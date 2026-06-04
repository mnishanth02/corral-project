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
import { EmptyState } from "@corral/ui/components/empty-state";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@corral/ui/components/field";
import { Input } from "@corral/ui/components/input";
import { RadioGroup, RadioGroupItem } from "@corral/ui/components/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@corral/ui/components/select";
import { Skeleton } from "@corral/ui/components/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@corral/ui/components/table";
import { Textarea } from "@corral/ui/components/textarea";
import { Link } from "@tanstack/react-router";
import type * as React from "react";
import { useConsoleShell } from "../components/console-shell-context";
import { SetupStepper } from "../components/wizard-steppers";
import {
  findMockEvent,
  mockCoupons,
  mockEvents,
  mockPayments,
  mockRosterParticipants,
  parseDemoState,
  useMockStore,
} from "../mocks";
import { isPersonaId } from "../mocks/personas";
import type { DemoState, Event, EventCategory, PersonaId } from "../mocks/types";
import { formatDate, formatINR, formatTime } from "../mocks/utils";

type Search = { as?: PersonaId; demo: DemoState };

type ScreenProps = { eventId?: string };

type AppLinkProps = {
  to: string;
  params?: Record<string, string>;
  className?: string;
  children: React.ReactNode;
};

function AppLink(props: AppLinkProps) {
  const AnyLink = Link as unknown as React.ComponentType<AppLinkProps>;
  return <AnyLink {...props} />;
}

export function validateConsoleSearch(search: Record<string, unknown>): Search {
  return {
    as: isPersonaId(search.as) ? search.as : undefined,
    demo: parseDemoState(search.demo),
  };
}

const statusMap: Record<
  Event["status"],
  { label: string; variant: "secondary" | "success" | "warning" | "muted" | "info" }
> = {
  draft: { label: "Draft", variant: "warning" },
  ready: { label: "Ready", variant: "info" },
  published: { label: "Open", variant: "success" },
  closed: { label: "Closed", variant: "secondary" },
  completed: { label: "Completed", variant: "muted" },
};

const rupee = formatINR;

function ScreenHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="relative overflow-hidden rounded-[2rem] border bg-card p-6 shadow-xl shadow-slate-950/5">
      <div
        className="absolute right-0 top-0 h-32 w-32 rounded-bl-full bg-brand-tint"
        aria-hidden="true"
      />
      <div className="relative flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-brand-orange-strong">
            {eyebrow}
          </p>
          <h1 className="mt-2 font-display text-5xl font-black uppercase leading-none tracking-tight text-foreground">
            {title}
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
    </div>
  );
}

function StepShell({
  eventId,
  activeStep,
  children,
}: {
  eventId: string;
  activeStep: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-6">
      <SetupStepper eventId={eventId} activeStep={activeStep} />
      {children}
    </div>
  );
}

function useCurrentEvent(eventId?: string) {
  const { activeEventId } = useConsoleShell();
  return findMockEvent(eventId ?? activeEventId) ?? findMockEvent(activeEventId) ?? mockEvents[0];
}

function DemoAlert({
  tone = "warning",
  title,
  children,
}: {
  tone?: "warning" | "danger" | "success" | "info";
  title: string;
  children: React.ReactNode;
}) {
  const classes = {
    warning: "border-warning/40 bg-warning/10 text-warning-text",
    danger: "border-destructive/40 bg-destructive/10 text-destructive",
    success: "border-success/40 bg-success/10 text-success-text",
    info: "border-info/40 bg-info/10 text-info-text",
  }[tone];
  return (
    <div className={`rounded-2xl border p-4 ${classes}`} role="status" aria-live="polite">
      <p className="font-semibold">
        <span aria-hidden="true">● </span>
        {title}
      </p>
      <div className="mt-1 text-sm leading-6">{children}</div>
    </div>
  );
}

function LoadingGrid() {
  return (
    <div className="grid gap-4 md:grid-cols-3" role="status" aria-label="Loading content">
      {["one", "two", "three", "four", "five", "six"].map((item) => (
        <Skeleton key={item} className="h-32 rounded-2xl" />
      ))}
    </div>
  );
}

function EventStatusBadge({ status }: { status: Event["status"] }) {
  const item = statusMap[status];
  return (
    <Badge variant={item.variant}>
      <span aria-hidden="true">●</span>
      {item.label}
    </Badge>
  );
}

export function EventsDashboardScreen() {
  const { demo } = useConsoleShell();
  const events = demo === "empty" ? [] : mockEvents;
  const displayedEvents = events.map((event, index) =>
    index === 1 ? { ...event, status: "closed" as const } : event,
  );
  const totals = displayedEvents.reduce(
    (acc, event) => {
      const registrations =
        mockRosterParticipants.filter((participant) => participant.eventId === event.id).length ||
        event.categories.reduce((sum, category) => sum + category.registered, 0);
      const revenue =
        mockPayments
          .filter((payment) => payment.eventId === event.id)
          .reduce((sum, payment) => sum + payment.amountInPaise, 0) ||
        event.categories.reduce(
          (sum, category) => sum + category.registered * category.feeInPaise,
          0,
        );
      return { registrations: acc.registrations + registrations, revenue: acc.revenue + revenue };
    },
    { registrations: 0, revenue: 0 },
  );

  if (demo === "loading") {
    return (
      <div className="grid gap-6">
        <ScreenHeader
          eyebrow="O-04 Events"
          title="Events dashboard"
          description="Loading organizer events and revenue snapshots."
        />
        <LoadingGrid />
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <ScreenHeader
        eyebrow="O-04 Events"
        title="Events dashboard"
        description="Calm control room for Coimbatore races: setup status, registration pace, revenue, and quick operational links."
        actions={
          <Button asChild>
            <AppLink to="/">Create event</AppLink>
          </Button>
        }
      />
      {displayedEvents.length === 0 ? (
        <EmptyState
          title="Create your first event"
          description="Start with basics, fees, form fields, and publish readiness. No backend calls are made in this demo."
          action={
            <Button asChild>
              <AppLink
                to="/events/$eventId/setup/basics"
                params={{ eventId: "coimbatore-marathon-2026" }}
              >
                Create event
              </AppLink>
            </Button>
          }
        />
      ) : (
        <>
          <section className="grid gap-4 md:grid-cols-3" aria-label="Event portfolio summary">
            <MetricCard
              label="Total registrations"
              value={new Intl.NumberFormat("en-IN").format(totals.registrations)}
              note="Across draft, open, closed, completed"
            />
            <MetricCard
              label="Revenue snapshot"
              value={rupee(totals.revenue)}
              note="Mock paid/settled + projected fees"
            />
            <MetricCard
              label="Events tracked"
              value={String(displayedEvents.length)}
              note="CODISSIA, Race Course, Pollachi"
            />
          </section>
          <div className="grid gap-4 xl:grid-cols-3">
            {displayedEvents.map((event) => {
              const registrations =
                mockRosterParticipants.filter((participant) => participant.eventId === event.id)
                  .length ||
                event.categories.reduce((sum, category) => sum + category.registered, 0);
              const capacity = event.categories.reduce(
                (sum, category) => sum + category.capacity,
                0,
              );
              const revenue =
                mockPayments
                  .filter((payment) => payment.eventId === event.id)
                  .reduce((sum, payment) => sum + payment.amountInPaise, 0) ||
                event.categories.reduce(
                  (sum, category) => sum + category.registered * category.feeInPaise,
                  0,
                );
              return (
                <Card key={event.id} className="rounded-[1.5rem]">
                  <CardHeader>
                    <div className="flex items-center justify-between gap-3">
                      <EventStatusBadge status={event.status} />
                      <Badge variant="outline">{event.city}</Badge>
                    </div>
                    <CardTitle className="font-display text-3xl uppercase">{event.name}</CardTitle>
                    <CardDescription>
                      {formatDate(event.startTime)} · {formatTime(event.startTime)} ·{" "}
                      {event.venueName}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-4">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-xl bg-secondary p-3">
                        <p className="text-muted-foreground">Registrations</p>
                        <p className="font-display text-3xl font-black">{registrations}</p>
                        <p className="text-xs text-muted-foreground">of {capacity}</p>
                      </div>
                      <div className="rounded-xl bg-secondary p-3">
                        <p className="text-muted-foreground">Revenue</p>
                        <p className="font-display text-3xl font-black">{rupee(revenue)}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button asChild size="sm">
                        <AppLink to="/events/$eventId/setup/basics" params={{ eventId: event.id }}>
                          Setup
                        </AppLink>
                      </Button>
                      <Button asChild size="sm" variant="outline">
                        <AppLink to="/events/$eventId/coupons" params={{ eventId: event.id }}>
                          Coupons
                        </AppLink>
                      </Button>
                      <Button asChild size="sm" variant="outline">
                        <AppLink to="/events/$eventId/setup/publish" params={{ eventId: event.id }}>
                          Publish
                        </AppLink>
                      </Button>
                      <Button asChild size="sm" variant="ghost">
                        <a href={`/events/${event.id}/roster`}>Roster</a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          <Card className="rounded-[1.5rem]">
            <CardHeader>
              <CardTitle className="font-display text-2xl uppercase">Portfolio table</CardTitle>
              <CardDescription>Keyboard-readable event rows with quick links.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Registration</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>Quick links</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayedEvents.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell className="font-medium">
                        {event.name}
                        <div className="text-xs text-muted-foreground">{event.venueName}</div>
                      </TableCell>
                      <TableCell>
                        <EventStatusBadge status={event.status} />
                      </TableCell>
                      <TableCell>{formatDate(event.startTime)}</TableCell>
                      <TableCell>
                        {event.categories.reduce((sum, category) => sum + category.registered, 0)}
                      </TableCell>
                      <TableCell>
                        {rupee(
                          event.categories.reduce(
                            (sum, category) => sum + category.registered * category.feeInPaise,
                            0,
                          ),
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <AppLink
                            className="text-sm font-medium text-brand-orange-strong underline-offset-4 hover:underline"
                            to="/events/$eventId/setup/basics"
                            params={{ eventId: event.id }}
                          >
                            Edit setup
                          </AppLink>
                          <AppLink
                            className="text-sm font-medium text-brand-orange-strong underline-offset-4 hover:underline"
                            to="/events/$eventId/coupons"
                            params={{ eventId: event.id }}
                          >
                            Coupons
                          </AppLink>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function MetricCard({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <Card className="rounded-[1.5rem]">
      <CardContent className="p-5">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
          {label}
        </p>
        <p className="mt-2 font-display text-4xl font-black leading-none">{value}</p>
        <p className="mt-2 text-sm text-muted-foreground">{note}</p>
      </CardContent>
    </Card>
  );
}

export function BasicsScreen({ eventId }: ScreenProps) {
  const event = useCurrentEvent(eventId);
  const { eventSetupDrafts, updateEventSetupDraft } = useMockStore();
  const draft = eventSetupDrafts[event.id];
  const basics = draft?.basics ?? {
    name: event.name,
    date: event.date,
    startTime: event.startTime,
    venueName: event.venueName,
    venueAddress: event.venueAddress,
    city: event.city,
  };
  return (
    <StepShell eventId={event.id} activeStep="basics">
      <ScreenHeader
        eyebrow="O-05 Setup basics"
        title="Event basics"
        description="Name the race, set the CODISSIA schedule, and provide participant-facing venue directions."
        actions={
          <Button asChild>
            <AppLink to="/events/$eventId/setup/fees" params={{ eventId: event.id }}>
              Continue to fees
            </AppLink>
          </Button>
        }
      />
      <Card className="rounded-[1.5rem]">
        <CardHeader>
          <CardTitle>Race identity</CardTitle>
          <CardDescription>Saved locally in the mock setup draft.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 lg:grid-cols-2">
          <TextField
            id="event-name"
            label="Event name"
            defaultValue={basics.name}
            onBlur={(value) =>
              updateEventSetupDraft(event.id, { basics: { ...basics, name: value } })
            }
          />
          <TextField
            id="event-city"
            label="City"
            defaultValue={basics.city}
            onBlur={(value) =>
              updateEventSetupDraft(event.id, { basics: { ...basics, city: value } })
            }
          />
          <TextField
            id="event-date"
            label="Race date"
            type="date"
            defaultValue={basics.date}
            onBlur={(value) =>
              updateEventSetupDraft(event.id, { basics: { ...basics, date: value } })
            }
          />
          <TextField
            id="event-start"
            label="Start datetime"
            type="datetime-local"
            defaultValue={basics.startTime.slice(0, 16)}
            onBlur={(value) =>
              updateEventSetupDraft(event.id, {
                basics: { ...basics, startTime: `${value}:00+05:30` },
              })
            }
          />
          <TextField
            id="venue-name"
            label="Venue"
            defaultValue={basics.venueName}
            onBlur={(value) =>
              updateEventSetupDraft(event.id, { basics: { ...basics, venueName: value } })
            }
          />
          <TextField
            id="map-link"
            label="Map link"
            type="url"
            defaultValue="https://maps.google.com/?q=CODISSIA+Trade+Fair+Complex"
            description="Same-origin app stores a public map URL only; no private hostnames."
          />
          <Field className="lg:col-span-2">
            <FieldLabel htmlFor="venue-address">Venue address</FieldLabel>
            <Textarea
              id="venue-address"
              name="venueAddress"
              defaultValue={basics.venueAddress}
              rows={4}
              onBlur={(e) =>
                updateEventSetupDraft(event.id, {
                  basics: { ...basics, venueAddress: e.currentTarget.value },
                })
              }
            />
          </Field>
        </CardContent>
      </Card>
    </StepShell>
  );
}

function TextField({
  id,
  label,
  defaultValue,
  type = "text",
  description,
  error,
  onBlur,
}: {
  id: string;
  label: string;
  defaultValue?: string | number;
  type?: string;
  description?: string;
  error?: string;
  onBlur?: (value: string) => void;
}) {
  return (
    <Field data-invalid={Boolean(error)}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input
        id={id}
        name={id}
        type={type}
        defaultValue={defaultValue}
        aria-invalid={Boolean(error)}
        onBlur={(e) => onBlur?.(e.currentTarget.value)}
      />
      {description ? <FieldDescription>{description}</FieldDescription> : null}
      <FieldError>{error}</FieldError>
    </Field>
  );
}

export function FeesScreen({ eventId }: ScreenProps) {
  const event = useCurrentEvent(eventId);
  const { demo } = useConsoleShell();
  const { eventSetupDrafts, updateEventSetupDraft } = useMockStore();
  const categories = eventSetupDrafts[event.id]?.categories ?? event.categories;
  const showWarnings = demo === "validation-error";
  const updateCategory = (category: EventCategory, patch: Partial<EventCategory>) =>
    updateEventSetupDraft(event.id, {
      categories: categories.map((item) =>
        item.id === category.id ? { ...item, ...patch } : item,
      ),
    });
  return (
    <StepShell eventId={event.id} activeStep="fees">
      <ScreenHeader
        eyebrow="O-06 Fees"
        title="Distances & fees"
        description="Configure category capacity, runner fees, early-bird tiers, and registration windows."
        actions={
          <Button asChild>
            <AppLink to="/events/$eventId/setup/form" params={{ eventId: event.id }}>
              Continue to form
            </AppLink>
          </Button>
        }
      />
      {showWarnings ? (
        <div className="grid gap-3">
          <DemoAlert title="Early-bird tier overlaps another tier">
            KOVAI-FIRST500 and CODISSIA-COUNT overlap for 10K from 01–10 Jun.
          </DemoAlert>
          <DemoAlert tone="danger" title="Sold-out category">
            5K Fun Run is marked sold out at 1,500/1,500 in this demo state.
          </DemoAlert>
          <DemoAlert tone="danger" title="Registration date conflict">
            Close date is after race day; update registration close before publishing.
          </DemoAlert>
        </div>
      ) : null}
      <Card className="rounded-[1.5rem]">
        <CardHeader>
          <CardTitle>Category repeater</CardTitle>
          <CardDescription>
            Fees are organizer-absorbed for convenience charges; participants see only the category
            fee.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead>Distance</TableHead>
                <TableHead>Fee</TableHead>
                <TableHead>Capacity cap</TableHead>
                <TableHead>Registered</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((category, index) => (
                <TableRow key={category.id}>
                  <TableCell>
                    <Input
                      aria-label={`${category.label} name`}
                      defaultValue={category.label}
                      onBlur={(e) => updateCategory(category, { label: e.currentTarget.value })}
                    />
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{category.distance}</Badge>
                  </TableCell>
                  <TableCell>
                    <Input
                      aria-label={`${category.label} fee in rupees`}
                      type="number"
                      inputMode="numeric"
                      defaultValue={category.feeInPaise / 100}
                      onBlur={(e) =>
                        updateCategory(category, {
                          feeInPaise: Number(e.currentTarget.value) * 100,
                        })
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      aria-label={`${category.label} capacity`}
                      type="number"
                      inputMode="numeric"
                      defaultValue={
                        showWarnings && index === 0 ? category.registered : category.capacity
                      }
                      onBlur={(e) =>
                        updateCategory(category, { capacity: Number(e.currentTarget.value) })
                      }
                    />
                  </TableCell>
                  <TableCell>
                    {showWarnings && index === 0 ? (
                      <Badge variant="destructive">Sold out · {category.registered}</Badge>
                    ) : (
                      `${category.registered}/${category.capacity}`
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <div className="grid gap-4 lg:grid-cols-[1fr_22rem]">
        <Card className="rounded-[1.5rem]">
          <CardHeader>
            <CardTitle>Early-bird tiers</CardTitle>
            <CardDescription>Date/count step tiers for Coimbatore launch offers.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <TierRow
              name="KOVAI-FIRST500"
              detail="₹150 off until first 500 registrations"
              date="2026-03-15"
              warning={showWarnings}
            />
            <TierRow
              name="CODISSIA-COUNT"
              detail="10% off sponsor teams"
              date="2026-06-01"
              warning={showWarnings}
            />
            <TierRow
              name="RACEWEEK"
              detail="Last-week no discount, capacity protection"
              date="2026-07-05"
            />
          </CardContent>
        </Card>
        <Card className="rounded-[1.5rem]">
          <CardHeader>
            <CardTitle>Registration window</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <TextField
              id="opens-at"
              label="Opens"
              type="datetime-local"
              defaultValue={event.registrationOpensAt.slice(0, 16)}
            />
            <TextField
              id="closes-at"
              label="Closes"
              type="datetime-local"
              defaultValue={
                showWarnings ? "2026-07-20T23:59" : event.registrationClosesAt.slice(0, 16)
              }
              error={showWarnings ? "Close date must be before race day." : undefined}
            />
          </CardContent>
        </Card>
      </div>
    </StepShell>
  );
}

function TierRow({
  name,
  detail,
  date,
  warning,
}: {
  name: string;
  detail: string;
  date: string;
  warning?: boolean;
}) {
  return (
    <div className="grid gap-3 rounded-2xl border p-4 md:grid-cols-[1fr_12rem_8rem]">
      <div>
        <p className="font-semibold">{name}</p>
        <p className="text-sm text-muted-foreground">{detail}</p>
        {warning ? (
          <p className="mt-1 text-sm font-medium text-warning-text">
            <span aria-hidden="true">⚠ </span>Overlap warning
          </p>
        ) : null}
      </div>
      <Input aria-label={`${name} end date`} type="date" defaultValue={date} />
      <Select defaultValue="count">
        <SelectTrigger aria-label={`${name} tier type`}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="count">Count step</SelectItem>
          <SelectItem value="date">Date step</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

export function FormBuilderScreen({ eventId }: ScreenProps) {
  const event = useCurrentEvent(eventId);
  const { eventSetupDrafts, updateEventSetupDraft } = useMockStore();
  const fields = eventSetupDrafts[event.id]?.formFields ?? [];
  const toggleField = (field: string, checked: boolean) =>
    updateEventSetupDraft(event.id, {
      formFields: checked ? [...fields, field] : fields.filter((item) => item !== field),
    });
  const allFields = [
    "Full name",
    "Mobile",
    "Email",
    "Emergency contact",
    "T-shirt size",
    "Club/team",
    "DOB",
    "Guardian contact",
    "Medical notes",
  ];
  return (
    <StepShell eventId={event.id} activeStep="form">
      <ScreenHeader
        eyebrow="O-07 Form builder"
        title="Registration form"
        description="Choose participant fields and keep waiver/medical declarations ready for DPDP-safe registration."
        actions={
          <Button asChild>
            <AppLink to="/events/$eventId/setup/branding" params={{ eventId: event.id }}>
              Continue to branding
            </AppLink>
          </Button>
        }
      />
      <div className="grid gap-4 lg:grid-cols-[1fr_24rem]">
        <Card className="rounded-[1.5rem]">
          <CardHeader>
            <CardTitle>Field builder</CardTitle>
            <CardDescription>
              Required core fields stay selected. Toggles update the setup draft.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            {allFields.map((field) => (
              <label
                key={field}
                htmlFor={`field-${field.replace(/\\W/g, "-")}`}
                className="flex items-start gap-3 rounded-2xl border p-4"
              >
                <Checkbox
                  id={`field-${field.replace(/\\W/g, "-")}`}
                  checked={fields.includes(field)}
                  onCheckedChange={(value) => toggleField(field, value === true)}
                  aria-label={`Include ${field}`}
                />
                <span>
                  <span className="font-medium">{field}</span>
                  <span className="block text-sm text-muted-foreground">
                    {field === "Medical notes"
                      ? "Shown to race-day medical desk."
                      : "Participant-provided registration data."}
                  </span>
                </span>
              </label>
            ))}
          </CardContent>
        </Card>
        <Card className="rounded-[1.5rem]">
          <CardHeader>
            <CardTitle>Preview</CardTitle>
            <CardDescription>{fields.length} fields enabled</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            {fields.map((field) => (
              <div key={field} className="rounded-xl bg-secondary px-3 py-2 text-sm">
                {field}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
      <Card className="rounded-[1.5rem]">
        <CardHeader>
          <CardTitle>Waiver & medical copy</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="waiver-text">Waiver text</FieldLabel>
            <Textarea
              id="waiver-text"
              rows={8}
              defaultValue="I confirm I am medically fit to participate in Coimbatore Marathon 2026 and accept organizer safety instructions."
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="medical-text">Medical declaration</FieldLabel>
            <Textarea
              id="medical-text"
              rows={8}
              defaultValue="Share allergies, chronic conditions, emergency medication, and the emergency contact authorized for race-day support."
            />
          </Field>
        </CardContent>
      </Card>
    </StepShell>
  );
}

export function BrandingScreen({ eventId }: ScreenProps) {
  const event = useCurrentEvent(eventId);
  const { demo, persona } = useConsoleShell();
  const denied = demo === "permission-denied" || persona.id === "org-readonly";
  if (demo === "loading")
    return (
      <StepShell eventId={event.id} activeStep="branding">
        <ScreenHeader
          eyebrow="O-08 Branding"
          title="Branding"
          description="Loading public assets."
        />
        <LoadingGrid />
      </StepShell>
    );
  return (
    <StepShell eventId={event.id} activeStep="branding">
      <ScreenHeader
        eyebrow="O-08 Branding"
        title="Branding"
        description="Logo, hero banner, and sponsor strip for the event page, e-ticket, and certificate."
        actions={
          <Button asChild>
            <AppLink to="/events/$eventId/setup/policies" params={{ eventId: event.id }}>
              Continue to policies
            </AppLink>
          </Button>
        }
      />
      {denied ? (
        <DemoAlert tone="danger" title="Read-only viewer">
          Ask an Owner, Admin, or Event Editor to change branding.
        </DemoAlert>
      ) : null}
      {demo === "error" ? (
        <DemoAlert tone="danger" title="Upload failed">
          File is 6.4 MB. Use an image under 2 MB; no storage paths are exposed.
        </DemoAlert>
      ) : (
        <DemoAlert title="Warning-only for publish">
          Sponsor branding is recommended, but publish readiness treats it as warning-only.
        </DemoAlert>
      )}
      <div className="grid gap-4 xl:grid-cols-[1fr_24rem]">
        <div className="grid gap-4">
          <UploadCard
            disabled={denied}
            title="Event logo"
            helper="PNG/SVG/JPG · square recommended · max 2 MB"
            alt="Coimbatore Marathon logo"
          />
          <UploadCard
            disabled={denied}
            title="Hero banner"
            helper="Recommended 1600×700 · keep text away from edges"
            alt="Race Course Road runners at sunrise"
            wide
          />
          <Card className="rounded-[1.5rem]">
            <CardHeader>
              <CardTitle>Sponsor strip</CardTitle>
              <CardDescription>Up to 8 logos · shown in this order.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Sponsor</TableHead>
                    <TableHead>Alt text</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    "Annapoorna",
                    "PSG Hospitals",
                    "Brookefields Mall",
                    "Coimbatore Cycling Club",
                  ].map((name, index) => (
                    <TableRow key={name}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell className="font-medium">{name}</TableCell>
                      <TableCell>{name} sponsor logo</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={denied}
                          aria-label={`Move ${name} logo up`}
                        >
                          Move up
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
        <Card className="rounded-[1.5rem]">
          <CardHeader>
            <CardTitle>Live preview</CardTitle>
            <CardDescription>Public page and certificate header.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="rounded-[1.5rem] bg-[#0f172a] p-5 text-white">
              <p className="text-xs uppercase tracking-[0.22em] text-orange-200">
                Kovai Road Runners
              </p>
              <p className="mt-6 font-display text-4xl font-black uppercase">{event.name}</p>
              <p className="mt-2 text-sm text-slate-300">{event.venueName}</p>
            </div>
            <div className="rounded-2xl border p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Certificate sponsor strip
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                {["Annapoorna", "PSG Hospitals", "Brookefields", "Cycling Club"].map((item) => (
                  <span className="rounded-lg bg-secondary p-2 text-center" key={item}>
                    {item}
                  </span>
                ))}
              </div>
            </div>
            <Button variant="outline" disabled={denied}>
              Preview public page
            </Button>
          </CardContent>
        </Card>
      </div>
    </StepShell>
  );
}

function UploadCard({
  title,
  helper,
  alt,
  wide,
  disabled,
}: {
  title: string;
  helper: string;
  alt: string;
  wide?: boolean;
  disabled?: boolean;
}) {
  return (
    <Card className="rounded-[1.5rem]">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{helper}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-[12rem_1fr]">
        <div
          className={`${wide ? "h-28" : "h-28 w-28"} rounded-2xl border border-dashed bg-brand-tint`}
          role="img"
          aria-label={alt}
        />
        <div className="grid gap-3">
          <TextField id={`${title}-alt`} label="Alt text" defaultValue={alt} />
          <Button type="button" variant="outline" disabled={disabled}>
            Browse mock file
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function PoliciesScreen({ eventId }: ScreenProps) {
  const event = useCurrentEvent(eventId);
  const { demo } = useConsoleShell();
  const validation = demo === "validation-error";
  return (
    <StepShell eventId={event.id} activeStep="policies">
      <ScreenHeader
        eyebrow="O-09 Policies"
        title="Policies"
        description="Refund, cancellation, waiver, support contact, and race-day instructions shown to participants."
        actions={
          <Button asChild>
            <AppLink to="/events/$eventId/setup/publish" params={{ eventId: event.id }}>
              Review publish
            </AppLink>
          </Button>
        }
      />
      {validation ? (
        <DemoAlert tone="danger" title="Required policy missing">
          Refund and waiver copy must be completed before publishing.
        </DemoAlert>
      ) : null}
      <Card className="rounded-[1.5rem]">
        <CardContent className="grid gap-5 p-6">
          <Field>
            <FieldLabel htmlFor="refund-policy">Refund / cancellation policy</FieldLabel>
            <Textarea
              id="refund-policy"
              rows={5}
              aria-invalid={validation}
              defaultValue={
                validation
                  ? ""
                  : "Refund requests are accepted until 15 days before race day. Transfers may be approved by organizer support."
              }
            />
            <FieldError>{validation ? "Refund policy is required." : undefined}</FieldError>
          </Field>
          <Field>
            <FieldLabel htmlFor="waiver-policy">Participant waiver</FieldLabel>
            <Textarea
              id="waiver-policy"
              rows={5}
              defaultValue="Participants confirm training readiness, obey marshal instructions, and consent to emergency assistance if needed."
            />
          </Field>
          <div className="grid gap-4 md:grid-cols-2">
            <TextField
              id="support-email"
              label="Support email"
              type="email"
              defaultValue="support@kovairoadrunners.example"
            />
            <TextField
              id="support-phone"
              label="Support phone"
              type="tel"
              defaultValue="+91 422 400 2026"
            />
          </div>
          <Field>
            <FieldLabel htmlFor="race-instructions">Race instructions</FieldLabel>
            <Textarea
              id="race-instructions"
              rows={5}
              defaultValue="Report to CODISSIA Gate C by 04:45 AM. Carry photo ID, hydration bottle, and medical information."
            />
          </Field>
        </CardContent>
      </Card>
    </StepShell>
  );
}

export function PublishScreen({ eventId }: ScreenProps) {
  const event = useCurrentEvent(eventId);
  const { demo, persona } = useConsoleShell();
  const ready =
    demo === "success" || event.setup.blockers.every((item) => item.status === "complete");
  const warningOnly = demo === "webhook-pending" || demo === "default";
  const override = demo === "permission-denied" && persona.id.startsWith("corral-admin");
  const blocked = demo === "validation-error" || (!ready && !warningOnly);
  const items = [
    { label: "Basics complete", state: "complete", href: "basics", kind: "blocking" },
    {
      label: "At least one distance / fee",
      state: blocked ? "blocked" : "complete",
      href: "fees",
      kind: "blocking",
    },
    {
      label: "Registration dates valid",
      state: blocked ? "blocked" : "complete",
      href: "fees",
      kind: "blocking",
    },
    {
      label: "Policies, waiver, privacy notice",
      state: blocked ? "blocked" : "complete",
      href: "policies",
      kind: "blocking",
    },
    {
      label: "Payment account active",
      state: ready ? "complete" : "warning",
      href: "",
      kind: "blocking",
    },
    { label: "Sponsor branding", state: "warning", href: "branding", kind: "warning" },
    { label: "Optional coupons", state: "warning", href: "coupons", kind: "warning" },
  ];
  return (
    <StepShell eventId={event.id} activeStep="publish">
      <ScreenHeader
        eyebrow="O-10A Publish"
        title={ready ? "Ready to publish" : blocked ? "Publish blocked" : "Warnings remaining"}
        description="Blocking items gate go-live; warning-only items can be handled after launch."
        actions={<Button disabled={blocked && !override}>Publish event</Button>}
      />
      {override ? (
        <DemoAlert tone="info" title="Admin override with audit reason">
          <Field className="mt-2">
            <FieldLabel htmlFor="override-audit-reason">Audit reason</FieldLabel>
            <Textarea
              id="override-audit-reason"
              defaultValue="Approved by Corral admin for supervised pilot launch."
            />
          </Field>
        </DemoAlert>
      ) : null}
      <div className="grid gap-4 xl:grid-cols-[1fr_22rem]">
        <Card className="rounded-[1.5rem]">
          <CardHeader>
            <CardTitle>Readiness checklist</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {items.map((item) => (
              <ChecklistRow key={item.label} eventId={event.id} item={item} />
            ))}
          </CardContent>
        </Card>
        <Card className="rounded-[1.5rem]">
          <CardHeader>
            <CardTitle>Launch links</CardTitle>
            <CardDescription>Fix items or move to operational screens.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            <Button asChild variant="outline">
              <AppLink to="/">Back to dashboard</AppLink>
            </Button>
            <Button asChild variant="outline">
              <a href={`/events/${event.id}/permissions`}>Review permissions</a>
            </Button>
            <Button asChild variant="outline">
              <AppLink to="/events/$eventId/coupons" params={{ eventId: event.id }}>
                Open coupons
              </AppLink>
            </Button>
          </CardContent>
        </Card>
      </div>
    </StepShell>
  );
}

function ChecklistRow({
  eventId,
  item,
}: {
  eventId: string;
  item: { label: string; state: string; href: string; kind: string };
}) {
  const variant =
    item.state === "complete" ? "success" : item.state === "blocked" ? "destructive" : "warning";
  const symbol = item.state === "complete" ? "✓" : item.state === "blocked" ? "!" : "⚠";
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4">
      <div>
        <Badge variant={variant as "success" | "destructive" | "warning"}>
          <span aria-hidden="true">{symbol}</span>
          {item.state}
        </Badge>
        <p className="mt-2 font-medium">{item.label}</p>
        <p className="text-sm text-muted-foreground">
          {item.kind === "blocking" ? "Blocking publish item" : "Warning-only item"}
        </p>
      </div>
      {item.href === "coupons" ? (
        <Button asChild size="sm" variant="outline">
          <AppLink to="/events/$eventId/coupons" params={{ eventId }}>
            Open
          </AppLink>
        </Button>
      ) : item.href ? (
        <Button asChild size="sm" variant="outline">
          <AppLink
            to={`/events/$eventId/setup/${item.href}` as "/events/$eventId/setup/basics"}
            params={{ eventId }}
          >
            Fix
          </AppLink>
        </Button>
      ) : (
        <Button asChild size="sm" variant="outline">
          <a href="/onboarding/payment">Fix</a>
        </Button>
      )}
    </div>
  );
}

export function CouponsScreen({ eventId }: ScreenProps) {
  const event = useCurrentEvent(eventId);
  const { demo, persona } = useConsoleShell();
  const rows = demo === "empty" ? [] : mockCoupons.filter((coupon) => coupon.eventId === event.id);
  const denied = demo === "permission-denied" || persona.id === "org-readonly";
  const active = rows.filter((coupon) => coupon.status === "active").length;
  const redeemed = rows.reduce((sum, coupon) => sum + coupon.redeemed, 0);
  const discount = rows.reduce(
    (sum, coupon) =>
      sum +
      (coupon.discountType === "flat"
        ? coupon.redeemed * coupon.discountValue
        : coupon.redeemed * 12000),
    0,
  );
  if (demo === "loading")
    return (
      <div className="grid gap-6">
        <ScreenHeader
          eyebrow="O-10 Coupons"
          title="Coupon codes"
          description="Loading coupon fixtures."
        />
        <LoadingGrid />
      </div>
    );
  return (
    <div className="grid gap-6">
      <ScreenHeader
        eyebrow="O-10 Coupons"
        title="Coupon codes"
        description="Create sponsor, club, and influencer codes with caps, validity, category scope, and DPDP-safe usage controls."
        actions={<Button disabled={denied}>Create coupon</Button>}
      />
      {demo === "validation-error" ? (
        <DemoAlert title="Overlap warning">
          CBE10CLUB and RUNCLUB10 are both active for 10K from 1–10 June. Runners will see the
          better discount only.
        </DemoAlert>
      ) : null}
      {demo === "success" ? (
        <DemoAlert tone="success" title="Coupon saved">
          Checkout preview refreshed with the new code.
        </DemoAlert>
      ) : null}
      {denied ? (
        <DemoAlert tone="danger" title="Read-only viewer">
          Create, export, and bulk disable controls are disabled for this persona.
        </DemoAlert>
      ) : null}
      {rows.length === 0 ? (
        <EmptyState
          title="No coupon codes yet"
          description="Create a percentage or flat code for sponsor teams, running clubs, or staff comps."
          action={<Button disabled={denied}>Create coupon</Button>}
        />
      ) : (
        <>
          <section className="grid gap-4 md:grid-cols-4">
            <MetricCard label="Active codes" value={String(active)} note="Ready for checkout" />
            <MetricCard
              label="Redemptions"
              value={String(redeemed)}
              note="No participant PII in this table"
            />
            <MetricCard label="Discount given" value={rupee(discount)} note="Organizer absorbed" />
            <MetricCard label="Expiring this week" value="2" note="Review validity" />
          </section>
          <div className="grid gap-4 xl:grid-cols-[1fr_24rem]">
            <Card className="rounded-[1.5rem]">
              <CardHeader>
                <CardTitle>Coupon table</CardTitle>
                <CardDescription>Filter chips and pagination are mocked locally.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4 flex flex-wrap gap-2">
                  <Input
                    className="max-w-sm"
                    aria-label="Search coupon codes"
                    placeholder="Search code or sponsor"
                  />
                  <Badge variant="secondary">Active</Badge>
                  <Badge variant="outline">Scheduled</Badge>
                  <Badge variant="outline">Expired</Badge>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Discount</TableHead>
                      <TableHead>Validity</TableHead>
                      <TableHead>Usage</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((coupon) => (
                      <TableRow
                        key={coupon.id}
                        className={
                          demo === "validation-error" && coupon.status === "active"
                            ? "bg-warning/5"
                            : undefined
                        }
                      >
                        <TableCell className="font-mono font-semibold">
                          {coupon.code}
                          <div className="font-sans text-xs font-normal text-muted-foreground">
                            {coupon.description}
                          </div>
                        </TableCell>
                        <TableCell>
                          {coupon.discountType === "flat"
                            ? rupee(coupon.discountValue)
                            : `${coupon.discountValue}%`}
                        </TableCell>
                        <TableCell>Until {formatDate(coupon.expiresAt)}</TableCell>
                        <TableCell>
                          {coupon.redeemed}/{coupon.maxRedemptions}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              coupon.status === "active"
                                ? "success"
                                : coupon.status === "expired"
                                  ? "muted"
                                  : "info"
                            }
                          >
                            {coupon.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            <Card className="rounded-[1.5rem]">
              <CardHeader>
                <CardTitle>Create coupon</CardTitle>
                <CardDescription>Validation-error demo highlights inline issues.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <TextField
                  id="coupon-code"
                  label="Code"
                  defaultValue={demo === "validation-error" ? "CBE10CLUB" : "BROOKEFIELDS25"}
                  error={
                    demo === "validation-error"
                      ? "Duplicate active code for this audience."
                      : undefined
                  }
                />
                <FieldGroup>
                  <FieldLabel>Discount type</FieldLabel>
                  <RadioGroup defaultValue="percent">
                    <label htmlFor="discount-percent" className="flex items-center gap-2">
                      <RadioGroupItem value="percent" id="discount-percent" />
                      Percent
                    </label>
                    <label htmlFor="discount-flat" className="flex items-center gap-2">
                      <RadioGroupItem value="flat" id="discount-flat" />
                      Flat ₹
                    </label>
                  </RadioGroup>
                </FieldGroup>
                <TextField
                  id="discount-value"
                  label="Discount value"
                  type="number"
                  defaultValue="10"
                />
                <TextField id="usage-cap" label="Usage cap" type="number" defaultValue="150" />
                <div className="grid grid-cols-2 gap-3">
                  <TextField
                    id="valid-from"
                    label="Valid from"
                    type="date"
                    defaultValue="2026-06-01"
                  />
                  <TextField
                    id="valid-until"
                    label="Valid until"
                    type="date"
                    defaultValue="2026-06-12"
                  />
                </div>
                <Field>
                  <FieldLabel>Apply to categories</FieldLabel>
                  <div className="grid gap-2">
                    {event.categories.map((category) => (
                      <label
                        key={category.id}
                        htmlFor={`coupon-${category.id}`}
                        className="flex items-center gap-2 text-sm"
                      >
                        <Checkbox id={`coupon-${category.id}`} defaultChecked />
                        {category.label}
                      </label>
                    ))}
                  </div>
                </Field>
                <Button disabled={denied}>Save coupon</Button>
                <Button variant="outline" disabled={denied}>
                  Export usage (audit reason required)
                </Button>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
