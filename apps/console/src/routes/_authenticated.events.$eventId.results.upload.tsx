import { createFileRoute } from "@tanstack/react-router";

import { ResultsUploadScreen, validateResultsSearch } from "./-results-certificates-shared";

export const Route = createFileRoute("/_authenticated/events/$eventId/results/upload")({
  validateSearch: validateResultsSearch,
  staticData: { breadcrumb: "Upload" },
  component: () => (
    <ResultsUploadScreen eventId={(Route.useParams() as { eventId: string }).eventId} />
  ),
});
