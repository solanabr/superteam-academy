"use client";

import { Trophy } from "lucide-react";

export function Leaderboard() {
  const leaders = [
    { rank: 1, address: "7xKX...sAsU", xp: 15420, level: 12 },
    { rank: 2, address: "GDfn...1XYZ", xp: 12350, level: 11 },
    { rank: 3, address: "8ZVf...3ABC", xp: 11200, level: 10 },
    { rank: 4, address: "9YAf...4DEF", xp: 9800, level: 9 },
    { rank: 5, address: "1ZBZ...5GHI", xp: 8750, level: 9 },
    { rank: 6, address: "2aCX...6IJK", xp: 8200, level: 8 },
    { rank: 7, address: "3bDY...7KLM", xp: 7650, level: 8 },
    { rank: 8, address: "4cEZ...8MNO", xp: 7100, level: 7 },
    { rank: 9, address: "5dFA...9PQR", xp: 6800, level: 7 },
    { rank: 10, address: "6eGB...0STU", xp: 6450, level: 7 },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold mb-2">Leaderboard</h2>
        <p className="text-white/50">Top learners ranked by XP earned this season.</p>
      </div>

      {/* Table */}
      <div className="border border-white/10 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10 bg-white/[0.02]">
              <th className="text-left py-3 px-4 text-xs font-medium text-white/50 uppercase tracking-wider">Rank</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-white/50 uppercase tracking-wider">Learner</th>
              <th className="text-right py-3 px-4 text-xs font-medium text-white/50 uppercase tracking-wider">Level</th>
              <th className="text-right py-3 px-4 text-xs font-medium text-white/50 uppercase tracking-wider">XP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {leaders.map((leader) => (
              <tr
                key={leader.rank}
                className="hover:bg-white/[0.02] transition-colors"
              >
                <td className="py-3 px-4">
                  {leader.rank <= 3 ? (
                    <div className="flex items-center gap-2">
                      <Trophy className={`w-4 h-4 ${leader.rank === 1 ? "text-yellow-400" :
                          leader.rank === 2 ? "text-gray-300" :
                            "text-amber-600"
                        }`} />
                      <span className="font-medium">{leader.rank}</span>
                    </div>
                  ) : (
                    <span className="text-white/50">{leader.rank}</span>
                  )}
                </td>
                <td className="py-3 px-4">
                  <span className="font-mono text-sm">{leader.address}</span>
                </td>
                <td className="py-3 px-4 text-right">
                  <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-white/5 text-white/70">
                    Lvl {leader.level}
                  </span>
                </td>
                <td className="py-3 px-4 text-right font-mono">
                  {leader.xp.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Your Position */}
      <div className="p-4 rounded-lg border border-white/20 bg-white/[0.02]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-md bg-white/10 flex items-center justify-center font-medium text-sm">
              234
            </div>
            <div>
              <div className="font-medium">Your position</div>
              <div className="text-sm text-white/50">Top 10% of all learners</div>
            </div>
          </div>
          <div className="text-right">
            <div className="font-mono font-medium">3,840 XP</div>
            <div className="text-sm text-white/50">to next rank</div>
          </div>
        </div>
      </div>
    </div>
  );
}
