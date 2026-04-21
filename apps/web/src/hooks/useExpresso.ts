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

export function useExpresso(seedVal: string = new Date().toDateString()) {
  const [questions, setQuestions] = useState<GlossaryTerm[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [status, setStatus] = useState<"playing" | "won" | "lost">("playing");
  const [currentGuess, setCurrentGuess] = useState("");
  const [lives, setLives] = useState(3);
  const [isShaking, setIsShaking] = useState(false);

  useEffect(() => {
    // Generate daily seed
    let seedNum = 0;
    for (let i = 0; i < seedVal.length; i++) {
      seedNum += seedVal.charCodeAt(i) * Math.pow(10, i % 3);
    }
    const rand = mulberry32(seedNum);

    // Filter terms that are relatively easy to read/type (no crazy characters)
    const validTerms = allTerms.filter(
      (t) => /^[a-zA-Z0-9\s]+$/.test(t.term) && t.definition.length > 20
    );

    // Pick 5 random questions
    const shuffled = validTerms.sort(() => rand() - 0.5);
    setQuestions(shuffled.slice(0, 5));
    setCurrentIndex(0);
    setLives(3);
    setStatus("playing");
    setCurrentGuess("");
  }, [seedVal]);

  const currentTerm = questions[currentIndex];

  const getMaskedDefinition = () => {
    if (!currentTerm) return "";
    const termStr = currentTerm.term;
    const aliases = currentTerm.aliases || [];

    // Build a regex to replace the term and its aliases in the definition (case-insensitive)
    const termsToReplace = [termStr, ...aliases].map((t) =>
      t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    );
    const regex = new RegExp(`\\b(${termsToReplace.join("|")})\\b`, "gi");
    return currentTerm.definition.replace(regex, "[___]");
  };

  const submitGuess = useCallback(() => {
    if (status !== "playing" || !currentTerm) return;

    if (currentGuess.trim() === "") return;

    // Check if correct (case and space insensitive)
    const normalize = (s: string) => s.toLowerCase().replace(/\s/g, "");
    const isCorrect = normalize(currentGuess) === normalize(currentTerm.term);

    if (isCorrect) {
      if (currentIndex === questions.length - 1) {
        setStatus("won");
      } else {
        setCurrentIndex((prev) => prev + 1);
        setCurrentGuess("");
      }
    } else {
      setLives((prev) => {
        const nextLives = prev - 1;
        if (nextLives <= 0) {
          setStatus("lost");
        }
        return nextLives;
      });
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 600);
      setCurrentGuess("");
    }
  }, [currentGuess, currentTerm, currentIndex, questions.length, status]);

  return {
    questions,
    currentIndex,
    currentTerm,
    maskedDefinition: getMaskedDefinition(),
    currentGuess,
    setCurrentGuess,
    submitGuess,
    status,
    lives,
    isShaking,
  };
}
