import { Button } from "@corral/ui/components/button";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useMemo } from "react";

import { useStickyCta } from "../components/sticky-cta";
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

export const Route = createFileRoute("/my/registrations/$registrationId/certificate")({
  validateSearch: validateDemoSearch,
  component: CertificateScreen,
});

function CertificateScreen() {
  const { registrationId } = Route.useParams();
  const { demo = "default" } = Route.useSearch();
  const bundle = getRegistrationBundle(registrationId);
  if (!bundle) {
    throw notFound();
  }

  const ready = demo !== "empty" && demo !== "webhook-pending";
  const certificateId = `CMB-2026-${bundle.ticket?.bibNumber ?? "1042"}`;
  const cta = useMemo(
    () => (
      <Button className="min-h-12 w-full rounded-2xl text-base" disabled={!ready}>
        Download PDF (mock)
      </Button>
    ),
    [ready],
  );
  useStickyCta(cta);

  if (demo === "loading") {
    return <DemoSkeleton />;
  }

  return (
    <div className="space-y-5">
      <BackLink to="/my/registrations/$registrationId/result" params={{ registrationId }}>
        Back to result
      </BackLink>
      <PageHeader
        eyebrow="P-24 · Certificate"
        title="Finisher proof"
        description="Preview and share a local mock certificate. No PDF service or network call is used."
        action={
          <StatusPill status={ready ? "ok" : "pending"} label={ready ? "Ready" : "Generating"} />
        }
      />

      {ready ? (
        <div
          className="rounded-[2rem] border-[6px] border-double border-orange-200 bg-white p-6 text-center shadow-2xl shadow-slate-950/10"
          role="img"
          aria-label={`Certificate preview for ${bundle.registration.participantName}`}
        >
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-brand-orange-strong">
            Coimbatore Marathon 2026
          </p>
          <p className="mt-8 font-display text-4xl font-black tracking-[-0.06em] text-brand-navy">
            Certificate of Finish
          </p>
          <p className="mt-5 text-sm text-muted-foreground">Presented to</p>
          <p className="mt-2 font-display text-3xl font-black tracking-[-0.05em] text-brand-navy">
            {bundle.registration.participantName}
          </p>
          <p className="mt-4 text-sm text-muted-foreground">
            for completing {bundle.category.name} in 00:54:18
          </p>
          <p className="mt-8 text-xs uppercase tracking-[0.18em] text-muted-foreground">
            {certificateId}
          </p>
        </div>
      ) : (
        <MissingState
          title="Certificate generating"
          description="Results are live; the PDF batch is still preparing. Check again shortly."
        />
      )}

      <InfoCard title="Share details">
        <div className="space-y-4">
          <FieldList
            rows={[
              { label: "Certificate ID", value: certificateId },
              { label: "Share link", value: `corral.local/c/${certificateId}` },
              { label: "Status", value: ready ? "Ready for download" : "Generating" },
            ]}
          />
          <div className="grid grid-cols-2 gap-2">
            <Button disabled={!ready} className="min-h-11 rounded-2xl">
              Download PDF
            </Button>
            <Button disabled={!ready} variant="whatsapp" className="min-h-11 rounded-2xl">
              Share
            </Button>
          </div>
          <Button asChild variant="ghost" className="min-h-11 w-full rounded-2xl">
            <Link to="/my/registrations/$registrationId" params={{ registrationId }}>
              Back to ticket
            </Link>
          </Button>
        </div>
      </InfoCard>
    </div>
  );
}
