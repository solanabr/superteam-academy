import { Shell } from "@/components/Shell";

const rows = Array.from({ length: 10 }).map((_, i) => ({
  rank: i + 1,
  username: ["kaue", "yuki", "dev", "builder", "anchor"][i % 5],
  xp: 5000 - i * 250,
  level: 7 - Math.floor(i / 2),
}));

export default function LeaderboardPage() {
  return (
    <Shell
      title="Leaderboard"
      subtitle="This will be computed off-chain by indexing XP token balances (devnet reads)."
    >
      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 text-left text-xs text-zinc-500">
            <tr>
              <th className="px-4 py-3">Rank</th>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">XP</th>
              <th className="px-4 py-3">Level</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.rank} className="border-t border-zinc-200">
                <td className="px-4 py-3">#{r.rank}</td>
                <td className="px-4 py-3 font-medium">@{r.username}</td>
                <td className="px-4 py-3">{r.xp.toLocaleString()}</td>
                <td className="px-4 py-3">{r.level}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Shell>
  );
}
