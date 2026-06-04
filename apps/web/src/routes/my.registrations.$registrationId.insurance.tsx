import { Button } from "@corral/ui/components/button";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useMemo } from "react";

import { useStickyCta } from "../components/sticky-cta";
import { formatDate, formatINR } from "../mocks/utils";
import {
  BackLink,
  DemoSkeleton,
  FieldList,
  getRegistrationBundle,
  InfoCard,
  MissingState,
  PageHeader,
  StatusPill,
  validateDemoSearch,
} from "./-my-area";

export const Route = createFileRoute("/my/registrations/$registrationId/insurance")({
  validateSearch: validateDemoSearch,
  component: InsuranceScreen,
});

function InsuranceScreen() {
  const { registrationId } = Route.useParams();
  const { demo = "default" } = Route.useSearch();
  const bundle = getRegistrationBundle(registrationId);
  if (!bundle) {
    throw notFound();
  }

  const policy = demo === "empty" ? undefined : bundle.policy;
  const status =
    demo === "permission-denied" || demo === "error"
      ? { kind: "error" as const, label: "Needs support" }
      : demo === "webhook-pending" || policy?.status === "selected"
        ? { kind: "pending" as const, label: "Issuing" }
        : policy
          ? { kind: "ok" as const, label: "Active" }
          : { kind: "neutral" as const, label: "Not selected" };
  const cta = useMemo(
    () => (
      <Button asChild className="min-h-12 w-full rounded-2xl text-base">
        <a href="tel:+914225550198">Contact insurance support</a>
      </Button>
    ),
    [],
  );
  useStickyCta(cta);

  if (demo === "loading") {
    return <DemoSkeleton />;
  }

  return (
    <div className="space-y-5">
      <BackLink to="/my/registrations/$registrationId" params={{ registrationId }}>
        Back to ticket
      </BackLink>
      <PageHeader
        eyebrow="P-25 · Insurance"
        title="Cover status"
        description="View-only add-on status from checkout. Claims and support stay explicit; there is no post-registration purchase action."
        action={<StatusPill status={status.kind} label={status.label} />}
      />

      {!policy ? (
        <MissingState
          title="No insurance selected"
          description="This registration did not include the optional race-day cover during checkout."
        />
      ) : (
        <InfoCard title={policy.planName} description={policy.summary}>
          <FieldList
            rows={[
              { label: "Provider", value: policy.providerName },
              { label: "Coverage", value: formatINR(policy.coverageAmount) },
              { label: "Premium", value: formatINR(policy.premium) },
              {
                label: "Issued",
                value: policy.issuedAt
                  ? formatDate(policy.issuedAt)
                  : "Pending payment confirmation",
              },
              { label: "Policy no.", value: policy.id.toUpperCase() },
              { label: "Support", value: policy.claimSupportPhone },
            ]}
          />
        </InfoCard>
      )}

      <InfoCard title="Support path">
        <div className="space-y-3 text-sm leading-6 text-muted-foreground">
          <p>
            For emergency support on race day, call the Corral desk first. We will route active
            policy claims to the insurer with your registration ID.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Button asChild variant="outline" className="min-h-11 rounded-2xl bg-white">
              <a href="mailto:support@corral.local">Email support</a>
            </Button>
            <Button asChild variant="ghost" className="min-h-11 rounded-2xl">
              <Link to="/privacy">Privacy notice</Link>
            </Button>
          </div>
        </div>
      </InfoCard>
    </div>
  );
}
