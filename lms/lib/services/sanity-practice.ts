import { createClient } from "next-sanity";
import type { PracticeChallenge } from "@/types/practice";

const sanityClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2024-01-01",
  useCdn: true,
});

/* eslint-disable @typescript-eslint/no-explicit-any */
function mapChallenge(raw: any): PracticeChallenge {
  return {
    id: raw.slug?.current ?? raw._id,
    title: raw.title,
    description: raw.description ?? "",
    difficulty: raw.difficulty ?? "easy",
    category: raw.category ?? "accounts",
    language: raw.language ?? "typescript",
    xpReward: raw.xpReward ?? 10,
    tags: raw.tags ?? [],
    challenge: {
      language: raw.language ?? "typescript",
      prompt: raw.prompt ?? "",
      starterCode: raw.starterCode ?? "",
      solution: raw.solution ?? "",
      testCases: (raw.testCases ?? []).map((t: any) => ({
        id: t._key,
        name: t.name,
        input: t.input ?? "",
        expectedOutput: t.expectedOutput ?? "",
      })),
      hints: raw.hints ?? [],
    },
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export async function fetchSanityPracticeChallenges(): Promise<PracticeChallenge[]> {
  try {
    if (!process.env.NEXT_PUBLIC_SANITY_PROJECT_ID) return [];

    const raw = await sanityClient.fetch(
      `*[_type == "practiceChallenge" && isActive == true] | order(category asc, difficulty asc) {
        _id,
        title,
        slug,
        description,
        difficulty,
        category,
        language,
        xpReward,
        tags,
        prompt,
        starterCode,
        solution,
        testCases[] { _key, name, input, expectedOutput },
        hints
      }`
    );

    if (!raw || raw.length === 0) return [];
    return raw.map(mapChallenge);
  } catch {
    return [];
  }
}
