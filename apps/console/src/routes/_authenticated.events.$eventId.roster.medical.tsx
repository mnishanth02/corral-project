import { createFileRoute } from "@tanstack/react-router";

import {
  MedicalScreen,
  readEventIdFromLocation,
  readSimpleRosterSearchFromLocation,
  useActiveEventFromRoute,
  validateSimpleRosterSearch,
} from "./-roster-components";

export const Route = createFileRoute("/_authenticated/events/$eventId/roster/medical")({
  validateSearch: validateSimpleRosterSearch,
  staticData: { breadcrumb: "Medical" },
  component: MedicalScreenRoute,
});

function MedicalScreenRoute() {
  return (
    <MedicalScreen
      event={useActiveEventFromRoute(readEventIdFromLocation())}
      search={readSimpleRosterSearchFromLocation()}
    />
  );
}
