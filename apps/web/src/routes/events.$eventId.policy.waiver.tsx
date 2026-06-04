import { createFileRoute } from "@tanstack/react-router";

import { getEventOrThrow, validateDemoSearch, WaiverPolicyPage } from "./-discovery-components";

export const Route = createFileRoute("/events/$eventId/policy/waiver")({
  validateSearch: validateDemoSearch,
  staticData: { breadcrumb: "Waiver" },
  loader: ({ params }) => getEventOrThrow(params.eventId),
  component: WaiverPolicyRoute,
});

function WaiverPolicyRoute() {
  const event = Route.useLoaderData();
  const search = Route.useSearch();

  return <WaiverPolicyPage event={event} demo={search.demo} />;
}
