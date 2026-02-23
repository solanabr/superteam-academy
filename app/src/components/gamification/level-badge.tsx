"use client";

export function LevelBadge({ level }: { level: number }) {
  return (
    <div className="inline-flex items-center rounded-full border border-[#ffd23f]/40 bg-gradient-to-r from-[#2f6b3f]/20 to-[#ffd23f]/20 px-3 py-1 text-xs font-semibold text-[#ffd23f] shadow-[0_0_22px_rgba(255,210,63,0.18)]">
      Level {level}
    </div>
  );
}
