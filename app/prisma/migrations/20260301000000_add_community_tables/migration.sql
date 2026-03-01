-- CreateTable
CREATE TABLE IF NOT EXISTS "community_threads" (
    "id" BIGSERIAL NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "author_name" TEXT NOT NULL DEFAULT 'Anonymous',
    "wallet_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "community_threads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "community_replies" (
    "id" BIGSERIAL NOT NULL,
    "thread_id" BIGINT NOT NULL,
    "body" TEXT NOT NULL,
    "author_name" TEXT NOT NULL DEFAULT 'Anonymous',
    "wallet_address" TEXT,
    "is_accepted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "community_replies_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "community_threads_created_at_idx" ON "community_threads"("created_at" DESC);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "community_threads_type_created_at_idx" ON "community_threads"("type", "created_at" DESC);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "community_replies_thread_id_created_at_idx" ON "community_replies"("thread_id", "created_at" ASC);

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'community_replies_thread_id_fkey'
  ) THEN
    ALTER TABLE "community_replies" ADD CONSTRAINT "community_replies_thread_id_fkey"
      FOREIGN KEY ("thread_id") REFERENCES "community_threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
