import { createFileRoute } from "@tanstack/react-router";

import { FeesScreen, validateConsoleSearch } from "./-event-setup-screens";

export const Route = createFileRoute("/_authenticated/events/$eventId/setup/fees")({
  validateSearch: validateConsoleSearch,
  staticData: { breadcrumb: "Fees" },
  component: () => <FeesScreen eventId={(Route.useParams() as { eventId: string }).eventId} />,
});
