import type { Metadata } from "next";
import { DocsPagination } from "@/components/docs";

export const metadata: Metadata = { title: "Settings & Preferences" };

export default function PreferencesPage() {
  return (
    <article className="prose prose-neutral dark:prose-invert max-w-none">
      <h1>Settings &amp; Preferences</h1>
      <p className="lead">
        Customize your Superteam Academy experience — language, theme, profile
        details, and wallet connection.
      </p>

      <h2>Accessing Settings</h2>
      <ol>
        <li>Click your avatar in the top-right navigation bar</li>
        <li>Select <strong>Settings</strong> from the dropdown menu</li>
      </ol>

      <h2>Available Settings</h2>

      <h3>Profile</h3>
      <ul>
        <li><strong>Display Name</strong> — Your public name on the platform</li>
        <li><strong>Username</strong> — Your unique identifier (used in profile URL)</li>
        <li><strong>Avatar</strong> — Upload or change your profile picture</li>
        <li><strong>Social Links</strong> — GitHub, Twitter/X, and other profiles</li>
      </ul>

      <h3>Language</h3>
      <p>
        Change the platform language. Available languages:
      </p>
      <ul>
        <li><strong>English</strong> (en) — Default</li>
        <li><strong>Português (BR)</strong> (pt-br)</li>
        <li><strong>Español</strong> (es)</li>
      </ul>
      <p>
        You can also switch languages from the language selector in the top
        navigation bar without going to Settings.
      </p>

      <h3>Theme</h3>
      <p>Choose your preferred visual theme:</p>
      <ul>
        <li><strong>Light</strong> — White background with dark text</li>
        <li><strong>Dark</strong> — Dark background with light text</li>
        <li><strong>System</strong> — Follows your operating system preference</li>
      </ul>
      <p>
        Theme can also be toggled from the sun/moon icon in the navigation bar.
      </p>

      <h3>Wallet</h3>
      <p>
        If you signed in with OAuth (Google/GitHub):
      </p>
      <ul>
        <li>View your linked wallet address (if any)</li>
        <li>Link a new wallet</li>
      </ul>
      <p>
        If you signed in with a wallet:
      </p>
      <ul>
        <li>View your wallet address</li>
        <li>Wallet is permanently linked to your account</li>
      </ul>

      <h2>Signing Out</h2>
      <ol>
        <li>Click your avatar in the navigation bar</li>
        <li>Select <strong>Sign Out</strong></li>
      </ol>
      <p>
        Signing out clears your session. Your progress, XP, and enrollments
        are saved and will be available when you sign in again.
      </p>

      <DocsPagination />
    </article>
  );
}
