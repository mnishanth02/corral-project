import type { DemoState } from "./types";

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

export type MockMutationResult<T> = {
  ok: boolean;
  demo: DemoState;
  payload: T;
  message: string;
  fieldErrors?: Record<string, string>;
};

export function parseDemoState(value: unknown): DemoState {
  return typeof value === "string" && demoStates.includes(value as DemoState)
    ? (value as DemoState)
    : "default";
}

export async function mockMutate<T>(
  payload: T,
  options: { demo?: DemoState } = {},
): Promise<MockMutationResult<T>> {
  const demo = options.demo ?? "default";

  if (demo === "validation-error") {
    return {
      ok: false,
      demo,
      payload,
      message: "Please fix the highlighted fields and try again.",
      fieldErrors: {
        name: "Required for this demo state.",
      },
    };
  }

  if (demo === "permission-denied") {
    return {
      ok: false,
      demo,
      payload,
      message: "Your current role cannot perform this action.",
    };
  }

  if (demo === "offline") {
    return {
      ok: false,
      demo,
      payload,
      message: "Demo offline mode: changes are saved locally only.",
    };
  }

  if (demo === "error") {
    return {
      ok: false,
      demo,
      payload,
      message: "Demo error state: retry without changing any backend data.",
    };
  }

  if (demo === "webhook-pending") {
    return {
      ok: true,
      demo,
      payload,
      message: "Saved locally. Webhook/reconciliation is pending in the demo state.",
    };
  }

  return {
    ok: true,
    demo,
    payload,
    message: demo === "success" ? "Saved successfully." : "Saved in mock mode.",
  };
}

const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export function formatINR(amountInPaise: number) {
  return inrFormatter.format(amountInPaise / 100);
}

export function formatDate(value: string | Date) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(new Date(value));
}

export function formatTime(value: string | Date) {
  return new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  }).format(new Date(value));
}
