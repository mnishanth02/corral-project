export type DemoState =
  | "default"
  | "empty"
  | "loading"
  | "error"
  | "validation-error"
  | "success"
  | "permission-denied"
  | "offline"
  | "webhook-pending";

export type ParticipantPersona =
  | "public"
  | "participant-returning"
  | "participant-family"
  | "org-owner"
  | "org-staff"
  | "org-readonly"
  | "corral-admin"
  | "corral-admin-impersonating"
  | "session-expired"
  | "access-denied";

export type EventStatus = "draft" | "published" | "sold-out" | "race-day" | "completed";
export type CategoryStatus = "available" | "early-bird" | "waitlist" | "sold-out";
export type Distance = "5K" | "10K" | "21K";
export type PaymentStatus = "not-started" | "pending" | "confirmed" | "failed" | "refunded";
export type RegistrationStatus = "draft" | "payment-pending" | "confirmed" | "cancelled";
export type KitStatus = "not-ready" | "ready" | "collected";
export type ResultStatus = "not-live" | "live" | "certificate-ready";
export type InsuranceStatus = "not-selected" | "selected" | "issued" | "claim-open";

export type Money = {
  currency: "INR";
  amount: number;
};

export type Venue = {
  name: string;
  addressLine1: string;
  locality: string;
  city: string;
  state: string;
  postalCode: string;
  landmark?: string;
};

export type FeeTier = {
  id: string;
  label: string;
  amount: Money;
  startsAt: string;
  endsAt: string;
  active: boolean;
};

export type Category = {
  id: string;
  eventId: string;
  name: string;
  distance: Distance;
  minAge: number;
  maxAge?: number;
  status: CategoryStatus;
  capacity: number;
  registeredCount: number;
  feeTiers: FeeTier[];
  includes: string[];
};

export type Event = {
  id: string;
  slug: string;
  title: string;
  status: EventStatus;
  city: string;
  venue: Venue;
  startsAt: string;
  endsAt: string;
  registrationClosesAt: string;
  organizerName: string;
  heroImageAlt: string;
  summary: string;
  categories: Category[];
  policies: {
    refund: string;
    waiver: string;
  };
};

export type ParticipantFormData = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: "female" | "male" | "non-binary" | "prefer-not-to-say";
  tshirtSize: "XS" | "S" | "M" | "L" | "XL" | "XXL";
  emergencyContactName: string;
  emergencyContactPhone: string;
  medicalNotes?: string;
};

export type GuardianData = {
  name: string;
  phone: string;
  relationship: string;
  consentAccepted: boolean;
};

export type Coupon = {
  code: string;
  eventId: string;
  label: string;
  discountType: "flat" | "percent";
  discountValue: number;
  active: boolean;
  expiresAt: string;
  minimumAmount?: number;
};

export type InsurancePolicy = {
  id: string;
  registrationId: string;
  providerName: string;
  planName: string;
  status: InsuranceStatus;
  premium: Money;
  coverageAmount: Money;
  issuedAt?: string;
  claimSupportPhone: string;
  summary: string;
};

export type OrderSummary = {
  categoryFee: Money;
  insurancePremium: Money;
  discount: Money;
  platformFee: Money;
  total: Money;
};

export type Registration = {
  id: string;
  eventId: string;
  categoryId: string;
  participantName: string;
  participantEmail: string;
  status: RegistrationStatus;
  paymentStatus: PaymentStatus;
  couponCode?: string;
  orderSummary: OrderSummary;
  createdAt: string;
  confirmedAt?: string;
};

export type Ticket = {
  id: string;
  registrationId: string;
  eventId: string;
  bibNumber: string;
  qrLabel: string;
  kitStatus: KitStatus;
  wave: string;
  reportingTime: string;
  gate: string;
};

export type Result = {
  id: string;
  registrationId: string;
  eventId: string;
  categoryId: string;
  bibNumber: string;
  participantName: string;
  status: ResultStatus;
  rankOverall?: number;
  rankGender?: number;
  finishTime?: string;
  pace?: string;
  certificateReady: boolean;
  publishedAt?: string;
};

export type LeaderboardRow = {
  rank: number;
  bibNumber: string;
  participantName: string;
  categoryId: string;
  gender: ParticipantFormData["gender"];
  finishTime: string;
  pace: string;
};

export type MockMutationStatus = "success" | "validation-error" | "error" | "pending";

export type MockMutationResult<T> = {
  status: MockMutationStatus;
  demo: DemoState;
  data?: T;
  message: string;
  fieldErrors?: Record<string, string>;
};

export type RegistrationFlowState = {
  eventId: string;
  selectedCategoryId?: string;
  participant: ParticipantFormData;
  guardian?: GuardianData;
  waiverAccepted: boolean;
  dpdpConsentAccepted: boolean;
  insurancePolicyId?: string;
  couponCode?: string;
  orderSummary: OrderSummary;
  paymentStatus: PaymentStatus;
};
