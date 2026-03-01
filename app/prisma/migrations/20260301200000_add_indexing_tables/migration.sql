-- Indexing layer: courses, credential_collections, users, enrollments, lesson_completions, leaderboard_entries
-- Uses IF NOT EXISTS for idempotency (backend may have created these in the same DB)

CREATE TABLE IF NOT EXISTS "courses" (
    "course_id" TEXT NOT NULL,
    "track_id" INTEGER NOT NULL,
    "track_level" INTEGER NOT NULL DEFAULT 1,
    "lesson_count" INTEGER NOT NULL,
    "xp_per_lesson" INTEGER NOT NULL,
    "creator" TEXT,
    "tx_signature" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "courses_pkey" PRIMARY KEY ("course_id")
);

CREATE TABLE IF NOT EXISTS "credential_collections" (
    "id" SERIAL NOT NULL,
    "trackId" INTEGER NOT NULL,
    "collection_address" TEXT NOT NULL,
    "name" TEXT,
    "image_url" TEXT,
    "metadata_uri" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "credential_collections_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "credential_collections_track_id_key" ON "credential_collections"("trackId");

CREATE TABLE IF NOT EXISTS "users" (
    "wallet" TEXT NOT NULL,
    "first_seen_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "total_xp" INTEGER NOT NULL DEFAULT 0,
    "courses_completed" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("wallet")
);

CREATE TABLE IF NOT EXISTS "enrollments" (
    "wallet" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "enrolled_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tx_signature" TEXT,
    "completed_at" TIMESTAMP(3),
    "xp_earned" INTEGER,

    CONSTRAINT "enrollments_pkey" PRIMARY KEY ("wallet","course_id")
);

CREATE TABLE IF NOT EXISTS "lesson_completions" (
    "wallet" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "lesson_index" INTEGER NOT NULL,
    "completed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tx_signature" TEXT,

    CONSTRAINT "lesson_completions_pkey" PRIMARY KEY ("wallet","course_id","lesson_index")
);

CREATE INDEX IF NOT EXISTS "lesson_completions_wallet_course_id_idx" ON "lesson_completions"("wallet", "course_id");

CREATE TABLE IF NOT EXISTS "leaderboard_entries" (
    "wallet" TEXT NOT NULL,
    "total_xp" INTEGER NOT NULL DEFAULT 0,
    "courses_completed" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "leaderboard_entries_pkey" PRIMARY KEY ("wallet")
);

-- Add foreign keys only if tables exist and constraints don't
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'enrollments_course_id_fkey') THEN
    ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_course_id_fkey"
      FOREIGN KEY ("course_id") REFERENCES "courses"("course_id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'enrollments_wallet_fkey') THEN
    ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_wallet_fkey"
      FOREIGN KEY ("wallet") REFERENCES "users"("wallet") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'lesson_completions_wallet_fkey') THEN
    ALTER TABLE "lesson_completions" ADD CONSTRAINT "lesson_completions_wallet_fkey"
      FOREIGN KEY ("wallet") REFERENCES "users"("wallet") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
