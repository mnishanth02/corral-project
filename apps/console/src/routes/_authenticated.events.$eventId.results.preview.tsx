import { createFileRoute } from "@tanstack/react-router";

import { ResultsPreviewScreen, validateResultsSearch } from "./-results-certificates-shared";

export const Route = createFileRoute("/_authenticated/events/$eventId/results/preview")({
  validateSearch: validateResultsSearch,
  staticData: { breadcrumb: "Preview" },
  component: () => (
    <ResultsPreviewScreen eventId={ (Route.useParams() as { eventId: string }).eventId } />
  ),
});
