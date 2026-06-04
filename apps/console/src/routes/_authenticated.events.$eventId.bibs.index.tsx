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
  AssignmentTable,
  AuditReasonCard,
  BibPageShell,
  buildAssignmentRows,
  CsvUploadSheet,
  DemoUrls,
  eventIdForDisplay,
  FilterBar,
  getEventName,
  isReadOnly,
  LoadingState,
  MiniPagination,
  StatGrid,
} from "./-bibs-shared";

export const Route = createFileRoute("/_authenticated/events/$eventId/bibs/")({
  validateSearch: (search) => ({ demo: parseDemoState(search.demo) }),
  staticData: { breadcrumb: "BIB Assignment" },
  component: BibAssignmentRoute,
});

function BibAssignmentRoute() {
  const { eventId } = Route.useParams();
  const { demo } = Route.useSearch();
  const { persona } = useConsoleShell();
  const disabled = isReadOnly(demo, persona.id);
  const rows = demo === "empty" ? [] : buildAssignmentRows(eventId);
  const loading = demo === "loading";
  const hasWarnings = demo === "validation-error" || rows.some((row) => row.status === "duplicate");

  return (
    <BibPageShell
      eventId={eventId}
      currentStep="assignment"
      eyebrow={`${getEventName(eventId)} · BIB management`}
      title="BIB Assignment"
      description="Manual or CSV assignment for the Coimbatore race desk. Validate every BIB before printing or timing-vendor export."
      demo={demo}
      actions={
        <>
          <Button variant="outline">Download template</Button>
          <CsvUploadSheet disabled={disabled} />
          <Button asChild variant={hasWarnings ? "default" : "outline"}>
            <Link to={"/events/$eventId/bibs/validate"} params={{ eventId }} search={{ demo }}>
              Open duplicate validation
            </Link>
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        <StatGrid
          stats={[
            {
              label: "Assigned",
              value: demo === "success" ? "642" : "614",
              helper: "Ready for print",
              status: "ok",
            },
            {
              label: "Unassigned",
              value: demo === "success" ? "0" : "28",
              helper: "Expo desk queue",
              status: demo === "success" ? "ok" : "warning",
            },
            {
              label: "Duplicates",
              value: hasWarnings ? "2" : "0",
              helper: hasWarnings ? "Needs validation" : "Clean",
              status: hasWarnings ? "error" : "ok",
            },
            {
              label: "Last import",
              value: "11:42",
              helper: "bib_assignment_codissia.csv",
              status: "info",
            },
          ]}
        />

        {disabled ? (
          <Alert className="border-warning/40 bg-warning/5">
            <span aria-hidden="true">⚠</span>
            <AlertTitle>Read-only BIB controls</AlertTitle>
            <AlertDescription>
              Your current persona can review BIB assignments but cannot apply CSV uploads or save
              manual changes.
            </AlertDescription>
          </Alert>
        ) : null}

        {demo === "success" ? (
          <Alert className="border-success/40 bg-success/5">
            <span aria-hidden="true">✓</span>
            <AlertTitle>486 BIBs assigned</AlertTitle>
            <AlertDescription>
              Assignment saved locally for this demo. Continue to duplicate validation before chip
              mapping.
            </AlertDescription>
          </Alert>
        ) : null}

        {hasWarnings ? (
          <Alert className="border-danger/40 bg-danger/5 text-danger-text">
            <span aria-hidden="true">⚠</span>
            <AlertTitle>Duplicate or overwrite warnings require review</AlertTitle>
            <AlertDescription>
              12 rows will overwrite existing BIBs and 2 duplicate BIBs block timing export. Use the
              explicit validation step next.
            </AlertDescription>
          </Alert>
        ) : null}

        {loading ? (
          <LoadingState label="BIB assignment" />
        ) : (
          <div className="space-y-4">
            <FilterBar
              label="BIB assignments"
              filters={["All", "Assigned", "Unassigned", "Duplicate", "5K", "10K", "21K"]}
            />
            <AssignmentTable rows={rows} disabled={disabled} />
            <MiniPagination />
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-[1fr_24rem]">
          <AuditReasonCard
            title="CSV apply audit guard"
            description="Bulk BIB assignment affects race operations and timing vendor files. Production apply requires an audit reason and overwrite confirmation."
          />
          <Card>
            <CardHeader>
              <CardTitle>Next step</CardTitle>
              <CardDescription>Required O-17 → O-18 → O-19 BIB chain.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <StatusBadge
                status={hasWarnings ? "error" : "ok"}
                label={hasWarnings ? "Validation required" : "Ready to validate"}
              />
              <Button asChild className="w-full">
                <Link to={"/events/$eventId/bibs/validate"} params={{ eventId }} search={{ demo }}>
                  Open duplicate validation
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link to={"/events/$eventId/bibs/chips"} params={{ eventId }} search={{ demo }}>
                  Preview chip mapping
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <DemoUrls
          urls={[
            `/events/${eventIdForDisplay}/bibs?demo=default`,
            `/events/${eventIdForDisplay}/bibs?demo=loading`,
            `/events/${eventIdForDisplay}/bibs?demo=success`,
            `/events/${eventIdForDisplay}/bibs?demo=validation-error`,
          ]}
        />
      </div>
    </BibPageShell>
  );
}
