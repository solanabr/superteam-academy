"use client";

import { useConexo } from '@/hooks/useConexo';
import { GameHeader } from '@/components/games/GameHeader';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { learningProgressService } from '@/services/learningProgress';

export default function ConexoPage() {
  const t = useTranslations();
  const { publicKey } = useWallet();
  const {
    boardTiles,
    solvedGroups,
    selectedIds,
    mistakesRemaining,
    status,
    isShaking,
    toggleSelection,
    submitGuess,
    shuffleTiles,
  } = useConexo();

  useEffect(() => {
    if (status === 'won' && publicKey) {
      learningProgressService.completeArcadeGame({
        wallet: publicKey.toString(),
        gameId: 'conexo',
        xp: 150
      });
    }
  }, [status, publicKey]);

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <GameHeader 
        title="Conexo.sol"
        description={t('arcade.conexo.desc')}
        rules={
          <>
            <p>{t('arcade.conexo.rules.1')}</p>
            <p>{t('arcade.conexo.rules.2')}</p>
            <p><strong>{t('arcade.conexo.rules.3')}</strong></p>
          </>
        }
      />

      <div className="flex flex-col items-center select-none mt-6">
        {status === 'won' && (
          <div className="mb-6 rounded-lg bg-green-500/20 text-green-400 px-6 py-3 font-semibold border border-green-500/30 text-center animate-in fade-in zoom-in">
            {t('arcade.win')}
          </div>
        )}
        {status === 'lost' && (
          <div className="mb-6 rounded-lg bg-red-500/20 text-red-400 px-6 py-3 font-semibold border border-red-500/30 text-center animate-in fade-in zoom-in">
            {t('arcade.lose')}
          </div>
        )}

        {/* Solved Groups Board */}
        <div className="w-full flex flex-col gap-2 mb-2">
          <AnimatePresence>
            {solvedGroups.map((group) => (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                key={group.category}
                className={`w-full rounded-md p-4 text-center border overflow-hidden relative shadow-lg ${group.color.replace('bg-', 'bg-').replace('500', '500/20')} border-${group.color.split('-')[1]}-500/40`}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none" />
                <h3 className={`font-bold text-lg mb-1 uppercase tracking-wider text-${group.color.split('-')[1]}-400`}>
                  {group.category.replace(/-/g, ' ')}
                </h3>
                <p className="font-semibold text-foreground truncate px-2">
                  {group.terms.map(t => t.term).join(', ')}
                </p>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Unsolved Grid */}
        <div className="w-full grid grid-cols-4 gap-2">
          <AnimatePresence>
            {boardTiles.map((tile) => {
              const isSelected = selectedIds.includes(tile.id);
              return (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  key={tile.id}
                  onClick={() => toggleSelection(tile.id)}
                  className={`
                    flex items-center justify-center text-center p-2 rounded-md font-semibold text-[13px] sm:text-base aspect-[4/3] sm:aspect-[2/1] cursor-pointer transition-colors duration-200 shadow-sm border
                    ${isSelected ? 'bg-primary text-black border-primary' : 'bg-black/30 border-border/50 hover:bg-black/50 text-foreground'}
                    ${isShaking && isSelected ? 'animate-shake bg-destructive text-destructive-foreground border-destructive' : ''}
                  `}
                >
                  <span className="break-words line-clamp-3">{tile.term}</span>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>

        {/* Action Bar */}
        {status === 'playing' && (
          <div className="mt-8 flex flex-col items-center gap-6 w-full max-w-sm">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground mr-2">{t('arcade.mistakesRemaining')}</span>
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className={`h-3 w-3 rounded-full transition-colors duration-300 ${
                    i < mistakesRemaining ? 'bg-primary shadow-[0_0_8px_rgba(var(--primary),0.5)]' : 'bg-destructive/30'
                  }`}
                />
              ))}
            </div>

            <div className="flex w-full gap-3 justify-center">
              <Button 
                variant="outline" 
                onClick={shuffleTiles}
                className="bg-black/20 hover:bg-black/40 border-border/50"
              >
                {t('arcade.shuffle')}
              </Button>
              <Button 
                onClick={submitGuess}
                disabled={selectedIds.length !== 4}
                className={`transition-all ${selectedIds.length === 4 ? 'shadow-[0_0_15px_rgba(var(--primary),0.4)]' : ''}`}
              >
                {t('arcade.submit')}
              </Button>
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.6s cubic-bezier(.36,.07,.19,.97) both;
        }
      `}</style>
    </main>
  );
}
