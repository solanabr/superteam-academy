import { Code, Zap, Shield, Trophy } from "lucide-react";
import { Card } from "@/components/ui/card";

export function PlatformFeatures() {
  return (
    <section className="relative py-28">
      <div className="absolute inset-0 bg-mesh animate-drift-2" />

      <div className="relative z-10 mx-auto max-w-5xl px-6">
        <div className="text-center">
          <h2 className="text-3xl font-semibold tracking-tight">
            Built different
          </h2>
          <p className="mt-3 text-muted-foreground">
            Not another video course. Your progress lives on-chain.
          </p>
        </div>

        {/* Bento grid */}
        <div className="mt-16 grid gap-5 md:grid-cols-2">
          {/* ── Interactive Editor ── */}
          <Card className="group relative overflow-hidden border-border/50 bg-card/80 backdrop-blur-sm p-0 gap-0 transition-all hover:border-primary/20">
            <div className="p-6 pb-0">
              <div className="flex items-center gap-2">
                <Code className="size-4 text-primary" />
                <h3 className="text-xs font-bold uppercase tracking-widest text-primary">
                  Interactive Learning with Challenges
                </h3>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground max-w-sm">
                Learn by doing. Each course has a series of challenges to test
                your knowledge with real compiler feedback.
              </p>
            </div>
            {/* Mini editor mockup */}
            <div className="mt-5 mx-4 mb-4 rounded-lg border border-border/50 bg-[#0c0c0e] overflow-hidden">
              <div className="flex items-center gap-1.5 border-b border-border/30 px-3 py-2">
                <div className="size-2 rounded-full bg-[#ff5f57]" />
                <div className="size-2 rounded-full bg-[#febc2e]" />
                <div className="size-2 rounded-full bg-[#28c840]" />
                <span className="ml-2 text-[10px] text-muted-foreground/40">
                  challenge.rs
                </span>
              </div>
              <div className="px-3 py-3 font-mono text-[11px] leading-[1.7]">
                <div>
                  <span className="text-muted-foreground/30">1 </span>
                  <span style={{ color: "#c792ea" }}>pub fn </span>
                  <span style={{ color: "#82aaff" }}>transfer</span>
                  <span style={{ color: "#babed8" }}>(ctx: Context) {"{"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground/30">2 </span>
                  <span style={{ color: "#babed8" }}>
                    {"  "}let amount ={" "}
                  </span>
                  <span style={{ color: "#f78c6c" }}>1000</span>
                  <span style={{ color: "#89ddff" }}>;</span>
                </div>
                <div>
                  <span className="text-muted-foreground/30">3 </span>
                  <span style={{ color: "#546e7a" }}>
                    {"  "}// Your code here
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="text-muted-foreground/30">4 </span>
                  <span className="ml-2 inline-block h-4 w-px animate-pulse bg-primary" />
                </div>
                <div>
                  <span className="text-muted-foreground/30">5 </span>
                  <span style={{ color: "#89ddff" }}>{"}"}</span>
                </div>
              </div>
              {/* Status bar */}
              <div className="flex items-center justify-between border-t border-border/30 px-3 py-1.5">
                <span className="text-[10px] text-emerald-400">
                  2/3 tests passing
                </span>
                <span className="rounded bg-primary/20 px-1.5 py-0.5 text-[9px] font-medium text-primary">
                  RUN
                </span>
              </div>
            </div>
          </Card>

          {/* ── NFT Credentials ── */}
          <Card className="group relative overflow-hidden border-border/50 bg-card/80 backdrop-blur-sm p-0 gap-0 transition-all hover:border-primary/20">
            <div className="p-6 pb-0">
              <div className="flex items-center gap-2">
                <Shield className="size-4 text-primary" />
                <h3 className="text-xs font-bold uppercase tracking-widest text-primary">
                  Receive NFTs for your hard work
                </h3>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground max-w-sm">
                Collect Solana NFTs as you learn. All credentials are Metaplex
                Core certificates, 100% verified on-chain.
              </p>
            </div>
            {/* NFT card mockup */}
            <div className="mt-5 mx-4 mb-4 flex items-center gap-3">
              {[
                {
                  name: "Solana Fundamentals",
                  level: "Gold",
                  color: "#eab308",
                },
                {
                  name: "Anchor Developer",
                  level: "Silver",
                  color: "#a1a1aa",
                },
                { name: "DeFi Builder", level: "Bronze", color: "#d97706" },
              ].map((nft) => (
                <div
                  key={nft.name}
                  className="flex-1 rounded-lg border border-border/50 bg-[#0c0c0e] p-3 text-center"
                >
                  <div
                    className="mx-auto mb-2 flex size-10 items-center justify-center rounded-lg"
                    style={{
                      background: `${nft.color}15`,
                      border: `1px solid ${nft.color}30`,
                    }}
                  >
                    <Shield
                      className="size-5"
                      style={{ color: nft.color }}
                    />
                  </div>
                  <p className="text-[10px] font-medium truncate">{nft.name}</p>
                  <p
                    className="text-[9px] font-bold uppercase tracking-wider mt-0.5"
                    style={{ color: nft.color }}
                  >
                    {nft.level}
                  </p>
                </div>
              ))}
            </div>
          </Card>

          {/* ── Soulbound XP ── */}
          <Card className="group relative overflow-hidden border-border/50 bg-card/80 backdrop-blur-sm p-0 gap-0 transition-all hover:border-primary/20">
            <div className="p-6 pb-0">
              <div className="flex items-center gap-2">
                <Zap className="size-4 text-primary" />
                <h3 className="text-xs font-bold uppercase tracking-widest text-primary">
                  Soulbound XP system
                </h3>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground max-w-sm">
                Non-transferable Token-2022 tokens track every lesson. Your XP
                is yours forever — no gaming the system.
              </p>
            </div>
            {/* XP progress mockup */}
            <div className="mt-5 mx-4 mb-4 rounded-lg border border-border/50 bg-[#0c0c0e] p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex size-8 items-center justify-center rounded-full bg-xp/10 text-xs font-bold text-xp">
                    12
                  </div>
                  <div>
                    <p className="text-xs font-medium">Level 12</p>
                    <p className="text-[10px] text-muted-foreground">
                      2,450 / 3,600 XP
                    </p>
                  </div>
                </div>
                <span className="text-[10px] text-xp font-mono">+100 XP</span>
              </div>
              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-border/50">
                <div
                  className="h-full rounded-full bg-xp"
                  style={{ width: "68%" }}
                />
              </div>
              <div className="mt-3 flex gap-2">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
                  (day, i) => (
                    <div key={day} className="flex-1 text-center">
                      <div
                        className={`mx-auto size-5 rounded-sm text-[8px] flex items-center justify-center ${
                          i < 5
                            ? "bg-primary/20 text-primary"
                            : "bg-border/30 text-muted-foreground/30"
                        }`}
                      >
                        {i < 5 ? "✓" : ""}
                      </div>
                      <span className="text-[8px] text-muted-foreground/40 mt-0.5 block">
                        {day}
                      </span>
                    </div>
                  )
                )}
              </div>
            </div>
          </Card>

          {/* ── Leaderboard ── */}
          <Card className="group relative overflow-hidden border-border/50 bg-card/80 backdrop-blur-sm p-0 gap-0 transition-all hover:border-primary/20">
            <div className="p-6 pb-0">
              <div className="flex items-center gap-2">
                <Trophy className="size-4 text-primary" />
                <h3 className="text-xs font-bold uppercase tracking-widest text-primary">
                  Compete on the leaderboard
                </h3>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground max-w-sm">
                Daily streaks and achievements keep momentum going. See how you
                stack up against builders worldwide.
              </p>
            </div>
            {/* Leaderboard mockup */}
            <div className="mt-5 mx-4 mb-4 rounded-lg border border-border/50 bg-[#0c0c0e] overflow-hidden">
              {[
                {
                  rank: 1,
                  name: "lucas.sol",
                  xp: "14,200",
                  streak: 42,
                  medal: "🥇",
                },
                {
                  rank: 2,
                  name: "priya.sol",
                  xp: "12,800",
                  streak: 38,
                  medal: "🥈",
                },
                {
                  rank: 3,
                  name: "carlos.sol",
                  xp: "11,500",
                  streak: 31,
                  medal: "🥉",
                },
                {
                  rank: 4,
                  name: "you.sol",
                  xp: "2,450",
                  streak: 5,
                  medal: "",
                  highlight: true,
                },
              ].map((entry) => (
                <div
                  key={entry.rank}
                  className={`flex items-center gap-3 px-3 py-2.5 text-xs ${
                    "highlight" in entry && entry.highlight
                      ? "bg-primary/5 border-t border-dashed border-primary/20"
                      : "border-b border-border/20 last:border-0"
                  }`}
                >
                  <span className="w-5 text-center text-muted-foreground/50 font-mono">
                    {entry.medal || entry.rank}
                  </span>
                  <span
                    className={`flex-1 font-medium font-mono ${
                      "highlight" in entry && entry.highlight
                        ? "text-primary"
                        : ""
                    }`}
                  >
                    {entry.name}
                  </span>
                  <span className="text-muted-foreground/60 font-mono">
                    🔥 {entry.streak}d
                  </span>
                  <span className="font-mono font-medium text-xp">
                    {entry.xp}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}
