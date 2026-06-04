import { Alert, AlertDescription, AlertTitle } from "@corral/ui/components/alert";
import { Badge } from "@corral/ui/components/badge";
import { Button } from "@corral/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@corral/ui/components/card";
import { Checkbox } from "@corral/ui/components/checkbox";
import { Field, FieldError, FieldLabel } from "@corral/ui/components/field";
import { Input } from "@corral/ui/components/input";
import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";

import { useStickyCta } from "../components/sticky-cta";
import { useRegistrationFlow } from "../mocks/store";
import { formatDate, formatINR } from "../mocks/utils";
import {
  calculateAge,
  categoryById,
  findEvent,
  getDemo,
  RegisterScreen,
  selectedInsurance,
  validateRegisterSearch,
} from "./-register-components";

export const Route = createFileRoute("/events/$eventId/register/insurance")({
  validateSearch: validateRegisterSearch,
  loader: ({ params }) => findEvent(params.eventId),
  component: InsuranceRoute,
});

function InsuranceRoute() {
  const event = Route.useLoaderData();
  const { eventId } = Route.useParams();
  const search = useSearch({ strict: false });
  const demo = getDemo(search);
  const flow = useRegistrationFlow();
  const navigate = useNavigate();
  const policy = selectedInsurance();
  const category = categoryById(event, flow.selectedCategoryId);
  const age = calculateAge(flow.participant.dateOfBirth);
  const unavailable =
    demo === "validation-error" || category?.distance === "21K" || (age !== undefined && age < 12);
  const notEnabled = demo === "empty";
  const needsNominee = age !== undefined && age < 18;
  const [optIn, setOptIn] = useState(false);
  const [shareConsent, setShareConsent] = useState(false);
  const [nominee, setNominee] = useState("");
  const [error, setError] = useState("");

  async function continueWithInsurance() {
    if (notEnabled || !optIn) {
      flow.setInsurance(undefined);
      await navigate({ to: "/events/$eventId/register/summary", params: { eventId } });
      return;
    }

    if (unavailable) {
      setError("⚠ Insurance is unavailable for this category or age.");
      return;
    }

    if (!shareConsent || (needsNominee && !nominee.trim())) {
      setError(
        needsNominee
          ? "⚠ Add a nominee and insurer data-sharing consent."
          : "⚠ Accept insurer data-sharing consent.",
      );
      return;
    }

    flow.setInsurance(policy);
    await navigate({ to: "/events/$eventId/register/summary", params: { eventId } });
  }

  const cta = (
    <div className="grid gap-2">
      <Button
        type="button"
        onClick={() => void continueWithInsurance()}
        className="h-12 w-full rounded-2xl text-base shadow-lg shadow-orange-500/25"
      >
        {optIn ? "Add & continue" : "Continue without insurance"}
      </Button>
      <Button
        type="button"
        variant="ghost"
        onClick={() => {
          flow.setInsurance(undefined);
          void navigate({ to: "/events/$eventId/register/summary", params: { eventId } });
        }}
        className="h-11 w-full rounded-2xl"
      >
        Skip insurance
      </Button>
    </div>
  );

  useStickyCta(cta);

  return (
    <RegisterScreen
      eyebrow="P-10A · Insurance"
      title="Optional race-day cover."
      description="Opt-in is unchecked by default; skip keeps the participant total free of add-ons."
      demo={demo}
      demoUrls={[
        `/events/${event.id}/register/insurance?demo=default`,
        `/events/${event.id}/register/insurance?demo=empty`,
        `/events/${event.id}/register/insurance?demo=validation-error`,
        `/events/${event.id}/register/insurance?demo=success`,
      ]}
    >
      {notEnabled ? (
        <Alert className="border-muted bg-secondary">
          <span aria-hidden="true">ⓘ</span>
          <AlertTitle>Insurance not enabled</AlertTitle>
          <AlertDescription>
            The organizer has not enabled accident insurance for this event.
          </AlertDescription>
        </Alert>
      ) : null}
      {unavailable && !notEnabled ? (
        <Alert className="border-warning/40 bg-warning/10 text-warning-text">
          <span aria-hidden="true">⚠</span>
          <AlertTitle>Unavailable for this runner</AlertTitle>
          <AlertDescription>
            Insurance is unavailable for this category or age in the demo fixture.
          </AlertDescription>
        </Alert>
      ) : null}
      <Card className="rounded-[2rem] border-orange-100">
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="font-display text-2xl text-brand-navy">
                {policy.providerName}
              </CardTitle>
              <p className="text-sm text-muted-foreground">{policy.planName}</p>
            </div>
            <Badge className="rounded-full bg-orange-50 text-brand-orange-strong">Optional</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-3xl bg-secondary p-4">
            <p className="font-display text-4xl font-black text-brand-navy">
              {formatINR(policy.premium)}
            </p>
            <p className="text-sm text-muted-foreground">
              Accidental cover up to {formatINR(policy.coverageAmount)} for race day ·{" "}
              {formatDate(event.startsAt)}
            </p>
          </div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>✓ Medical support and accident claim helpline.</li>
            <li>✓ Valid from reporting time until event closure.</li>
            <li>✓ Terms issued by the insurer after payment.</li>
          </ul>
          <label htmlFor="insurance-opt-in" className="flex gap-3 rounded-2xl border bg-card p-4">
            <Checkbox
              id="insurance-opt-in"
              checked={optIn}
              disabled={notEnabled || unavailable}
              onCheckedChange={(checked) => setOptIn(checked === true)}
            />
            <span className="grid gap-1">
              <span className="font-medium">
                Add accident insurance for {formatINR(policy.premium)}.
              </span>
              <span className="text-sm text-muted-foreground">
                Unchecked until explicitly selected.
              </span>
            </span>
          </label>
          {optIn ? (
            <div className="space-y-4 rounded-2xl border border-orange-100 bg-orange-50/40 p-4">
              <label htmlFor="insurer-share-consent" className="flex gap-3">
                <Checkbox
                  id="insurer-share-consent"
                  checked={shareConsent}
                  onCheckedChange={(checked) => setShareConsent(checked === true)}
                  aria-invalid={Boolean(error && !shareConsent)}
                />
                <span className="text-sm text-muted-foreground">
                  I agree to share my name, age and contact with the insurer to issue this policy.
                </span>
              </label>
              {needsNominee ? (
                <Field>
                  <FieldLabel htmlFor="nominee">Nominee / guardian name</FieldLabel>
                  <Input
                    id="nominee"
                    className="h-12 rounded-2xl"
                    value={nominee}
                    onChange={(event) => setNominee(event.target.value)}
                  />
                </Field>
              ) : null}
              {error ? <FieldError aria-live="polite">{error}</FieldError> : null}
            </div>
          ) : null}
          <a
            href="/"
            className="block text-sm font-semibold text-brand-orange-strong underline underline-offset-4"
          >
            Read insurer policy terms ↗
          </a>
        </CardContent>
      </Card>
      <Button asChild variant="outline" className="h-11 w-full rounded-2xl bg-white">
        <Link
          to={
            flow.guardian
              ? "/events/$eventId/register/guardian"
              : "/events/$eventId/register/waiver"
          }
          params={{ eventId }}
        >
          Back
        </Link>
      </Button>
    </RegisterScreen>
  );
}
