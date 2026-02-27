/**
 * Email Service
 * Sends email notifications for user activities
 * Supports both SMTP and email API services
 */

import { connectToDatabase } from '@/lib/mongodb';
import { User } from '@/models/User';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

interface NotificationEmailData {
  userName: string;
  actionType:
    | 'comment_reply'
    | 'post_like'
    | 'comment_like'
    | 'mention'
    | 'achievement'
    | 'xp_reward';
  actionContent: string;
  actionUrl: string;
  actionLabel: string;
}

interface GenericNotificationEmailData {
  userEmail: string;
  userName: string;
  title: string;
  message: string;
  actionUrl?: string;
  actionLabel?: string;
}

/**
 * Send raw email
 */
async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    await connectToDatabase();

    const user = await User.findOne({ email: options.to }).select('email_notifications');
    if (user && user.email_notifications === false) {
      return false;
    }

    // Check which email service is configured
    const provider = process.env.EMAIL_PROVIDER || 'sendgrid';

    if (provider === 'sendgrid') {
      return await sendViaResend(options);
    } else if (provider === 'smtp') {
      return await sendViaSMTP(options);
    } else {
      console.warn('No email provider configured. Email not sent.');
      return false;
    }
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

/**
 * Send via Resend (recommended for Next.js)
 * Configure: RESEND_API_KEY in .env.local
 */
async function sendViaResend(options: EmailOptions): Promise<boolean> {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.warn('RESEND_API_KEY not configured');
      return false;
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || 'notifications@superteambrazil.com',
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Resend error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Resend send error:', error);
    return false;
  }
}

/**
 * Send via SMTP (Nodemailer)
 * Configure: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS in .env.local
 */
async function sendViaSMTP(options: EmailOptions): Promise<boolean> {
  try {
    // Nodemailer is optional - only require if SMTP is configured
    let nodemailer: any;
    try {
      nodemailer = require('nodemailer');
    } catch (e) {
      console.error('nodemailer not installed:', e);
      return false;
    }
    const { createTransport } = nodemailer;

    const transport = createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transport.sendMail({
      from: process.env.EMAIL_FROM || 'notifications@superteambrazil.com',
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    return true;
  } catch (error) {
    console.error('SMTP send error:', error);
    return false;
  }
}

/**
 * Get HTML template for notification email
 */ function getEmailTemplate(data: NotificationEmailData): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://superteambrazil.com';
  const actionEmoji = getActionEmoji(data.actionType);
  const actionText = getActionText(data.actionType);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #f9f9f9; padding: 20px; border: 1px solid #e0e0e0; border-radius: 0 0 8px 8px; }
    .action-item { background: white; padding: 15px; margin: 10px 0; border-left: 4px solid #667eea; border-radius: 4px; }
    .button { display: inline-block; background: #667eea; color: white; text-decoration: none; padding: 12px 24px; border-radius: 4px; margin: 15px 0; }
    .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #999; }
    .emoji { font-size: 24px; margin-right: 10px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎓 Superteam Brazil</h1>
      <p>You have a new notification!</p>
    </div>
    <div class="content">
      <p>Hi ${data.userName},</p>
      <p>${actionText}</p>
      
      <div class="action-item">
        <span class="emoji">${actionEmoji}</span>
        <strong>${data.actionType === 'mention' ? 'mentioned you' : 'update'}:</strong>
        <p>${data.actionContent}</p>
      </div>

      <a href="${baseUrl}${data.actionUrl}" class="button">
        ${data.actionLabel} →
      </a>

      <div class="footer">
        <p>Manage your email preferences in your account settings</p>
        <p>&copy; 2026 Superteam Brazil Academy. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

function getActionEmoji(actionType: string): string {
  const emojiMap: Record<string, string> = {
    comment_reply: '💬',
    post_like: '❤️',
    comment_like: '❤️',
    mention: '@',
    achievement: '🏆',
    xp_reward: '⭐',
  };
  return emojiMap[actionType] || '📬';
}

function getActionText(actionType: string): string {
  const textMap: Record<string, string> = {
    comment_reply: 'Someone replied to your post!',
    post_like: 'Your post got a new like!',
    comment_like: 'Your comment got a new like!',
    mention: 'You were mentioned in the community!',
    achievement: 'Congratulations! You unlocked a new achievement!',
    xp_reward: 'You earned XP points!',
  };
  return textMap[actionType] || 'You have a new notification!';
}

/**
 * Send notification email for comment reply
 */
export async function sendCommentReplyEmail(
  userEmail: string,
  userName: string,
  replierName: string,
  postTitle: string,
  postId: string
): Promise<boolean> {
  const html = getEmailTemplate({
    userName,
    actionType: 'comment_reply',
    actionContent: `${replierName} replied to your post "${postTitle}"`,
    actionUrl: `/community/${postId}`,
    actionLabel: 'View Comment',
  });

  return sendEmail({
    to: userEmail,
    subject: `${replierName} commented on your post`,
    html,
    text: `${replierName} replied to your post "${postTitle}". Click here to view: /community/${postId}`,
  });
}

/**
 * Send notification email for post like
 */
export async function sendPostLikeEmail(
  userEmail: string,
  userName: string,
  likerName: string,
  postTitle: string,
  postId: string
): Promise<boolean> {
  const html = getEmailTemplate({
    userName,
    actionType: 'post_like',
    actionContent: `${likerName} liked your post "${postTitle}"`,
    actionUrl: `/community/${postId}`,
    actionLabel: 'View Post',
  });

  return sendEmail({
    to: userEmail,
    subject: `${likerName} liked your post`,
    html,
    text: `${likerName} liked your post "${postTitle}". Click here to view: /community/${postId}`,
  });
}

/**
 * Send notification email for comment like
 */
export async function sendCommentLikeEmail(
  userEmail: string,
  userName: string,
  likerName: string,
  postId: string
): Promise<boolean> {
  const html = getEmailTemplate({
    userName,
    actionType: 'comment_like',
    actionContent: `${likerName} liked your comment`,
    actionUrl: `/community/${postId}`,
    actionLabel: 'View Comment',
  });

  return sendEmail({
    to: userEmail,
    subject: `${likerName} liked your comment`,
    html,
    text: `${likerName} liked your comment. Click here to view: /community/${postId}`,
  });
}

/**
 * Send notification email for @mention
 */
export async function sendMentionEmail(
  userEmail: string,
  userName: string,
  mentionerName: string,
  contentType: 'post' | 'comment',
  contentUrl: string
): Promise<boolean> {
  const html = getEmailTemplate({
    userName,
    actionType: 'mention',
    actionContent: `${mentionerName} mentioned you in a ${contentType}`,
    actionUrl: contentUrl,
    actionLabel: `View ${contentType}`,
  });

  return sendEmail({
    to: userEmail,
    subject: `You were mentioned by ${mentionerName}`,
    html,
    text: `${mentionerName} mentioned you in a ${contentType}. Click here to view: ${contentUrl}`,
  });
}

/**
 * Send notification email for achievement unlock
 */
export async function sendAchievementEmail(
  userEmail: string,
  userName: string,
  achievementName: string,
  achievementDescription: string
): Promise<boolean> {
  const html = getEmailTemplate({
    userName,
    actionType: 'achievement',
    actionContent: `You unlocked the "${achievementName}" achievement! ${achievementDescription}`,
    actionUrl: '/dashboard/achievements',
    actionLabel: 'View Achievements',
  });

  return sendEmail({
    to: userEmail,
    subject: `🏆 Achievement Unlocked: ${achievementName}`,
    html,
    text: `You unlocked the "${achievementName}" achievement! ${achievementDescription}`,
  });
}

/**
 * Send notification email for XP rewards
 */
export async function sendXPRewardEmail(
  userEmail: string,
  userName: string,
  xpAmount: number,
  reason: string
): Promise<boolean> {
  const html = getEmailTemplate({
    userName,
    actionType: 'xp_reward',
    actionContent: `You earned ${xpAmount} XP for ${reason}!`,
    actionUrl: '/dashboard/profile',
    actionLabel: 'View Profile',
  });

  return sendEmail({
    to: userEmail,
    subject: `⭐ You earned ${xpAmount} XP!`,
    html,
    text: `You earned ${xpAmount} XP for ${reason}. View your profile to see your progress.`,
  });
}

/**
 * Send generic email for an in-app notification
 */
export async function sendNotificationEmail(
  data: GenericNotificationEmailData
): Promise<boolean> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://superteambrazil.com';
  const normalizedActionUrl = data.actionUrl
    ? data.actionUrl.startsWith('http')
      ? data.actionUrl
      : `${baseUrl}${data.actionUrl}`
    : `${baseUrl}/notifications`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #f9f9f9; padding: 20px; border: 1px solid #e0e0e0; border-radius: 0 0 8px 8px; }
    .card { background: white; padding: 16px; border-left: 4px solid #667eea; border-radius: 4px; margin: 12px 0; }
    .button { display: inline-block; background: #667eea; color: white; text-decoration: none; padding: 10px 20px; border-radius: 4px; margin-top: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>CapySolBuild Notification</h2>
    </div>
    <div class="content">
      <p>Hi ${data.userName},</p>
      <div class="card">
        <strong>${data.title}</strong>
        <p>${data.message}</p>
      </div>
      <a href="${normalizedActionUrl}" class="button">${data.actionLabel || 'View Notification'} →</a>
    </div>
  </div>
</body>
</html>
  `;

  return sendEmail({
    to: data.userEmail,
    subject: data.title,
    html,
    text: `${data.title}\n${data.message}\n${normalizedActionUrl}`,
  });
}
