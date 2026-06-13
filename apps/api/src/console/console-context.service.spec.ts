import { roleCapabilities } from "@corral/schema";
import type { Request } from "express";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ConsoleContextService } from "./console-context.service";

const { getSession, queryClient } = vi.hoisted(() => ({
  getSession: vi.fn(),
  queryClient: Object.assign(vi.fn(), { begin: vi.fn() }),
}));

vi.mock("../auth/auth", () => ({
  auth: {
    api: {
      getSession,
    },
  },
}));

vi.mock("@corral/db", () => ({
  queryClient,
}));

const request = {
  headers: {
    cookie: "better-auth.session_token=test",
  },
} as unknown as Request;

const validEnv = {
  DATABASE_URL: "postgres://corral:corral@localhost:5432/corral",
  REDIS_URL: "redis://localhost:6379",
  CORS_ORIGINS: "http://localhost:5274",
  API_PORT: "3000",
  NODE_ENV: "test",
  BETTER_AUTH_SECRET: "a".repeat(32),
  BETTER_AUTH_URL: "http://localhost:3000",
  BETTER_AUTH_TRUSTED_ORIGINS: "http://localhost:5274",
  GOOGLE_CLIENT_ID: "google-client-id",
  GOOGLE_CLIENT_SECRET: "google-client-secret",
};

const user = {
  id: "user-owner",
  email: "owner@example.com",
  name: "Owner User",
  image: null,
  emailVerified: true,
  role: "user",
};

const adminUser = {
  ...user,
  id: "platform-admin",
  role: "admin",
};

const membershipRow = {
  membership_id: "om-owner",
  role: "Owner",
  status: "active",
  organizer_id: "org-kovai-road-runners",
  organizer_slug: "kovai-road-runners",
  organizer_name: "Kovai Road Runners",
  legal_name: "Kovai Road Runners Foundation",
  owner_email: "owner@example.com",
  organizer_city: "Coimbatore",
  organizer_state: "Tamil Nadu",
  review_status: "approved",
  entity_type: "gst",
  gstin: "33AAECK1042R1Z5",
  billing_address: "Race Course Road, Coimbatore",
  finance_contact: "finance@example.com",
  payment_account_status: "verified",
  support_contact: "support@example.com",
};

const eventRow = {
  id: "coimbatore-marathon-2026",
  organizer_id: "org-kovai-road-runners",
  slug: "coimbatore-marathon-2026",
  name: "Coimbatore Marathon 2026",
  status: "published",
  date: "2026-08-09",
  starts_at: "2026-08-09T00:30:00.000Z",
  venue_name: "VOC Park",
  venue_address: "VOC Park, Coimbatore",
  city: "Coimbatore",
  timezone: "Asia/Kolkata",
};

const adminMembershipRow = {
  ...membershipRow,
  user_id: "user-owner",
  user_email: "owner@example.com",
  user_name: "Owner User",
  last_active_at: null,
  created_at: new Date("2026-01-01T00:00:00.000Z"),
};

const adminOrganizerDetailRow = {
  id: "org-kovai-road-runners",
  slug: "kovai-road-runners",
  name: "Kovai Road Runners",
  legal_name: "Kovai Road Runners Foundation",
  owner_email: "owner@example.com",
  city: "Coimbatore",
  state: "Tamil Nadu",
  review_status: "approved",
  entity_type: "gst",
  gstin: "33AAECK1042R1Z5",
  billing_address: "Race Course Road, Coimbatore",
  finance_contact: "finance@example.com",
  payment_account_status: "verified",
  support_contact: "support@example.com",
  created_by_user_id: "user-owner",
  reviewed_by_user_id: "platform-admin",
  reviewed_at: new Date("2026-01-02T00:00:00.000Z"),
  review_reason: "Looks good.",
  created_at: new Date("2026-01-01T00:00:00.000Z"),
  updated_at: new Date("2026-01-02T00:00:00.000Z"),
};

const eventDetailRow = {
  ...eventRow,
  status: "draft",
  registration_opens_at: "2026-06-01T00:00:00.000Z",
  registration_closes_at: "2026-08-08T00:00:00.000Z",
  description: "A city marathon.",
  map_url: "https://maps.example/race",
  contact_email: "race@example.com",
  contact_phone: null,
  race_instructions: "Arrive 60 minutes early.",
  waiver_text: "I accept the waiver.",
  refund_policy: "No refunds after registration closes.",
  medical_declaration: "I am fit to participate.",
  form_fields: ["dateOfBirth", "emergencyContact"],
  tshirt_sizes: ["S", "M", "L"],
  logo_url: null,
  banner_url: null,
  ready_at: null,
  published_at: null,
  published_by_user_id: null,
  created_by_user_id: "user-owner",
  organizer_review_status: "approved",
  organizer_payment_account_status: "verified",
};

const categoryRow = {
  id: "cat-10k",
  event_id: "coimbatore-marathon-2026",
  label: "10K",
  distance: "10K",
  min_age: 14,
  max_age: null,
  capacity: 500,
  registered_count: 0,
  sort_order: 0,
  status: "active",
};

const feeTierRow = {
  id: "tier-early",
  category_id: "cat-10k",
  label: "Early bird",
  amount_in_paise: 120_000,
  starts_at: null,
  ends_at: null,
  registration_cap: null,
  registration_count: 0,
  is_active: true,
};

const trustedRequest = {
  headers: {
    cookie: "better-auth.session_token=test",
    origin: "http://localhost:5274",
  },
} as unknown as Request;

describe("ConsoleContextService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    for (const [key, value] of Object.entries(validEnv)) {
      vi.stubEnv(key, value);
    }
    getSession.mockResolvedValue({ user, session: { id: "session-id" } });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("rejects unauthenticated console requests", async () => {
    getSession.mockResolvedValue(null);

    await expect(new ConsoleContextService().getConsoleMe(request)).rejects.toMatchObject({
      status: 401,
      message: "Sign in to continue.",
    });
  });

  it("returns memberships, organizer capabilities, events, and defaults for the current user", async () => {
    queryClient.mockResolvedValueOnce([membershipRow]).mockResolvedValueOnce([eventRow]);

    const response = await new ConsoleContextService().getConsoleMe(request);

    expect(response.user).toMatchObject({
      id: user.id,
      email: user.email,
      isPlatformAdmin: false,
      platformCapabilities: [],
    });
    expect(response.memberships).toEqual([
      expect.objectContaining({
        id: "om-owner",
        role: "Owner",
        capabilities: roleCapabilities.Owner,
        organizer: expect.objectContaining({
          id: "org-kovai-road-runners",
          slug: "kovai-road-runners",
        }),
      }),
    ]);
    expect(response.events).toEqual([
      expect.objectContaining({
        id: "coimbatore-marathon-2026",
        organizerId: "org-kovai-road-runners",
      }),
    ]);
    expect(response.defaultOrganizerId).toBe("org-kovai-road-runners");
    expect(response.defaultEventId).toBe("coimbatore-marathon-2026");
  });

  it("requires membership before listing organizer events", async () => {
    queryClient.mockResolvedValueOnce([]);

    await expect(
      new ConsoleContextService().listCurrentUserOrganizerEvents(request, "org-kovai-road-runners"),
    ).rejects.toMatchObject({
      status: 403,
      message: "You do not have access to this organizer.",
    });
  });

  it("requires a Better Auth admin role for admin membership APIs", async () => {
    await expect(
      new ConsoleContextService().listAdminOrganizerMembers(request),
    ).rejects.toMatchObject({
      status: 403,
      message: "Corral admin access is required.",
    });
  });

  it("maps platform admins and admin memberships", async () => {
    getSession.mockResolvedValue({ user: adminUser, session: { id: "session-id" } });
    queryClient.mockResolvedValueOnce([adminMembershipRow]);

    const response = await new ConsoleContextService().listAdminOrganizerMembers(request);

    expect(response.memberships).toEqual([
      expect.objectContaining({
        id: "om-owner",
        role: "Owner",
        status: "active",
        user: {
          id: "user-owner",
          email: "owner@example.com",
          name: "Owner User",
        },
        createdAt: "2026-01-01T00:00:00.000Z",
      }),
    ]);
  });

  it("lists organizer review queues for platform admins", async () => {
    getSession.mockResolvedValue({ user: adminUser, session: { id: "session-id" } });
    queryClient.mockResolvedValueOnce([{ ...adminOrganizerDetailRow, review_status: "pending" }]);

    const response = await new ConsoleContextService().listAdminOrganizers(request, {
      reviewStatus: "pending",
    });

    expect(queryClient).toHaveBeenCalledTimes(1);
    expect(response.organizers).toEqual([
      expect.objectContaining({
        id: "org-kovai-road-runners",
        reviewStatus: "pending",
      }),
    ]);
  });

  it("creates an organizer and owner membership for a verified self-signup user", async () => {
    const transaction = vi
      .fn()
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ ...membershipRow, review_status: "pending" }]);
    queryClient.begin.mockImplementationOnce(async (handler) => handler(transaction));

    const response = await new ConsoleContextService().createOrganizerOnboarding(trustedRequest, {
      name: "New Running Club",
      legalName: "New Running Club Trust",
      entityType: "non-gst",
      phone: "+91 98765 00000",
      city: "Coimbatore",
      state: "Tamil Nadu",
      supportContact: "support@newrunning.example",
    });

    expect(queryClient.begin).toHaveBeenCalledTimes(1);
    expect(response.organizer.reviewStatus).toBe("pending");
    expect(response.membership.role).toBe("Owner");
    expect(response.membership.status).toBe("active");
  });

  it("requires verified email before organizer self-onboarding", async () => {
    getSession.mockResolvedValue({
      user: { ...user, emailVerified: false },
      session: { id: "session-id" },
    });

    await expect(
      new ConsoleContextService().createOrganizerOnboarding(trustedRequest, {
        name: "New Running Club",
        legalName: "New Running Club Trust",
        entityType: "non-gst",
        phone: "+91 98765 00000",
        city: "Coimbatore",
        state: "Tamil Nadu",
        supportContact: "support@newrunning.example",
      }),
    ).rejects.toMatchObject({
      status: 403,
      message: "Verify your email before creating an organizer profile.",
    });
  });

  it("requires an Origin header for organizer self-onboarding", async () => {
    await expect(
      new ConsoleContextService().createOrganizerOnboarding(request, {
        name: "New Running Club",
        legalName: "New Running Club Trust",
        entityType: "non-gst",
        phone: "+91 98765 00000",
        city: "Coimbatore",
        state: "Tamil Nadu",
        supportContact: "support@newrunning.example",
      }),
    ).rejects.toMatchObject({
      status: 403,
      message: "Request origin is required.",
    });
  });

  it("lets platform admins review organizer profiles", async () => {
    getSession.mockResolvedValue({ user: adminUser, session: { id: "session-id" } });
    queryClient
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([adminOrganizerDetailRow])
      .mockResolvedValueOnce([adminMembershipRow]);

    const response = await new ConsoleContextService().reviewAdminOrganizer(
      trustedRequest,
      "org-kovai-road-runners",
      {
        reviewStatus: "approved",
        reviewReason: "Looks good.",
      },
    );

    expect(response.organizer.reviewStatus).toBe("approved");
    expect(response.organizer.reviewedByUserId).toBe("platform-admin");
    expect(response.memberships).toHaveLength(1);
  });

  it("rejects duplicate organizer membership assignment", async () => {
    getSession.mockResolvedValue({ user: adminUser, session: { id: "session-id" } });
    queryClient
      .mockResolvedValueOnce([{ id: "user-owner" }])
      .mockResolvedValueOnce([{ id: "org-kovai-road-runners" }])
      .mockResolvedValueOnce([{ id: "om-owner" }]);

    await expect(
      new ConsoleContextService().createAdminOrganizerMembership(request, {
        userId: "user-owner",
        organizerId: "org-kovai-road-runners",
        role: "Admin",
        status: "active",
      }),
    ).rejects.toMatchObject({
      status: 409,
      message: "This user is already assigned to the organizer.",
    });
  });

  it("rejects admin membership mutations from untrusted browser origins", async () => {
    getSession.mockResolvedValue({ user: adminUser, session: { id: "session-id" } });

    await expect(
      new ConsoleContextService().createAdminOrganizerMembership(
        {
          headers: {
            cookie: "better-auth.session_token=test",
            origin: "https://evil.example",
          },
        } as unknown as Request,
        {
          userId: "user-owner",
          organizerId: "org-kovai-road-runners",
          role: "Admin",
          status: "active",
        },
      ),
    ).rejects.toMatchObject({
      status: 403,
      message: "Request origin is not trusted.",
    });
  });

  it("requires a role or status when updating a membership", async () => {
    getSession.mockResolvedValue({ user: adminUser, session: { id: "session-id" } });
    queryClient.mockResolvedValueOnce([{ id: "om-owner" }]);

    await expect(
      new ConsoleContextService().updateAdminOrganizerMembership(request, "om-owner", {}),
    ).rejects.toMatchObject({
      status: 400,
      message: "Provide a role or status to update.",
    });
  });

  it("creates draft events only for approved organizers with event write access", async () => {
    const transaction = vi.fn().mockResolvedValueOnce([]);
    queryClient.begin.mockImplementationOnce(async (handler) => handler(transaction));
    queryClient
      .mockResolvedValueOnce([membershipRow])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([eventDetailRow])
      .mockResolvedValueOnce([]);

    const response = await new ConsoleContextService().createOrganizerEvent(
      trustedRequest,
      "org-kovai-road-runners",
      { name: "Coimbatore Marathon 2026" },
    );

    expect(queryClient.begin).toHaveBeenCalledTimes(1);
    expect(response.event).toMatchObject({
      id: "coimbatore-marathon-2026",
      organizerId: "org-kovai-road-runners",
      status: "draft",
      readiness: expect.objectContaining({ ready: false }),
    });
  });

  it("blocks event creation for unapproved organizers", async () => {
    queryClient.mockResolvedValueOnce([{ ...membershipRow, review_status: "pending" }]);

    await expect(
      new ConsoleContextService().createOrganizerEvent(trustedRequest, "org-kovai-road-runners", {
        name: "Coimbatore Marathon 2026",
      }),
    ).rejects.toMatchObject({
      status: 403,
      message: "Only approved organizers can create events.",
    });
  });

  it("marks a complete draft event ready", async () => {
    queryClient
      .mockResolvedValueOnce([membershipRow])
      .mockResolvedValueOnce([eventDetailRow])
      .mockResolvedValueOnce([eventDetailRow])
      .mockResolvedValueOnce([categoryRow])
      .mockResolvedValueOnce([feeTierRow])
      .mockResolvedValueOnce([]);

    const response = await new ConsoleContextService().markOrganizerEventReady(
      trustedRequest,
      "org-kovai-road-runners",
      "coimbatore-marathon-2026",
    );

    expect(response.transitioned).toBe(true);
    expect(response.readiness.ready).toBe(true);
  });

  it("returns readiness blockers without transitioning incomplete drafts", async () => {
    queryClient
      .mockResolvedValueOnce([membershipRow])
      .mockResolvedValueOnce([{ ...eventDetailRow, waiver_text: null }])
      .mockResolvedValueOnce([{ ...eventDetailRow, waiver_text: null }])
      .mockResolvedValueOnce([categoryRow])
      .mockResolvedValueOnce([feeTierRow]);

    const response = await new ConsoleContextService().markOrganizerEventReady(
      trustedRequest,
      "org-kovai-road-runners",
      "coimbatore-marathon-2026",
    );

    expect(response.transitioned).toBe(false);
    expect(response.readiness.blocking).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: "waiver" })]),
    );
  });

  it("rejects category updates that would invert min and max age", async () => {
    queryClient
      .mockResolvedValueOnce([membershipRow])
      .mockResolvedValueOnce([eventDetailRow])
      .mockResolvedValueOnce([{ ...categoryRow, min_age: 14, max_age: 40 }]);

    await expect(
      new ConsoleContextService().updateOrganizerEventCategory(
        trustedRequest,
        "org-kovai-road-runners",
        "coimbatore-marathon-2026",
        "cat-10k",
        { minAge: 50 },
      ),
    ).rejects.toMatchObject({
      status: 400,
      message: "Minimum age cannot be greater than maximum age.",
    });
  });

  it("requires at least one active category before marking ready", async () => {
    queryClient
      .mockResolvedValueOnce([membershipRow])
      .mockResolvedValueOnce([eventDetailRow])
      .mockResolvedValueOnce([eventDetailRow])
      .mockResolvedValueOnce([{ ...categoryRow, status: "hidden" }])
      .mockResolvedValueOnce([feeTierRow]);

    const response = await new ConsoleContextService().markOrganizerEventReady(
      trustedRequest,
      "org-kovai-road-runners",
      "coimbatore-marathon-2026",
    );

    expect(response.transitioned).toBe(false);
    expect(response.readiness.blocking).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: "active-categories" })]),
    );
  });

  it("blocks publish until organizer payment account is verified", async () => {
    queryClient
      .mockResolvedValueOnce([{ ...membershipRow, payment_account_status: "pending" }])
      .mockResolvedValueOnce([{ ...eventDetailRow, status: "ready" }])
      .mockResolvedValueOnce([categoryRow])
      .mockResolvedValueOnce([feeTierRow]);

    await expect(
      new ConsoleContextService().publishOrganizerEvent(
        trustedRequest,
        "org-kovai-road-runners",
        "coimbatore-marathon-2026",
      ),
    ).rejects.toMatchObject({
      status: 409,
      message: "Verify the organizer payment account before publishing.",
    });
  });

  it("lets platform admins update organizer payment account status", async () => {
    getSession.mockResolvedValue({ user: adminUser, session: { id: "session-id" } });
    queryClient
      .mockResolvedValueOnce([{ id: "org-kovai-road-runners" }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ ...adminOrganizerDetailRow, payment_account_status: "verified" }])
      .mockResolvedValueOnce([adminMembershipRow]);

    const response = await new ConsoleContextService().updateAdminOrganizerPaymentAccount(
      trustedRequest,
      "org-kovai-road-runners",
      "verified",
    );

    expect(response.organizer.paymentAccountStatus).toBe("verified");
  });

  it("surfaces invalid stored roles as sanitized console API errors", async () => {
    queryClient.mockResolvedValueOnce([{ ...membershipRow, role: "Superuser" }]);
    const result = new ConsoleContextService().getConsoleMe(request);

    await expect(result).rejects.toMatchObject({
      status: 400,
      message: "Stored organizer member role is invalid.",
    });
  });
});
