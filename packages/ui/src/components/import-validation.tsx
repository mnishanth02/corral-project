import { AlertTriangle, CheckCircle2, CircleAlert } from "lucide-react";
import type * as React from "react";

import { cn } from "../lib/utils";
import { DataTable, type DataTableColumn } from "./data-table";
import { StatusBadge, type StatusKind } from "./status-badge";

export type ImportValidationSeverity = "valid" | "warning" | "error";

export type ImportValidationIssue<TRow = unknown> = {
  id: string;
  rowNumber: number;
  severity: Exclude<ImportValidationSeverity, "valid">;
  message: React.ReactNode;
  field?: React.ReactNode;
  row?: TRow;
};

export type ImportValidationSummary = {
  validRows: number;
  warningRows: number;
  errorRows: number;
  totalRows?: number;
};

export type ImportValidationProps<TRow = unknown> = React.ComponentProps<"section"> & {
  title?: React.ReactNode;
  description?: React.ReactNode;
  summary: ImportValidationSummary;
  issues: ImportValidationIssue<TRow>[];
  getIssueId?: (issue: ImportValidationIssue<TRow>, index: number) => string;
  issueColumns?: DataTableColumn<ImportValidationIssue<TRow>>[];
  columnMapping?: React.ReactNode;
  actions?: React.ReactNode;
  emptyState?: React.ReactNode;
  loading?: boolean;
};

const severityLabel: Record<ImportValidationIssue["severity"], string> = {
  warning: "Warning",
  error: "Error",
};

const severityStatus: Record<ImportValidationIssue["severity"], StatusKind> = {
  warning: "warning",
  error: "error",
};

function SummaryTile({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  tone: "success" | "warning" | "danger";
}) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <span
          className={cn(
            "flex size-7 items-center justify-center rounded-full border",
            tone === "success" && "border-success/30 bg-success/10 text-success-text",
            tone === "warning" && "border-warning/30 bg-warning/10 text-warning-text",
            tone === "danger" && "border-danger/30 bg-danger/10 text-danger-text",
          )}
          aria-hidden="true"
        >
          {icon}
        </span>
        <span>{label}</span>
      </div>
      <div className="mt-2 font-semibold text-2xl">{value}</div>
    </div>
  );
}

function defaultIssueColumns<TRow>(): DataTableColumn<ImportValidationIssue<TRow>>[] {
  return [
    {
      id: "row",
      header: "Row",
      cell: (issue) => issue.rowNumber,
      className: "w-20 font-medium",
    },
    {
      id: "severity",
      header: "Status",
      cell: (issue) => (
        <StatusBadge
          status={severityStatus[issue.severity]}
          label={severityLabel[issue.severity]}
        />
      ),
      className: "w-32",
    },
    {
      id: "field",
      header: "Column",
      cell: (issue) => issue.field ?? "—",
      className: "w-40 text-muted-foreground",
    },
    {
      id: "message",
      header: "Message",
      cell: (issue) => issue.message,
      className: "min-w-72 whitespace-normal",
    },
  ];
}

function ImportValidation<TRow = unknown>({
  title = "Import validation",
  description,
  summary,
  issues,
  getIssueId = (issue) => issue.id,
  issueColumns,
  columnMapping,
  actions,
  emptyState = "No row-level warnings or errors found.",
  loading = false,
  className,
  ...props
}: ImportValidationProps<TRow>) {
  const columns = issueColumns ?? defaultIssueColumns<TRow>();
  const totalRows =
    summary.totalRows ?? summary.validRows + summary.warningRows + summary.errorRows;

  return (
    <section
      data-slot="import-validation"
      className={cn("space-y-5 rounded-xl border bg-card p-5", className)}
      {...props}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h2 className="font-semibold text-xl tracking-tight">{title}</h2>
          {description && <p className="text-muted-foreground text-sm">{description}</p>}
          <p className="text-muted-foreground text-sm" aria-live="polite">
            {totalRows} total rows checked.
          </p>
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <SummaryTile
          label="Valid rows"
          value={summary.validRows}
          tone="success"
          icon={<CheckCircle2 className="size-4" />}
        />
        <SummaryTile
          label="Warnings"
          value={summary.warningRows}
          tone="warning"
          icon={<AlertTriangle className="size-4" />}
        />
        <SummaryTile
          label="Errors"
          value={summary.errorRows}
          tone="danger"
          icon={<CircleAlert className="size-4" />}
        />
      </div>

      {columnMapping && (
        <div
          data-slot="import-validation-column-mapping"
          className="rounded-lg border bg-muted/30 p-4"
        >
          {columnMapping}
        </div>
      )}

      <div data-slot="import-validation-issues" className="space-y-2">
        <h3 className="font-medium">Row issues</h3>
        <DataTable
          data={issues}
          columns={columns}
          getRowId={getIssueId}
          loading={loading}
          emptyState={emptyState}
          compact={false}
        />
      </div>
    </section>
  );
}

export { ImportValidation };
