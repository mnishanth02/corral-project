CREATE TABLE "event_category" (
	"id" text PRIMARY KEY NOT NULL,
	"event_id" text NOT NULL,
	"label" text NOT NULL,
	"distance" text NOT NULL,
	"min_age" integer,
	"max_age" integer,
	"capacity" integer NOT NULL,
	"registered_count" integer DEFAULT 0 NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "event_category_capacity_check" CHECK ("event_category"."capacity" > 0),
	CONSTRAINT "event_category_registered_count_check" CHECK ("event_category"."registered_count" >= 0),
	CONSTRAINT "event_category_sort_order_check" CHECK ("event_category"."sort_order" >= 0),
	CONSTRAINT "event_category_age_check" CHECK ("event_category"."min_age" IS NULL OR "event_category"."min_age" >= 0),
	CONSTRAINT "event_category_max_age_check" CHECK ("event_category"."max_age" IS NULL OR "event_category"."max_age" >= 0),
	CONSTRAINT "event_category_age_range_check" CHECK ("event_category"."min_age" IS NULL OR "event_category"."max_age" IS NULL OR "event_category"."min_age" <= "event_category"."max_age"),
	CONSTRAINT "event_category_status_check" CHECK ("event_category"."status" IN ('active', 'hidden', 'sold-out'))
);
--> statement-breakpoint
CREATE TABLE "event_fee_tier" (
	"id" text PRIMARY KEY NOT NULL,
	"category_id" text NOT NULL,
	"label" text NOT NULL,
	"amount_in_paise" integer NOT NULL,
	"starts_at" text,
	"ends_at" text,
	"registration_cap" integer,
	"registration_count" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "event_fee_tier_amount_check" CHECK ("event_fee_tier"."amount_in_paise" > 0),
	CONSTRAINT "event_fee_tier_registration_cap_check" CHECK ("event_fee_tier"."registration_cap" IS NULL OR "event_fee_tier"."registration_cap" > 0),
	CONSTRAINT "event_fee_tier_registration_count_check" CHECK ("event_fee_tier"."registration_count" >= 0)
);
--> statement-breakpoint
ALTER TABLE "event" ALTER COLUMN "date" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "event" ALTER COLUMN "starts_at" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "event" ALTER COLUMN "venue_name" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "event" ALTER COLUMN "venue_address" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "event" ALTER COLUMN "city" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "event" ALTER COLUMN "registration_opens_at" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "event" ALTER COLUMN "registration_closes_at" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "event" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "event" ADD COLUMN "map_url" text;--> statement-breakpoint
ALTER TABLE "event" ADD COLUMN "contact_email" text;--> statement-breakpoint
ALTER TABLE "event" ADD COLUMN "contact_phone" text;--> statement-breakpoint
ALTER TABLE "event" ADD COLUMN "race_instructions" text;--> statement-breakpoint
ALTER TABLE "event" ADD COLUMN "waiver_text" text;--> statement-breakpoint
ALTER TABLE "event" ADD COLUMN "refund_policy" text;--> statement-breakpoint
ALTER TABLE "event" ADD COLUMN "medical_declaration" text;--> statement-breakpoint
ALTER TABLE "event" ADD COLUMN "form_fields" text[];--> statement-breakpoint
ALTER TABLE "event" ADD COLUMN "tshirt_sizes" text[];--> statement-breakpoint
ALTER TABLE "event" ADD COLUMN "logo_url" text;--> statement-breakpoint
ALTER TABLE "event" ADD COLUMN "banner_url" text;--> statement-breakpoint
ALTER TABLE "event" ADD COLUMN "ready_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "event" ADD COLUMN "published_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "event" ADD COLUMN "published_by_user_id" text;--> statement-breakpoint
ALTER TABLE "event" ADD COLUMN "created_by_user_id" text;--> statement-breakpoint
ALTER TABLE "event_category" ADD CONSTRAINT "event_category_event_id_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."event"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_fee_tier" ADD CONSTRAINT "event_fee_tier_category_id_event_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."event_category"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "event_category_event_id_idx" ON "event_category" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "event_category_event_status_idx" ON "event_category" USING btree ("event_id","status");--> statement-breakpoint
CREATE INDEX "event_fee_tier_category_id_idx" ON "event_fee_tier" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "event_fee_tier_category_active_idx" ON "event_fee_tier" USING btree ("category_id","is_active");--> statement-breakpoint
ALTER TABLE "event" ADD CONSTRAINT "event_published_by_user_id_user_id_fk" FOREIGN KEY ("published_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event" ADD CONSTRAINT "event_created_by_user_id_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "event_published_by_user_id_idx" ON "event" USING btree ("published_by_user_id");--> statement-breakpoint
CREATE INDEX "event_created_by_user_id_idx" ON "event" USING btree ("created_by_user_id");