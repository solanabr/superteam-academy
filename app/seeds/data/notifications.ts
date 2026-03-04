/**
 * Notification templates by type.
 * Functions generate notification records for given user IDs.
 */

interface SeedNotification {
  userId: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown>;
  read: boolean;
  createdAt: Date;
}

function daysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(Math.floor(Math.random() * 14) + 8); // 8am-10pm
  return d;
}

export function getXpMilestoneNotifications(
  userIds: string[],
): SeedNotification[] {
  const milestones = [100, 250, 500, 1000, 2500, 5000];
  const notifications: SeedNotification[] = [];

  for (const userId of userIds) {
    const milestone = milestones[Math.floor(Math.random() * milestones.length)];
    notifications.push({
      userId,
      type: "xp_milestone",
      title: `${milestone} XP Milestone!`,
      body: `You've earned ${milestone} XP. Keep up the great work!`,
      data: {
        milestone,
        currentXp: milestone + Math.floor(Math.random() * 200),
      },
      read: Math.random() > 0.3,
      createdAt: daysAgo(Math.floor(Math.random() * 14)),
    });
  }
  return notifications;
}

export function getLevelUpNotifications(userIds: string[]): SeedNotification[] {
  return userIds.map((userId, i) => ({
    userId,
    type: "level_up",
    title: `Level ${i + 2} Reached!`,
    body: `You've advanced to Level ${i + 2}. New challenges await!`,
    data: { newLevel: i + 2, previousLevel: i + 1 },
    read: Math.random() > 0.4,
    createdAt: daysAgo(Math.floor(Math.random() * 10)),
  }));
}

export function getAchievementNotifications(
  userAchievements: {
    userId: string;
    achievementName: string;
    xpReward: number;
  }[],
): SeedNotification[] {
  return userAchievements.map((ua) => ({
    userId: ua.userId,
    type: "achievement",
    title: `Achievement Unlocked: ${ua.achievementName}`,
    body: `You earned the "${ua.achievementName}" achievement and ${ua.xpReward} XP!`,
    data: { achievementName: ua.achievementName, xpReward: ua.xpReward },
    read: Math.random() > 0.5,
    createdAt: daysAgo(Math.floor(Math.random() * 7)),
  }));
}

export function getReplyNotifications(
  replies: { userId: string; threadTitle: string; replierName: string }[],
): SeedNotification[] {
  return replies.map((r) => ({
    userId: r.userId,
    type: "reply",
    title: `New reply in "${r.threadTitle}"`,
    body: `${r.replierName} replied to your comment.`,
    data: { threadTitle: r.threadTitle, replierName: r.replierName },
    read: Math.random() > 0.6,
    createdAt: daysAgo(Math.floor(Math.random() * 5)),
  }));
}

export function getCourseAnnouncementNotifications(
  userIds: string[],
): SeedNotification[] {
  const announcements = [
    {
      title: "New Course: Advanced Anchor Patterns",
      body: "A new course on advanced Anchor patterns is now available. Dive deep into PDA architecture and CPIs!",
      data: { courseSlug: "advanced-anchor-patterns" },
    },
    {
      title: "Course Updated: DeFi Fundamentals",
      body: "The DeFi Fundamentals course has been updated with new content on Solana DeFi protocols.",
      data: { courseSlug: "defi-fundamentals" },
    },
    {
      title: "Weekly Challenge Available",
      body: "This week's coding challenge is live! Build a simple token swap program.",
      data: { type: "weekly_challenge" },
    },
  ];

  return userIds.map((userId, i) => {
    const ann = announcements[i % announcements.length];
    return {
      userId,
      type: "course_announcement",
      title: ann.title,
      body: ann.body,
      data: ann.data,
      read: Math.random() > 0.3,
      createdAt: daysAgo(Math.floor(Math.random() * 7) + 1),
    };
  });
}
