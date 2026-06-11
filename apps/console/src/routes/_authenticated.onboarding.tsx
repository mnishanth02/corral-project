import type { CreateOrganizerOnboardingRequest, OrganizerSummary } from "@corral/schema";
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
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@corral/ui/components/field";
import { Input } from "@corral/ui/components/input";
import { RadioGroup, RadioGroupItem } from "@corral/ui/components/radio-group";
import { Skeleton } from "@corral/ui/components/skeleton";
import { Spinner } from "@corral/ui/components/spinner";
import { StatusBadge } from "@corral/ui/components/status-badge";
import { Textarea } from "@corral/ui/components/textarea";
import { createFileRoute } from "@tanstack/react-router";
import type { FormEvent } from "react";
import { useEffect, useId, useRef, useState } from "react";

import { consoleApiClient } from "../lib/api";
import type { DemoState } from "../mocks/types";
import { parseDemoState } from "../mocks/utils";

type OnboardingSearch = { demo: DemoState };
type EntityType = CreateOrganizerOnboardingRequest["entityType"];
type FieldErrors = Partial<
  Record<"name" | "legalName" | "gstin" | "phone" | "city" | "state" | "supportContact", string>
>;

const gstinPattern = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
const phonePattern = /^\+?[0-9][0-9\s-]{7,18}$/;

export const Route = createFileRoute("/_authenticated/onboarding")({
  validateSearch: (search): OnboardingSearch => ({ demo: parseDemoState(search.demo) }),
  staticData: { breadcrumb: "Onboarding" },
  component: OnboardingPage,
});

function ErrorText({ children, id }: { children?: string; id: string }) {
  if (!children) return null;
  return (
    <p id={id} aria-live="polite" className="text-danger-text text-sm font-medium">
      {children}
    </p>
  );
}

function OnboardingPage() {
  const { demo } = Route.useSearch();
  const nameId = useId();
  const legalNameId = useId();
  const gstinId = useId();
  const phoneId = useId();
  const cityId = useId();
  const stateId = useId();
  const supportId = useId();
  const financeId = useId();
  const errorRef = useRef<HTMLDivElement>(null);
  const [entityType, setEntityType] = useState<EntityType>(demo === "empty" ? "non-gst" : "gst");
  const [organizer, setOrganizer] = useState<OrganizerSummary | null>(null);
  const [canCreateOrganizer, setCanCreateOrganizer] = useState(false);
  const [isLoading, setIsLoading] = useState(demo !== "loading");
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [errors, setErrors] = useState<FieldErrors>(
    demo === "validation-error" ? { gstin: "GSTIN is required for GST-registered entities." } : {},
  );

  useEffect(() => {
    if (demo === "loading") {
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    void consoleApiClient
      .onboardingStatus({ headers: {} })
      .then((response) => {
        if (cancelled) return;
        if (response.status !== 200) {
          throw new Error(response.body.message);
        }
        setOrganizer(response.body.organizer);
        setCanCreateOrganizer(response.body.canCreateOrganizer);
      })
      .catch((loadError: unknown) => {
        if (cancelled) return;
        setStatus(loadError instanceof Error ? loadError.message : "Could not load onboarding.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [demo]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload: CreateOrganizerOnboardingRequest = {
      name: String(form.get("name") ?? "").trim(),
      legalName: String(form.get("legalName") ?? "").trim(),
      entityType,
      gstin:
        String(form.get("gstin") ?? "")
          .trim()
          .toUpperCase() || undefined,
      phone: String(form.get("phone") ?? "").trim(),
      city: String(form.get("city") ?? "").trim(),
      state: String(form.get("state") ?? "").trim(),
      supportContact: String(form.get("supportContact") ?? "").trim(),
      billingAddress: String(form.get("billingAddress") ?? "").trim() || undefined,
      financeContact: String(form.get("financeContact") ?? "").trim() || undefined,
    };
    const nextErrors: FieldErrors = {};

    if (!payload.name) nextErrors.name = "Organization name is required.";
    if (!payload.legalName) nextErrors.legalName = "Legal name is required.";
    if (entityType === "gst" && !payload.gstin) {
      nextErrors.gstin = "GSTIN is required for GST-registered entities.";
    } else if (entityType === "gst" && payload.gstin && !gstinPattern.test(payload.gstin)) {
      nextErrors.gstin = "Enter a valid 15-character GSTIN.";
    }
    if (!payload.phone) {
      nextErrors.phone = "Phone is required.";
    } else if (!phonePattern.test(payload.phone)) {
      nextErrors.phone = "Enter a valid phone number.";
    }
    if (!payload.city) nextErrors.city = "City is required.";
    if (!payload.state) nextErrors.state = "State is required.";
    if (!payload.supportContact) {
      nextErrors.supportContact = "Support email or phone is required.";
    } else if (!isEmail(payload.supportContact) && !phonePattern.test(payload.supportContact)) {
      nextErrors.supportContact = "Enter a valid support email or phone number.";
    }

    if (Object.keys(nextErrors).length > 0 || demo === "validation-error") {
      setErrors({
        ...nextErrors,
        ...(demo === "validation-error"
          ? { gstin: "GSTIN is required for GST-registered entities." }
          : {}),
      });
      setStatus(null);
      window.requestAnimationFrame(() => errorRef.current?.focus());
      return;
    }

    setIsSaving(true);
    setErrors({});
    setStatus(null);

    const response = await consoleApiClient.createOrganizerOnboarding({
      headers: {},
      body: payload,
    });

    setIsSaving(false);

    if (response.status !== 201) {
      setStatus(response.body.message);
      window.requestAnimationFrame(() => errorRef.current?.focus());
      return;
    }

    setOrganizer(response.body.organizer);
    setCanCreateOrganizer(false);
    setStatus("Organizer profile submitted for Corral review.");
  }

  if (demo === "loading" || isLoading) {
    return <OnboardingSkeleton />;
  }

  if (organizer) {
    return <ExistingOrganizer organizer={organizer} notice={status} />;
  }

  return (
    <div className="mx-auto grid max-w-7xl gap-6 xl:grid-cols-[1fr_22rem]">
      <section className="space-y-6">
        <div className="rounded-[2rem] border border-border bg-card p-7 shadow-xl shadow-slate-950/5">
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="info">O-02</Badge>
            <Badge variant={entityType === "gst" ? "success" : "secondary"}>
              {entityType === "gst" ? "GST entity" : "Non-GST club/trust"}
            </Badge>
            <Badge variant="warning">Email verified</Badge>
          </div>
          <div className="mt-5">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-brand-orange-strong">
              Organizer onboarding
            </p>
            <h1 className="mt-2 font-display text-5xl font-black uppercase leading-none tracking-tight">
              Submit your organizer profile
            </h1>
            <p className="mt-4 max-w-3xl text-muted-foreground">
              Create the legal organizer record and owner membership. Corral admins review this
              profile before publishing and payment collection are enabled.
            </p>
          </div>
        </div>

        {!canCreateOrganizer ? (
          <Alert className="border-warning/30 bg-warning/10 text-warning-text">
            <AlertTitle>Onboarding is not available</AlertTitle>
            <AlertDescription>
              Verify your email first, or contact Corral support if this account already belongs to
              an organizer.
            </AlertDescription>
          </Alert>
        ) : null}

        <form onSubmit={handleSubmit} noValidate className="grid gap-6">
          {(Object.keys(errors).length > 0 || status) && (
            <Alert
              ref={errorRef}
              tabIndex={-1}
              variant={Object.keys(errors).length > 0 ? "destructive" : "default"}
              aria-live="polite"
            >
              <AlertTitle>
                {Object.keys(errors).length > 0 ? "Profile needs attention" : "Onboarding update"}
              </AlertTitle>
              <AlertDescription>
                {Object.keys(errors).length > 0
                  ? "Fix the highlighted fields before submitting."
                  : status}
              </AlertDescription>
            </Alert>
          )}

          <div className="grid gap-6 xl:grid-cols-2">
            <Card className="rounded-[1.5rem]">
              <CardHeader>
                <CardTitle className="font-display text-3xl uppercase">1 · Organization</CardTitle>
                <CardDescription>
                  Used on event pages, receipts, support messages, and admin review.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor={nameId}>Organizer / club name</FieldLabel>
                    <Input
                      id={nameId}
                      name="name"
                      placeholder="Kovai Road Runners"
                      autoComplete="organization"
                      aria-invalid={Boolean(errors.name)}
                      disabled={!canCreateOrganizer || isSaving}
                    />
                    <ErrorText id={`${nameId}-error`}>{errors.name}</ErrorText>
                  </Field>
                  <Field>
                    <FieldLabel htmlFor={legalNameId}>Legal entity name</FieldLabel>
                    <Input
                      id={legalNameId}
                      name="legalName"
                      placeholder="Kovai Road Runners Sports Trust"
                      aria-invalid={Boolean(errors.legalName)}
                      disabled={!canCreateOrganizer || isSaving}
                    />
                    <FieldDescription>Shown on receipts and finance reports.</FieldDescription>
                    <ErrorText id={`${legalNameId}-error`}>{errors.legalName}</ErrorText>
                  </Field>
                  <Field>
                    <FieldLabel>Billing address</FieldLabel>
                    <Textarea
                      name="billingAddress"
                      placeholder="Race Course Road, Coimbatore, Tamil Nadu 641018"
                      rows={3}
                      disabled={!canCreateOrganizer || isSaving}
                    />
                  </Field>
                </FieldGroup>
              </CardContent>
            </Card>

            <Card className="rounded-[1.5rem]">
              <CardHeader>
                <CardTitle className="font-display text-3xl uppercase">2 · Entity & GST</CardTitle>
                <CardDescription>
                  Pick the branch that matches the organizer's operating model.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={entityType}
                  onValueChange={(value) => setEntityType(value as EntityType)}
                  className="grid gap-3"
                  disabled={!canCreateOrganizer || isSaving}
                >
                  <label
                    htmlFor="entity-gst"
                    className="flex cursor-pointer gap-3 rounded-2xl border border-border p-4 focus-within:ring-2 focus-within:ring-primary"
                  >
                    <RadioGroupItem
                      id="entity-gst"
                      value="gst"
                      aria-label="GST-registered entity"
                    />
                    <span>
                      <span className="block font-semibold">GST-registered entity</span>
                      <span className="block text-sm text-muted-foreground">
                        Use GSTIN, tax invoice fields, CGST/SGST split.
                      </span>
                    </span>
                  </label>
                  <label
                    htmlFor="entity-non-gst"
                    className="flex cursor-pointer gap-3 rounded-2xl border border-border p-4 focus-within:ring-2 focus-within:ring-primary"
                  >
                    <RadioGroupItem id="entity-non-gst" value="non-gst" aria-label="Non-GST club" />
                    <span>
                      <span className="block font-semibold">Non-GST club / trust / society</span>
                      <span className="block text-sm text-muted-foreground">
                        Payment reports only; organizer GST invoice export stays unavailable.
                      </span>
                    </span>
                  </label>
                </RadioGroup>
                <div className="mt-5">
                  {entityType === "gst" ? (
                    <Field>
                      <FieldLabel htmlFor={gstinId}>GSTIN</FieldLabel>
                      <Input
                        id={gstinId}
                        name="gstin"
                        placeholder="33AAECK1042R1Z5"
                        aria-invalid={Boolean(errors.gstin)}
                        disabled={!canCreateOrganizer || isSaving}
                      />
                      <ErrorText id={`${gstinId}-error`}>{errors.gstin}</ErrorText>
                    </Field>
                  ) : (
                    <Alert className="border-info/30 bg-info/10 text-info-text">
                      <AlertTitle>Non-GST branch</AlertTitle>
                      <AlertDescription>
                        Participants receive confirmations and organizer reports; GST export stays
                        unavailable.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="rounded-[1.5rem]">
            <CardHeader>
              <CardTitle className="font-display text-3xl uppercase">3 · Contacts & city</CardTitle>
              <CardDescription>
                Support and location data are required before public registration links are shared.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-5 lg:grid-cols-2">
              <Field>
                <FieldLabel htmlFor={phoneId}>Organizer phone</FieldLabel>
                <Input
                  id={phoneId}
                  name="phone"
                  placeholder="+91 98765 43210"
                  autoComplete="tel"
                  aria-invalid={Boolean(errors.phone)}
                  disabled={!canCreateOrganizer || isSaving}
                />
                <ErrorText id={`${phoneId}-error`}>{errors.phone}</ErrorText>
              </Field>
              <Field>
                <FieldLabel htmlFor={supportId}>Primary event support contact</FieldLabel>
                <Input
                  id={supportId}
                  name="supportContact"
                  placeholder="support@kovairoadclub.in"
                  autoComplete="email"
                  aria-invalid={Boolean(errors.supportContact)}
                  disabled={!canCreateOrganizer || isSaving}
                />
                <ErrorText id={`${supportId}-error`}>{errors.supportContact}</ErrorText>
              </Field>
              <Field>
                <FieldLabel htmlFor={cityId}>City</FieldLabel>
                <Input
                  id={cityId}
                  name="city"
                  placeholder="Coimbatore"
                  aria-invalid={Boolean(errors.city)}
                  disabled={!canCreateOrganizer || isSaving}
                />
                <ErrorText id={`${cityId}-error`}>{errors.city}</ErrorText>
              </Field>
              <Field>
                <FieldLabel htmlFor={stateId}>State</FieldLabel>
                <Input
                  id={stateId}
                  name="state"
                  placeholder="Tamil Nadu"
                  aria-invalid={Boolean(errors.state)}
                  disabled={!canCreateOrganizer || isSaving}
                />
                <ErrorText id={`${stateId}-error`}>{errors.state}</ErrorText>
              </Field>
              <Field className="lg:col-span-2">
                <FieldLabel htmlFor={financeId}>Finance contact</FieldLabel>
                <Input
                  id={financeId}
                  name="financeContact"
                  placeholder="finance@kovairoadclub.in"
                  autoComplete="email"
                  disabled={!canCreateOrganizer || isSaving}
                />
                <FieldDescription>Receives settlement and GST report reminders.</FieldDescription>
              </Field>
              <div className="flex flex-wrap gap-3 lg:col-span-2">
                <Button type="submit" disabled={!canCreateOrganizer || isSaving}>
                  {isSaving ? <Spinner /> : null}
                  Submit for review
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </section>

      <aside className="space-y-4">
        <Card className="rounded-[1.5rem]">
          <CardHeader>
            <CardTitle className="font-display text-2xl uppercase">Review gate</CardTitle>
            <CardDescription>What happens after submission.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <StatusBadge status="ok" label="Owner membership created" />
            <StatusBadge status="pending" label="Admin profile review" />
            <StatusBadge status="pending" label="Event publishing locked" />
            <p className="text-sm text-muted-foreground">
              You can prepare drafts after the event domain slice lands. Approval is required before
              public launch and payments.
            </p>
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}

function ExistingOrganizer({
  organizer,
  notice,
}: {
  organizer: OrganizerSummary;
  notice: string | null;
}) {
  return (
    <div className="mx-auto max-w-5xl">
      <Card className="overflow-hidden rounded-[2rem]">
        <CardHeader className="bg-[#0f172a] text-white">
          <Badge variant="outline" className="w-fit border-white/20 text-white">
            {organizer.reviewStatus}
          </Badge>
          <CardTitle className="font-display text-5xl uppercase leading-none">
            {organizer.name}
          </CardTitle>
          <CardDescription className="text-slate-300">
            {organizer.legalName} · {organizer.city}, {organizer.state}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 p-6 md:grid-cols-2">
          {notice ? (
            <Alert className="border-success/30 bg-success/10 text-success-text md:col-span-2">
              <AlertTitle>Profile saved</AlertTitle>
              <AlertDescription>{notice}</AlertDescription>
            </Alert>
          ) : null}
          <Detail label="Entity type" value={organizer.entityType === "gst" ? "GST" : "Non-GST"} />
          <Detail label="GSTIN" value={organizer.gstin ?? "Not applicable"} />
          <Detail label="Support contact" value={organizer.supportContact} />
          <Detail label="Finance contact" value={organizer.financeContact ?? "Not set"} />
          <Detail label="Billing address" value={organizer.billingAddress ?? "Not set"} wide />
          <StatusAlert organizer={organizer} />
          <Card className="rounded-[1.5rem] border-primary/20 bg-brand-tint/50 md:col-span-2">
            <CardHeader>
              <CardTitle className="font-display text-2xl uppercase">What happens next</CardTitle>
              <CardDescription>{nextStepCopy(organizer.reviewStatus)}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Button asChild variant="outline">
                <a href="/onboarding/payment">View payment onboarding</a>
              </Button>
              <Button type="button" disabled>
                Event creation coming next
              </Button>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}

function StatusAlert({ organizer }: { organizer: OrganizerSummary }) {
  if (organizer.reviewStatus === "approved") {
    return (
      <Alert className="border-success/30 bg-success/10 text-success-text md:col-span-2">
        <AlertTitle>Approved by Corral</AlertTitle>
        <AlertDescription>
          This organizer passed review. Real event creation is the next organizer/event domain
          slice.
        </AlertDescription>
      </Alert>
    );
  }

  if (organizer.reviewStatus === "changes-requested") {
    return (
      <Alert className="border-warning/30 bg-warning/10 text-warning-text md:col-span-2">
        <AlertTitle>Changes requested</AlertTitle>
        <AlertDescription>
          Corral needs updates before this organizer can launch public events.
        </AlertDescription>
      </Alert>
    );
  }

  if (organizer.reviewStatus === "rejected") {
    return (
      <Alert variant="destructive" className="md:col-span-2">
        <AlertTitle>Organizer rejected</AlertTitle>
        <AlertDescription>Contact Corral support before creating events.</AlertDescription>
      </Alert>
    );
  }

  if (organizer.reviewStatus === "suspended") {
    return (
      <Alert variant="destructive" className="md:col-span-2">
        <AlertTitle>Organizer suspended</AlertTitle>
        <AlertDescription>Event publishing and payments are unavailable.</AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert className="border-warning/30 bg-warning/10 text-warning-text md:col-span-2">
      <AlertTitle>Pending Corral review</AlertTitle>
      <AlertDescription>
        Platform admins can approve, request changes, reject, or suspend this organizer from the
        admin organizer queue.
      </AlertDescription>
    </Alert>
  );
}

function nextStepCopy(reviewStatus: OrganizerSummary["reviewStatus"]) {
  if (reviewStatus === "approved") {
    return "Your organizer is approved. Event setup will unlock when the event-domain APIs are implemented.";
  }

  if (reviewStatus === "pending") {
    return "Corral will review the organizer details. You are not stuck: payment onboarding can be previewed while event creation is being built.";
  }

  return "Review this profile status with Corral support before launching events.";
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function Detail({ label, value, wide }: { label: string; value: string; wide?: boolean }) {
  return (
    <div
      className={`rounded-2xl border border-border bg-muted/30 p-4 ${wide ? "md:col-span-2" : ""}`}
    >
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
      <p className="mt-2 font-semibold">{value}</p>
    </div>
  );
}

function OnboardingSkeleton() {
  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
      <div className="space-y-6">
        <Skeleton className="h-56 rounded-[2rem]" />
        <div className="grid gap-6 xl:grid-cols-2">
          <Skeleton className="h-96 rounded-[1.5rem]" />
          <Skeleton className="h-96 rounded-[1.5rem]" />
        </div>
        <Skeleton className="h-72 rounded-[1.5rem]" />
      </div>
      <Skeleton className="h-96 rounded-[1.5rem]" />
    </div>
  );
}
