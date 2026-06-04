"use client";

import { ArrowDownIcon, ArrowUpDownIcon, ArrowUpIcon } from "lucide-react";
import * as React from "react";
import { cn } from "../lib/utils";
import { Button } from "./button";
import { Checkbox } from "./checkbox";
import { Skeleton } from "./skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./table";

export type DataTableSortDirection = "asc" | "desc" | false;

export type DataTableColumn<TData> = {
  id: string;
  header: React.ReactNode;
  accessor?: keyof TData | ((row: TData) => React.ReactNode);
  cell?: (row: TData, rowIndex: number) => React.ReactNode;
  className?: string;
  headerClassName?: string;
  sortable?: boolean;
  sortDirection?: DataTableSortDirection;
  onSort?: (column: DataTableColumn<TData>) => void;
};

type DataTableBulkSelect<TData> = {
  allSelected: boolean;
  someSelected?: boolean;
  onToggleAll: (checked: boolean) => void;
  getRowSelected: (row: TData, rowIndex: number) => boolean;
  onToggleRow: (row: TData, rowIndex: number, checked: boolean) => void;
  getRowDisabled?: (row: TData, rowIndex: number) => boolean;
  label?: string;
};

export type DataTableProps<TData> = {
  data: TData[];
  columns: DataTableColumn<TData>[];
  getRowId: (row: TData, rowIndex: number) => string;
  bulkSelect?: DataTableBulkSelect<TData>;
  loading?: boolean;
  emptyState?: React.ReactNode;
  filteredEmptyState?: React.ReactNode;
  isFiltered?: boolean;
  loadingRows?: number;
  compact?: boolean;
  className?: string;
  rowClassName?: (row: TData, rowIndex: number) => string | undefined;
  onRowClick?: (row: TData, rowIndex: number) => void;
};

function getCellValue<TData>(row: TData, column: DataTableColumn<TData>, rowIndex: number) {
  if (column.cell) {
    return column.cell(row, rowIndex);
  }

  if (typeof column.accessor === "function") {
    return column.accessor(row);
  }

  if (column.accessor) {
    return row[column.accessor] as React.ReactNode;
  }

  return null;
}

function SortIcon({ direction }: { direction: DataTableSortDirection }) {
  if (direction === "asc") {
    return <ArrowUpIcon data-icon="inline-end" />;
  }

  if (direction === "desc") {
    return <ArrowDownIcon data-icon="inline-end" />;
  }

  return <ArrowUpDownIcon data-icon="inline-end" />;
}

function DataTable<TData>({
  data,
  columns,
  getRowId,
  bulkSelect,
  loading,
  emptyState = "No rows to display.",
  filteredEmptyState = "No rows match the current filters.",
  isFiltered,
  loadingRows = 5,
  compact = true,
  className,
  rowClassName,
  onRowClick,
}: DataTableProps<TData>) {
  const colSpan = columns.length + (bulkSelect ? 1 : 0);
  const isEmpty = !loading && data.length === 0;
  const loadingRowIds = React.useMemo(
    () => Array.from({ length: loadingRows }, (_, rowIndex) => `loading-row-${rowIndex}`),
    [loadingRows],
  );

  return (
    <div
      data-slot="data-table"
      className={cn("overflow-hidden rounded-lg border bg-card", className)}
    >
      <Table>
        <TableHeader className="sticky top-0 z-10 bg-muted/80 backdrop-blur">
          <TableRow>
            {bulkSelect && (
              <TableHead className="w-10">
                <Checkbox
                  aria-label={bulkSelect.label ?? "Select all rows"}
                  checked={
                    bulkSelect.allSelected || (bulkSelect.someSelected ? "indeterminate" : false)
                  }
                  onCheckedChange={(checked) => bulkSelect.onToggleAll(checked === true)}
                />
              </TableHead>
            )}
            {columns.map((column) => (
              <TableHead key={column.id} className={column.headerClassName}>
                {column.sortable ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="-ml-2 h-8 gap-1.5 px-2"
                    onClick={() => column.onSort?.(column)}
                  >
                    <span>{column.header}</span>
                    <SortIcon direction={column.sortDirection ?? false} />
                  </Button>
                ) : (
                  column.header
                )}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading &&
            loadingRowIds.map((rowId) => (
              <TableRow key={rowId}>
                {bulkSelect && (
                  <TableCell>
                    <Skeleton className="size-4" />
                  </TableCell>
                )}
                {columns.map((column) => (
                  <TableCell key={column.id}>
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          {isEmpty && (
            <TableRow>
              <TableCell colSpan={colSpan} className="h-28 text-center text-muted-foreground">
                {isFiltered ? filteredEmptyState : emptyState}
              </TableCell>
            </TableRow>
          )}
          {!loading &&
            data.map((row, rowIndex) => {
              const rowId = getRowId(row, rowIndex);
              const disabled = bulkSelect?.getRowDisabled?.(row, rowIndex) ?? false;

              return (
                <TableRow
                  key={rowId}
                  data-state={bulkSelect?.getRowSelected(row, rowIndex) ? "selected" : undefined}
                  className={cn(
                    compact && "h-10",
                    onRowClick && "cursor-pointer",
                    rowClassName?.(row, rowIndex),
                  )}
                  onClick={onRowClick ? () => onRowClick(row, rowIndex) : undefined}
                >
                  {bulkSelect && (
                    <TableCell onClick={(event) => event.stopPropagation()}>
                      <Checkbox
                        aria-label={`Select row ${rowIndex + 1}`}
                        checked={bulkSelect.getRowSelected(row, rowIndex)}
                        disabled={disabled}
                        onCheckedChange={(checked) =>
                          bulkSelect.onToggleRow(row, rowIndex, checked === true)
                        }
                      />
                    </TableCell>
                  )}
                  {columns.map((column) => (
                    <TableCell key={column.id} className={column.className}>
                      {getCellValue(row, column, rowIndex)}
                    </TableCell>
                  ))}
                </TableRow>
              );
            })}
        </TableBody>
      </Table>
    </div>
  );
}

export { DataTable };
