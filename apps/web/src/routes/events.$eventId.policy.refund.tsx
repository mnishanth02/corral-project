import { createFileRoute } from "@tanstack/react-router";

import { getEventOrThrow, RefundPolicyPage, validateDemoSearch } from "./-discovery-components";

export const Route = createFileRoute("/events/$eventId/policy/refund")({
  validateSearch: validateDemoSearch,
  staticData: { breadcrumb: "Refund policy" },
  loader: ({ params }) => getEventOrThrow(params.eventId),
  component: RefundPolicyRoute,
});

function RefundPolicyRoute() {
  const event = Route.useLoaderData();
  const search = Route.useSearch();

  return <RefundPolicyPage event={event} demo={search.demo} />;
}
