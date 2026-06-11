import { randomUUID } from "node:crypto";
import { queryClient } from "@corral/db";
import {
  type AdminOrganizerMember,
  type AdminReviewOrganizerRequest,
  type ConsoleEvent,
  type ConsoleMembership,
  type ConsoleMeResponse,
  type ConsoleRequestHeaders,
  type CreateOrganizerOnboardingRequest,
  type OnboardingStatusResponse,
  type OrganizerOnboardingResponse,
  type OrganizerReviewStatus,
  type OrganizerSummary,
  platformAdminCapabilities,
  roleCapabilities,
  type TeamRole,
  teamRoleSchema,
} from "@corral/schema";
import { Injectable } from "@nestjs/common";
import type { Request } from "express";
import { auth } from "../auth/auth";
import { getEnv, parseCsv } from "../env";

type BetterAuthSession = NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>;
type BetterAuthUser = BetterAuthSession["user"];

type OrganizerRow = {
  id: string;
  slug: string;
  name: string;
  legal_name: string;
  owner_email: string;
  city: string;
  state: string;
  review_status: OrganizerReviewStatus;
  entity_type: OrganizerSummary["entityType"];
  gstin: string | null;
  billing_address: string | null;
  finance_contact: string | null;
  payment_account_status: OrganizerSummary["paymentAccountStatus"];
  support_contact: string;
};

type MembershipRow = {
  membership_id: string;
  role: string;
  status: string;
  organizer_id: string;
  organizer_slug: string;
  organizer_name: string;
  legal_name: string;
  owner_email: string;
  organizer_city: string;
  organizer_state: string;
  review_status: OrganizerReviewStatus;
  entity_type: OrganizerSummary["entityType"];
  gstin: string | null;
  billing_address: string | null;
  finance_contact: string | null;
  payment_account_status: OrganizerSummary["paymentAccountStatus"];
  support_contact: string;
};

type EventRow = {
  id: string;
  organizer_id: string;
  slug: string;
  name: string;
  status: ConsoleEvent["status"];
  date: string;
  starts_at: string;
  venue_name: string;
  venue_address: string;
  city: string;
  timezone: string;
};

type AdminMembershipRow = MembershipRow & {
  user_id: string;
  user_email: string;
  user_name: string;
  last_active_at: Date | string | null;
  created_at: Date | string;
};

type AdminOrganizerDetailRow = OrganizerRow & {
  created_by_user_id: string | null;
  reviewed_by_user_id: string | null;
  reviewed_at: Date | string | null;
  review_reason: string | null;
  created_at: Date | string;
  updated_at: Date | string;
};

type HeaderSource = ConsoleRequestHeaders | Pick<Request, "headers">;

export class ConsoleApiError extends Error {
  constructor(
    readonly status: 400 | 401 | 403 | 404 | 409,
    message: string,
  ) {
    super(message);
  }
}

@Injectable()
export class ConsoleContextService {
  async getConsoleMe(headers: HeaderSource): Promise<ConsoleMeResponse> {
    const session = await this.requireSession(headers);
    const memberships = await this.getMembershipsForUser(session.user.id);
    const organizerIds = memberships.map((membership) => membership.organizer.id);
    const events = organizerIds.length > 0 ? await this.getEventsForOrganizers(organizerIds) : [];

    return {
      user: mapUser(session.user),
      memberships,
      events,
      defaultOrganizerId: memberships[0]?.organizer.id ?? null,
      defaultEventId: events[0]?.id ?? null,
    };
  }

  async listCurrentUserOrganizers(
    headers: HeaderSource,
  ): Promise<{ organizers: OrganizerSummary[] }> {
    const session = await this.requireSession(headers);
    const memberships = await this.getMembershipsForUser(session.user.id);

    return { organizers: memberships.map((membership) => membership.organizer) };
  }

  async listCurrentUserOrganizerEvents(
    headers: HeaderSource,
    organizerId: string,
  ): Promise<{ events: ConsoleEvent[] }> {
    const session = await this.requireSession(headers);
    const memberships = await this.getMembershipsForUser(session.user.id);
    const membership = memberships.find((item) => item.organizer.id === organizerId);

    if (!membership) {
      throw new ConsoleApiError(403, "You do not have access to this organizer.");
    }

    return { events: await this.getEventsForOrganizers([organizerId]) };
  }

  async listAdminOrganizers(
    headers: HeaderSource,
    options: { reviewStatus?: OrganizerReviewStatus } = {},
  ): Promise<{ organizers: OrganizerSummary[] }> {
    await this.requirePlatformAdmin(headers);
    const rows = options.reviewStatus
      ? await queryClient<OrganizerRow[]>`
          SELECT
            id, slug, name, legal_name, owner_email, city, state, review_status, entity_type,
            gstin, billing_address, finance_contact, payment_account_status, support_contact
          FROM organizer
          WHERE review_status = ${options.reviewStatus}
          ORDER BY name ASC
        `
      : await queryClient<OrganizerRow[]>`
          SELECT
            id, slug, name, legal_name, owner_email, city, state, review_status, entity_type,
            gstin, billing_address, finance_contact, payment_account_status, support_contact
          FROM organizer
          ORDER BY name ASC
        `;
    return { organizers: rows.map(mapOrganizer) };
  }

  async getOnboardingStatus(headers: HeaderSource): Promise<OnboardingStatusResponse> {
    const session = await this.requireSession(headers);
    const memberships = await this.getMembershipsForUser(session.user.id, { activeOnly: false });

    return {
      canCreateOrganizer:
        session.user.emailVerified === true &&
        memberships.length === 0 &&
        !isPlatformAdmin(session.user),
      organizer: memberships[0]?.organizer ?? null,
    };
  }

  async createOrganizerOnboarding(
    headers: HeaderSource,
    input: CreateOrganizerOnboardingRequest,
  ): Promise<OrganizerOnboardingResponse> {
    const session = await this.requireSession(headers);
    this.requireVerifiedEmail(session.user);
    this.requireTrustedMutationOrigin(headers, { requireOrigin: true });

    const membershipRow = await queryClient.begin(async (transaction) => {
      const existingMemberships = await transaction<Array<{ id: string }>>`
        SELECT id
        FROM organizer_member
        WHERE user_id = ${session.user.id}
        LIMIT 1
      `;

      if (existingMemberships[0]) {
        throw new ConsoleApiError(409, "This user already has organizer access.");
      }

      const existingCreatedOrganizer = await transaction<Array<{ id: string }>>`
        SELECT id
        FROM organizer
        WHERE created_by_user_id = ${session.user.id}
        LIMIT 1
      `;

      if (existingCreatedOrganizer[0]) {
        throw new ConsoleApiError(409, "This user already created an organizer profile.");
      }

      const organizerId = `org-${randomUUID()}`;
      const baseSlug = slugify(input.name);
      let slug: string | null = null;

      for (let attempt = 0; attempt < 20; attempt += 1) {
        const candidate = attempt === 0 ? baseSlug : `${baseSlug}-${attempt + 1}`;
        const existing = await transaction<Array<{ id: string }>>`
          SELECT id
          FROM organizer
          WHERE slug = ${candidate}
          LIMIT 1
        `;

        if (!existing[0]) {
          slug = candidate;
          break;
        }
      }

      slug ??= `${baseSlug}-${randomUUID().slice(0, 8)}`;
      const membershipId = `om-${randomUUID()}`;

      await transaction`
        INSERT INTO organizer (
          id, slug, name, legal_name, owner_email, phone, city, state, gstin,
          review_status, entity_type, billing_address, finance_contact, payment_account_status,
          support_contact, created_by_user_id
        )
        VALUES (
          ${organizerId}, ${slug}, ${input.name}, ${input.legalName}, ${session.user.email},
          ${input.phone}, ${input.city}, ${input.state}, ${input.gstin ?? null}, 'pending',
          ${input.entityType}, ${input.billingAddress ?? null}, ${input.financeContact ?? null},
          'not-started', ${input.supportContact}, ${session.user.id}
        )
      `;

      await transaction`
        INSERT INTO organizer_member (id, organizer_id, user_id, role, status, invited_email)
        VALUES (${membershipId}, ${organizerId}, ${session.user.id}, 'Owner', 'active', ${session.user.email})
      `;

      const rows = await transaction<MembershipRow[]>`
        SELECT
          om.id AS membership_id,
          om.role,
          om.status,
          o.id AS organizer_id,
          o.slug AS organizer_slug,
          o.name AS organizer_name,
          o.legal_name,
          o.owner_email,
          o.city AS organizer_city,
          o.state AS organizer_state,
          o.review_status,
          o.entity_type,
          o.gstin,
          o.billing_address,
          o.finance_contact,
          o.payment_account_status,
          o.support_contact
        FROM organizer_member om
        INNER JOIN organizer o ON om.organizer_id = o.id
        WHERE om.id = ${membershipId}
        LIMIT 1
      `;

      return rows[0];
    });

    if (!membershipRow) {
      throw new ConsoleApiError(404, "Organizer profile was not created.");
    }

    const role = parseTeamRole(membershipRow.role);

    return {
      organizer: mapMembershipOrganizer(membershipRow),
      membership: {
        id: membershipRow.membership_id,
        organizer: mapMembershipOrganizer(membershipRow),
        role,
        status: parseMembershipStatus(membershipRow.status),
        capabilities: [...roleCapabilities[role]],
      },
    };
  }

  async listAdminOrganizerMembers(
    headers: HeaderSource,
  ): Promise<{ memberships: AdminOrganizerMember[] }> {
    await this.requirePlatformAdmin(headers);
    return { memberships: await this.getAdminMemberships() };
  }

  async getAdminOrganizer(
    headers: HeaderSource,
    organizerId: string,
  ): Promise<{
    organizer: ReturnType<typeof mapAdminOrganizerDetail>;
    memberships: AdminOrganizerMember[];
  }> {
    await this.requirePlatformAdmin(headers);
    return this.getAdminOrganizerDetail(organizerId);
  }

  async reviewAdminOrganizer(
    headers: HeaderSource,
    organizerId: string,
    input: AdminReviewOrganizerRequest,
  ): Promise<{
    organizer: ReturnType<typeof mapAdminOrganizerDetail>;
    memberships: AdminOrganizerMember[];
  }> {
    const session = await this.requirePlatformAdmin(headers);
    this.requireTrustedMutationOrigin(headers, { requireOrigin: true });

    await queryClient`
      UPDATE organizer
      SET
        review_status = ${input.reviewStatus},
        reviewed_by_user_id = ${session.user.id},
        reviewed_at = NOW(),
        review_reason = ${input.reviewReason ?? null},
        updated_at = NOW()
      WHERE id = ${organizerId}
    `;

    return this.getAdminOrganizerDetail(organizerId);
  }

  async createAdminOrganizerMembership(
    headers: HeaderSource,
    input: {
      userId: string;
      organizerId: string;
      role: TeamRole;
      status: "active" | "invited" | "disabled";
    },
  ): Promise<{ memberships: AdminOrganizerMember[] }> {
    await this.requirePlatformAdmin(headers);
    this.requireTrustedMutationOrigin(headers);
    await this.requireUserExists(input.userId);
    await this.requireOrganizerExists(input.organizerId);

    const existing = await queryClient<Array<{ id: string }>>`
      SELECT id
      FROM organizer_member
      WHERE user_id = ${input.userId} AND organizer_id = ${input.organizerId}
      LIMIT 1
    `;

    if (existing[0]) {
      throw new ConsoleApiError(409, "This user is already assigned to the organizer.");
    }

    await queryClient`
      INSERT INTO organizer_member (id, user_id, organizer_id, role, status)
      VALUES (${`om-${randomUUID()}`}, ${input.userId}, ${input.organizerId}, ${input.role}, ${input.status})
    `;

    return { memberships: await this.getAdminMemberships() };
  }

  async updateAdminOrganizerMembership(
    headers: HeaderSource,
    membershipId: string,
    input: { role?: TeamRole; status?: "active" | "invited" | "disabled" },
  ): Promise<{ memberships: AdminOrganizerMember[] }> {
    await this.requirePlatformAdmin(headers);
    this.requireTrustedMutationOrigin(headers);

    const existing = await queryClient<Array<{ id: string }>>`
      SELECT id
      FROM organizer_member
      WHERE id = ${membershipId}
      LIMIT 1
    `;

    if (!existing[0]) {
      throw new ConsoleApiError(404, "Organizer membership was not found.");
    }

    if (!input.role && !input.status) {
      throw new ConsoleApiError(400, "Provide a role or status to update.");
    }

    await queryClient`
      UPDATE organizer_member
      SET
        role = COALESCE(${input.role ?? null}, role),
        status = COALESCE(${input.status ?? null}, status),
        updated_at = NOW()
      WHERE id = ${membershipId}
    `;

    return { memberships: await this.getAdminMemberships() };
  }

  private async requireSession(headers: HeaderSource): Promise<BetterAuthSession> {
    const session = await auth.api.getSession({ headers: requestHeaders(headers) });

    if (!session) {
      throw new ConsoleApiError(401, "Sign in to continue.");
    }

    return session;
  }

  private async requirePlatformAdmin(headers: HeaderSource): Promise<BetterAuthSession> {
    const session = await this.requireSession(headers);

    if (!isPlatformAdmin(session.user)) {
      throw new ConsoleApiError(403, "Corral admin access is required.");
    }

    return session;
  }

  private requireTrustedMutationOrigin(
    headers: HeaderSource,
    options: { requireOrigin?: boolean } = {},
  ): void {
    const origin = getHeaderValue(headers, "origin");

    if (!origin) {
      if (options.requireOrigin) {
        throw new ConsoleApiError(403, "Request origin is required.");
      }
      return;
    }

    const env = getEnv();
    const trustedOrigins = new Set([
      ...parseCsv(env.CORS_ORIGINS),
      ...parseCsv(env.BETTER_AUTH_TRUSTED_ORIGINS),
    ]);

    if (!trustedOrigins.has(origin)) {
      throw new ConsoleApiError(403, "Request origin is not trusted.");
    }
  }

  private requireVerifiedEmail(user: Pick<BetterAuthUser, "emailVerified">): void {
    if (user.emailVerified !== true) {
      throw new ConsoleApiError(403, "Verify your email before creating an organizer profile.");
    }
  }

  private async getMembershipsForUser(
    userId: string,
    options: { activeOnly?: boolean } = {},
  ): Promise<ConsoleMembership[]> {
    const activeOnly = options.activeOnly ?? true;
    const rows = await queryClient<MembershipRow[]>`
      SELECT
        om.id AS membership_id,
        om.role,
        om.status,
        o.id AS organizer_id,
        o.slug AS organizer_slug,
        o.name AS organizer_name,
        o.legal_name,
        o.owner_email,
        o.city AS organizer_city,
        o.state AS organizer_state,
        o.review_status,
        o.entity_type,
        o.gstin,
        o.billing_address,
        o.finance_contact,
        o.payment_account_status,
        o.support_contact
      FROM organizer_member om
      INNER JOIN organizer o ON om.organizer_id = o.id
      WHERE om.user_id = ${userId} AND (${activeOnly} = false OR om.status = 'active')
      ORDER BY o.name ASC
    `;

    return rows.map((row) => {
      const role = parseTeamRole(row.role);

      return {
        id: row.membership_id,
        organizer: mapMembershipOrganizer(row),
        role,
        status: "active",
        capabilities: [...roleCapabilities[role]],
      };
    });
  }

  private async getEventsForOrganizers(organizerIds: string[]): Promise<ConsoleEvent[]> {
    const rows = await queryClient<EventRow[]>`
      SELECT id, organizer_id, slug, name, status, date, starts_at, venue_name, venue_address, city, timezone
      FROM event
      WHERE organizer_id = ANY(${organizerIds})
      ORDER BY date ASC, name ASC
    `;

    return rows.map((row) => ({
      id: row.id,
      organizerId: row.organizer_id,
      slug: row.slug,
      name: row.name,
      status: row.status as ConsoleEvent["status"],
      date: row.date,
      startsAt: row.starts_at,
      venueName: row.venue_name,
      venueAddress: row.venue_address,
      city: row.city,
      timezone: row.timezone,
    }));
  }

  private async getAdminMemberships(): Promise<AdminOrganizerMember[]> {
    const rows = await queryClient<AdminMembershipRow[]>`
      SELECT
        om.id AS membership_id,
        om.role,
        om.status,
        om.last_active_at,
        om.created_at,
        o.id AS organizer_id,
        o.slug AS organizer_slug,
        o.name AS organizer_name,
        o.legal_name,
        o.owner_email,
        o.city AS organizer_city,
        o.state AS organizer_state,
        o.review_status,
        o.entity_type,
        o.gstin,
        o.billing_address,
        o.finance_contact,
        o.payment_account_status,
        o.support_contact,
        u.id AS user_id,
        u.email AS user_email,
        u.name AS user_name
      FROM organizer_member om
      INNER JOIN organizer o ON om.organizer_id = o.id
      INNER JOIN "user" u ON om.user_id = u.id
      ORDER BY o.name ASC, u.email ASC
    `;

    return rows.map(mapAdminMembership);
  }

  private async requireUserExists(userId: string): Promise<void> {
    const rows = await queryClient<Array<{ id: string }>>`
      SELECT id
      FROM "user"
      WHERE id = ${userId}
      LIMIT 1
    `;

    if (!rows[0]) {
      throw new ConsoleApiError(404, "User was not found.");
    }
  }

  private async requireOrganizerExists(organizerId: string): Promise<void> {
    const rows = await queryClient<Array<{ id: string }>>`
      SELECT id
      FROM organizer
      WHERE id = ${organizerId}
      LIMIT 1
    `;

    if (!rows[0]) {
      throw new ConsoleApiError(404, "Organizer was not found.");
    }
  }

  private async getAdminOrganizerDetail(organizerId: string): Promise<{
    organizer: ReturnType<typeof mapAdminOrganizerDetail>;
    memberships: AdminOrganizerMember[];
  }> {
    const organizerRows = await queryClient<AdminOrganizerDetailRow[]>`
      SELECT
        id, slug, name, legal_name, owner_email, city, state, review_status, entity_type,
        gstin, billing_address, finance_contact, payment_account_status, support_contact,
        created_by_user_id, reviewed_by_user_id, reviewed_at, review_reason, created_at, updated_at
      FROM organizer
      WHERE id = ${organizerId}
      LIMIT 1
    `;

    const organizer = organizerRows[0];

    if (!organizer) {
      throw new ConsoleApiError(404, "Organizer was not found.");
    }

    const membershipRows = await queryClient<AdminMembershipRow[]>`
      SELECT
        om.id AS membership_id,
        om.role,
        om.status,
        om.last_active_at,
        om.created_at,
        o.id AS organizer_id,
        o.slug AS organizer_slug,
        o.name AS organizer_name,
        o.legal_name,
        o.owner_email,
        o.city AS organizer_city,
        o.state AS organizer_state,
        o.review_status,
        o.entity_type,
        o.gstin,
        o.billing_address,
        o.finance_contact,
        o.payment_account_status,
        o.support_contact,
        u.id AS user_id,
        u.email AS user_email,
        u.name AS user_name
      FROM organizer_member om
      INNER JOIN organizer o ON om.organizer_id = o.id
      INNER JOIN "user" u ON om.user_id = u.id
      WHERE o.id = ${organizerId}
      ORDER BY u.email ASC
    `;

    return {
      organizer: mapAdminOrganizerDetail(organizer),
      memberships: membershipRows.map(mapAdminMembership),
    };
  }
}

function requestHeaders(source: HeaderSource): Headers {
  const headers = new Headers();
  const sourceHeaders = ("headers" in source ? source.headers : source) as Record<string, unknown>;

  for (const [key, value] of Object.entries(sourceHeaders)) {
    if (Array.isArray(value)) {
      for (const entry of value) {
        if (typeof entry === "string") {
          headers.append(key, entry);
        }
      }
      continue;
    }

    if (typeof value === "string") {
      headers.set(key, value);
    }
  }

  return headers;
}

function getHeaderValue(source: HeaderSource, headerName: string): string | null {
  const sourceHeaders = ("headers" in source ? source.headers : source) as Record<string, unknown>;
  const value = sourceHeaders[headerName] ?? sourceHeaders[headerName.toLowerCase()];

  return typeof value === "string" ? value : null;
}

function mapUser(user: BetterAuthUser): ConsoleMeResponse["user"] {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    image: user.image,
    role: typeof user.role === "string" ? user.role : null,
    isPlatformAdmin: isPlatformAdmin(user),
    platformCapabilities: isPlatformAdmin(user) ? [...platformAdminCapabilities] : [],
  };
}

function mapOrganizer(row: OrganizerRow): OrganizerSummary {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    legalName: row.legal_name,
    ownerEmail: row.owner_email,
    city: row.city,
    state: row.state,
    reviewStatus: row.review_status,
    entityType: row.entity_type,
    gstin: row.gstin,
    billingAddress: row.billing_address,
    financeContact: row.finance_contact,
    paymentAccountStatus: row.payment_account_status,
    supportContact: row.support_contact,
  };
}

function mapMembershipOrganizer(row: MembershipRow): OrganizerSummary {
  return {
    id: row.organizer_id,
    slug: row.organizer_slug,
    name: row.organizer_name,
    legalName: row.legal_name,
    ownerEmail: row.owner_email,
    city: row.organizer_city,
    state: row.organizer_state,
    reviewStatus: row.review_status,
    entityType: row.entity_type,
    gstin: row.gstin,
    billingAddress: row.billing_address,
    financeContact: row.finance_contact,
    paymentAccountStatus: row.payment_account_status,
    supportContact: row.support_contact,
  };
}

function isPlatformAdmin(user: Pick<BetterAuthUser, "role">): boolean {
  const role = user.role;
  return Array.isArray(role) ? role.includes("admin") : role === "admin";
}

function parseTeamRole(value: string): TeamRole {
  const result = teamRoleSchema.safeParse(value);

  if (!result.success) {
    throw new ConsoleApiError(400, "Stored organizer member role is invalid.");
  }

  return result.data;
}

function parseMembershipStatus(value: string): "active" | "invited" | "disabled" {
  if (value === "active" || value === "invited" || value === "disabled") {
    return value;
  }

  throw new ConsoleApiError(400, "Stored organizer member status is invalid.");
}

function mapAdminOrganizerDetail(row: AdminOrganizerDetailRow) {
  return {
    ...mapOrganizer(row),
    createdByUserId: row.created_by_user_id,
    reviewedByUserId: row.reviewed_by_user_id,
    reviewedAt: toOptionalIsoString(row.reviewed_at),
    reviewReason: row.review_reason,
    createdAt: toIsoString(row.created_at),
    updatedAt: toIsoString(row.updated_at),
  };
}

function mapAdminMembership(row: AdminMembershipRow): AdminOrganizerMember {
  return {
    id: row.membership_id,
    organizer: mapMembershipOrganizer(row),
    user: {
      id: row.user_id,
      email: row.user_email,
      name: row.user_name,
    },
    role: parseTeamRole(row.role),
    status: parseMembershipStatus(row.status),
    lastActiveAt: toOptionalIsoString(row.last_active_at),
    createdAt: toIsoString(row.created_at),
  };
}

function slugify(value: string): string {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || `organizer-${randomUUID().slice(0, 8)}`;
}

function toOptionalIsoString(value: Date | string | null): string | null {
  if (!value) {
    return null;
  }

  return toIsoString(value);
}

function toIsoString(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}
