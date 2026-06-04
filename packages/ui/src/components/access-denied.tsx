import { LockKeyhole } from "lucide-react";
import type * as React from "react";

import { cn } from "../lib/utils";

export type AccessDeniedProps = React.ComponentProps<"section"> & {
  title?: React.ReactNode;
  description?: React.ReactNode;
  roleContext?: React.ReactNode;
  actions?: React.ReactNode;
};

function AccessDenied({
  title = "Access denied",
  description = "You do not have permission to view this area.",
  roleContext,
  actions,
  className,
  ...props
}: AccessDeniedProps) {
  return (
    <section
      data-slot="access-denied"
      role="status"
      className={cn(
        "rounded-xl border bg-card p-6 text-card-foreground shadow-sm sm:p-8",
        className,
      )}
      {...props}
    >
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
        <div
          className="flex size-12 shrink-0 items-center justify-center rounded-full border border-danger/30 bg-danger/10 text-danger-text"
          aria-hidden="true"
        >
          <LockKeyhole className="size-6" />
        </div>
        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <h2 className="font-semibold text-xl tracking-tight">{title}</h2>
            <p className="mt-2 text-muted-foreground text-sm leading-relaxed">{description}</p>
          </div>
          {roleContext && (
            <div className="rounded-lg border bg-muted/50 px-3 py-2 text-sm">
              <span className="font-medium">Role context: </span>
              <span className="text-muted-foreground">{roleContext}</span>
            </div>
          )}
          {actions && <div className="flex flex-wrap gap-2 pt-1">{actions}</div>}
        </div>
      </div>
    </section>
  );
}

export { AccessDenied };
