import { createFileRoute } from "@tanstack/react-router";

import { CertificateTemplateScreen, validateResultsSearch } from "./-results-certificates-shared";

export const Route = createFileRoute("/_authenticated/events/$eventId/certificates/template")({
  validateSearch: validateResultsSearch,
  staticData: { breadcrumb: "Certificate template" },
  component: () => (
    <CertificateTemplateScreen eventId={(Route.useParams() as { eventId: string }).eventId} />
  ),
});
