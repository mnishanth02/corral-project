import { sql } from "drizzle-orm";
import { check, index, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
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
    date: text("date").notNull(),
    startsAt: text("starts_at").notNull(),
    venueName: text("venue_name").notNull(),
    venueAddress: text("venue_address").notNull(),
    city: text("city").notNull(),
    timezone: text("timezone").notNull().default("Asia/Kolkata"),
    registrationOpensAt: text("registration_opens_at").notNull(),
    registrationClosesAt: text("registration_closes_at").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("event_organizer_slug_unique").on(table.organizerId, table.slug),
    index("event_organizer_id_idx").on(table.organizerId),
    index("event_organizer_status_idx").on(table.organizerId, table.status),
    check(
      "event_status_check",
      sql`${table.status} IN ('draft', 'ready', 'published', 'closed', 'completed')`,
    ),
  ],
);
