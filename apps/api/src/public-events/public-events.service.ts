import { queryClient } from "@corral/db";
import {
  type EventFormField,
  type PublicEventAvailability,
  type PublicEventCategory,
  type PublicEventDetail,
  type PublicEventFeeTier,
  type PublicEventSummary,
} from "@corral/schema";
import { Injectable } from "@nestjs/common";

type PublicEventRow = {
  id: string;
  organizer_id: string;
  organizer_slug: string;
  organizer_name: string;
  organizer_city: string;
  organizer_state: string;
  organizer_support_contact: string;
  slug: string;
  name: string;
  date: string | null;
  starts_at: string | null;
  venue_name: string | null;
  venue_address: string | null;
  city: string | null;
  timezone: string;
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
  published_at: Date | string | null;
};

type PublicEventCategoryRow = {
  id: string;
  event_id: string;
  label: string;
  distance: string;
  min_age: number | null;
  max_age: number | null;
  capacity: number;
  registered_count: number;
  sort_order: number;
  status: "active" | "sold-out";
};

type PublicEventFeeTierRow = {
  id: string;
  category_id: string;
  label: string;
  amount_in_paise: number;
  starts_at: string | null;
  ends_at: string | null;
  registration_cap: number | null;
  registration_count: number;
  is_active: true;
};

const publicEventNotFound = "Event was not found.";
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

export class PublicEventsApiError extends Error {
  constructor(
    readonly status: 404,
    message: string,
  ) {
    super(message);
  }
}

@Injectable()
export class PublicEventsService {
  async listEvents(): Promise<{ events: PublicEventSummary[] }> {
    const rows = await queryClient<PublicEventRow[]>`
      SELECT
        e.id,
        e.organizer_id,
        o.slug AS organizer_slug,
        o.name AS organizer_name,
        o.city AS organizer_city,
        o.state AS organizer_state,
        o.support_contact AS organizer_support_contact,
        e.slug,
        e.name,
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
        e.published_at
      FROM event e
      INNER JOIN organizer o ON e.organizer_id = o.id
      WHERE e.status = 'published' AND o.review_status = 'approved'
      ORDER BY e.date ASC NULLS LAST, e.starts_at ASC NULLS LAST, e.name ASC
    `;

    return { events: await this.mapRowsToSummaries(rows) };
  }

  async getEvent(organizerSlug: string, eventSlug: string): Promise<{ event: PublicEventDetail }> {
    const rows = await queryClient<PublicEventRow[]>`
      SELECT
        e.id,
        e.organizer_id,
        o.slug AS organizer_slug,
        o.name AS organizer_name,
        o.city AS organizer_city,
        o.state AS organizer_state,
        o.support_contact AS organizer_support_contact,
        e.slug,
        e.name,
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
        e.published_at
      FROM event e
      INNER JOIN organizer o ON e.organizer_id = o.id
      WHERE
        e.slug = ${eventSlug}
        AND o.slug = ${organizerSlug}
        AND e.status = 'published'
        AND o.review_status = 'approved'
      LIMIT 1
    `;

    const row = rows[0];

    if (!row) {
      throw new PublicEventsApiError(404, publicEventNotFound);
    }

    const [event] = await this.mapRowsToDetails([row]);

    if (!event) {
      throw new PublicEventsApiError(404, publicEventNotFound);
    }

    return { event };
  }

  private async mapRowsToSummaries(rows: PublicEventRow[]): Promise<PublicEventSummary[]> {
    const categoriesByEvent = await this.getCategoriesByEvent(rows.map((row) => row.id));
    return rows.map((row) => mapSummary(row, categoriesByEvent.get(row.id) ?? []));
  }

  private async mapRowsToDetails(rows: PublicEventRow[]): Promise<PublicEventDetail[]> {
    const categoriesByEvent = await this.getCategoriesByEvent(rows.map((row) => row.id));
    return rows.map((row) => mapDetail(row, categoriesByEvent.get(row.id) ?? []));
  }

  private async getCategoriesByEvent(
    eventIds: string[],
  ): Promise<Map<string, PublicEventCategory[]>> {
    const categoriesByEvent = new Map<string, PublicEventCategory[]>();

    if (eventIds.length === 0) {
      return categoriesByEvent;
    }

    const categoryRows = await queryClient<PublicEventCategoryRow[]>`
      SELECT
        id, event_id, label, distance, min_age, max_age, capacity, registered_count, sort_order, status
      FROM event_category
      WHERE event_id = ANY(${eventIds}) AND status <> 'hidden'
      ORDER BY sort_order ASC, label ASC
    `;

    if (categoryRows.length === 0) {
      return categoriesByEvent;
    }

    const feeRows = await queryClient<PublicEventFeeTierRow[]>`
      SELECT
        id, category_id, label, amount_in_paise, starts_at, ends_at, registration_cap,
        registration_count, is_active
      FROM event_fee_tier
      WHERE category_id = ANY(${categoryRows.map((row) => row.id)}) AND is_active = true
      ORDER BY starts_at ASC NULLS LAST, amount_in_paise ASC, label ASC
    `;

    const feesByCategory = new Map<string, PublicEventFeeTier[]>();

    for (const row of feeRows) {
      const list = feesByCategory.get(row.category_id) ?? [];
      list.push(mapFeeTier(row));
      feesByCategory.set(row.category_id, list);
    }

    for (const row of categoryRows) {
      const list = categoriesByEvent.get(row.event_id) ?? [];
      list.push(mapCategory(row, feesByCategory.get(row.id) ?? []));
      categoriesByEvent.set(row.event_id, list);
    }

    return categoriesByEvent;
  }
}

function mapSummary(row: PublicEventRow, categories: PublicEventCategory[]): PublicEventSummary {
  return {
    id: row.id,
    organizerSlug: row.organizer_slug,
    organizer: {
      slug: row.organizer_slug,
      name: row.organizer_name,
      city: row.organizer_city,
      state: row.organizer_state,
      supportContact: row.organizer_support_contact,
    },
    slug: row.slug,
    name: row.name,
    date: row.date,
    startsAt: row.starts_at,
    venueName: row.venue_name,
    venueAddress: row.venue_address,
    city: row.city,
    timezone: row.timezone,
    registrationOpensAt: row.registration_opens_at,
    registrationClosesAt: row.registration_closes_at,
    description: row.description,
    logoUrl: row.logo_url,
    bannerUrl: row.banner_url,
    availability: computeAvailability(row, categories),
    categories,
  };
}

function mapDetail(row: PublicEventRow, categories: PublicEventCategory[]): PublicEventDetail {
  return {
    ...mapSummary(row, categories),
    mapUrl: row.map_url,
    contactEmail: row.contact_email,
    contactPhone: row.contact_phone,
    raceInstructions: row.race_instructions,
    waiverText: row.waiver_text,
    refundPolicy: row.refund_policy,
    medicalDeclaration: row.medical_declaration,
    formFields: parseEventFormFields(row.form_fields),
    tshirtSizes: row.tshirt_sizes ?? [],
    publishedAt: toOptionalIsoString(row.published_at),
  };
}

function mapCategory(
  row: PublicEventCategoryRow,
  feeTiers: PublicEventFeeTier[],
): PublicEventCategory {
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

function mapFeeTier(row: PublicEventFeeTierRow): PublicEventFeeTier {
  return {
    id: row.id,
    categoryId: row.category_id,
    label: row.label,
    amountInPaise: row.amount_in_paise,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    registrationCap: row.registration_cap,
    registrationCount: row.registration_count,
    isActive: true,
  };
}

function computeAvailability(
  event: Pick<PublicEventRow, "registration_opens_at" | "registration_closes_at">,
  categories: PublicEventCategory[],
): PublicEventAvailability {
  if (
    categories.length === 0 ||
    categories.every((category) => category.status === "sold-out" || seatsLeft(category) === 0)
  ) {
    return "sold-out";
  }

  const now = Date.now();
  const opensAt = parseTime(event.registration_opens_at);
  const closesAt = parseTime(event.registration_closes_at);

  if (opensAt !== null && opensAt > now) {
    return "registration-upcoming";
  }

  if (closesAt !== null && closesAt < now) {
    return "registration-closed";
  }

  return "registration-open";
}

function seatsLeft(category: PublicEventCategory): number {
  return Math.max(category.capacity - category.registeredCount, 0);
}

function parseTime(value: string | null): number | null {
  if (!value) {
    return null;
  }

  const time = Date.parse(value);
  return Number.isNaN(time) ? null : time;
}

function parseEventFormFields(values: string[] | null): EventFormField[] {
  if (!values) {
    return [];
  }

  return values.map((value) => {
    if (eventFormFieldSet.has(value as EventFormField)) {
      return value as EventFormField;
    }

    throw new PublicEventsApiError(404, publicEventNotFound);
  });
}

function toOptionalIsoString(value: Date | string | null): string | null {
  if (!value) {
    return null;
  }

  return value instanceof Date ? value.toISOString() : value;
}
