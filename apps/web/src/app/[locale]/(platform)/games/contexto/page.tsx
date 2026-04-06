"use client";

import { useContexto } from '@/hooks/useContexto';
import { GameHeader } from '@/components/games/GameHeader';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { useWallet } from '@solana/wallet-adapter-react';
import { learningProgressService } from '@/services/learningProgress';
import { useEffect } from 'react';

function getColorBySimilarity(similarity: number, rank: number) {
  if (rank === 1) return 'bg-green-500 text-black shadow-[0_0_15px_rgba(34,197,94,0.6)]';
  if (similarity > 80) return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50';
  if (similarity > 50) return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50';
  if (similarity > 20) return 'bg-orange-500/20 text-orange-400 border border-orange-500/50';
  return 'bg-zinc-800/50 text-zinc-400 border border-zinc-700/50';
}

function getFillColorBySimilarity(similarity: number, rank: number) {
  if (rank === 1) return 'bg-green-500';
  if (similarity > 80) return 'bg-emerald-500';
  if (similarity > 50) return 'bg-yellow-500';
  if (similarity > 20) return 'bg-orange-500';
  return 'bg-zinc-600';
}

export default function ContextoPage() {
  const t = useTranslations();
  const { publicKey } = useWallet();
  const {
    targetTerm,
    guesses,
    currentGuess,
    setCurrentGuess,
    submitGuess,
    status,
    isInvalid,
  } = useContexto();

  useEffect(() => {
    if (status === 'won' && publicKey) {
      learningProgressService.completeArcadeGame({
        wallet: publicKey.toString(),
        gameId: 'contexto',
        xp: 100
      });
    }
  }, [status, publicKey]);

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 flex flex-col min-h-[calc(100vh-80px)]">
      <GameHeader 
        title="Contexto.sol"
        description={t('arcade.contexto.desc')}
        rules={
          <>
            <p>{t('arcade.contexto.rules.1')}</p>
            <p>{t('arcade.contexto.rules.2')}</p>
            <p>{t('arcade.contexto.rules.3')}</p>
          </>
        }
      />

      <div className="flex flex-col flex-1 w-full relative">
        
        {/* Input Fixed at Top */}
        <div className="w-full sticky top-0 z-10 bg-background/80 backdrop-blur-xl pb-4 pt-2">
          {status === 'won' && (
             <div className="mb-4 p-4 rounded-xl bg-green-500/20 border border-green-500/50 text-center animate-in fade-in slide-in-from-top-2">
               <h2 className="text-xl font-bold text-green-400">{t('arcade.win')}</h2>
               <p className="text-sm mt-1 text-green-200">{targetTerm?.term}</p>
             </div>
          )}

          <div className={`flex gap-2 w-full ${isInvalid ? 'animate-shake' : ''}`}>
            <Input 
              placeholder={t('arcade.contexto.placeholder')}
              value={currentGuess}
              onChange={(e) => setCurrentGuess(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submitGuess();
              }}
              className="h-14 sm:h-16 text-lg sm:text-xl bg-black/40 border-border/50"
              disabled={status === 'won'}
              autoFocus
            />
            <Button 
              onClick={submitGuess} 
              disabled={status === 'won' || !currentGuess.trim()}
              className="h-14 sm:h-16 w-14 sm:w-16 bg-primary hover:bg-primary/80 text-black flex-shrink-0"
            >
              <Send className="h-6 w-6" />
            </Button>
          </div>
          {isInvalid && (
            <p className="text-destructive text-sm mt-2 absolute -bottom-5 left-2">Termo inválido ou não presente no glossário.</p>
          )}
        </div>

        {/* Guesses List */}
        <div className="w-full mt-8 pb-10 flex flex-col gap-3">
          <AnimatePresence initial={false}>
            {guesses.map((guess) => (
              <motion.div
                key={guess.term.id}
                layout
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.3 }}
                className={`relative overflow-hidden flex items-center justify-between p-4 sm:p-5 rounded-lg ${getColorBySimilarity(guess.similarity, guess.rank)}`}
              >
                {/* Background Progress Bar */}
                <div 
                  className={`absolute left-0 top-0 bottom-0 opacity-20 ${getFillColorBySimilarity(guess.similarity, guess.rank)} transition-all duration-1000 ease-out`}
                  style={{ width: `${guess.similarity}%` }}
                />

                <span className="font-bold text-lg sm:text-xl z-10">{guess.term.term}</span>
                <span className="font-mono font-medium z-10 flex items-center gap-2">
                  <span className="text-xs opacity-70 uppercase tracking-tighter">{t('arcade.contexto.rank')}</span>
                  {guess.rank}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>

          {guesses.length === 0 && status === 'playing' && (
            <div className="flex items-center justify-center h-40 text-muted-foreground opacity-50 border-2 border-dashed border-border/50 rounded-xl">
              Seu histórico de palpites aparecerá aqui
            </div>
          )}
        </div>
      </div>
      <style jsx global>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both;
        }
      `}</style>
    </main>
  );
}
