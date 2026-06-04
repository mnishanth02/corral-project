import { CloudOff, RefreshCw, ShieldAlert } from "lucide-react";
import type * as React from "react";

import { cn } from "../lib/utils";
import { Alert, AlertDescription, AlertTitle } from "./alert";

export type DegradedBannerMode = "offline" | "degraded" | "manual-backup";

export type DegradedBannerProps = Omit<React.ComponentProps<typeof Alert>, "title"> & {
  mode?: DegradedBannerMode;
  title?: React.ReactNode;
  description?: React.ReactNode;
  retryAction?: React.ReactNode;
  manualBackupAction?: React.ReactNode;
};

const modeDefaults: Record<DegradedBannerMode, { title: string; description: string }> = {
  offline: {
    title: "You are offline",
    description: "Some updates may be delayed until the connection is restored.",
  },
  degraded: {
    title: "Service is degraded",
    description: "Live updates may be slower than usual. Keep manual checks ready.",
  },
  "manual-backup": {
    title: "Manual backup mode",
    description: "Use the backup workflow while automated processing catches up.",
  },
};

function DegradedBanner({
  mode = "degraded",
  title,
  description,
  retryAction,
  manualBackupAction,
  className,
  ...props
}: DegradedBannerProps) {
  const Icon = mode === "offline" ? CloudOff : ShieldAlert;
  const showActions = retryAction || manualBackupAction;

  return (
    <Alert
      data-slot="degraded-banner"
      aria-live="polite"
      className={cn("border-warning/40 bg-warning/10 text-warning-text", className)}
      {...props}
    >
      <Icon aria-hidden="true" />
      <AlertTitle>{title ?? modeDefaults[mode].title}</AlertTitle>
      <AlertDescription className="text-warning-text/90">
        <span>{description ?? modeDefaults[mode].description}</span>
        {showActions && (
          <span className="mt-2 flex flex-wrap gap-2 text-foreground">
            {retryAction && (
              <span className="inline-flex items-center gap-1.5">
                <RefreshCw className="size-3.5" aria-hidden="true" />
                {retryAction}
              </span>
            )}
            {manualBackupAction}
          </span>
        )}
      </AlertDescription>
    </Alert>
  );
}

export { DegradedBanner };
