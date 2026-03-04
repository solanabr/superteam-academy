ALTER TABLE "courses" ADD COLUMN "onchainCourseId" text;--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_onchainCourseId_unique" UNIQUE("onchainCourseId");