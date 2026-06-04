import { createFileRoute } from "@tanstack/react-router";

import { PublishScreen, validateConsoleSearch } from "./-event-setup-screens";

export const Route = createFileRoute("/_authenticated/events/$eventId/setup/publish")({
  validateSearch: validateConsoleSearch,
  staticData: { breadcrumb: "Publish" },
  component: () => <PublishScreen eventId={(Route.useParams() as { eventId: string }).eventId} />,
});
