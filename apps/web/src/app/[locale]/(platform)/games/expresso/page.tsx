"use client";

import { Heart, FastForward, Trophy } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { useWallet } from "@solana/wallet-adapter-react";
import { useEffect } from "react";
import { useExpresso } from "@/hooks/useExpresso";
import { GameHeader } from "@/components/games/GameHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { learningProgressService } from "@/services/learningProgress";

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
    isShaking,
  } = useExpresso();

  useEffect(() => {
    if (status === "won" && publicKey) {
      learningProgressService.completeArcadeGame({
        wallet: publicKey.toString(),
        gameId: "expresso",
        xp: 30,
      });
    }
  }, [status, publicKey]);

  if (!currentTerm && status === "playing") return null;

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <GameHeader
        title="Expresso.sol"
        description={t("arcade.expresso.desc")}
        rules={
          <>
            <p>{t("arcade.expresso.rules.1")}</p>
            <p>{t("arcade.expresso.rules.2")}</p>
          </>
        }
      />

      <div className="selection:bg-primary/30 mt-4 flex flex-col">
        {/* Top Bar: Progress and Lives */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex w-1/2 flex-col gap-2">
            <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Progresso {Math.min(currentIndex + 1, 5)}/5
            </div>
            <div className="bg-border/50 h-1.5 w-full overflow-hidden rounded-full">
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
                className={`h-5 w-5 transition-all duration-300 ${i < lives ? "fill-red-500 text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.6)]" : "fill-transparent text-muted-foreground"}`}
              />
            ))}
          </div>
        </div>

        {/* Game Area */}
        <div className="relative">
          <AnimatePresence mode="wait">
            {status === "playing" ? (
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col gap-8"
              >
                {/* Definition Box */}
                <div className="border-border/50 relative overflow-hidden rounded-xl border bg-black/40 p-6 shadow-inner sm:p-8">
                  <div className="absolute left-0 top-0 h-full w-1 bg-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.8)]" />
                  <p className="text-lg font-medium leading-relaxed text-foreground sm:text-xl">
                    {maskedDefinition}
                  </p>

                  {/* Hint: Word length */}
                  <div className="mt-6 flex flex-wrap gap-2 opacity-50">
                    <span className="rounded border border-white/10 bg-white/5 px-2 py-1 text-xs uppercase tracking-wide">
                      ({currentTerm?.term.length} letras)
                    </span>
                    {currentTerm?.term.includes(" ") && (
                      <span className="rounded border border-white/10 bg-white/5 px-2 py-1 text-xs uppercase tracking-wide">
                        Múltiplas palavras
                      </span>
                    )}
                  </div>
                </div>

                {/* Input Area */}
                <div
                  className={`flex flex-col gap-3 sm:flex-row ${isShaking ? "animate-shake" : ""}`}
                >
                  <Input
                    type="text"
                    placeholder={t("arcade.expresso.placeholder")}
                    className="border-border/50 h-14 bg-black/40 text-lg focus-visible:border-yellow-500 focus-visible:ring-yellow-500/50"
                    value={currentGuess}
                    onChange={(e) => setCurrentGuess(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") submitGuess();
                    }}
                    autoFocus
                  />
                  <Button
                    onClick={submitGuess}
                    className="h-14 bg-yellow-500 px-8 text-lg font-bold text-black shadow-[0_0_15px_rgba(234,179,8,0.2)] transition-all hover:bg-yellow-400 hover:shadow-[0_0_20px_rgba(234,179,8,0.4)]"
                  >
                    <FastForward className="mr-2" />
                    {t("arcade.submit")}
                  </Button>
                </div>
              </motion.div>
            ) : status === "won" ? (
              <motion.div
                key="won"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-8 text-center"
              >
                <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-yellow-500/20 text-yellow-500">
                  <Trophy className="h-8 w-8" />
                </div>
                <h2 className="mb-2 text-3xl font-bold text-yellow-500">
                  {t("arcade.win")}
                </h2>
              </motion.div>
            ) : (
              <motion.div
                key="lost"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="border-destructive/30 bg-destructive/10 rounded-xl border p-8 text-center"
              >
                <h2 className="mb-2 text-3xl font-bold text-destructive">
                  {t("arcade.lose")}
                </h2>
                <p className="mb-4 text-sm font-medium">
                  Word:{" "}
                  <span className="text-foreground">{currentTerm?.term}</span>
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <style jsx global>{`
        @keyframes shake {
          0%,
          100% {
            transform: translateX(0);
          }
          10%,
          30%,
          50%,
          70%,
          90% {
            transform: translateX(-4px);
          }
          20%,
          40%,
          60%,
          80% {
            transform: translateX(4px);
          }
        }
        .animate-shake {
          animation: shake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
        }
      `}</style>
    </main>
  );
}
