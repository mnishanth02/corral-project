import { createFileRoute } from "@tanstack/react-router";

import { demoPublicEvents, fetchPublicEvents } from "../lib/public-events";
import { validateDemoSearch } from "./-discovery-components";
import { IndexPage } from "./-page";

export const Route = createFileRoute("/")({
  validateSearch: validateDemoSearch,
  loaderDeps: ({ search }) => ({ demo: search.demo }),
  loader: async ({ deps }) => (deps.demo ? demoPublicEvents() : fetchPublicEvents()),
  component: IndexRoute,
});

function IndexRoute() {
  const events = Route.useLoaderData();

  return <IndexPage events={events} />;
}
