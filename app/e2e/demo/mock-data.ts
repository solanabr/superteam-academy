import { Keypair } from "@solana/web3.js";

const DEMO_KEYPAIR = Keypair.fromSeed(new Uint8Array(32).fill(42));
export const DEMO_WALLET = DEMO_KEYPAIR.publicKey.toBase58();

export const MOCK_COURSES = [
  {
    publicKey: "Course1111111111111111111111111111111111111111",
    courseId: "solana-101",
    creator: "Creator111111111111111111111111111111111111111",
    lessonCount: 8,
    difficulty: 1,
    xpPerLesson: 100,
    trackId: 1,
    trackLevel: 1,
    prerequisite: null,
    creatorRewardXp: 500,
    totalCompletions: 142,
    totalEnrollments: 387,
    isActive: true,
    createdAt: 1706000000,
  },
  {
    publicKey: "Course2222222222222222222222222222222222222222",
    courseId: "anchor-101",
    creator: "Creator111111111111111111111111111111111111111",
    lessonCount: 12,
    difficulty: 2,
    xpPerLesson: 150,
    trackId: 1,
    trackLevel: 2,
    prerequisite: "Course1111111111111111111111111111111111111111",
    creatorRewardXp: 800,
    totalCompletions: 67,
    totalEnrollments: 198,
    isActive: true,
    createdAt: 1706500000,
  },
  {
    publicKey: "Course3333333333333333333333333333333333333333",
    courseId: "defi-fundamentals",
    creator: "Creator222222222222222222222222222222222222222",
    lessonCount: 10,
    difficulty: 3,
    xpPerLesson: 200,
    trackId: 2,
    trackLevel: 1,
    prerequisite: null,
    creatorRewardXp: 1000,
    totalCompletions: 34,
    totalEnrollments: 156,
    isActive: true,
    createdAt: 1707000000,
  },
];

// Bitmap: lessons 0-4 completed (0b11111 = 31)
export const MOCK_ENROLLMENT_FLAGS = [31];

export const MOCK_ENROLLMENT = {
  course: MOCK_COURSES[0].publicKey,
  enrolledAt: 1706100000,
  completedAt: null,
  lessonFlags: MOCK_ENROLLMENT_FLAGS,
  credentialAsset: null,
};

export const MOCK_XP_BALANCE = 4200;

export const MOCK_LEADERBOARD = Array.from({ length: 20 }, (_, i) => ({
  wallet:
    i === 4
      ? DEMO_WALLET
      : `Wallet${String(i + 1).padStart(2, "0")}111111111111111111111111111111`,
  xp: 10000 - i * 450 + Math.floor(Math.random() * 50),
  rank: i + 1,
}));
// Fix demo wallet rank
MOCK_LEADERBOARD[4].xp = 4200;

export const MOCK_CREDENTIALS = [
  {
    id: "Cred1111111111111111111111111111111111111111111",
    content: {
      metadata: {
        name: "Solana 101 Certificate",
        symbol: "SACERT",
        uri: "https://arweave.net/demo-cert-metadata",
      },
    },
    authorities: [],
    compression: { compressed: false },
    grouping: [{ group_key: "collection", group_value: "TrackCollection1" }],
    royalty: { percent: 0 },
    creators: [],
    ownership: { owner: DEMO_WALLET },
    interface: "MplCoreAsset",
  },
];

export function generateStreakData(): Record<string, string> {
  const now = new Date();
  const entries: Record<string, string> = {};

  // 14-day active streak ending today
  for (let i = 0; i < 14; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    entries[d.toISOString().split("T")[0]] = "active";
  }

  // Scattered active days in the past 84 days (~50 total)
  for (let i = 14; i < 84; i++) {
    if (i % 2 === 0 || i % 3 === 0) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      entries[d.toISOString().split("T")[0]] = "active";
    }
  }

  // 2 freeze days
  const freeze1 = new Date(now);
  freeze1.setDate(freeze1.getDate() - 20);
  entries[freeze1.toISOString().split("T")[0]] = "freeze";
  const freeze2 = new Date(now);
  freeze2.setDate(freeze2.getDate() - 35);
  entries[freeze2.toISOString().split("T")[0]] = "freeze";

  return entries;
}
