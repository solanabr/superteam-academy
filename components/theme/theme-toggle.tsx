'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useI18n } from '@/components/i18n/i18n-provider';

export function ThemeToggle(): JSX.Element {
  const { theme, setTheme } = useTheme();
  const { dictionary } = useI18n();
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button
        type="button"
        className="inline-flex h-10 items-center gap-2 rounded-2xl border border-border/70 bg-card/75 px-3 text-xs font-semibold shadow-sm"
        aria-label={dictionary.common.theme}
      >
        {dictionary.common.theme}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="inline-flex h-10 items-center gap-2 rounded-2xl border border-border/70 bg-card/75 px-3 text-xs font-semibold text-foreground/85 shadow-sm transition hover:bg-muted/80"
      aria-label={dictionary.common.theme}
    >
      {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
      {theme === 'dark' ? dictionary.common.light : dictionary.common.dark}
    </button>
  );
}
