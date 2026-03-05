ALTER TABLE "user" ADD COLUMN "totalXp" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "level" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "user_activity" ADD COLUMN "courseId" text;--> statement-breakpoint
ALTER TABLE "user_activity" ADD COLUMN "track" text;