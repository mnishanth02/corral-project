import { createFileRoute } from "@tanstack/react-router";

import { CouponsScreen, validateConsoleSearch } from "./-event-setup-screens";

export const Route = createFileRoute("/_authenticated/events/$eventId/coupons")({
  validateSearch: validateConsoleSearch,
  staticData: { breadcrumb: "Coupons" },
  component: () => <CouponsScreen eventId={(Route.useParams() as { eventId: string }).eventId} />,
});
