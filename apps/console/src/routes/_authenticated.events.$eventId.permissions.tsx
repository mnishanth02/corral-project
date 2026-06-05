import { createFileRoute } from "@tanstack/react-router";

import { parseDemoState } from "../mocks/utils";
import { PermissionsScreen } from "./-payments-permissions-shared";

export const Route = createFileRoute("/_authenticated/events/$eventId/permissions")({
  validateSearch: (search) => ({ demo: parseDemoState(search.demo) }),
  staticData: { breadcrumb: "Permissions" },
  component: PermissionsRoute,
});

function PermissionsRoute() {
  const { eventId } = Route.useParams() as { eventId: string };
  const search = Route.useSearch() as { demo: import("../mocks/types").DemoState };
  return <PermissionsScreen eventId={eventId} search={search} />;
}
