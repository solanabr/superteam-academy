import { prisma } from "@/lib/db";
import type { AppNotification } from "@/types";

const XP_MILESTONES = [100, 500, 1_000, 5_000, 10_000, 25_000, 50_000, 100_000];

function levelFromXP(xp: number): number {
  return Math.floor(Math.sqrt(xp / 100));
}

export class NotificationService {
  // ── Read ────────────────────────────────────────────────────────────────────

  async getNotifications(
    userId: string,
    opts: { limit?: number; offset?: number } = {},
  ): Promise<AppNotification[]> {
    const rows = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: opts.limit ?? 50,
      skip: opts.offset ?? 0,
    });

    return rows.map((r) => ({
      id: r.id,
      type: r.type as AppNotification["type"],
      title: r.title,
      body: r.body,
      data: r.data as Record<string, unknown>,
      read: r.read,
      createdAt: r.createdAt.toISOString(),
    }));
  }

  async getUnreadCount(userId: string): Promise<number> {
    return prisma.notification.count({ where: { userId, read: false } });
  }

  // ── Write ───────────────────────────────────────────────────────────────────

  async markRead(userId: string, id: string): Promise<void> {
    await prisma.notification.updateMany({
      where: { id, userId },
      data: { read: true },
    });
  }

  async markAllRead(userId: string): Promise<void> {
    await prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
  }

  // ── Triggers ─────────────────────────────────────────────────────────────

  /** Idempotent — creates at most one notification per milestone level. */
  async maybeCreateXpMilestone(
    userId: string,
    newTotalXp: number,
  ): Promise<void> {
    for (const milestone of XP_MILESTONES) {
      if (newTotalXp < milestone) break;

      const key = `xp_milestone_${milestone}`;
      const exists = await prisma.notification.findFirst({
        where: {
          userId,
          type: "xp_milestone",
          data: { path: ["key"], equals: key },
        },
        select: { id: true },
      });
      if (exists) continue;

      await prisma.notification.create({
        data: {
          userId,
          type: "xp_milestone",
          title: `${milestone.toLocaleString()} XP reached!`,
          body: `You've accumulated ${milestone.toLocaleString()} total XP. Keep going!`,
          data: { key, milestone },
        },
      });
    }
  }

  /** Idempotent per level — one notification per unique level-up event. */
  async createLevelUp(
    userId: string,
    prevLevel: number,
    newLevel: number,
  ): Promise<void> {
    if (newLevel <= prevLevel) return;

    for (let lvl = prevLevel + 1; lvl <= newLevel; lvl++) {
      const key = `level_up_${lvl}`;
      const exists = await prisma.notification.findFirst({
        where: {
          userId,
          type: "level_up",
          data: { path: ["key"], equals: key },
        },
        select: { id: true },
      });
      if (exists) continue;

      await prisma.notification.create({
        data: {
          userId,
          type: "level_up",
          title: `Level ${lvl} unlocked!`,
          body: `Congratulations — you've reached Level ${lvl}. Keep building!`,
          data: { key, level: lvl },
        },
      });
    }
  }

  /** Idempotent per achievementId. */
  async createAchievementNotification(
    userId: string,
    payload: {
      achievementId: number;
      achievementName: string;
      xpReward: number;
      icon: string;
    },
  ): Promise<void> {
    const key = `achievement_${payload.achievementId}`;
    const exists = await prisma.notification.findFirst({
      where: {
        userId,
        type: "achievement",
        data: { path: ["key"], equals: key },
      },
      select: { id: true },
    });
    if (exists) return;

    await prisma.notification.create({
      data: {
        userId,
        type: "achievement",
        title: `Achievement unlocked: ${payload.achievementName}`,
        body: `You earned the "${payload.achievementName}" achievement and ${payload.xpReward} XP.`,
        data: { key, ...payload },
      },
    });
  }

  /** Bulk-insert a course announcement to all enrolled users. */
  async broadcastCourseAnnouncement(
    courseId: string,
    title: string,
    body: string,
  ): Promise<void> {
    const enrollments = await prisma.enrollment.findMany({
      where: { courseId },
      select: { userId: true },
    });

    if (enrollments.length === 0) return;

    await prisma.notification.createMany({
      data: enrollments.map((e) => ({
        userId: e.userId,
        type: "course_announcement",
        title,
        body,
        data: { courseId },
      })),
    });
  }
}
