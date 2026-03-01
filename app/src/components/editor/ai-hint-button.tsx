'use client';

import { useState } from 'react';
import { Lightbulb, Loader2, X } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';

interface AiHintButtonProps {
  code: string;
  challenge: string;
  language: string;
}

export function AiHintButton({ code, challenge, language }: AiHintButtonProps) {
  const { publicKey } = useWallet();
  const [hint, setHint] = useState<string | null>(null);
  const [hintsRemaining, setHintsRemaining] = useState(3);
  const [isLoading, setIsLoading] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const requestHint = async () => {
    if (!publicKey) return;
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/hint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          challenge,
          language,
          wallet: publicKey.toBase58(),
        }),
      });

      const data = await response.json();
      if (data.hint) {
        setHint(data.hint);
        setShowHint(true);
        if (typeof data.hintsRemaining === 'number') {
          setHintsRemaining(data.hintsRemaining);
        }
      }
    } catch {
      setHint('Unable to get hint. Try again later.');
      setShowHint(true);
    } finally {
      setIsLoading(false);
    }
  };

  if (!publicKey) return null;

  return (
    <div className="relative">
      <button
        onClick={requestHint}
        disabled={isLoading || hintsRemaining <= 0}
        className="flex items-center gap-1.5 rounded-md bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-400 transition-colors hover:bg-amber-500/20 disabled:opacity-50"
        title={`Get AI hint (${hintsRemaining} remaining)`}
      >
        {isLoading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Lightbulb className="h-3.5 w-3.5" />
        )}
        AI Hint ({hintsRemaining})
      </button>

      {showHint && hint && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-lg border border-amber-500/20 bg-zinc-900 p-4 shadow-xl">
          <div className="mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-400">
              <Lightbulb className="h-3.5 w-3.5" /> AI Hint
            </span>
            <button
              onClick={() => setShowHint(false)}
              className="text-zinc-500 hover:text-zinc-300"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <p className="text-sm leading-relaxed text-zinc-300">{hint}</p>
        </div>
      )}
    </div>
  );
}
