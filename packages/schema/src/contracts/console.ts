import { initContract } from "@ts-rest/core";
import { z } from "zod";
import {
  adminOrganizerDetailResponseSchema,
  adminOrganizerMembersResponseSchema,
  adminOrganizersResponseSchema,
  adminReviewOrganizerRequestSchema,
  consoleEventSchema,
  consoleMeResponseSchema,
  consoleRequestHeadersSchema,
  createEventCategoryRequestSchema,
  createEventFeeTierRequestSchema,
  createEventRequestSchema,
  createOrganizerMembershipRequestSchema,
  createOrganizerOnboardingRequestSchema,
  errorResponseSchema,
  eventDeleteResponseSchema,
  eventDetailResponseSchema,
  eventReadinessResponseSchema,
  eventReadyTransitionResponseSchema,
  eventTransitionResponseSchema,
  onboardingStatusResponseSchema,
  organizerOnboardingResponseSchema,
  organizerReviewStatusSchema,
  updateEventCategoryRequestSchema,
  updateEventFeeTierRequestSchema,
  updateEventRequestSchema,
  updateOrganizerMembershipRequestSchema,
  updateOrganizerPaymentAccountRequestSchema,
} from "./console.schema";

const c = initContract();

const standardErrors = {
  400: errorResponseSchema,
  401: errorResponseSchema,
  403: errorResponseSchema,
  404: errorResponseSchema,
  409: errorResponseSchema,
};

export const consoleContract = c.router(
  {
    me: {
      method: "GET",
      path: "/console/me",
      summary: "Current console user, memberships, capabilities, and accessible events",
      headers: consoleRequestHeadersSchema,
      responses: {
        200: consoleMeResponseSchema,
        ...standardErrors,
      },
    },
    listOrganizers: {
      method: "GET",
      path: "/console/organizers",
      summary: "Organizers available to the current console user",
      headers: consoleRequestHeadersSchema,
      responses: {
        200: adminOrganizersResponseSchema,
        ...standardErrors,
      },
    },
    listOrganizerEvents: {
      method: "GET",
      path: "/console/organizers/:organizerId/events",
      summary: "Events available to the current console user for one organizer",
      pathParams: z.object({ organizerId: z.string().min(1) }),
      headers: consoleRequestHeadersSchema,
      responses: {
        200: z.object({ events: z.array(consoleEventSchema) }),
        ...standardErrors,
      },
    },
    getOrganizerEvent: {
      method: "GET",
      path: "/console/organizers/:organizerId/events/:eventId",
      summary: "Get organizer-scoped event setup detail",
      pathParams: z.object({ organizerId: z.string().min(1), eventId: z.string().min(1) }),
      headers: consoleRequestHeadersSchema,
      responses: {
        200: eventDetailResponseSchema,
        ...standardErrors,
      },
    },
    createOrganizerEvent: {
      method: "POST",
      path: "/console/organizers/:organizerId/events",
      summary: "Create a draft event for an approved organizer",
      pathParams: z.object({ organizerId: z.string().min(1) }),
      headers: consoleRequestHeadersSchema,
      body: createEventRequestSchema,
      responses: {
        201: eventDetailResponseSchema,
        ...standardErrors,
      },
    },
    updateOrganizerEvent: {
      method: "PATCH",
      path: "/console/organizers/:organizerId/events/:eventId",
      summary: "Update draft event setup fields",
      pathParams: z.object({ organizerId: z.string().min(1), eventId: z.string().min(1) }),
      headers: consoleRequestHeadersSchema,
      body: updateEventRequestSchema,
      responses: {
        200: eventDetailResponseSchema,
        ...standardErrors,
      },
    },
    deleteOrganizerEvent: {
      method: "DELETE",
      path: "/console/organizers/:organizerId/events/:eventId",
      summary: "Delete a draft event",
      pathParams: z.object({ organizerId: z.string().min(1), eventId: z.string().min(1) }),
      headers: consoleRequestHeadersSchema,
      responses: {
        200: eventDeleteResponseSchema,
        ...standardErrors,
      },
    },
    createOrganizerEventCategory: {
      method: "POST",
      path: "/console/organizers/:organizerId/events/:eventId/categories",
      summary: "Create a draft event category",
      pathParams: z.object({ organizerId: z.string().min(1), eventId: z.string().min(1) }),
      headers: consoleRequestHeadersSchema,
      body: createEventCategoryRequestSchema,
      responses: {
        201: eventDetailResponseSchema,
        ...standardErrors,
      },
    },
    updateOrganizerEventCategory: {
      method: "PATCH",
      path: "/console/organizers/:organizerId/events/:eventId/categories/:categoryId",
      summary: "Update a draft event category",
      pathParams: z.object({
        organizerId: z.string().min(1),
        eventId: z.string().min(1),
        categoryId: z.string().min(1),
      }),
      headers: consoleRequestHeadersSchema,
      body: updateEventCategoryRequestSchema,
      responses: {
        200: eventDetailResponseSchema,
        ...standardErrors,
      },
    },
    deleteOrganizerEventCategory: {
      method: "DELETE",
      path: "/console/organizers/:organizerId/events/:eventId/categories/:categoryId",
      summary: "Delete a draft event category",
      pathParams: z.object({
        organizerId: z.string().min(1),
        eventId: z.string().min(1),
        categoryId: z.string().min(1),
      }),
      headers: consoleRequestHeadersSchema,
      responses: {
        200: eventDetailResponseSchema,
        ...standardErrors,
      },
    },
    createOrganizerEventFeeTier: {
      method: "POST",
      path: "/console/organizers/:organizerId/events/:eventId/categories/:categoryId/fee-tiers",
      summary: "Create a fee tier for a draft event category",
      pathParams: z.object({
        organizerId: z.string().min(1),
        eventId: z.string().min(1),
        categoryId: z.string().min(1),
      }),
      headers: consoleRequestHeadersSchema,
      body: createEventFeeTierRequestSchema,
      responses: {
        201: eventDetailResponseSchema,
        ...standardErrors,
      },
    },
    updateOrganizerEventFeeTier: {
      method: "PATCH",
      path: "/console/organizers/:organizerId/events/:eventId/categories/:categoryId/fee-tiers/:tierId",
      summary: "Update a draft event category fee tier",
      pathParams: z.object({
        organizerId: z.string().min(1),
        eventId: z.string().min(1),
        categoryId: z.string().min(1),
        tierId: z.string().min(1),
      }),
      headers: consoleRequestHeadersSchema,
      body: updateEventFeeTierRequestSchema,
      responses: {
        200: eventDetailResponseSchema,
        ...standardErrors,
      },
    },
    deleteOrganizerEventFeeTier: {
      method: "DELETE",
      path: "/console/organizers/:organizerId/events/:eventId/categories/:categoryId/fee-tiers/:tierId",
      summary: "Delete a draft event category fee tier",
      pathParams: z.object({
        organizerId: z.string().min(1),
        eventId: z.string().min(1),
        categoryId: z.string().min(1),
        tierId: z.string().min(1),
      }),
      headers: consoleRequestHeadersSchema,
      responses: {
        200: eventDetailResponseSchema,
        ...standardErrors,
      },
    },
    getOrganizerEventReadiness: {
      method: "GET",
      path: "/console/organizers/:organizerId/events/:eventId/readiness",
      summary: "Compute event readiness checks",
      pathParams: z.object({ organizerId: z.string().min(1), eventId: z.string().min(1) }),
      headers: consoleRequestHeadersSchema,
      responses: {
        200: eventReadinessResponseSchema,
        ...standardErrors,
      },
    },
    markOrganizerEventReady: {
      method: "POST",
      path: "/console/organizers/:organizerId/events/:eventId/ready",
      summary: "Mark a draft event ready if blocking checks pass",
      pathParams: z.object({ organizerId: z.string().min(1), eventId: z.string().min(1) }),
      headers: consoleRequestHeadersSchema,
      body: z.object({}).optional(),
      responses: {
        200: eventReadyTransitionResponseSchema,
        ...standardErrors,
      },
    },
    revertOrganizerEventToDraft: {
      method: "POST",
      path: "/console/organizers/:organizerId/events/:eventId/revert-to-draft",
      summary: "Revert a ready event to draft for further edits",
      pathParams: z.object({ organizerId: z.string().min(1), eventId: z.string().min(1) }),
      headers: consoleRequestHeadersSchema,
      body: z.object({}).optional(),
      responses: {
        200: eventTransitionResponseSchema,
        ...standardErrors,
      },
    },
    publishOrganizerEvent: {
      method: "POST",
      path: "/console/organizers/:organizerId/events/:eventId/publish",
      summary: "Publish a ready event",
      pathParams: z.object({ organizerId: z.string().min(1), eventId: z.string().min(1) }),
      headers: consoleRequestHeadersSchema,
      body: z.object({}).optional(),
      responses: {
        200: eventTransitionResponseSchema,
        ...standardErrors,
      },
    },
    adminListOrganizers: {
      method: "GET",
      path: "/admin/organizers",
      summary: "List all organizers for platform admin membership assignment",
      query: z
        .object({
          reviewStatus: organizerReviewStatusSchema.optional(),
        })
        .optional(),
      headers: consoleRequestHeadersSchema,
      responses: {
        200: adminOrganizersResponseSchema,
        ...standardErrors,
      },
    },
    adminListOrganizerMembers: {
      method: "GET",
      path: "/admin/organizer-memberships",
      summary: "List organizer memberships for platform admins",
      headers: consoleRequestHeadersSchema,
      responses: {
        200: adminOrganizerMembersResponseSchema,
        ...standardErrors,
      },
    },
    adminCreateOrganizerMembership: {
      method: "POST",
      path: "/admin/organizer-memberships",
      summary: "Assign a Better Auth user to an organizer role",
      headers: consoleRequestHeadersSchema,
      body: createOrganizerMembershipRequestSchema,
      responses: {
        201: adminOrganizerMembersResponseSchema,
        ...standardErrors,
      },
    },
    adminUpdateOrganizerMembership: {
      method: "PATCH",
      path: "/admin/organizer-memberships/:membershipId",
      summary: "Update organizer membership role or status",
      pathParams: z.object({ membershipId: z.string().min(1) }),
      headers: consoleRequestHeadersSchema,
      body: updateOrganizerMembershipRequestSchema,
      responses: {
        200: adminOrganizerMembersResponseSchema,
        ...standardErrors,
      },
    },
    onboardingStatus: {
      method: "GET",
      path: "/console/onboarding",
      summary: "Current user's organizer onboarding state",
      headers: consoleRequestHeadersSchema,
      responses: {
        200: onboardingStatusResponseSchema,
        ...standardErrors,
      },
    },
    createOrganizerOnboarding: {
      method: "POST",
      path: "/console/onboarding/organizer",
      summary: "Create an organizer profile and owner membership for the current verified user",
      headers: consoleRequestHeadersSchema,
      body: createOrganizerOnboardingRequestSchema,
      responses: {
        201: organizerOnboardingResponseSchema,
        ...standardErrors,
      },
    },
    adminGetOrganizer: {
      method: "GET",
      path: "/admin/organizers/:organizerId",
      summary: "Get organizer profile and membership detail for platform admin review",
      pathParams: z.object({ organizerId: z.string().min(1) }),
      headers: consoleRequestHeadersSchema,
      responses: {
        200: adminOrganizerDetailResponseSchema,
        ...standardErrors,
      },
    },
    adminReviewOrganizer: {
      method: "PATCH",
      path: "/admin/organizers/:organizerId/review",
      summary: "Approve, request changes, reject, or suspend an organizer",
      pathParams: z.object({ organizerId: z.string().min(1) }),
      headers: consoleRequestHeadersSchema,
      body: adminReviewOrganizerRequestSchema,
      responses: {
        200: adminOrganizerDetailResponseSchema,
        ...standardErrors,
      },
    },
    adminUpdateOrganizerPaymentAccount: {
      method: "PATCH",
      path: "/admin/organizers/:organizerId/payment-account",
      summary: "Set organizer payment readiness while Razorpay KYC integration is deferred",
      pathParams: z.object({ organizerId: z.string().min(1) }),
      headers: consoleRequestHeadersSchema,
      body: updateOrganizerPaymentAccountRequestSchema,
      responses: {
        200: adminOrganizerDetailResponseSchema,
        ...standardErrors,
      },
    },
  },
  { strictStatusCodes: true },
);
