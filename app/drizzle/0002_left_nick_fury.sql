ALTER TABLE "user_challenge_attempts" ALTER COLUMN "challenge_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "user_challenge_attempts" ADD COLUMN "external_challenge_id" text;--> statement-breakpoint
ALTER TABLE "achievements" ADD COLUMN "image_url" text;--> statement-breakpoint
ALTER TABLE "achievements" ADD COLUMN "criteria_type" text;--> statement-breakpoint
ALTER TABLE "achievements" ADD COLUMN "criteria_value" integer;--> statement-breakpoint
CREATE INDEX "user_challenge_attempts_external_challenge_id_idx" ON "user_challenge_attempts" USING btree ("external_challenge_id");--> statement-breakpoint
CREATE INDEX "user_challenge_attempts_user_external_challenge_idx" ON "user_challenge_attempts" USING btree ("user_id","external_challenge_id");