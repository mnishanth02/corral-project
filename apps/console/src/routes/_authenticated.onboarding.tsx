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
import { StatusBadge } from "@corral/ui/components/status-badge";
import { Textarea } from "@corral/ui/components/textarea";
import { createFileRoute, Link } from "@tanstack/react-router";
import type { FormEvent } from "react";
import { useId, useMemo, useRef, useState } from "react";

import { useConsoleShell } from "../components/console-shell-context";
import { mockOrganizers } from "../mocks/organizers";
import type { DemoState } from "../mocks/types";
import { formatDate, mockMutate, parseDemoState } from "../mocks/utils";

type OnboardingSearch = { demo: DemoState };

type EntityType = "gst" | "non-gst";

type FieldErrors = Partial<Record<"name" | "legalName" | "gstin" | "supportContact", string>>;

export const Route = createFileRoute("/_authenticated/onboarding")({
  validateSearch: (search): OnboardingSearch => ({ demo: parseDemoState(search.demo) }),
  staticData: { breadcrumb: "Onboarding" },
  component: OnboardingPage,
});

function ErrorText({ children, id }: { children?: string; id: string }) {
  if (!children) return null;
  return (
    <p id={id} aria-live="polite" className="text-danger-text text-sm font-medium">
      ⚠ {children}
    </p>
  );
}

function OnboardingPage() {
  const { activeEventId, persona } = useConsoleShell();
  const { demo } = Route.useSearch();
  const organizer = mockOrganizers[0];
  const nameId = useId();
  const legalNameId = useId();
  const gstinId = useId();
  const supportId = useId();
  const financeId = useId();
  const errorRef = useRef<HTMLDivElement>(null);
  const [entityType, setEntityType] = useState<EntityType>(demo === "empty" ? "non-gst" : "gst");
  const [status, setStatus] = useState<string | null>(
    demo === "success" ? "Organizer profile saved." : null,
  );
  const [errors, setErrors] = useState<FieldErrors>(
    demo === "validation-error" ? { gstin: "GSTIN is required for GST-registered entities." } : {},
  );

  const isAdminCreated = persona.id === "corral-admin-impersonating" || demo === "success";
  const isValidationDemo = demo === "validation-error";

  const defaultValues = useMemo(
    () => ({
      name: demo === "empty" ? "" : organizer.name,
      legalName: demo === "empty" ? "" : organizer.legalName,
      gstin:
        entityType === "gst" ? (demo === "validation-error" ? "" : (organizer.gstin ?? "")) : "",
      supportContact: demo === "empty" ? "" : organizer.supportContact,
      financeContact: demo === "empty" ? "" : "finance@kovairoadclub.in",
    }),
    [demo, entityType],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const nextErrors: FieldErrors = {};
    const payload = {
      name: String(form.get("name") ?? "").trim(),
      legalName: String(form.get("legalName") ?? "").trim(),
      gstin: String(form.get("gstin") ?? "").trim(),
      supportContact: String(form.get("supportContact") ?? "").trim(),
      financeContact: String(form.get("financeContact") ?? "").trim(),
      entityType,
    };

    if (!payload.name) nextErrors.name = "Organization name is required.";
    if (!payload.legalName)
      nextErrors.legalName = "Legal name is required for invoices and contracts.";
    if (entityType === "gst" && !payload.gstin)
      nextErrors.gstin = "GSTIN is required for GST-registered entities.";
    if (!payload.supportContact) nextErrors.supportContact = "Support email or phone is required.";

    if (Object.keys(nextErrors).length > 0 || isValidationDemo) {
      setErrors({
        ...nextErrors,
        ...(isValidationDemo ? { gstin: "GSTIN is required for GST-registered entities." } : {}),
      });
      setStatus(null);
      window.requestAnimationFrame(() => errorRef.current?.focus());
      return;
    }

    const result = await mockMutate(payload, { demo });
    if (!result.ok) {
      setErrors({ name: result.message });
      setStatus(null);
      return;
    }

    setErrors({});
    setStatus("Organizer profile saved. Payment onboarding is ready.");
  }

  if (demo === "loading") {
    return <OnboardingSkeleton />;
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
            {isAdminCreated ? <Badge variant="warning">Admin-created draft</Badge> : null}
          </div>
          <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-brand-orange-strong">
                Organizer onboarding
              </p>
              <h1 className="mt-2 font-display text-5xl font-black uppercase leading-none tracking-tight">
                Set up your organizer profile
              </h1>
              <p className="mt-4 max-w-3xl text-muted-foreground">
                Capture the Coimbatore club/entity profile, GST branch, support owner, and finance
                contact before paid registrations open.
              </p>
            </div>
            <Button asChild variant="outline">
              <Link to="/" search={{ demo: "default" }}>
                Skip to dashboard
              </Link>
            </Button>
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate className="grid gap-6">
          {(Object.keys(errors).length > 0 || demo === "validation-error") && (
            <Alert ref={errorRef} tabIndex={-1} variant="destructive" aria-live="polite">
              <AlertTitle>Profile needs attention</AlertTitle>
              <AlertDescription>
                Fix the highlighted fields. GSTIN is mandatory when you choose GST-registered
                entity.
              </AlertDescription>
            </Alert>
          )}
          {status ? (
            <Alert className="border-success/30 bg-success/10 text-success-text" aria-live="polite">
              <AlertTitle>Saved locally</AlertTitle>
              <AlertDescription>{status}</AlertDescription>
            </Alert>
          ) : null}

          <div className="grid gap-6 xl:grid-cols-2">
            <Card className="rounded-[1.5rem]">
              <CardHeader>
                <CardTitle className="font-display text-3xl uppercase">1 · Organization</CardTitle>
                <CardDescription>
                  Used on event pages, invoices, support messages, and team invites.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor={nameId}>Organizer / club name</FieldLabel>
                    <Input
                      id={nameId}
                      name="name"
                      defaultValue={defaultValues.name}
                      placeholder="Kovai Road Runners"
                      autoComplete="organization"
                      aria-invalid={Boolean(errors.name)}
                      aria-describedby={errors.name ? `${nameId}-error` : undefined}
                    />
                    <ErrorText id={`${nameId}-error`}>{errors.name}</ErrorText>
                  </Field>
                  <Field>
                    <FieldLabel htmlFor={legalNameId}>Legal entity name</FieldLabel>
                    <Input
                      id={legalNameId}
                      name="legalName"
                      defaultValue={defaultValues.legalName}
                      placeholder="Kovai Road Runners Sports Trust"
                      aria-invalid={Boolean(errors.legalName)}
                      aria-describedby={errors.legalName ? `${legalNameId}-error` : undefined}
                    />
                    <FieldDescription>Shown on receipts and finance reports.</FieldDescription>
                    <ErrorText id={`${legalNameId}-error`}>{errors.legalName}</ErrorText>
                  </Field>
                  <Field>
                    <FieldLabel>Billing address</FieldLabel>
                    <Textarea
                      name="billingAddress"
                      defaultValue="Race Course Road, Coimbatore, Tamil Nadu 641018"
                      rows={3}
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
                    <RadioGroupItem
                      id="entity-non-gst"
                      value="non-gst"
                      aria-label="Non-GST club trust society"
                    />
                    <span>
                      <span className="block font-semibold">Non-GST club / trust / society</span>
                      <span className="block text-sm text-muted-foreground">
                        Payment report only; no organizer GST invoice is generated.
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
                        defaultValue={defaultValues.gstin}
                        placeholder="33AAECK1042R1Z5"
                        aria-invalid={Boolean(errors.gstin)}
                        aria-describedby={errors.gstin ? `${gstinId}-error` : undefined}
                      />
                      <ErrorText id={`${gstinId}-error`}>{errors.gstin}</ErrorText>
                    </Field>
                  ) : (
                    <Alert className="border-info/30 bg-info/10 text-info-text">
                      <AlertTitle>Non-GST branch</AlertTitle>
                      <AlertDescription>
                        Participants receive payment confirmations and organizer reports; GST tax
                        invoice export stays unavailable for this profile.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="rounded-[1.5rem]">
            <CardHeader>
              <CardTitle className="font-display text-3xl uppercase">
                3 · Contacts & review
              </CardTitle>
              <CardDescription>
                Support owner is required before public registration links are shared.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-5 lg:grid-cols-2">
              <Field>
                <FieldLabel htmlFor={supportId}>Primary event support contact</FieldLabel>
                <Input
                  id={supportId}
                  name="supportContact"
                  defaultValue={defaultValues.supportContact}
                  placeholder="support@kovairoadclub.in"
                  autoComplete="email"
                  aria-invalid={Boolean(errors.supportContact)}
                  aria-describedby={errors.supportContact ? `${supportId}-error` : undefined}
                />
                <ErrorText id={`${supportId}-error`}>{errors.supportContact}</ErrorText>
              </Field>
              <Field>
                <FieldLabel htmlFor={financeId}>Finance contact</FieldLabel>
                <Input
                  id={financeId}
                  name="financeContact"
                  defaultValue={defaultValues.financeContact}
                  placeholder="finance@kovairoadclub.in"
                  autoComplete="email"
                />
                <FieldDescription>Receives settlement and GST report reminders.</FieldDescription>
              </Field>
              <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-4 lg:col-span-2">
                <p className="text-sm font-semibold">Document upload placeholder</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  PAN, cancelled cheque, and trust/company documents are captured in payment
                  onboarding. No files leave this frontend demo.
                </p>
              </div>
              <div className="flex flex-wrap gap-3 lg:col-span-2">
                <Button type="submit">Save & continue</Button>
                <Button asChild type="button" variant="outline">
                  <Link to="/onboarding/payment" search={{ demo: "default", kyc: "not-started" }}>
                    Continue to payment KYC
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </section>

      <aside className="space-y-4">
        <Card className="rounded-[1.5rem]">
          <CardHeader>
            <CardTitle className="font-display text-2xl uppercase">Pilot gate</CardTitle>
            <CardDescription>Profile readiness for {activeEventId}.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <StatusBadge status="ok" label="Club details drafted" />
            <StatusBadge
              status={entityType === "gst" ? "ok" : "info"}
              label={entityType === "gst" ? "GST invoice branch" : "Non-GST report branch"}
            />
            <StatusBadge status="pending" label="Payment KYC next" />
            <p className="text-sm text-muted-foreground">
              Last seeded from {organizer.ownerName} on {formatDate(organizer.createdAt)}.
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-[1.5rem] border-primary/30 bg-brand-tint/60">
          <CardHeader>
            <CardTitle className="font-display text-2xl uppercase">Demo URLs</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm">
            <Link
              className="underline underline-offset-4"
              to="/onboarding"
              search={{ demo: "default" }}
            >
              Default GST profile
            </Link>
            <Link
              className="underline underline-offset-4"
              to="/onboarding"
              search={{ demo: "validation-error" }}
            >
              Validation errors
            </Link>
            <Link
              className="underline underline-offset-4"
              to="/onboarding"
              search={{ demo: "empty" }}
            >
              Non-GST empty draft
            </Link>
            <Link
              className="underline underline-offset-4"
              to="/onboarding"
              search={{ demo: "success" }}
            >
              Admin-created saved
            </Link>
          </CardContent>
        </Card>
      </aside>
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
