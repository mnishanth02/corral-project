import { z } from "zod";
import { eventFormFieldSchema } from "./console.schema";

export const publicEventAvailabilitySchema = z.enum([
  "registration-upcoming",
  "registration-open",
  "registration-closed",
  "sold-out",
]);
export type PublicEventAvailability = z.infer<typeof publicEventAvailabilitySchema>;

export const publicEventOrganizerSchema = z.object({
  slug: z.string(),
  name: z.string(),
  city: z.string(),
  state: z.string(),
  supportContact: z.string(),
});
export type PublicEventOrganizer = z.infer<typeof publicEventOrganizerSchema>;

export const publicEventFeeTierSchema = z.object({
  id: z.string(),
  categoryId: z.string(),
  label: z.string(),
  amountInPaise: z.number().int().positive(),
  startsAt: z.string().nullable(),
  endsAt: z.string().nullable(),
  registrationCap: z.number().int().positive().nullable(),
  registrationCount: z.number().int().nonnegative(),
  isActive: z.literal(true),
});
export type PublicEventFeeTier = z.infer<typeof publicEventFeeTierSchema>;

export const publicEventCategorySchema = z.object({
  id: z.string(),
  eventId: z.string(),
  label: z.string(),
  distance: z.string(),
  minAge: z.number().int().nonnegative().nullable(),
  maxAge: z.number().int().nonnegative().nullable(),
  capacity: z.number().int().positive(),
  registeredCount: z.number().int().nonnegative(),
  sortOrder: z.number().int().nonnegative(),
  status: z.enum(["active", "sold-out"]),
  feeTiers: z.array(publicEventFeeTierSchema),
});
export type PublicEventCategory = z.infer<typeof publicEventCategorySchema>;

export const publicEventSummarySchema = z.object({
  id: z.string(),
  organizerSlug: z.string(),
  organizer: publicEventOrganizerSchema,
  slug: z.string(),
  name: z.string(),
  date: z.string().nullable(),
  startsAt: z.string().nullable(),
  venueName: z.string().nullable(),
  venueAddress: z.string().nullable(),
  city: z.string().nullable(),
  timezone: z.string(),
  registrationOpensAt: z.string().nullable(),
  registrationClosesAt: z.string().nullable(),
  description: z.string().nullable(),
  logoUrl: z.string().nullable(),
  bannerUrl: z.string().nullable(),
  availability: publicEventAvailabilitySchema,
  categories: z.array(publicEventCategorySchema),
});
export type PublicEventSummary = z.infer<typeof publicEventSummarySchema>;

export const publicEventDetailSchema = publicEventSummarySchema.extend({
  mapUrl: z.string().nullable(),
  contactEmail: z.string().nullable(),
  contactPhone: z.string().nullable(),
  raceInstructions: z.string().nullable(),
  waiverText: z.string().nullable(),
  refundPolicy: z.string().nullable(),
  medicalDeclaration: z.string().nullable(),
  formFields: z.array(eventFormFieldSchema),
  tshirtSizes: z.array(z.string()),
  publishedAt: z.string().nullable(),
});
export type PublicEventDetail = z.infer<typeof publicEventDetailSchema>;

export const publicEventsResponseSchema = z.object({
  events: z.array(publicEventSummarySchema),
});
export type PublicEventsResponse = z.infer<typeof publicEventsResponseSchema>;

export const publicEventDetailResponseSchema = z.object({
  event: publicEventDetailSchema,
});
export type PublicEventDetailResponse = z.infer<typeof publicEventDetailResponseSchema>;
