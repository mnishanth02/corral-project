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
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@corral/ui/components/field";
import { Input } from "@corral/ui/components/input";
import { Progress } from "@corral/ui/components/progress";
import { Skeleton } from "@corral/ui/components/skeleton";
import { StatusBadge, type StatusKind } from "@corral/ui/components/status-badge";
import { Textarea } from "@corral/ui/components/textarea";
import { createFileRoute, Link } from "@tanstack/react-router";
import type { FormEvent } from "react";
import { useId, useRef, useState } from "react";

import { mockOrganizers } from "../mocks/organizers";
import { formatDate, mockMutate } from "../mocks/utils";

type PaymentDemo =
  | "not-started"
  | "KYC-submitted"
  | "pending-verification"
  | "rejected"
  | "active"
  | "settlement-blocked"
  | "loading"
  | "validation-error";

type PaymentSearch = { kyc: PaymentDemo };

const paymentDemos = [
  "not-started",
  "KYC-submitted",
  "pending-verification",
  "rejected",
  "active",
  "settlement-blocked",
  "loading",
  "validation-error",
] as const satisfies PaymentDemo[];

const stateCopy: Record<
  Exclude<PaymentDemo, "loading" | "validation-error">,
  {
    label: string;
    status: StatusKind;
    progress: number;
    title: string;
    description: string;
    next: string;
  }
> = {
  "not-started": {
    label: "Not started",
    status: "neutral",
    progress: 18,
    title: "Start Razorpay linked-account KYC",
    description:
      "Collect PAN, bank account, business address, and authorized signatory details in this frontend mock.",
    next: "Submit KYC draft",
  },
  "KYC-submitted": {
    label: "KYC submitted",
    status: "info",
    progress: 52,
    title: "KYC submitted to review queue",
    description:
      "Corral has the linked-account packet. Verification usually moves to pending within one working day.",
    next: "Track verification",
  },
  "pending-verification": {
    label: "Pending verification",
    status: "pending",
    progress: 68,
    title: "Razorpay verification in progress",
    description:
      "Paid registration remains gated until the linked account is active. Settlement target is T+2 after activation.",
    next: "Refresh demo status",
  },
  rejected: {
    label: "Rejected",
    status: "error",
    progress: 42,
    title: "KYC needs correction",
    description:
      "Cancelled cheque name does not match Kovai Road Runners Sports Trust. Re-upload corrected bank proof.",
    next: "Resubmit KYC",
  },
  active: {
    label: "Active",
    status: "ok",
    progress: 100,
    title: "Linked account active",
    description:
      "Payments can open. Razorpay Route settlements are configured for T+2 to the verified bank account.",
    next: "Open publish checklist",
  },
  "settlement-blocked": {
    label: "Settlement blocked",
    status: "warning",
    progress: 82,
    title: "Payments can be collected, settlement is blocked",
    description:
      "PAN re-verification is requested before T+2 settlement release. Keep registrations open only with finance owner approval.",
    next: "Add finance note",
  },
};

export const Route = createFileRoute("/_authenticated/onboarding_/payment")({
  validateSearch: (search): PaymentSearch => ({
    kyc:
      typeof search.kyc === "string" && paymentDemos.includes(search.kyc as PaymentDemo)
        ? (search.kyc as PaymentDemo)
        : "not-started",
  }),
  staticData: { breadcrumb: "Payment onboarding" },
  component: PaymentOnboardingPage,
});

function PaymentOnboardingPage() {
  const { kyc } = Route.useSearch();
  const organizer = mockOrganizers[0];
  const panId = useId();
  const bankId = useId();
  const signatoryId = useId();
  const noteId = useId();
  const errorRef = useRef<HTMLDivElement>(null);
  const [message, setMessage] = useState<string | null>(
    kyc === "KYC-submitted" ? "KYC packet submitted in mock mode." : null,
  );
  const [fieldError, setFieldError] = useState(
    kyc === "validation-error" ? "PAN is required before KYC submission." : "",
  );

  if (kyc === "loading") return <PaymentSkeleton />;

  const effectiveDemo = kyc === "validation-error" ? "not-started" : kyc;
  const copy = stateCopy[effectiveDemo];
  const canEdit =
    effectiveDemo === "not-started" ||
    effectiveDemo === "rejected" ||
    effectiveDemo === "settlement-blocked";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = {
      pan: String(form.get("pan") ?? "").trim(),
      bank: String(form.get("bank") ?? "").trim(),
      signatory: String(form.get("signatory") ?? "").trim(),
      note: String(form.get("note") ?? "").trim(),
    };

    if (!payload.pan || kyc === "validation-error") {
      setFieldError("PAN is required before KYC submission.");
      setMessage(null);
      window.requestAnimationFrame(() => errorRef.current?.focus());
      return;
    }

    const result = await mockMutate(payload, { demo: "success" });
    setFieldError("");
    setMessage(
      result.message === "Saved successfully."
        ? "KYC packet submitted in mock mode."
        : result.message,
    );
  }

  return (
    <div className="mx-auto grid max-w-7xl gap-6 xl:grid-cols-[1fr_23rem]">
      <section className="space-y-6">
        <div className="rounded-[2rem] border border-border bg-card p-7 shadow-xl shadow-slate-950/5">
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="info">O-03</Badge>
            <StatusBadge status={copy.status} label={copy.label} />
          </div>
          <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-brand-orange-strong">
                Razorpay Route setup
              </p>
              <h1 className="mt-2 font-display text-5xl font-black uppercase leading-none tracking-tight">
                Payment onboarding
              </h1>
              <p className="mt-4 max-w-3xl text-muted-foreground">
                Linked-account KYC and settlement readiness for paid registrations. This mock never
                calls Razorpay or any backend.
              </p>
            </div>
            <Button asChild variant="outline">
              <Link to="/onboarding" search={{ demo: "default" }}>
                Back to profile
              </Link>
            </Button>
          </div>
        </div>

        <Card className="rounded-[1.5rem] overflow-hidden">
          <CardHeader className="border-b border-border bg-muted/30">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <CardTitle className="font-display text-3xl uppercase">{copy.title}</CardTitle>
                <CardDescription className="mt-2 max-w-3xl">{copy.description}</CardDescription>
              </div>
              <div className="min-w-52">
                <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  <span>KYC progress</span>
                  <span>{copy.progress}%</span>
                </div>
                <Progress value={copy.progress} aria-label={`${copy.label} progress`} />
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid gap-6 p-6 lg:grid-cols-[1fr_18rem]">
            <ol className="grid gap-3" aria-label="KYC steps">
              {[
                ["Business details", copy.progress >= 18],
                ["KYC documents", copy.progress >= 52],
                ["Razorpay verification", copy.progress >= 68],
                ["Settlement active", copy.progress >= 100],
              ].map(([label, done], index) => (
                <li key={String(label)} className="flex gap-3 rounded-2xl border border-border p-4">
                  <span
                    className={done ? "text-success-text" : "text-muted-foreground"}
                    aria-hidden="true"
                  >
                    {done ? "✓" : index + 1}
                  </span>
                  <div>
                    <p className="font-semibold">{label}</p>
                    <p className="text-sm text-muted-foreground">
                      {done ? "Complete or ready in demo" : "Waiting for previous step"}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
            <div className="rounded-2xl border border-dashed border-border bg-brand-tint/50 p-5">
              <p className="text-sm font-semibold">Settlement promise</p>
              <p className="mt-2 font-display text-4xl font-black">T+2</p>
              <p className="text-sm text-muted-foreground">
                After account activation. Manual review states keep publish readiness blocked.
              </p>
            </div>
          </CardContent>
        </Card>

        {fieldError ? (
          <Alert ref={errorRef} tabIndex={-1} variant="destructive" aria-live="polite">
            <AlertTitle>KYC form incomplete</AlertTitle>
            <AlertDescription>{fieldError}</AlertDescription>
          </Alert>
        ) : null}
        {message ? (
          <Alert className="border-success/30 bg-success/10 text-success-text" aria-live="polite">
            <AlertTitle>Saved locally</AlertTitle>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        ) : null}

        <form onSubmit={handleSubmit} className="grid gap-6" noValidate>
          <Card className="rounded-[1.5rem]">
            <CardHeader>
              <CardTitle className="font-display text-3xl uppercase">KYC packet</CardTitle>
              <CardDescription>
                Pre-filled with realistic Coimbatore organizer data; editable only for states that
                need action.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <div className="grid gap-5 lg:grid-cols-3">
                  <Field>
                    <FieldLabel htmlFor={panId}>PAN / entity identifier</FieldLabel>
                    <Input
                      id={panId}
                      name="pan"
                      defaultValue={kyc === "validation-error" ? "" : "AAECK1042R"}
                      disabled={!canEdit}
                      aria-invalid={Boolean(fieldError)}
                      aria-describedby={fieldError ? `${panId}-error` : undefined}
                    />
                    <FieldError id={`${panId}-error`}>{fieldError}</FieldError>
                  </Field>
                  <Field>
                    <FieldLabel htmlFor={bankId}>Bank account ending</FieldLabel>
                    <Input
                      id={bankId}
                      name="bank"
                      defaultValue="HDFC · · · 1042"
                      disabled={!canEdit}
                    />
                    <FieldDescription>Cancelled cheque checked locally in mock.</FieldDescription>
                  </Field>
                  <Field>
                    <FieldLabel htmlFor={signatoryId}>Authorized signatory</FieldLabel>
                    <Input
                      id={signatoryId}
                      name="signatory"
                      defaultValue={organizer.ownerName}
                      disabled={!canEdit}
                    />
                  </Field>
                </div>
                <Field>
                  <FieldLabel htmlFor={noteId}>Finance / support note</FieldLabel>
                  <Textarea
                    id={noteId}
                    name="note"
                    rows={4}
                    disabled={!canEdit}
                    defaultValue={
                      effectiveDemo === "settlement-blocked"
                        ? "PAN reverification requested. Priya owns follow-up before opening 21K registrations."
                        : "CODISSIA Trade Fair Complex event settlement account."
                    }
                  />
                </Field>
                <div className="flex flex-wrap gap-3">
                  <Button type="submit" disabled={!canEdit}>
                    {copy.next}
                  </Button>
                  <Button asChild type="button" variant="outline">
                    <Link
                      to="/events/$eventId/setup/publish"
                      params={{ eventId: "coimbatore-marathon-2026" }}
                      search={{ demo: "default" }}
                    >
                      View publish readiness
                    </Link>
                  </Button>
                </div>
              </FieldGroup>
            </CardContent>
          </Card>
        </form>
      </section>

      <aside className="space-y-4">
        <Card className="rounded-[1.5rem]">
          <CardHeader>
            <CardTitle className="font-display text-2xl uppercase">Account snapshot</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>
              <span className="font-semibold">Organizer:</span> {organizer.legalName}
            </p>
            <p>
              <span className="font-semibold">GSTIN:</span> {organizer.gstin}
            </p>
            <p>
              <span className="font-semibold">Support:</span> {organizer.supportContact}
            </p>
            <p className="text-muted-foreground">
              Created {formatDate(organizer.createdAt)} · No provider calls in this frontend demo.
            </p>
          </CardContent>
        </Card>
        {effectiveDemo === "rejected" || effectiveDemo === "settlement-blocked" ? (
          <Alert
            variant={effectiveDemo === "rejected" ? "destructive" : "default"}
            className={
              effectiveDemo === "settlement-blocked"
                ? "border-warning/30 bg-warning/10 text-warning-text"
                : undefined
            }
          >
            <AlertTitle>
              {effectiveDemo === "rejected" ? "Correction required" : "Settlement hold"}
            </AlertTitle>
            <AlertDescription>{copy.description}</AlertDescription>
          </Alert>
        ) : null}
        <Card className="rounded-[1.5rem] border-primary/30 bg-brand-tint/60">
          <CardHeader>
            <CardTitle className="font-display text-2xl uppercase">Demo URLs</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm">
            {paymentDemos
              .filter((item) => item !== "loading")
              .map((item) => (
                <Link
                  key={item}
                  className="underline underline-offset-4"
                  to="/onboarding/payment"
                  search={{ demo: "default", kyc: item }}
                >
                  {item}
                </Link>
              ))}
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}

function PaymentSkeleton() {
  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_23rem]">
      <div className="space-y-6">
        <Skeleton className="h-48 rounded-[2rem]" />
        <Skeleton className="h-72 rounded-[1.5rem]" />
        <Skeleton className="h-96 rounded-[1.5rem]" />
      </div>
      <Skeleton className="h-96 rounded-[1.5rem]" />
    </div>
  );
}
