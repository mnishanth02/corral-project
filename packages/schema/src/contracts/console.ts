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
  createOrganizerMembershipRequestSchema,
  createOrganizerOnboardingRequestSchema,
  errorResponseSchema,
  onboardingStatusResponseSchema,
  organizerOnboardingResponseSchema,
  organizerReviewStatusSchema,
  updateOrganizerMembershipRequestSchema,
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
  },
  { strictStatusCodes: true },
);
