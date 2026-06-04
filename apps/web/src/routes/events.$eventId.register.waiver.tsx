import { Alert, AlertDescription, AlertTitle } from "@corral/ui/components/alert";
import { Button } from "@corral/ui/components/button";
import { ConsentBlock, type ConsentBlockValue } from "@corral/ui/components/consent-block";
import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";

import { useStickyCta } from "../components/sticky-cta";
import { useRegistrationFlow } from "../mocks/store";
import { mockMutate } from "../mocks/utils";
import {
  calculateAge,
  findEvent,
  getDemo,
  RegisterScreen,
  validateRegisterSearch,
} from "./-register-components";

export const Route = createFileRoute("/events/$eventId/register/waiver")({
  validateSearch: validateRegisterSearch,
  loader: ({ params }) => findEvent(params.eventId),
  component: WaiverRoute,
});

function WaiverRoute() {
  const event = Route.useLoaderData();
  const { eventId } = Route.useParams();
  const search = useSearch({ strict: false });
  const demo = getDemo(search);
  const flow = useRegistrationFlow();
  const navigate = useNavigate();
  const age = calculateAge(flow.participant.dateOfBirth);
  const isMinor = age !== undefined && age < 18;
  const [value, setValue] = useState<ConsentBlockValue>({
    medical: false,
    waiver: flow.waiverAccepted,
    dpdp: flow.dpdpConsentAccepted,
    publishing: false,
    comms: false,
  });
  const [showError, setShowError] = useState(demo === "validation-error");
  const allRequired = ["medical", "waiver", "dpdp", "publishing"].every((key) => value[key]);

  async function submit() {
    setShowError(!allRequired);

    if (!allRequired) {
      return;
    }

    const result = await mockMutate(value, { demo });

    if (result.status === "validation-error") {
      setShowError(true);
      return;
    }

    flow.setWaiverAccepted(true);
    flow.setDpdpConsentAccepted(true);
    await navigate({
      to:
        isMinor && !flow.guardian
          ? "/events/$eventId/register/guardian"
          : "/events/$eventId/register/insurance",
      params: { eventId },
    });
  }

  const cta = (
    <Button
      type="button"
      onClick={() => void submit()}
      className="h-12 w-full rounded-2xl text-base shadow-lg shadow-orange-500/25"
    >
      {isMinor && !flow.guardian ? "Continue to guardian consent" : "Continue to insurance"}
    </Button>
  );

  useStickyCta(cta);

  return (
    <RegisterScreen
      eyebrow="P-08 · Consent"
      title="Confirm safety and privacy."
      description="Required boxes start unchecked. Communication consent is explicit and separate."
      demo={demo}
      demoUrls={[
        `/events/${event.id}/register/waiver?demo=default`,
        `/events/${event.id}/register/waiver?demo=validation-error`,
        `/events/${event.id}/register/waiver?demo=success`,
      ]}
    >
      {isMinor ? (
        <Alert className="border-info/40 bg-info/10 text-info-text">
          <span aria-hidden="true">ⓘ</span>
          <AlertTitle>Guardian consent required</AlertTitle>
          <AlertDescription>
            Race age {age}; parent/guardian consent must be captured before checkout.
          </AlertDescription>
        </Alert>
      ) : null}
      <ConsentBlock
        title="Medical declaration, waiver and DPDP consent"
        description="Review each consent independently for the Coimbatore Marathon 2026."
        value={value}
        onChange={(next) => {
          if (!("target" in next)) {
            setValue(next);
          }
        }}
        showRequiredError={showError}
        errorMessage="Please accept every required safety, waiver, DPDP and publishing consent to continue."
        requiredConsents={[
          {
            id: "medical",
            label: "I confirm I am medically fit to participate.",
            description: "I will not run if a doctor has advised against strenuous activity.",
          },
          {
            id: "waiver",
            label: (
              <>
                I accept the race waiver and safety instructions.{" "}
                <Link to="/" className="underline">
                  Read full waiver
                </Link>
              </>
            ),
            description: event.policies.waiver,
          },
          {
            id: "dpdp",
            label: (
              <>
                I have read the DPDP privacy notice.{" "}
                <Link to="/" className="underline">
                  Privacy notice
                </Link>
              </>
            ),
            description: "Corral stores only the registration details needed to operate the event.",
          },
          {
            id: "publishing",
            label: "I understand my result and certificate may be published.",
            description: "Name, BIB, category and finish time can appear on public result pages.",
          },
        ]}
        optionalConsents={[
          {
            id: "comms",
            label: "Send me WhatsApp/SMS/email event updates.",
            description: "Operational race updates, kit reminders and certificate alerts.",
          },
        ]}
        privacyNotice={
          <span aria-live="polite">
            Required consent status: {allRequired ? "✓ ready" : "⚠ incomplete"}
          </span>
        }
        className="rounded-[2rem] border-orange-100"
      />
      <Button asChild variant="outline" className="h-11 w-full rounded-2xl bg-white">
        <Link to="/events/$eventId/register/form" params={{ eventId }}>
          Back to runner details
        </Link>
      </Button>
    </RegisterScreen>
  );
}
