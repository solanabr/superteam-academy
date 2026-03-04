ALTER TABLE "products" ADD COLUMN "prerequisites" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "learning_outcomes" jsonb DEFAULT '[]'::jsonb;