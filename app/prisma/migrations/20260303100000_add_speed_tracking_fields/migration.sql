-- AlterTable
ALTER TABLE "DailyChallengeCompletion" ADD COLUMN "startedAt" TIMESTAMP(3),
ADD COLUMN "testsPassed" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "totalTests" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "DailyChallengeCompletion_date_completedAt_idx" ON "DailyChallengeCompletion"("date", "completedAt");
