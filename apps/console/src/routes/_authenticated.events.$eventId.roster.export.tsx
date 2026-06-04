import { createFileRoute } from "@tanstack/react-router";

import {
  ExportScreen,
  readEventIdFromLocation,
  readSimpleRosterSearchFromLocation,
  useActiveEventFromRoute,
  validateSimpleRosterSearch,
} from "./-roster-components";

export const Route = createFileRoute("/_authenticated/events/$eventId/roster/export")({
  validateSearch: validateSimpleRosterSearch,
  staticData: { breadcrumb: "Export" },
  component: ExportScreenRoute,
});

function ExportScreenRoute() {
  return (
    <ExportScreen
      event={useActiveEventFromRoute(readEventIdFromLocation())}
      search={readSimpleRosterSearchFromLocation()}
    />
  );
}
