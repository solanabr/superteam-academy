-- Add status column to challenges for persisted lifecycle state
ALTER TABLE "challenges"
ADD COLUMN "status" TEXT NOT NULL DEFAULT 'pending';

-- Backfill initial status values based on current time and existing dates/seasons.
-- Daily challenges: use starts_at/ends_at when present.
UPDATE "challenges" AS c
SET "status" = CASE
  WHEN c."type" = 'daily'
    AND c."starts_at" IS NOT NULL
    AND c."ends_at" IS NOT NULL
    AND NOW() BETWEEN c."starts_at" AND c."ends_at"
    THEN 'active'
  WHEN c."type" = 'daily'
    AND c."ends_at" IS NOT NULL
    AND NOW() > c."ends_at"
    THEN 'ended'
  ELSE c."status"
END;

-- Seasonal challenges: derive from linked season start/end.
UPDATE "challenges" AS c
SET "status" = CASE
  WHEN s."start_at" IS NOT NULL
    AND s."end_at" IS NOT NULL
    AND NOW() BETWEEN s."start_at" AND s."end_at"
    THEN 'active'
  WHEN s."end_at" IS NOT NULL
    AND NOW() > s."end_at"
    THEN 'ended'
  ELSE c."status"
END
FROM "seasons" AS s
WHERE c."season_id" = s."id"
  AND c."type" = 'seasonal';

-- Index for efficient status-based queries.
CREATE INDEX "challenges_status_idx" ON "challenges"("status");

