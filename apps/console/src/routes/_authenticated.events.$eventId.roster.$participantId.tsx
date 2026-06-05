import { Card, CardContent } from "@corral/ui/components/card";
import { EmptyState } from "@corral/ui/components/empty-state";
import { createFileRoute } from "@tanstack/react-router";

import {
  getRosterRows,
  ParticipantDetailContent,
  RosterPageShell,
  readEventIdFromLocation,
  readParticipantIdFromLocation,
  readSimpleRosterSearchFromLocation,
  useActiveEventFromRoute,
  validateSimpleRosterSearch,
} from "./-roster-components";

const reserved = new Set(["import", "export", "spot", "tshirts", "medical"]);

export const Route = createFileRoute("/_authenticated/events/$eventId/roster/$participantId")({
  validateSearch: validateSimpleRosterSearch,
  staticData: { breadcrumb: "Participant detail" },
  component: ParticipantRoute,
});

function ParticipantRoute() {
  const event = useActiveEventFromRoute(readEventIdFromLocation());
  const participantId = readParticipantIdFromLocation();
  const search = readSimpleRosterSearchFromLocation();
  const participant = reserved.has(participantId)
    ? undefined
    : getRosterRows(event.id).find((row) => row.id === participantId);

  if (!participant) {
    return (
      <RosterPageShell
        event={event}
        eyebrow="S-01"
        title="Participant not found"
        description="The roster participant ID is invalid or no longer exists."
      >
        <Card className="rounded-[2rem]">
          <CardContent>
            <EmptyState
              title="Invalid participant link"
              description="Return to the roster and choose an existing runner."
            />
          </CardContent>
        </Card>
      </RosterPageShell>
    );
  }

  return (
    <RosterPageShell
      event={event}
      eyebrow="O-12 detail"
      title={participant.name}
      description="Full-page participant correction view; the same content powers the roster drawer."
    >
      <ParticipantDetailContent event={event} participant={participant} demo={search.demo} />
    </RosterPageShell>
  );
}
