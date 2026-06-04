import { Badge } from "@corral/ui/components/badge";
import { Button } from "@corral/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@corral/ui/components/card";

import { useConsoleShell } from "../components/console-shell-context";
import { mockEvents, mockRosterParticipants } from "../mocks";

export function IndexPage() {
  const { activeEventId, demo, persona } = useConsoleShell();
  const activeEvent = mockEvents.find((event) => event.id === activeEventId) ?? mockEvents[0];
  const rosterCount = mockRosterParticipants.filter(
    (participant) => participant.eventId === activeEvent.id,
  ).length;

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
      <Card className="rounded-[2rem] shadow-xl shadow-slate-950/5">
        <CardHeader>
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="secondary">O-04 placeholder</Badge>
            <Badge>{activeEvent.status}</Badge>
          </div>
          <h1 className="font-display text-5xl font-semibold uppercase leading-none tracking-tight">
            Organizer home
          </h1>
          <CardDescription>
            Shell-ready dashboard placeholder. Screen agents can replace this route without touching
            navigation.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl bg-secondary p-5">
            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
              Active event
            </p>
            <p className="mt-2 font-semibold">{activeEvent.name}</p>
          </div>
          <div className="rounded-2xl bg-secondary p-5">
            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Roster rows</p>
            <p className="mt-2 font-display text-4xl font-black">{rosterCount}</p>
          </div>
          <div className="rounded-2xl bg-secondary p-5">
            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Demo state</p>
            <p className="mt-2 font-semibold">{demo}</p>
          </div>
        </CardContent>
      </Card>
      <Card className="rounded-[2rem]">
        <CardHeader>
          <CardTitle className="font-display text-2xl uppercase">Persona</CardTitle>
          <CardDescription>
            {persona.user.name} · {persona.role}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          <Button asChild>
            <a href={`/events/${activeEvent.id}/setup/basics`}>Continue setup</a>
          </Button>
          <Button asChild variant="outline">
            <a href={`/events/${activeEvent.id}/results/upload`}>Open results flow</a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
