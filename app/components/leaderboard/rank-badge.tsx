const RANK_STYLES: Record<number, string> = {
  1: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  2: "bg-zinc-300/20 text-zinc-300 border-zinc-300/30",
  3: "bg-amber-700/20 text-amber-600 border-amber-700/30",
};

export function RankBadge({ rank }: { rank: number }) {
  const style = RANK_STYLES[rank] ?? "bg-card text-content-muted border-edge";

  return (
    <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full border text-xs font-bold ${style}`}>
      {rank}
    </span>
  );
}
