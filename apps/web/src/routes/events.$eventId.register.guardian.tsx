import { Alert, AlertDescription, AlertTitle } from "@corral/ui/components/alert";
import { Button } from "@corral/ui/components/button";
import { Card, CardContent } from "@corral/ui/components/card";
import { Checkbox } from "@corral/ui/components/checkbox";
import { Field, FieldError, FieldLabel } from "@corral/ui/components/field";
import { Input } from "@corral/ui/components/input";
import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";

import { useStickyCta } from "../components/sticky-cta";
import { useRegistrationFlow } from "../mocks/store";
import { mockMutate } from "../mocks/utils";
import {
  calculateAge,
  findEvent,
  getDemo,
  participantName,
  RegisterScreen,
  validateRegisterSearch,
} from "./-register-components";

export const Route = createFileRoute("/events/$eventId/register/guardian")({
  validateSearch: validateRegisterSearch,
  loader: ({ params }) => findEvent(params.eventId),
  component: GuardianRoute,
});

function GuardianRoute() {
  const event = Route.useLoaderData();
  const { eventId } = Route.useParams();
  const search = useSearch({ strict: false });
  const demo = getDemo(search);
  const flow = useRegistrationFlow();
  const navigate = useNavigate();
  const age = calculateAge(flow.participant.dateOfBirth);
  const [guardian, setGuardian] = useState(
    flow.guardian ?? { name: "", phone: "", relationship: "", consentAccepted: false },
  );
  const [error, setError] = useState(
    demo === "validation-error" ? "⚠ Complete guardian details and consent." : "",
  );

  const isComplete =
    guardian.name.trim() &&
    guardian.relationship.trim() &&
    /^[+ 0-9]{10,16}$/.test(guardian.phone) &&
    guardian.consentAccepted;

  async function submit() {
    if (!isComplete) {
      setError("⚠ Add guardian name, relationship, valid mobile and consent.");
      return;
    }

    const result = await mockMutate(guardian, { demo });

    if (result.status === "validation-error") {
      setError("⚠ We couldn't verify guardian consent. Try again or contact support.");
      return;
    }

    flow.setGuardian(guardian);
    await navigate({ to: "/events/$eventId/register/waiver", params: { eventId } });
  }

  const cta = (
    <Button
      type="button"
      onClick={() => void submit()}
      className="h-12 w-full rounded-2xl text-base shadow-lg shadow-orange-500/25"
    >
      Continue to waiver
    </Button>
  );

  useStickyCta(cta);

  return (
    <RegisterScreen
      eyebrow="P-09 · Guardian"
      title="A guardian must approve this run."
      description="Verifiable parental consent is captured before minors continue to checkout."
      demo={demo}
      demoUrls={[
        `/events/${event.id}/register/guardian?demo=default`,
        `/events/${event.id}/register/guardian?demo=validation-error`,
        `/events/${event.id}/register/guardian?demo=success`,
      ]}
    >
      <Alert className="border-info/40 bg-info/10 text-info-text">
        <span aria-hidden="true">ⓘ</span>
        <AlertTitle>Guardian consent required</AlertTitle>
        <AlertDescription>
          {participantName(flow.participant)} is race age {age ?? "under 18"}. We may verify by
          mobile OTP or support call.
        </AlertDescription>
      </Alert>
      <Card className="rounded-[2rem] border-orange-100">
        <CardContent className="grid gap-4 p-5">
          <Field>
            <FieldLabel htmlFor="guardian-name">Guardian name</FieldLabel>
            <Input
              id="guardian-name"
              name="guardianName"
              autoComplete="name"
              className="h-12 rounded-2xl"
              value={guardian.name}
              onChange={(event) => setGuardian({ ...guardian, name: event.target.value })}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="guardian-relationship">Relationship</FieldLabel>
            <Input
              id="guardian-relationship"
              name="guardianRelationship"
              autoComplete="organization-title"
              className="h-12 rounded-2xl"
              value={guardian.relationship}
              onChange={(event) => setGuardian({ ...guardian, relationship: event.target.value })}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="guardian-phone">Guardian mobile</FieldLabel>
            <Input
              id="guardian-phone"
              name="guardianPhone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              className="h-12 rounded-2xl"
              value={guardian.phone}
              onChange={(event) => setGuardian({ ...guardian, phone: event.target.value })}
            />
          </Field>
          <label htmlFor="guardian-consent" className="flex gap-3 rounded-2xl border bg-card p-4">
            <Checkbox
              id="guardian-consent"
              checked={guardian.consentAccepted}
              onCheckedChange={(checked) =>
                setGuardian({ ...guardian, consentAccepted: checked === true })
              }
              aria-invalid={Boolean(error && !guardian.consentAccepted)}
            />
            <span className="grid gap-1">
              <span className="font-medium">
                I confirm I am the parent/guardian and approve this runner's participation.
              </span>
              <span className="text-sm text-muted-foreground">
                DPDP consent is explicit and starts unchecked.
              </span>
            </span>
          </label>
          <p aria-live="polite" className="text-sm text-info-text">
            ✓ Verification status:{" "}
            {demo === "validation-error"
              ? "Needs support check"
              : guardian.consentAccepted
                ? "Ready to verify"
                : "Awaiting consent"}
          </p>
          {error ? <FieldError aria-live="polite">{error}</FieldError> : null}
        </CardContent>
      </Card>
      <div className="grid grid-cols-2 gap-3">
        <Button asChild variant="outline" className="h-11 rounded-2xl bg-white">
          <Link to="/events/$eventId/register/form" params={{ eventId }}>
            Back
          </Link>
        </Button>
        <Button asChild variant="outline" className="h-11 rounded-2xl bg-white">
          <a href="mailto:support@corral.local">Support</a>
        </Button>
      </div>
    </RegisterScreen>
  );
}
