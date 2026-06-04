import { createFileRoute } from "@tanstack/react-router";

import {
  ImportScreen,
  readEventIdFromLocation,
  readSimpleRosterSearchFromLocation,
  useActiveEventFromRoute,
  validateSimpleRosterSearch,
} from "./-roster-components";

export const Route = createFileRoute("/_authenticated/events/$eventId/roster/import")({
  validateSearch: validateSimpleRosterSearch,
  staticData: { breadcrumb: "Import update" },
  component: ImportScreenRoute,
});

function ImportScreenRoute() {
  return (
    <ImportScreen
      event={ useActiveEventFromRoute(readEventIdFromLocation()) }
      search={ readSimpleRosterSearchFromLocation() }
    />
  );
}
