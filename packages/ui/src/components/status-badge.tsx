import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import type * as React from "react";

import { cn } from "../lib/utils";

export type StatusKind = "ok" | "error" | "warning";

const ICONS: Record<StatusKind, React.ComponentType<{ className?: string }>> = {
  ok: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
};

/**
 * Status indicator that NEVER encodes state by color alone — it always pairs the
 * semantic color with an icon AND a text label (design-system CVD safety rule).
 */
export function StatusBadge({
  status,
  label,
  className,
}: {
  status: StatusKind;
  label: string;
  className?: string;
}) {
  const Icon = ICONS[status];

  return (
    <span
      role="status"
      data-status={status}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium",
        status === "ok" && "border-success/30 bg-success/10 text-success-text",
        status === "warning" && "border-warning/30 bg-warning/10 text-warning-text",
        status === "error" && "border-danger/30 bg-danger/10 text-danger-text",
        className,
      )}
    >
      <Icon className="size-3.5" aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}
