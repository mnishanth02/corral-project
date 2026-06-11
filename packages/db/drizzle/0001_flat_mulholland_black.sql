CREATE TABLE "event" (
	"id" text PRIMARY KEY NOT NULL,
	"organizer_id" text NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"date" text NOT NULL,
	"starts_at" text NOT NULL,
	"venue_name" text NOT NULL,
	"venue_address" text NOT NULL,
	"city" text NOT NULL,
	"timezone" text DEFAULT 'Asia/Kolkata' NOT NULL,
	"registration_opens_at" text NOT NULL,
	"registration_closes_at" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "event_status_check" CHECK ("event"."status" IN ('draft', 'ready', 'published', 'closed', 'completed'))
);
--> statement-breakpoint
CREATE TABLE "organizer" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"legal_name" text NOT NULL,
	"owner_email" text NOT NULL,
	"phone" text NOT NULL,
	"city" text NOT NULL,
	"state" text NOT NULL,
	"gstin" text,
	"payment_account_status" text DEFAULT 'not-started' NOT NULL,
	"support_contact" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organizer_payment_account_status_check" CHECK ("organizer"."payment_account_status" IN ('not-started', 'pending', 'verified', 'needs-attention'))
);
--> statement-breakpoint
CREATE TABLE "organizer_member" (
	"id" text PRIMARY KEY NOT NULL,
	"organizer_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"invited_email" text,
	"invited_by_user_id" text,
	"last_active_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organizer_member_role_check" CHECK ("organizer_member"."role" IN ('Owner', 'Admin', 'Event Editor', 'Finance', 'Support/Check-in', 'Read-only Viewer')),
	CONSTRAINT "organizer_member_status_check" CHECK ("organizer_member"."status" IN ('active', 'invited', 'disabled'))
);
--> statement-breakpoint
ALTER TABLE "event" ADD CONSTRAINT "event_organizer_id_organizer_id_fk" FOREIGN KEY ("organizer_id") REFERENCES "public"."organizer"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organizer_member" ADD CONSTRAINT "organizer_member_organizer_id_organizer_id_fk" FOREIGN KEY ("organizer_id") REFERENCES "public"."organizer"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organizer_member" ADD CONSTRAINT "organizer_member_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organizer_member" ADD CONSTRAINT "organizer_member_invited_by_user_id_user_id_fk" FOREIGN KEY ("invited_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "event_organizer_slug_unique" ON "event" USING btree ("organizer_id","slug");--> statement-breakpoint
CREATE INDEX "event_organizer_id_idx" ON "event" USING btree ("organizer_id");--> statement-breakpoint
CREATE INDEX "event_organizer_status_idx" ON "event" USING btree ("organizer_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "organizer_slug_unique" ON "organizer" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "organizer_city_state_idx" ON "organizer" USING btree ("city","state");--> statement-breakpoint
CREATE UNIQUE INDEX "organizer_member_organizer_user_unique" ON "organizer_member" USING btree ("organizer_id","user_id");--> statement-breakpoint
CREATE INDEX "organizer_member_organizer_id_idx" ON "organizer_member" USING btree ("organizer_id");--> statement-breakpoint
CREATE INDEX "organizer_member_user_id_idx" ON "organizer_member" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "organizer_member_role_status_idx" ON "organizer_member" USING btree ("role","status");--> statement-breakpoint
CREATE INDEX "organizer_member_invited_by_user_id_idx" ON "organizer_member" USING btree ("invited_by_user_id");