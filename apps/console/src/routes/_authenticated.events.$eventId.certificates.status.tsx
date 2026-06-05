import { createFileRoute } from "@tanstack/react-router";

import { CertificateStatusScreen, validateResultsSearch } from "./-results-certificates-shared";

export const Route = createFileRoute("/_authenticated/events/$eventId/certificates/status")({
  validateSearch: validateResultsSearch,
  staticData: { breadcrumb: "Certificate status" },
  component: () => (
    <CertificateStatusScreen eventId={(Route.useParams() as { eventId: string }).eventId} />
  ),
});
