import { createFileRoute } from "@tanstack/react-router";

import { demoPublicEvents, fetchPublicEvents } from "../lib/public-events";
import { CalendarPage, validateDemoSearch } from "./-discovery-components";

export const Route = createFileRoute("/calendar")({
  validateSearch: validateDemoSearch,
  loaderDeps: ({ search }) => ({ demo: search.demo }),
  loader: async ({ deps }) => (deps.demo ? demoPublicEvents() : fetchPublicEvents()),
  staticData: { breadcrumb: "Calendar" },
  component: CalendarRoute,
});

function CalendarRoute() {
  const events = Route.useLoaderData();

  return <CalendarPage {...Route.useSearch()} events={events} />;
}
