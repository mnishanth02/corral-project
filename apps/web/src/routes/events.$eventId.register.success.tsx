import { Alert, AlertDescription, AlertTitle } from "@corral/ui/components/alert";
import { Badge } from "@corral/ui/components/badge";
import { Button } from "@corral/ui/components/button";
import { Card, CardContent } from "@corral/ui/components/card";
import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { useMemo } from "react";

import { useStickyCta } from "../components/sticky-cta";
import { confirmedRegistration } from "../mocks/registrations";
import { useRegistrationFlow } from "../mocks/store";
import { formatINR } from "../mocks/utils";
import {
  findEvent,
  getDemo,
  participantName,
  RegisterScreen,
  validateRegisterSearch,
} from "./-register-components";

export const Route = createFileRoute("/events/$eventId/register/success")({
  validateSearch: validateRegisterSearch,
  loader: ({ params }) => findEvent(params.eventId),
  component: SuccessRoute,
});

function SuccessRoute() {
  const event = Route.useLoaderData();
  const search = useSearch({ strict: false });
  const demo = getDemo(search);
  const flow = useRegistrationFlow();
  const cta = useMemo(
    () => (
      <Button asChild className="h-12 w-full rounded-2xl text-base shadow-lg shadow-orange-500/25">
        <Link to={"/my/registrations/reg-ananya-10k-confirmed" as never}>View my e-ticket</Link>
      </Button>
    ),
    [],
  );

  useStickyCta(cta);

  return (
    <RegisterScreen
      eyebrow="P-14 · Success"
      title="You're in! 🎉"
      description="Payment and registration are confirmed; next steps are ready for race week."
      demo={demo}
      demoUrls={[
        `/events/${event.id}/register/success?demo=default`,
        `/events/${event.id}/register/success?demo=webhook-pending`,
        `/events/${event.id}/register/success?demo=success`,
      ]}
    >
      <Card className="overflow-hidden rounded-[2rem] border-orange-100">
        <CardContent className="space-y-5 p-6">
          <div className="rounded-[2rem] bg-[radial-gradient(circle_at_top_left,rgba(37,211,102,0.16),transparent_12rem),linear-gradient(135deg,#fff7ed,#ffffff)] p-5 text-center">
            <Badge className="rounded-full bg-success/10 text-success-text">
              ✓ Paid & Confirmed
            </Badge>
            <p className="mt-4 font-display text-4xl font-black text-brand-navy">BIB pending</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Registration ID {confirmedRegistration.id}
            </p>
          </div>
          <dl className="grid gap-3 text-sm">
            <div className="flex justify-between">
              <dt>Runner</dt>
              <dd className="font-semibold text-brand-navy">{participantName(flow.participant)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Event</dt>
              <dd className="font-semibold text-brand-navy">{event.title}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Amount paid</dt>
              <dd className="font-semibold text-brand-navy">
                {formatINR(
                  Math.max(
                    flow.orderSummary.total.amount - flow.orderSummary.platformFee.amount,
                    0,
                  ),
                )}
              </dd>
            </div>
          </dl>
          <ol className="space-y-2 text-sm text-muted-foreground">
            <li>✓ Confirmation sent on WhatsApp and email.</li>
            <li>✓ Kit pickup instructions will arrive before race week.</li>
            <li>✓ E-ticket shows BIB, QR and race-day links.</li>
          </ol>
        </CardContent>
      </Card>
      {demo === "webhook-pending" ? (
        <Alert className="border-warning/40 bg-warning/10 text-warning-text">
          <span aria-hidden="true">⚠</span>
          <AlertTitle>Confirmation message pending</AlertTitle>
          <AlertDescription>
            Payment is confirmed; WhatsApp/email delivery is still sending. Contact support with the
            registration ID if it does not arrive.
          </AlertDescription>
        </Alert>
      ) : null}
    </RegisterScreen>
  );
}
