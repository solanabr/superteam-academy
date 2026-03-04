import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { getAchievements } from "./data/achievements";
import {
  getCourse1,
  getCourse2,
  getCourse3,
  getCourse4,
  getCourse5,
  getCourse6,
  getRustForSolanaCourse,
  getAdvancedAnchorPatternsCourse,
} from "./data/courses";
import { getUsers, type SeedUser } from "./data/users";
import { getThreads, type SeedComment } from "./data/discussions";
import {
  getXpMilestoneNotifications,
  getLevelUpNotifications,
  getAchievementNotifications,
  getReplyNotifications,
  getCourseAnnouncementNotifications,
} from "./data/notifications";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function daysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function main() {
  const start = Date.now();

  console.log("🌱 Seeding database...\n");

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. Clear all tables (FK-safe order)
  // ═══════════════════════════════════════════════════════════════════════════
  console.log("  Clearing existing data...");
  await prisma.commentVote.deleteMany();
  await prisma.threadVote.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.thread.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.dailyChallengeCompletion.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.xPEvent.deleteMany();
  await prisma.userAchievement.deleteMany();
  await prisma.userCredential.deleteMany();
  await prisma.dailyActivity.deleteMany();
  await prisma.streakData.deleteMany();
  await prisma.lessonCompletion.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.testCase.deleteMany();
  await prisma.challenge.deleteMany();
  await prisma.lesson.deleteMany();
  await prisma.module.deleteMany();
  await prisma.course.deleteMany();
  await prisma.achievement.deleteMany();
  await prisma.socialLinks.deleteMany();
  await prisma.newsletter.deleteMany();
  await prisma.user.deleteMany();
  console.log("  ✓ Cleared\n");

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. Seed achievements
  // ═══════════════════════════════════════════════════════════════════════════
  console.log("  Seeding achievements...");
  const achievements = getAchievements();
  for (const a of achievements) {
    await prisma.achievement.create({ data: a });
  }
  console.log(`  ✓ ${achievements.length} achievements\n`);

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. Seed courses
  // ═══════════════════════════════════════════════════════════════════════════
  const allCourseData = [
    getCourse1(),
    getCourse2(),
    getCourse3(),
    getCourse4(),
    getCourse5(),
    getCourse6(),
    getRustForSolanaCourse(),
    getAdvancedAnchorPatternsCourse(),
  ];

  let totalModules = 0;
  let totalLessons = 0;
  for (const courseData of allCourseData) {
    console.log(`  Seeding course: ${courseData.title}...`);
    await prisma.course.create({ data: courseData });
    const mc = courseData.modules.create.length;
    const lc = courseData.modules.create.reduce(
      (sum: number, m: { lessons: { create: unknown[] } }) =>
        sum + m.lessons.create.length,
      0,
    );
    totalModules += mc;
    totalLessons += lc;
  }
  console.log(
    `  ✓ ${allCourseData.length} courses, ${totalModules} modules, ${totalLessons} lessons\n`,
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. Seed users (with social links via nested create)
  // ═══════════════════════════════════════════════════════════════════════════
  console.log("  Seeding users...");
  const seedUsers = getUsers();
  const testWallets = (process.env.TEST_WALLETS ?? "")
    .split(",")
    .map((w) => w.trim())
    .filter(Boolean);
  for (let i = 0; i < testWallets.length && i < seedUsers.length; i++) {
    seedUsers[i].wallet = testWallets[i];
  }
  for (const u of seedUsers) {
    await prisma.user.create({
      data: {
        id: u.id,
        displayName: u.displayName,
        wallet: u.wallet,
        bio: u.bio,
        isPublic: u.isPublic,
        onboardingCompleted: u.onboardingCompleted,
        skillLevel: u.skillLevel,
        createdAt: daysAgo(randomBetween(7, 90)),
        ...(u.socialLinks
          ? {
              socialLinks: {
                create: u.socialLinks,
              },
            }
          : {}),
      },
    });
  }
  console.log(`  ✓ ${seedUsers.length} users\n`);

  // ═══════════════════════════════════════════════════════════════════════════
  // 5. Seed enrollments + lesson completions
  // ═══════════════════════════════════════════════════════════════════════════
  console.log("  Seeding enrollments & lesson completions...");

  // Query back courses with their lessons
  const courses = await prisma.course.findMany({
    include: {
      modules: {
        include: { lessons: { orderBy: { order: "asc" } } },
        orderBy: { order: "asc" },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  // Define enrollment patterns per archetype
  const enrollmentPlan: Record<
    SeedUser["archetype"],
    { courseCount: number; completionRate: number }
  > = {
    power: { courseCount: 7, completionRate: 0.95 },
    active: { courseCount: 4, completionRate: 0.7 },
    casual: { courseCount: 2, completionRate: 0.4 },
    new: { courseCount: 1, completionRate: 0.1 },
    discussion: { courseCount: 3, completionRate: 0.6 },
    lurker: { courseCount: 2, completionRate: 0.15 },
  };

  let enrollmentCount = 0;
  let completionCount = 0;

  for (const user of seedUsers) {
    const plan = enrollmentPlan[user.archetype];
    const userCourses = courses.slice(
      0,
      Math.min(plan.courseCount, courses.length),
    );

    for (const course of userCourses) {
      const allLessons = course.modules.flatMap((m) => m.lessons);
      const completedCount = Math.floor(
        allLessons.length * plan.completionRate,
      );
      const isCompleted = completedCount >= allLessons.length;

      const enrollment = await prisma.enrollment.create({
        data: {
          userId: user.id,
          courseId: course.id,
          enrolledAt: daysAgo(randomBetween(14, 60)),
          completedAt: isCompleted ? daysAgo(randomBetween(1, 13)) : null,
          lastAccessedAt: daysAgo(randomBetween(0, 7)),
        },
      });
      enrollmentCount++;

      // Create lesson completions
      const lessonsToComplete = allLessons.slice(0, completedCount);
      for (const lesson of lessonsToComplete) {
        await prisma.lessonCompletion.create({
          data: {
            enrollmentId: enrollment.id,
            lessonId: lesson.id,
            xpEarned: lesson.xpReward,
            completedAt: daysAgo(randomBetween(1, 30)),
          },
        });
        completionCount++;
      }
    }
  }
  console.log(
    `  ✓ ${enrollmentCount} enrollments, ${completionCount} lesson completions\n`,
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // 6. Seed XP events + streaks + daily activities
  // ═══════════════════════════════════════════════════════════════════════════
  console.log("  Seeding XP events & streaks...");

  const xpSources = [
    "lesson",
    "challenge",
    "streak",
    "achievement",
    "daily_challenge",
    "bonus",
  ] as const;
  let xpEventCount = 0;

  for (const user of seedUsers) {
    // XP events based on archetype
    const eventCounts: Record<SeedUser["archetype"], number> = {
      power: 120,
      active: 60,
      casual: 20,
      new: 5,
      discussion: 40,
      lurker: 8,
    };

    const numEvents = eventCounts[user.archetype];
    for (let i = 0; i < numEvents; i++) {
      const source = xpSources[Math.floor(Math.random() * xpSources.length)];
      const amounts: Record<string, [number, number]> = {
        lesson: [20, 80],
        challenge: [30, 100],
        streak: [10, 25],
        achievement: [25, 300],
        daily_challenge: [15, 50],
        bonus: [10, 50],
      };
      const [min, max] = amounts[source];
      await prisma.xPEvent.create({
        data: {
          userId: user.id,
          amount: randomBetween(min, max),
          source,
          createdAt: daysAgo(randomBetween(0, 60)),
        },
      });
      xpEventCount++;
    }
  }
  console.log(`  ✓ ${xpEventCount} XP events`);

  // Streaks for non-new users
  const streakUsers = seedUsers.filter((u) => u.archetype !== "new");
  let streakCount = 0;
  for (const user of streakUsers) {
    const streakLengths: Record<string, [number, number]> = {
      power: [30, 60],
      active: [7, 25],
      casual: [2, 7],
      discussion: [5, 15],
      lurker: [1, 3],
    };
    const [minS, maxS] = streakLengths[user.archetype] ?? [1, 5];
    const currentStreak = randomBetween(minS, maxS);
    const longestStreak = Math.max(
      currentStreak,
      randomBetween(currentStreak, currentStreak + 20),
    );

    const streak = await prisma.streakData.create({
      data: {
        userId: user.id,
        currentStreak,
        longestStreak,
        lastActivityDate: daysAgo(0),
      },
    });
    streakCount++;

    // Daily activities for the streak period
    for (let d = 0; d < currentStreak; d++) {
      await prisma.dailyActivity.create({
        data: {
          streakDataId: streak.id,
          date: daysAgo(d),
          active: true,
        },
      });
    }
  }
  console.log(`  ✓ ${streakCount} streaks\n`);

  // ═══════════════════════════════════════════════════════════════════════════
  // 7. Seed user achievements + credentials + activities
  // ═══════════════════════════════════════════════════════════════════════════
  console.log("  Seeding achievements & credentials...");

  // Achievement claims — power users get more
  const achievementClaims: { userId: string; achievementId: number }[] = [];
  const achievementMap = new Map(achievements.map((a) => [a.id, a]));

  for (const user of seedUsers) {
    const claimCounts: Record<SeedUser["archetype"], number> = {
      power: 8,
      active: 4,
      casual: 2,
      new: 0,
      discussion: 3,
      lurker: 1,
    };
    const numClaims = claimCounts[user.archetype];
    const shuffled = [...achievements].sort(() => Math.random() - 0.5);
    for (let i = 0; i < Math.min(numClaims, shuffled.length); i++) {
      achievementClaims.push({
        userId: user.id,
        achievementId: shuffled[i].id,
      });
    }
  }

  let claimCount = 0;
  for (const claim of achievementClaims) {
    await prisma.userAchievement.create({
      data: {
        userId: claim.userId,
        achievementId: claim.achievementId,
        claimedAt: daysAgo(randomBetween(1, 30)),
      },
    });
    claimCount++;
  }
  console.log(`  ✓ ${claimCount} achievement claims`);

  // Credentials for power & active users
  const credentialUsers = seedUsers.filter((u) =>
    ["power", "active"].includes(u.archetype),
  );
  let credentialCount = 0;
  for (const user of credentialUsers) {
    const tracks = user.archetype === "power" ? [0, 1, 2] : [0];
    for (const trackId of tracks) {
      const trackNames: Record<number, string> = {
        0: "Solana Core",
        1: "Anchor",
        2: "Rust for Solana",
      };
      await prisma.userCredential.create({
        data: {
          userId: user.id,
          trackId,
          trackName: trackNames[trackId] ?? "Unknown",
          currentLevel: user.archetype === "power" ? 3 : 1,
          coursesCompleted: user.archetype === "power" ? 3 : 1,
          totalXpEarned: user.archetype === "power" ? 2400 : 600,
        },
      });
      credentialCount++;
    }
  }
  console.log(`  ✓ ${credentialCount} credentials`);

  // Activity log entries
  const activityTypes = [
    "lesson_completed",
    "challenge_passed",
    "course_enrolled",
    "course_completed",
    "achievement_claimed",
  ] as const;
  let activityCount = 0;
  for (const user of seedUsers) {
    const numActivities = user.archetype === "new" ? 2 : randomBetween(5, 15);
    for (let i = 0; i < numActivities; i++) {
      const type =
        activityTypes[Math.floor(Math.random() * activityTypes.length)];
      await prisma.activity.create({
        data: {
          userId: user.id,
          type,
          data: { source: "seed" },
          createdAt: daysAgo(randomBetween(0, 30)),
        },
      });
      activityCount++;
    }
  }
  console.log(`  ✓ ${activityCount} activities\n`);

  // ═══════════════════════════════════════════════════════════════════════════
  // 8. Seed discussions (threads + comments + votes)
  // ═══════════════════════════════════════════════════════════════════════════
  console.log("  Seeding discussions...");

  const threadDefs = getThreads();
  let threadCount = 0;
  let commentTotal = 0;
  let voteTotal = 0;

  // For lesson-scoped threads, pick real lesson/course IDs
  const firstCourseLessons = courses[0]?.modules[0]?.lessons ?? [];
  const secondCourseLessons = courses[1]?.modules[0]?.lessons ?? [];

  for (let ti = 0; ti < threadDefs.length; ti++) {
    const td = threadDefs[ti];
    const authorId = seedUsers[td.authorIndex].id;

    // Assign real lesson/course IDs for lesson-scoped threads
    let lessonId: string | null = null;
    let courseId: string | null = null;
    if (td.scope === "lesson") {
      if (ti === 5 && firstCourseLessons.length > 0) {
        lessonId = firstCourseLessons[0].id;
        courseId = courses[0].id;
      } else if (ti === 6 && secondCourseLessons.length > 0) {
        lessonId = secondCourseLessons[0].id;
        courseId = courses[1].id;
      }
    }

    const thread = await prisma.thread.create({
      data: {
        title: td.title,
        body: td.body,
        preview: td.body.slice(0, 200),
        scope: td.scope,
        category: td.category ?? null,
        tags: td.tags,
        authorId,
        isPinned: td.isPinned ?? false,
        lessonId,
        courseId,
        createdAt: daysAgo(randomBetween(3, 30)),
      },
    });
    threadCount++;

    // Flatten comment tree and create with materialized paths
    interface FlatComment {
      authorIndex: number;
      body: string;
      depth: number;
      parentPath: string;
      parentId: string | null;
    }

    function flattenComments(
      comments: SeedComment[],
      parentPath: string,
      parentId: string | null,
      depth: number,
    ): FlatComment[] {
      const result: FlatComment[] = [];
      for (let i = 0; i < comments.length; i++) {
        const c = comments[i];
        const currentPath = parentPath ? `${parentPath}.${i}` : `${i}`;
        result.push({
          authorIndex: c.authorIndex,
          body: c.body,
          depth,
          parentPath: currentPath,
          parentId,
        });
        if (c.children) {
          result.push(
            ...flattenComments(
              c.children,
              currentPath,
              `placeholder_${currentPath}`,
              depth + 1,
            ),
          );
        }
      }
      return result;
    }

    const flatComments = flattenComments(td.comments, "", null, 0);

    // Create comments in order, tracking IDs for parent references
    const pathToId = new Map<string, string>();
    for (const fc of flatComments) {
      const realParentId = fc.parentId
        ? (pathToId.get(fc.parentId.replace("placeholder_", "")) ?? null)
        : null;

      const comment = await prisma.comment.create({
        data: {
          threadId: thread.id,
          authorId: seedUsers[fc.authorIndex].id,
          body: fc.body,
          depth: fc.depth,
          path: fc.parentPath,
          parentId: realParentId,
          createdAt: daysAgo(randomBetween(0, 20)),
        },
      });
      pathToId.set(fc.parentPath, comment.id);
      commentTotal++;

      // Random votes on comments
      const numVotes = randomBetween(0, 3);
      let commentVoteScore = 0;
      const voterIndices = new Set<number>();
      for (let v = 0; v < numVotes; v++) {
        let voterIdx: number;
        do {
          voterIdx = Math.floor(Math.random() * seedUsers.length);
        } while (voterIdx === fc.authorIndex || voterIndices.has(voterIdx));
        voterIndices.add(voterIdx);

        const value = Math.random() > 0.2 ? 1 : -1;
        commentVoteScore += value;
        await prisma.commentVote.create({
          data: {
            commentId: comment.id,
            userId: seedUsers[voterIdx].id,
            value,
          },
        });
        voteTotal++;
      }

      if (commentVoteScore !== 0) {
        await prisma.comment.update({
          where: { id: comment.id },
          data: { voteScore: commentVoteScore },
        });
      }
    }

    // Update thread comment count
    await prisma.thread.update({
      where: { id: thread.id },
      data: { commentCount: flatComments.length },
    });

    // Thread votes
    const threadVoteCount = randomBetween(1, 6);
    let threadVoteScore = 0;
    const threadVoterIndices = new Set<number>();
    threadVoterIndices.add(td.authorIndex); // author can't vote own thread
    for (let v = 0; v < threadVoteCount; v++) {
      let voterIdx: number;
      do {
        voterIdx = Math.floor(Math.random() * seedUsers.length);
      } while (threadVoterIndices.has(voterIdx));
      threadVoterIndices.add(voterIdx);

      const value = Math.random() > 0.15 ? 1 : -1;
      threadVoteScore += value;
      await prisma.threadVote.create({
        data: {
          threadId: thread.id,
          userId: seedUsers[voterIdx].id,
          value,
        },
      });
      voteTotal++;
    }

    await prisma.thread.update({
      where: { id: thread.id },
      data: { voteScore: threadVoteScore, viewCount: randomBetween(10, 200) },
    });
  }
  console.log(
    `  ✓ ${threadCount} threads, ${commentTotal} comments, ${voteTotal} votes\n`,
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // 9. Seed notifications
  // ═══════════════════════════════════════════════════════════════════════════
  console.log("  Seeding notifications...");

  const allUserIds = seedUsers.map((u) => u.id);
  const activeUserIds = seedUsers
    .filter((u) => !["new", "lurker"].includes(u.archetype))
    .map((u) => u.id);

  const notifications = [
    ...getXpMilestoneNotifications(activeUserIds),
    ...getLevelUpNotifications(activeUserIds),
    ...getAchievementNotifications(
      achievementClaims.slice(0, 10).map((c) => ({
        userId: c.userId,
        achievementName:
          achievementMap.get(c.achievementId)?.name ?? "Achievement",
        xpReward: achievementMap.get(c.achievementId)?.xpReward ?? 50,
      })),
    ),
    ...getReplyNotifications([
      {
        userId: seedUsers[2].id,
        threadTitle: "How to handle PDA bumps in Anchor?",
        replierName: "Thread King",
      },
      {
        userId: seedUsers[7].id,
        threadTitle: "Understanding Solana's account model vs Ethereum's",
        replierName: "Thread King",
      },
      {
        userId: seedUsers[5].id,
        threadTitle: "Confused about rent exemption calculation",
        replierName: "Debbie Discuss",
      },
      {
        userId: seedUsers[6].id,
        threadTitle: "Error: AccountNotInitialized in challenge 2.3",
        replierName: "Priya Rust",
      },
      {
        userId: seedUsers[0].id,
        threadTitle: "Built a token-gated NFT gallery",
        replierName: "Suki Token",
      },
    ]),
    ...getCourseAnnouncementNotifications(allUserIds),
  ];

  for (const n of notifications) {
    await prisma.notification.create({ data: n });
  }
  console.log(`  ✓ ${notifications.length} notifications\n`);

  // ═══════════════════════════════════════════════════════════════════════════
  // 10. Seed daily challenge completions
  // ═══════════════════════════════════════════════════════════════════════════
  console.log("  Seeding daily challenge completions...");

  const challengeUsers = seedUsers.filter((u) =>
    ["power", "active", "discussion"].includes(u.archetype),
  );
  let dailyCompletionCount = 0;

  for (const user of challengeUsers) {
    const daysToSeed = user.archetype === "power" ? 14 : 7;
    for (let d = 0; d < daysToSeed; d++) {
      // Skip some days randomly for realism
      if (Math.random() < 0.3) continue;

      const date = daysAgo(d);
      const dateStr = date.toISOString().slice(0, 10);

      await prisma.dailyChallengeCompletion.create({
        data: {
          userId: user.id,
          challengeId: `daily_${dateStr}`,
          date: dateStr,
          xpEarned: randomBetween(15, 50),
          startedAt: date,
          completedAt: date,
          testsPassed: randomBetween(3, 5),
          totalTests: 5,
        },
      });
      dailyCompletionCount++;
    }
  }
  console.log(`  ✓ ${dailyCompletionCount} daily challenge completions\n`);

  // ═══════════════════════════════════════════════════════════════════════════
  // Summary
  // ═══════════════════════════════════════════════════════════════════════════
  const counts = {
    users: await prisma.user.count(),
    courses: await prisma.course.count(),
    modules: await prisma.module.count(),
    lessons: await prisma.lesson.count(),
    challenges: await prisma.challenge.count(),
    achievements: await prisma.achievement.count(),
    enrollments: await prisma.enrollment.count(),
    completions: await prisma.lessonCompletion.count(),
    xpEvents: await prisma.xPEvent.count(),
    streaks: await prisma.streakData.count(),
    userAchievements: await prisma.userAchievement.count(),
    credentials: await prisma.userCredential.count(),
    activities: await prisma.activity.count(),
    threads: await prisma.thread.count(),
    comments: await prisma.comment.count(),
    threadVotes: await prisma.threadVote.count(),
    commentVotes: await prisma.commentVote.count(),
    notifications: await prisma.notification.count(),
    dailyCompletions: await prisma.dailyChallengeCompletion.count(),
  };

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`  Users:               ${counts.users}`);
  console.log(`  Courses:             ${counts.courses}`);
  console.log(`  Modules:             ${counts.modules}`);
  console.log(`  Lessons:             ${counts.lessons}`);
  console.log(`  Challenges:          ${counts.challenges}`);
  console.log(`  Achievements:        ${counts.achievements}`);
  console.log(`  Enrollments:         ${counts.enrollments}`);
  console.log(`  Lesson completions:  ${counts.completions}`);
  console.log(`  XP events:           ${counts.xpEvents}`);
  console.log(`  Streaks:             ${counts.streaks}`);
  console.log(`  User achievements:   ${counts.userAchievements}`);
  console.log(`  Credentials:         ${counts.credentials}`);
  console.log(`  Activities:          ${counts.activities}`);
  console.log(`  Threads:             ${counts.threads}`);
  console.log(`  Comments:            ${counts.comments}`);
  console.log(`  Thread votes:        ${counts.threadVotes}`);
  console.log(`  Comment votes:       ${counts.commentVotes}`);
  console.log(`  Notifications:       ${counts.notifications}`);
  console.log(`  Daily completions:   ${counts.dailyCompletions}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`\n🌱 Seed complete in ${elapsed}s!`);

  await prisma.$disconnect();
  await pool.end();
}

main().catch(async (e) => {
  console.error("Seed failed:", e);
  process.exit(1);
});
