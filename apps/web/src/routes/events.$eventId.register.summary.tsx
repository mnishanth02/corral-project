import { Alert, AlertDescription, AlertTitle } from "@corral/ui/components/alert";
import { Badge } from "@corral/ui/components/badge";
import { Button } from "@corral/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@corral/ui/components/card";
import { Field, FieldError, FieldLabel } from "@corral/ui/components/field";
import { Input } from "@corral/ui/components/input";
import { Separator } from "@corral/ui/components/separator";
import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { useStickyCta } from "../components/sticky-cta";
import { participantCoupons } from "../mocks/coupons";
import { useRegistrationFlow } from "../mocks/store";
import { formatINR } from "../mocks/utils";
import {
  activeTier,
  categoryById,
  findEvent,
  getDemo,
  MoneyRow,
  participantName,
  RegisterScreen,
  validateRegisterSearch,
} from "./-register-components";

export const Route = createFileRoute("/events/$eventId/register/summary")({
  validateSearch: validateRegisterSearch,
  loader: ({ params }) => findEvent(params.eventId),
  component: SummaryRoute,
});

function SummaryRoute() {
  const event = Route.useLoaderData();
  const { eventId } = Route.useParams();
  const search = useSearch({ strict: false });
  const demo = getDemo(search);
  const flow = useRegistrationFlow();
  const category = categoryById(event, flow.selectedCategoryId);
  const tier = category ? activeTier(category) : undefined;
  const categoryFee = tier?.amount.amount ?? flow.orderSummary.categoryFee.amount;
  const insurance = flow.insurancePolicyId ? flow.orderSummary.insurancePremium.amount : 0;
  const couponDiscount = flow.orderSummary.discount.amount;
  const total = Math.max(categoryFee + insurance - couponDiscount, 0);
  const cta = useMemo(
    () => (
      <Button asChild className="h-12 w-full rounded-2xl text-base shadow-lg shadow-orange-500/25">
        <Link to="/events/$eventId/register/payment" params={{ eventId }}>
          Pay {formatINR(total)}
        </Link>
      </Button>
    ),
    [eventId, total],
  );

  useStickyCta(cta);

  return (
    <RegisterScreen
      eyebrow="P-11 · Summary"
      title="Review before payment."
      description="Coupon P-10 is inline here. Platform/convenience fees are organizer-absorbed notes only."
      demo={demo}
      demoUrls={[
        `/events/${event.id}/register/summary?demo=default`,
        `/events/${event.id}/register/summary?demo=validation-error`,
        `/events/${event.id}/register/summary?demo=success`,
      ]}
    >
      <Card className="rounded-[2rem] border-orange-100">
        <CardHeader>
          <CardTitle className="font-display text-2xl text-brand-navy">
            {participantName(flow.participant)}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {category?.name ?? "10K Open"} · {tier?.label ?? "Early bird"}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <MoneyRow label={`${category?.name ?? "Race"} registration`} value={categoryFee} />
            <div className="flex items-center justify-between gap-3 text-sm">
              <span>Early-bird tier</span>
              <Badge className="rounded-full bg-orange-50 text-brand-orange-strong">
                {tier?.label ?? "Active"}
              </Badge>
            </div>
            {insurance > 0 ? <MoneyRow label="Event accident insurance" value={insurance} /> : null}
            {couponDiscount > 0 ? (
              <MoneyRow
                label={`Coupon ${flow.couponCode ?? "applied"}`}
                value={couponDiscount}
                tone="discount"
              />
            ) : null}
          </div>
          <Separator />
          <CouponCodeEntry eventId={event.id} subtotal={categoryFee + insurance} demo={demo} />
          <Separator />
          <Alert className="border-info/40 bg-info/10 text-info-text">
            <span aria-hidden="true">ⓘ</span>
            <AlertTitle>Organizer-absorbed fee</AlertTitle>
            <AlertDescription>
              Convenience/platform fees are absorbed by {event.organizerName}; no participant-paid
              fee row is added.
            </AlertDescription>
          </Alert>
          <p className="text-sm text-muted-foreground">
            GST included as applicable. A GST invoice/receipt will be emailed after payment.
          </p>
          <div className="flex items-end justify-between rounded-3xl bg-secondary p-4">
            <span className="font-bold text-brand-navy">Total due</span>
            <span className="font-display text-4xl font-black text-brand-navy">
              {formatINR(total)}
            </span>
          </div>
        </CardContent>
      </Card>
      <Button asChild variant="outline" className="h-11 w-full rounded-2xl bg-white">
        <Link to="/events/$eventId/register/insurance" params={{ eventId }}>
          Back to add-ons
        </Link>
      </Button>
    </RegisterScreen>
  );
}

function CouponCodeEntry({
  eventId,
  subtotal,
  demo,
}: {
  eventId: string;
  subtotal: number;
  demo: string;
}) {
  const flow = useRegistrationFlow();
  const [code, setCode] = useState(flow.couponCode ?? "");
  const [error, setError] = useState(
    demo === "validation-error" ? "⚠ That code isn't valid for this event." : "",
  );
  const [checking, setChecking] = useState(false);

  function apply() {
    const normalized = code.trim().toUpperCase();
    setChecking(true);
    window.setTimeout(
      () => {
        const coupon = participantCoupons.find(
          (item) => item.code === normalized && item.eventId === eventId,
        );
        setChecking(false);

        if (!coupon) {
          setError("⚠ That code isn't valid for this event.");
          return;
        }

        if (!coupon.active) {
          setError(
            `⚠ This code expired on ${new Date(coupon.expiresAt).toLocaleDateString("en-IN")}.`,
          );
          return;
        }

        if (coupon.minimumAmount && subtotal < coupon.minimumAmount) {
          setError(`⚠ Minimum order for this coupon is ${formatINR(coupon.minimumAmount)}.`);
          return;
        }

        setError("");
        flow.applyCoupon(coupon.code);
      },
      demo === "loading" ? 500 : 0,
    );
  }

  return (
    <div className="space-y-3 rounded-2xl border border-orange-100 bg-orange-50/40 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="font-semibold text-brand-navy">Have a coupon code?</p>
        {flow.couponCode ? (
          <Badge className="rounded-full bg-success/10 text-success-text">✓ Applied</Badge>
        ) : null}
      </div>
      {flow.couponCode ? (
        <div className="flex items-center justify-between gap-3 rounded-2xl bg-white p-3 text-sm">
          <span className="font-bold text-success-text">
            ✓ {flow.couponCode} applied — {formatINR(flow.orderSummary.discount.amount)} off
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              flow.applyCoupon(undefined);
              setCode("");
            }}
          >
            Remove
          </Button>
        </div>
      ) : (
        <Field>
          <FieldLabel htmlFor="coupon-code">Coupon code</FieldLabel>
          <div className="flex gap-2">
            <Input
              id="coupon-code"
              name="coupon"
              inputMode="text"
              autoComplete="off"
              className="h-12 rounded-2xl uppercase"
              placeholder="EARLYCBE"
              value={code}
              aria-describedby="coupon-help coupon-error"
              onChange={(event) => setCode(event.target.value.toUpperCase())}
            />
            <Button
              type="button"
              onClick={apply}
              disabled={checking || !code.trim()}
              className="h-12 rounded-2xl"
            >
              {checking ? "Checking…" : "Apply"}
            </Button>
          </div>
          <p id="coupon-help" className="text-sm text-muted-foreground">
            Codes are case-insensitive. Try EARLYCBE or EXPIRED100.
          </p>
          <FieldError id="coupon-error" aria-live="polite">
            {error}
          </FieldError>
        </Field>
      )}
    </div>
  );
}
