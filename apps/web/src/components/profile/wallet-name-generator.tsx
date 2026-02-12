"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Shuffle, Check } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { generateWalletName } from "@/lib/utils/generate-wallet-name";

interface WalletNameGeneratorProps {
  /** The name currently saved in the DB */
  currentName: string;
  /** How many re-rolls the user has already used */
  rerollsUsed: number;
  /** Max re-rolls allowed */
  maxRerolls?: number;
  /** Whether to play the slot-machine reveal animation on mount */
  animateOnMount?: boolean;
  /** Called when the user picks a new name (re-roll). Should persist to DB. */
  onNameChange: (name: string, newRerollsUsed: number) => Promise<boolean>;
  /** Called when the user confirms ("Ship it!") */
  onConfirm: () => void;
}

export function WalletNameGenerator({
  currentName,
  rerollsUsed,
  maxRerolls = 3,
  animateOnMount = false,
  onNameChange,
  onConfirm,
}: WalletNameGeneratorProps) {
  const t = useTranslations("nameGenerator");
  const [displayName, setDisplayName] = useState(
    animateOnMount ? "" : currentName
  );
  const [isRolling, setIsRolling] = useState(false);
  const [localRerolls, setLocalRerolls] = useState(rerollsUsed);
  const [settled, setSettled] = useState(!animateOnMount);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const targetRef = useRef(currentName);

  // Slot-machine roll animation — decelerating random names
  const runAnimation = useCallback((finalName: string) => {
    setIsRolling(true);
    setSettled(false);
    targetRef.current = finalName;

    let iteration = 0;
    const maxIterations = 16;

    function tick() {
      iteration++;
      if (iteration >= maxIterations) {
        setDisplayName(finalName);
        setIsRolling(false);
        setSettled(true);
        return;
      }

      setDisplayName(generateWalletName());
      // Decelerate: 50ms → ~500ms
      const delay = 50 + iteration * 30;
      timeoutRef.current = setTimeout(tick, delay);
    }

    tick();
  }, []);

  // Initial reveal animation
  useEffect(() => {
    if (animateOnMount && currentName) {
      // Small delay so the modal renders before animation starts
      const id = setTimeout(() => runAnimation(currentName), 300);
      return () => clearTimeout(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleReroll = async () => {
    if (isRolling || localRerolls >= maxRerolls) return;

    const newName = generateWalletName();
    const newCount = localRerolls + 1;

    // Start animation immediately for responsiveness
    runAnimation(newName);

    const success = await onNameChange(newName, newCount);
    if (success) {
      setLocalRerolls(newCount);
    }
  };

  const rerollsRemaining = maxRerolls - localRerolls;

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Title */}
      <div className="text-center">
        <h2 className="font-display text-xl font-bold">{t("title")}</h2>
        <p className="mt-1 text-sm text-text-3">{t("subtitle")}</p>
      </div>

      {/* Name display with gradient border */}
      <div className="relative w-full max-w-md rounded-xl bg-gradient-to-r from-primary to-secondary p-[2px]">
        <div className="flex min-h-[80px] items-center justify-center rounded-[10px] bg-bg px-6 py-4">
          <span
            className={`font-mono text-xl font-bold tracking-tight transition-opacity sm:text-2xl ${
              settled ? "opacity-100" : "opacity-80"
            } ${isRolling ? "text-text-3" : "text-text"}`}
          >
            {displayName || "\u00A0"}
          </span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          onClick={handleReroll}
          disabled={isRolling || rerollsRemaining <= 0}
          className="gap-2"
        >
          <Shuffle size={18} weight="bold" aria-hidden="true" />
          {t("reroll")}
          {rerollsRemaining > 0 && (
            <span className="ml-1 text-xs text-text-3">
              ({rerollsRemaining})
            </span>
          )}
        </Button>
        <Button
          variant="push"
          onClick={onConfirm}
          disabled={isRolling}
          className="gap-2"
        >
          <Check size={18} weight="bold" aria-hidden="true" />
          {t("shipIt")}
        </Button>
      </div>

      {/* Reroll status */}
      <p className="text-xs text-text-3">
        {rerollsRemaining > 0
          ? t("rerollsLeft", { count: rerollsRemaining })
          : t("noRerolls")}
      </p>
    </div>
  );
}
