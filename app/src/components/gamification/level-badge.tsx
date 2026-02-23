"use client";

export function LevelBadge({ level }: { level: number }) {
  return (
    <div className="inline-flex items-center rounded-full border border-[#14F195]/40 bg-gradient-to-r from-[#9945FF]/20 to-[#14F195]/20 px-3 py-1 text-xs font-semibold text-[#14F195] shadow-[0_0_22px_rgba(20,241,149,0.18)]">
      Level {level}
    </div>
  );
}
