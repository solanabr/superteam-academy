'use client';

import { useTranslations } from 'next-intl';
import {
  Check,
  Coins,
  ImageIcon,
  Users,
  Gamepad2,
  CreditCard,
  MessageCircle,
  Server,
  ShieldCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Interest } from '@/lib/utils/recommendation';

interface InterestsStepProps {
  value: Interest[];
  onChange: (value: Interest[]) => void;
}

const INTERESTS: {
  value: Interest;
  labelKey: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { value: 'defi', labelKey: 'interest_defi', icon: Coins },
  { value: 'nfts', labelKey: 'interest_nfts', icon: ImageIcon },
  { value: 'daos', labelKey: 'interest_daos', icon: Users },
  { value: 'gaming', labelKey: 'interest_gaming', icon: Gamepad2 },
  { value: 'payments', labelKey: 'interest_payments', icon: CreditCard },
  { value: 'social', labelKey: 'interest_social', icon: MessageCircle },
  { value: 'infrastructure', labelKey: 'interest_infra', icon: Server },
  { value: 'security', labelKey: 'interest_security', icon: ShieldCheck },
];

export function InterestsStep({ value, onChange }: InterestsStepProps) {
  const t = useTranslations('onboarding');

  function toggle(interest: Interest) {
    if (value.includes(interest)) {
      onChange(value.filter((i) => i !== interest));
    } else {
      onChange([...value, interest]);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-muted-foreground text-sm">{t('select_multiple')}</p>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {INTERESTS.map((item) => {
          const Icon = item.icon;
          const isSelected = value.includes(item.value);

          return (
            <button
              key={item.value}
              type="button"
              onClick={() => toggle(item.value)}
              className={cn(
                'relative flex flex-col items-center gap-2 rounded-lg border px-4 py-4 text-sm font-medium transition-all hover:border-primary/40',
                isSelected && 'border-primary bg-primary/5 ring-2 ring-primary/20',
              )}
            >
              {isSelected && (
                <Check className="absolute top-1.5 right-1.5 size-3.5 text-primary" />
              )}
              <Icon
                className={cn(
                  'size-6',
                  isSelected ? 'text-primary' : 'text-muted-foreground',
                )}
              />
              {t(item.labelKey)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
