import { createFileRoute } from "@tanstack/react-router";

import {
  readEventIdFromLocation,
  readSimpleRosterSearchFromLocation,
  TshirtScreen,
  useActiveEventFromRoute,
  validateSimpleRosterSearch,
} from "./-roster-components";

export const Route = createFileRoute("/_authenticated/events/$eventId/roster/tshirts")({
  validateSearch: validateSimpleRosterSearch,
  staticData: { breadcrumb: "T-shirts" },
  component: TshirtScreenRoute,
});

function TshirtScreenRoute() {
  return (
    <TshirtScreen
      event={useActiveEventFromRoute(readEventIdFromLocation())}
      search={readSimpleRosterSearchFromLocation()}
    />
  );
}
