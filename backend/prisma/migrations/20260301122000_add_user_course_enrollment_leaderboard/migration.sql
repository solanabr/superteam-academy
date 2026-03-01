-- CreateTable
CREATE TABLE "users" (
    "wallet" TEXT NOT NULL,
    "first_seen_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "total_xp" INTEGER NOT NULL DEFAULT 0,
    "courses_completed" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("wallet")
);

-- CreateTable
CREATE TABLE "courses" (
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

-- CreateTable
CREATE TABLE "enrollments" (
    "wallet" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "enrolled_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tx_signature" TEXT,
    "completed_at" TIMESTAMP(3),
    "xp_earned" INTEGER,

    CONSTRAINT "enrollments_pkey" PRIMARY KEY ("wallet","course_id")
);

-- CreateTable
CREATE TABLE "lesson_completions" (
    "wallet" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "lesson_index" INTEGER NOT NULL,
    "completed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tx_signature" TEXT,

    CONSTRAINT "lesson_completions_pkey" PRIMARY KEY ("wallet","course_id","lesson_index")
);

-- CreateTable
CREATE TABLE "leaderboard_entries" (
    "wallet" TEXT NOT NULL,
    "total_xp" INTEGER NOT NULL DEFAULT 0,
    "courses_completed" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "leaderboard_entries_pkey" PRIMARY KEY ("wallet")
);

-- CreateIndex
CREATE INDEX "enrollments_wallet_course_id_idx" ON "enrollments"("wallet", "course_id");

-- CreateIndex
CREATE INDEX "lesson_completions_wallet_course_id_idx" ON "lesson_completions"("wallet", "course_id");

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_wallet_fkey" FOREIGN KEY ("wallet") REFERENCES "users"("wallet") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("course_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_completions" ADD CONSTRAINT "lesson_completions_wallet_fkey" FOREIGN KEY ("wallet") REFERENCES "users"("wallet") ON DELETE CASCADE ON UPDATE CASCADE;
