import { createFileRoute } from "@tanstack/react-router";

import { parseDemoState } from "../mocks/utils";
import { RefundsScreen } from "./-payments-permissions-shared";

export const Route = createFileRoute("/_authenticated/events/$eventId/payments/refunds")({
  validateSearch: (search) => ({ demo: parseDemoState(search.demo) }),
  staticData: { breadcrumb: "Refunds" },
  component: RefundsRoute,
});

function RefundsRoute() {
  const { eventId } = Route.useParams() as { eventId: string };
  const search = Route.useSearch() as { demo: import("../mocks/types").DemoState };
  return <RefundsScreen eventId={eventId} search={search} />;
}
