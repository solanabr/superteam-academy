"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useWallet } from "@solana/wallet-adapter-react";
import { useEffect } from "react";
import { learningProgressService } from "@/services/learningProgress";
import { GameHeader } from "@/components/games/GameHeader";
import { useTermo } from "@/hooks/useTermo";

const KEYBOARD_ROWS = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["ENTER", "Z", "X", "C", "V", "B", "N", "M", "BACKSPACE"],
];

export default function TermoPage() {
  const t = useTranslations();
  const { publicKey } = useWallet();
  const {
    targetWord,
    wordLength,
    guesses,
    currentGuess,
    gameStatus,
    isInvalidWord,
    usedLetters,
    onKeyPress,
  } = useTermo();

  useEffect(() => {
    if (gameStatus === "won" && publicKey) {
      learningProgressService.completeArcadeGame({
        wallet: publicKey.toString(),
        gameId: "termo",
        xp: 50,
      });
    }
  }, [gameStatus, publicKey]);

  // Create an array of exactly 6 rows to display
  const rows = Array.from({ length: 6 });

  return (
    <main className="mx-auto max-w-lg px-4 py-8">
      <GameHeader
        title="Termo.sol"
        description={t("arcade.termo.desc")}
        rules={
          <>
            <p>{t("arcade.termo.rules.1")}</p>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded bg-primary font-bold text-black">
                T
              </div>
              <span>{t("arcade.termo.rules.2")}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded bg-yellow-500 font-bold text-black">
                E
              </div>
              <span>{t("arcade.termo.rules.3")}</span>
            </div>
          </>
        }
      />

      <div className="user-select-none mt-4 flex flex-col items-center outline-none">
        {/* Game Status Messages */}
        <div className="mb-4 flex h-10 items-center justify-center text-center">
          {gameStatus === "won" && (
            <div className="bg-primary/20 border-primary/50 rounded border px-4 py-2 font-bold text-primary shadow-lg animate-in fade-in slide-in-from-top-2">
              {t("arcade.win")} ({targetWord})
            </div>
          )}
          {gameStatus === "lost" && (
            <div className="bg-destructive/20 border-destructive/50 rounded border px-4 py-2 font-bold text-destructive shadow-lg animate-in fade-in slide-in-from-top-2">
              {t("arcade.lose")} (Word: {targetWord})
            </div>
          )}
        </div>

        {/* Board */}
        <div
          className="mb-8 grid gap-2"
          style={{ gridTemplateRows: "repeat(6, minmax(0, 1fr))" }}
        >
          {rows.map((_, rowIndex) => {
            const isCurrentRow = rowIndex === guesses.length;
            const guessRecord = guesses[rowIndex];

            return (
              <div
                key={rowIndex}
                className={`grid gap-2 ${isCurrentRow && isInvalidWord ? "animate-shake" : ""}`}
                style={{
                  gridTemplateColumns: `repeat(${wordLength}, minmax(0, 1fr))`,
                }}
              >
                {Array.from({ length: wordLength }).map((_, colIndex) => {
                  let letter = "";
                  let status = "empty";

                  if (guessRecord && guessRecord[colIndex]) {
                    letter = guessRecord[colIndex]!.letter;
                    status = guessRecord[colIndex]!.status;
                  } else if (isCurrentRow && colIndex < currentGuess.length) {
                    letter = currentGuess[colIndex] || "";
                  }

                  let bgColor = "bg-black/40 border-border/50 text-foreground";
                  if (status === "correct")
                    bgColor = "bg-primary border-primary text-black";
                  if (status === "present")
                    bgColor = "bg-yellow-500 border-yellow-500 text-black";
                  if (status === "absent")
                    bgColor = "bg-zinc-800 border-zinc-700 text-foreground/50";

                  // Highlight cell actively being typed
                  if (status === "empty" && letter !== "")
                    bgColor =
                      "border-foreground/50 text-foreground bg-black/40";

                  return (
                    <div
                      key={colIndex}
                      className="relative h-12 w-12 sm:h-14 sm:w-14"
                      style={{ perspective: "1000px" }}
                    >
                      <motion.div
                        initial={false}
                        animate={
                          status !== "empty" ? { rotateX: 180 } : { rotateX: 0 }
                        }
                        transition={{ duration: 0.6, delay: colIndex * 0.1 }}
                        className="h-full w-full"
                        style={{ transformStyle: "preserve-3d" }}
                      >
                        {/* Front (Empty or Typed) */}
                        <div
                          className={`absolute inset-0 flex flex-col items-center justify-center rounded-md border-2 text-xl font-bold uppercase sm:text-2xl ${status === "empty" && letter ? "border-primary/50" : "border-border/50"} bg-black/40`}
                          style={{ backfaceVisibility: "hidden" }}
                        >
                          {status === "empty" && letter}
                        </div>

                        {/* Back (Evaluated) */}
                        <div
                          className={`absolute inset-0 flex flex-col items-center justify-center rounded-md border-2 text-xl font-bold uppercase sm:text-2xl ${bgColor}`}
                          style={{
                            backfaceVisibility: "hidden",
                            transform: "rotateX(180deg)",
                          }}
                        >
                          {status !== "empty" && letter}
                        </div>
                      </motion.div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Keyboard */}
        <div className="w-full max-w-full px-1">
          {KEYBOARD_ROWS.map((row, r) => (
            <div key={r} className="mb-2 flex justify-center gap-1 sm:gap-2">
              {row.map((key) => {
                const status = usedLetters[key];
                let keyBg = "bg-zinc-800 text-foreground hover:bg-zinc-700";

                if (status === "correct") keyBg = "bg-primary text-black";
                else if (status === "present")
                  keyBg = "bg-yellow-500 text-black";
                else if (status === "absent")
                  keyBg = "bg-zinc-900 text-foreground/30";

                const isSpecial = key === "ENTER" || key === "BACKSPACE";

                return (
                  <button
                    key={key}
                    onClick={() => onKeyPress(key)}
                    className={` ${keyBg} flex items-center justify-center rounded font-semibold transition-colors ${isSpecial ? "min-w-[3rem] px-3 text-[10px] sm:min-w-[4rem] sm:px-4 sm:text-xs" : "w-[8%] min-w-[1.75rem] text-sm sm:w-11 sm:text-lg"} h-12 select-none active:scale-95 sm:h-14`}
                  >
                    {key === "BACKSPACE" ? (
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"></path>
                        <line x1="18" y1="9" x2="12" y2="15"></line>
                        <line x1="12" y1="9" x2="18" y2="15"></line>
                      </svg>
                    ) : (
                      key
                    )}
                  </button>
                );
              })}
            </div>
          ))}
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
