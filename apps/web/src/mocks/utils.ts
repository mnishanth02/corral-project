import type { DemoState, MockMutationResult, Money } from "./types";

export const demoStates = [
  "default",
  "empty",
  "loading",
  "error",
  "validation-error",
  "success",
  "permission-denied",
  "offline",
  "webhook-pending",
] as const satisfies readonly DemoState[];

const demoStateSet = new Set<string>(demoStates);

export function parseDemoState(value: string | null | undefined): DemoState {
  return value && demoStateSet.has(value) ? (value as DemoState) : "default";
}

export function formatINR(value: number | Money): string {
  const amount = typeof value === "number" ? value : value.amount;

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(value: string | Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function formatTime(value: string | Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(value));
}

export type MockMutateOptions = {
  demo?: DemoState;
  validationErrors?: Record<string, string>;
  delayMs?: number;
};

export async function mockMutate<T>(
  payload: T,
  { demo = "default", validationErrors, delayMs = 0 }: MockMutateOptions = {},
): Promise<MockMutationResult<T>> {
  if (delayMs > 0) {
    await new Promise((resolve) => window.setTimeout(resolve, delayMs));
  }

  if (demo === "validation-error") {
    return {
      status: "validation-error",
      demo,
      message: "Please fix the highlighted fields and try again.",
      fieldErrors: validationErrors ?? { form: "This demo state returns a validation error." },
    };
  }

  if (demo === "error" || demo === "permission-denied" || demo === "offline") {
    const messages: Record<typeof demo, string> = {
      error: "Something went wrong in the demo flow.",
      "permission-denied": "This persona cannot complete the requested action.",
      offline: "You appear to be offline. Try again when connectivity returns.",
    };

    return {
      status: "error",
      demo,
      message: messages[demo],
    };
  }

  if (demo === "webhook-pending" || demo === "loading") {
    return {
      status: "pending",
      demo,
      data: payload,
      message:
        demo === "webhook-pending"
          ? "Payment is captured and waiting for webhook reconciliation."
          : "The loading demo state is still processing.",
    };
  }

  return {
    status: "success",
    demo,
    data: payload,
    message: "Saved successfully in the deterministic mock flow.",
  };
}
