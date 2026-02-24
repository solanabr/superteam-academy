'use client';

import { useCallback, useEffect, useState, useTransition } from 'react';
import { useTheme } from 'next-themes';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/routing';
import type { Locale } from '@/i18n/routing';
import { Moon, Sun, Monitor, Globe, Type } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const FONT_SIZE_KEY = 'superteam-font-size';

type FontSize = 'small' | 'medium' | 'large';

interface ThemeOption {
  value: string;
  label: 'theme_light' | 'theme_dark' | 'theme_system';
  icon: React.ComponentType<{ className?: string }>;
}

const themeOptions: ThemeOption[] = [
  { value: 'light', label: 'theme_light', icon: Sun },
  { value: 'dark', label: 'theme_dark', icon: Moon },
  { value: 'system', label: 'theme_system', icon: Monitor },
];

interface LanguageOption {
  locale: Locale;
  label: string;
}

const languages: LanguageOption[] = [
  { locale: 'en', label: 'English' },
  { locale: 'pt', label: 'Portugu\u00EAs' },
  { locale: 'es', label: 'Espa\u00F1ol' },
];

const fontSizeLabels: Record<FontSize, string> = {
  small: 'Small',
  medium: 'Medium',
  large: 'Large',
};

function loadFontSize(): FontSize {
  if (typeof window === 'undefined') return 'medium';
  try {
    const stored = localStorage.getItem(FONT_SIZE_KEY);
    if (stored === 'small' || stored === 'medium' || stored === 'large') {
      return stored;
    }
  } catch {
    // localStorage unavailable
  }
  return 'medium';
}

function persistFontSize(size: FontSize): void {
  try {
    localStorage.setItem(FONT_SIZE_KEY, size);
  } catch {
    // localStorage quota exceeded or unavailable
  }
}

export function AppearanceSettings() {
  const t = useTranslations('settings');
  const { theme, setTheme } = useTheme();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [fontSize, setFontSize] = useState<FontSize>('medium');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setFontSize(loadFontSize());
  }, []);

  const handleLocaleChange = useCallback(
    (nextLocale: string) => {
      startTransition(() => {
        router.replace(pathname, { locale: nextLocale as Locale });
      });
    },
    [router, pathname],
  );

  const handleFontSizeChange = useCallback((size: string) => {
    const validated = size as FontSize;
    setFontSize(validated);
    persistFontSize(validated);

    // Apply font size to document root for global effect
    const root = document.documentElement;
    root.classList.remove('text-sm', 'text-base', 'text-lg');
    const classMap: Record<FontSize, string> = {
      small: 'text-sm',
      medium: 'text-base',
      large: 'text-lg',
    };
    root.classList.add(classMap[validated]);
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sun className="size-5" />
          {t('appearance')}
        </CardTitle>
        <CardDescription>
          Customize the look and feel of the application.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Theme Selector */}
        <div className="space-y-3">
          <Label>Theme</Label>
          <div className="grid grid-cols-3 gap-2">
            {themeOptions.map((option) => {
              const Icon = option.icon;
              const isActive = mounted && theme === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setTheme(option.value)}
                  className={cn(
                    'flex flex-col items-center gap-2 rounded-lg border p-3 text-sm transition-all hover:bg-accent',
                    isActive
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-border text-muted-foreground',
                  )}
                  aria-pressed={isActive}
                >
                  <Icon className="size-5" />
                  <span className="text-xs font-medium">{t(option.label)}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Language Selector */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            <Globe className="size-4" />
            {t('language')}
          </Label>
          <Select
            value={locale}
            onValueChange={handleLocaleChange}
            disabled={isPending}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {languages.map((lang) => (
                <SelectItem key={lang.locale} value={lang.locale}>
                  {lang.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Font Size */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            <Type className="size-4" />
            Font Size
          </Label>
          <Select value={fontSize} onValueChange={handleFontSizeChange}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.entries(fontSizeLabels) as [FontSize, string][]).map(
                ([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ),
              )}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
