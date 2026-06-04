import { createFileRoute } from "@tanstack/react-router";

import { PoliciesScreen, validateConsoleSearch } from "./-event-setup-screens";

export const Route = createFileRoute("/_authenticated/events/$eventId/setup/policies")({
  validateSearch: validateConsoleSearch,
  staticData: { breadcrumb: "Policies" },
  component: () => <PoliciesScreen eventId={(Route.useParams() as { eventId: string }).eventId} />,
});
