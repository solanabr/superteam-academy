"use client";

import { useExpresso } from '@/hooks/useExpresso';
import { GameHeader } from '@/components/games/GameHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Heart, FastForward, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { useWallet } from '@solana/wallet-adapter-react';
import { learningProgressService } from '@/services/learningProgress';
import { useEffect } from 'react';

export default function ExpressoPage() {
  const t = useTranslations();
  const { publicKey } = useWallet();
  const {
    currentIndex,
    currentTerm,
    maskedDefinition,
    currentGuess,
    setCurrentGuess,
    submitGuess,
    status,
    lives,
    isShaking
  } = useExpresso();

  useEffect(() => {
    if (status === 'won' && publicKey) {
      learningProgressService.completeArcadeGame({
        wallet: publicKey.toString(),
        gameId: 'expresso',
        xp: 30
      });
    }
  }, [status, publicKey]);

  if (!currentTerm && status === 'playing') return null;

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <GameHeader 
        title="Expresso.sol"
        description={t('arcade.expresso.desc')}
        rules={
          <>
            <p>{t('arcade.expresso.rules.1')}</p>
            <p>{t('arcade.expresso.rules.2')}</p>
          </>
        }
      />

      <div className="flex flex-col mt-4 selection:bg-primary/30">
        
        {/* Top Bar: Progress and Lives */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex flex-col gap-2 w-1/2">
             <div className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">
               Progresso {Math.min(currentIndex + 1, 5)}/5
             </div>
             <div className="h-1.5 w-full bg-border/50 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(currentIndex / 5) * 100}%` }}
                  className="h-full bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]"
                />
             </div>
          </div>
          <div className="flex items-center gap-1.5">
            {[...Array(3)].map((_, i) => (
              <Heart 
                key={i} 
                className={`h-5 w-5 transition-all duration-300 ${i < lives ? 'fill-red-500 text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.6)]' : 'fill-transparent text-muted-foreground'}`}
              />
            ))}
          </div>
        </div>

        {/* Game Area */}
        <div className="relative">
          <AnimatePresence mode="wait">
            {status === 'playing' ? (
              <motion.div 
                key={currentIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col gap-8"
              >
                {/* Definition Box */}
                <div className="relative p-6 sm:p-8 rounded-xl bg-black/40 border border-border/50 shadow-inner overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.8)]" />
                  <p className="text-lg sm:text-xl leading-relaxed text-foreground font-medium">
                    {maskedDefinition}
                  </p>
                  
                  {/* Hint: Word length */}
                  <div className="mt-6 flex flex-wrap gap-2 opacity-50">
                    <span className="text-xs px-2 py-1 bg-white/5 border border-white/10 rounded uppercase tracking-wide">
                      ({currentTerm?.term.length} letras)
                    </span>
                    {currentTerm?.term.includes(' ') && (
                      <span className="text-xs px-2 py-1 bg-white/5 border border-white/10 rounded uppercase tracking-wide">
                         Múltiplas palavras
                      </span>
                    )}
                  </div>
                </div>

                {/* Input Area */}
                <div className={`flex flex-col sm:flex-row gap-3 ${isShaking ? 'animate-shake' : ''}`}>
                  <Input 
                    type="text"
                    placeholder={t('arcade.expresso.placeholder')}
                    className="h-14 text-lg bg-black/40 border-border/50 focus-visible:ring-yellow-500/50 focus-visible:border-yellow-500"
                    value={currentGuess}
                    onChange={(e) => setCurrentGuess(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') submitGuess();
                    }}
                    autoFocus
                  />
                  <Button 
                    onClick={submitGuess}
                    className="h-14 px-8 bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-lg shadow-[0_0_15px_rgba(234,179,8,0.2)] hover:shadow-[0_0_20px_rgba(234,179,8,0.4)] transition-all"
                  >
                    <FastForward className="mr-2" />
                    {t('arcade.submit')}
                  </Button>
                </div>
              </motion.div>
            ) : status === 'won' ? (
              <motion.div 
                key="won"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-8 text-center border border-yellow-500/30 bg-yellow-500/10 rounded-xl"
              >
                <div className="inline-flex w-16 h-16 bg-yellow-500/20 text-yellow-500 rounded-full items-center justify-center mb-4">
                  <Trophy className="h-8 w-8" />
                </div>
                <h2 className="text-3xl font-bold text-yellow-500 mb-2">{t('arcade.win')}</h2>
              </motion.div>
            ) : (
              <motion.div 
                key="lost"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-8 text-center border border-destructive/30 bg-destructive/10 rounded-xl"
              >
                <h2 className="text-3xl font-bold text-destructive mb-2">{t('arcade.lose')}</h2>
                <p className="text-sm font-medium mb-4">Word: <span className="text-foreground">{currentTerm?.term}</span></p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <style jsx global>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
        }
      `}</style>
    </main>
  );
}
