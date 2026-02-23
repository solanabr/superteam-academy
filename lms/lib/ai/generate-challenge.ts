import type { PracticeCategory, PracticeDifficulty } from "@/types/practice";
import { PRACTICE_CHALLENGES } from "@/lib/data/practice-challenges";

const LYZR_API_URL = "https://agent-prod.studio.lyzr.ai/v3/inference/chat/";
const LYZR_AGENT_ID = "6990319188c3964deca09041";

const CATEGORIES: PracticeCategory[] = [
  "accounts",
  "transactions",
  "pdas",
  "tokens",
  "cpi",
  "serialization",
  "security",
  "anchor",
  "defi",
  "advanced",
];

const DIFFICULTIES: PracticeDifficulty[] = ["easy", "medium", "hard"];

const XP_BY_DIFFICULTY: Record<PracticeDifficulty, number> = {
  easy: 15,
  medium: 30,
  hard: 60,
};

export interface GeneratedChallenge {
  title: string;
  description: string;
  difficulty: PracticeDifficulty;
  category: PracticeCategory;
  language: "rust" | "typescript";
  xpReward: number;
  starterCode: string;
  solution: string;
  testCases: { id: string; name: string; input: string; expected: string }[];
  hints: string[];
}

function getDayIndex(brtDate: string): number {
  const epoch = new Date("2026-01-01").getTime();
  const current = new Date(brtDate).getTime();
  return Math.floor((current - epoch) / (24 * 60 * 60 * 1000));
}

function buildPrompt(
  difficulty: PracticeDifficulty,
  category: PracticeCategory,
  recentTitles: string[],
): string {
  const exclusion =
    recentTitles.length > 0
      ? `\n\nIMPORTANT: Do NOT repeat any of these recent challenges:\n${recentTitles.map((t) => `- "${t}"`).join("\n")}\nGenerate a completely different challenge with a unique concept and title.`
      : "";

  return `Generate a Solana coding challenge with the following requirements:
- Difficulty: ${difficulty}
- Category: ${category}
- Language: TypeScript (using @solana/web3.js, @coral-xyz/anchor, or related Solana libraries)

Return ONLY valid JSON with this exact structure (no markdown fences, no explanation):
{
  "title": "Short descriptive title",
  "description": "1-2 sentence description of what the learner must implement",
  "language": "typescript",
  "starterCode": "The starter code with // Your code here placeholder",
  "solution": "The complete working solution",
  "testCases": [
    { "id": "t1", "name": "Descriptive test name", "input": "", "expected": "" },
    { "id": "t2", "name": "Another test", "input": "", "expected": "" },
    { "id": "t3", "name": "Third test", "input": "", "expected": "" }
  ],
  "hints": ["First hint", "Second hint", "Third hint"]
}

The challenge should be practical and test real Solana development skills for the "${category}" category.
For easy: basic concept usage. For medium: combining multiple concepts. For hard: complex real-world patterns.
The test case names should describe what pattern to check for (we use pattern matching, not execution).
Make sure starterCode has clear placeholder comments and solution is complete working code.${exclusion}`;
}

function isTitleDuplicate(title: string, existingTitles: string[]): boolean {
  const normalized = title.toLowerCase().trim();
  return existingTitles.some((t) => t.toLowerCase().trim() === normalized);
}

async function callLyzrApi(
  apiKey: string,
  brtDate: string,
  difficulty: PracticeDifficulty,
  category: PracticeCategory,
  excludeTitles: string[],
  attempt: number,
): Promise<GeneratedChallenge | null> {
  const sid = `daily-${brtDate}-attempt${attempt}-${LYZR_AGENT_ID}`;
  const message = buildPrompt(difficulty, category, excludeTitles);

  const res = await fetch(LYZR_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify({
      user_id: "daily-challenge@superteam.academy",
      agent_id: LYZR_AGENT_ID,
      session_id: sid,
      message,
    }),
  });

  if (!res.ok) {
    console.warn("[generate-challenge] Lyzr API error:", res.status);
    return null;
  }

  const data = await res.json();
  let raw =
    typeof data.response === "string"
      ? data.response
      : JSON.stringify(data.response);

  raw = raw
    .replace(/^```[\w]*\n?/gm, "")
    .replace(/\n?```$/gm, "")
    .replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, "")
    .trim();

  const parsed = JSON.parse(raw);

  if (
    !parsed.title ||
    !parsed.starterCode ||
    !parsed.solution ||
    !Array.isArray(parsed.testCases)
  ) {
    console.warn("[generate-challenge] Invalid JSON structure from Lyzr");
    return null;
  }

  const xpReward = XP_BY_DIFFICULTY[difficulty];
  return {
    title: parsed.title,
    description: parsed.description || "",
    difficulty,
    category,
    language: parsed.language === "rust" ? "rust" : "typescript",
    xpReward,
    starterCode: parsed.starterCode,
    solution: parsed.solution,
    testCases: (parsed.testCases as any[]).map((tc: any, i: number) => ({
      id: tc.id || `t${i + 1}`,
      name: tc.name || `Test ${i + 1}`,
      input: tc.input || "",
      expected: tc.expected || tc.expectedOutput || "",
    })),
    hints: Array.isArray(parsed.hints) ? parsed.hints : [],
  };
}

const MAX_AI_RETRIES = 5;

export async function generateDailyChallenge(
  brtDate: string,
  pastDailyTitles: string[] = [],
): Promise<GeneratedChallenge> {
  const dayIndex = getDayIndex(brtDate);
  const difficulty = DIFFICULTIES[dayIndex % 3];
  const category = CATEGORIES[dayIndex % 10];
  const xpReward = XP_BY_DIFFICULTY[difficulty];

  const apiKey = process.env.LYZR_API_KEY;
  if (!apiKey) {
    return getFallbackChallenge(difficulty, category, xpReward, pastDailyTitles);
  }

  // AI should avoid both past dailies and practice titles
  const practiceTitles = PRACTICE_CHALLENGES.map((c) => c.title);
  const allKnownTitles = Array.from(
    new Set([...pastDailyTitles, ...practiceTitles]),
  );
  const excludeTitles = [...allKnownTitles];

  for (let attempt = 0; attempt < MAX_AI_RETRIES; attempt++) {
    try {
      const result = await callLyzrApi(
        apiKey,
        brtDate,
        difficulty,
        category,
        excludeTitles,
        attempt,
      );

      if (!result) continue;

      if (!isTitleDuplicate(result.title, allKnownTitles)) {
        return result;
      }

      console.warn(
        `[generate-challenge] Duplicate title "${result.title}" on attempt ${attempt + 1}, retrying...`,
      );
      excludeTitles.push(result.title);
    } catch (err) {
      console.warn(
        `[generate-challenge] Lyzr attempt ${attempt + 1} failed:`,
        err,
      );
    }
  }

  console.warn(
    "[generate-challenge] All AI attempts failed or produced duplicates, using fallback",
  );
  return getFallbackChallenge(difficulty, category, xpReward, pastDailyTitles);
}

const VARIATION_PREFIXES = [
  "Advanced",
  "Optimized",
  "Refactored",
  "Production",
  "Secure",
  "Efficient",
  "Modular",
  "Scalable",
  "Robust",
  "Enhanced",
];

function makeUniqueTitle(
  baseTitle: string,
  usedSet: Set<string>,
  cycle: number,
): string {
  const prefix = VARIATION_PREFIXES[cycle % VARIATION_PREFIXES.length];
  let candidate = `${prefix}: ${baseTitle}`;
  if (!usedSet.has(candidate.toLowerCase().trim())) return candidate;

  // Append cycle number if prefix alone isn't enough
  candidate = `${baseTitle} (v${cycle + 2})`;
  while (usedSet.has(candidate.toLowerCase().trim())) {
    candidate = `${baseTitle} (v${cycle + Math.floor(Math.random() * 9999)})`;
  }
  return candidate;
}

function getFallbackChallenge(
  difficulty: PracticeDifficulty,
  category: PracticeCategory,
  xpReward: number,
  pastDailyTitles: string[] = [],
): GeneratedChallenge {
  const usedSet = new Set(pastDailyTitles.map((t) => t.toLowerCase().trim()));
  const excludeUsed = (challenges: typeof PRACTICE_CHALLENGES) =>
    challenges.filter((c) => !usedSet.has(c.title.toLowerCase().trim()));

  // Try to find an unused challenge matching difficulty + category
  let pool = excludeUsed(
    PRACTICE_CHALLENGES.filter(
      (c) => c.difficulty === difficulty && c.category === category,
    ),
  );
  if (pool.length === 0) {
    pool = excludeUsed(
      PRACTICE_CHALLENGES.filter((c) => c.difficulty === difficulty),
    );
  }
  if (pool.length === 0) {
    pool = excludeUsed(PRACTICE_CHALLENGES);
  }

  if (pool.length > 0) {
    const dayCount = pastDailyTitles.length;
    const pick = pool[dayCount % pool.length];
    return {
      title: pick.title,
      description: pick.description,
      difficulty,
      category,
      language: pick.language,
      xpReward,
      starterCode: pick.challenge.starterCode,
      solution: pick.challenge.solution,
      testCases: pick.challenge.testCases.map((tc) => ({
        id: tc.id,
        name: tc.name,
        input: tc.input,
        expected: tc.expectedOutput,
      })),
      hints: pick.challenge.hints,
    };
  }

  // All 75 practice challenges exhausted — create a unique variation
  const cycle = Math.floor(pastDailyTitles.length / PRACTICE_CHALLENGES.length);
  const baseIdx = pastDailyTitles.length % PRACTICE_CHALLENGES.length;
  const base = PRACTICE_CHALLENGES[baseIdx];
  const uniqueTitle = makeUniqueTitle(base.title, usedSet, cycle);

  return {
    title: uniqueTitle,
    description: base.description,
    difficulty,
    category,
    language: base.language,
    xpReward,
    starterCode: base.challenge.starterCode,
    solution: base.challenge.solution,
    testCases: base.challenge.testCases.map((tc) => ({
      id: tc.id,
      name: tc.name,
      input: tc.input,
      expected: tc.expectedOutput,
    })),
    hints: base.challenge.hints,
  };
}
