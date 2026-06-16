import { createFileRoute } from "@tanstack/react-router";

import { fetchPublicEvent, getDemoPublicEventOrThrow } from "../lib/public-events";
import { validateDemoSearch, WaiverPolicyPage } from "./-discovery-components";

export const Route = createFileRoute("/events/$organizerSlug/$eventSlug/policy/waiver")({
  validateSearch: validateDemoSearch,
  loaderDeps: ({ search }) => ({ demo: search.demo }),
  loader: async ({ deps, params }) =>
    deps.demo
      ? getDemoPublicEventOrThrow(params.eventSlug)
      : fetchPublicEvent(params.organizerSlug, params.eventSlug),
  staticData: { breadcrumb: "Waiver" },
  component: WaiverPolicyRoute,
});

function WaiverPolicyRoute() {
  const event = Route.useLoaderData();
  const search = Route.useSearch();

  return <WaiverPolicyPage event={event} demo={search.demo} />;
}
