import { Clock3, RefreshCw } from "lucide-react";
import type * as React from "react";

import { cn } from "../lib/utils";
import { Alert, AlertDescription, AlertTitle } from "./alert";
import { StatusBadge, type StatusKind } from "./status-badge";

export type ReconciliationStatus = "pending" | "queued" | "processing" | "reconciling" | "synced";

export function getReconciliationStatusBadge(status: ReconciliationStatus) {
  const isPending = status !== "synced";
  const labels: Record<ReconciliationStatus, string> = {
    pending: "Pending",
    queued: "Queued",
    processing: "Processing",
    reconciling: "Reconciling",
    synced: "Synced",
  };

  const badgeStatus: StatusKind = isPending ? "pending" : "info";

  return {
    status: badgeStatus,
    label: labels[status],
  };
}

export type ReconciliationStatusBadgeProps = {
  status: ReconciliationStatus;
  label?: string;
  className?: string;
};

function ReconciliationStatusBadge({ status, label, className }: ReconciliationStatusBadgeProps) {
  const badge = getReconciliationStatusBadge(status);

  return <StatusBadge status={badge.status} label={label ?? badge.label} className={className} />;
}

export type PendingBannerProps = Omit<React.ComponentProps<typeof Alert>, "title"> & {
  status?: ReconciliationStatus;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
};

function PendingBanner({
  status = "pending",
  title = "Reconciliation pending",
  description = "Webhook and reconciliation updates are still being processed. Refresh or continue once the status changes.",
  action,
  className,
  ...props
}: PendingBannerProps) {
  return (
    <Alert
      data-slot="pending-banner"
      aria-live="polite"
      className={cn("border-info/40 bg-info/10 text-info-text", className)}
      {...props}
    >
      <Clock3 aria-hidden="true" />
      <AlertTitle className="flex flex-wrap items-center gap-2">
        <span>{title}</span>
        <ReconciliationStatusBadge status={status} />
      </AlertTitle>
      <AlertDescription className="text-info-text/90">
        <span>{description}</span>
        {action && (
          <span className="mt-2 inline-flex items-center gap-1.5 text-foreground">
            <RefreshCw className="size-3.5" aria-hidden="true" />
            {action}
          </span>
        )}
      </AlertDescription>
    </Alert>
  );
}

export { PendingBanner, ReconciliationStatusBadge };
