import { Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface XPBadgeProps {
  xp: number;
  level?: number;
  className?: string;
  showLevel?: boolean;
}

export function XPBadge({ xp, level, className, showLevel = false }: XPBadgeProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="flex items-center gap-1 rounded-full bg-accent/10 px-3 py-1 text-accent border border-accent/20">
        <Zap className="h-4 w-4 fill-current" />
        <span className="font-semibold text-sm">{xp.toLocaleString()} XP</span>
      </div>
      {showLevel && level && (
        <div className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-primary border border-primary/20">
          <span className="font-semibold text-sm">Level {level}</span>
        </div>
      )}
    </div>
  );
}
