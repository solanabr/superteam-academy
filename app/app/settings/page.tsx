import { Header } from '@/components/Header';
import { SettingsPreferences } from '@/components/SettingsPreferences';
import { SettingsProfile } from '@/components/SettingsProfile';
import { SettingsAccount } from '@/components/SettingsAccount';
import { SettingsPrivacy } from '@/components/SettingsPrivacy';

export default function SettingsPage() {
  return (
    <>
      <Header />
      <main id="main-content" className="mx-auto max-w-2xl px-4 py-10 sm:px-6" tabIndex={-1}>
        <h1 id="settings-heading" className="text-title font-semibold text-[rgb(var(--text))]">
          Settings
        </h1>
        <p className="text-body mt-1 text-[rgb(var(--text-muted))]" id="settings-desc">
          Profile, account, preferences, and privacy.
        </p>
        <div className="mt-8 space-y-6" aria-labelledby="settings-heading" aria-describedby="settings-desc">
          <section className="rounded-xl border border-border/50 bg-surface p-6" aria-labelledby="settings-profile-heading">
            <h2 id="settings-profile-heading" className="text-body font-semibold text-[rgb(var(--text))]">Profile</h2>
            <p className="text-caption mt-1 text-[rgb(var(--text-muted))]">Name, bio, avatar, social links</p>
            <SettingsProfile />
          </section>
          <section className="rounded-xl border border-border/50 bg-surface p-6" aria-labelledby="settings-account-heading">
            <h2 id="settings-account-heading" className="text-body font-semibold text-[rgb(var(--text))]">Account</h2>
            <p className="text-caption mt-1 text-[rgb(var(--text-muted))]">Connected wallet and Google/GitHub sign-in</p>
            <SettingsAccount />
          </section>
          <section className="rounded-xl border border-border/50 bg-surface p-6" aria-labelledby="settings-prefs-heading">
            <h2 id="settings-prefs-heading" className="text-body font-semibold text-[rgb(var(--text))]">Preferences</h2>
            <p className="text-caption mt-1 text-[rgb(var(--text-muted))]">Language, theme, notifications</p>
            <SettingsPreferences />
          </section>
          <section className="rounded-xl border border-border/50 bg-surface p-6" aria-labelledby="settings-privacy-heading">
            <h2 id="settings-privacy-heading" className="text-body font-semibold text-[rgb(var(--text))]">Privacy</h2>
            <p className="text-caption mt-1 text-[rgb(var(--text-muted))]">Profile visibility, data export</p>
            <SettingsPrivacy />
          </section>
        </div>
      </main>
    </>
  );
}
