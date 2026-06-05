import { createFileRoute } from "@tanstack/react-router";

import { ResultsValidateScreen, validateResultsSearch } from "./-results-certificates-shared";

export const Route = createFileRoute("/_authenticated/events/$eventId/results/validate")({
  validateSearch: validateResultsSearch,
  staticData: { breadcrumb: "Validate" },
  component: () => (
    <ResultsValidateScreen eventId={(Route.useParams() as { eventId: string }).eventId} />
  ),
});
