ALTER TABLE "organizer" ADD COLUMN "review_status" text DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "organizer" ADD COLUMN "entity_type" text DEFAULT 'non-gst' NOT NULL;--> statement-breakpoint
ALTER TABLE "organizer" ADD COLUMN "billing_address" text;--> statement-breakpoint
ALTER TABLE "organizer" ADD COLUMN "finance_contact" text;--> statement-breakpoint
ALTER TABLE "organizer" ADD COLUMN "created_by_user_id" text;--> statement-breakpoint
ALTER TABLE "organizer" ADD COLUMN "reviewed_by_user_id" text;--> statement-breakpoint
ALTER TABLE "organizer" ADD COLUMN "reviewed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "organizer" ADD COLUMN "review_reason" text;--> statement-breakpoint
ALTER TABLE "organizer" ADD CONSTRAINT "organizer_created_by_user_id_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organizer" ADD CONSTRAINT "organizer_reviewed_by_user_id_user_id_fk" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "organizer_created_by_user_unique" ON "organizer" USING btree ("created_by_user_id");--> statement-breakpoint
CREATE INDEX "organizer_review_status_created_at_idx" ON "organizer" USING btree ("review_status","created_at");--> statement-breakpoint
CREATE INDEX "organizer_reviewed_by_user_id_idx" ON "organizer" USING btree ("reviewed_by_user_id");--> statement-breakpoint
ALTER TABLE "organizer" ADD CONSTRAINT "organizer_review_status_check" CHECK ("organizer"."review_status" IN ('pending', 'approved', 'changes-requested', 'rejected', 'suspended'));--> statement-breakpoint
ALTER TABLE "organizer" ADD CONSTRAINT "organizer_entity_type_check" CHECK ("organizer"."entity_type" IN ('gst', 'non-gst'));