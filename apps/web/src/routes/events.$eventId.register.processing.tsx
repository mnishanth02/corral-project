import { Button } from "@corral/ui/components/button";
import { Card, CardContent } from "@corral/ui/components/card";
import { PendingBanner } from "@corral/ui/components/pending-banner";
import { Spinner } from "@corral/ui/components/spinner";
import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useMemo } from "react";

import { useStickyCta } from "../components/sticky-cta";
import { useRegistrationFlow } from "../mocks/store";
import { mockMutate } from "../mocks/utils";
import { findEvent, getDemo, RegisterScreen, validateRegisterSearch } from "./-register-components";

export const Route = createFileRoute("/events/$eventId/register/processing")({
  validateSearch: validateRegisterSearch,
  loader: ({ params }) => findEvent(params.eventId),
  component: ProcessingRoute,
});

function ProcessingRoute() {
  const event = Route.useLoaderData();
  const { eventId } = Route.useParams();
  const search = useSearch({ strict: false });
  const demo = getDemo(search);
  const navigate = useNavigate();
  const flow = useRegistrationFlow();

  useEffect(() => {
    let cancelled = false;

    async function settle() {
      const result = await mockMutate({ orderId: "order_cbe_1042" }, { demo, delayMs: 650 });

      if (cancelled || demo === "webhook-pending") return;
      flow.setPaymentStatus(
        result.status === "error" || demo === "validation-error" ? "failed" : "confirmed",
      );
      await navigate({
        to: (result.status === "error" || demo === "validation-error"
          ? "/events/$eventId/register/failed"
          : "/events/$eventId/register/success") as never,
        params: { eventId } as never,
      });
    }

    void settle();
    return () => {
      cancelled = true;
    };
  }, [demo, eventId, navigate, flow]);

  const cta = useMemo(
    () => (
      <div className="grid grid-cols-2 gap-3">
        <Button asChild variant="outline" className="h-12 rounded-2xl bg-white">
          <Link to="/events/$eventId/register/payment" params={{ eventId }}>
            Retry
          </Link>
        </Button>
        <Button asChild variant="ghost" className="h-12 rounded-2xl">
          <Link to="/events/$eventId/register/summary" params={{ eventId }}>
            Cancel
          </Link>
        </Button>
      </div>
    ),
    [eventId],
  );

  useStickyCta(cta);

  return (
    <RegisterScreen
      eyebrow="P-13 · Processing"
      title="Confirming your payment…"
      description="No history back here. Use explicit retry or cancel links if the gateway handoff stalls."
      demo={demo === "loading" ? "default" : demo}
      demoUrls={[
        `/events/${event.id}/register/processing?demo=default`,
        `/events/${event.id}/register/processing?demo=webhook-pending`,
        `/events/${event.id}/register/processing?demo=error`,
      ]}
    >
      <Card className="rounded-[2rem] border-orange-100">
        <CardContent className="space-y-5 p-6 text-center">
          <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-orange-50 text-brand-orange-strong">
            <Spinner />
          </div>
          <p className="font-display text-3xl font-black text-brand-navy" aria-live="polite">
            Paid — Awaiting Webhook
          </p>
          <p className="text-sm leading-6 text-muted-foreground">
            Don't close this page. We are confirming the local mock order and will route to success
            or failure deterministically.
          </p>
        </CardContent>
      </Card>
      <PendingBanner
        title="Payment Pending"
        status="processing"
        description={
          demo === "webhook-pending"
            ? "Captured by gateway; waiting for webhook reconciliation."
            : "Confirming the mocked Razorpay response."
        }
      />
    </RegisterScreen>
  );
}
