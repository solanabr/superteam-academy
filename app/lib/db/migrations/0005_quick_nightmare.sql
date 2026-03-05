CREATE TABLE "challenge_submission" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"challengeId" text NOT NULL,
	"code" text,
	"passed" boolean DEFAULT false NOT NULL,
	"xpEarned" integer DEFAULT 0 NOT NULL,
	"submittedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "daily_challenge" (
	"id" text PRIMARY KEY NOT NULL,
	"sanityId" text,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"difficulty" integer DEFAULT 1 NOT NULL,
	"category" text,
	"xpReward" integer DEFAULT 50 NOT NULL,
	"scheduledDate" text,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "daily_challenge_sanityId_unique" UNIQUE("sanityId"),
	CONSTRAINT "daily_challenge_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "challenge_submission" ADD CONSTRAINT "challenge_submission_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "challenge_submission" ADD CONSTRAINT "challenge_submission_challengeId_daily_challenge_id_fk" FOREIGN KEY ("challengeId") REFERENCES "public"."daily_challenge"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "user_challenge_unique" ON "challenge_submission" USING btree ("userId","challengeId");