import { createFileRoute } from "@tanstack/react-router";

import { ResultsMappingScreen, validateResultsSearch } from "./-results-certificates-shared";

export const Route = createFileRoute("/_authenticated/events/$eventId/results/mapping")({
  validateSearch: validateResultsSearch,
  staticData: { breadcrumb: "Mapping" },
  component: () => (
    <ResultsMappingScreen eventId={ (Route.useParams() as { eventId: string }).eventId } />
  ),
});
