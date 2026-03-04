CREATE TYPE "public"."course_track" AS ENUM('fundamentals', 'defi', 'nft', 'security', 'frontend');--> statement-breakpoint
CREATE TYPE "public"."difficulty_level" AS ENUM('beginner', 'intermediate', 'advanced');--> statement-breakpoint
CREATE TYPE "public"."achievement_type" AS ENUM('first_steps', 'course_completer', 'speed_runner', 'perfect_score', 'week_warrior', 'monthly_master', 'consistency_king', 'rust_rookie', 'anchor_expert', 'full_stack_solana', 'defi_developer', 'nft_creator', 'helper', 'first_comment', 'top_contributor', 'early_adopter', 'bug_hunter', 'first_enrollment', 'xp_1000', 'xp_5000', 'xp_10000');--> statement-breakpoint
CREATE TABLE "accounts" (
	"userId" text NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"providerAccountId" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text,
	CONSTRAINT "accounts_provider_providerAccountId_pk" PRIMARY KEY("provider","providerAccountId")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sessionToken" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"expires" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verification_tokens" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp with time zone NOT NULL,
	CONSTRAINT "verification_tokens_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
CREATE TABLE "achievements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" text NOT NULL,
	"type" "achievement_type" NOT NULL,
	"awardedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"nftMintAddress" text,
	"xpAwarded" text DEFAULT '0' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "xp_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" text NOT NULL,
	"amount" integer NOT NULL,
	"reason" text NOT NULL,
	"courseId" text,
	"lessonId" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wallet_addresses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" text NOT NULL,
	"address" text NOT NULL,
	"isPrimary" boolean DEFAULT false NOT NULL,
	"verifiedAt" timestamp with time zone,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "wallet_addresses_address_unique" UNIQUE("address")
);
--> statement-breakpoint
ALTER TABLE "course_products" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "products" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "purchases" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "course_products" CASCADE;--> statement-breakpoint
DROP TABLE "products" CASCADE;--> statement-breakpoint
DROP TABLE "purchases" CASCADE;--> statement-breakpoint
ALTER TABLE "users" DROP CONSTRAINT "users_clerkUserId_unique";--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "email" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "name" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "slug" text;--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "difficulty" "difficulty_level" DEFAULT 'beginner' NOT NULL;--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "track" "course_track" DEFAULT 'fundamentals' NOT NULL;--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "durationHours" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "xpReward" integer DEFAULT 500 NOT NULL;--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "thumbnailUrl" text;--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "instructorName" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "emailVerified" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "image" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "username" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "bio" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "xp" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "streak" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "lastActiveDate" date;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "streakFreezeCount" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "websiteUrl" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "twitterHandle" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "githubHandle" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "walletAddress" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "isProfilePublic" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "achievements" ADD CONSTRAINT "achievements_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "xp_events" ADD CONSTRAINT "xp_events_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_addresses" ADD CONSTRAINT "wallet_addresses_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "clerkUserId";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "imageUrl";--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_slug_unique" UNIQUE("slug");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_email_unique" UNIQUE("email");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_username_unique" UNIQUE("username");--> statement-breakpoint
DROP TYPE "public"."product_status";