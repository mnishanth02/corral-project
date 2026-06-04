import { createFileRoute } from "@tanstack/react-router";

import { ResultsPublishScreen, validateResultsSearch } from "./-results-certificates-shared";

export const Route = createFileRoute("/_authenticated/events/$eventId/results/publish")({
  validateSearch: validateResultsSearch,
  staticData: { breadcrumb: "Publish" },
  component: () => (
    <ResultsPublishScreen eventId={ (Route.useParams() as { eventId: string }).eventId } />
  ),
});
