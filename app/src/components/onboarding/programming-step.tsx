'use client';

import { useTranslations } from 'next-intl';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ProgrammingLanguage } from '@/lib/utils/recommendation';

interface ProgrammingStepProps {
  value: ProgrammingLanguage[];
  onChange: (value: ProgrammingLanguage[]) => void;
}

const LANGUAGES: { value: ProgrammingLanguage; label: string }[] = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'rust', label: 'Rust' },
  { value: 'python', label: 'Python' },
  { value: 'c-cpp', label: 'C/C++' },
  { value: 'go', label: 'Go' },
  { value: 'other', label: 'Other' },
  { value: 'none', label: 'None' },
];

export function ProgrammingStep({ value, onChange }: ProgrammingStepProps) {
  const t = useTranslations('onboarding');

  function toggle(lang: ProgrammingLanguage) {
    // "none" is exclusive — selecting it clears everything else
    if (lang === 'none') {
      onChange(value.includes('none') ? [] : ['none']);
      return;
    }

    // Selecting any language deselects "none"
    const withoutNone = value.filter((l) => l !== 'none');

    if (withoutNone.includes(lang)) {
      onChange(withoutNone.filter((l) => l !== lang));
    } else {
      onChange([...withoutNone, lang]);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-muted-foreground text-sm">{t('select_multiple')}</p>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {LANGUAGES.map((lang) => {
          const isSelected = value.includes(lang.value);

          return (
            <button
              key={lang.value}
              type="button"
              onClick={() => toggle(lang.value)}
              className={cn(
                'relative flex items-center justify-center rounded-lg border px-4 py-3 text-sm font-medium transition-all hover:border-primary/40',
                isSelected && 'border-primary bg-primary/5 ring-2 ring-primary/20',
              )}
            >
              {isSelected && (
                <Check className="absolute top-1.5 right-1.5 size-3.5 text-primary" />
              )}
              {lang.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
