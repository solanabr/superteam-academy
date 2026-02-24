"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Check,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Lightbulb,
} from "lucide-react";
import { parseQuizContent } from "@/lib/utils/quiz-parser";
import { V9ContentRenderer } from "./content-renderer";

export function QuizRenderer({
  content,
  xpReward,
  onComplete,
}: {
  content: string;
  xpReward: number;
  onComplete: () => void;
}) {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  const { intro, questions } = useMemo(
    () => parseQuizContent(content),
    [content],
  );

  const handleSelect = (questionId: number, option: string) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [questionId]: option }));
  };

  const handleSubmit = () => {
    if (submitted) return;
    let correct = 0;
    for (const q of questions) {
      if (answers[q.id] === q.correctAnswer) correct++;
    }
    setScore(correct);
    setSubmitted(true);
    if (correct >= questions.length * 0.6) {
      onComplete();
    }
  };

  const handleRetry = () => {
    setAnswers({});
    setSubmitted(false);
    setScore(0);
  };

  const allAnswered =
    questions.length > 0 && questions.every((q) => answers[q.id]);
  const passed = submitted && score >= questions.length * 0.6;

  if (questions.length === 0) {
    return <V9ContentRenderer text={content} />;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
      {intro && (
        <p
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "clamp(17px, 1.8vw, 20px)",
            lineHeight: 1.75,
            color: "var(--c-text-body)",
            fontWeight: 300,
            fontStyle: "italic",
          }}
        >
          {intro}
        </p>
      )}

      {questions.map((q, qi) => {
        const selected = answers[q.id];
        const isCorrect = submitted && selected === q.correctAnswer;
        const isWrong = submitted && selected && selected !== q.correctAnswer;

        return (
          <motion.div
            key={q.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: qi * 0.05 }}
            style={{
              padding: "24px",
              borderLeft: `3px solid ${
                submitted
                  ? isCorrect
                    ? "var(--xp)"
                    : isWrong
                      ? "#EF4444"
                      : "var(--c-text-muted)"
                  : "rgba(255,255,255,0.1)"
              }`,
              background: submitted
                ? isCorrect
                  ? "rgba(20,241,149,0.05)"
                  : isWrong
                    ? "rgba(239,68,68,0.05)"
                    : "transparent"
                : "rgba(255,255,255,0.02)",
            }}
          >
            <p
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "16px",
                fontWeight: 500,
                color: "var(--foreground)",
                marginBottom: "16px",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  color: "var(--nd-highlight-orange)",
                  marginRight: "8px",
                }}
              >
                {q.id}.
              </span>
              {q.question}
            </p>

            <div
              style={{ display: "flex", flexDirection: "column", gap: "8px" }}
            >
              {q.options.map((opt) => {
                const isSelected = selected === opt.label;
                const isThisCorrect =
                  submitted && opt.label === q.correctAnswer;
                const isThisWrong =
                  submitted && isSelected && opt.label !== q.correctAnswer;

                return (
                  <button
                    key={opt.label}
                    onClick={() => handleSelect(q.id, opt.label)}
                    disabled={submitted}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "12px 16px",
                      textAlign: "left",
                      fontFamily: "var(--font-sans)",
                      fontSize: "14px",
                      border: `1px solid ${
                        submitted
                          ? isThisCorrect
                            ? "var(--xp)"
                            : isThisWrong
                              ? "#EF4444"
                              : "var(--c-border-subtle)"
                          : isSelected
                            ? "var(--nd-highlight-orange)"
                            : "var(--c-border-subtle)"
                      }`,
                      background: submitted
                        ? isThisCorrect
                          ? "rgba(20,241,149,0.08)"
                          : isThisWrong
                            ? "rgba(239,68,68,0.08)"
                            : "transparent"
                        : isSelected
                          ? "rgba(255,92,40,0.05)"
                          : "transparent",
                      color: "var(--foreground)",
                      cursor: submitted ? "default" : "pointer",
                      transition: "all 0.2s",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "11px",
                        opacity: 0.5,
                      }}
                    >
                      {opt.label})
                    </span>
                    <span style={{ flex: 1 }}>{opt.text}</span>
                    {submitted && isThisCorrect && (
                      <CheckCircle2
                        style={{
                          width: 16,
                          height: 16,
                          color: "var(--xp)",
                        }}
                      />
                    )}
                    {submitted && isThisWrong && (
                      <XCircle
                        style={{ width: 16, height: 16, color: "#EF4444" }}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {submitted && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                transition={{ delay: 0.2 }}
                style={{
                  marginTop: "12px",
                  paddingTop: "12px",
                  borderTop: "1px solid rgba(255,255,255,0.06)",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "8px",
                }}
              >
                <Lightbulb
                  style={{
                    width: 14,
                    height: 14,
                    color: "#F59E0B",
                    marginTop: 2,
                    flexShrink: 0,
                  }}
                />
                <p
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: "13px",
                    color: "var(--c-text-2)",
                    lineHeight: 1.5,
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontWeight: 700,
                      color: "#F59E0B",
                    }}
                  >
                    {q.correctAnswer})
                  </span>{" "}
                  {q.explanation}
                </p>
              </motion.div>
            )}
          </motion.div>
        );
      })}

      <div
        style={{
          paddingTop: "16px",
          borderTop: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {submitted ? (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "16px" }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              style={{
                padding: "24px",
                textAlign: "center",
                borderLeft: `3px solid ${passed ? "var(--xp)" : "#EF4444"}`,
                background: passed
                  ? "rgba(20,241,149,0.05)"
                  : "rgba(239,68,68,0.05)",
              }}
            >
              <p
                style={{
                  fontFamily: "var(--font-brand)",
                  fontSize: "32px",
                  fontWeight: 300,
                  color: "var(--foreground)",
                  marginBottom: "4px",
                }}
              >
                {score}/{questions.length}
              </p>
              <p
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "11px",
                  letterSpacing: "0.1em",
                  color: passed ? "var(--xp)" : "#EF4444",
                }}
              >
                {passed
                  ? `Great job! +${Math.round((score / questions.length) * xpReward)} XP`
                  : `Need ${Math.ceil(questions.length * 0.6)}/${questions.length} to pass. Try again!`}
              </p>
            </motion.div>

            {!passed && (
              <button
                onClick={handleRetry}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  fontFamily: "var(--font-mono)",
                  fontSize: "11px",
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  padding: "14px 36px",
                  background: "none",
                  color: "var(--c-text-muted)",
                  border: "1px solid var(--c-border-subtle)",
                  cursor: "pointer",
                }}
              >
                <RotateCcw style={{ width: 14, height: 14 }} />
                Retry Quiz
              </button>
            )}
          </div>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={!allAnswered}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              opacity: allAnswered ? 1 : 0.4,
              cursor: allAnswered ? "pointer" : "not-allowed",
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              padding: "14px 36px",
              border: "none",
              background: "var(--foreground)",
              color: "var(--background)",
            }}
          >
            <Check style={{ width: 14, height: 14 }} />
            Submit Quiz
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
                letterSpacing: "0.1em",
                color: "var(--nd-highlight-orange)",
                marginLeft: "8px",
              }}
            >
              +{xpReward} XP
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
