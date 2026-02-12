import type { MockNotification } from '@/lib/mock-data';
import { mockNotifications } from '@/lib/mock-data';

export type NotificationType = 'enrollment' | 'completion' | 'achievement' | 'streak_warning' | 'new_course' | 'comment_reply';

export interface NotificationService {
  getNotifications(userId: string, options?: {
    unreadOnly?: boolean;
    limit?: number;
  }): Promise<{ notifications: MockNotification[]; unreadCount: number }>;

  markAsRead(notificationId: string): Promise<void>;
  markAllAsRead(userId: string): Promise<void>;
  deleteNotification(notificationId: string): Promise<void>;

  /**
   * Send email notification
   *
   * Real implementation would:
   * - Use Resend SDK: resend.emails.send({ ... })
   * - Or SendGrid: sgMail.send({ ... })
   * - Template selection based on NotificationType
   * - Unsubscribe link management
   */
  sendEmailNotification(userId: string, template: NotificationType, data: Record<string, string>): Promise<void>;
}

// In-memory state for mock (would be DB in production)
const readState = new Set<string>();

export const notificationService: NotificationService = {
  async getNotifications(userId, options) {
    await delay(150);
    let results = mockNotifications.filter((n) => n.userId === userId);

    if (options?.unreadOnly) {
      results = results.filter((n) => !n.read && !readState.has(n.id));
    }

    const unreadCount = results.filter((n) => !n.read && !readState.has(n.id)).length;

    if (options?.limit) {
      results = results.slice(0, options.limit);
    }

    return {
      notifications: results.map((n) => ({
        ...n,
        read: n.read || readState.has(n.id),
      })),
      unreadCount,
    };
  },

  async markAsRead(notificationId) {
    await delay(50);
    readState.add(notificationId);
  },

  async markAllAsRead(userId) {
    await delay(100);
    mockNotifications
      .filter((n) => n.userId === userId)
      .forEach((n) => readState.add(n.id));
  },

  async deleteNotification(notificationId) {
    await delay(50);
    readState.add(notificationId);
  },

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async sendEmailNotification(_userId, _template, _data) {
    // Stub: would integrate with Resend/SendGrid
    // Example with Resend:
    // const resend = new Resend(process.env.RESEND_API_KEY);
    // await resend.emails.send({
    //   from: 'Superteam Academy <noreply@superteamacademy.com>',
    //   to: userEmail,
    //   subject: getSubjectForTemplate(template),
    //   html: renderTemplate(template, data),
    // });
    await delay(100);
  },
};

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
