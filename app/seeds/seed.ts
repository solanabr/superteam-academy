import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { getPayload } from "./utils/payload";
import { TRACKS, DIFFICULTIES } from "../src/lib/constants";
import { prismaToPayloadCourse } from "./utils/prisma-to-payload";
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecord = Record<string, any>;

async function main() {
  const start = Date.now();

  console.log("🌱 Seeding database...\n");

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. Initialize Payload
  // ═══════════════════════════════════════════════════════════════════════════
  console.log("  Initializing Payload CMS...");
  const payload = await getPayload();
  console.log("  ✓ Payload ready\n");

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. Clear Payload collections
  // ═══════════════════════════════════════════════════════════════════════════
  console.log("  Clearing Payload collections...");
  const [existingCourses, existingTracks, existingDifficulties] =
    await Promise.all([
      payload.find({ collection: "courses", limit: 1000 }),
      payload.find({ collection: "tracks", limit: 1000 }),
      payload.find({ collection: "difficulties", limit: 1000 }),
    ]);
  for (const doc of existingCourses.docs) {
    await payload.delete({ collection: "courses", id: doc.id });
  }
  for (const doc of existingTracks.docs) {
    await payload.delete({ collection: "tracks", id: doc.id });
  }
  for (const doc of existingDifficulties.docs) {
    await payload.delete({ collection: "difficulties", id: doc.id });
  }
  console.log("  ✓ Payload cleared\n");

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. Clear Prisma tables (FK-safe order)
  // ═══════════════════════════════════════════════════════════════════════════
  console.log("  Clearing Prisma tables...");
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
  console.log("  ✓ Prisma cleared\n");

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. Seed tracks into Payload
  // ═══════════════════════════════════════════════════════════════════════════
  console.log("  Seeding tracks (Payload)...");
  const trackDocIdMap = new Map<number, number | string>();
  for (const [id, track] of Object.entries(TRACKS)) {
    const doc = await payload.create({
      collection: "tracks",
      data: {
        trackId: Number(id),
        name: track.name,
        display: track.display,
        short: track.short,
        color: track.color,
        icon: track.icon,
      },
    });
    trackDocIdMap.set(Number(id), doc.id);
  }
  console.log(`  ✓ ${Object.keys(TRACKS).length} tracks\n`);

  // ═══════════════════════════════════════════════════════════════════════════
  // 5. Seed difficulties into Payload
  // ═══════════════════════════════════════════════════════════════════════════
  console.log("  Seeding difficulties (Payload)...");
  const difficultyDocIdMap = new Map<string, number | string>();
  for (const diff of DIFFICULTIES) {
    const doc = await payload.create({
      collection: "difficulties",
      data: {
        value: diff.value,
        label: diff.label,
        color: diff.color,
        order: diff.order,
        defaultXp: diff.defaultXp,
      },
    });
    difficultyDocIdMap.set(diff.value, doc.id);
  }
  console.log(`  ✓ ${DIFFICULTIES.length} difficulties\n`);

  // ═══════════════════════════════════════════════════════════════════════════
  // 6. Seed achievements
  // ═══════════════════════════════════════════════════════════════════════════
  console.log("  Seeding achievements...");
  const achievements = getAchievements();
  for (const a of achievements) {
    await prisma.achievement.create({ data: a });
  }
  console.log(`  ✓ ${achievements.length} achievements\n`);

  // ═══════════════════════════════════════════════════════════════════════════
  // 7. Seed courses → Payload first, then Prisma mirrors
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

    // Create in Payload CMS (source of truth)
    const payloadData = prismaToPayloadCourse(courseData);
    payloadData.track = trackDocIdMap.get(courseData.trackId);
    payloadData.difficulty = difficultyDocIdMap.get(courseData.difficulty);
    const payloadCourse = await payload.create({
      collection: "courses",
      data: payloadData,
    });

    // Create Prisma mirror record for FK integrity
    const payloadModules = (payloadCourse as AnyRecord).modules ?? [];

    const prismaCourse = await prisma.course.create({
      data: {
        id: String(payloadCourse.id),
        slug: courseData.slug,
        title: courseData.title,
        description: courseData.description,
        thumbnail: courseData.thumbnail ?? null,
        difficulty: courseData.difficulty,
        duration: courseData.duration,
        xpTotal: courseData.xpTotal,
        trackId: courseData.trackId,
        trackLevel: courseData.trackLevel,
        trackName: courseData.trackName,
        creator: courseData.creator,
        isActive: courseData.isActive ?? true,
        tags: courseData.tags,
        prerequisites: courseData.prerequisites,
      },
    });

    // Create mirror Module/Lesson/Challenge/TestCase records
    for (let mIdx = 0; mIdx < courseData.modules.create.length; mIdx++) {
      const moduleData = courseData.modules.create[mIdx];
      const payloadModule = payloadModules[mIdx];
      const moduleId = payloadModule?.id ?? `${prismaCourse.id}-m${mIdx}`;

      const prismaModule = await prisma.module.create({
        data: {
          id: moduleId,
          courseId: prismaCourse.id,
          title: moduleData.title,
          description: moduleData.description,
          order: moduleData.order,
        },
      });

      const payloadLessons = payloadModule?.lessons ?? [];

      for (let lIdx = 0; lIdx < moduleData.lessons.create.length; lIdx++) {
        const lessonData = moduleData.lessons.create[lIdx];
        const payloadLesson = payloadLessons[lIdx];
        const lessonId =
          payloadLesson?.id ?? `${prismaCourse.id}-m${mIdx}-l${lIdx}`;

        const prismaLesson = await prisma.lesson.create({
          data: {
            id: lessonId,
            moduleId: prismaModule.id,
            title: lessonData.title,
            description: lessonData.description,
            type: lessonData.type,
            order: lessonData.order,
            xpReward: lessonData.xpReward,
            content: "",
            duration: lessonData.duration ?? "",
          },
        });

        if (lessonData.challenge) {
          const rawChallenge = lessonData.challenge;
          const challengeData =
            "create" in rawChallenge ? rawChallenge.create : rawChallenge;
          const testCases = Array.isArray(challengeData.testCases)
            ? challengeData.testCases
            : (challengeData.testCases?.create ?? []);

          const prismaChallenge = await prisma.challenge.create({
            data: {
              lessonId: prismaLesson.id,
              prompt: "",
              starterCode: challengeData.starterCode,
              language: challengeData.language,
              hints: challengeData.hints ?? [],
              solution: challengeData.solution ?? "",
            },
          });

          for (let tIdx = 0; tIdx < testCases.length; tIdx++) {
            const tc = testCases[tIdx];
            await prisma.testCase.create({
              data: {
                challengeId: prismaChallenge.id,
                name: tc.name,
                input: tc.input,
                expectedOutput: tc.expectedOutput,
                order: tc.order ?? tIdx,
              },
            });
          }
        }

        totalLessons++;
      }

      totalModules++;
    }
  }
  console.log(
    `  ✓ ${allCourseData.length} courses, ${totalModules} modules, ${totalLessons} lessons\n`,
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // 8. Seed users (with social links via nested create)
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
  // 9. Seed enrollments + lesson completions
  // ═══════════════════════════════════════════════════════════════════════════
  console.log("  Seeding enrollments & lesson completions...");

  const courses = await prisma.course.findMany({
    include: {
      modules: {
        include: { lessons: { orderBy: { order: "asc" } } },
        orderBy: { order: "asc" },
      },
    },
    orderBy: { createdAt: "asc" },
  });

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
  // 10. Seed XP events + streaks + daily activities
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
  // 11. Seed user achievements + credentials + activities
  // ═══════════════════════════════════════════════════════════════════════════
  console.log("  Seeding achievements & credentials...");

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
  // 12. Seed discussions (threads + comments + votes)
  // ═══════════════════════════════════════════════════════════════════════════
  console.log("  Seeding discussions...");

  const threadDefs = getThreads();
  let threadCount = 0;
  let commentTotal = 0;
  let voteTotal = 0;

  const firstCourseLessons = courses[0]?.modules[0]?.lessons ?? [];
  const secondCourseLessons = courses[1]?.modules[0]?.lessons ?? [];

  for (let ti = 0; ti < threadDefs.length; ti++) {
    const td = threadDefs[ti];
    const authorId = seedUsers[td.authorIndex].id;

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

    await prisma.thread.update({
      where: { id: thread.id },
      data: { commentCount: flatComments.length },
    });

    const threadVoteCount = randomBetween(1, 6);
    let threadVoteScore = 0;
    const threadVoterIndices = new Set<number>();
    threadVoterIndices.add(td.authorIndex);
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
  // 13. Seed notifications
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
  // 14. Seed daily challenge completions
  // ═══════════════════════════════════════════════════════════════════════════
  console.log("  Seeding daily challenge completions...");

  const challengeUsers = seedUsers.filter((u) =>
    ["power", "active", "discussion"].includes(u.archetype),
  );
  let dailyCompletionCount = 0;

  for (const user of challengeUsers) {
    const daysToSeed = user.archetype === "power" ? 14 : 7;
    for (let d = 0; d < daysToSeed; d++) {
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
  process.exit(0);
}

main().catch(async (e) => {
  console.error("Seed failed:", e);
  process.exit(1);
});
