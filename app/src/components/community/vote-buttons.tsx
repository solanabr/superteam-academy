'use client';

import { ChevronUp, ChevronDown } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface VoteButtonsProps {
  votes: number;
  userVote: 'up' | 'down' | null;
  onVote: (direction: 'up' | 'down') => void;
  className?: string;
}

export function VoteButtons({ votes, userVote, onVote, className }: VoteButtonsProps) {
  const { connected } = useWallet();

  return (
    <div className={cn('flex flex-col items-center gap-0.5', className)}>
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          'size-8 rounded-md',
          userVote === 'up' && 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400',
        )}
        onClick={() => onVote('up')}
        disabled={!connected}
        aria-label="Vote up"
      >
        <ChevronUp className="size-5" />
      </Button>

      <span
        className={cn(
          'text-sm font-semibold tabular-nums',
          userVote === 'up' && 'text-emerald-600 dark:text-emerald-400',
          userVote === 'down' && 'text-red-600 dark:text-red-400',
        )}
      >
        {votes}
      </span>

      <Button
        variant="ghost"
        size="icon"
        className={cn(
          'size-8 rounded-md',
          userVote === 'down' && 'bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400',
        )}
        onClick={() => onVote('down')}
        disabled={!connected}
        aria-label="Vote down"
      >
        <ChevronDown className="size-5" />
      </Button>
    </div>
  );
}
