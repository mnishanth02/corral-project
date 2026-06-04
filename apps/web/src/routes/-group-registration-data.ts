import type { DemoState, Distance, ParticipantFormData } from "../mocks/types";
import { formatINR, parseDemoState } from "../mocks/utils";

export type GroupSearch = {
  demo?: DemoState;
  runner?: string;
  section?: "billing" | "runners";
};

export type RunnerStatus = "valid" | "warning" | "error";

export type RunnerDraft = {
  id: string;
  name: string;
  mobile: string;
  email: string;
  gender: ParticipantFormData["gender"];
  dob: string;
  distance: Distance;
  tshirtSize: ParticipantFormData["tshirtSize"];
  emergencyContact: string;
  club?: string;
  fee: number;
  earlyBirdDiscount: number;
  status: RunnerStatus;
  issues: string[];
};

export type CoordinatorDraft = {
  name: string;
  organisation: string;
  mobile: string;
  email: string;
};

export type BillingDraft = {
  gstRegistered: boolean;
  gstin?: string;
  address: string;
  city: string;
  state: "Tamil Nadu" | "Karnataka";
  invoiceName: string;
};

export type GroupDraft = {
  coordinator: CoordinatorDraft;
  billing: BillingDraft;
  runners: RunnerDraft[];
  attested: boolean;
  couponCode?: string;
};

const teeSizes = ["XS", "S", "M", "L", "XL", "XXL"] as const;

export const groupDemoStates = [
  "default",
  "empty",
  "loading",
  "validation-error",
  "success",
  "webhook-pending",
  "error",
] as const;

export function validateGroupSearch(search: Record<string, unknown>): GroupSearch {
  const demo = parseDemoState(typeof search.demo === "string" ? search.demo : undefined);
  const runner = typeof search.runner === "string" ? search.runner : undefined;
  const section =
    search.section === "billing" || search.section === "runners" ? search.section : undefined;

  return {
    demo: demo === "default" ? undefined : demo,
    runner,
    section,
  };
}

export function currentDemo(search: GroupSearch): DemoState {
  return search.demo ?? "default";
}

export const coordinatorSeed: CoordinatorDraft = {
  name: "Meena Subramanian",
  organisation: "Kongu Runners Club",
  mobile: "+91 98765 43120",
  email: "meena@kongurunners.example",
};

export const billingSeed: BillingDraft = {
  gstRegistered: true,
  gstin: "33AABCK1234M1Z5",
  address: "CODISSIA Road, Avinashi Road",
  city: "Coimbatore",
  state: "Tamil Nadu",
  invoiceName: "Kongu Runners Club",
};

export const runnerSeeds: RunnerDraft[] = [
  {
    id: "runner-priya",
    name: "Priya Raman",
    mobile: "+91 98765 10420",
    email: "priya.raman@example.test",
    gender: "female",
    dob: "1994-08-16",
    distance: "10K",
    tshirtSize: "M",
    emergencyContact: "R. Raman · +91 98765 10421",
    club: "Kongu Runners Club",
    fee: 699,
    earlyBirdDiscount: 100,
    status: "valid",
    issues: [],
  },
  {
    id: "runner-karthik",
    name: "Karthik S",
    mobile: "+91 98765 10420",
    email: "karthik.s@example.test",
    gender: "male",
    dob: "1988-03-22",
    distance: "21K",
    tshirtSize: "L",
    emergencyContact: "Divya S · +91 98765 10422",
    club: "Kongu Runners Club",
    fee: 999,
    earlyBirdDiscount: 100,
    status: "error",
    issues: ["Duplicate mobile with row 1", "Enter a unique 10-digit mobile"],
  },
  {
    id: "runner-aarav",
    name: "Aarav Kumar",
    mobile: "+91 98765 10423",
    email: "aarav.kumar@example.test",
    gender: "male",
    dob: "2010-11-02",
    distance: "5K",
    tshirtSize: "S",
    emergencyContact: "Nisha Kumar · +91 98765 10424",
    club: "Kovai Juniors",
    fee: 599,
    earlyBirdDiscount: 100,
    status: "warning",
    issues: ["Under 18 — guardian consent needed"],
  },
  {
    id: "runner-ananya",
    name: "Ananya Krishnan",
    mobile: "+91 98765 10425",
    email: "ananya.k@example.test",
    gender: "female",
    dob: "1997-05-09",
    distance: "10K",
    tshirtSize: "M",
    emergencyContact: "Vikram · +91 98765 10426",
    club: "Race Course Flyers",
    fee: 699,
    earlyBirdDiscount: 100,
    status: "valid",
    issues: [],
  },
];

export const cleanRunnerSeeds: RunnerDraft[] = runnerSeeds.map((runner) => ({
  ...runner,
  mobile: runner.id === "runner-karthik" ? "+91 98765 10427" : runner.mobile,
  status: "valid",
  issues: [],
}));

export const emptyRunner: RunnerDraft = {
  id: "runner-new",
  name: "",
  mobile: "",
  email: "",
  gender: "prefer-not-to-say",
  dob: "",
  distance: "10K",
  tshirtSize: "M",
  emergencyContact: "",
  club: "",
  fee: 699,
  earlyBirdDiscount: 100,
  status: "error",
  issues: ["Enter runner details to calculate fee"],
};

export function draftForDemo(demo: DemoState): GroupDraft {
  if (demo === "empty") {
    return {
      coordinator: coordinatorSeed,
      billing: billingSeed,
      runners: [],
      attested: false,
    };
  }

  if (demo === "success" || demo === "webhook-pending") {
    return {
      coordinator: coordinatorSeed,
      billing: billingSeed,
      runners: cleanRunnerSeeds,
      attested: true,
      couponCode: "CLUB10",
    };
  }

  if (demo === "validation-error" || demo === "error") {
    return {
      coordinator: coordinatorSeed,
      billing: { ...billingSeed, gstin: "33AABC" },
      runners: runnerSeeds,
      attested: false,
      couponCode: "CLUB10",
    };
  }

  const starterRunner = runnerSeeds[0] ?? emptyRunner;

  return {
    coordinator: coordinatorSeed,
    billing: billingSeed,
    runners: [starterRunner, { ...emptyRunner }],
    attested: false,
  };
}

export function statusLabel(status: RunnerStatus) {
  if (status === "valid") {
    return "Valid";
  }

  if (status === "warning") {
    return "Guardian consent";
  }

  return "Needs fix";
}

export function runnerIssueCount(runners: RunnerDraft[]) {
  return runners.reduce(
    (counts, runner) => {
      if (runner.status === "valid") counts.valid += 1;
      if (runner.status === "warning") counts.warning += 1;
      if (runner.status === "error") counts.error += 1;
      return counts;
    },
    { valid: 0, warning: 0, error: 0 },
  );
}

export function calculateTotals(draft: GroupDraft) {
  const subtotal = draft.runners.reduce(
    (sum, runner) => sum + runner.fee + runner.earlyBirdDiscount,
    0,
  );
  const earlyBird = draft.runners.reduce((sum, runner) => sum + runner.earlyBirdDiscount, 0);
  const afterEarlyBird = subtotal - earlyBird;
  const coupon = draft.couponCode ? Math.round(afterEarlyBird * 0.1) : 0;
  const taxableValue = Math.round((afterEarlyBird - coupon) / 1.18);
  const gst = afterEarlyBird - coupon - taxableValue;
  const total = afterEarlyBird - coupon;

  return {
    subtotal,
    earlyBird,
    coupon,
    taxableValue,
    cgst: draft.billing.state === "Tamil Nadu" ? Math.round(gst / 2) : 0,
    sgst: draft.billing.state === "Tamil Nadu" ? gst - Math.round(gst / 2) : 0,
    igst: draft.billing.state === "Tamil Nadu" ? 0 : gst,
    total,
    label: `${draft.runners.length} runners · ${formatINR(total)}`,
  };
}

export function rowFee(distance: Distance) {
  if (distance === "5K") return 599;
  if (distance === "10K") return 699;
  return 999;
}

export function teeSizeOptions() {
  return teeSizes;
}
