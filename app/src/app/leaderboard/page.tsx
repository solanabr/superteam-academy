import { Shell } from "@/components/Shell";
import { getDevnetLeaderboardStub } from "@/lib/solana";

export default async function LeaderboardPage() {
  const rows = await getDevnetLeaderboardStub();

  return (
    <Shell
      title="Leaderboard"
      subtitle="Structure ready for indexing devnet XP token balances into ranked rows."
    >
      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 text-left text-xs text-zinc-500">
            <tr>
              <th className="px-4 py-3">Rank</th>
              <th className="px-4 py-3">Wallet</th>
              <th className="px-4 py-3">XP Balance</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.rank} className="border-t border-zinc-200">
                <td className="px-4 py-3">#{r.rank}</td>
                <td className="px-4 py-3 font-medium">{r.wallet}</td>
                <td className="px-4 py-3">{r.xpBalance.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Shell>
  );
}
