export interface SeasonalEvent {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  xpMultiplier: number;
  theme: { accent: string; gradient: string };
  achievements: string[];
}

export const seasonalEvents: SeasonalEvent[] = [
  {
    id: "solana-breakpoint-2026",
    name: "Breakpoint 2026",
    description: "Double XP during Solana Breakpoint!",
    startDate: "2026-09-15T00:00:00Z",
    endDate: "2026-09-19T23:59:59Z",
    xpMultiplier: 2,
    theme: {
      accent: "#9945FF",
      gradient: "linear-gradient(135deg, #9945FF, #14F195)",
    },
    achievements: ["breakpoint-attendee"],
  },
  {
    id: "summer-of-solana-2026",
    name: "Summer of Solana",
    description:
      "1.5x XP all summer! Complete challenges for exclusive badges.",
    startDate: "2026-06-01T00:00:00Z",
    endDate: "2026-08-31T23:59:59Z",
    xpMultiplier: 1.5,
    theme: {
      accent: "#FFD700",
      gradient: "linear-gradient(135deg, #FF6B6B, #FFD700)",
    },
    achievements: ["summer-scholar"],
  },
];
