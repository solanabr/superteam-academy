ALTER TABLE "lessons" ALTER COLUMN "youtubeVideoId" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "lessons" ADD COLUMN "xp_reward" integer DEFAULT 25 NOT NULL;--> statement-breakpoint
ALTER TABLE "assignments" ADD COLUMN "xp_reward" integer DEFAULT 200 NOT NULL;--> statement-breakpoint
ALTER TABLE "xp_events" ADD COLUMN "assignment_id" uuid;