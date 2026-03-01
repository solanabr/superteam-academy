'use client';

import { useEffect, useState } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { fetchXpBalance, calculateLevel, levelProgress } from '@/lib/solana';
import { formatXp } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Sparkles } from 'lucide-react';

export function XpDisplay() {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const [xp, setXp] = useState(0);

  useEffect(() => {
    if (!publicKey) return;

    fetchXpBalance(connection, publicKey).then(setXp);

    const id = setInterval(() => {
      fetchXpBalance(connection, publicKey).then(setXp);
    }, 30000);

    return () => clearInterval(id);
  }, [publicKey, connection]);

  if (!publicKey) return null;

  const level = calculateLevel(xp);
  const progress = levelProgress(xp);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2">
            <Badge variant="xp" className="gap-1 cursor-default">
              <Sparkles className="h-3 w-3" />
              {formatXp(xp)} XP
            </Badge>
            <Badge variant="solana" className="cursor-default">
              Lv. {level}
            </Badge>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Level {level} • {Math.round(progress * 100)}% to next level</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
