import { useState, useEffect, useCallback } from "react";
import { allTerms, GlossaryTerm } from "@/lib/glossary";

function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Basic Portuguese & Crypto stop words
const STOP_WORDS = new Set([
  "a",
  "o",
  "e",
  "do",
  "da",
  "de",
  "em",
  "para",
  "com",
  "um",
  "uma",
  "os",
  "as",
  "is",
  "the",
  "of",
  "in",
  "and",
  "to",
  "for",
  "on",
  "with",
  "by",
]);

function tokenize(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
}

function calculateSimilarity(t1: GlossaryTerm, t2: GlossaryTerm) {
  let score = 0;

  if (t1.category === t2.category) score += 50;

  const t1Def = t1.definition.toLowerCase();
  const t2Def = t2.definition.toLowerCase();

  if (
    t1Def.includes(t2.term.toLowerCase()) ||
    t2Def.includes(t1.term.toLowerCase())
  ) {
    score += 100;
  }

  // Jaccard similarity approximation on definitions
  const words1 = new Set(tokenize(t1.definition));
  const words2 = new Set(tokenize(t2.definition));
  let intersection = 0;
  words1.forEach((w) => {
    if (words2.has(w)) intersection++;
  });

  score += intersection * 5;

  return score;
}

export interface GuessRecord {
  term: GlossaryTerm;
  rank: number;
  similarity: number; // 0 to 1 scaling equivalent for UI color mapping (0% to 100%)
}

export function useContexto(seedVal: string = new Date().toDateString()) {
  const [targetTerm, setTargetTerm] = useState<GlossaryTerm | null>(null);
  const [guesses, setGuesses] = useState<GuessRecord[]>([]);
  const [currentGuess, setCurrentGuess] = useState("");
  const [status, setStatus] = useState<"playing" | "won">("playing");
  const [rankingMap, setRankingMap] = useState<
    Map<string, { rank: number; simScaled: number }>
  >(new Map());
  const [isInvalid, setIsInvalid] = useState(false);

  useEffect(() => {
    let seedNum = 0;
    for (let i = 0; i < seedVal.length; i++) {
      seedNum += seedVal.charCodeAt(i) * Math.pow(10, i % 3);
    }
    const rand = mulberry32(seedNum);

    const validTerms = allTerms.filter((t) => /^[a-zA-Z0-9\s]+$/.test(t.term));
    const shuffled = [...validTerms].sort(() => rand() - 0.5);
    const chosen = shuffled[0];
    if (!chosen) return;

    // Precompute similarities for ALL terms against the chosen one
    const scored = validTerms.map((t) => {
      if (t.id === chosen.id) return { term: t, score: 999999 };
      return { term: t, score: calculateSimilarity(chosen, t) };
    });

    // Sort descending by score
    scored.sort((a, b) => b.score - a.score);

    // Build the map
    const newMap = new Map();
    // Rank 1 is the target. Rank 2 is closest.
    scored.forEach((item, index) => {
      // Rank 1 is the target. Rank 2 is closest.
      const rank = index + 1;
      let simScaled = 100;
      if (rank > 1 && chosen) {
        // Calculate a percentage based on position, to mimic the original Contexto
        // Original Contexto: Rank 1 = 100%, last rank = 0%
        simScaled = Math.max(0, 100 - ((rank - 1) / scored.length) * 100);
      }
      newMap.set(item.term.term.toLowerCase(), { rank, simScaled });
      // Also map by ID just in case
      newMap.set(item.term.id.toLowerCase(), { rank, simScaled });
    });

    setTargetTerm(chosen);
    setRankingMap(newMap);
    setGuesses([]);
    setCurrentGuess("");
    setStatus("playing");
  }, [seedVal]);

  const submitGuess = useCallback(() => {
    if (status !== "playing" || !targetTerm) return;

    const termToMatch = currentGuess.toLowerCase().trim();
    if (!termToMatch) return;

    // Is it a valid glossary term?
    const validMatch = allTerms.find(
      (t) =>
        t.term.toLowerCase() === termToMatch ||
        t.id.toLowerCase() === termToMatch
    );

    if (!validMatch) {
      setIsInvalid(true);
      setTimeout(() => setIsInvalid(false), 500);
      return;
    }

    // Already guessed?
    if (guesses.some((g) => g.term.id === validMatch.id)) {
      setCurrentGuess("");
      return;
    }

    const rankInfo =
      rankingMap.get(validMatch.term.toLowerCase()) ||
      rankingMap.get(validMatch.id.toLowerCase());
    if (rankInfo) {
      const newGuess: GuessRecord = {
        term: validMatch,
        rank: rankInfo.rank,
        similarity: rankInfo.simScaled,
      };

      setGuesses((prev) => [newGuess, ...prev].sort((a, b) => a.rank - b.rank));
      setCurrentGuess("");

      if (rankInfo.rank === 1) {
        setStatus("won");
      }
    }
  }, [currentGuess, status, targetTerm, guesses, rankingMap]);

  return {
    targetTerm,
    guesses,
    currentGuess,
    setCurrentGuess,
    submitGuess,
    status,
    isInvalid,
    totalTerms: rankingMap.size / 2, // because we map term and ID
  };
}
