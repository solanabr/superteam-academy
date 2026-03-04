"use client";

import { useState } from "react";
import { emitChallengeResult } from "@/lib/challenge-sync";
import { Button } from "@/components/ui/button";

type Props = {
  lessonId: string;
  question: string;
  options: string[];
  correctOptionIndex: number;
};

export function LessonExamCard({ lessonId, question, options, correctOptionIndex }: Props) {
  const [selected, setSelected] = useState<number | null>(null);
  const [passed, setPassed] = useState(false);
  const [feedback, setFeedback] = useState("");

  const submit = () => {
    if (selected === null) {
      setFeedback("Select an answer first.");
      return;
    }
    const isPass = selected === correctOptionIndex;
    setPassed(isPass);
    setFeedback(isPass ? "Passed. You can now mark this lesson complete." : "Not quite. Try again.");
    emitChallengeResult({ lessonId, passed: isPass });
  };

  return (
    <div className="mt-8 rounded-[24px] border border-white/10 bg-surface p-6">
      <p className="text-[12px] uppercase tracking-[0.12em] text-white/50 font-semibold">Lesson Exam</p>
      <h3 className="mt-2 text-[18px] font-semibold text-white">{question}</h3>
      <div className="mt-4 space-y-2">
        {options.map((option, index) => (
          <button
            key={option}
            onClick={() => setSelected(index)}
            className={`w-full rounded-[12px] border px-4 py-3 text-left text-[14px] transition-colors ${
              selected === index
                ? "border-white/40 bg-white/10 text-white"
                : "border-white/10 bg-background text-white/80 hover:bg-white/5"
            }`}
          >
            {option}
          </button>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-3">
        <Button variant="default" size="sm" onClick={submit} disabled={passed}>
          {passed ? "Passed" : "Submit Exam"}
        </Button>
        <p className={`text-[13px] ${passed ? "text-[#4caf50]" : "text-white/60"}`}>{feedback}</p>
      </div>
    </div>
  );
}
