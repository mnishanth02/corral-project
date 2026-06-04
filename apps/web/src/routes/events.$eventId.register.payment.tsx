import { Badge } from "@corral/ui/components/badge";
import { Button } from "@corral/ui/components/button";
import { Card, CardContent } from "@corral/ui/components/card";
import { RadioGroup, RadioGroupItem } from "@corral/ui/components/radio-group";
import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { useStickyCta } from "../components/sticky-cta";
import { useRegistrationFlow } from "../mocks/store";
import { formatINR } from "../mocks/utils";
import { findEvent, getDemo, RegisterScreen, validateRegisterSearch } from "./-register-components";

export const Route = createFileRoute("/events/$eventId/register/payment")({
  validateSearch: validateRegisterSearch,
  loader: ({ params }) => findEvent(params.eventId),
  component: PaymentRoute,
});

function PaymentRoute() {
  const event = Route.useLoaderData();
  const { eventId } = Route.useParams();
  const search = useSearch({ strict: false });
  const demo = getDemo(search);
  const flow = useRegistrationFlow();
  const [method, setMethod] = useState("upi");
  const total = Math.max(flow.orderSummary.total.amount - flow.orderSummary.platformFee.amount, 0);
  const cta = useMemo(
    () => (
      <Button
        asChild
        className="h-12 w-full rounded-2xl text-base shadow-lg shadow-orange-500/25"
        onClick={() => flow.setPaymentStatus("pending")}
      >
        <Link
          to="/events/$eventId/register/processing"
          params={{ eventId }}
          search={demo === "webhook-pending" ? { demo: "webhook-pending" } : undefined}
        >
          Pay with {method.toUpperCase()}
        </Link>
      </Button>
    ),
    [eventId, method, demo, flow.setPaymentStatus],
  );

  useStickyCta(cta);

  return (
    <RegisterScreen
      eyebrow="P-12 · Payment"
      title="Choose payment method."
      description="Razorpay handoff is represented locally; no gateway or network is called."
      demo={demo}
      demoUrls={[
        `/events/${event.id}/register/payment?demo=default`,
        `/events/${event.id}/register/payment?demo=webhook-pending`,
        `/events/${event.id}/register/payment?demo=offline`,
      ]}
    >
      <Card className="rounded-[2rem] border-orange-100">
        <CardContent className="space-y-4 p-5">
          <div className="rounded-3xl bg-secondary p-4 text-center">
            <p className="text-sm uppercase tracking-[0.18em] text-muted-foreground">Amount</p>
            <p className="font-display text-5xl font-black text-brand-navy">{formatINR(total)}</p>
            <Badge className="mt-2 rounded-full bg-info/10 text-info-text">Payment Started</Badge>
          </div>
          <RadioGroup value={method} onValueChange={setMethod} aria-label="Payment method">
            {(
              [
                ["upi", "UPI", "GPay, PhonePe, Paytm"],
                ["card", "Cards", "Visa, Mastercard, RuPay"],
                ["netbanking", "Netbanking", "Major Indian banks"],
              ] as const
            ).map(([value, title, description]) => (
              <label
                key={value}
                htmlFor={`payment-${value}`}
                className="flex min-h-16 gap-3 rounded-2xl border bg-card p-4"
              >
                <RadioGroupItem id={`payment-${value}`} value={value} className="mt-1 size-5" />
                <span>
                  <span className="block font-semibold text-brand-navy">{title}</span>
                  <span className="text-sm text-muted-foreground">{description}</span>
                </span>
              </label>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>
      <Button asChild variant="outline" className="h-11 w-full rounded-2xl bg-white">
        <Link to="/events/$eventId/register/summary" params={{ eventId }}>
          Back to summary
        </Link>
      </Button>
    </RegisterScreen>
  );
}
