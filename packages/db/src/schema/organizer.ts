import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { user } from "./auth";

export const organizer = pgTable(
  "organizer",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    legalName: text("legal_name").notNull(),
    ownerEmail: text("owner_email").notNull(),
    phone: text("phone").notNull(),
    city: text("city").notNull(),
    state: text("state").notNull(),
    gstin: text("gstin"),
    reviewStatus: text("review_status").notNull().default("pending"),
    entityType: text("entity_type").notNull().default("non-gst"),
    billingAddress: text("billing_address"),
    financeContact: text("finance_contact"),
    paymentAccountStatus: text("payment_account_status").notNull().default("not-started"),
    supportContact: text("support_contact").notNull(),
    createdByUserId: text("created_by_user_id").references(() => user.id, { onDelete: "set null" }),
    reviewedByUserId: text("reviewed_by_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    reviewReason: text("review_reason"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("organizer_slug_unique").on(table.slug),
    uniqueIndex("organizer_created_by_user_unique").on(table.createdByUserId),
    index("organizer_city_state_idx").on(table.city, table.state),
    index("organizer_review_status_created_at_idx").on(table.reviewStatus, table.createdAt),
    index("organizer_reviewed_by_user_id_idx").on(table.reviewedByUserId),
    check(
      "organizer_review_status_check",
      sql`${table.reviewStatus} IN ('pending', 'approved', 'changes-requested', 'rejected', 'suspended')`,
    ),
    check("organizer_entity_type_check", sql`${table.entityType} IN ('gst', 'non-gst')`),
    check(
      "organizer_payment_account_status_check",
      sql`${table.paymentAccountStatus} IN ('not-started', 'pending', 'verified', 'needs-attention')`,
    ),
  ],
);

export const organizerMember = pgTable(
  "organizer_member",
  {
    id: text("id").primaryKey(),
    organizerId: text("organizer_id")
      .notNull()
      .references(() => organizer.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: text("role").notNull(),
    status: text("status").notNull().default("active"),
    invitedEmail: text("invited_email"),
    invitedByUserId: text("invited_by_user_id").references(() => user.id, { onDelete: "set null" }),
    lastActiveAt: timestamp("last_active_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("organizer_member_organizer_user_unique").on(table.organizerId, table.userId),
    index("organizer_member_organizer_id_idx").on(table.organizerId),
    index("organizer_member_user_id_idx").on(table.userId),
    index("organizer_member_role_status_idx").on(table.role, table.status),
    index("organizer_member_invited_by_user_id_idx").on(table.invitedByUserId),
    check(
      "organizer_member_role_check",
      sql`${table.role} IN ('Owner', 'Admin', 'Event Editor', 'Finance', 'Support/Check-in', 'Read-only Viewer')`,
    ),
    check(
      "organizer_member_status_check",
      sql`${table.status} IN ('active', 'invited', 'disabled')`,
    ),
  ],
);

export const event = pgTable(
  "event",
  {
    id: text("id").primaryKey(),
    organizerId: text("organizer_id")
      .notNull()
      .references(() => organizer.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    status: text("status").notNull().default("draft"),
    date: text("date"),
    startsAt: text("starts_at"),
    venueName: text("venue_name"),
    venueAddress: text("venue_address"),
    city: text("city"),
    timezone: text("timezone").notNull().default("Asia/Kolkata"),
    registrationOpensAt: text("registration_opens_at"),
    registrationClosesAt: text("registration_closes_at"),
    description: text("description"),
    mapUrl: text("map_url"),
    contactEmail: text("contact_email"),
    contactPhone: text("contact_phone"),
    raceInstructions: text("race_instructions"),
    waiverText: text("waiver_text"),
    refundPolicy: text("refund_policy"),
    medicalDeclaration: text("medical_declaration"),
    formFields: text("form_fields").array(),
    tshirtSizes: text("tshirt_sizes").array(),
    logoUrl: text("logo_url"),
    bannerUrl: text("banner_url"),
    readyAt: timestamp("ready_at", { withTimezone: true }),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    publishedByUserId: text("published_by_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    createdByUserId: text("created_by_user_id").references(() => user.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("event_organizer_slug_unique").on(table.organizerId, table.slug),
    index("event_organizer_id_idx").on(table.organizerId),
    index("event_organizer_status_idx").on(table.organizerId, table.status),
    index("event_published_by_user_id_idx").on(table.publishedByUserId),
    index("event_created_by_user_id_idx").on(table.createdByUserId),
    check(
      "event_status_check",
      sql`${table.status} IN ('draft', 'ready', 'published', 'closed', 'completed')`,
    ),
  ],
);

export const eventCategory = pgTable(
  "event_category",
  {
    id: text("id").primaryKey(),
    eventId: text("event_id")
      .notNull()
      .references(() => event.id, { onDelete: "cascade" }),
    label: text("label").notNull(),
    distance: text("distance").notNull(),
    minAge: integer("min_age"),
    maxAge: integer("max_age"),
    capacity: integer("capacity").notNull(),
    registeredCount: integer("registered_count").notNull().default(0),
    sortOrder: integer("sort_order").notNull().default(0),
    status: text("status").notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("event_category_event_id_idx").on(table.eventId),
    index("event_category_event_status_idx").on(table.eventId, table.status),
    check("event_category_capacity_check", sql`${table.capacity} > 0`),
    check("event_category_registered_count_check", sql`${table.registeredCount} >= 0`),
    check("event_category_sort_order_check", sql`${table.sortOrder} >= 0`),
    check("event_category_age_check", sql`${table.minAge} IS NULL OR ${table.minAge} >= 0`),
    check("event_category_max_age_check", sql`${table.maxAge} IS NULL OR ${table.maxAge} >= 0`),
    check(
      "event_category_age_range_check",
      sql`${table.minAge} IS NULL OR ${table.maxAge} IS NULL OR ${table.minAge} <= ${table.maxAge}`,
    ),
    check("event_category_status_check", sql`${table.status} IN ('active', 'hidden', 'sold-out')`),
  ],
);

export const eventFeeTier = pgTable(
  "event_fee_tier",
  {
    id: text("id").primaryKey(),
    categoryId: text("category_id")
      .notNull()
      .references(() => eventCategory.id, { onDelete: "cascade" }),
    label: text("label").notNull(),
    amountInPaise: integer("amount_in_paise").notNull(),
    startsAt: text("starts_at"),
    endsAt: text("ends_at"),
    registrationCap: integer("registration_cap"),
    registrationCount: integer("registration_count").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("event_fee_tier_category_id_idx").on(table.categoryId),
    index("event_fee_tier_category_active_idx").on(table.categoryId, table.isActive),
    check("event_fee_tier_amount_check", sql`${table.amountInPaise} > 0`),
    check(
      "event_fee_tier_registration_cap_check",
      sql`${table.registrationCap} IS NULL OR ${table.registrationCap} > 0`,
    ),
    check("event_fee_tier_registration_count_check", sql`${table.registrationCount} >= 0`),
  ],
);
