/**
 * @module gamification-quests
 * Daily quest types, templates, and deterministic quest generation.
 */

// ── Types ──────────────────────────────────────────────────────────────────

export interface Quest {
  id: string;
  type: "lessons" | "xp" | "challenge" | "streak";
  title: string;
  description: string;
  target: number;
  progress: number;
  xpReward: number;
  completed: boolean;
}

export interface DailyQuests {
  date: string;
  quests: Quest[];
}

// ── Helpers ────────────────────────────────────────────────────────────────

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

// ── Quest Templates ───────────────────────────────────────────────────────

interface QuestTemplate {
  id: string;
  type: Quest["type"];
  title: string;
  variants: { description: string; target: number; xpReward: number }[];
}

const QUEST_TEMPLATES: QuestTemplate[] = [
  {
    id: "lesson-learner",
    type: "lessons",
    title: "Lesson Learner",
    variants: [
      { description: "Complete 1 lesson today", target: 1, xpReward: 25 },
      { description: "Complete 2 lessons today", target: 2, xpReward: 50 },
      { description: "Complete 3 lessons today", target: 3, xpReward: 75 },
    ],
  },
  {
    id: "xp-hunter",
    type: "xp",
    title: "XP Hunter",
    variants: [
      { description: "Earn 30 XP today", target: 30, xpReward: 15 },
      { description: "Earn 50 XP today", target: 50, xpReward: 30 },
      { description: "Earn 100 XP today", target: 100, xpReward: 50 },
    ],
  },
  {
    id: "code-warrior",
    type: "challenge",
    title: "Code Warrior",
    variants: [
      { description: "Complete a coding challenge", target: 1, xpReward: 50 },
    ],
  },
  {
    id: "streak-keeper",
    type: "streak",
    title: "Streak Keeper",
    variants: [
      { description: "Keep your streak alive today", target: 1, xpReward: 25 },
    ],
  },
];

// ── Quest Generation ──────────────────────────────────────────────────────

/** Generate 3 deterministic daily quests based on date string. */
export function generateDailyQuests(dateString: string): Quest[] {
  const seed = hashString(dateString);
  const quests: Quest[] = [];

  const indices = [0, 1, 2, 3];
  const picked: number[] = [];
  let s = seed;
  while (picked.length < 3 && indices.length > 0) {
    const idx = s % indices.length;
    picked.push(indices[idx]);
    indices.splice(idx, 1);
    s = hashString(String(s + picked.length));
  }

  for (const templateIdx of picked) {
    const template = QUEST_TEMPLATES[templateIdx];
    const variantIdx = hashString(dateString + template.id) % template.variants.length;
    const variant = template.variants[variantIdx];
    quests.push({
      id: template.id,
      type: template.type,
      title: template.title,
      description: variant.description,
      target: variant.target,
      progress: 0,
      xpReward: variant.xpReward,
      completed: false,
    });
  }

  return quests;
}
