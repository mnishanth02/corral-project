"use client";

import { CheckCircle2, ShieldAlert } from "lucide-react";
import * as React from "react";

import { cn } from "../lib/utils";
import { Button } from "./button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./dialog";
import { Label } from "./label";
import { Textarea } from "./textarea";

export type ConfirmDialogProps = {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  confirmLabel?: React.ReactNode;
  cancelLabel?: React.ReactNode;
  onConfirm?: (reason?: string) => void;
  onCancel?: () => void;
  requireReason?: boolean;
  reasonLabel?: React.ReactNode;
  reasonPlaceholder?: string;
  reasonValue?: string;
  onReasonChange?: (reason: string) => void;
  destructive?: boolean;
  confirmDisabled?: boolean;
  children?: React.ReactNode;
  className?: string;
};

function ConfirmDialog({
  open,
  defaultOpen,
  onOpenChange,
  trigger,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  requireReason = false,
  reasonLabel = "Audit reason",
  reasonPlaceholder = "Add a short reason for the audit log",
  reasonValue,
  onReasonChange,
  destructive = false,
  confirmDisabled = false,
  children,
  className,
}: ConfirmDialogProps) {
  const [internalReason, setInternalReason] = React.useState("");
  const reason = reasonValue ?? internalReason;
  const isReasonMissing = requireReason && reason.trim().length === 0;

  function handleReasonChange(nextReason: string) {
    setInternalReason(nextReason);
    onReasonChange?.(nextReason);
  }

  function handleConfirm() {
    if (isReasonMissing || confirmDisabled) {
      return;
    }

    onConfirm?.(requireReason ? reason.trim() : reason);
    onOpenChange?.(false);
  }

  return (
    <Dialog open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent data-slot="confirm-dialog" className={className}>
        <DialogHeader>
          <div className="mb-1 flex items-center gap-3">
            <span
              className={cn(
                "flex size-10 shrink-0 items-center justify-center rounded-full border",
                destructive
                  ? "border-danger/30 bg-danger/10 text-danger-text"
                  : "border-info/30 bg-info/10 text-info-text",
              )}
              aria-hidden="true"
            >
              <ShieldAlert className="size-5" />
            </span>
            <DialogTitle>{title}</DialogTitle>
          </div>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {children}
        {requireReason && (
          <div data-slot="confirm-dialog-reason" className="grid gap-2">
            <Label htmlFor="confirm-dialog-reason">{reasonLabel}</Label>
            <Textarea
              id="confirm-dialog-reason"
              value={reason}
              placeholder={reasonPlaceholder}
              aria-invalid={isReasonMissing}
              aria-describedby={isReasonMissing ? "confirm-dialog-reason-error" : undefined}
              onChange={(event) => handleReasonChange(event.target.value)}
            />
            {isReasonMissing && (
              <p
                id="confirm-dialog-reason-error"
                aria-live="polite"
                className="text-danger-text text-sm"
              >
                A reason is required before continuing.
              </p>
            )}
          </div>
        )}
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" onClick={onCancel}>
              {cancelLabel}
            </Button>
          </DialogClose>
          <DialogClose asChild>
            <Button
              type="button"
              variant={destructive ? "destructive" : "default"}
              disabled={confirmDisabled || isReasonMissing}
              onClick={handleConfirm}
            >
              {confirmLabel}
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export type SuccessModalProps = {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  closeLabel?: React.ReactNode;
  className?: string;
};

function SuccessModal({
  open,
  defaultOpen,
  onOpenChange,
  title,
  description,
  action,
  closeLabel = "Done",
  className,
}: SuccessModalProps) {
  return (
    <Dialog open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
      <DialogContent data-slot="success-modal" className={className}>
        <DialogHeader className="items-center text-center">
          <span
            className="flex size-12 items-center justify-center rounded-full border border-success/30 bg-success/10 text-success-text"
            aria-hidden="true"
          >
            <CheckCircle2 className="size-6" />
          </span>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <DialogFooter className="sm:justify-center">
          {action ?? (
            <DialogClose asChild>
              <Button type="button">{closeLabel}</Button>
            </DialogClose>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { ConfirmDialog, SuccessModal };
