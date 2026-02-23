"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { getLeaderboard } from "@/lib/services/leaderboard";
import type { LeaderboardEntry } from "@/lib/services/types";

const DEMO_ENTRIES_ALL_TIME: LeaderboardEntry[] = [
  {
    rank: 1,
    wallet: "7Rq1...dK4f",
    displayName: "SolDev.eth",
    xp: 4250,
    level: 6,
    streak: 31,
  },
  {
    rank: 2,
    wallet: "Bx9Y...mP2r",
    displayName: "AnchorMaster",
    xp: 3800,
    level: 6,
    streak: 18,
  },
  {
    rank: 3,
    wallet: "Dk3W...nL7s",
    displayName: "RustyCoder",
    xp: 3200,
    level: 5,
    streak: 24,
  },
  {
    rank: 4,
    wallet: "Fs5K...vQ9a",
    displayName: "DeFiDegen42",
    xp: 2900,
    level: 5,
    streak: 12,
  },
  {
    rank: 5,
    wallet: "Hm7R...bT4c",
    displayName: "Web3Builder",
    xp: 2650,
    level: 5,
    streak: 15,
  },
  {
    rank: 6,
    wallet: "Jt2E...kW8d",
    displayName: "SolanaNoob",
    xp: 2100,
    level: 4,
    streak: 9,
  },
  {
    rank: 7,
    wallet: "Lp4G...yX3f",
    displayName: "ChainLink_Dev",
    xp: 1800,
    level: 4,
    streak: 7,
  },
  {
    rank: 8,
    wallet: "Nq6I...zR5h",
    displayName: "TokenWizard",
    xp: 1500,
    level: 3,
    streak: 14,
  },
  {
    rank: 9,
    wallet: "Ps8K...aT7j",
    displayName: "CryptoLearner",
    xp: 1200,
    level: 3,
    streak: 5,
  },
  {
    rank: 10,
    wallet: "Rv1M...bU9l",
    displayName: "BlockchainBob",
    xp: 900,
    level: 3,
    streak: 3,
  },
  {
    rank: 11,
    wallet: "Tx3O...cV2n",
    displayName: "SolProgrammer",
    xp: 750,
    level: 2,
    streak: 8,
  },
  {
    rank: 12,
    wallet: "Vz5Q...dW4p",
    displayName: "AnchorDev99",
    xp: 600,
    level: 2,
    streak: 2,
  },
  {
    rank: 13,
    wallet: "Xb7S...eX6r",
    displayName: "RustBeginner",
    xp: 450,
    level: 2,
    streak: 6,
  },
  {
    rank: 14,
    wallet: "Zd9U...fY8t",
    displayName: "NewToSolana",
    xp: 300,
    level: 1,
    streak: 1,
  },
  {
    rank: 15,
    wallet: "Bf2W...gZ1v",
    displayName: "Web3Student",
    xp: 150,
    level: 1,
    streak: 4,
  },
];

const DEMO_ENTRIES_WEEKLY: LeaderboardEntry[] = [
  {
    rank: 1,
    wallet: "Dk3W...nL7s",
    displayName: "RustyCoder",
    xp: 820,
    level: 5,
    streak: 24,
  },
  {
    rank: 2,
    wallet: "Hm7R...bT4c",
    displayName: "Web3Builder",
    xp: 690,
    level: 5,
    streak: 15,
  },
  {
    rank: 3,
    wallet: "7Rq1...dK4f",
    displayName: "SolDev.eth",
    xp: 540,
    level: 6,
    streak: 31,
  },
  {
    rank: 4,
    wallet: "Nq6I...zR5h",
    displayName: "TokenWizard",
    xp: 480,
    level: 3,
    streak: 14,
  },
  {
    rank: 5,
    wallet: "Bx9Y...mP2r",
    displayName: "AnchorMaster",
    xp: 350,
    level: 6,
    streak: 18,
  },
  {
    rank: 6,
    wallet: "Tx3O...cV2n",
    displayName: "SolProgrammer",
    xp: 290,
    level: 2,
    streak: 8,
  },
  {
    rank: 7,
    wallet: "Fs5K...vQ9a",
    displayName: "DeFiDegen42",
    xp: 210,
    level: 5,
    streak: 12,
  },
  {
    rank: 8,
    wallet: "Xb7S...eX6r",
    displayName: "RustBeginner",
    xp: 180,
    level: 2,
    streak: 6,
  },
  {
    rank: 9,
    wallet: "Jt2E...kW8d",
    displayName: "SolanaNoob",
    xp: 120,
    level: 4,
    streak: 9,
  },
  {
    rank: 10,
    wallet: "Bf2W...gZ1v",
    displayName: "Web3Student",
    xp: 90,
    level: 1,
    streak: 4,
  },
];

const DEMO_ENTRIES_MONTHLY: LeaderboardEntry[] = [
  {
    rank: 1,
    wallet: "7Rq1...dK4f",
    displayName: "SolDev.eth",
    xp: 1850,
    level: 6,
    streak: 31,
  },
  {
    rank: 2,
    wallet: "Dk3W...nL7s",
    displayName: "RustyCoder",
    xp: 1620,
    level: 5,
    streak: 24,
  },
  {
    rank: 3,
    wallet: "Bx9Y...mP2r",
    displayName: "AnchorMaster",
    xp: 1400,
    level: 6,
    streak: 18,
  },
  {
    rank: 4,
    wallet: "Hm7R...bT4c",
    displayName: "Web3Builder",
    xp: 1280,
    level: 5,
    streak: 15,
  },
  {
    rank: 5,
    wallet: "Nq6I...zR5h",
    displayName: "TokenWizard",
    xp: 980,
    level: 3,
    streak: 14,
  },
  {
    rank: 6,
    wallet: "Fs5K...vQ9a",
    displayName: "DeFiDegen42",
    xp: 850,
    level: 5,
    streak: 12,
  },
  {
    rank: 7,
    wallet: "Jt2E...kW8d",
    displayName: "SolanaNoob",
    xp: 720,
    level: 4,
    streak: 9,
  },
  {
    rank: 8,
    wallet: "Tx3O...cV2n",
    displayName: "SolProgrammer",
    xp: 540,
    level: 2,
    streak: 8,
  },
  {
    rank: 9,
    wallet: "Lp4G...yX3f",
    displayName: "ChainLink_Dev",
    xp: 460,
    level: 4,
    streak: 7,
  },
  {
    rank: 10,
    wallet: "Xb7S...eX6r",
    displayName: "RustBeginner",
    xp: 320,
    level: 2,
    streak: 6,
  },
  {
    rank: 11,
    wallet: "Ps8K...aT7j",
    displayName: "CryptoLearner",
    xp: 250,
    level: 3,
    streak: 5,
  },
  {
    rank: 12,
    wallet: "Bf2W...gZ1v",
    displayName: "Web3Student",
    xp: 150,
    level: 1,
    streak: 4,
  },
];

function getDemoEntries(timeframe: string): LeaderboardEntry[] {
  switch (timeframe) {
    case "weekly":
      return DEMO_ENTRIES_WEEKLY;
    case "monthly":
      return DEMO_ENTRIES_MONTHLY;
    default:
      return DEMO_ENTRIES_ALL_TIME;
  }
}

function formatRank(rank: number): string {
  return rank.toString().padStart(2, "0");
}

function formatXp(xp: number): { value: string; unit: string } {
  if (xp >= 1000) {
    return { value: (xp / 1000).toFixed(1).replace(/\.0$/, ""), unit: "k XP" };
  }
  return { value: xp.toString(), unit: " XP" };
}

function estimateCoursesCompleted(xp: number): number {
  return Math.floor(xp / 400) + 1;
}

export default function LeaderboardPage() {
  const t = useTranslations("leaderboard");
  const { publicKey, connected } = useWallet();
  const walletAddress = publicKey?.toBase58() ?? null;
  const shortWallet = walletAddress
    ? `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`
    : null;
  const [timeframe, setTimeframe] = useState<"weekly" | "monthly" | "alltime">(
    "alltime",
  );
  const [selectedTrack, setSelectedTrack] = useState<string>("all");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  const [expandedLeader, setExpandedLeader] = useState<number | null>(null);
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const check = () => setMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const userEntry = shortWallet
    ? entries.find((e) => e.wallet === shortWallet)
    : null;
  const userRank = userEntry?.rank ?? null;

  useEffect(() => {
    setLoading(true);
    getLeaderboard(timeframe).then((data) => {
      setEntries(data.length > 0 ? data : getDemoEntries(timeframe));
      setIsDemo(data.length === 0);
      setLoading(false);
    });
  }, [timeframe]);

  const timeFilters: {
    key: "weekly" | "monthly" | "alltime";
    label: string;
  }[] = [
    { key: "weekly", label: "THIS WEEK" },
    { key: "monthly", label: "THIS MONTH" },
    { key: "alltime", label: "ALL TIME" },
  ];

  return (
    <div style={{ background: "var(--v9-white)", color: "var(--v9-dark)" }}>
      {/* Demo banner */}
      {isDemo && !loading && (
        <div
          style={{
            fontFamily: "var(--v9-mono)",
            fontSize: "10px",
            letterSpacing: "2px",
            color: "var(--v9-mid-grey)",
            textAlign: "center",
            padding: mobile ? "12px 20px" : "12px 40px",
            textTransform: "uppercase",
          }}
        >
          DEMO DATA &middot; CONNECT WALLET FOR LIVE RANKINGS
        </div>
      )}

      {/* Header */}
      <header
        style={{ padding: mobile ? "100px 20px 24px" : "140px 40px 40px" }}
      >
        <h1
          className="v9-fade-up v9-fade-d1"
          style={{
            fontFamily: "var(--v9-serif)",
            fontSize: "clamp(48px, 8vw, 120px)",
            fontWeight: 900,
            letterSpacing: "-3px",
            lineHeight: 0.9,
            color: "var(--v9-dark)",
            margin: 0,
            opacity: 0,
          }}
        >
          Leaderboard
        </h1>
        <p
          className="v9-overline v9-fade-up v9-fade-d2"
          style={{ marginTop: "24px", opacity: 0 }}
        >
          {entries.length} BUILDERS &middot; RANKED BY ON-CHAIN XP &middot;
          UPDATED LIVE
        </p>
      </header>

      {/* Time filter */}
      <div
        style={{
          padding: mobile ? "0 20px 32px" : "0 40px 48px",
          display: "flex",
          gap: mobile ? "16px" : "24px",
          alignItems: "center",
        }}
      >
        {timeFilters.map((filter) => (
          <button
            key={filter.key}
            onClick={() => setTimeframe(filter.key)}
            style={{
              fontFamily: "var(--v9-mono)",
              fontSize: "10px",
              letterSpacing: "2px",
              textTransform: "uppercase",
              background: "none",
              border: "none",
              borderBottom:
                timeframe === filter.key
                  ? "1px solid var(--v9-dark)"
                  : "1px solid transparent",
              color:
                timeframe === filter.key
                  ? "var(--v9-dark)"
                  : "var(--v9-mid-grey)",
              cursor: "pointer",
              padding: "8px 0",
              transition: "color 0.3s, border-color 0.3s",
            }}
            onMouseEnter={(e) => {
              if (timeframe !== filter.key) {
                (e.target as HTMLButtonElement).style.color = "var(--v9-dark)";
              }
            }}
            onMouseLeave={(e) => {
              if (timeframe !== filter.key) {
                (e.target as HTMLButtonElement).style.color =
                  "var(--v9-mid-grey)";
              }
            }}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Loading state */}
      {loading ? (
        <div
          style={{
            fontFamily: "var(--v9-mono)",
            fontSize: "11px",
            letterSpacing: "3px",
            textTransform: "uppercase",
            color: "var(--v9-mid-grey)",
            textAlign: "center",
            padding: mobile ? "80px 20px" : "160px 40px",
            animation: "v9-fade-up 0.8s var(--v9-ease) forwards",
          }}
        >
          LOADING...
        </div>
      ) : (
        <>
          {/* Leader entries */}
          <div aria-live="polite" aria-atomic="false">
            {entries.map((entry, i) => {
              const isExpanded = expandedLeader === entry.rank;
              const xpFormatted = formatXp(entry.xp);

              return (
                <div
                  key={entry.rank}
                  className={`v9-leader-entry v9-fade-up ${isExpanded ? "expanded" : ""} ${userRank && entry.rank === userRank ? "v9-your-position" : ""}`}
                  style={{ animationDelay: `${0.15 + i * 0.06}s`, opacity: 0 }}
                  onClick={() =>
                    setExpandedLeader(isExpanded ? null : entry.rank)
                  }
                >
                  {/* Background rank number (Don't Board Me) */}
                  <span
                    style={{
                      position: "absolute",
                      right: mobile ? "16px" : "40px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      fontFamily: "var(--v9-serif)",
                      fontSize: mobile
                        ? "clamp(60px, 20vw, 120px)"
                        : "clamp(100px, 18vw, 240px)",
                      fontWeight: 900,
                      fontStyle: "italic",
                      opacity: isExpanded ? 0.06 : 0.04,
                      pointerEvents: "none",
                      letterSpacing: "-8px",
                      lineHeight: 0.8,
                      transition: "opacity 0.5s",
                      color: isExpanded ? "var(--v9-white)" : "inherit",
                      userSelect: "none",
                    }}
                  >
                    {formatRank(entry.rank)}
                  </span>

                  {/* Top row */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      gap: mobile ? "12px" : "24px",
                      position: "relative",
                      zIndex: 2,
                    }}
                  >
                    {/* Rank */}
                    <span
                      style={{
                        fontFamily: "var(--v9-serif)",
                        fontSize: "14px",
                        fontStyle: "italic",
                        opacity: 0.3,
                        flexShrink: 0,
                      }}
                    >
                      {formatRank(entry.rank)}
                    </span>

                    {/* Name */}
                    <span
                      className="v9-leader-name"
                      style={{
                        fontFamily: "var(--v9-serif)",
                        fontSize: mobile
                          ? "clamp(18px, 5vw, 28px)"
                          : "clamp(24px, 4vw, 52px)",
                        fontWeight: 900,
                        letterSpacing: "-1.5px",
                        lineHeight: 1,
                        transition: "letter-spacing 0.5s var(--v9-ease)",
                        flexShrink: mobile ? 1 : 0,
                        minWidth: 0,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap" as const,
                      }}
                    >
                      {entry.displayName ?? "Anonymous"}
                    </span>

                    {/* Handle */}
                    <span
                      style={{
                        fontFamily: "var(--v9-mono)",
                        fontSize: "11px",
                        letterSpacing: "1px",
                        opacity: 0.3,
                        flexShrink: 0,
                        display: "none",
                      }}
                      className="v9-leader-handle"
                    >
                      @{(entry.displayName ?? "anon").toLowerCase()}.sol
                    </span>

                    {/* XP (right-aligned) */}
                    <span
                      style={{
                        fontFamily: "var(--v9-serif)",
                        fontSize: mobile ? "20px" : "28px",
                        fontWeight: 200,
                        letterSpacing: "-1px",
                        marginLeft: "auto",
                        flexShrink: 0,
                        position: "relative",
                        zIndex: 2,
                      }}
                    >
                      {xpFormatted.value}
                      <span
                        style={{
                          fontSize: "12px",
                          fontWeight: 400,
                          opacity: 0.4,
                          marginLeft: "2px",
                        }}
                      >
                        {xpFormatted.unit}
                      </span>
                    </span>
                  </div>

                  {/* Expanded details (KPR-verse layered reveal) */}
                  {isExpanded && (
                    <div style={{ position: "relative", zIndex: 2 }}>
                      <div
                        style={{
                          display: "flex",
                          gap: mobile ? "24px" : "48px",
                          marginTop: mobile ? "20px" : "32px",
                          flexWrap: "wrap",
                        }}
                      >
                        {/* Courses completed */}
                        <div>
                          <div
                            style={{
                              fontFamily: "var(--v9-serif)",
                              fontSize: "32px",
                              fontWeight: 200,
                              letterSpacing: "-1px",
                              color:
                                entry.rank <= 3
                                  ? "var(--v9-sol-green)"
                                  : "inherit",
                            }}
                          >
                            {estimateCoursesCompleted(entry.xp)}
                          </div>
                          <div
                            style={{
                              fontFamily: "var(--v9-mono)",
                              fontSize: "9px",
                              letterSpacing: "3px",
                              textTransform: "uppercase",
                              opacity: 0.3,
                              marginTop: "4px",
                            }}
                          >
                            COURSES COMPLETED
                          </div>
                        </div>

                        {/* Day streak */}
                        <div>
                          <div
                            style={{
                              fontFamily: "var(--v9-serif)",
                              fontSize: "32px",
                              fontWeight: 200,
                              letterSpacing: "-1px",
                              color:
                                entry.rank <= 3
                                  ? "var(--v9-sol-green)"
                                  : "inherit",
                            }}
                          >
                            {entry.streak}
                          </div>
                          <div
                            style={{
                              fontFamily: "var(--v9-mono)",
                              fontSize: "9px",
                              letterSpacing: "3px",
                              textTransform: "uppercase",
                              opacity: 0.3,
                              marginTop: "4px",
                            }}
                          >
                            DAY STREAK
                          </div>
                        </div>

                        {/* Level */}
                        <div>
                          <div
                            style={{
                              fontFamily: "var(--v9-serif)",
                              fontSize: "32px",
                              fontWeight: 200,
                              letterSpacing: "-1px",
                              color:
                                entry.rank <= 3
                                  ? "var(--v9-sol-green)"
                                  : "inherit",
                            }}
                          >
                            {entry.level}
                          </div>
                          <div
                            style={{
                              fontFamily: "var(--v9-mono)",
                              fontSize: "9px",
                              letterSpacing: "3px",
                              textTransform: "uppercase",
                              opacity: 0.3,
                              marginTop: "4px",
                            }}
                          >
                            LEVEL
                          </div>
                        </div>
                      </div>

                      {/* View on-chain profile badge */}
                      <div
                        style={{
                          fontFamily: "var(--v9-mono)",
                          fontSize: "10px",
                          letterSpacing: "3px",
                          textTransform: "uppercase",
                          border: "1px solid rgba(255,255,255,0.15)",
                          padding: "8px 16px",
                          marginTop: "32px",
                          display: "inline-block",
                          cursor: "pointer",
                          transition: "background 0.3s, color 0.3s",
                        }}
                        onClick={(e) => e.stopPropagation()}
                        onMouseEnter={(e) => {
                          (e.target as HTMLDivElement).style.background =
                            "rgba(255,255,255,0.1)";
                        }}
                        onMouseLeave={(e) => {
                          (e.target as HTMLDivElement).style.background =
                            "transparent";
                        }}
                      >
                        VIEW ON-CHAIN PROFILE &rarr;
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Your position summary */}
          <div
            style={{
              padding: mobile ? "48px 20px" : "80px 40px",
              textAlign: "center",
              borderTop: "1px solid var(--v9-off-white)",
            }}
          >
            <div
              className="v9-overline"
              style={{
                fontSize: "10px",
                letterSpacing: "4px",
                color: "var(--v9-mid-grey)",
              }}
            >
              YOUR POSITION
            </div>
            <div
              style={{
                fontFamily: "var(--v9-serif)",
                fontSize: "clamp(48px, 8vw, 96px)",
                fontWeight: 900,
                fontStyle: "italic",
                letterSpacing: "-3px",
                color: "var(--v9-dark)",
                marginTop: "16px",
              }}
            >
              {connected && userRank ? `#${userRank}` : connected ? "--" : "#4"}
            </div>
            <div
              style={{
                fontFamily: "var(--v9-sans)",
                fontSize: "16px",
                color: "var(--v9-mid-grey)",
                marginTop: "8px",
              }}
            >
              {connected
                ? userRank
                  ? "Keep building to move up"
                  : "Complete courses to appear on the leaderboard"
                : "Connect wallet to see your rank"}
            </div>
            <Link href="/courses" style={{ textDecoration: "none" }}>
              <button className="v9-cta-primary" style={{ marginTop: "32px" }}>
                Continue Learning &rarr;
              </button>
            </Link>
          </div>
        </>
      )}

      {/* Inline styles for hover effects that CSS classes don't cover */}
      <style>{`
        .v9-leader-entry:hover .v9-leader-name {
          letter-spacing: 1px !important;
        }
        .v9-leader-entry.expanded .v9-leader-name {
          letter-spacing: -1.5px !important;
        }
        .v9-leader-entry:hover > span:first-child {
          opacity: 0.08 !important;
        }
        .v9-leader-entry.expanded > span:first-child {
          opacity: 0.06 !important;
          color: var(--v9-white) !important;
        }
        @media (min-width: 640px) {
          .v9-leader-handle {
            display: inline !important;
          }
        }
      `}</style>
    </div>
  );
}
