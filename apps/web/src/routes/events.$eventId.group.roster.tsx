import { Alert, AlertDescription, AlertTitle } from "@corral/ui/components/alert";
import { Badge } from "@corral/ui/components/badge";
import { Button } from "@corral/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@corral/ui/components/card";
import { DataTable, type DataTableColumn } from "@corral/ui/components/data-table";
import { ImportValidation } from "@corral/ui/components/import-validation";
import { Separator } from "@corral/ui/components/separator";
import { CardSkeleton, TableSkeleton } from "@corral/ui/components/skeletons";
import { StatusBadge } from "@corral/ui/components/status-badge";
import { createFileRoute, Link, useParams, useSearch } from "@tanstack/react-router";
import { useMemo } from "react";

import { useStickyCta } from "../components/sticky-cta";
import { formatINR } from "../mocks/utils";
import {
  calculateTotals,
  currentDemo,
  draftForDemo,
  type RunnerDraft,
  runnerIssueCount,
  statusLabel,
  validateGroupSearch,
} from "./-group-registration-data";

export const Route = createFileRoute("/events/$eventId/group/roster")({
  validateSearch: validateGroupSearch,
  component: GroupRosterScreen,
});

function GroupRosterScreen() {
  const { eventId } = useParams({ from: "/events/$eventId/group/roster" });
  const search = useSearch({ from: "/events/$eventId/group/roster" });
  const demo = currentDemo(search);
  const draft = useMemo(() => draftForDemo(demo), [demo]);
  const totals = calculateTotals(draft);
  const counts = runnerIssueCount(draft.runners);
  const canPay = draft.runners.length > 0 && counts.error === 0 && demo !== "validation-error";
  const issues = draft.runners.flatMap((runner, index) =>
    runner.issues.map((issue, issueIndex) => ({
      id: `${runner.id}-${issueIndex}`,
      rowNumber: index + 1,
      severity: runner.status === "error" ? ("error" as const) : ("warning" as const),
      field: issue.toLowerCase().includes("mobile") ? "Mobile" : "Consent",
      message: issue,
      row: runner,
    })),
  );

  const cta = useMemo(
    () => (
      <div className="space-y-2" aria-live="polite">
        <div className="flex items-center justify-between text-sm">
          <span className="font-bold text-brand-navy">Pay {formatINR(totals.total)}</span>
          <span className={canPay ? "text-success-text" : "text-danger-text"}>
            {canPay
              ? "All rows payment-ready"
              : `Fix ${counts.error} runner${counts.error === 1 ? "" : "s"}`}
          </span>
        </div>
        <Button
          asChild
          disabled={!canPay}
          className="h-12 w-full rounded-2xl text-base shadow-lg shadow-orange-500/20"
        >
          <Link
            to="/events/$eventId/group/payment"
            params={{ eventId }}
            search={{ demo: demo === "default" ? undefined : demo }}
          >
            Proceed to payment
          </Link>
        </Button>
      </div>
    ),
    [canPay, counts.error, demo, eventId, totals.total],
  );

  useStickyCta(cta);

  if (demo === "loading") {
    return <LoadingRoster />;
  }

  const columns: DataTableColumn<RunnerDraft>[] = [
    {
      id: "name",
      header: "Runner",
      cell: (row) => (
        <div>
          <p className="font-bold text-brand-navy">{row.name || "Unnamed runner"}</p>
          <p className="text-xs text-muted-foreground">{row.mobile}</p>
        </div>
      ),
      className: "min-w-44",
    },
    { id: "category", header: "Category", cell: (row) => `${row.distance} · ${row.tshirtSize}` },
    { id: "fee", header: "Fee", cell: (row) => formatINR(row.fee) },
    {
      id: "status",
      header: "Status",
      cell: (row) => (
        <StatusBadge
          status={row.status === "valid" ? "ok" : row.status === "warning" ? "warning" : "error"}
          label={statusLabel(row.status)}
        />
      ),
      className: "min-w-32",
    },
    {
      id: "edit",
      header: "Edit",
      cell: (row) => (
        <Button asChild variant="ghost" size="sm" className="min-h-11 rounded-xl">
          <Link
            to="/events/$eventId/group"
            params={{ eventId }}
            search={{
              runner: row.id,
              section: "runners",
              demo: demo === "default" ? undefined : demo,
            }}
            aria-label={`Edit ${row.name}`}
          >
            Edit
          </Link>
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden rounded-[2rem] border-orange-100 shadow-lg shadow-slate-950/5">
        <div className="bg-[radial-gradient(circle_at_top_left,var(--brand-tint),transparent_14rem)] p-5">
          <Badge variant={canPay ? "success" : "warning"}>
            {canPay ? "Payment gate passed" : "Validation gate"}
          </Badge>
          <h2 className="mt-3 font-display text-3xl font-black leading-none tracking-[-0.05em] text-brand-navy">
            Review your team ({draft.runners.length} runners)
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Validate every runner before paying once for Kongu Runners Club.
          </p>
          <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
            <SummaryTile label="Valid" value={counts.valid} tone="success" />
            <SummaryTile label="Warn" value={counts.warning} tone="warning" />
            <SummaryTile label="Fix" value={counts.error} tone="danger" />
          </dl>
        </div>
      </Card>

      {!canPay ? (
        <Alert variant="destructive" aria-live="assertive">
          <AlertTitle>Fix {counts.error} runners before payment</AlertTitle>
          <AlertDescription>
            Duplicate mobiles, invalid required fields, or missing consent block the group payment.
          </AlertDescription>
        </Alert>
      ) : (
        <Alert className="border-success/30 bg-success/10 text-success-text">
          <AlertTitle>All runners are valid</AlertTitle>
          <AlertDescription className="text-success-text/90">
            You can proceed to the single group payment and invoice preview.
          </AlertDescription>
        </Alert>
      )}

      <div className="md:hidden space-y-3">
        {draft.runners.map((runner) => (
          <article
            key={runner.id}
            className={`rounded-[1.5rem] border bg-white p-4 ${runner.status === "error" ? "border-danger/40" : "border-orange-100"}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-bold text-brand-navy">{runner.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {runner.distance} · Tee {runner.tshirtSize} · {formatINR(runner.fee)}
                </p>
              </div>
              <StatusBadge
                status={
                  runner.status === "valid"
                    ? "ok"
                    : runner.status === "warning"
                      ? "warning"
                      : "error"
                }
                label={statusLabel(runner.status)}
              />
            </div>
            {runner.issues.length > 0 ? (
              <p className="mt-3 text-sm text-danger-text">{runner.issues.join(" · ")}</p>
            ) : null}
            <Button asChild variant="outline" className="mt-3 min-h-11 w-full rounded-2xl">
              <Link
                to="/events/$eventId/group"
                params={{ eventId }}
                search={{
                  runner: runner.id,
                  section: "runners",
                  demo: demo === "default" ? undefined : demo,
                }}
              >
                Edit {runner.name}
              </Link>
            </Button>
          </article>
        ))}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <DataTable
          data={draft.runners}
          columns={columns}
          getRowId={(row) => row.id}
          compact={false}
          rowClassName={(row) => (row.status === "error" ? "bg-danger/5" : undefined)}
        />
      </div>

      <ImportValidation
        title="Roster validation"
        description="Warnings can be reviewed; errors must be fixed before payment."
        summary={{
          validRows: counts.valid,
          warningRows: counts.warning,
          errorRows: counts.error,
          totalRows: draft.runners.length,
        }}
        issues={issues}
        emptyState="No row-level warnings or errors found."
      />

      <TotalsCard totals={totals} runnerCount={draft.runners.length} />
    </div>
  );
}

function SummaryTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "success" | "warning" | "danger";
}) {
  return (
    <div className="rounded-2xl bg-white/80 p-3">
      <dt className="text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground">{label}</dt>
      <dd
        className={
          tone === "success"
            ? "mt-1 font-black text-success-text"
            : tone === "warning"
              ? "mt-1 font-black text-warning-text"
              : "mt-1 font-black text-danger-text"
        }
      >
        {value}
      </dd>
    </div>
  );
}

function TotalsCard({
  totals,
  runnerCount,
}: {
  totals: ReturnType<typeof calculateTotals>;
  runnerCount: number;
}) {
  return (
    <Card className="rounded-[2rem] border-orange-100 shadow-lg shadow-slate-950/5">
      <CardHeader>
        <CardTitle className="font-display text-2xl tracking-[-0.04em] text-brand-navy">
          Payment totals
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <AmountRow label="Subtotal" value={totals.subtotal} />
        <AmountRow label="Early bird" value={-totals.earlyBird} tone="success" />
        <AmountRow label="Coupon CLUB10" value={-totals.coupon} tone="success" />
        <Separator />
        <p className="rounded-2xl bg-secondary p-3 text-muted-foreground">
          GST included as applicable. Convenience fee absorbed by the organizer.
        </p>
        <AmountRow label={`Pay for ${runnerCount} runners`} value={totals.total} strong />
      </CardContent>
    </Card>
  );
}

function AmountRow({
  label,
  value,
  strong,
  tone,
}: {
  label: string;
  value: number;
  strong?: boolean;
  tone?: "success";
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className={strong ? "font-bold text-brand-navy" : "text-muted-foreground"}>
        {label}
      </span>
      <span
        className={
          strong
            ? "font-display text-2xl font-black text-brand-navy"
            : tone === "success"
              ? "font-bold text-success-text"
              : "font-bold text-brand-navy"
        }
      >
        {formatINR(value)}
      </span>
    </div>
  );
}

function LoadingRoster() {
  return (
    <div className="space-y-4" role="status" aria-label="Loading group roster">
      <CardSkeleton />
      <TableSkeleton />
    </div>
  );
}
