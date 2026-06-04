"use client";

import { AlertCircle } from "lucide-react";
import * as React from "react";

import { cn } from "../lib/utils";
import { Checkbox } from "./checkbox";
import { Label } from "./label";

export type ConsentItem = {
  id: string;
  label: React.ReactNode;
  description?: React.ReactNode;
  defaultChecked?: boolean;
  disabled?: boolean;
};

export type ConsentBlockValue = Record<string, boolean>;

export type ConsentBlockProps = React.ComponentProps<"fieldset"> & {
  title?: React.ReactNode;
  description?: React.ReactNode;
  requiredConsents: ConsentItem[];
  optionalConsents?: ConsentItem[];
  value?: ConsentBlockValue;
  onChange?: (value: ConsentBlockValue, meta: { allRequiredChecked: boolean }) => void;
  privacyNotice?: React.ReactNode;
  showRequiredError?: boolean;
  errorMessage?: React.ReactNode;
};

function buildInitialValue(requiredConsents: ConsentItem[], optionalConsents: ConsentItem[]) {
  const requiredValue = requiredConsents.reduce<ConsentBlockValue>((nextValue, item) => {
    nextValue[item.id] = false;
    return nextValue;
  }, {});

  return optionalConsents.reduce<ConsentBlockValue>((nextValue, item) => {
    nextValue[item.id] = item.defaultChecked ?? false;
    return nextValue;
  }, requiredValue);
}

function ConsentBlock({
  title = "Consent",
  description,
  requiredConsents,
  optionalConsents = [],
  value,
  onChange,
  privacyNotice,
  showRequiredError = false,
  errorMessage = "Please accept all required consent items to continue.",
  className,
  ...props
}: ConsentBlockProps) {
  const [internalValue, setInternalValue] = React.useState<ConsentBlockValue>(() =>
    buildInitialValue(requiredConsents, optionalConsents),
  );
  const checkedValue = value ?? internalValue;
  const allRequiredChecked = requiredConsents.every((item) => checkedValue[item.id] === true);
  const shouldShowError = showRequiredError && !allRequiredChecked;

  function updateValue(id: string, checked: boolean) {
    const nextValue = { ...checkedValue, [id]: checked };
    setInternalValue(nextValue);
    onChange?.(nextValue, {
      allRequiredChecked: requiredConsents.every((item) =>
        item.id === id ? checked : nextValue[item.id] === true,
      ),
    });
  }

  function renderItem(item: ConsentItem, required: boolean) {
    const checkboxId = `consent-${item.id}`;
    const descriptionId = item.description ? `${checkboxId}-description` : undefined;

    return (
      <div
        key={item.id}
        data-slot="consent-item"
        className="flex gap-3 rounded-lg border bg-card p-3"
      >
        <Checkbox
          id={checkboxId}
          checked={checkedValue[item.id] === true}
          disabled={item.disabled}
          aria-required={required}
          aria-invalid={required && shouldShowError && checkedValue[item.id] !== true}
          aria-describedby={descriptionId}
          onCheckedChange={(checked) => updateValue(item.id, checked === true)}
        />
        <div className="grid gap-1 leading-none">
          <Label htmlFor={checkboxId} className="items-start leading-snug">
            <span>{item.label}</span>
            {required && <span className="text-danger-text">Required</span>}
          </Label>
          {item.description && (
            <p id={descriptionId} className="text-muted-foreground text-sm leading-relaxed">
              {item.description}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <fieldset
      data-slot="consent-block"
      className={cn("space-y-4 rounded-xl border bg-card p-4", className)}
      {...props}
    >
      <legend className="font-semibold text-card-foreground">{title}</legend>
      {description && <p className="text-muted-foreground text-sm">{description}</p>}
      <div className="space-y-3">
        {requiredConsents.map((item) => renderItem(item, true))}
        {optionalConsents.map((item) => renderItem(item, false))}
      </div>
      {privacyNotice && <div className="text-muted-foreground text-sm">{privacyNotice}</div>}
      {shouldShowError && (
        <p
          data-slot="consent-block-error"
          aria-live="polite"
          className="flex items-center gap-2 text-danger-text text-sm"
        >
          <AlertCircle className="size-4" aria-hidden="true" />
          <span>{errorMessage}</span>
        </p>
      )}
    </fieldset>
  );
}

export { ConsentBlock };
