import { AlertTriangle, CheckCircle2, Clock, Info, MinusCircle, XCircle } from "lucide-react";
import type * as React from "react";

import { cn } from "../lib/utils";

export type StatusKind = "ok" | "error" | "warning" | "info" | "pending" | "neutral";

const ICONS: Record<StatusKind, React.ComponentType<{ className?: string }>> = {
  ok: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
  pending: Clock,
  neutral: MinusCircle,
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
        status === "info" && "border-info/30 bg-info/10 text-info-text",
        status === "pending" && "border-warning/30 bg-warning/10 text-warning-text",
        status === "neutral" && "border-muted bg-muted/70 text-muted-foreground",
        className,
      )}
    >
      <Icon className="size-3.5" aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}
