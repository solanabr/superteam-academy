-- AlterTable
ALTER TABLE "User" ADD COLUMN "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "onboardingData" JSONB;
ALTER TABLE "User" ADD COLUMN "skillLevel" TEXT;
ALTER TABLE "User" ADD COLUMN "skillScore" INTEGER;
ALTER TABLE "User" ADD COLUMN "assessmentAnswers" JSONB;
ALTER TABLE "User" ADD COLUMN "onboardingCompletedAt" TIMESTAMP(3);

-- Mark existing users who have enrollments as onboarding-complete
UPDATE "User" SET "onboardingCompleted" = true
WHERE id IN (SELECT DISTINCT "userId" FROM "Enrollment");
