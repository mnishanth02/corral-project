import { createFileRoute } from "@tanstack/react-router";

import {
  readEventIdFromLocation,
  readSimpleRosterSearchFromLocation,
  SpotRegistrationScreen,
  useActiveEventFromRoute,
  validateSimpleRosterSearch,
} from "./-roster-components";

export const Route = createFileRoute("/_authenticated/events/$eventId/roster/spot")({
  validateSearch: validateSimpleRosterSearch,
  staticData: { breadcrumb: "Spot registration" },
  component: SpotRegistrationScreenRoute,
});

function SpotRegistrationScreenRoute() {
  return (
    <SpotRegistrationScreen
      event={ useActiveEventFromRoute(readEventIdFromLocation()) }
      search={ readSimpleRosterSearchFromLocation() }
    />
  );
}
