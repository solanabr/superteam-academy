'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import { useRouter, usePathname } from 'next/navigation';
import {
  Globe,
  Moon,
  Sun,
  Monitor,
  Bell,
  ShieldCheck,
  User,
  AtSign,
  Link2,
  CheckCircle,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ---------- types ----------

type Language = 'pt-BR' | 'en' | 'es';
type Theme    = 'dark' | 'light' | 'system';

interface ToggleSetting {
  key: string;
  label: string;
  description: string;
}

const LANGUAGES: { value: Language; label: string; flag: string; region: string }[] = [
  { value: 'pt-BR', label: 'Português',   flag: '🇧🇷', region: 'Brasil'        },
  { value: 'en',    label: 'English',     flag: '🇺🇸', region: 'United States' },
  { value: 'es',    label: 'Español',     flag: '🇪🇸', region: 'España'        },
];

// ---------- sub-components ----------

function SectionHeading({
  icon: Icon,
  title,
  color,
}: {
  icon: typeof Globe;
  title: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <Icon className={cn('h-5 w-5', color)} />
      <h2 className="text-base font-bold text-white">{title}</h2>
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  id,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  id: string;
}) {
  return (
    <button
      id={id}
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2 focus:ring-offset-gray-900',
        checked ? 'bg-purple-600' : 'bg-gray-700'
      )}
    >
      <span
        className={cn(
          'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-md transform transition-transform duration-200',
          checked ? 'translate-x-5' : 'translate-x-0'
        )}
      />
    </button>
  );
}

// ---------- page ----------

export default function SettingsPage() {
  const t = useTranslations('settings');
  const { setTheme: applyTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();

  const [language,  setLanguage]  = useState<Language>('pt-BR');
  const [theme,     setTheme]     = useState<Theme>('dark');

  const [notifications, setNotifications] = useState<Record<string, boolean>>({
    newCourses:   true,
    achievements: true,
  });

  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [twitter, setTwitter] = useState('');
  const [github, setGithub] = useState('');
  const [privacy, setPrivacy] = useState<Record<string, boolean>>({
    publicProfile: true,
    showXpRanking: true,
  });

  const [toast, setToast] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('academy-settings');
      if (stored) {
        const parsed = JSON.parse(stored) as {
          language?: Language;
          theme?: Theme;
          notifications?: Record<string, boolean>;
          privacy?: Record<string, boolean>;
          displayName?: string;
          bio?: string;
          avatarUrl?: string;
          twitter?: string;
          github?: string;
        };
        if (parsed.language) setLanguage(parsed.language);
        if (parsed.theme) {
          setTheme(parsed.theme);
          applyTheme(parsed.theme);
        }
        if (parsed.notifications) setNotifications(parsed.notifications);
        if (parsed.privacy) setPrivacy(parsed.privacy);
        if (parsed.displayName) setDisplayName(parsed.displayName);
        if (parsed.bio) setBio(parsed.bio);
        if (parsed.avatarUrl) setAvatarUrl(parsed.avatarUrl);
        if (parsed.twitter) setTwitter(parsed.twitter);
        if (parsed.github) setGithub(parsed.github);
      }
    } catch {
      // ignore malformed data
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-hide toast
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(false), 3000);
    return () => clearTimeout(id);
  }, [toast]);

  function handleThemeChange(newTheme: Theme) {
    setTheme(newTheme);
    applyTheme(newTheme);
  }

  function handleLanguageChange(newLocale: Language) {
    setLanguage(newLocale);
    // Navigate to the same path but with the new locale segment
    const segments = pathname.split('/');
    // pathname starts with /<locale>/...
    segments[1] = newLocale;
    router.push(segments.join('/'));
  }

  function handleSave() {
    const settings = { language, theme, notifications, privacy, displayName, bio, avatarUrl, twitter, github };
    localStorage.setItem('academy-settings', JSON.stringify(settings));
    setToast(true);
  }

  // Build theme options inside the component so t() can be called
  const THEMES: { value: Theme; label: string; icon: typeof Moon; desc: string }[] = [
    { value: 'dark',   label: t('dark'),   icon: Moon,    desc: t('dark_desc')   },
    { value: 'light',  label: t('light'),  icon: Sun,     desc: t('light_desc')  },
    { value: 'system', label: t('system'), icon: Monitor, desc: t('system_desc') },
  ];

  const NOTIFICATION_TOGGLES: ToggleSetting[] = [
    {
      key: 'newCourses',
      label: t('new_courses'),
      description: t('new_courses_desc'),
    },
    {
      key: 'achievements',
      label: t('achievements_unlocked'),
      description: t('achievements_unlocked_desc'),
    },
  ];

  const PRIVACY_TOGGLES: ToggleSetting[] = [
    {
      key: 'publicProfile',
      label: t('public_profile'),
      description: t('public_profile_desc'),
    },
    {
      key: 'showXpRanking',
      label: t('show_xp'),
      description: t('show_xp_desc'),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900/60 py-10 px-4">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-3xl font-extrabold text-white mb-1">{t('title')}</h1>
          <p className="text-gray-400 text-sm">{t('subtitle')}</p>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 py-8 space-y-8">

        {/* Profile */}
        <section className="rounded-2xl border border-gray-800 bg-gray-900/60 p-6">
          <SectionHeading icon={User} title={t('profile_section')} color="text-purple-400" />
          <p className="text-xs text-gray-500 mb-4">{t('profile_desc')}</p>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">{t('display_name')}</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={t('display_name_placeholder')}
                className="w-full rounded-xl border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-gray-200 placeholder:text-gray-600 focus:border-purple-600 focus:outline-none focus:ring-1 focus:ring-purple-600"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">{t('bio')}</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder={t('bio_placeholder')}
                rows={3}
                className="w-full rounded-xl border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-gray-200 placeholder:text-gray-600 focus:border-purple-600 focus:outline-none focus:ring-1 focus:ring-purple-600 resize-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">{t('avatar_url')}</label>
              <input
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder={t('avatar_url_placeholder')}
                className="w-full rounded-xl border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-gray-200 placeholder:text-gray-600 focus:border-purple-600 focus:outline-none focus:ring-1 focus:ring-purple-600"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">{t('social_links')}</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <AtSign className="h-4 w-4 text-gray-500 shrink-0" />
                  <input
                    type="text"
                    value={twitter}
                    onChange={(e) => setTwitter(e.target.value)}
                    placeholder={t('twitter_handle')}
                    className="flex-1 rounded-xl border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-200 placeholder:text-gray-600 focus:border-purple-600 focus:outline-none"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Link2 className="h-4 w-4 text-gray-500 shrink-0" />
                  <input
                    type="text"
                    value={github}
                    onChange={(e) => setGithub(e.target.value)}
                    placeholder={t('github_handle')}
                    className="flex-1 rounded-xl border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-200 placeholder:text-gray-600 focus:border-purple-600 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Language */}
        <section className="rounded-2xl border border-gray-800 bg-gray-900/60 p-6">
          <SectionHeading icon={Globe} title={t('language')} color="text-blue-400" />
          <div className="space-y-2">
            {LANGUAGES.map((lang) => {
              const selected = language === lang.value;
              return (
                <label
                  key={lang.value}
                  className={cn(
                    'flex cursor-pointer items-center gap-4 rounded-xl border px-4 py-3.5 transition-all',
                    selected
                      ? 'border-purple-600/60 bg-purple-900/20 ring-1 ring-purple-600/30'
                      : 'border-gray-800 hover:border-gray-700 hover:bg-gray-800/40'
                  )}
                >
                  <input
                    type="radio"
                    name="language"
                    value={lang.value}
                    checked={selected}
                    onChange={() => handleLanguageChange(lang.value)}
                    className="sr-only"
                  />
                  <span className="text-2xl" aria-hidden="true">{lang.flag}</span>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-white">{lang.label}</div>
                    <div className="text-xs text-gray-500">{lang.region}</div>
                  </div>
                  {selected && (
                    <CheckCircle className="h-5 w-5 text-purple-400 shrink-0" />
                  )}
                </label>
              );
            })}
          </div>
        </section>

        {/* Theme */}
        <section className="rounded-2xl border border-gray-800 bg-gray-900/60 p-6">
          <SectionHeading icon={Sun} title={t('theme')} color="text-yellow-400" />
          <div className="space-y-2">
            {THEMES.map(({ value, label, icon: Icon, desc }) => {
              const selected = theme === value;
              return (
                <label
                  key={value}
                  className={cn(
                    'flex cursor-pointer items-center gap-4 rounded-xl border px-4 py-3.5 transition-all',
                    selected
                      ? 'border-purple-600/60 bg-purple-900/20 ring-1 ring-purple-600/30'
                      : 'border-gray-800 hover:border-gray-700 hover:bg-gray-800/40'
                  )}
                >
                  <input
                    type="radio"
                    name="theme"
                    value={value}
                    checked={selected}
                    onChange={() => handleThemeChange(value)}
                    className="sr-only"
                  />
                  <div
                    className={cn(
                      'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border',
                      selected
                        ? 'border-purple-600/40 bg-purple-900/30 text-purple-400'
                        : 'border-gray-700 bg-gray-800 text-gray-500'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-white">{label}</div>
                    <div className="text-xs text-gray-500">{desc}</div>
                  </div>
                  {selected && (
                    <CheckCircle className="h-5 w-5 text-purple-400 shrink-0" />
                  )}
                </label>
              );
            })}
          </div>
        </section>

        {/* Notifications */}
        <section className="rounded-2xl border border-gray-800 bg-gray-900/60 p-6">
          <SectionHeading icon={Bell} title={t('notifications')} color="text-orange-400" />
          <div className="space-y-1 divide-y divide-gray-800/60">
            {NOTIFICATION_TOGGLES.map((item) => (
              <div
                key={item.key}
                className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"
              >
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-200">{item.label}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{item.description}</div>
                </div>
                <Toggle
                  id={`notif-${item.key}`}
                  checked={notifications[item.key] ?? false}
                  onChange={(v) =>
                    setNotifications((prev) => ({ ...prev, [item.key]: v }))
                  }
                />
              </div>
            ))}
          </div>
        </section>

        {/* Privacy */}
        <section className="rounded-2xl border border-gray-800 bg-gray-900/60 p-6">
          <SectionHeading icon={ShieldCheck} title={t('privacy')} color="text-green-400" />
          <div className="space-y-1 divide-y divide-gray-800/60">
            {PRIVACY_TOGGLES.map((item) => (
              <div
                key={item.key}
                className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"
              >
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-200">{item.label}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{item.description}</div>
                </div>
                <Toggle
                  id={`privacy-${item.key}`}
                  checked={privacy[item.key] ?? false}
                  onChange={(v) =>
                    setPrivacy((prev) => ({ ...prev, [item.key]: v }))
                  }
                />
              </div>
            ))}
          </div>
        </section>

        {/* Save button */}
        <div className="flex items-center justify-between gap-4 pt-2">
          <p className="text-xs text-gray-600">
            {t('local_disclaimer')}
          </p>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 rounded-xl bg-purple-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-purple-500 active:scale-95 transition-all shadow-lg shadow-purple-900/40"
          >
            <CheckCircle className="h-4 w-4" />
            {t('save')}
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Success toast */}
      <div
        className={cn(
          'fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl border border-green-700/50 bg-gray-900 px-5 py-3.5 shadow-xl transition-all duration-300',
          toast ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        )}
        role="status"
        aria-live="polite"
      >
        <CheckCircle className="h-5 w-5 text-green-400 shrink-0" />
        <div>
          <div className="text-sm font-semibold text-white">{t('saved')}</div>
          <div className="text-xs text-gray-400">{t('prefs_updated')}</div>
        </div>
      </div>
    </div>
  );
}
