import { createFileRoute } from "@tanstack/react-router";

import { CalendarPage, validateDemoSearch } from "./-discovery-components";

export const Route = createFileRoute("/calendar")({
  validateSearch: validateDemoSearch,
  staticData: { breadcrumb: "Calendar" },
  component: () => <CalendarPage {...Route.useSearch()} />,
});
