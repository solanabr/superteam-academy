"use client";

import { useState, useCallback } from "react";

type VoteValue = 1 | -1 | null;

interface UseVoteOptions {
  targetType: "thread" | "answer";
  targetId: string;
  initialScore: number;
  initialUserVote: VoteValue;
}

interface UseVoteReturn {
  score: number;
  userVote: VoteValue;
  isVoting: boolean;
  handleVote: (value: 0 | 1 | -1) => void;
}

/**
 * Encapsulates optimistic three-state vote logic and API call.
 *
 * Three-state: upvote (1) / downvote (-1) / neutral (0, removes existing vote).
 * Toggling: clicking the same arrow again sends 0 (un-vote).
 */
export function useVote({
  targetType,
  targetId,
  initialScore,
  initialUserVote,
}: UseVoteOptions): UseVoteReturn {
  const [score, setScore] = useState(initialScore);
  const [userVote, setUserVote] = useState<VoteValue>(initialUserVote);
  const [isVoting, setIsVoting] = useState(false);

  const handleVote = useCallback(
    async (value: 0 | 1 | -1) => {
      if (isVoting) return;

      // Snapshot for rollback
      const prevScore = score;
      const prevVote = userVote;

      // Optimistic update
      const newVote: VoteValue = value === 0 ? null : value;
      const delta = (newVote ?? 0) - (prevVote ?? 0);
      setScore((s) => s + delta);
      setUserVote(newVote);
      setIsVoting(true);

      try {
        const body =
          targetType === "thread"
            ? { threadId: targetId, value }
            : { answerId: targetId, value };

        const res = await fetch("/api/community/votes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (!res.ok) throw new Error("Vote failed");
      } catch {
        // Rollback on failure
        setScore(prevScore);
        setUserVote(prevVote);
      } finally {
        setIsVoting(false);
      }
    },
    [targetType, targetId, score, userVote, isVoting]
  );

  return { score, userVote, isVoting, handleVote };
}
