import { randomUUID } from "node:crypto";
import { queryClient } from "@corral/db";
import {
  type AdminOrganizerMember,
  type AdminReviewOrganizerRequest,
  type Capability,
  type ConsoleEvent,
  type ConsoleMembership,
  type ConsoleMeResponse,
  type ConsoleRequestHeaders,
  type CreateEventCategoryRequest,
  type CreateEventFeeTierRequest,
  type CreateEventRequest,
  type CreateOrganizerOnboardingRequest,
  type EventCategory,
  type EventCategoryStatus,
  type EventDetail,
  type EventFeeTier,
  type EventFormField,
  type EventReadiness,
  type OnboardingStatusResponse,
  type OrganizerOnboardingResponse,
  type OrganizerReviewStatus,
  type OrganizerSummary,
  type PaymentAccountStatus,
  platformAdminCapabilities,
  roleCapabilities,
  type TeamRole,
  teamRoleSchema,
  type UpdateEventCategoryRequest,
  type UpdateEventFeeTierRequest,
  type UpdateEventRequest,
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
  date: string | null;
  starts_at: string | null;
  venue_name: string | null;
  venue_address: string | null;
  city: string | null;
  timezone: string;
};

type EventDetailRow = EventRow & {
  registration_opens_at: string | null;
  registration_closes_at: string | null;
  description: string | null;
  map_url: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  race_instructions: string | null;
  waiver_text: string | null;
  refund_policy: string | null;
  medical_declaration: string | null;
  form_fields: string[] | null;
  tshirt_sizes: string[] | null;
  logo_url: string | null;
  banner_url: string | null;
  ready_at: Date | string | null;
  published_at: Date | string | null;
  published_by_user_id: string | null;
  created_by_user_id: string | null;
  organizer_review_status: OrganizerReviewStatus;
  organizer_payment_account_status: PaymentAccountStatus;
};

type EventCategoryRow = {
  id: string;
  event_id: string;
  label: string;
  distance: string;
  min_age: number | null;
  max_age: number | null;
  capacity: number;
  registered_count: number;
  sort_order: number;
  status: EventCategoryStatus;
};

type EventFeeTierRow = {
  id: string;
  category_id: string;
  label: string;
  amount_in_paise: number;
  starts_at: string | null;
  ends_at: string | null;
  registration_cap: number | null;
  registration_count: number;
  is_active: boolean;
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

const eventFormFieldValues = [
  "dateOfBirth",
  "gender",
  "bloodGroup",
  "emergencyContact",
  "medicalInfo",
  "tshirtSize",
  "guardianName",
  "guardianContact",
  "clubName",
] as const satisfies readonly EventFormField[];
const eventFormFieldSet = new Set<EventFormField>(eventFormFieldValues);

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

  async getOrganizerEvent(
    headers: HeaderSource,
    organizerId: string,
    eventId: string,
  ): Promise<{ event: EventDetail }> {
    await this.requireOrganizerCapability(headers, organizerId, "events:read");
    return { event: await this.getEventDetail(organizerId, eventId) };
  }

  async createOrganizerEvent(
    headers: HeaderSource,
    organizerId: string,
    input: CreateEventRequest,
  ): Promise<{ event: EventDetail }> {
    const { session, membership } = await this.requireOrganizerCapability(
      headers,
      organizerId,
      "events:write",
    );
    this.requireTrustedMutationOrigin(headers, { requireOrigin: true });
    this.requireApprovedOrganizer(
      membership.organizer,
      "Only approved organizers can create events.",
    );

    const eventId = `evt-${randomUUID()}`;
    const baseSlug = slugify(input.slug ?? input.name, "event");
    const slug = await generateUniqueEventSlug(organizerId, baseSlug);

    await queryClient.begin(async (transaction) => {
      await transaction`
        INSERT INTO event (id, organizer_id, slug, name, created_by_user_id)
        VALUES (${eventId}, ${organizerId}, ${slug}, ${input.name}, ${session.user.id})
      `;
    });

    return { event: await this.getEventDetail(organizerId, eventId) };
  }

  async updateOrganizerEvent(
    headers: HeaderSource,
    organizerId: string,
    eventId: string,
    input: UpdateEventRequest,
  ): Promise<{ event: EventDetail }> {
    await this.requireOrganizerCapability(headers, organizerId, "events:write");
    this.requireTrustedMutationOrigin(headers);
    const existing = await this.requireDraftEvent(organizerId, eventId);

    await queryClient`
      UPDATE event
      SET
        name = ${input.name ?? existing.name},
        date = ${fieldValue(input, "date", existing.date)},
        starts_at = ${fieldValue(input, "startsAt", existing.starts_at)},
        venue_name = ${fieldValue(input, "venueName", existing.venue_name)},
        venue_address = ${fieldValue(input, "venueAddress", existing.venue_address)},
        city = ${fieldValue(input, "city", existing.city)},
        timezone = ${input.timezone ?? existing.timezone},
        registration_opens_at = ${fieldValue(input, "registrationOpensAt", existing.registration_opens_at)},
        registration_closes_at = ${fieldValue(input, "registrationClosesAt", existing.registration_closes_at)},
        description = ${fieldValue(input, "description", existing.description)},
        map_url = ${fieldValue(input, "mapUrl", existing.map_url)},
        contact_email = ${fieldValue(input, "contactEmail", existing.contact_email)},
        contact_phone = ${fieldValue(input, "contactPhone", existing.contact_phone)},
        race_instructions = ${fieldValue(input, "raceInstructions", existing.race_instructions)},
        waiver_text = ${fieldValue(input, "waiverText", existing.waiver_text)},
        refund_policy = ${fieldValue(input, "refundPolicy", existing.refund_policy)},
        medical_declaration = ${fieldValue(input, "medicalDeclaration", existing.medical_declaration)},
        form_fields = ${fieldValue(input, "formFields", existing.form_fields ?? [])},
        tshirt_sizes = ${fieldValue(input, "tshirtSizes", existing.tshirt_sizes ?? [])},
        logo_url = ${fieldValue(input, "logoUrl", existing.logo_url)},
        banner_url = ${fieldValue(input, "bannerUrl", existing.banner_url)},
        updated_at = NOW()
      WHERE id = ${eventId} AND organizer_id = ${organizerId}
    `;

    return { event: await this.getEventDetail(organizerId, eventId) };
  }

  async deleteOrganizerEvent(
    headers: HeaderSource,
    organizerId: string,
    eventId: string,
  ): Promise<{ deleted: true }> {
    await this.requireOrganizerCapability(headers, organizerId, "events:write");
    this.requireTrustedMutationOrigin(headers);
    await this.requireDraftEvent(organizerId, eventId);

    await queryClient`
      DELETE FROM event
      WHERE id = ${eventId} AND organizer_id = ${organizerId}
    `;

    return { deleted: true };
  }

  async createOrganizerEventCategory(
    headers: HeaderSource,
    organizerId: string,
    eventId: string,
    input: CreateEventCategoryRequest,
  ): Promise<{ event: EventDetail }> {
    await this.requireOrganizerCapability(headers, organizerId, "events:write");
    this.requireTrustedMutationOrigin(headers);
    await this.requireDraftEvent(organizerId, eventId);

    await queryClient`
      INSERT INTO event_category (
        id, event_id, label, distance, min_age, max_age, capacity, sort_order, status
      )
      VALUES (
        ${`cat-${randomUUID()}`}, ${eventId}, ${input.label}, ${input.distance},
        ${input.minAge ?? null}, ${input.maxAge ?? null}, ${input.capacity},
        ${input.sortOrder ?? 0}, ${input.status ?? "active"}
      )
    `;

    return { event: await this.getEventDetail(organizerId, eventId) };
  }

  async updateOrganizerEventCategory(
    headers: HeaderSource,
    organizerId: string,
    eventId: string,
    categoryId: string,
    input: UpdateEventCategoryRequest,
  ): Promise<{ event: EventDetail }> {
    await this.requireOrganizerCapability(headers, organizerId, "events:write");
    this.requireTrustedMutationOrigin(headers);
    await this.requireDraftEvent(organizerId, eventId);
    const existing = await this.requireEventCategory(eventId, categoryId);
    const minAge = fieldValue(input, "minAge", existing.min_age);
    const maxAge = fieldValue(input, "maxAge", existing.max_age);

    if (minAge != null && maxAge != null && minAge > maxAge) {
      throw new ConsoleApiError(400, "Minimum age cannot be greater than maximum age.");
    }

    await queryClient`
      UPDATE event_category
      SET
        label = ${input.label ?? existing.label},
        distance = ${input.distance ?? existing.distance},
        min_age = ${minAge},
        max_age = ${maxAge},
        capacity = ${input.capacity ?? existing.capacity},
        sort_order = ${input.sortOrder ?? existing.sort_order},
        status = ${input.status ?? existing.status},
        updated_at = NOW()
      WHERE id = ${categoryId} AND event_id = ${eventId}
    `;

    return { event: await this.getEventDetail(organizerId, eventId) };
  }

  async deleteOrganizerEventCategory(
    headers: HeaderSource,
    organizerId: string,
    eventId: string,
    categoryId: string,
  ): Promise<{ event: EventDetail }> {
    await this.requireOrganizerCapability(headers, organizerId, "events:write");
    this.requireTrustedMutationOrigin(headers);
    await this.requireDraftEvent(organizerId, eventId);
    await this.requireEventCategory(eventId, categoryId);

    await queryClient`
      DELETE FROM event_category
      WHERE id = ${categoryId} AND event_id = ${eventId}
    `;

    return { event: await this.getEventDetail(organizerId, eventId) };
  }

  async createOrganizerEventFeeTier(
    headers: HeaderSource,
    organizerId: string,
    eventId: string,
    categoryId: string,
    input: CreateEventFeeTierRequest,
  ): Promise<{ event: EventDetail }> {
    await this.requireOrganizerCapability(headers, organizerId, "events:write");
    this.requireTrustedMutationOrigin(headers);
    await this.requireDraftEvent(organizerId, eventId);
    await this.requireEventCategory(eventId, categoryId);
    await this.requireNonOverlappingFeeTier(categoryId, input);

    await queryClient`
      INSERT INTO event_fee_tier (
        id, category_id, label, amount_in_paise, starts_at, ends_at, registration_cap, is_active
      )
      VALUES (
        ${`tier-${randomUUID()}`}, ${categoryId}, ${input.label}, ${input.amountInPaise},
        ${input.startsAt ?? null}, ${input.endsAt ?? null}, ${input.registrationCap ?? null},
        ${input.isActive ?? true}
      )
    `;

    return { event: await this.getEventDetail(organizerId, eventId) };
  }

  async updateOrganizerEventFeeTier(
    headers: HeaderSource,
    organizerId: string,
    eventId: string,
    categoryId: string,
    tierId: string,
    input: UpdateEventFeeTierRequest,
  ): Promise<{ event: EventDetail }> {
    await this.requireOrganizerCapability(headers, organizerId, "events:write");
    this.requireTrustedMutationOrigin(headers);
    await this.requireDraftEvent(organizerId, eventId);
    await this.requireEventCategory(eventId, categoryId);
    const existing = await this.requireEventFeeTier(categoryId, tierId);
    const next = {
      label: input.label ?? existing.label,
      amountInPaise: input.amountInPaise ?? existing.amount_in_paise,
      startsAt: fieldValue(input, "startsAt", existing.starts_at),
      endsAt: fieldValue(input, "endsAt", existing.ends_at),
      registrationCap: fieldValue(input, "registrationCap", existing.registration_cap),
      isActive: input.isActive ?? existing.is_active,
    };
    await this.requireNonOverlappingFeeTier(categoryId, next, tierId);

    await queryClient`
      UPDATE event_fee_tier
      SET
        label = ${next.label},
        amount_in_paise = ${next.amountInPaise},
        starts_at = ${next.startsAt},
        ends_at = ${next.endsAt},
        registration_cap = ${next.registrationCap},
        is_active = ${next.isActive},
        updated_at = NOW()
      WHERE id = ${tierId} AND category_id = ${categoryId}
    `;

    return { event: await this.getEventDetail(organizerId, eventId) };
  }

  async deleteOrganizerEventFeeTier(
    headers: HeaderSource,
    organizerId: string,
    eventId: string,
    categoryId: string,
    tierId: string,
  ): Promise<{ event: EventDetail }> {
    await this.requireOrganizerCapability(headers, organizerId, "events:write");
    this.requireTrustedMutationOrigin(headers);
    await this.requireDraftEvent(organizerId, eventId);
    await this.requireEventCategory(eventId, categoryId);
    const tier = await this.requireEventFeeTier(categoryId, tierId);

    if (tier.is_active) {
      const activeRows = await queryClient<Array<{ count: string }>>`
        SELECT COUNT(*)::text AS count
        FROM event_fee_tier
        WHERE category_id = ${categoryId} AND is_active = true AND id <> ${tierId}
      `;

      if (Number(activeRows[0]?.count ?? 0) === 0) {
        throw new ConsoleApiError(409, "A category must keep at least one active fee tier.");
      }
    }

    await queryClient`
      DELETE FROM event_fee_tier
      WHERE id = ${tierId} AND category_id = ${categoryId}
    `;

    return { event: await this.getEventDetail(organizerId, eventId) };
  }

  async getOrganizerEventReadiness(
    headers: HeaderSource,
    organizerId: string,
    eventId: string,
  ): Promise<{ readiness: EventReadiness }> {
    await this.requireOrganizerCapability(headers, organizerId, "events:read");
    const event = await this.getEventDetail(organizerId, eventId);
    return { readiness: event.readiness };
  }

  async markOrganizerEventReady(
    headers: HeaderSource,
    organizerId: string,
    eventId: string,
  ): Promise<{ transitioned: boolean; readiness: EventReadiness }> {
    await this.requireOrganizerCapability(headers, organizerId, "events:write");
    this.requireTrustedMutationOrigin(headers);
    await this.requireDraftEvent(organizerId, eventId);
    const event = await this.getEventDetail(organizerId, eventId);

    if (!event.readiness.ready) {
      return { transitioned: false, readiness: event.readiness };
    }

    await queryClient`
      UPDATE event
      SET status = 'ready', ready_at = NOW(), updated_at = NOW()
      WHERE id = ${eventId} AND organizer_id = ${organizerId}
    `;

    return { transitioned: true, readiness: event.readiness };
  }

  async revertOrganizerEventToDraft(
    headers: HeaderSource,
    organizerId: string,
    eventId: string,
  ): Promise<{ event: EventDetail }> {
    await this.requireOrganizerCapability(headers, organizerId, "events:write");
    this.requireTrustedMutationOrigin(headers);
    const event = await this.getEventDetail(organizerId, eventId);

    if (event.status !== "ready") {
      throw new ConsoleApiError(409, "Only ready events can be reverted to draft.");
    }

    await queryClient`
      UPDATE event
      SET status = 'draft', ready_at = NULL, updated_at = NOW()
      WHERE id = ${eventId} AND organizer_id = ${organizerId}
    `;

    return { event: await this.getEventDetail(organizerId, eventId) };
  }

  async publishOrganizerEvent(
    headers: HeaderSource,
    organizerId: string,
    eventId: string,
  ): Promise<{ event: EventDetail }> {
    const { session, membership } = await this.requireOrganizerCapability(
      headers,
      organizerId,
      "events:publish",
    );
    this.requireTrustedMutationOrigin(headers);
    const event = await this.getEventDetail(organizerId, eventId);

    if (event.status !== "ready") {
      throw new ConsoleApiError(409, "Only ready events can be published.");
    }

    this.requireApprovedOrganizer(
      membership.organizer,
      "Only approved organizers can publish events.",
    );

    if (membership.organizer.paymentAccountStatus !== "verified") {
      throw new ConsoleApiError(409, "Verify the organizer payment account before publishing.");
    }

    await queryClient`
      UPDATE event
      SET status = 'published', published_at = NOW(), published_by_user_id = ${session.user.id}, updated_at = NOW()
      WHERE id = ${eventId} AND organizer_id = ${organizerId}
    `;

    return { event: await this.getEventDetail(organizerId, eventId) };
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

  async updateAdminOrganizerPaymentAccount(
    headers: HeaderSource,
    organizerId: string,
    paymentAccountStatus: PaymentAccountStatus,
  ): Promise<{
    organizer: ReturnType<typeof mapAdminOrganizerDetail>;
    memberships: AdminOrganizerMember[];
  }> {
    await this.requirePlatformAdmin(headers);
    this.requireTrustedMutationOrigin(headers);
    await this.requireOrganizerExists(organizerId);

    await queryClient`
      UPDATE organizer
      SET payment_account_status = ${paymentAccountStatus}, updated_at = NOW()
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

  private async requireOrganizerCapability(
    headers: HeaderSource,
    organizerId: string,
    capability: Capability,
  ): Promise<{ session: BetterAuthSession; membership: ConsoleMembership }> {
    const session = await this.requireSession(headers);
    const memberships = await this.getMembershipsForUser(session.user.id);
    const membership = memberships.find((item) => item.organizer.id === organizerId);

    if (!membership) {
      throw new ConsoleApiError(403, "You do not have access to this organizer.");
    }

    if (!membership.capabilities.includes(capability)) {
      throw new ConsoleApiError(403, "Your organizer role cannot perform this action.");
    }

    return { session, membership };
  }

  private requireApprovedOrganizer(organizerSummary: OrganizerSummary, message: string): void {
    if (organizerSummary.reviewStatus !== "approved") {
      throw new ConsoleApiError(403, message);
    }
  }

  private async requireDraftEvent(organizerId: string, eventId: string): Promise<EventDetailRow> {
    const row = await this.getEventDetailRow(organizerId, eventId);

    if (row.status !== "draft") {
      throw new ConsoleApiError(409, "Only draft events can be changed.");
    }

    return row;
  }

  private async requireEventCategory(
    eventId: string,
    categoryId: string,
  ): Promise<EventCategoryRow> {
    const rows = await queryClient<EventCategoryRow[]>`
      SELECT
        id, event_id, label, distance, min_age, max_age, capacity, registered_count, sort_order, status
      FROM event_category
      WHERE id = ${categoryId} AND event_id = ${eventId}
      LIMIT 1
    `;

    const category = rows[0];

    if (!category) {
      throw new ConsoleApiError(404, "Event category was not found.");
    }

    return category;
  }

  private async requireEventFeeTier(categoryId: string, tierId: string): Promise<EventFeeTierRow> {
    const rows = await queryClient<EventFeeTierRow[]>`
      SELECT
        id, category_id, label, amount_in_paise, starts_at, ends_at, registration_cap,
        registration_count, is_active
      FROM event_fee_tier
      WHERE id = ${tierId} AND category_id = ${categoryId}
      LIMIT 1
    `;

    const tier = rows[0];

    if (!tier) {
      throw new ConsoleApiError(404, "Event fee tier was not found.");
    }

    return tier;
  }

  private async requireNonOverlappingFeeTier(
    categoryId: string,
    input: {
      startsAt?: string | null;
      endsAt?: string | null;
      isActive?: boolean;
    },
    excludedTierId?: string,
  ): Promise<void> {
    if (input.isActive === false || !input.startsAt || !input.endsAt) {
      return;
    }

    if (Date.parse(input.startsAt) >= Date.parse(input.endsAt)) {
      throw new ConsoleApiError(400, "Fee tier start time must be before its end time.");
    }

    const rows = excludedTierId
      ? await queryClient<Array<{ id: string }>>`
          SELECT id
          FROM event_fee_tier
          WHERE category_id = ${categoryId}
            AND id <> ${excludedTierId}
            AND is_active = true
            AND starts_at IS NOT NULL
            AND ends_at IS NOT NULL
            AND NOT (ends_at <= ${input.startsAt} OR starts_at >= ${input.endsAt})
          LIMIT 1
        `
      : await queryClient<Array<{ id: string }>>`
          SELECT id
          FROM event_fee_tier
          WHERE category_id = ${categoryId}
            AND is_active = true
            AND starts_at IS NOT NULL
            AND ends_at IS NOT NULL
            AND NOT (ends_at <= ${input.startsAt} OR starts_at >= ${input.endsAt})
          LIMIT 1
        `;

    if (rows[0]) {
      throw new ConsoleApiError(409, "Active fee tier windows cannot overlap.");
    }
  }

  private async getEventDetail(organizerId: string, eventId: string): Promise<EventDetail> {
    const eventRow = await this.getEventDetailRow(organizerId, eventId);
    const categories = await this.getCategoriesForEvent(eventId);
    const event = mapEventDetail(eventRow, categories);

    return {
      ...event,
      readiness: computeEventReadiness(event),
    };
  }

  private async getEventDetailRow(organizerId: string, eventId: string): Promise<EventDetailRow> {
    const rows = await queryClient<EventDetailRow[]>`
      SELECT
        e.id,
        e.organizer_id,
        e.slug,
        e.name,
        e.status,
        e.date,
        e.starts_at,
        e.venue_name,
        e.venue_address,
        e.city,
        e.timezone,
        e.registration_opens_at,
        e.registration_closes_at,
        e.description,
        e.map_url,
        e.contact_email,
        e.contact_phone,
        e.race_instructions,
        e.waiver_text,
        e.refund_policy,
        e.medical_declaration,
        e.form_fields,
        e.tshirt_sizes,
        e.logo_url,
        e.banner_url,
        e.ready_at,
        e.published_at,
        e.published_by_user_id,
        e.created_by_user_id,
        o.review_status AS organizer_review_status,
        o.payment_account_status AS organizer_payment_account_status
      FROM event e
      INNER JOIN organizer o ON e.organizer_id = o.id
      WHERE e.id = ${eventId} AND e.organizer_id = ${organizerId}
      LIMIT 1
    `;

    const eventRow = rows[0];

    if (!eventRow) {
      throw new ConsoleApiError(404, "Event was not found.");
    }

    return eventRow;
  }

  private async getCategoriesForEvent(eventId: string): Promise<EventCategory[]> {
    const categoryRows = await queryClient<EventCategoryRow[]>`
      SELECT
        id, event_id, label, distance, min_age, max_age, capacity, registered_count, sort_order, status
      FROM event_category
      WHERE event_id = ${eventId}
      ORDER BY sort_order ASC, label ASC
    `;

    if (categoryRows.length === 0) {
      return [];
    }

    const feeRows = await queryClient<EventFeeTierRow[]>`
      SELECT
        id, category_id, label, amount_in_paise, starts_at, ends_at, registration_cap,
        registration_count, is_active
      FROM event_fee_tier
      WHERE category_id = ANY(${categoryRows.map((row) => row.id)})
      ORDER BY starts_at ASC NULLS LAST, amount_in_paise ASC, label ASC
    `;

    const feesByCategory = new Map<string, EventFeeTier[]>();

    for (const row of feeRows) {
      const list = feesByCategory.get(row.category_id) ?? [];
      list.push(mapFeeTier(row));
      feesByCategory.set(row.category_id, list);
    }

    return categoryRows.map((row) => mapCategory(row, feesByCategory.get(row.id) ?? []));
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

async function generateUniqueEventSlug(organizerId: string, baseSlug: string): Promise<string> {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const candidate = attempt === 0 ? baseSlug : `${baseSlug}-${attempt + 1}`;
    const rows = await queryClient<Array<{ id: string }>>`
      SELECT id
      FROM event
      WHERE organizer_id = ${organizerId} AND slug = ${candidate}
      LIMIT 1
    `;

    if (!rows[0]) {
      return candidate;
    }
  }

  return `${baseSlug}-${randomUUID().slice(0, 8)}`;
}

function fieldValue<TObject extends Record<string, unknown>, TKey extends keyof TObject, TFallback>(
  input: TObject,
  key: TKey,
  fallback: TFallback,
): Exclude<TObject[TKey], undefined> | TFallback {
  const value = input[key];
  return Object.hasOwn(input, key) && value !== undefined
    ? (value as Exclude<TObject[TKey], undefined>)
    : fallback;
}

function mapEventDetail(
  row: EventDetailRow,
  categories: EventCategory[],
): Omit<EventDetail, "readiness"> {
  return {
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
    registrationOpensAt: row.registration_opens_at,
    registrationClosesAt: row.registration_closes_at,
    description: row.description,
    mapUrl: row.map_url,
    contactEmail: row.contact_email,
    contactPhone: row.contact_phone,
    raceInstructions: row.race_instructions,
    waiverText: row.waiver_text,
    refundPolicy: row.refund_policy,
    medicalDeclaration: row.medical_declaration,
    formFields: parseEventFormFields(row.form_fields),
    tshirtSizes: row.tshirt_sizes ?? [],
    logoUrl: row.logo_url,
    bannerUrl: row.banner_url,
    readyAt: toOptionalIsoString(row.ready_at),
    publishedAt: toOptionalIsoString(row.published_at),
    publishedByUserId: row.published_by_user_id,
    createdByUserId: row.created_by_user_id,
    categories,
  };
}

function mapCategory(row: EventCategoryRow, feeTiers: EventFeeTier[]): EventCategory {
  return {
    id: row.id,
    eventId: row.event_id,
    label: row.label,
    distance: row.distance,
    minAge: row.min_age,
    maxAge: row.max_age,
    capacity: row.capacity,
    registeredCount: row.registered_count,
    sortOrder: row.sort_order,
    status: row.status,
    feeTiers,
  };
}

function mapFeeTier(row: EventFeeTierRow): EventFeeTier {
  return {
    id: row.id,
    categoryId: row.category_id,
    label: row.label,
    amountInPaise: row.amount_in_paise,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    registrationCap: row.registration_cap,
    registrationCount: row.registration_count,
    isActive: row.is_active,
  };
}

function parseEventFormFields(values: string[] | null): EventFormField[] {
  if (!values) {
    return [];
  }

  return values.map((value) => {
    if (eventFormFieldSet.has(value as EventFormField)) {
      return value as EventFormField;
    }

    throw new ConsoleApiError(400, "Stored event form field is invalid.");
  });
}

function computeEventReadiness(event: Omit<EventDetail, "readiness">): EventReadiness {
  const blocking: EventReadiness["blocking"] = [];
  const warnings: EventReadiness["warnings"] = [];

  addRequired(blocking, "event-name", "Event name", event.name);
  addRequired(blocking, "event-date", "Event date", event.date);
  addRequired(blocking, "event-start", "Event start time", event.startsAt);
  addRequired(blocking, "venue-name", "Venue name", event.venueName);
  addRequired(blocking, "venue-address", "Venue address", event.venueAddress);
  addRequired(blocking, "city", "City", event.city);
  addRequired(blocking, "registration-open", "Registration opens", event.registrationOpensAt);
  addRequired(blocking, "registration-close", "Registration closes", event.registrationClosesAt);
  addRequired(blocking, "waiver", "Waiver text", event.waiverText);
  addRequired(blocking, "refund-policy", "Refund/cancellation policy", event.refundPolicy);

  if (!hasText(event.contactEmail) && !hasText(event.contactPhone)) {
    blocking.push({
      code: "contact",
      label: "Organizer contact",
      message: "Add a contact email or phone number.",
    });
  }

  if (event.registrationOpensAt && event.registrationClosesAt) {
    addTimeOrderCheck(
      blocking,
      "registration-window",
      "Registration window",
      event.registrationOpensAt,
      event.registrationClosesAt,
      "Registration must open before it closes.",
    );
  }

  if (event.registrationClosesAt && event.startsAt) {
    addTimeOrderCheck(
      blocking,
      "registration-before-start",
      "Registration closes before event",
      event.registrationClosesAt,
      event.startsAt,
      "Registration must close before the event starts.",
    );
  }

  const activeCategories = event.categories.filter((item) => item.status === "active");

  if (activeCategories.length === 0) {
    blocking.push({
      code: "active-categories",
      label: "Active race categories",
      message: "Add at least one active race category.",
    });
  }

  for (const category of activeCategories) {
    addRequired(blocking, `category-${category.id}-label`, "Category label", category.label);
    addRequired(
      blocking,
      `category-${category.id}-distance`,
      "Category distance",
      category.distance,
    );

    if (category.capacity <= 0) {
      blocking.push({
        code: `category-${category.id}-capacity`,
        label: "Category capacity",
        message: `${category.label} must have a positive capacity.`,
      });
    }

    const activeTiers = category.feeTiers.filter((tier) => tier.isActive);

    if (activeTiers.length === 0) {
      blocking.push({
        code: `category-${category.id}-tiers`,
        label: "Category fee tiers",
        message: `${category.label} must have at least one active fee tier.`,
      });
    }

    for (const tier of activeTiers) {
      if (tier.amountInPaise <= 0) {
        blocking.push({
          code: `tier-${tier.id}-amount`,
          label: "Fee amount",
          message: `${tier.label} must have a positive fee amount.`,
        });
      }
    }
  }

  if (!hasText(event.logoUrl) && !hasText(event.bannerUrl)) {
    warnings.push({
      code: "branding",
      label: "Branding",
      message: "Logo/banner uploads are deferred; add them once asset storage ships.",
    });
  }

  if (!hasText(event.raceInstructions)) {
    warnings.push({
      code: "race-instructions",
      label: "Race instructions",
      message: "Add race instructions before sharing the event publicly.",
    });
  }

  if (!hasText(event.mapUrl)) {
    warnings.push({
      code: "map-url",
      label: "Map URL",
      message: "Add a map URL to help participants find the venue.",
    });
  }

  return {
    ready: blocking.length === 0,
    blocking,
    warnings,
  };
}

function addRequired(
  blocking: EventReadiness["blocking"],
  code: string,
  label: string,
  value: string | null,
): void {
  if (!hasText(value)) {
    blocking.push({ code, label, message: `${label} is required.` });
  }
}

function addTimeOrderCheck(
  blocking: EventReadiness["blocking"],
  code: string,
  label: string,
  first: string,
  second: string,
  message: string,
): void {
  const firstTime = Date.parse(first);
  const secondTime = Date.parse(second);

  if (Number.isNaN(firstTime) || Number.isNaN(secondTime)) {
    blocking.push({ code, label, message: `${label} must use valid date/time values.` });
    return;
  }

  if (firstTime >= secondTime) {
    blocking.push({ code, label, message });
  }
}

function hasText(value: string | null): boolean {
  return typeof value === "string" && value.trim().length > 0;
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

function slugify(value: string, fallbackPrefix = "organizer"): string {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || `${fallbackPrefix}-${randomUUID().slice(0, 8)}`;
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
