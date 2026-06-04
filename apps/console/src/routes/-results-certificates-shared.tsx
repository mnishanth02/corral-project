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
import { ConfirmDialog } from "@corral/ui/components/confirm-dialog";
import { DataTable, type DataTableColumn } from "@corral/ui/components/data-table";
import { EmptyState } from "@corral/ui/components/empty-state";
import {
  ImportValidation,
  type ImportValidationIssue,
} from "@corral/ui/components/import-validation";
import { Input } from "@corral/ui/components/input";
import { Label } from "@corral/ui/components/label";
import { PendingBanner } from "@corral/ui/components/pending-banner";
import { Progress } from "@corral/ui/components/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@corral/ui/components/select";
import { Skeleton } from "@corral/ui/components/skeleton";
import { StatusBadge, type StatusKind } from "@corral/ui/components/status-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@corral/ui/components/tabs";
import { Textarea } from "@corral/ui/components/textarea";
import { type ReactNode, useMemo, useState } from "react";
import { useConsoleShell } from "../components/console-shell-context";
import { ResultsStepper } from "../components/wizard-steppers";
import {
  findMockEvent,
  mockEvents,
  mockResults,
  mockRosterParticipants,
  parseDemoState,
  useMockStore,
} from "../mocks";
import { isPersonaId } from "../mocks/personas";
import type { DemoState, EventDistance, PersonaId, Result, ResultStatus } from "../mocks/types";

type Search = { as?: PersonaId; demo: DemoState };
type ResultRow = Result & {
  age: number;
  gender: string;
  category: string;
  ageGroup: string;
  ageGrade: string;
  anomaly?: string;
};
type VendorRow = {
  row: number;
  bib: string;
  name: string;
  gender: string;
  distance: EventDistance;
  start: string;
  finish: string;
  net: string;
  gun: string;
  rank: string;
  status: ResultStatus;
};

type CertRow = {
  id: string;
  bib: string;
  name: string;
  distance: EventDistance;
  status: "queued" | "rendering" | "generated" | "sent" | "failed" | "held";
  reason?: string;
};

export function validateResultsSearch(search: Record<string, unknown>): Search {
  return { as: isPersonaId(search.as) ? search.as : undefined, demo: parseDemoState(search.demo) };
}

const demoEventId = "coimbatore-marathon-2026";
const requiredTargets = [
  "BIB",
  "Name",
  "Gender/category",
  "Distance",
  "Start time",
  "Finish time",
  "Net time",
  "Gun time",
  "Rank",
  "Status",
];
const sourceColumns = [
  "Bib Number",
  "Athlete",
  "Gender",
  "Category",
  "Race",
  "Started At",
  "Finished At",
  "Chip Time",
  "Gun Time",
  "Overall Rank",
  "Result Status",
];
const initialMapping: Record<string, string> = {
  BIB: "Bib Number",
  Name: "Athlete",
  "Gender/category": "Gender",
  Distance: "Race",
  "Start time": "Started At",
  "Finish time": "Finished At",
  "Net time": "Chip Time",
  "Gun time": "Gun Time",
  Rank: "Overall Rank",
  Status: "Result Status",
};
const sampleRows: VendorRow[] = [
  {
    row: 2,
    bib: "1042",
    name: "Ananya Krishnan",
    gender: "Female",
    distance: "21K",
    start: "05:32:05",
    finish: "07:23:54",
    net: "01:51:49",
    gun: "01:52:14",
    rank: "42",
    status: "finished",
  },
  {
    row: 3,
    bib: "1043",
    name: "Mohammed Faisal",
    gender: "Male",
    distance: "21K",
    start: "05:32:10",
    finish: "07:50:41",
    net: "",
    gun: "02:18:31",
    rank: "",
    status: "DNF",
  },
  {
    row: 4,
    bib: "2188",
    name: "Karthik Narayanan",
    gender: "Male",
    distance: "10K",
    start: "06:03:00",
    finish: "",
    net: "",
    gun: "",
    rank: "",
    status: "DNS",
  },
  {
    row: 5,
    bib: "3104",
    name: "Divya Senthil",
    gender: "Female",
    distance: "5K",
    start: "06:20:02",
    finish: "07:00:52",
    net: "00:40:50",
    gun: "00:41:02",
    rank: "",
    status: "DQ",
  },
];

function useCurrentEvent(eventId?: string) {
  const { activeEventId } = useConsoleShell();
  return (
    findMockEvent(eventId ?? activeEventId) ??
    findMockEvent(activeEventId) ??
    findMockEvent(demoEventId) ??
    mockEvents[0]
  );
}

function Shell({
  eventId,
  step,
  eyebrow,
  title,
  description,
  actions,
  children,
}: {
  eventId: string;
  step?: string;
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-6">
      {step ? <ResultsStepper eventId={eventId} activeStep={step} /> : null}
      <Header eyebrow={eyebrow} title={title} description={description} actions={actions} />
      {children}
    </div>
  );
}

function Header({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <div className="relative overflow-hidden rounded-[2rem] border bg-card p-6 shadow-xl shadow-slate-950/5">
      <div
        className="absolute -right-10 -top-12 h-40 w-40 rounded-full bg-brand-tint"
        aria-hidden="true"
      />
      <div className="absolute bottom-0 right-16 h-1 w-40 bg-brand-orange" aria-hidden="true" />
      <div className="relative flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-brand-orange-strong">
            {eyebrow}
          </p>
          <h1 className="mt-2 font-display text-5xl font-black uppercase leading-none tracking-tight text-foreground">
            {title}
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
    </div>
  );
}

function DemoUrls({ urls }: { urls: string[] }) {
  return (
    <Card className="rounded-[1.5rem]">
      <CardHeader>
        <CardTitle className="text-base">Demo URLs</CardTitle>
        <CardDescription>Deterministic states for review.</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="grid gap-1 text-sm text-muted-foreground">
          {urls.map((url) => (
            <li key={url}>
              <code>{url}</code>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function StatCard({
  label,
  value,
  note,
  tone = "info",
}: {
  label: string;
  value: string;
  note: string;
  tone?: "info" | "success" | "warning" | "danger";
}) {
  const toneClass = {
    info: "border-info/30 bg-info/5",
    success: "border-success/30 bg-success/5",
    warning: "border-warning/30 bg-warning/5",
    danger: "border-danger/30 bg-danger/5",
  }[tone];
  return (
    <Card className={`rounded-[1.5rem] ${toneClass}`}>
      <CardContent className="p-5">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
          {label}
        </p>
        <p className="mt-2 font-display text-4xl font-black leading-none">{value}</p>
        <p className="mt-2 text-sm text-muted-foreground">{note}</p>
      </CardContent>
    </Card>
  );
}

function DemoNotice({ demo }: { demo: DemoState }) {
  if (demo === "offline")
    return (
      <PendingBanner
        status="queued"
        title="Offline demo mode"
        description="No backend calls are made. Changes stay in the local mock store only."
      />
    );
  if (demo === "permission-denied")
    return (
      <Alert className="border-danger/40 bg-danger/5 text-danger-text">
        <span aria-hidden="true">⛔</span>
        <AlertTitle>Permission denied</AlertTitle>
        <AlertDescription>
          This persona can review results but cannot publish, unpublish, or correct timing data.
        </AlertDescription>
      </Alert>
    );
  if (demo === "webhook-pending")
    return (
      <PendingBanner
        status="reconciling"
        title="Certificate/render queue pending"
        description="The demo shows an asynchronous CSV/PDF delay without making network requests."
      />
    );
  return null;
}

const loadingSkeletonKeys = [
  "loading-card-upload",
  "loading-card-map",
  "loading-card-validate",
  "loading-card-preview",
  "loading-card-publish",
  "loading-card-certificates",
];

function LoadingCards() {
  return (
    <div className="grid gap-4 md:grid-cols-3" role="status" aria-label="Loading results screen">
      {loadingSkeletonKeys.map((key) => (
        <Skeleton key={key} className="h-32 rounded-2xl" />
      ))}
    </div>
  );
}

function resultBadge(status: ResultStatus) {
  const map: Record<ResultStatus, { kind: StatusKind; label: string }> = {
    finished: { kind: "ok", label: "Finished" },
    DNF: { kind: "warning", label: "DNF" },
    DNS: { kind: "neutral", label: "DNS" },
    DQ: { kind: "error", label: "DQ" },
  };
  return <StatusBadge status={map[status].kind} label={map[status].label} />;
}

function resultRows(eventId: string): ResultRow[] {
  return mockResults
    .filter((result) => result.eventId === eventId)
    .map((result, index) => {
      const participant = mockRosterParticipants.find((row) => row.id === result.participantId);
      const age = participant?.age ?? (index === 3 ? 45 : 30);
      return {
        ...result,
        age,
        gender: participant?.gender ?? "Male",
        category: `${result.distance} ${participant?.gender ?? "Open"}`,
        ageGroup: age >= 40 ? "Masters 40+" : "Open",
        ageGrade: result.status === "finished" ? `${(78 - index * 3.4).toFixed(1)}%` : "—",
        anomaly:
          result.status === "DQ"
            ? "DQ reason missing"
            : result.status === "DNF"
              ? "Missing split at 15K"
              : undefined,
      };
    });
}

const resultColumns: DataTableColumn<ResultRow>[] = [
  { id: "rank", header: "Rank", cell: (row) => row.overallRank ?? "—", className: "font-medium" },
  { id: "bib", header: "BIB", accessor: "bibNumber", className: "font-medium" },
  {
    id: "name",
    header: "Runner",
    cell: (row) => (
      <span>
        {row.name}
        <span className="block text-xs text-muted-foreground">
          {row.gender} · {row.ageGroup}
        </span>
      </span>
    ),
  },
  { id: "distance", header: "Distance", accessor: "distance" },
  { id: "chip", header: "Net", cell: (row) => row.chipTime ?? "—" },
  { id: "gun", header: "Gun", cell: (row) => row.gunTime ?? "—" },
  { id: "status", header: "Status", cell: (row) => resultBadge(row.status) },
  {
    id: "anomaly",
    header: "Flags",
    cell: (row) =>
      row.anomaly ? (
        <Badge variant="warning">
          <span aria-hidden="true">⚠</span>
          {row.anomaly}
        </Badge>
      ) : (
        <span className="text-muted-foreground">Clear</span>
      ),
  },
];

export function ResultsUploadScreen({ eventId }: { eventId: string }) {
  const event = useCurrentEvent(eventId);
  const { demo } = RouteShellState();
  const { resultsUploadDrafts, updateResultsUploadDraft } = useMockStore();
  const draft = resultsUploadDrafts[event.id];
  const fileName =
    demo === "empty" ? undefined : (draft?.fileName ?? "timing-vendor-codissia-raw.csv");
  if (demo === "loading")
    return (
      <Shell
        eventId={event.id}
        step="upload"
        eyebrow="O-24 Results"
        title="Upload timing CSV"
        description="Loading private CSV intake."
      >
        <LoadingCards />
      </Shell>
    );
  return (
    <Shell
      eventId={event.id}
      step="upload"
      eyebrow="O-24 Results upload"
      title="Upload timing CSV"
      description="Drop the timing-vendor file, keep it private, then map columns before validation."
      actions={
        <Button asChild>
          <a href={`/events/${event.id}/results/mapping`}>Continue to mapping</a>
        </Button>
      }
    >
      <DemoNotice demo={demo} />
      <div className="grid gap-6 xl:grid-cols-[1fr_24rem]">
        <Card className="rounded-[1.5rem] border-dashed">
          <CardHeader>
            <CardTitle>Private CSV intake</CardTitle>
            <CardDescription>
              No public file URLs are generated; this is frontend-only mock state.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <label
              htmlFor="timing-file"
              className="flex min-h-64 cursor-pointer flex-col items-center justify-center rounded-[1.5rem] border border-dashed bg-secondary/60 p-8 text-center"
            >
              <span className="text-5xl" aria-hidden="true">
                ⇪
              </span>
              <span className="mt-4 font-display text-3xl font-black uppercase">
                Drop vendor CSV
              </span>
              <span className="mt-2 text-sm text-muted-foreground">
                CSV/XLSX exported by Kovai Timing Desk · UTF-8 · max 20 MB
              </span>
              <Input
                id="timing-file"
                className="sr-only"
                type="file"
                accept=".csv,.xlsx"
                onChange={(e) =>
                  updateResultsUploadDraft(event.id, {
                    fileName: e.currentTarget.files?.[0]?.name ?? fileName,
                    publishStatus: "not-started",
                  })
                }
              />
            </label>
            {fileName ? (
              <div className="mt-4 rounded-2xl border bg-card p-4">
                <StatusBadge status="ok" label="File ready" />
                <p className="mt-2 font-medium">{fileName}</p>
                <p className="text-sm text-muted-foreground">
                  642 expected rows · BIB 1042 present · uploaded by Priya Raman
                </p>
              </div>
            ) : null}
          </CardContent>
        </Card>
        <div className="grid gap-4">
          <Alert className="border-warning/40 bg-warning/5">
            <span aria-hidden="true">⚠</span>
            <AlertTitle>DPDP private personal-data handling</AlertTitle>
            <AlertDescription>
              This timing file is treated as private personal data. It is never exposed as a public
              link or raw path in the browser.
            </AlertDescription>
          </Alert>
          <StatCard
            label="Rows detected"
            value={demo === "empty" ? "0" : "642"}
            note="5K/10K/21K combined"
          />
          <StatCard label="Required fields" value="10" note="BIB through status" tone="success" />
        </div>
      </div>
      {demo === "empty" ? (
        <EmptyState
          title="No timing file uploaded"
          description="Upload the vendor CSV from CODISSIA finish timing before mapping columns."
        />
      ) : null}
      <DemoUrls
        urls={[
          `/events/${demoEventId}/results/upload?demo=default`,
          `/events/${demoEventId}/results/upload?demo=empty`,
          `/events/${demoEventId}/results/upload?demo=loading`,
          `/events/${demoEventId}/results/upload?demo=offline`,
        ]}
      />
    </Shell>
  );
}

export function ResultsMappingScreen({ eventId }: { eventId: string }) {
  const event = useCurrentEvent(eventId);
  const { demo } = RouteShellState();
  const { resultsUploadDrafts, updateResultsUploadDraft } = useMockStore();
  const draft = resultsUploadDrafts[event.id];
  const mapping = { ...initialMapping, ...(draft?.mappedColumns ?? {}) };
  const columns: DataTableColumn<VendorRow>[] = [
    { id: "row", header: "Row", accessor: "row" },
    { id: "bib", header: "BIB", accessor: "bib" },
    { id: "name", header: "Name", accessor: "name" },
    { id: "distance", header: "Distance", accessor: "distance" },
    { id: "net", header: "Net", accessor: "net" },
    { id: "status", header: "Status", cell: (row) => resultBadge(row.status) },
  ];
  const requiredUnmapped = demo === "validation-error";
  const typeMismatch = demo === "error";
  return (
    <Shell
      eventId={event.id}
      step="mapping"
      eyebrow="O-25 Column mapping"
      title="Map vendor columns"
      description="Translate timing-vendor headings into Corral canonical fields without leaking vendor-specific shape into UI state."
      actions={
        <>
          <Button
            variant="outline"
            onClick={() => updateResultsUploadDraft(event.id, { mappedColumns: initialMapping })}
          >
            Auto-detect
          </Button>
          <Button asChild>
            <a href={`/events/${event.id}/results/validate`}>Continue to validation</a>
          </Button>
        </>
      }
    >
      <DemoNotice demo={demo} />
      {requiredUnmapped ? (
        <Alert className="border-danger/40 bg-danger/5 text-danger-text">
          <span aria-hidden="true">✕</span>
          <AlertTitle>Required-field unmapped</AlertTitle>
          <AlertDescription>
            BIB and Status must be mapped before validation can continue.
          </AlertDescription>
        </Alert>
      ) : null}
      {typeMismatch ? (
        <Alert className="border-warning/40 bg-warning/5 text-warning-text">
          <span aria-hidden="true">⚠</span>
          <AlertTitle>Type mismatch</AlertTitle>
          <AlertDescription>
            Finish time contains non-time text on rows 18 and 92. Select the Chip Time column or fix
            the CSV.
          </AlertDescription>
        </Alert>
      ) : null}
      <div className="grid gap-6 xl:grid-cols-[1fr_30rem]">
        <Card className="rounded-[1.5rem]">
          <CardHeader>
            <CardTitle>Source → target mapping</CardTitle>
            <CardDescription>Auto-detected from timing-vendor-codissia-raw.csv.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {requiredTargets.map((target) => (
              <div
                key={target}
                className="grid items-center gap-3 rounded-2xl border p-3 md:grid-cols-[13rem_1fr]"
              >
                <Label htmlFor={`map-${target}`} className="font-semibold">
                  {target}
                </Label>
                <Select
                  value={
                    requiredUnmapped && (target === "BIB" || target === "Status")
                      ? "unmapped"
                      : mapping[target]
                  }
                  onValueChange={(value) =>
                    updateResultsUploadDraft(event.id, {
                      mappedColumns: { ...mapping, [target]: value },
                    })
                  }
                >
                  <SelectTrigger id={`map-${target}`} aria-label={`Map ${target}`}>
                    <SelectValue placeholder="Choose source column" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unmapped">Unmapped</SelectItem>
                    {sourceColumns.map((column) => (
                      <SelectItem key={column} value={column}>
                        {column}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="rounded-[1.5rem]">
          <CardHeader>
            <CardTitle>Sample-row preview</CardTitle>
            <CardDescription>
              First four parsed rows with status shown as icon + label.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              data={sampleRows}
              columns={columns}
              getRowId={(row) => String(row.row)}
              compact={false}
            />
          </CardContent>
        </Card>
      </div>
      <DemoUrls
        urls={[
          `/events/${demoEventId}/results/mapping?demo=default`,
          `/events/${demoEventId}/results/mapping?demo=validation-error`,
          `/events/${demoEventId}/results/mapping?demo=error`,
        ]}
      />
    </Shell>
  );
}

export function ResultsValidateScreen({ eventId }: { eventId: string }) {
  const event = useCurrentEvent(eventId);
  const { demo } = RouteShellState();
  const issues = validationIssues(demo);
  const summary = {
    validRows: demo === "success" ? 642 : 637,
    warningRows: issues.filter((i) => i.severity === "warning").length,
    errorRows: issues.filter((i) => i.severity === "error").length,
    totalRows: 642,
  };
  return (
    <Shell
      eventId={event.id}
      step="validate"
      eyebrow="O-26 Validation"
      title="Review row issues"
      description="Reuse the S-09 import validation pattern for unmatched BIBs, bad statuses, and correctable timing rows."
      actions={
        <Button asChild>
          <a href={`/events/${event.id}/results/preview`}>Preview rankings</a>
        </Button>
      }
    >
      <DemoNotice demo={demo} />
      <ImportValidation
        title="Timing CSV validation"
        description="3 BIBs not found in roster; fix or skip row before publishing."
        summary={summary}
        issues={issues}
        loading={demo === "loading"}
        columnMapping={
          <div className="grid gap-2 text-sm md:grid-cols-5">
            {[
              "BIB → Bib Number",
              "Name → Athlete",
              "Distance → Race",
              "Net → Chip Time",
              "Status → Result Status",
            ].map((item) => (
              <Badge key={item} variant="outline">
                {item}
              </Badge>
            ))}
          </div>
        }
        actions={
          <>
            <Button variant="outline">Download error CSV</Button>
            <Button asChild>
              <a href={`/events/${event.id}/results/mapping`}>Edit mapping</a>
            </Button>
          </>
        }
        emptyState="All rows passed validation. Rankings are ready to preview."
      />
      <DemoUrls
        urls={[
          `/events/${demoEventId}/results/validate?demo=default`,
          `/events/${demoEventId}/results/validate?demo=success`,
          `/events/${demoEventId}/results/validate?demo=loading`,
          `/events/${demoEventId}/results/validate?demo=validation-error`,
        ]}
      />
    </Shell>
  );
}

function validationIssues(demo: DemoState): ImportValidationIssue<VendorRow>[] {
  if (demo === "success") return [];
  const severity: "warning" | "error" = demo === "validation-error" ? "error" : "warning";
  return [
    {
      id: "unmatched-3104",
      rowNumber: 5,
      severity,
      field: "BIB",
      message: "BIB 3104 is not assigned in roster; suggested match Divya Senthil has no BIB.",
    },
    {
      id: "bad-status",
      rowNumber: 18,
      severity: "error",
      field: "Status",
      message: "Status 'FINSHD' must be one of finished, DNF, DNS, or DQ.",
    },
    {
      id: "missing-finish",
      rowNumber: 92,
      severity: "warning",
      field: "Finish time",
      message: "Finish before start detected for BIB 1048; verify timing chip split.",
    },
  ];
}

export function ResultsPreviewScreen({ eventId }: { eventId: string }) {
  const event = useCurrentEvent(eventId);
  const { demo } = RouteShellState();
  const [editing, setEditing] = useState(demo === "validation-error");
  const rows = resultRows(event.id);
  const masters = rows.filter((row) => row.ageGroup.startsWith("Masters"));
  return (
    <Shell
      eventId={event.id}
      step="preview"
      eyebrow="O-27 Results preview"
      title="Preview rankings"
      description="Computed overall, category, and Masters age-group rankings before they become public."
      actions={
        <Button asChild>
          <a href={`/events/${event.id}/results/publish`}>Publish review</a>
        </Button>
      }
    >
      <DemoNotice demo={demo} />
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          label="Finishers"
          value="1"
          note="Finished rows currently ranked"
          tone="success"
        />
        <StatCard
          label="DNF/DNS/DQ"
          value="3"
          note="All status badges show icon + label"
          tone="warning"
        />
        <StatCard label="Masters" value={String(masters.length)} note="Age group 40+" />
        <StatCard
          label="Anomalies"
          value={demo === "success" ? "0" : "2"}
          note="Fix before publish"
          tone={demo === "success" ? "success" : "danger"}
        />
      </div>
      {demo !== "success" ? (
        <Alert className="border-warning/40 bg-warning/5 text-warning-text">
          <span aria-hidden="true">⚠</span>
          <AlertTitle>Anomaly flags present</AlertTitle>
          <AlertDescription>
            Finish-before-start and duplicate BIB checks are shown with text labels, not colour
            alone.
          </AlertDescription>
        </Alert>
      ) : null}
      <Tabs defaultValue="overall" className="grid gap-4">
        <TabsList className="w-fit">
          <TabsTrigger value="overall">Overall</TabsTrigger>
          <TabsTrigger value="category">Category</TabsTrigger>
          <TabsTrigger value="masters">Age-group Masters</TabsTrigger>
        </TabsList>
        <TabsContent value="overall">
          <RankTable rows={rows} editing={editing} onEdit={() => setEditing(true)} />
        </TabsContent>
        <TabsContent value="category">
          <RankTable
            rows={rows.filter((row) => row.distance === "21K")}
            editing={editing}
            onEdit={() => setEditing(true)}
          />
        </TabsContent>
        <TabsContent value="masters">
          <RankTable rows={masters} editing={editing} onEdit={() => setEditing(true)} />
        </TabsContent>
      </Tabs>
      {editing ? (
        <Card className="rounded-[1.5rem] border-warning/40">
          <CardHeader>
            <CardTitle>Edit row · BIB 1043</CardTitle>
            <CardDescription>
              Manual corrections are staged here; publish/correct audit reasons happen on O-28.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-4">
            <Input aria-label="Corrected chip time" defaultValue="02:17:58" />
            <Input aria-label="Correction note" defaultValue="15K split found" />
            <Select defaultValue="DNF">
              <SelectTrigger aria-label="Correct result status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="finished">finished</SelectItem>
                <SelectItem value="DNF">DNF</SelectItem>
                <SelectItem value="DNS">DNS</SelectItem>
                <SelectItem value="DQ">DQ</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => setEditing(false)}>Apply staged fix</Button>
          </CardContent>
        </Card>
      ) : null}
      <DemoUrls
        urls={[
          `/events/${demoEventId}/results/preview?demo=default`,
          `/events/${demoEventId}/results/preview?demo=validation-error`,
          `/events/${demoEventId}/results/preview?demo=success`,
        ]}
      />
    </Shell>
  );
}

function RankTable({
  rows,
  editing,
  onEdit,
}: {
  rows: ResultRow[];
  editing: boolean;
  onEdit: () => void;
}) {
  const columns = useMemo<DataTableColumn<ResultRow>[]>(
    () => [
      ...resultColumns,
      { id: "ageGrade", header: "Age-grade", accessor: "ageGrade" },
      {
        id: "edit",
        header: "Edit",
        cell: () => (
          <Button type="button" variant="outline" size="sm" onClick={onEdit}>
            {editing ? "Editing" : "Edit row"}
          </Button>
        ),
      },
    ],
    [editing, onEdit],
  );
  return (
    <DataTable
      data={rows}
      columns={columns}
      getRowId={(row) => row.id}
      compact={false}
      emptyState="No ranked rows for this tab."
    />
  );
}

export function ResultsPublishScreen({ eventId }: { eventId: string }) {
  const event = useCurrentEvent(eventId);
  const { demo } = RouteShellState();
  const { resultsUploadDrafts, updateResultsUploadDraft } = useMockStore();
  const draft = resultsUploadDrafts[event.id];
  const isPublished =
    demo === "success" || demo === "webhook-pending" || draft?.publishStatus === "published";
  const [correction, setCorrection] = useState(demo === "validation-error");
  const disabled = demo === "permission-denied";
  return (
    <Shell
      eventId={event.id}
      step="publish"
      eyebrow="O-28 Publish"
      title="Go-live controls"
      description="Publish, unpublish, and correct results only with an audit reason."
      actions={
        <Button asChild variant="outline">
          <a href={`/events/${event.id}/certificates/template`}>Configure certificates</a>
        </Button>
      }
    >
      <DemoNotice demo={demo} />
      <Alert
        className={
          isPublished ? "border-success/40 bg-success/5" : "border-warning/40 bg-warning/5"
        }
      >
        <span aria-hidden="true">{isPublished ? "✓" : "!"}</span>
        <AlertTitle>{isPublished ? "Results are LIVE" : "Results are in draft"}</AlertTitle>
        <AlertDescription>
          {isPublished
            ? "Participants can see finish times and certificate generation may run."
            : "Publish is blocked until an organizer provides an audit reason."}
        </AlertDescription>
      </Alert>
      <div className="grid gap-6 xl:grid-cols-[1fr_24rem]">
        <Card className="rounded-[1.5rem]">
          <CardHeader>
            <CardTitle>Actions requiring reason</CardTitle>
            <CardDescription>
              ConfirmDialog enforces a required audit reason for sensitive actions.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <ConfirmDialog
              requireReason
              title="Publish results?"
              description="This will make results visible to participants."
              confirmLabel="Publish results"
              reasonPlaceholder="Example: Validation complete after timing desk review"
              trigger={<Button disabled={disabled}>Publish</Button>}
              onConfirm={(reason) =>
                updateResultsUploadDraft(event.id, {
                  publishStatus: "published",
                  validationErrors: reason ? [`Published: ${reason}`] : [],
                })
              }
            />
            <ConfirmDialog
              requireReason
              destructive
              title="Unpublish results?"
              description="Participants will temporarily lose access to result and certificate links."
              confirmLabel="Unpublish"
              reasonPlaceholder="Example: Timing vendor sent corrected 21K chip file"
              trigger={
                <Button variant="destructive" disabled={disabled || !isPublished}>
                  Unpublish
                </Button>
              }
              onConfirm={(reason) =>
                updateResultsUploadDraft(event.id, {
                  publishStatus: "validated",
                  validationErrors: reason ? [`Unpublished: ${reason}`] : [],
                })
              }
            />
            <ConfirmDialog
              requireReason
              title="Apply correction?"
              description="Manual corrections are recorded in audit history before re-publish."
              confirmLabel="Correct result"
              reasonPlaceholder="Example: BIB 1043 split manually verified"
              trigger={
                <Button variant="outline" disabled={disabled}>
                  Manual correction
                </Button>
              }
              onConfirm={() => setCorrection(true)}
            />
          </CardContent>
        </Card>
        <Card className="rounded-[1.5rem]">
          <CardHeader>
            <CardTitle>Publish summary</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <StatusBadge
              status={isPublished ? "ok" : "pending"}
              label={isPublished ? "Live" : "Draft"}
            />
            <p className="text-sm text-muted-foreground">
              Last reviewed by Priya Raman · CODISSIA timing desk · 12 Jul 2026, 10:44 AM
            </p>
            <Button asChild variant="outline">
              <a href={`/events/${event.id}/certificates/status`}>View certificate status</a>
            </Button>
          </CardContent>
        </Card>
      </div>
      <Card className="rounded-[1.5rem]">
        <CardHeader>
          <CardTitle>Correction / audit history</CardTitle>
          <CardDescription>
            Reasons are visible here and would link to A-06 audit in production.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-3 text-sm">
            <li className="rounded-2xl border p-4">
              <StatusBadge status="ok" label="Published" />{" "}
              <span className="ml-2">
                Validation complete after timing desk review · Priya Raman
              </span>
            </li>
            {correction ? (
              <li className="rounded-2xl border border-warning/40 bg-warning/5 p-4">
                <StatusBadge status="warning" label="Correction" />{" "}
                <span className="ml-2">BIB 1043 split manually verified; re-publish queued.</span>
              </li>
            ) : null}
            <li className="rounded-2xl border p-4">
              <StatusBadge status="info" label="Certificate link" />{" "}
              <span className="ml-2">Certificate status reads publish state before rendering.</span>
            </li>
          </ul>
        </CardContent>
      </Card>
      <DemoUrls
        urls={[
          `/events/${demoEventId}/results/publish?demo=default`,
          `/events/${demoEventId}/results/publish?demo=success`,
          `/events/${demoEventId}/results/publish?demo=validation-error`,
          `/events/${demoEventId}/results/publish?demo=permission-denied`,
        ]}
      />
    </Shell>
  );
}

export function CertificateTemplateScreen({ eventId }: { eventId: string }) {
  const event = useCurrentEvent(eventId);
  const { demo } = RouteShellState();
  const [brand, setBrand] = useState("#ff5a00");
  const invalid = demo === "validation-error";
  return (
    <Shell
      eventId={event.id}
      eyebrow="O-29 Certificates"
      title="Fixed certificate template"
      description="Configure the polished MVP template: logo, organizer name, sponsor strip, colour, signature, and text fields."
      actions={
        <Button asChild>
          <a href={`/events/${event.id}/certificates/status`}>Generate certificates</a>
        </Button>
      }
    >
      <DemoNotice demo={demo} />
      {invalid ? (
        <Alert className="border-danger/40 bg-danger/5 text-danger-text">
          <span aria-hidden="true">✕</span>
          <AlertTitle>Required asset missing</AlertTitle>
          <AlertDescription>
            Upload a signature image or enter signatory text before saving the certificate template.
          </AlertDescription>
        </Alert>
      ) : null}
      <div className="grid gap-6 xl:grid-cols-[25rem_1fr]">
        <Card className="rounded-[1.5rem]">
          <CardHeader>
            <CardTitle>Template controls</CardTitle>
            <CardDescription>Freeform layout is deferred until after pilot.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Field id="event-logo" label="Event logo" type="file" />
            <Field id="organizer" label="Organizer name" defaultValue="Kovai Road Runners" />
            <Field
              id="sponsors"
              label="Sponsor strip"
              defaultValue="CODISSIA · PSG Hospitals · Kovai Sports"
            />
            <div className="grid gap-2">
              <Label htmlFor="brand-color">Certificate colour</Label>
              <Input
                id="brand-color"
                type="color"
                value={brand}
                onChange={(e) => setBrand(e.currentTarget.value)}
              />
            </div>
            <Field
              id="signature"
              label="Signature image"
              type="file"
              error={invalid ? "Signature required for this demo state." : undefined}
            />
            <div className="grid gap-2">
              <Label htmlFor="cert-text">Certificate text</Label>
              <Textarea
                id="cert-text"
                defaultValue="This certifies that {name} completed the {distance} at Coimbatore Marathon 2026."
                rows={4}
              />
            </div>
            <Button>Save template</Button>
          </CardContent>
        </Card>
        <Card className="overflow-hidden rounded-[1.5rem]">
          <CardHeader>
            <CardTitle>Live preview</CardTitle>
            <CardDescription>Preview for BIB 1042 · Ananya Krishnan · 21K.</CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className="relative min-h-[31rem] overflow-hidden rounded-[2rem] border bg-[#fffaf0] p-10 text-center shadow-inner"
              role="img"
              aria-label="Certificate preview for Ananya Krishnan, BIB 1042"
            >
              <div className="absolute inset-x-0 top-0 h-3" style={{ backgroundColor: brand }} />
              <p className="text-xs font-bold uppercase tracking-[0.35em] text-muted-foreground">
                Coimbatore Marathon 2026
              </p>
              <h2
                className="mt-8 font-display text-6xl font-black uppercase"
                style={{ color: brand }}
              >
                Certificate
              </h2>
              <p className="mt-3 text-lg text-muted-foreground">of achievement</p>
              <div className="mx-auto mt-8 h-px w-64" style={{ backgroundColor: brand }} />
              <p className="mt-8 text-sm uppercase tracking-[0.2em] text-muted-foreground">
                Presented to
              </p>
              <p className="mt-3 font-display text-5xl font-black uppercase">Ananya Krishnan</p>
              <p className="mx-auto mt-5 max-w-2xl text-lg leading-8">
                For completing the 21K Half Marathon at CODISSIA Trade Fair Complex with net time{" "}
                <strong>01:51:49</strong>.
              </p>
              <div className="mt-10 flex items-end justify-between text-left text-sm">
                <div>
                  <p className="font-semibold">Organizer</p>
                  <p>Kovai Road Runners</p>
                </div>
                <div className="text-center">
                  <div className="mb-2 h-10 w-44 border-b" />
                  <p>Race Director signature</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">Certificate ID</p>
                  <p>CMB-2026-1042</p>
                </div>
              </div>
              <p className="absolute bottom-4 left-0 right-0 text-xs text-muted-foreground">
                Sponsor strip · CODISSIA · PSG Hospitals · Kovai Sports
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
      <DemoUrls
        urls={[
          `/events/${demoEventId}/certificates/template?demo=default`,
          `/events/${demoEventId}/certificates/template?demo=validation-error`,
          `/events/${demoEventId}/certificates/template?demo=success`,
        ]}
      />
    </Shell>
  );
}

function Field({
  id,
  label,
  type = "text",
  defaultValue,
  error,
}: {
  id: string;
  label: string;
  type?: string;
  defaultValue?: string;
  error?: string;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type={type} defaultValue={defaultValue} aria-invalid={Boolean(error)} />
      {error ? <p className="text-sm text-danger-text">{error}</p> : null}
    </div>
  );
}

export function CertificateStatusScreen({ eventId }: { eventId: string }) {
  const event = useCurrentEvent(eventId);
  const { demo } = RouteShellState();
  const rows = certRows(demo);
  const done = rows.filter((row) => row.status === "generated" || row.status === "sent").length;
  const failed = rows.filter((row) => row.status === "failed" || row.status === "held").length;
  const percent = demo === "success" ? 100 : Math.round((done / rows.length) * 100);
  const columns: DataTableColumn<CertRow>[] = [
    { id: "bib", header: "BIB", accessor: "bib", className: "font-medium" },
    { id: "name", header: "Runner", accessor: "name" },
    { id: "distance", header: "Distance", accessor: "distance" },
    { id: "status", header: "Status", cell: (row) => certBadge(row.status) },
    { id: "reason", header: "Error / note", cell: (row) => row.reason ?? "—" },
  ];
  return (
    <Shell
      eventId={event.id}
      eyebrow="O-30 Certificates"
      title="Generation status"
      description="Track batch PDF rendering progress, per-row errors, and retry only failed certificates."
      actions={
        <>
          <Button asChild variant="outline">
            <a href={`/events/${event.id}/results/publish`}>Check publish state</a>
          </Button>
          <Button disabled={failed === 0}>Retry failed</Button>
        </>
      }
    >
      <DemoNotice demo={demo} />
      {demo === "validation-error" ? (
        <Alert className="border-danger/40 bg-danger/5 text-danger-text">
          <span aria-hidden="true">✕</span>
          <AlertTitle>Certificate render errors need review</AlertTitle>
          <AlertDescription>
            Missing audit reasons and ineligible result statuses are holding the failed certificate
            rows.
          </AlertDescription>
        </Alert>
      ) : null}
      <Card className="rounded-[1.5rem]">
        <CardHeader>
          <CardTitle>
            {demo === "success" ? "642 certificates completed" : "Generating 642 certificates…"}
          </CardTitle>
          <CardDescription>
            {done} done · {failed} failed · no network calls in this demo.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <Progress value={percent} aria-label={`${percent}% certificates generated`} />
          <div className="grid gap-4 md:grid-cols-4">
            <StatCard label="Progress" value={`${percent}%`} note="Batch render" />
            <StatCard label="Generated" value={String(done)} note="Ready or sent" tone="success" />
            <StatCard
              label="Failed / held"
              value={String(failed)}
              note="Retry needed"
              tone={failed ? "danger" : "success"}
            />
            <StatCard label="Published?" value="Live" note="Linked to O-28" tone="success" />
          </div>
        </CardContent>
      </Card>
      <DataTable
        data={rows}
        columns={columns}
        getRowId={(row) => row.id}
        compact={false}
        emptyState="No certificate rows."
      />
      <DemoUrls
        urls={[
          `/events/${demoEventId}/certificates/status?demo=default`,
          `/events/${demoEventId}/certificates/status?demo=success`,
          `/events/${demoEventId}/certificates/status?demo=webhook-pending`,
          `/events/${demoEventId}/certificates/status?demo=validation-error`,
        ]}
      />
    </Shell>
  );
}

function certRows(demo: DemoState): CertRow[] {
  const base: CertRow[] = [
    { id: "cert-1042", bib: "1042", name: "Ananya Krishnan", distance: "21K", status: "sent" },
    {
      id: "cert-1043",
      bib: "1043",
      name: "Mohammed Faisal",
      distance: "21K",
      status: "held",
      reason: "DNF row is not eligible for certificate.",
    },
    { id: "cert-2188", bib: "2188", name: "Karthik Narayanan", distance: "10K", status: "queued" },
    {
      id: "cert-3104",
      bib: "3104",
      name: "Divya Senthil",
      distance: "5K",
      status: "failed",
      reason: "DQ audit reason required before rendering.",
    },
  ];
  if (demo === "success")
    return base.map((row) =>
      row.status === "held" ? row : { ...row, status: "generated", reason: undefined },
    );
  if (demo === "webhook-pending")
    return base.map((row, index) =>
      index > 1 ? { ...row, status: "rendering", reason: undefined } : row,
    );
  if (demo === "validation-error")
    return base.map((row) =>
      row.status === "queued"
        ? { ...row, status: "failed", reason: "Missing finisher status after correction import." }
        : row,
    );
  return base;
}

function certBadge(status: CertRow["status"]) {
  const map: Record<CertRow["status"], { kind: StatusKind; label: string }> = {
    queued: { kind: "pending", label: "Queued" },
    rendering: { kind: "info", label: "Rendering" },
    generated: { kind: "ok", label: "Generated" },
    sent: { kind: "ok", label: "Sent" },
    failed: { kind: "error", label: "Failed" },
    held: { kind: "warning", label: "Held" },
  };
  return <StatusBadge status={map[status].kind} label={map[status].label} />;
}

function RouteShellState() {
  const { demo } = useConsoleShell();
  return { demo };
}
