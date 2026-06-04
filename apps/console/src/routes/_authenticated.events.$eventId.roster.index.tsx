import { createFileRoute } from "@tanstack/react-router";

import {
  RosterIndexScreen,
  readEventIdFromLocation,
  readRosterTableSearchFromLocation,
  useActiveEventFromRoute,
  validateRosterTableSearch,
} from "./-roster-components";

export const Route = createFileRoute("/_authenticated/events/$eventId/roster/")({
  validateSearch: validateRosterTableSearch,
  staticData: { breadcrumb: "Participant table" },
  component: RosterIndexRoute,
});

function RosterIndexRoute() {
  const event = useActiveEventFromRoute(readEventIdFromLocation());
  return <RosterIndexScreen event={event} search={readRosterTableSearchFromLocation()} />;
}
