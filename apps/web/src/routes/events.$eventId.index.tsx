import { createFileRoute } from "@tanstack/react-router";

import { EventLandingPage, getEventOrThrow, validateDemoSearch } from "./-discovery-components";

export const Route = createFileRoute("/events/$eventId/")({
  validateSearch: validateDemoSearch,
  staticData: { breadcrumb: "Event" },
  loader: ({ params }) => getEventOrThrow(params.eventId),
  component: EventLandingRoute,
});

function EventLandingRoute() {
  const event = Route.useLoaderData();
  const search = Route.useSearch();

  return <EventLandingPage event={event} demo={search.demo} />;
}
