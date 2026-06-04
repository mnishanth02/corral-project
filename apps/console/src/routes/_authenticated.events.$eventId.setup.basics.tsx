import { createFileRoute } from "@tanstack/react-router";

import { BasicsScreen, validateConsoleSearch } from "./-event-setup-screens";

export const Route = createFileRoute("/_authenticated/events/$eventId/setup/basics")({
  validateSearch: validateConsoleSearch,
  staticData: { breadcrumb: "Basics" },
  component: () => <BasicsScreen eventId={(Route.useParams() as { eventId: string }).eventId} />,
});
