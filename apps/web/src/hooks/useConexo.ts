import { useState, useEffect, useCallback } from "react";
import { CATEGORIES, getTermsByCategory, GlossaryTerm } from "@/lib/glossary";

export interface ConexoGroup {
  category: string;
  terms: GlossaryTerm[];
  color: string; // Tailwind color class like 'bg-green-500'
}

export interface ConexoTile {
  id: string; // Use term ID as distinct identifier
  term: string;
  categoryId: string;
}

const COLORS = [
  "bg-emerald-500", // Green
  "bg-amber-500", // Yellow
  "bg-blue-500", // Blue
  "bg-purple-500", // Purple
];

// Simple seeded PRNG to ensure daily puzzles are identical for everyone
function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function useConexo(seedVal: string = new Date().toDateString()) {
  const [targetGroups, setTargetGroups] = useState<ConexoGroup[]>([]);
  const [boardTiles, setBoardTiles] = useState<ConexoTile[]>([]);
  const [solvedGroups, setSolvedGroups] = useState<ConexoGroup[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [mistakesRemaining, setMistakesRemaining] = useState(4);
  const [status, setStatus] = useState<"playing" | "won" | "lost">("playing");
  const [isShaking, setIsShaking] = useState(false);

  useEffect(() => {
    // Generate the specific daily puzzle
    let seedNum = 0;
    for (let i = 0; i < seedVal.length; i++) {
      seedNum += seedVal.charCodeAt(i) * Math.pow(10, i % 3);
    }
    const rand = mulberry32(seedNum);

    // 1. Pick 4 random categories
    const shuffledCats = [...CATEGORIES].sort(() => rand() - 0.5);
    const chosenCategories = shuffledCats.slice(0, 4);

    // 2. Pick 4 random terms from each
    const newGroups: ConexoGroup[] = [];
    const initialTiles: ConexoTile[] = [];

    chosenCategories.forEach((cat, index) => {
      const allTermsInCat = getTermsByCategory(cat, "pt-BR").filter(
        (t) => t.term.length <= 25
      ); // avoid super long terms
      const shuffledTerms = allTermsInCat.sort(() => rand() - 0.5);
      const chosenTerms = shuffledTerms.slice(0, 4);

      newGroups.push({
        category: cat,
        terms: chosenTerms,
        color: (COLORS[index] || COLORS[0])!,
      });

      chosenTerms.forEach((t) => {
        initialTiles.push({
          id: t.id,
          term: t.term,
          categoryId: cat,
        });
      });
    });

    setTargetGroups(newGroups);
    setBoardTiles(initialTiles.sort(() => rand() - 0.5));
    setSolvedGroups([]);
    setSelectedIds([]);
    setMistakesRemaining(4);
    setStatus("playing");
  }, [seedVal]);

  const toggleSelection = (id: string) => {
    if (status !== "playing") return;
    if (selectedIds.includes(id)) {
      setSelectedIds((prev) => prev.filter((x) => x !== id));
    } else {
      if (selectedIds.length < 4) {
        setSelectedIds((prev) => [...prev, id]);
      }
    }
  };

  const submitGuess = useCallback(() => {
    if (selectedIds.length !== 4 || status !== "playing") return;

    // Check if they all share the same categoryId
    const firstCat = boardTiles.find(
      (t) => t.id === selectedIds[0]
    )?.categoryId;
    const isCorrect = selectedIds.every(
      (id) => boardTiles.find((t) => t.id === id)?.categoryId === firstCat
    );

    if (isCorrect && firstCat) {
      // Find the group definition
      const matchedGroup = targetGroups.find((g) => g.category === firstCat);
      if (matchedGroup) {
        setSolvedGroups((prev) => [...prev, matchedGroup]);
        setBoardTiles((prev) =>
          prev.filter((t) => !selectedIds.includes(t.id))
        );
        setSelectedIds([]);
        if (solvedGroups.length + 1 === 4) {
          setStatus("won");
        }
      }
    } else {
      // Wrong guess
      setMistakesRemaining((prev) => Math.max(0, prev - 1));
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 600); // 600ms match CSS animation

      if (mistakesRemaining - 1 === 0) {
        setStatus("lost");
        // Instantly solve everything to show the user the groups
        setSolvedGroups(targetGroups);
        setBoardTiles([]);
        setSelectedIds([]);
      }
    }
  }, [
    selectedIds,
    status,
    boardTiles,
    targetGroups,
    solvedGroups.length,
    mistakesRemaining,
  ]);

  const shuffleTiles = () => {
    setBoardTiles((prev) => {
      const copy = [...prev];
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = copy[i]!;
        copy[i] = copy[j]!;
        copy[j] = temp;
      }
      return copy;
    });
  };

  return {
    boardTiles,
    solvedGroups,
    selectedIds,
    mistakesRemaining,
    status,
    isShaking,
    toggleSelection,
    submitGuess,
    shuffleTiles,
  };
}
