/* ── Types ── */

export interface LeaderboardEntry {
  rank: number;
  name: string;
  username: string;
  initials: string;
  level: number;
  xp: number;
  streak: number;
  accent: string;
  isCurrentUser?: boolean;
}

export type TimeFilter = "weekly" | "monthly" | "all-time";
export type CourseFilter = "all" | string;

/* ── Mock Data ── */

const accents = ["#34d399", "#eab308", "#22d3ee", "#a78bfa", "#f472b6"];

const topEntries: Omit<LeaderboardEntry, "rank">[] = [
  {
    name: "Alex Chen",
    username: "alexchen",
    initials: "AC",
    level: 14,
    xp: 8920,
    streak: 34,
    accent: "#34d399",
  },
  {
    name: "Maria Santos",
    username: "mariasantos",
    initials: "MS",
    level: 13,
    xp: 8450,
    streak: 28,
    accent: "#eab308",
  },
  {
    name: "Jake Wilson",
    username: "jakewilson",
    initials: "JW",
    level: 12,
    xp: 7800,
    streak: 19,
    accent: "#22d3ee",
  },
  {
    name: "Priya Patel",
    username: "priyapatel",
    initials: "PP",
    level: 11,
    xp: 7200,
    streak: 22,
    accent: "#a78bfa",
  },
  {
    name: "Tom Nguyen",
    username: "tomnguyen",
    initials: "TN",
    level: 11,
    xp: 6950,
    streak: 15,
    accent: "#f472b6",
  },
  {
    name: "Sarah Kim",
    username: "sarahkim",
    initials: "SK",
    level: 10,
    xp: 6400,
    streak: 31,
    accent: "#34d399",
  },
  {
    name: "Leo Müller",
    username: "leomuller",
    initials: "LM",
    level: 9,
    xp: 5800,
    streak: 11,
    accent: "#eab308",
  },
  {
    name: "Nina Rao",
    username: "ninarao",
    initials: "NR",
    level: 9,
    xp: 5500,
    streak: 17,
    accent: "#22d3ee",
  },
  {
    name: "Omar Diaz",
    username: "omardiaz",
    initials: "OD",
    level: 8,
    xp: 4900,
    streak: 9,
    accent: "#a78bfa",
  },
  {
    name: "Yuki Tanaka",
    username: "yukitanaka",
    initials: "YT",
    level: 8,
    xp: 4600,
    streak: 20,
    accent: "#f472b6",
  },
  {
    name: "Emma Brown",
    username: "emmabrown",
    initials: "EB",
    level: 8,
    xp: 4200,
    streak: 14,
    accent: "#34d399",
  },
  {
    name: "Chris Park",
    username: "chrispark",
    initials: "CP",
    level: 7,
    xp: 3900,
    streak: 7,
    accent: "#eab308",
  },
  {
    name: "Amara Obi",
    username: "amaraobi",
    initials: "AO",
    level: 7,
    xp: 3700,
    streak: 5,
    accent: "#22d3ee",
  },
  {
    name: "Raj Sharma",
    username: "rajsharma",
    initials: "RS",
    level: 7,
    xp: 3500,
    streak: 13,
    accent: "#a78bfa",
  },
  {
    name: "Lena Vogt",
    username: "lenavogt",
    initials: "LV",
    level: 6,
    xp: 3300,
    streak: 8,
    accent: "#f472b6",
  },
  {
    name: "Dev Kapoor",
    username: "devkapoor",
    initials: "DK",
    level: 6,
    xp: 3100,
    streak: 2,
    accent: "#34d399",
  },
  {
    name: "Sofia Costa",
    username: "sofiacosta",
    initials: "SC",
    level: 6,
    xp: 2900,
    streak: 4,
    accent: "#eab308",
  },
  {
    name: "Kai Yamamoto",
    username: "kaiyamamoto",
    initials: "KY",
    level: 6,
    xp: 2800,
    streak: 10,
    accent: "#22d3ee",
  },
  {
    name: "Ana Silva",
    username: "anasilva",
    initials: "AS",
    level: 5,
    xp: 2700,
    streak: 6,
    accent: "#a78bfa",
  },
  {
    name: "Marco Rossi",
    username: "marcorossi",
    initials: "MR",
    level: 5,
    xp: 2650,
    streak: 3,
    accent: "#f472b6",
  },
];

// Generate filler names for ranks 21-120
const fillerNames = [
  "Jordan Lee",
  "Riley Adams",
  "Casey Morgan",
  "Taylor Swift",
  "Avery Brooks",
  "Quinn Davis",
  "Peyton Clark",
  "Morgan Hall",
  "Dakota Stone",
  "Jamie Rivers",
  "Skyler Fox",
  "Sage Green",
  "River Banks",
  "Phoenix West",
  "Rowan Hart",
  "Blair Campbell",
  "Emery Scott",
  "Hayden Young",
  "Finley Reed",
  "Charlie Moss",
  "Drew Palmer",
  "Eden Wright",
  "Harper Lane",
  "Kendall Cross",
  "Logan Hayes",
  "Parker Nash",
  "Reese Quinn",
  "Spencer Cole",
  "Blake Hunt",
  "Cameron Ford",
  "Dylan Shaw",
  "Elliott Gray",
  "Frankie Moore",
  "Glenn Price",
  "Harley Burns",
  "Indigo James",
  "Jesse Knight",
  "Kit Walker",
  "Lane Fisher",
  "Milan Torres",
  "Noel Grant",
  "Oakley Pierce",
  "Presley Ray",
  "Reagan Wolf",
  "Sasha Bell",
  "Tatum Dean",
  "Uma Rhodes",
  "Val Soto",
  "Winter Snow",
  "Xen Marsh",
  "Zara Fields",
  "Arden Lake",
  "Briar Rose",
  "Cleo Stone",
  "Darcy Wells",
  "Ellis Fox",
  "Flynn Park",
  "Gray Moon",
  "Haven Dale",
  "Ivy Storm",
  "Jules Bay",
  "Kira Sand",
  "Lyric Dawn",
  "Mars Hill",
  "Nico Vale",
  "Onyx Drake",
  "Pax Ridge",
  "Remy Shore",
  "Sol Cruz",
  "Tate Hale",
  "Uri Frost",
  "Vesper Bloom",
  "Wren Thorne",
  "Xavi Crest",
  "Yael Dune",
  "Zion Peak",
  "Asher Blaze",
  "Bodhi Wave",
  "Cypress Sage",
  "Delta Ash",
  "Echo Fern",
  "Flora Tide",
  "Gale Holt",
  "Haze Brook",
  "Iris Flame",
  "Jade River",
  "Kai Drift",
  "Lark Shore",
  "Mist Harbor",
  "Nyx Shadow",
  "Opal Glow",
  "Pine Hollow",
  "Rain Wilder",
  "Stella North",
  "True West",
];

function generateFillerEntries(): Omit<LeaderboardEntry, "rank">[] {
  return fillerNames.map((name, i) => {
    const parts = name.split(" ");
    const initials = (parts[0]![0]! + parts[1]![0]!).toUpperCase();
    const username = name.toLowerCase().replace(" ", "");
    const xp = Math.max(50, 2600 - i * 25 - Math.floor(Math.random() * 10));
    const level = Math.max(1, Math.floor(xp / 500));
    const streak = Math.max(0, Math.floor(Math.random() * 15));
    return {
      name,
      username,
      initials,
      level,
      xp,
      streak,
      accent: accents[i % accents.length]!,
    };
  });
}

const allBaseEntries = [
  ...topEntries,
  ...generateFillerEntries(),
];

/* ── Helpers ── */

export function getLeaderboard(
  time: TimeFilter = "all-time",
): LeaderboardEntry[] {
  const multiplier = time === "weekly" ? 0.08 : time === "monthly" ? 0.3 : 1;

  return allBaseEntries
    .map((e) => ({
      ...e,
      xp: Math.round(e.xp * multiplier),
    }))
    .sort((a, b) => b.xp - a.xp)
    .map((e, i) => ({ ...e, rank: i + 1 }));
}

export function getCurrentUserRank(entries: LeaderboardEntry[]) {
  return entries.find((e) => e.isCurrentUser) ?? null;
}

// Get entries around the current user (for "your position" section)
export function getEntriesAroundUser(entries: LeaderboardEntry[]) {
  const userIdx = entries.findIndex((e) => e.isCurrentUser);
  if (userIdx === -1) return [];
  const start = Math.max(0, userIdx - 2);
  const end = Math.min(entries.length, userIdx + 3);
  return entries.slice(start, end);
}

export const courseFilters = [
  { value: "all", label: "All Courses" },
  { value: "solana-fundamentals", label: "Solana Fundamentals" },
  { value: "anchor-development", label: "Anchor Development" },
  { value: "program-security", label: "Program Security" },
  { value: "amm-design", label: "AMM Design" },
];
