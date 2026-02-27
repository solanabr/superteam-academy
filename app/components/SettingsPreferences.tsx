'use client';

import { useTheme } from '@/lib/theme/context';
import { ThemeToggle } from './ThemeToggle';
import { LanguageSwitcher } from './LanguageSwitcher';

export function SettingsPreferences() {
  const { theme } = useTheme();

  return (
    <div className="mt-3 space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-caption text-[rgb(var(--text-muted))]">Theme</span>
          <ThemeToggle />
          <span className="text-caption text-[rgb(var(--text-subtle))]">
            {theme === 'dark' ? 'Dark' : 'Light'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-caption text-[rgb(var(--text-muted))]">Language</span>
          <LanguageSwitcher />
        </div>
      </div>
      <p className="text-caption text-[rgb(var(--text-subtle))]">
        Notifications and email preferences: coming soon.
      </p>
    </div>
  );
}
