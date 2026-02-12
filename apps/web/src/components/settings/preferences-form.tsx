'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Moon, Sun, Globe, Bell } from 'lucide-react';
import { locales, getLocaleName, type Locale } from '@/i18n/navigation';
import { mockUserSettings } from '@/lib/mock-data';

export function PreferencesForm() {
  const t = useTranslations('settingsPage');
  const { theme, setTheme } = useTheme();

  const [prefs, setPrefs] = useState(mockUserSettings.preferences);

  function handleLanguageChange(locale: string) {
    setPrefs({ ...prefs, language: locale as Locale });
    document.cookie = `locale=${locale};path=/;max-age=31536000`;
    window.location.reload();
  }

  function handleThemeChange(checked: boolean) {
    const newTheme = checked ? 'dark' : 'light';
    setTheme(newTheme);
    setPrefs({ ...prefs, theme: newTheme });
  }

  return (
    <div className="space-y-6">
      {/* Language & Theme */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            {t('languageAndTheme')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label>{t('languageLabel')}</Label>
              <p className="text-xs text-muted-foreground">{t('languageDesc')}</p>
            </div>
            <Select value={prefs.language} onValueChange={handleLanguageChange}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {locales.map((locale) => (
                  <SelectItem key={locale} value={locale}>
                    {getLocaleName(locale)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {theme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              <div>
                <Label>{t('themeLabel')}</Label>
                <p className="text-xs text-muted-foreground">{t('themeDesc')}</p>
              </div>
            </div>
            <Switch checked={theme === 'dark'} onCheckedChange={handleThemeChange} />
          </div>
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            {t('emailNotifications')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>{t('newCourses')}</Label>
              <p className="text-xs text-muted-foreground">{t('newCoursesDesc')}</p>
            </div>
            <Switch
              checked={prefs.emailNewCourses}
              onCheckedChange={(v) => setPrefs({ ...prefs, emailNewCourses: v })}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>{t('streakReminders')}</Label>
              <p className="text-xs text-muted-foreground">{t('streakRemindersDesc')}</p>
            </div>
            <Switch
              checked={prefs.emailStreakReminders}
              onCheckedChange={(v) => setPrefs({ ...prefs, emailStreakReminders: v })}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>{t('weeklyDigest')}</Label>
              <p className="text-xs text-muted-foreground">{t('weeklyDigestDesc')}</p>
            </div>
            <Switch
              checked={prefs.emailWeeklyDigest}
              onCheckedChange={(v) => setPrefs({ ...prefs, emailWeeklyDigest: v })}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
