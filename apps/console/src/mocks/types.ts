export const paymentStatusLabels = [
  "Payment Started",
  "Payment Pending",
  "Paid — Awaiting Webhook",
  "Paid & Confirmed",
  "Confirmation Sent",
  "Settlement Pending",
  "Settled",
  "Refund Requested",
  "Refund Processing",
  "Refunded",
  "Failed",
  "User Abandoned",
  "Duplicate Payment",
  "Needs Review",
] as const;

export type PaymentStatusLabel = (typeof paymentStatusLabels)[number];

export const resultStatuses = ["finished", "DNF", "DNS", "DQ"] as const;

export type ResultStatus = (typeof resultStatuses)[number];

export const teamRoles = [
  "Owner",
  "Admin",
  "Event Editor",
  "Finance",
  "Support/Check-in",
  "Read-only Viewer",
] as const;

export type TeamRole = (typeof teamRoles)[number];

export type PersonaId =
  | "org-owner"
  | "org-staff"
  | "org-readonly"
  | "corral-admin"
  | "corral-admin-impersonating"
  | "session-expired"
  | "access-denied";

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

export type Capability =
  | "events:read"
  | "events:write"
  | "events:publish"
  | "roster:read"
  | "roster:write"
  | "roster:export"
  | "bibs:manage"
  | "comms:send"
  | "results:manage"
  | "certificates:manage"
  | "payments:read"
  | "payments:refund"
  | "payments:export"
  | "permissions:manage"
  | "support:manage"
  | "admin:read"
  | "admin:write"
  | "admin:impersonate"
  | "audit:read";

export type Organizer = {
  id: string;
  slug: string;
  name: string;
  legalName: string;
  ownerName: string;
  ownerEmail: string;
  phone: string;
  city: string;
  state: string;
  gstin?: string;
  paymentAccountStatus: "not-started" | "pending" | "verified" | "needs-attention";
  supportContact: string;
  eventsCount: number;
  createdAt: string;
};

export type EventDistance = "5K" | "10K" | "21K";

export type EventCategory = {
  id: string;
  distance: EventDistance;
  label: string;
  feeInPaise: number;
  capacity: number;
  registered: number;
  minAge?: number;
};

export type EventSetup = {
  currentStep: "basics" | "fees" | "form" | "branding" | "policies" | "publish";
  completedSteps: Array<EventSetup["currentStep"]>;
  blockers: ChecklistItem[];
};

export type Event = {
  id: string;
  organizerId: string;
  slug: string;
  name: string;
  status: "draft" | "ready" | "published" | "closed" | "completed";
  date: string;
  startTime: string;
  venueName: string;
  venueAddress: string;
  city: string;
  timezone: "Asia/Kolkata";
  categories: EventCategory[];
  setup: EventSetup;
  publicUrl: string;
  registrationOpensAt: string;
  registrationClosesAt: string;
};

export type RosterParticipant = {
  id: string;
  eventId: string;
  registrationId: string;
  name: string;
  email: string;
  phone: string;
  age: number;
  gender: "Female" | "Male" | "Non-binary" | "Prefer not to say";
  city: string;
  distance: EventDistance;
  bibNumber?: string;
  tshirtSize: "XS" | "S" | "M" | "L" | "XL" | "XXL";
  emergencyContactName: string;
  emergencyContactPhone: string;
  medicalNotes?: string;
  paymentStatus: PaymentStatusLabel;
  checkInStatus: "not-checked-in" | "kit-collected" | "bib-issued";
  registeredAt: string;
};

export type Result = {
  id: string;
  eventId: string;
  participantId: string;
  bibNumber: string;
  name: string;
  distance: EventDistance;
  status: ResultStatus;
  gunTime?: string;
  chipTime?: string;
  overallRank?: number;
  genderRank?: number;
  categoryRank?: number;
  certificateStatus: "not-generated" | "queued" | "generated" | "sent" | "held";
};

export type CommsTemplate = {
  id: string;
  eventId: string;
  name: string;
  channel: "WhatsApp" | "SMS" | "Email";
  subject?: string;
  body: string;
  variables: string[];
  updatedAt: string;
};

export type CommsMessage = {
  id: string;
  eventId: string;
  templateId: string;
  audience: string;
  channel: CommsTemplate["channel"];
  status: "draft" | "scheduled" | "sending" | "sent" | "failed";
  scheduledFor?: string;
  sentAt?: string;
  createdBy: string;
};

export type Delivery = {
  id: string;
  messageId: string;
  eventId: string;
  recipientName: string;
  recipientPhone: string;
  channel: CommsTemplate["channel"];
  status: "queued" | "sent" | "delivered" | "read" | "failed" | "webhook-pending";
  providerReference?: string;
  lastUpdatedAt: string;
  errorMessage?: string;
};

export type Payment = {
  id: string;
  eventId: string;
  registrationId: string;
  participantName: string;
  amountInPaise: number;
  status: PaymentStatusLabel;
  method: "UPI" | "Card" | "NetBanking" | "Cash";
  razorpayOrderId?: string;
  settlementEta: "T+2" | "T+3" | "Manual";
  settlementDate?: string;
  createdAt: string;
  updatedAt: string;
};

export type Coupon = {
  id: string;
  eventId: string;
  code: string;
  description: string;
  discountType: "flat" | "percent";
  discountValue: number;
  maxRedemptions: number;
  redeemed: number;
  expiresAt: string;
  status: "active" | "scheduled" | "expired" | "paused";
};

export type Bib = {
  id: string;
  eventId: string;
  bibNumber: string;
  distance: EventDistance;
  participantId?: string;
  participantName?: string;
  status: "available" | "assigned" | "duplicate" | "void";
};

export type ChipMapping = {
  id: string;
  eventId: string;
  bibNumber: string;
  chipCode: string;
  participantId?: string;
  status: "mapped" | "missing-chip" | "duplicate-chip" | "needs-review";
  updatedAt: string;
};

export type AuditEntry = {
  id: string;
  actorName: string;
  actorRole: TeamRole | "Corral Admin";
  action: string;
  target: string;
  reason?: string;
  eventId?: string;
  organizerId?: string;
  createdAt: string;
  ipAddress: string;
};

export type ChecklistItem = {
  id: string;
  label: string;
  status: "complete" | "warning" | "blocked";
  ownerRole: TeamRole;
  route: string;
};

export type Permission = {
  id: string;
  role: TeamRole;
  capability: Capability;
  allowed: boolean;
  auditReasonRequired: boolean;
};

export type SupportTicket = {
  id: string;
  subject: string;
  requesterName: string;
  requesterType: "Participant" | "Organizer" | "Corral Staff";
  status: "open" | "pending" | "resolved" | "escalated";
  priority: "low" | "medium" | "high" | "urgent";
  relatedEventId?: string;
  relatedRegistrationId?: string;
  assignedTo: string;
  createdAt: string;
  lastUpdatedAt: string;
};

export type Job = {
  id: string;
  name: string;
  status: "queued" | "running" | "succeeded" | "failed" | "webhook-pending";
  attempts: number;
  lastRunAt: string;
  nextRunAt?: string;
  details: string;
};

export type OpsHealth = {
  id: string;
  name: string;
  status: "operational" | "degraded" | "outage";
  latencyMs: number;
  checkedAt: string;
  notes: string;
};

export type TeamMember = {
  id: string;
  organizerId: string;
  name: string;
  email: string;
  role: TeamRole;
  status: "active" | "invited" | "disabled";
  lastActiveAt?: string;
};

export type EventSetupDraft = {
  eventId: string;
  basics: Pick<Event, "name" | "date" | "startTime" | "venueName" | "venueAddress" | "city">;
  categories: EventCategory[];
  formFields: string[];
  brandColor: string;
  policyUrls: string[];
  readyToPublish: boolean;
};

export type ResultsUploadDraft = {
  eventId: string;
  fileName?: string;
  mappedColumns: Record<string, string>;
  validationErrors: string[];
  previewRows: Result[];
  publishStatus: "not-started" | "validated" | "published";
};
