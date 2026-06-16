import { createFileRoute } from "@tanstack/react-router";

import { fetchPublicEvent, getDemoPublicEventOrThrow } from "../lib/public-events";
import { RefundPolicyPage, validateDemoSearch } from "./-discovery-components";

export const Route = createFileRoute("/events/$organizerSlug/$eventSlug/policy/refund")({
  validateSearch: validateDemoSearch,
  loaderDeps: ({ search }) => ({ demo: search.demo }),
  loader: async ({ deps, params }) =>
    deps.demo
      ? getDemoPublicEventOrThrow(params.eventSlug)
      : fetchPublicEvent(params.organizerSlug, params.eventSlug),
  staticData: { breadcrumb: "Refund policy" },
  component: RefundPolicyRoute,
});

function RefundPolicyRoute() {
  const event = Route.useLoaderData();
  const search = Route.useSearch();

  return <RefundPolicyPage event={event} demo={search.demo} />;
}
