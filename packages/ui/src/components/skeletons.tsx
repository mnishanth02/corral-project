import type * as React from "react";

import { cn } from "../lib/utils";
import { Skeleton } from "./skeleton";

export type SkeletonPresetProps = React.ComponentProps<"div">;

const tableColumns = ["name", "category", "status", "action"] as const;
const tableRows = ["first", "second", "third", "fourth", "fifth"] as const;
const formFields = ["name", "email", "phone", "category"] as const;
const listRows = ["alpha", "bravo", "charlie", "delta", "echo"] as const;

function TableSkeleton({ className, ...props }: SkeletonPresetProps) {
  return (
    <div
      data-slot="table-skeleton"
      className={cn("rounded-lg border bg-card", className)}
      {...props}
    >
      <div className="grid grid-cols-4 gap-4 border-b bg-muted/50 p-4">
        {tableColumns.map((column) => (
          <Skeleton key={`table-head-${column}`} className="h-4 w-full" />
        ))}
      </div>
      <div className="divide-y">
        {tableRows.map((row) => (
          <div key={`table-row-${row}`} className="grid grid-cols-4 gap-4 p-4">
            {tableColumns.map((column) => (
              <Skeleton key={`table-cell-${row}-${column}`} className="h-4 w-full" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function CardSkeleton({ className, ...props }: SkeletonPresetProps) {
  return (
    <div
      data-slot="card-skeleton"
      className={cn("space-y-5 rounded-xl border bg-card p-6", className)}
      {...props}
    >
      <div className="flex items-start gap-4">
        <Skeleton className="size-12 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-11/12" />
        <Skeleton className="h-4 w-3/5" />
      </div>
      <Skeleton className="h-9 w-32" />
    </div>
  );
}

function FormSkeleton({ className, ...props }: SkeletonPresetProps) {
  return (
    <div data-slot="form-skeleton" className={cn("space-y-5", className)} {...props}>
      {formFields.map((field) => (
        <div key={`form-field-${field}`} className="space-y-2">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-3 w-2/5" />
        </div>
      ))}
      <div className="flex justify-end gap-2 pt-2">
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-9 w-28" />
      </div>
    </div>
  );
}

function ListSkeleton({ className, ...props }: SkeletonPresetProps) {
  return (
    <div data-slot="list-skeleton" className={cn("space-y-3", className)} {...props}>
      {listRows.map((row) => (
        <div
          key={`list-row-${row}`}
          className="flex items-center gap-3 rounded-lg border bg-card p-3"
        >
          <Skeleton className="size-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-6 w-16" />
        </div>
      ))}
    </div>
  );
}

export { CardSkeleton, FormSkeleton, ListSkeleton, TableSkeleton };
