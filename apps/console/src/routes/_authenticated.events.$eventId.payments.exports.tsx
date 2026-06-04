import { createFileRoute } from "@tanstack/react-router";

import { parseDemoState } from "../mocks/utils";
import { PaymentExportsScreen } from "./-payments-permissions-shared";

export const Route = createFileRoute("/_authenticated/events/$eventId/payments/exports")({
  validateSearch: (search) => ({ demo: parseDemoState(search.demo) }),
  staticData: { breadcrumb: "GST & Reports" },
  component: PaymentExportsRoute,
});

function PaymentExportsRoute() {
  const { eventId } = Route.useParams() as { eventId: string };
  const search = Route.useSearch() as { demo: import("../mocks/types").DemoState };
  return <PaymentExportsScreen eventId={eventId} search={search} />;
}
