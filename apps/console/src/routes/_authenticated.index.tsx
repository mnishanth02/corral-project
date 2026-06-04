import { createFileRoute } from "@tanstack/react-router";

import { EventsDashboardScreen, validateConsoleSearch } from "./-event-setup-screens";

export const Route = createFileRoute("/_authenticated/")({
  validateSearch: validateConsoleSearch,
  staticData: { breadcrumb: "Events" },
  component: EventsDashboardScreen,
});
