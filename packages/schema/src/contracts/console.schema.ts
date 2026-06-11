import { z } from "zod";

export const teamRoleSchema = z.enum([
  "Owner",
  "Admin",
  "Event Editor",
  "Finance",
  "Support/Check-in",
  "Read-only Viewer",
]);
export type TeamRole = z.infer<typeof teamRoleSchema>;

export const capabilitySchema = z.enum([
  "events:read",
  "events:write",
  "events:publish",
  "roster:read",
  "roster:write",
  "roster:export",
  "bibs:manage",
  "comms:send",
  "results:manage",
  "certificates:manage",
  "payments:read",
  "payments:refund",
  "payments:export",
  "permissions:manage",
  "support:manage",
  "audit:read",
  "admin:read",
  "admin:write",
  "admin:impersonate",
]);
export type Capability = z.infer<typeof capabilitySchema>;

export const membershipStatusSchema = z.enum(["active", "invited", "disabled"]);
export type MembershipStatus = z.infer<typeof membershipStatusSchema>;

export const organizerReviewStatusSchema = z.enum([
  "pending",
  "approved",
  "changes-requested",
  "rejected",
  "suspended",
]);
export type OrganizerReviewStatus = z.infer<typeof organizerReviewStatusSchema>;

export const organizerEntityTypeSchema = z.enum(["gst", "non-gst"]);
export type OrganizerEntityType = z.infer<typeof organizerEntityTypeSchema>;

const gstinSchema = z
  .string()
  .trim()
  .regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/, "Enter a valid 15-character GSTIN.");
const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+?[0-9][0-9\s-]{7,18}$/, "Enter a valid phone number.");
const emailOrPhoneSchema = z
  .string()
  .trim()
  .refine(
    (value) => z.string().email().safeParse(value).success || phoneSchema.safeParse(value).success,
    "Enter a valid support email or phone number.",
  );

export const consoleRequestHeadersSchema = z
  .object({
    authorization: z.string().optional(),
    cookie: z.string().optional(),
  })
  .passthrough();
export type ConsoleRequestHeaders = z.infer<typeof consoleRequestHeadersSchema>;

export const organizerSummarySchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  legalName: z.string(),
  ownerEmail: z.string().email(),
  city: z.string(),
  state: z.string(),
  reviewStatus: organizerReviewStatusSchema,
  entityType: organizerEntityTypeSchema,
  gstin: z.string().nullable().optional(),
  billingAddress: z.string().nullable().optional(),
  financeContact: z.string().nullable().optional(),
  paymentAccountStatus: z.enum(["not-started", "pending", "verified", "needs-attention"]),
  supportContact: z.string(),
});
export type OrganizerSummary = z.infer<typeof organizerSummarySchema>;

export const consoleMembershipSchema = z.object({
  id: z.string(),
  organizer: organizerSummarySchema,
  role: teamRoleSchema,
  status: membershipStatusSchema,
  capabilities: z.array(capabilitySchema),
});
export type ConsoleMembership = z.infer<typeof consoleMembershipSchema>;

export const consoleEventSchema = z.object({
  id: z.string(),
  organizerId: z.string(),
  slug: z.string(),
  name: z.string(),
  status: z.enum(["draft", "ready", "published", "closed", "completed"]),
  date: z.string(),
  startsAt: z.string(),
  venueName: z.string(),
  venueAddress: z.string(),
  city: z.string(),
  timezone: z.string(),
});
export type ConsoleEvent = z.infer<typeof consoleEventSchema>;

export const consoleUserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  image: z.string().nullable().optional(),
  role: z.string().nullable().optional(),
  isPlatformAdmin: z.boolean(),
  platformCapabilities: z.array(capabilitySchema),
});
export type ConsoleUser = z.infer<typeof consoleUserSchema>;

export const consoleMeResponseSchema = z.object({
  user: consoleUserSchema,
  memberships: z.array(consoleMembershipSchema),
  events: z.array(consoleEventSchema),
  defaultOrganizerId: z.string().nullable(),
  defaultEventId: z.string().nullable(),
});
export type ConsoleMeResponse = z.infer<typeof consoleMeResponseSchema>;

export const adminOrganizerMemberSchema = z.object({
  id: z.string(),
  organizer: organizerSummarySchema,
  user: z.object({
    id: z.string(),
    email: z.string().email(),
    name: z.string(),
  }),
  role: teamRoleSchema,
  status: membershipStatusSchema,
  lastActiveAt: z.string().nullable(),
  createdAt: z.string(),
});
export type AdminOrganizerMember = z.infer<typeof adminOrganizerMemberSchema>;

export const adminOrganizerMembersResponseSchema = z.object({
  memberships: z.array(adminOrganizerMemberSchema),
});
export type AdminOrganizerMembersResponse = z.infer<typeof adminOrganizerMembersResponseSchema>;

export const adminOrganizersResponseSchema = z.object({
  organizers: z.array(organizerSummarySchema),
});
export type AdminOrganizersResponse = z.infer<typeof adminOrganizersResponseSchema>;

export const onboardingStatusResponseSchema = z.object({
  canCreateOrganizer: z.boolean(),
  organizer: organizerSummarySchema.nullable(),
});
export type OnboardingStatusResponse = z.infer<typeof onboardingStatusResponseSchema>;

export const createOrganizerOnboardingRequestSchema = z
  .object({
    name: z.string().trim().min(2),
    legalName: z.string().trim().min(2),
    entityType: organizerEntityTypeSchema,
    gstin: gstinSchema.optional(),
    phone: phoneSchema,
    city: z.string().trim().min(2),
    state: z.string().trim().min(2),
    supportContact: emailOrPhoneSchema,
    billingAddress: z.string().trim().optional(),
    financeContact: z.string().trim().email().optional(),
  })
  .superRefine((value, context) => {
    if (value.entityType === "gst" && !value.gstin) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["gstin"],
        message: "GSTIN is required for GST-registered organizers.",
      });
    }
  });
export type CreateOrganizerOnboardingRequest = z.infer<
  typeof createOrganizerOnboardingRequestSchema
>;

export const organizerOnboardingResponseSchema = z.object({
  organizer: organizerSummarySchema,
  membership: consoleMembershipSchema,
});
export type OrganizerOnboardingResponse = z.infer<typeof organizerOnboardingResponseSchema>;

export const adminOrganizerDetailResponseSchema = z.object({
  organizer: organizerSummarySchema.extend({
    createdByUserId: z.string().nullable(),
    reviewedByUserId: z.string().nullable(),
    reviewedAt: z.string().nullable(),
    reviewReason: z.string().nullable(),
    createdAt: z.string(),
    updatedAt: z.string(),
  }),
  memberships: z.array(adminOrganizerMemberSchema),
});
export type AdminOrganizerDetailResponse = z.infer<typeof adminOrganizerDetailResponseSchema>;

export const adminReviewOrganizerRequestSchema = z.object({
  reviewStatus: z.enum(["approved", "changes-requested", "rejected", "suspended"]),
  reviewReason: z.string().trim().optional(),
});
export type AdminReviewOrganizerRequest = z.infer<typeof adminReviewOrganizerRequestSchema>;

export const createOrganizerMembershipRequestSchema = z.object({
  userId: z.string().min(1),
  organizerId: z.string().min(1),
  role: teamRoleSchema,
  status: membershipStatusSchema.default("active"),
});
export type CreateOrganizerMembershipRequest = z.infer<
  typeof createOrganizerMembershipRequestSchema
>;

export const updateOrganizerMembershipRequestSchema = z.object({
  role: teamRoleSchema.optional(),
  status: membershipStatusSchema.optional(),
});
export type UpdateOrganizerMembershipRequest = z.infer<
  typeof updateOrganizerMembershipRequestSchema
>;

export const errorResponseSchema = z.object({
  message: z.string(),
});
export type ErrorResponse = z.infer<typeof errorResponseSchema>;

export const roleCapabilities = {
  Owner: [
    "events:read",
    "events:write",
    "events:publish",
    "roster:read",
    "roster:write",
    "roster:export",
    "bibs:manage",
    "comms:send",
    "results:manage",
    "certificates:manage",
    "payments:read",
    "payments:refund",
    "payments:export",
    "permissions:manage",
    "support:manage",
    "audit:read",
  ],
  Admin: [
    "events:read",
    "events:write",
    "events:publish",
    "roster:read",
    "roster:write",
    "roster:export",
    "bibs:manage",
    "comms:send",
    "results:manage",
    "certificates:manage",
    "payments:read",
    "payments:refund",
    "payments:export",
    "permissions:manage",
    "support:manage",
    "audit:read",
  ],
  "Event Editor": [
    "events:read",
    "events:write",
    "roster:read",
    "roster:write",
    "bibs:manage",
    "comms:send",
    "results:manage",
    "certificates:manage",
  ],
  Finance: [
    "events:read",
    "roster:read",
    "payments:read",
    "payments:refund",
    "payments:export",
    "audit:read",
  ],
  "Support/Check-in": [
    "events:read",
    "roster:read",
    "roster:write",
    "bibs:manage",
    "support:manage",
  ],
  "Read-only Viewer": ["events:read", "roster:read", "payments:read", "audit:read"],
} as const satisfies Record<TeamRole, readonly Capability[]>;

export const platformAdminCapabilities = [
  "admin:read",
  "admin:write",
  "admin:impersonate",
  "audit:read",
  "support:manage",
  "events:read",
  "payments:read",
] as const satisfies readonly Capability[];
