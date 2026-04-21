"use client";

import { Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { useWallet } from "@solana/wallet-adapter-react";
import { useEffect } from "react";
import { useContexto } from "@/hooks/useContexto";
import { GameHeader } from "@/components/games/GameHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { learningProgressService } from "@/services/learningProgress";

function getColorBySimilarity(similarity: number, rank: number) {
  if (rank === 1)
    return "bg-green-500 text-black shadow-[0_0_15px_rgba(34,197,94,0.6)]";
  if (similarity > 80)
    return "bg-emerald-500/20 text-emerald-400 border border-emerald-500/50";
  if (similarity > 50)
    return "bg-yellow-500/20 text-yellow-400 border border-yellow-500/50";
  if (similarity > 20)
    return "bg-orange-500/20 text-orange-400 border border-orange-500/50";
  return "bg-zinc-800/50 text-zinc-400 border border-zinc-700/50";
}

function getFillColorBySimilarity(similarity: number, rank: number) {
  if (rank === 1) return "bg-green-500";
  if (similarity > 80) return "bg-emerald-500";
  if (similarity > 50) return "bg-yellow-500";
  if (similarity > 20) return "bg-orange-500";
  return "bg-zinc-600";
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
    if (status === "won" && publicKey) {
      learningProgressService.completeArcadeGame({
        wallet: publicKey.toString(),
        gameId: "contexto",
        xp: 100,
      });
    }
  }, [status, publicKey]);

  return (
    <main className="mx-auto flex min-h-[calc(100vh-80px)] max-w-2xl flex-col px-4 py-8">
      <GameHeader
        title="Contexto.sol"
        description={t("arcade.contexto.desc")}
        rules={
          <>
            <p>{t("arcade.contexto.rules.1")}</p>
            <p>{t("arcade.contexto.rules.2")}</p>
            <p>{t("arcade.contexto.rules.3")}</p>
          </>
        }
      />

      <div className="relative flex w-full flex-1 flex-col">
        {/* Input Fixed at Top */}
        <div className="bg-background/80 sticky top-0 z-10 w-full pb-4 pt-2 backdrop-blur-xl">
          {status === "won" && (
            <div className="mb-4 rounded-xl border border-green-500/50 bg-green-500/20 p-4 text-center animate-in fade-in slide-in-from-top-2">
              <h2 className="text-xl font-bold text-green-400">
                {t("arcade.win")}
              </h2>
              <p className="mt-1 text-sm text-green-200">{targetTerm?.term}</p>
            </div>
          )}

          <div
            className={`flex w-full gap-2 ${isInvalid ? "animate-shake" : ""}`}
          >
            <Input
              placeholder={t("arcade.contexto.placeholder")}
              value={currentGuess}
              onChange={(e) => setCurrentGuess(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submitGuess();
              }}
              className="border-border/50 h-14 bg-black/40 text-lg sm:h-16 sm:text-xl"
              disabled={status === "won"}
              autoFocus
            />
            <Button
              onClick={submitGuess}
              disabled={status === "won" || !currentGuess.trim()}
              className="hover:bg-primary/80 h-14 w-14 flex-shrink-0 bg-primary text-black sm:h-16 sm:w-16"
            >
              <Send className="h-6 w-6" />
            </Button>
          </div>
          {isInvalid && (
            <p className="absolute -bottom-5 left-2 mt-2 text-sm text-destructive">
              Termo inválido ou não presente no glossário.
            </p>
          )}
        </div>

        {/* Guesses List */}
        <div className="mt-8 flex w-full flex-col gap-3 pb-10">
          <AnimatePresence initial={false}>
            {guesses.map((guess) => (
              <motion.div
                key={guess.term.id}
                layout
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.3 }}
                className={`relative flex items-center justify-between overflow-hidden rounded-lg p-4 sm:p-5 ${getColorBySimilarity(guess.similarity, guess.rank)}`}
              >
                {/* Background Progress Bar */}
                <div
                  className={`absolute bottom-0 left-0 top-0 opacity-20 ${getFillColorBySimilarity(guess.similarity, guess.rank)} transition-all duration-1000 ease-out`}
                  style={{ width: `${guess.similarity}%` }}
                />

                <span className="z-10 text-lg font-bold sm:text-xl">
                  {guess.term.term}
                </span>
                <span className="z-10 flex items-center gap-2 font-mono font-medium">
                  <span className="text-xs uppercase tracking-tighter opacity-70">
                    {t("arcade.contexto.rank")}
                  </span>
                  {guess.rank}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>

          {guesses.length === 0 && status === "playing" && (
            <div className="border-border/50 flex h-40 items-center justify-center rounded-xl border-2 border-dashed text-muted-foreground opacity-50">
              Seu histórico de palpites aparecerá aqui
            </div>
          )}
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
          animation: shake 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
        }
      `}</style>
    </main>
  );
}
