'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { AccountLinkingCard } from '@/components/auth/account-linking-card';
import { useI18n } from '@/components/i18n/i18n-provider';
import {
  getRegistrationRecord,
  REGISTRATION_CHANGED_EVENT,
  updateRegistrationRecord
} from '@/lib/auth/registration-storage';

export function SettingsClient(): JSX.Element | null {
  const { setTheme } = useTheme();
  const { dictionary } = useI18n();
  const [registration, setRegistration] = useState<ReturnType<typeof getRegistrationRecord>>(null);
  const [ready, setReady] = useState<boolean>(false);
  const [displayName, setDisplayName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [bio, setBio] = useState<string>('');
  const [darkModeDefault, setDarkModeDefault] = useState<boolean>(true);
  const [emailNotifications, setEmailNotifications] = useState<boolean>(false);
  const [publicProfile, setPublicProfile] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  useEffect(() => {
    function syncRegistration(): void {
      setRegistration(getRegistrationRecord());
    }

    syncRegistration();
    setReady(true);
    window.addEventListener(REGISTRATION_CHANGED_EVENT, syncRegistration);

    return () => {
      window.removeEventListener(REGISTRATION_CHANGED_EVENT, syncRegistration);
    };
  }, []);

  useEffect(() => {
    if (!registration) {
      return;
    }

    setDisplayName(registration.name);
    setEmail(registration.email);
    setBio(registration.bio ?? '');
    setDarkModeDefault(registration.darkModeDefault ?? true);
    setEmailNotifications(registration.emailNotifications ?? false);
    setPublicProfile(registration.publicProfile ?? true);
  }, [registration]);

  async function handleSaveProfile(): Promise<void> {
    if (!registration) {
      return;
    }

    const nextName = displayName.trim();
    const nextEmail = email.trim();

    if (!nextName || !nextEmail) {
      return;
    }

    setSaving(true);
    try {
      updateRegistrationRecord({
        name: nextName,
        email: nextEmail,
        bio: bio.trim(),
        darkModeDefault,
        emailNotifications,
        publicProfile
      });
      setTheme(darkModeDefault ? 'dark' : 'light');
    } finally {
      setSaving(false);
    }
  }

  function handleExportData(): void {
    if (!registration) {
      return;
    }

    const payload = {
      exportedAt: new Date().toISOString(),
      account: {
        ...registration,
        name: displayName.trim(),
        email: email.trim(),
        bio: bio.trim(),
        darkModeDefault,
        emailNotifications,
        publicProfile
      }
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `superteam-account-${registration.username}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  if (!ready) {
    return null;
  }

  if (!registration) {
    return (
      <div data-testid="settings-no-account" className="panel mx-auto max-w-2xl space-y-4">
        <h1 className="text-3xl font-extrabold">{dictionary.settings.title}</h1>
        <p className="text-sm text-foreground/75">{dictionary.settings.noAccountDesc}</p>
        <div className="flex gap-2">
          <Link href="/register" data-testid="settings-register-link" className="btn-primary">
            {dictionary.actions.goToRegister}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="settings-page" className="space-y-6">
      <header data-testid="settings-header" className="panel">
        <h1 className="text-3xl font-extrabold">{dictionary.settings.title}</h1>
        <p className="mt-2 text-sm text-foreground/75">{dictionary.settings.subtitle}</p>
      </header>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="panel space-y-3 p-4">
          <h2 className="text-base font-semibold">{dictionary.settings.profileSection}</h2>
          <input
            placeholder={dictionary.settings.displayNamePlaceholder}
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            className="input-field"
          />
          <input
            type="email"
            placeholder={dictionary.settings.emailPlaceholder}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="input-field"
          />
          <textarea
            placeholder={dictionary.settings.bioPlaceholder}
            value={bio}
            onChange={(event) => setBio(event.target.value)}
            className="input-field h-24"
          />
          <button
            type="button"
            onClick={() => void handleSaveProfile()}
            disabled={saving}
            className="btn-primary disabled:opacity-60"
          >
            {saving ? dictionary.common.saving : dictionary.settings.saveProfile}
          </button>
        </article>

        <AccountLinkingCard />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="panel space-y-2 p-4">
          <h2 className="text-base font-semibold">{dictionary.settings.preferencesSection}</h2>
          <label className="flex items-center justify-between rounded-xl border border-border/70 bg-background/45 p-3 text-sm">
            <span>{dictionary.settings.darkModeDefault}</span>
            <input
              type="checkbox"
              checked={darkModeDefault}
              onChange={(event) => setDarkModeDefault(event.target.checked)}
            />
          </label>
          <label className="flex items-center justify-between rounded-xl border border-border/70 bg-background/45 p-3 text-sm">
            <span>{dictionary.settings.emailNotifications}</span>
            <input
              type="checkbox"
              checked={emailNotifications}
              onChange={(event) => setEmailNotifications(event.target.checked)}
            />
          </label>
        </article>

        <article className="panel space-y-2 p-4">
          <h2 className="text-base font-semibold">{dictionary.settings.privacySection}</h2>
          <label className="flex items-center justify-between rounded-xl border border-border/70 bg-background/45 p-3 text-sm">
            <span>{dictionary.settings.publicVisibility}</span>
            <input
              type="checkbox"
              checked={publicProfile}
              onChange={(event) => setPublicProfile(event.target.checked)}
            />
          </label>
          <button
            type="button"
            onClick={handleExportData}
            className="btn-secondary w-fit px-3 py-2 text-sm"
          >
            {dictionary.settings.exportData}
          </button>
        </article>
      </section>
    </div>
  );
}
