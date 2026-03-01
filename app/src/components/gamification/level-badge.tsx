"use client";

export function LevelBadge({ level }: { level: number }) {
  return (
    <div className="inline-flex items-center rounded-full border border-highlight/40 bg-gradient-cta px-3 py-1 text-xs font-semibold text-cta-foreground shadow-sm">
      Level {level}
    </div>
  );
}
