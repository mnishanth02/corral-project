import type * as React from "react";

import { cn } from "../lib/utils";

export type EmptyStateProps = React.ComponentProps<"section"> & {
  icon?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
};

function EmptyState({ icon, title, description, action, className, ...props }: EmptyStateProps) {
  return (
    <section
      data-slot="empty-state"
      aria-live="polite"
      className={cn(
        "flex min-h-48 flex-col items-center justify-center rounded-xl border border-dashed bg-card px-6 py-10 text-center text-card-foreground",
        className,
      )}
      {...props}
    >
      {icon && (
        <div
          data-slot="empty-state-icon"
          className="mb-4 flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground [&_svg]:size-6"
          aria-hidden="true"
        >
          {icon}
        </div>
      )}
      <div data-slot="empty-state-title" className="max-w-md font-semibold text-lg leading-tight">
        {title}
      </div>
      {description && (
        <div
          data-slot="empty-state-description"
          className="mt-2 max-w-md text-muted-foreground text-sm"
        >
          {description}
        </div>
      )}
      {action && (
        <div
          data-slot="empty-state-action"
          className="mt-5 flex flex-wrap items-center justify-center gap-2"
        >
          {action}
        </div>
      )}
    </section>
  );
}

export { EmptyState };
