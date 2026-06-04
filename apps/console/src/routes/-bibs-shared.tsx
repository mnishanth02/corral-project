import { Alert, AlertDescription, AlertTitle } from "@corral/ui/components/alert";
import { Badge } from "@corral/ui/components/badge";
import { Button } from "@corral/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@corral/ui/components/card";
import { DataTable, type DataTableColumn } from "@corral/ui/components/data-table";
import {
  ImportValidation,
  type ImportValidationIssue,
} from "@corral/ui/components/import-validation";
import { Input } from "@corral/ui/components/input";
import { Label } from "@corral/ui/components/label";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@corral/ui/components/pagination";
import { Progress } from "@corral/ui/components/progress";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@corral/ui/components/sheet";
import { CardSkeleton, TableSkeleton } from "@corral/ui/components/skeletons";
import { StatusBadge, type StatusKind } from "@corral/ui/components/status-badge";
import { Textarea } from "@corral/ui/components/textarea";
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { findMockEvent, mockBibs, mockChipMappings, mockRosterParticipants } from "../mocks";
import type { DemoState, EventDistance } from "../mocks/types";

type Step = "assignment" | "validation" | "chips";
type BibRouteTo =
  | "/events/$eventId/bibs"
  | "/events/$eventId/bibs/validate"
  | "/events/$eventId/bibs/chips";

export type BibAssignmentRow = {
  id: string;
  participantName: string;
  registrationId: string;
  distance: EventDistance;
  paymentStatus: string;
  mobile: string;
  currentBib?: string;
  newBib?: string;
  source: string;
  status: "assigned" | "unassigned" | "duplicate" | "pending";
};

export type DuplicateGroup = {
  id: string;
  bibNumber: string;
  severity: "blocker" | "warning";
  participants: Array<{
    id: string;
    name: string;
    distance: EventDistance;
    paymentStatus: string;
    source: string;
    suggestedBib: string;
  }>;
  lastChangedBy: string;
  resolution: string;
};

export type ChipRow = {
  id: string;
  bibNumber: string;
  chipCode: string;
  participantName: string;
  registrationId: string;
  distance: EventDistance;
  gender: string;
  paymentStatus: string;
  status: "mapped" | "missing-chip" | "duplicate-chip" | "needs-review";
  source: string;
  updatedAt: string;
};

export const eventIdForDisplay = "coimbatore-marathon-2026";

const statusKindByAssignment: Record<BibAssignmentRow["status"], StatusKind> = {
  assigned: "ok",
  unassigned: "warning",
  duplicate: "error",
  pending: "info",
};

const assignmentLabel: Record<BibAssignmentRow["status"], string> = {
  assigned: "Assigned",
  unassigned: "Unassigned",
  duplicate: "Duplicate",
  pending: "Pending CSV",
};

const chipStatusKind: Record<ChipRow["status"], StatusKind> = {
  mapped: "ok",
  "missing-chip": "warning",
  "duplicate-chip": "error",
  "needs-review": "warning",
};

const chipStatusLabel: Record<ChipRow["status"], string> = {
  mapped: "Mapped",
  "missing-chip": "Missing chip",
  "duplicate-chip": "Duplicate chip",
  "needs-review": "Needs review",
};

const stepItems: Array<{ id: Step; label: string; to: BibRouteTo }> = [
  { id: "assignment", label: "1. Assignment", to: "/events/$eventId/bibs" },
  { id: "validation", label: "2. Duplicate validation", to: "/events/$eventId/bibs/validate" },
  { id: "chips", label: "3. Chip mapping", to: "/events/$eventId/bibs/chips" },
];

export function getEventName(eventId: string) {
  return findMockEvent(eventId)?.name ?? "Coimbatore Marathon 2026";
}

export function buildAssignmentRows(eventId: string): BibAssignmentRow[] {
  const fixtureRows = mockRosterParticipants
    .filter((participant) => participant.eventId === eventId)
    .map((participant) => {
      const participantBib = "bibNumber" in participant ? participant.bibNumber : undefined;
      const bib = mockBibs.find(
        (row) => "participantId" in row && row.participantId === participant.id,
      );
      return {
        id: participant.id,
        participantName: participant.name,
        registrationId: participant.registrationId,
        distance: participant.distance,
        paymentStatus: participant.paymentStatus,
        mobile: participant.phone,
        currentBib: participantBib ?? bib?.bibNumber,
        newBib: participantBib ?? bib?.bibNumber,
        source: participantBib ? "Manual edit · Priya Raman" : "CSV preview",
        status:
          bib?.status === "duplicate" ? "duplicate" : participantBib ? "assigned" : "unassigned",
      } satisfies BibAssignmentRow;
    });

  return [
    ...fixtureRows,
    {
      id: "participant-meena-krishnan",
      participantName: "Meena Krishnan",
      registrationId: "REG-2026-0042",
      distance: "10K",
      paymentStatus: "Paid & Confirmed",
      mobile: "+91 98430 11223",
      currentBib: "1042",
      newBib: "1042",
      source: "CSV · bib_assignment_codissia.csv",
      status: "duplicate",
    },
    {
      id: "participant-sanjay-kumar",
      participantName: "Sanjay Kumar",
      registrationId: "REG-2026-0107",
      distance: "21K",
      paymentStatus: "Confirmation Sent",
      mobile: "+91 98945 77110",
      source: "Manual queue",
      status: "unassigned",
    },
    {
      id: "participant-raghav-s",
      participantName: "Raghav S",
      registrationId: "REG-2026-0118",
      distance: "10K",
      paymentStatus: "Confirmation Sent",
      mobile: "+91 93602 44118",
      currentBib: "1042",
      newBib: "1042",
      source: "Manual edit · Priya Raman",
      status: "duplicate",
    },
  ];
}

export const duplicateGroups: DuplicateGroup[] = [
  {
    id: "dup-1042",
    bibNumber: "1042",
    severity: "blocker",
    participants: [
      {
        id: "participant-meena-krishnan",
        name: "Meena Krishnan",
        distance: "10K",
        paymentStatus: "Paid & Confirmed",
        source: "CSV import bib_assignment_codissia.csv",
        suggestedBib: "1045",
      },
      {
        id: "participant-raghav-s",
        name: "Raghav S",
        distance: "10K",
        paymentStatus: "Confirmation Sent",
        source: "Manual edit by Priya Raman",
        suggestedBib: "1046",
      },
    ],
    lastChangedBy: "Priya Raman · 11:36 AM",
    resolution: "Change Raghav S to 1046 before export.",
  },
  {
    id: "dup-1188",
    bibNumber: "1188",
    severity: "blocker",
    participants: [
      {
        id: "participant-vikram-narayanan",
        name: "Vikram Narayanan",
        distance: "21K",
        paymentStatus: "Paid & Confirmed",
        source: "CSV import bib_assignment_codissia.csv",
        suggestedBib: "1189",
      },
      {
        id: "participant-anjali-rao",
        name: "Anjali Rao",
        distance: "5K",
        paymentStatus: "Confirmation Sent",
        source: "Manual edit by Arjun Mehta",
        suggestedBib: "3105",
      },
    ],
    lastChangedBy: "Arjun Mehta · 11:41 AM",
    resolution: "Move Anjali Rao to the 5K 3100 range.",
  },
];

export function buildChipRows(eventId: string): ChipRow[] {
  const rows = mockChipMappings
    .filter((mapping) => mapping.eventId === eventId)
    .map((mapping) => {
      const participant = mockRosterParticipants.find((row) => row.id === mapping.participantId);
      return {
        id: mapping.id,
        bibNumber: mapping.bibNumber,
        chipCode: mapping.status === "missing-chip" ? "" : mapping.chipCode,
        participantName: participant?.name ?? "Timing vendor row",
        registrationId: participant?.registrationId ?? "REG-2026-UNMATCHED",
        distance: participant?.distance ?? "10K",
        gender: participant?.gender?.slice(0, 1) ?? "—",
        paymentStatus: participant?.paymentStatus ?? "Needs Review",
        status: mapping.status,
        source: mapping.status === "mapped" ? "Timing vendor upload" : "CSV validation",
        updatedAt: new Intl.DateTimeFormat("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          timeZone: "Asia/Kolkata",
        }).format(new Date(mapping.updatedAt)),
      } satisfies ChipRow;
    });

  return [
    ...rows,
    {
      id: "chip-meena-1042",
      bibNumber: "1042",
      chipCode: "CHIP-CBE-7781",
      participantName: "Meena Krishnan",
      registrationId: "REG-2026-0042",
      distance: "10K",
      gender: "F",
      paymentStatus: "Paid & Confirmed",
      status: "needs-review",
      source: "Results import preflight",
      updatedAt: "11:44 AM",
    },
    {
      id: "chip-anjali-1188",
      bibNumber: "1188",
      chipCode: "CHIP-CBE-9920",
      participantName: "Anjali Rao",
      registrationId: "REG-2026-0188",
      distance: "5K",
      gender: "F",
      paymentStatus: "Confirmation Sent",
      status: "duplicate-chip",
      source: "Vendor CSV",
      updatedAt: "11:46 AM",
    },
  ];
}

export function demoLabel(demo: DemoState) {
  return demo === "default" ? "default" : demo;
}

export function isReadOnly(demo: DemoState, personaId: string) {
  return demo === "permission-denied" || personaId === "org-readonly";
}

export function BibPageShell({
  eventId,
  currentStep,
  eyebrow,
  title,
  description,
  demo,
  children,
  actions,
  back,
}: {
  eventId: string;
  currentStep: Step;
  eyebrow: string;
  title: string;
  description: string;
  demo: DemoState;
  children: ReactNode;
  actions?: ReactNode;
  back?: { to: BibRouteTo; label: string };
}) {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        <div className="grid gap-6 p-6 xl:grid-cols-[1fr_auto] xl:items-end">
          <div className="space-y-3">
            <Badge variant="info" className="uppercase tracking-[0.18em]">
              {eyebrow} · demo={demoLabel(demo)}
            </Badge>
            <div className="space-y-2">
              <h1 className="font-display text-3xl font-black tracking-tight text-foreground xl:text-4xl">
                {title}
              </h1>
              <p className="max-w-3xl text-muted-foreground">{description}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {back ? (
              <Button variant="outline" asChild>
                <Link to={back.to as never} params={{ eventId } as never}>
                  {back.label}
                </Link>
              </Button>
            ) : null}
            {actions}
          </div>
        </div>
        <nav aria-label="BIB management steps" className="border-t bg-muted/30 px-6 py-4">
          <ol className="grid gap-3 lg:grid-cols-3">
            {stepItems.map((step) => {
              const active = step.id === currentStep;
              return (
                <li key={step.id}>
                  <Link
                    to={step.to as never}
                    params={{ eventId } as never}
                    className={`flex min-h-11 items-center justify-between rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                      active
                        ? "border-primary bg-primary text-primary-foreground shadow-sm"
                        : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground"
                    }`}
                    aria-current={active ? "step" : undefined}
                  >
                    <span>{step.label}</span>
                    <span aria-hidden="true">→</span>
                  </Link>
                </li>
              );
            })}
          </ol>
        </nav>
      </div>
      {children}
    </div>
  );
}

export function StatGrid({
  stats,
}: {
  stats: Array<{ label: string; value: string; helper: string; status: StatusKind }>;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.label} className="gap-3">
          <CardHeader className="pb-0">
            <CardDescription>{stat.label}</CardDescription>
            <CardTitle className="font-display text-3xl font-black tabular-nums">
              {stat.value}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <StatusBadge status={stat.status} label={stat.helper} />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function LoadingState({ label }: { label: string }) {
  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_24rem]">
      <TableSkeleton aria-label={`${label} loading table`} />
      <CardSkeleton aria-label={`${label} loading panel`} />
    </div>
  );
}

export function AssignmentStatusBadge({ status }: { status: BibAssignmentRow["status"] }) {
  return <StatusBadge status={statusKindByAssignment[status]} label={assignmentLabel[status]} />;
}

export function ChipStatusBadge({ status }: { status: ChipRow["status"] }) {
  return <StatusBadge status={chipStatusKind[status]} label={chipStatusLabel[status]} />;
}

export function AuditReasonCard({ title, description }: { title: string; description: string }) {
  return (
    <Card className="border-warning/40 bg-warning/5">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <Label htmlFor="audit-reason">Audit reason</Label>
        <Textarea
          id="audit-reason"
          placeholder="Example: Bulk BIB assignment approved by race director before timing export."
          aria-describedby="audit-reason-help"
        />
        <p id="audit-reason-help" className="text-muted-foreground text-sm">
          This frontend-only demo records no backend data, but the production flow must audit bulk
          changes.
        </p>
      </CardContent>
    </Card>
  );
}

export function CsvUploadSheet({ disabled = false }: { disabled?: boolean }) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button disabled={disabled}>Upload BIB CSV</Button>
      </SheetTrigger>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>Upload BIB assignment CSV</SheetTitle>
          <SheetDescription>
            Upload CSV with Registration ID or Mobile + BIB number. Validate before applying.
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-5 px-4">
          <div className="rounded-xl border border-dashed bg-muted/30 p-5 text-center">
            <p className="font-semibold">Drop bib_assignment_codissia.csv here</p>
            <p className="mt-1 text-muted-foreground text-sm">
              CSV only · no private storage paths shown
            </p>
            <Button className="mt-4" variant="outline" type="button">
              Browse local file
            </Button>
          </div>
          <div className="space-y-2" aria-live="polite">
            <div className="flex justify-between text-sm">
              <span>Parsing upload</span>
              <span className="font-semibold">72%</span>
            </div>
            <Progress value={72} />
            <p className="text-muted-foreground text-sm">
              512 rows read · 486 valid · 12 overwrites need audit reason
            </p>
          </div>
          <ImportValidation
            title="CSV validation preview"
            description="S-09 import validation pattern for BIB assignment."
            summary={{ validRows: 486, warningRows: 12, errorRows: 2, totalRows: 512 }}
            issues={bibUploadIssues}
            columnMapping={
              <div className="grid gap-3 text-sm sm:grid-cols-3">
                <MappingPill label="Registration ID" value="registration_id" />
                <MappingPill label="Mobile" value="mobile" />
                <MappingPill label="BIB number" value="bib_number" />
              </div>
            }
          />
          <AuditReasonCard
            title="Bulk apply requires audit reason"
            description="12 rows will overwrite existing BIBs. Confirm this operational change before applying."
          />
        </div>
        <SheetFooter>
          <Button disabled={disabled}>Apply 486 assignments</Button>
          <Button variant="outline">Validate CSV</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export function MappingPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-background p-3">
      <div className="text-muted-foreground text-xs uppercase tracking-[0.16em]">{label}</div>
      <div className="mt-1 font-semibold">{value}</div>
    </div>
  );
}

export const bibUploadIssues: ImportValidationIssue[] = [
  {
    id: "row-42-duplicate",
    rowNumber: 42,
    severity: "error",
    field: "bib_number",
    message: "BIB 1042 already appears in this event. Open duplicate validation before applying.",
  },
  {
    id: "row-118-overwrite",
    rowNumber: 118,
    severity: "warning",
    field: "bib_number",
    message: "Existing BIB will be overwritten. Audit reason required for bulk apply.",
  },
  {
    id: "row-203-blank",
    rowNumber: 203,
    severity: "warning",
    field: "registration_id",
    message: "Mobile matched but Registration ID is blank; review participant identity.",
  },
];

export function AssignmentTable({
  rows,
  loading,
  disabled,
}: {
  rows: BibAssignmentRow[];
  loading?: boolean;
  disabled?: boolean;
}) {
  const columns: DataTableColumn<BibAssignmentRow>[] = [
    {
      id: "participant",
      header: "Participant",
      cell: (row) => (
        <div>
          <div className="font-semibold">{row.participantName}</div>
          <div className="text-muted-foreground text-xs">{row.registrationId}</div>
        </div>
      ),
      className: "min-w-56",
    },
    { id: "distance", header: "Category", accessor: "distance" },
    { id: "payment", header: "Payment status", accessor: "paymentStatus", className: "min-w-40" },
    { id: "mobile", header: "Mobile", accessor: "mobile", className: "min-w-36" },
    {
      id: "current",
      header: "Current BIB",
      cell: (row) => <BibValue value={row.currentBib} />,
    },
    {
      id: "new",
      header: "New BIB",
      cell: (row) => (
        <div className="min-w-28">
          <Label
            className="sr-only"
            htmlFor={`bib-${row.id}`}
          >{`New BIB for ${row.participantName}`}</Label>
          <Input
            id={`bib-${row.id}`}
            defaultValue={row.newBib ?? ""}
            placeholder="1042"
            aria-invalid={row.status === "duplicate"}
            disabled={disabled}
            className="font-display font-bold tabular-nums"
          />
        </div>
      ),
    },
    {
      id: "source",
      header: "Source",
      accessor: "source",
      className: "min-w-44 text-muted-foreground",
    },
    {
      id: "status",
      header: "Status",
      cell: (row) => <AssignmentStatusBadge status={row.status} />,
      className: "min-w-36",
    },
  ];

  return (
    <DataTable
      data={rows}
      columns={columns}
      getRowId={(row) => row.id}
      loading={loading}
      loadingRows={6}
      emptyState="No BIB assignment rows for this event."
      rowClassName={(row) => (row.status === "duplicate" ? "bg-danger/5" : undefined)}
    />
  );
}

export function DuplicateValidationPanel({
  clean = false,
  loading = false,
}: {
  clean?: boolean;
  loading?: boolean;
}) {
  if (loading) {
    return <LoadingState label="Duplicate validation" />;
  }

  if (clean) {
    return (
      <Card className="border-success/30 bg-success/5">
        <CardHeader>
          <StatusBadge status="ok" label="No duplicate BIBs" />
          <CardTitle className="text-2xl">
            Roster is ready for BIB print and timing export.
          </CardTitle>
          <CardDescription>
            Last validation: 11:48 AM · 614 assigned · 0 duplicates · 28 blank BIBs remain for
            walk-ins.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Alert className="border-danger/40 bg-danger/5 text-danger-text">
        <span aria-hidden="true">⚠</span>
        <AlertTitle>Duplicate BIBs found</AlertTitle>
        <AlertDescription>
          Fix duplicates before printing BIB sheets or exporting to the timing vendor. This warning
          includes an icon and text, not color alone.
        </AlertDescription>
      </Alert>
      <ImportValidation
        title="Duplicate validation"
        description="Event-scoped BIB uniqueness check with blank-BIB warnings surfaced separately."
        summary={{ validRows: 612, warningRows: 28, errorRows: 4, totalRows: 644 }}
        issues={duplicateGroups.flatMap((group, groupIndex) =>
          group.participants.map((participant, index) => ({
            id: `${group.id}-${participant.id}`,
            rowNumber: groupIndex * 100 + index + 42,
            severity: "error" as const,
            field: `BIB ${group.bibNumber}`,
            message: `${participant.name} conflicts on BIB ${group.bibNumber}. Suggested correction: ${participant.suggestedBib}.`,
          })),
        )}
      />
    </div>
  );
}

export function DuplicateGroupsTable({ disabled = false }: { disabled?: boolean }) {
  const columns: DataTableColumn<DuplicateGroup>[] = [
    {
      id: "bib",
      header: "BIB",
      cell: (row) => <BibValue value={row.bibNumber} />,
      className: "w-28",
    },
    {
      id: "count",
      header: "Conflict count",
      cell: (row) => row.participants.length,
    },
    {
      id: "participants",
      header: "Participants",
      cell: (row) => (
        <div className="space-y-1">
          {row.participants.map((participant) => (
            <div key={participant.id}>
              <span className="font-medium">{participant.name}</span>{" "}
              <span className="text-muted-foreground">
                · {participant.distance} · {participant.paymentStatus}
              </span>
            </div>
          ))}
        </div>
      ),
      className: "min-w-80 whitespace-normal",
    },
    {
      id: "source",
      header: "Source / Last changed",
      cell: (row) => (
        <div className="text-muted-foreground text-sm">
          <div>{row.lastChangedBy}</div>
          <div>{row.participants[0]?.source}</div>
        </div>
      ),
      className: "min-w-52",
    },
    {
      id: "resolution",
      header: "Resolution",
      cell: (row) => (
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm">
              Resolve BIB {row.bibNumber}
            </Button>
          </SheetTrigger>
          <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
            <SheetHeader>
              <SheetTitle>Resolve BIB {row.bibNumber}</SheetTitle>
              <SheetDescription>{row.resolution}</SheetDescription>
            </SheetHeader>
            <div className="space-y-4 px-4">
              {row.participants.map((participant) => (
                <div key={participant.id} className="rounded-xl border bg-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold">{participant.name}</div>
                      <div className="text-muted-foreground text-sm">
                        {participant.distance} · {participant.paymentStatus}
                      </div>
                    </div>
                    <StatusBadge status="error" label="Duplicate" />
                  </div>
                  <div className="mt-4 grid gap-2">
                    <Label htmlFor={`suggested-${participant.id}`}>Suggested unique BIB</Label>
                    <Input
                      id={`suggested-${participant.id}`}
                      defaultValue={participant.suggestedBib}
                      disabled={disabled}
                    />
                  </div>
                </div>
              ))}
              <AuditReasonCard
                title="Intentional override requires audit"
                description="Allowing duplicate BIBs can break timing results and must be explained."
              />
            </div>
            <SheetFooter>
              <Button disabled={disabled}>Save correction</Button>
              <Button variant="outline" disabled={disabled}>
                Mark intentional override
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      ),
    },
  ];

  return (
    <DataTable
      data={duplicateGroups}
      columns={columns}
      getRowId={(row) => row.id}
      compact={false}
    />
  );
}

export function ChipMappingTable({
  rows,
  loading,
  disabled,
}: {
  rows: ChipRow[];
  loading?: boolean;
  disabled?: boolean;
}) {
  const columns: DataTableColumn<ChipRow>[] = [
    {
      id: "bib",
      header: "BIB",
      cell: (row) => <BibValue value={row.bibNumber} />,
      className: "w-24",
    },
    {
      id: "chip",
      header: "Chip ID",
      cell: (row) => (
        <div className="min-w-44">
          <Label
            className="sr-only"
            htmlFor={`chip-${row.id}`}
          >{`Chip ID for BIB ${row.bibNumber}`}</Label>
          <Input
            id={`chip-${row.id}`}
            defaultValue={row.chipCode}
            placeholder="CHIP-CBE-7781"
            aria-invalid={row.status === "duplicate-chip"}
            disabled={disabled}
            className="font-mono text-xs tabular-nums"
          />
        </div>
      ),
    },
    {
      id: "participant",
      header: "Participant",
      cell: (row) => (
        <div>
          <div className="font-semibold">{row.participantName}</div>
          <div className="text-muted-foreground text-xs">{row.registrationId}</div>
        </div>
      ),
      className: "min-w-56",
    },
    { id: "distance", header: "Category", accessor: "distance" },
    { id: "gender", header: "Gender", accessor: "gender" },
    { id: "payment", header: "Payment", accessor: "paymentStatus", className: "min-w-40" },
    {
      id: "status",
      header: "Mapping status",
      cell: (row) => <ChipStatusBadge status={row.status} />,
      className: "min-w-40",
    },
    {
      id: "source",
      header: "Source",
      accessor: "source",
      className: "min-w-40 text-muted-foreground",
    },
    { id: "updated", header: "Updated", accessor: "updatedAt" },
  ];

  return (
    <DataTable
      data={rows}
      columns={columns}
      getRowId={(row) => row.id}
      loading={loading}
      loadingRows={6}
      emptyState="No BIB ↔ chip mappings yet."
      rowClassName={(row) =>
        row.status === "duplicate-chip"
          ? "bg-danger/5"
          : row.status === "needs-review"
            ? "bg-warning/5"
            : undefined
      }
    />
  );
}

export function BibValue({ value }: { value?: string }) {
  return value ? (
    <span className="font-display text-lg font-black tabular-nums tracking-wide">{value}</span>
  ) : (
    <span className="text-muted-foreground">Blank</span>
  );
}

export function FilterBar({ label, filters }: { label: string; filters: string[] }) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 lg:flex-row lg:items-center lg:justify-between">
      <Label htmlFor={`${label}-search`} className="sr-only">
        Search {label}
      </Label>
      <Input
        id={`${label}-search`}
        placeholder={`Search ${label} by name, BIB, chip, or mobile`}
        className="lg:max-w-md"
      />
      <fieldset className="flex flex-wrap gap-2">
        <legend className="sr-only">{label} filters</legend>
        {filters.map((filter, index) => (
          <Button
            key={filter}
            type="button"
            variant={index === 0 ? "secondary" : "outline"}
            size="sm"
          >
            {filter}
          </Button>
        ))}
      </fieldset>
    </div>
  );
}

export function MiniPagination() {
  return (
    <Pagination className="justify-end">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious href="?page=1" />
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="?page=1" isActive>
            1
          </PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="?page=2">2</PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationNext href="?page=2" />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}

export function DemoUrls({ urls }: { urls: string[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Demo URLs</CardTitle>
        <CardDescription>Deterministic frontend-only states for review.</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2 text-sm">
          {urls.map((url) => (
            <li key={url}>
              <code className="rounded bg-muted px-2 py-1">{url}</code>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
