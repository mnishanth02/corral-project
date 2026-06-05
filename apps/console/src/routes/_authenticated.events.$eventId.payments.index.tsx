import { createFileRoute } from "@tanstack/react-router";

import { parseDemoState } from "../mocks/utils";
import { PaymentsDashboard } from "./-payments-permissions-shared";

export const Route = createFileRoute("/_authenticated/events/$eventId/payments/")({
  validateSearch: (search) => ({ demo: parseDemoState(search.demo) }),
  staticData: { breadcrumb: "Payments" },
  component: PaymentsRoute,
});

function PaymentsRoute() {
  const { eventId } = Route.useParams() as { eventId: string };
  const search = Route.useSearch() as { demo: import("../mocks/types").DemoState };
  return <PaymentsDashboard eventId={eventId} search={search} />;
}
