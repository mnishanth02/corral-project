import { Alert, AlertDescription, AlertTitle } from "@corral/ui/components/alert";
import { Button } from "@corral/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@corral/ui/components/card";
import { ImportValidation } from "@corral/ui/components/import-validation";
import { StatusBadge } from "@corral/ui/components/status-badge";
import { createFileRoute, Link } from "@tanstack/react-router";

import { useConsoleShell } from "../components/console-shell-context";
import { parseDemoState } from "../mocks/utils";
import {
  AuditReasonCard,
  BibPageShell,
  buildChipRows,
  ChipMappingTable,
  DemoUrls,
  eventIdForDisplay,
  FilterBar,
  getEventName,
  isReadOnly,
  LoadingState,
  MappingPill,
  MiniPagination,
  StatGrid,
} from "./-bibs-shared";

export const Route = createFileRoute("/_authenticated/events/$eventId/bibs/chips")({
  validateSearch: (search) => ({ demo: parseDemoState(search.demo) }),
  staticData: { breadcrumb: "BIB Chip Mapping" },
  component: BibChipMappingRoute,
});

function BibChipMappingRoute() {
  const { eventId } = Route.useParams();
  const { demo } = Route.useSearch();
  const { persona } = useConsoleShell();
  const disabled = isReadOnly(demo, persona.id);
  const loading = demo === "loading";
  const mismatch = demo === "validation-error";
  const rows = buildChipRows(eventId).filter((row) => (mismatch ? row.status !== "mapped" : true));

  return (
    <BibPageShell
      eventId={ eventId }
      currentStep="chips"
      eyebrow={ `${getEventName(eventId)} · Timing vendor readiness` }
      title="BIB ↔ Chip Mapping"
      description="Maintain an exportable, correctable BIB-to-chip table for timing vendors while guarding PII exports and manual overrides."
      demo={ demo }
      back={ { to: "/events/$eventId/bibs/validate", label: "Back to validation" } }
      actions={
        <>
          <Button variant="outline">Upload chip CSV</Button>
          <Button disabled={ disabled }>Export vendor CSV</Button>
        </>
      }
    >
      <div className="space-y-6">
        <StatGrid
          stats={ [
            { label: "Total mappings", value: "614", helper: "Event scoped", status: "ok" },
            {
              label: "Missing chip",
              value: mismatch ? "28" : "1",
              helper: "Needs desk follow-up",
              status: mismatch ? "warning" : "info",
            },
            {
              label: "Duplicate chip",
              value: mismatch ? "2" : "1",
              helper: "Requires correction",
              status: "error",
            },
            {
              label: "Mismatches",
              value: mismatch ? "3" : "1",
              helper: mismatch ? "Export warning" : "Review queue",
              status: mismatch ? "error" : "warning",
            },
          ] }
        />

        { disabled ? (
          <Alert className="border-warning/40 bg-warning/5">
            <span aria-hidden="true">⚠</span>
            <AlertTitle>Read-only chip mapping</AlertTitle>
            <AlertDescription>
              PII export, manual overrides, and chip corrections are disabled for this persona.
            </AlertDescription>
          </Alert>
        ) : null }

        { demo === "success" ? (
          <Alert className="border-success/40 bg-success/5">
            <span aria-hidden="true">✓</span>
            <AlertTitle>Chip mapping saved</AlertTitle>
            <AlertDescription>
              Vendor CSV export is ready in frontend-only demo mode.
            </AlertDescription>
          </Alert>
        ) : null }

        { mismatch ? (
          <Alert className="border-danger/40 bg-danger/5 text-danger-text">
            <span aria-hidden="true">⚠</span>
            <AlertTitle>Chip mismatches found</AlertTitle>
            <AlertDescription>
              Chip RFID-CBE-7781 is mapped to BIB 1042, but timing file references BIB 1043. Resolve
              before results import.
            </AlertDescription>
          </Alert>
        ) : null }

        { loading ? (
          <LoadingState label="Chip mapping" />
        ) : (
          <div className="space-y-4">
            <FilterBar
              label="chip mappings"
              filters={ [
                "All",
                "Missing chip",
                "Duplicate chip",
                "Category mismatch",
                "5K",
                "10K",
                "21K",
              ] }
            />
            <ChipMappingTable rows={ rows } disabled={ disabled } />
            <MiniPagination />
          </div>
        ) }

        <div className="grid gap-6 xl:grid-cols-[1fr_24rem]">
          <ImportValidation
            title="Upload mapping CSV validation"
            description="S-09 mini-flow: upload → map columns → validate mismatches before applying chip corrections."
            summary={ {
              validRows: mismatch ? 583 : 612,
              warningRows: mismatch ? 28 : 1,
              errorRows: mismatch ? 3 : 1,
              totalRows: 614,
            } }
            issues={ [
              {
                id: "chip-row-1043",
                rowNumber: 43,
                severity: mismatch ? "error" : "warning",
                field: "chip_id",
                message: "BIB 1043 has a blank chip ID from vendor CSV.",
              },
              {
                id: "chip-row-1188",
                rowNumber: 188,
                severity: "error",
                field: "chip_id",
                message: "CHIP-CBE-9920 is duplicated with BIB 1189.",
              },
            ] }
            columnMapping={
              <div className="grid gap-3 text-sm sm:grid-cols-4">
                <MappingPill label="BIB" value="bib_number" />
                <MappingPill label="Chip" value="chip_id" />
                <MappingPill label="Name" value="full_name" />
                <MappingPill label="Distance" value="distance" />
              </div>
            }
          />
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Vendor export fields</CardTitle>
                <CardDescription>Minimal export avoids optional mobile/email PII.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                { [
                  "bib_number",
                  "chip_id",
                  "full_name",
                  "distance",
                  "category",
                  "gender",
                  "registration_id",
                  "payment_status",
                ].map((field) => (
                  <div
                    key={ field }
                    className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2"
                  >
                    <code>{ field }</code>
                    <StatusBadge
                      status={ field === "full_name" ? "warning" : "ok" }
                      label={ field === "full_name" ? "PII" : "Included" }
                    />
                  </div>
                )) }
              </CardContent>
            </Card>
            <AuditReasonCard
              title="PII export audit"
              description="Exports containing participant name, mobile, or email require a timing-vendor audit reason. Manual duplicate-chip overrides also require audit."
            />
            <Button asChild variant="outline" className="w-full">
              <Link to={ "/events/$eventId/bibs/validate" } params={ { eventId } } search={ { demo } }>
                Back to Duplicate Validation
              </Link>
            </Button>
          </div>
        </div>

        <DemoUrls
          urls={ [
            `/events/${eventIdForDisplay}/bibs/chips?demo=default`,
            `/events/${eventIdForDisplay}/bibs/chips?demo=validation-error`,
            `/events/${eventIdForDisplay}/bibs/chips?demo=success`,
            `/events/${eventIdForDisplay}/bibs/chips?demo=loading`,
          ] }
        />
      </div>
    </BibPageShell>
  );
}
