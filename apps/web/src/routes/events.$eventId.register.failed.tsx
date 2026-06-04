import { Alert, AlertDescription, AlertTitle } from "@corral/ui/components/alert";
import { Badge } from "@corral/ui/components/badge";
import { Button } from "@corral/ui/components/button";
import { Card, CardContent } from "@corral/ui/components/card";
import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { useMemo } from "react";

import { useStickyCta } from "../components/sticky-cta";
import { useRegistrationFlow } from "../mocks/store";
import { formatINR } from "../mocks/utils";
import { findEvent, getDemo, RegisterScreen, validateRegisterSearch } from "./-register-components";

export const Route = createFileRoute("/events/$eventId/register/failed")({
  validateSearch: validateRegisterSearch,
  loader: ({ params }) => findEvent(params.eventId),
  component: FailedRoute,
});

function FailedRoute() {
  const event = Route.useLoaderData();
  const { eventId } = Route.useParams();
  const search = useSearch({ strict: false });
  const demo = getDemo(search);
  const reason =
    validateRegisterSearch(search).reason ??
    (demo === "webhook-pending" ? "webhook-pending" : "gateway-fail");
  const flow = useRegistrationFlow();
  const copy = failureCopy(reason);
  const cta = useMemo(
    () => (
      <Button asChild className="h-12 w-full rounded-2xl text-base shadow-lg shadow-orange-500/25">
        <Link to="/events/$eventId/register/payment" params={{ eventId }}>
          Retry payment
        </Link>
      </Button>
    ),
    [eventId],
  );

  useStickyCta(cta);

  return (
    <RegisterScreen
      eyebrow="P-15 · Failed"
      title="Payment needs attention."
      description="The checkout never dead-ends: retry, change method, or contact support with the local order ref."
      demo={demo}
      demoUrls={[
        `/events/${event.id}/register/failed?reason=gateway-fail`,
        `/events/${event.id}/register/failed?reason=user-abandoned`,
        `/events/${event.id}/register/failed?reason=duplicate`,
        `/events/${event.id}/register/failed?demo=webhook-pending`,
      ]}
    >
      <Alert variant="destructive" className="border-danger/40 bg-danger/10 text-danger-text">
        <span aria-hidden="true">⚠</span>
        <AlertTitle>{copy.title}</AlertTitle>
        <AlertDescription>{copy.description}</AlertDescription>
      </Alert>
      <Card className="rounded-[2rem] border-orange-100">
        <CardContent className="space-y-4 p-5">
          <div className="flex items-center justify-between rounded-2xl bg-secondary p-4">
            <span className="text-sm text-muted-foreground">Attempted amount</span>
            <span className="font-display text-2xl font-black text-brand-navy">
              {formatINR(
                Math.max(flow.orderSummary.total.amount - flow.orderSummary.platformFee.amount, 0),
              )}
            </span>
          </div>
          <Badge variant="outline" className="rounded-full">
            {copy.badge}
          </Badge>
          <p className="text-sm leading-6 text-muted-foreground">
            Order ref order_cbe_1042 · Corral support: support@corral.local · +91 422 555 0198
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Button asChild variant="outline" className="h-11 rounded-2xl bg-white">
              <Link to="/events/$eventId/register/payment" params={{ eventId }}>
                Change method
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-11 rounded-2xl bg-white">
              <a href="mailto:support@corral.local">Support</a>
            </Button>
          </div>
        </CardContent>
      </Card>
      <Button asChild variant="ghost" className="h-11 w-full rounded-2xl">
        <Link to="/">Back to event landing</Link>
      </Button>
    </RegisterScreen>
  );
}

function failureCopy(reason: "gateway-fail" | "user-abandoned" | "webhook-pending" | "duplicate") {
  const map = {
    "gateway-fail": {
      title: "Gateway failed",
      description: "Payment didn't go through. You were not charged.",
      badge: "Failed",
    },
    "user-abandoned": {
      title: "Payment abandoned",
      description: "You left the gateway before payment completion. Retry safely whenever ready.",
      badge: "User Abandoned",
    },
    "webhook-pending": {
      title: "Paid — Awaiting Webhook",
      description:
        "Gateway may have captured payment. Do not pay again until support checks the order.",
      badge: "Needs Review",
    },
    duplicate: {
      title: "Duplicate payment detected",
      description: "We found a similar paid attempt. Contact support before retrying.",
      badge: "Duplicate Payment",
    },
  };

  return map[reason];
}
