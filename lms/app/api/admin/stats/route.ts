import { NextRequest, NextResponse } from "next/server";
import {
  fetchConfig,
  fetchAllCourses,
  fetchAllLearnerProfiles,
  fetchAllMinterRoles,
  fetchAllAchievementTypes,
} from "@/lib/solana/readers";
import { connectDB } from "@/lib/db/mongodb";
import { User } from "@/lib/db/models/user";
import { Enrollment } from "@/lib/db/models/enrollment";
import { CourseModel } from "@/lib/db/models/course";

export async function GET(req: NextRequest) {
  const adminSecret = req.headers.get("x-admin-secret");
  if (!adminSecret || adminSecret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const [config, courses, onChainLearners, minters, achievementTypes] =
    await Promise.all([
      fetchConfig(),
      fetchAllCourses(),
      fetchAllLearnerProfiles(),
      fetchAllMinterRoles(),
      fetchAllAchievementTypes(),
    ]);

  // Read from MongoDB for real learner/enrollment data
  await connectDB();
  const [dbUsers, dbEnrollments, dbCourses] = await Promise.all([
    User.find({ wallet: { $ne: "guest" } }).lean(),
    Enrollment.find({}).lean(),
    CourseModel.find({}, { courseId: 1, contentTxId: 1, onChainAddress: 1 }).lean(),
  ]);

  const dbCourseMap = new Map<string, { contentTxId?: string; onChainAddress?: string }>();
  for (const dc of dbCourses) {
    dbCourseMap.set((dc as any).courseId, {
      contentTxId: (dc as any).contentTxId,
      onChainAddress: (dc as any).onChainAddress,
    });
  }

  // Build enrollment counts per course from DB
  const enrollmentsByCourseid: Record<
    string,
    { enrollments: number; completions: number }
  > = {};
  for (const e of dbEnrollments) {
    const cid = (e as any).courseId as string;
    if (!enrollmentsByCourseid[cid]) {
      enrollmentsByCourseid[cid] = { enrollments: 0, completions: 0 };
    }
    enrollmentsByCourseid[cid].enrollments++;
    if ((e as any).completedAt) {
      enrollmentsByCourseid[cid].completions++;
    }
  }

  return NextResponse.json({
    config: config
      ? {
          authority: config.authority?.toBase58?.() ?? null,
          backendSigner: config.backendSigner?.toBase58?.() ?? null,
          xpMint: config.xpMint?.toBase58?.() ?? null,
          currentSeason: config.currentSeason,
          seasonClosed: config.seasonClosed,
          totalCoursesCreated: config.totalCoursesCreated,
          maxDailyXp: config.maxDailyXp,
          maxAchievementXp: config.maxAchievementXp,
        }
      : null,
    courses: courses.map((c) => {
      const dbStats = enrollmentsByCourseid[c.course.courseId];
      const dbInfo = dbCourseMap.get(c.course.courseId);
      return {
        publicKey: c.publicKey.toBase58(),
        courseId: c.course.courseId,
        creator: c.course.creator?.toBase58?.() ?? null,
        isActive: c.course.isActive,
        lessonCount: c.course.lessonCount,
        enrollments: dbStats?.enrollments ?? c.course.enrollments,
        completions: dbStats?.completions ?? c.course.completions,
        xpPerLesson: c.course.xpPerLesson,
        difficulty: c.course.difficulty,
        trackId: c.course.trackId,
        trackLevel: c.course.trackLevel,
        creatorRewardXp: c.course.creatorRewardXp,
        minCompletionsForReward: c.course.minCompletionsForReward,
        contentTxId: dbInfo?.contentTxId ?? null,
      };
    }),
    // Use DB user count (real data), on-chain as secondary
    learnerCount: Math.max(dbUsers.length, onChainLearners.length),
    learners: dbUsers.map((u: any) => ({
      wallet: u.wallet,
      displayName: u.displayName ?? null,
      xp: u.xp ?? 0,
      streak: u.streak?.current ?? 0,
      joinedAt: u.joinedAt,
    })),
    enrollments: dbEnrollments.map((e: any) => ({
      userId: e.userId,
      courseId: e.courseId,
      lessonsCompleted: e.lessonsCompleted?.length ?? 0,
      totalLessons: e.totalLessons,
      percentComplete: e.percentComplete ?? 0,
      completedAt: e.completedAt ?? null,
      enrolledAt: e.enrolledAt,
    })),
    minters: minters.map((m) => ({
      publicKey: m.publicKey.toBase58(),
      minter: m.minterRole.minter?.toBase58?.() ?? null,
      label: m.minterRole.label,
      maxXpPerCall: m.minterRole.maxXpPerCall,
    })),
    achievementTypes: achievementTypes.map((a) => ({
      publicKey: a.publicKey.toBase58(),
      achievementId: a.achievementType.achievementId,
      name: a.achievementType.name,
      collection: a.achievementType.collection?.toBase58?.() ?? null,
      maxSupply: a.achievementType.maxSupply,
      awarded: a.achievementType.awarded,
      xpReward: a.achievementType.xpReward,
      isActive: a.achievementType.isActive,
    })),
  });
}
