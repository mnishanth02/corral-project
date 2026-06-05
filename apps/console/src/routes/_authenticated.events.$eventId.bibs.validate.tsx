import { Alert, AlertDescription, AlertTitle } from "@corral/ui/components/alert";
import { Button } from "@corral/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@corral/ui/components/card";
import { StatusBadge } from "@corral/ui/components/status-badge";
import { createFileRoute, Link } from "@tanstack/react-router";

import { useConsoleShell } from "../components/console-shell-context";
import { parseDemoState } from "../mocks/utils";
import {
  AuditReasonCard,
  BibPageShell,
  DemoUrls,
  DuplicateGroupsTable,
  DuplicateValidationPanel,
  eventIdForDisplay,
  getEventName,
  isReadOnly,
  StatGrid,
} from "./-bibs-shared";

export const Route = createFileRoute("/_authenticated/events/$eventId/bibs/validate")({
  validateSearch: (search) => ({ demo: parseDemoState(search.demo) }),
  staticData: { breadcrumb: "BIB Validation" },
  component: BibValidationRoute,
});

function BibValidationRoute() {
  const { eventId } = Route.useParams();
  const { demo } = Route.useSearch();
  const { persona } = useConsoleShell();
  const disabled = isReadOnly(demo, persona.id);
  const clean = demo === "success" || demo === "default";
  const loading = demo === "loading";
  const duplicateCount = clean ? "0" : "2";

  return (
    <BibPageShell
      eventId={eventId}
      currentStep="validation"
      eyebrow={`${getEventName(eventId)} · BIB management`}
      title="Duplicate validation"
      description="Surface duplicate-BIB warnings, blank BIB rows, and timing-export blockers before the race desk prints packets."
      demo={demo}
      back={{ to: "/events/$eventId/bibs", label: "Back to assignment" }}
      actions={
        <>
          <Button variant="outline">Revalidate roster</Button>
          {clean ? (
            <Button asChild>
              <Link to={"/events/$eventId/bibs/chips"} params={{ eventId }} search={{ demo }}>
                Go to BIB ↔ Chip Mapping
              </Link>
            </Button>
          ) : (
            <Button disabled aria-disabled="true">
              Resolve duplicates first
            </Button>
          )}
        </>
      }
    >
      <div className="space-y-6">
        <StatGrid
          stats={[
            {
              label: "Duplicate BIBs",
              value: duplicateCount,
              helper: clean ? "No blockers" : "Blocks export",
              status: clean ? "ok" : "error",
            },
            {
              label: "Affected participants",
              value: clean ? "0" : "4",
              helper: clean ? "Clean" : "Needs correction",
              status: clean ? "ok" : "error",
            },
            { label: "Blank BIBs", value: "28", helper: "Walk-in queue", status: "warning" },
            {
              label: "Last validation",
              value: clean ? "11:48" : "11:42",
              helper: "Asia/Kolkata",
              status: "info",
            },
          ]}
        />

        {disabled ? (
          <Alert className="border-warning/40 bg-warning/5">
            <span aria-hidden="true">⚠</span>
            <AlertTitle>Read-only validation mode</AlertTitle>
            <AlertDescription>
              Corrections and intentional overrides are disabled for this persona.
            </AlertDescription>
          </Alert>
        ) : null}

        <DuplicateValidationPanel clean={clean} loading={loading} />

        {!clean && !loading ? (
          <div className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-semibold text-xl">Conflict groups</h2>
                <p className="text-muted-foreground text-sm">
                  Grouped duplicate rows expand into participant-specific corrections.
                </p>
              </div>
              <StatusBadge status="error" label="Timing export blocked" />
            </div>
            <DuplicateGroupsTable disabled={disabled} />
          </div>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[1fr_24rem]">
          <AuditReasonCard
            title="Override governance"
            description="Manual overrides that keep a duplicate or bulk-clear warnings require an audit reason because timing results can break."
          />
          <Card>
            <CardHeader>
              <CardTitle>Chain navigation</CardTitle>
              <CardDescription>Every BIB step links explicitly back and forward.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button asChild variant="outline" className="w-full">
                <Link to={"/events/$eventId/bibs"} params={{ eventId }} search={{ demo }}>
                  Back to BIB Assignment
                </Link>
              </Button>
              {clean ? (
                <Button asChild className="w-full">
                  <Link to={"/events/$eventId/bibs/chips"} params={{ eventId }} search={{ demo }}>
                    Continue to Chip Mapping
                  </Link>
                </Button>
              ) : (
                <Button className="w-full" disabled aria-disabled="true">
                  Resolve duplicates first
                </Button>
              )}
              {!clean ? (
                <p className="text-danger-text text-sm">
                  Resolve duplicate BIBs before continuing to vendor export.
                </p>
              ) : null}
            </CardContent>
          </Card>
        </div>

        <DemoUrls
          urls={[
            `/events/${eventIdForDisplay}/bibs/validate?demo=validation-error`,
            `/events/${eventIdForDisplay}/bibs/validate?demo=success`,
            `/events/${eventIdForDisplay}/bibs/validate?demo=loading`,
            `/events/${eventIdForDisplay}/bibs/validate?demo=permission-denied&as=org-readonly`,
          ]}
        />
      </div>
    </BibPageShell>
  );
}
