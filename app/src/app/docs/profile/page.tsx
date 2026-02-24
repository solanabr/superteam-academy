import type { Metadata } from "next";
import { DocsPagination } from "@/components/docs";

export const metadata: Metadata = { title: "Profile Setup" };

export default function ProfilePage() {
  return (
    <article className="prose prose-neutral dark:prose-invert max-w-none">
      <h1>Profile Setup</h1>
      <p className="lead">
        Your profile is your public identity on Superteam Academy. It shows your
        display name, avatar, XP level, achievements, and learning stats.
      </p>

      <h2>Setting Up Your Profile</h2>
      <p>
        During onboarding (or anytime from Settings), you can configure:
      </p>

      <h3>Display Name</h3>
      <p>
        Your display name appears on the leaderboard, in community posts, and on
        your public profile. If you signed in via Google or GitHub, this is
        pre-filled from your OAuth profile.
      </p>

      <h3>Username</h3>
      <p>
        Your unique username is used in your profile URL:
        <code>superteam-academy-six.vercel.app/profile/your-username</code>. Choose
        something memorable — it must be unique across the platform.
      </p>

      <h3>Avatar</h3>
      <p>
        Your avatar is pulled automatically from your Google or GitHub account.
        You can also upload a custom avatar from your Settings page. Supported
        formats: JPG, PNG, WebP. Maximum size: 2 MB.
      </p>

      <h3>Social Links</h3>
      <p>
        Add links to your GitHub, Twitter/X, and other social profiles. These
        appear on your public profile page.
      </p>

      <h2>Your Public Profile</h2>
      <p>
        Your public profile at <code>/profile/username</code> displays:
      </p>
      <ul>
        <li><strong>XP Level</strong> — Your current level and XP progress ring</li>
        <li><strong>Streak</strong> — Current and longest daily learning streak</li>
        <li><strong>Courses Completed</strong> — Number of courses finished</li>
        <li><strong>Achievements</strong> — Unlocked achievements with mint status</li>
        <li><strong>Skill Radar</strong> — Visual breakdown of skills across tracks</li>
        <li><strong>Activity Feed</strong> — Recent learning activities</li>
      </ul>

      <h2>Editing Your Profile</h2>
      <ol>
        <li>Click your avatar in the top-right corner</li>
        <li>Select <strong>Settings</strong></li>
        <li>Update your display name, username, avatar, or social links</li>
        <li>Changes are saved automatically</li>
      </ol>

      <h2>Language &amp; Theme</h2>
      <p>
        From Settings, you can also change:
      </p>
      <ul>
        <li><strong>Language</strong> — English, Portuguese (BR), or Spanish</li>
        <li><strong>Theme</strong> — Light, Dark, or System (follows your OS preference)</li>
      </ul>

      <DocsPagination />
    </article>
  );
}
