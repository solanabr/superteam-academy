"use client";

export function LevelBadge({ level }: { level: number }) {
  return (
    <div className="inline-flex items-center rounded-full border border-[#14F195]/40 bg-[#14F195]/10 px-3 py-1 text-xs font-semibold text-[#14F195]">
      Level {level}
    </div>
  );
}
