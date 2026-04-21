"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Button } from "@/components/ui/button";
import { GameHeader } from "@/components/games/GameHeader";
import { useConexo } from "@/hooks/useConexo";
import { learningProgressService } from "@/services/learningProgress";

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
    if (status === "won" && publicKey) {
      learningProgressService.completeArcadeGame({
        wallet: publicKey.toString(),
        gameId: "conexo",
        xp: 150,
      });
    }
  }, [status, publicKey]);

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <GameHeader
        title="Conexo.sol"
        description={t("arcade.conexo.desc")}
        rules={
          <>
            <p>{t("arcade.conexo.rules.1")}</p>
            <p>{t("arcade.conexo.rules.2")}</p>
            <p>
              <strong>{t("arcade.conexo.rules.3")}</strong>
            </p>
          </>
        }
      />

      <div className="mt-6 flex select-none flex-col items-center">
        {status === "won" && (
          <div className="mb-6 rounded-lg border border-green-500/30 bg-green-500/20 px-6 py-3 text-center font-semibold text-green-400 animate-in fade-in zoom-in">
            {t("arcade.win")}
          </div>
        )}
        {status === "lost" && (
          <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/20 px-6 py-3 text-center font-semibold text-red-400 animate-in fade-in zoom-in">
            {t("arcade.lose")}
          </div>
        )}

        {/* Solved Groups Board */}
        <div className="mb-2 flex w-full flex-col gap-2">
          <AnimatePresence>
            {solvedGroups.map((group) => (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                key={group.category}
                className={`relative w-full overflow-hidden rounded-md border p-4 text-center shadow-lg ${group.color.replace("bg-", "bg-").replace("500", "500/20")} border-${group.color.split("-")[1]}-500/40`}
              >
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent" />
                <h3
                  className={`mb-1 text-lg font-bold uppercase tracking-wider text-${group.color.split("-")[1]}-400`}
                >
                  {group.category.replace(/-/g, " ")}
                </h3>
                <p className="truncate px-2 font-semibold text-foreground">
                  {group.terms.map((t) => t.term).join(", ")}
                </p>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Unsolved Grid */}
        <div className="grid w-full grid-cols-4 gap-2">
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
                  className={`flex aspect-[4/3] cursor-pointer items-center justify-center rounded-md border p-2 text-center text-[13px] font-semibold shadow-sm transition-colors duration-200 sm:aspect-[2/1] sm:text-base ${isSelected ? "border-primary bg-primary text-black" : "border-border/50 bg-black/30 text-foreground hover:bg-black/50"} ${isShaking && isSelected ? "animate-shake border-destructive bg-destructive text-destructive-foreground" : ""} `}
                >
                  <span className="line-clamp-3 break-words">{tile.term}</span>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Action Bar */}
        {status === "playing" && (
          <div className="mt-8 flex w-full max-w-sm flex-col items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="mr-2 text-sm font-medium text-muted-foreground">
                {t("arcade.mistakesRemaining")}
              </span>
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className={`h-3 w-3 rounded-full transition-colors duration-300 ${
                    i < mistakesRemaining
                      ? "bg-primary shadow-[0_0_8px_rgba(var(--primary),0.5)]"
                      : "bg-destructive/30"
                  }`}
                />
              ))}
            </div>

            <div className="flex w-full justify-center gap-3">
              <Button
                variant="outline"
                onClick={shuffleTiles}
                className="border-border/50 bg-black/20 hover:bg-black/40"
              >
                {t("arcade.shuffle")}
              </Button>
              <Button
                onClick={submitGuess}
                disabled={selectedIds.length !== 4}
                className={`transition-all ${selectedIds.length === 4 ? "shadow-[0_0_15px_rgba(var(--primary),0.4)]" : ""}`}
              >
                {t("arcade.submit")}
              </Button>
            </div>
          </div>
        )}
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
            transform: translateX(-5px);
          }
          20%,
          40%,
          60%,
          80% {
            transform: translateX(5px);
          }
        }
        .animate-shake {
          animation: shake 0.6s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
        }
      `}</style>
    </main>
  );
}
