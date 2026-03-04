ALTER TABLE "courses" ADD COLUMN "onchain_course_id" text;--> statement-breakpoint
CREATE UNIQUE INDEX "courses_onchain_course_id_unique" ON "courses" USING btree ("onchain_course_id");--> statement-breakpoint
UPDATE "courses"
SET "onchain_course_id" = "slug"
WHERE "onchain_course_id" IS NULL AND "slug" IS NOT NULL;
