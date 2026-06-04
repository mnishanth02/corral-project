import { createFileRoute } from "@tanstack/react-router";

import { EventDetailsPage, getEventOrThrow, validateDemoSearch } from "./-discovery-components";

export const Route = createFileRoute("/events/$eventId/details")({
  validateSearch: validateDemoSearch,
  staticData: { breadcrumb: "Details" },
  loader: ({ params }) => getEventOrThrow(params.eventId),
  component: EventDetailsRoute,
});

function EventDetailsRoute() {
  const event = Route.useLoaderData();
  const search = Route.useSearch();

  return <EventDetailsPage event={event} demo={search.demo} />;
}
