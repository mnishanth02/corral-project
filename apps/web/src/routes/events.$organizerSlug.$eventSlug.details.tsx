import { createFileRoute } from "@tanstack/react-router";

import { fetchPublicEvent, getDemoPublicEventOrThrow } from "../lib/public-events";
import { EventDetailsPage, validateDemoSearch } from "./-discovery-components";

export const Route = createFileRoute("/events/$organizerSlug/$eventSlug/details")({
  validateSearch: validateDemoSearch,
  loaderDeps: ({ search }) => ({ demo: search.demo }),
  loader: async ({ deps, params }) =>
    deps.demo
      ? getDemoPublicEventOrThrow(params.eventSlug)
      : fetchPublicEvent(params.organizerSlug, params.eventSlug),
  staticData: { breadcrumb: "Details" },
  component: EventDetailsRoute,
});

function EventDetailsRoute() {
  const event = Route.useLoaderData();
  const search = Route.useSearch();

  return <EventDetailsPage event={event} demo={search.demo} />;
}
