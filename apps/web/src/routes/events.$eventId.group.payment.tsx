import { Alert, AlertDescription, AlertTitle } from "@corral/ui/components/alert";
import { Badge } from "@corral/ui/components/badge";
import { Button } from "@corral/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@corral/ui/components/card";
import { Field, FieldDescription, FieldLabel } from "@corral/ui/components/field";
import { PendingBanner } from "@corral/ui/components/pending-banner";
import { RadioGroup, RadioGroupItem } from "@corral/ui/components/radio-group";
import { Separator } from "@corral/ui/components/separator";
import { CardSkeleton } from "@corral/ui/components/skeletons";
import { StatusBadge } from "@corral/ui/components/status-badge";
import { createFileRoute, Link, useParams, useSearch } from "@tanstack/react-router";
import { useCallback, useMemo, useState } from "react";

import { useStickyCta } from "../components/sticky-cta";
import { useRegistrationFlow } from "../mocks/store";
import { formatINR, mockMutate } from "../mocks/utils";
import {
  calculateTotals,
  currentDemo,
  draftForDemo,
  validateGroupSearch,
} from "./-group-registration-data";

export const Route = createFileRoute("/events/$eventId/group/payment")({
  validateSearch: validateGroupSearch,
  component: GroupPaymentScreen,
});

function GroupPaymentScreen() {
  const { eventId } = useParams({ from: "/events/$eventId/group/payment" });
  const search = useSearch({ from: "/events/$eventId/group/payment" });
  const demo = currentDemo(search);
  const draft = useMemo(() => draftForDemo(demo), [demo]);
  const totals = calculateTotals(draft);
  const [method, setMethod] = useState("upi");
  const [message, setMessage] = useState<string | undefined>();
  const flow = useRegistrationFlow();
  const billingValid = demo !== "validation-error";
  const isPaid = demo === "success" || demo === "webhook-pending";

  const payGroup = useCallback(async () => {
    const result = await mockMutate(
      { groupId: "grp-cbe-kongu-2026", method, total: totals.total },
      { demo },
    );
    flow.setPaymentStatus(
      result.status === "success"
        ? "confirmed"
        : result.status === "pending"
          ? "pending"
          : "failed",
    );
    setMessage(result.message);
  }, [demo, flow.setPaymentStatus, method, totals.total]);

  const cta = useMemo(
    () => (
      <div className="space-y-2" aria-live="polite">
        <div className="flex items-center justify-between text-sm">
          <span className="font-bold text-brand-navy">
            {billingValid ? `Pay ${formatINR(totals.total)}` : "Billing needs review"}
          </span>
          <span className={billingValid ? "text-success-text" : "text-danger-text"}>
            {billingValid ? "Single payment" : "Fix GSTIN"}
          </span>
        </div>
        {isPaid ? (
          <Button asChild className="h-12 w-full rounded-2xl text-base">
            <Link to="/">View confirmation</Link>
          </Button>
        ) : (
          <Button
            type="button"
            disabled={!billingValid}
            className="h-12 w-full rounded-2xl text-base shadow-lg shadow-orange-500/20"
            onClick={payGroup}
          >
            Pay {formatINR(totals.total)}
          </Button>
        )}
      </div>
    ),
    [billingValid, isPaid, totals.total, payGroup],
  );

  useStickyCta(cta);

  if (demo === "loading") {
    return <LoadingPayment />;
  }

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden rounded-[2rem] border-orange-100 shadow-lg shadow-slate-950/5">
        <div className="bg-[radial-gradient(circle_at_top,var(--brand-tint),transparent_15rem)] p-5">
          <Badge variant={isPaid ? "success" : "info"}>
            {isPaid ? "Payment status" : "Ready to pay"}
          </Badge>
          <h2 className="mt-3 font-display text-3xl font-black leading-none tracking-[-0.05em] text-brand-navy">
            One payment for your team
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Paying for {draft.runners.length} runners from {draft.coordinator.organisation}.
          </p>
          <p className="mt-4 font-display text-4xl font-black tracking-[-0.05em] text-brand-navy">
            {formatINR(totals.total)}
          </p>
        </div>
      </Card>

      {demo === "webhook-pending" ? (
        <PendingBanner
          title="Paid — Awaiting Webhook"
          description="Don't close this page. We found your payment and are waiting for confirmation before sending tickets."
        />
      ) : null}
      {demo === "success" ? (
        <Alert className="border-success/30 bg-success/10 text-success-text">
          <AlertTitle>Paid & Confirmed — invoice ready</AlertTitle>
          <AlertDescription className="text-success-text/90">
            Confirmation sent to {draft.coordinator.email}. Download or email the invoice below.
          </AlertDescription>
        </Alert>
      ) : null}
      {demo === "error" ? (
        <Alert variant="destructive">
          <AlertTitle>Payment needs review</AlertTitle>
          <AlertDescription>
            We found a payment attempt for this group. We won't charge again while we check. Retry
            safely or contact support.
          </AlertDescription>
        </Alert>
      ) : null}
      {demo === "validation-error" ? (
        <Alert variant="destructive">
          <AlertTitle>Correct GST details before paying</AlertTitle>
          <AlertDescription>
            GSTIN 33AABC is incomplete. Edit billing details to continue.
          </AlertDescription>
        </Alert>
      ) : null}
      {message ? (
        <p
          className="rounded-2xl bg-secondary p-3 text-sm text-muted-foreground"
          aria-live="polite"
        >
          {message}
        </p>
      ) : null}

      <Card className="rounded-[2rem] border-orange-100 shadow-lg shadow-slate-950/5">
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="font-display text-2xl tracking-[-0.04em] text-brand-navy">
              Coordinator billing
            </CardTitle>
            <Button asChild variant="ghost" className="min-h-11 rounded-xl">
              <Link
                to="/events/$eventId/group"
                params={{ eventId }}
                search={{ section: "billing", demo: demo === "default" ? undefined : demo }}
              >
                Edit
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <InfoRow label="Bill to" value={draft.billing.invoiceName} />
          <InfoRow
            label="GSTIN"
            value={draft.billing.gstin ?? "Not registered"}
            tone={billingValid ? undefined : "danger"}
          />
          <InfoRow
            label="Place of supply"
            value={`${draft.billing.city}, ${draft.billing.state}`}
          />
          <InfoRow
            label="Coordinator"
            value={`${draft.coordinator.name} · ${draft.coordinator.mobile}`}
          />
        </CardContent>
      </Card>

      <InvoiceCard
        gstRegistered={draft.billing.gstRegistered}
        state={draft.billing.state}
        totals={totals}
      />

      {!isPaid ? (
        <Card className="rounded-[2rem] border-orange-100 shadow-lg shadow-slate-950/5">
          <CardHeader>
            <CardTitle className="font-display text-2xl tracking-[-0.04em] text-brand-navy">
              Payment method
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup value={method} onValueChange={setMethod} aria-label="Payment method">
              {(
                [
                  ["upi", "UPI", "Pay with any UPI app"],
                  ["card", "Card", "Credit or debit card"],
                  ["netbanking", "Netbanking", "Indian bank transfer"],
                ] as const
              ).map(([value, label, description]) => (
                <Field
                  key={value}
                  orientation="horizontal"
                  className="min-h-11 rounded-2xl border border-orange-100 p-3"
                >
                  <RadioGroupItem value={value} id={`method-${value}`} />
                  <div className="space-y-1">
                    <FieldLabel htmlFor={`method-${value}`}>{label}</FieldLabel>
                    <FieldDescription>{description}</FieldDescription>
                  </div>
                </Field>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>
      ) : (
        <Card className="rounded-[2rem] border-orange-100 shadow-lg shadow-slate-950/5">
          <CardHeader>
            <CardTitle className="font-display text-2xl tracking-[-0.04em] text-brand-navy">
              Invoice actions
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Button type="button" className="min-h-11 rounded-2xl">
              Download invoice PDF
            </Button>
            <Button type="button" variant="outline" className="min-h-11 rounded-2xl">
              Email invoice to coordinator
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function InvoiceCard({
  gstRegistered,
  state,
  totals,
}: {
  gstRegistered: boolean;
  state: string;
  totals: ReturnType<typeof calculateTotals>;
}) {
  return (
    <Card className="rounded-[2rem] border-orange-100 shadow-lg shadow-slate-950/5">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="font-display text-2xl tracking-[-0.04em] text-brand-navy">
            Invoice preview
          </CardTitle>
          <StatusBadge
            status={gstRegistered ? "info" : "neutral"}
            label={gstRegistered ? "GST tax invoice" : "Receipt"}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {gstRegistered ? (
          <>
            <InfoRow label="Taxable value" value={formatINR(totals.taxableValue)} />
            {state === "Tamil Nadu" ? (
              <>
                <InfoRow label="CGST 9%" value={formatINR(totals.cgst)} />
                <InfoRow label="SGST 9%" value={formatINR(totals.sgst)} />
              </>
            ) : (
              <InfoRow label="IGST 18%" value={formatINR(totals.igst)} />
            )}
            <InfoRow label="HSN/SAC" value="999692" />
          </>
        ) : (
          <p className="rounded-2xl bg-secondary p-3 text-muted-foreground">
            Your organiser is not GST-registered — you'll receive a payment receipt, not a tax
            invoice.
          </p>
        )}
        <Separator />
        <InfoRow label="Convenience fee" value="Absorbed by organizer" />
        <InfoRow label="Invoice total" value={formatINR(totals.total)} strong />
      </CardContent>
    </Card>
  );
}

function InfoRow({
  label,
  value,
  strong,
  tone,
}: {
  label: string;
  value: string;
  strong?: boolean;
  tone?: "danger";
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={
          strong
            ? "font-display text-xl font-black text-brand-navy"
            : tone === "danger"
              ? "font-bold text-danger-text"
              : "max-w-[13rem] text-right font-bold text-brand-navy"
        }
      >
        {value}
      </span>
    </div>
  );
}

function LoadingPayment() {
  return (
    <div className="space-y-4" role="status" aria-label="Loading group payment">
      <CardSkeleton />
      <CardSkeleton />
      <CardSkeleton />
    </div>
  );
}
