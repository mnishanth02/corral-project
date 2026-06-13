import { createFileRoute } from "@tanstack/react-router";

import { fetchPublicEvent, getDemoPublicEventOrThrow } from "../lib/public-events";
import { EventLandingPage, validateDemoSearch } from "./-discovery-components";

export const Route = createFileRoute("/events/$organizerSlug/$eventSlug/")({
  validateSearch: validateDemoSearch,
  loaderDeps: ({ search }) => ({ demo: search.demo }),
  loader: async ({ deps, params }) =>
    deps.demo
      ? getDemoPublicEventOrThrow(params.eventSlug)
      : fetchPublicEvent(params.organizerSlug, params.eventSlug),
  staticData: { breadcrumb: "Event" },
  component: EventLandingRoute,
});

function EventLandingRoute() {
  const event = Route.useLoaderData();
  const search = Route.useSearch();

  return <EventLandingPage event={event} demo={search.demo} />;
}
