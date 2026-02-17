import type { PracticeCategory, PracticeDifficulty } from "@/types/practice";
import { PRACTICE_CHALLENGES } from "@/lib/data/practice-challenges";

const LYZR_API_URL = "https://agent-prod.studio.lyzr.ai/v3/inference/chat/";
const LYZR_AGENT_ID = "6990319188c3964deca09041";

const CATEGORIES: PracticeCategory[] = [
  "accounts", "transactions", "pdas", "tokens", "cpi",
  "serialization", "security", "anchor", "defi", "advanced",
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

function buildPrompt(difficulty: PracticeDifficulty, category: PracticeCategory): string {
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
Make sure starterCode has clear placeholder comments and solution is complete working code.`;
}

export async function generateDailyChallenge(brtDate: string): Promise<GeneratedChallenge> {
  const dayIndex = getDayIndex(brtDate);
  const difficulty = DIFFICULTIES[dayIndex % 3];
  const category = CATEGORIES[dayIndex % 10];
  const xpReward = XP_BY_DIFFICULTY[difficulty];

  const apiKey = process.env.LYZR_API_KEY;
  if (!apiKey) {
    return getFallbackChallenge(difficulty, category, xpReward);
  }

  try {
    const message = buildPrompt(difficulty, category);
    const sid = `daily-${brtDate}-${LYZR_AGENT_ID}`;

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
      return getFallbackChallenge(difficulty, category, xpReward);
    }

    const data = await res.json();
    let raw = typeof data.response === "string" ? data.response : JSON.stringify(data.response);

    // Strip markdown code fences
    raw = raw.replace(/^```[\w]*\n?/gm, "").replace(/\n?```$/gm, "").trim();

    const parsed = JSON.parse(raw);

    // Validate required fields
    if (!parsed.title || !parsed.starterCode || !parsed.solution || !Array.isArray(parsed.testCases)) {
      console.warn("[generate-challenge] Invalid JSON structure from Lyzr");
      return getFallbackChallenge(difficulty, category, xpReward);
    }

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
  } catch (err) {
    console.warn("[generate-challenge] Failed to generate via Lyzr:", err);
    return getFallbackChallenge(difficulty, category, xpReward);
  }
}

function getFallbackChallenge(
  difficulty: PracticeDifficulty,
  category: PracticeCategory,
  xpReward: number
): GeneratedChallenge {
  // Find a matching challenge from the pool
  let pool = PRACTICE_CHALLENGES.filter(
    (c) => c.difficulty === difficulty && c.category === category
  );
  if (pool.length === 0) {
    pool = PRACTICE_CHALLENGES.filter((c) => c.difficulty === difficulty);
  }
  if (pool.length === 0) {
    pool = PRACTICE_CHALLENGES;
  }

  const pick = pool[Math.floor(Math.random() * pool.length)];

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
