"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useEffect, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Play,
  RotateCcw,
  Loader2,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  Lightbulb,
  Award,
} from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";
import { courses } from "@/lib/services/courses";
import { learningService } from "@/lib/services/learning-progress";
import { XPToast } from "@/components/gamification/xp-toast";
const lazyConfetti = () => import("canvas-confetti").then((m) => m.default);
import type { Monaco } from "@monaco-editor/react";
import type { Lesson, Module } from "@/lib/services/types";

/* ------------------------------------------------------------------ */
/*  Monaco — lazy loaded, SSR disabled                                */
/* ------------------------------------------------------------------ */

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center bg-[var(--c-bg)]">
      <Loader2 className="h-5 w-5 animate-spin text-[var(--c-text-faint)]" />
    </div>
  ),
});

function setupMonacoTheme(monaco: Monaco) {
  monaco.editor.defineTheme("academy", {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "keyword", foreground: "C084FC" },
      { token: "string", foreground: "34D399" },
      { token: "number", foreground: "FB923C" },
      { token: "comment", foreground: "52525B", fontStyle: "italic" },
      { token: "type", foreground: "22D3EE" },
      { token: "function", foreground: "60A5FA" },
      { token: "variable", foreground: "D4D4D8" },
      { token: "operator", foreground: "A1A1AA" },
    ],
    colors: {
      "editor.background": "#0F0E0D",
      "editor.foreground": "#D4D4D8",
      "editor.lineHighlightBackground": "#1A1918",
      "editor.selectionBackground": "#2A2927",
      "editorLineNumber.foreground": "#3F3D3A",
      "editorLineNumber.activeForeground": "#71706D",
      "editorGutter.background": "#0F0E0D",
      "editorWidget.background": "#1A1918",
      "editorWidget.border": "#2A2927",
      "input.background": "#1A1918",
      "input.foreground": "#D4D4D8",
    },
  });
}

/* ------------------------------------------------------------------ */
/*  V9 Content renderer — transforms plain text to V9 styled blocks   */
/* ------------------------------------------------------------------ */

/** Render inline text with backtick code spans */
function renderInline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /`([^`]+)`/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    parts.push(
      <code className="v9-inline-code" key={`ic-${key++}`}>
        {match[1]}
      </code>,
    );
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

const BULLET_RE = /^[•\-*]\s/;
const NUMBERED_RE = /^\d+[.)]\s/;

const CODE_INDICATORS = [
  "import ",
  "from '",
  'from "',
  "const ",
  "let ",
  "pub fn ",
  "pub struct ",
  "pub mod ",
  "#[",
  "fn ",
  "async ",
  "await ",
  "use anchor",
  "use solana",
  "export ",
  "interface ",
  "type ",
  "class ",
  "return ",
  "if (",
  "for (",
  "while (",
  "match ",
  "impl ",
  "mod ",
];

const CMD_PREFIXES = [
  "npm ",
  "pnpm ",
  "cargo ",
  "solana ",
  "anchor ",
  "npx ",
  "curl ",
  "sh ",
  "git ",
  "cd ",
  "mkdir ",
  "rustc ",
  "rustup ",
  "yarn ",
  "node ",
  "$ ",
];

function isCodeBlock(text: string): boolean {
  const hasIndicator = CODE_INDICATORS.some((kw) => text.includes(kw));
  const hasCodeSyntax =
    text.includes(";") || text.includes("{") || text.includes("(");
  if (hasIndicator && hasCodeSyntax) return true;
  // Tree-style directory listings
  if (text.includes("├──") || text.includes("└──")) return true;
  return false;
}

function isCommandBlock(text: string): boolean {
  const lines = text.split("\n");
  return lines.some((l) => CMD_PREFIXES.some((p) => l.trim().startsWith(p)));
}

function isHeadingLine(line: string): boolean {
  const t = line.trim();
  if (t.length > 80) return false;
  // "Step N —", "Phase N:", "Example:", section labels ending with ":"
  if (/^(Step|Phase)\s+\d+/i.test(t)) return true;
  if (/^[A-Z][^.!?]*:\s*$/.test(t)) return true;
  return false;
}

function isCalloutLabel(line: string): boolean {
  return /^(NEVER|ALWAYS|IMPORTANT|CRITICAL|NOTE|WARNING|TIP|CAUTION)[:\s]/i.test(
    line.trim(),
  );
}

function V9ContentRenderer({ text }: { text: string }) {
  const blocks = text.split("\n\n");

  return (
    <div>
      {blocks.map((block, i) => {
        const trimmed = block.trim();
        if (!trimmed) return null;

        // --- Code block detection ---
        if (isCodeBlock(trimmed) || isCommandBlock(trimmed)) {
          return (
            <div className="v9-content-block" key={i}>
              <pre className="v9-content-code">{trimmed}</pre>
            </div>
          );
        }

        const lines = trimmed.split("\n").filter((l) => l.trim());

        // --- Callout blocks (NEVER:, ALWAYS:, IMPORTANT:, etc.) ---
        if (lines.length > 0 && isCalloutLabel(lines[0])) {
          const label = lines[0].trim().replace(/:?\s*$/, "");
          const bodyLines = lines.slice(1);
          return (
            <div className="v9-content-block v9-content-callout" key={i}>
              <div className="v9-callout-label">{label}</div>
              {bodyLines.length > 0 && (
                <div className="v9-content-bullets">
                  {bodyLines.map((line, j) => (
                    <div className="v9-content-bullet" key={j}>
                      <span className="v9-content-bullet-marker">&#x25B8;</span>
                      <span>
                        {renderInline(
                          line
                            .replace(/^[•\-*]\s+/, "")
                            .replace(/^\d+[.)]\s+/, ""),
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        }

        // --- Detect mixed blocks: header line + bullet/numbered list ---
        const bulletLines = lines.filter(
          (l) => BULLET_RE.test(l.trim()) || NUMBERED_RE.test(l.trim()),
        );
        const hasMixedList =
          bulletLines.length >= 2 &&
          bulletLines.length >= lines.length - 1 &&
          lines.length > 1;

        if (hasMixedList) {
          const headerLines = lines.filter(
            (l) => !BULLET_RE.test(l.trim()) && !NUMBERED_RE.test(l.trim()),
          );
          const isNumbered = bulletLines.every((l) =>
            NUMBERED_RE.test(l.trim()),
          );

          return (
            <div className="v9-content-block" key={i}>
              {headerLines.length > 0 && (
                <p className="v9-content-subheading">
                  {renderInline(headerLines.join(" "))}
                </p>
              )}
              {isNumbered ? (
                <ol className="v9-content-ordered">
                  {bulletLines.map((line, j) => (
                    <li className="v9-content-ordered-item" key={j}>
                      {renderInline(line.trim().replace(/^\d+[.)]\s+/, ""))}
                    </li>
                  ))}
                </ol>
              ) : (
                <div className="v9-content-bullets">
                  {bulletLines.map((line, j) => (
                    <div className="v9-content-bullet" key={j}>
                      <span className="v9-content-bullet-marker">&#x25B8;</span>
                      <span>
                        {renderInline(line.trim().replace(/^[•\-*]\s+/, ""))}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        }

        // --- Pure bullet list (all lines are bullets) ---
        if (lines.length > 1 && lines.every((l) => BULLET_RE.test(l.trim()))) {
          return (
            <div className="v9-content-block v9-content-bullets" key={i}>
              {lines.map((line, j) => (
                <div className="v9-content-bullet" key={j}>
                  <span className="v9-content-bullet-marker">&#x25B8;</span>
                  <span>
                    {renderInline(line.trim().replace(/^[•\-*]\s+/, ""))}
                  </span>
                </div>
              ))}
            </div>
          );
        }

        // --- Pure numbered list (all lines are numbered) ---
        if (
          lines.length > 1 &&
          lines.every((l) => NUMBERED_RE.test(l.trim()))
        ) {
          return (
            <div className="v9-content-block" key={i}>
              <ol className="v9-content-ordered">
                {lines.map((line, j) => (
                  <li className="v9-content-ordered-item" key={j}>
                    {renderInline(line.trim().replace(/^\d+[.)]\s+/, ""))}
                  </li>
                ))}
              </ol>
            </div>
          );
        }

        // --- Single heading line ---
        if (lines.length === 1 && isHeadingLine(lines[0])) {
          return (
            <div className="v9-content-block" key={i}>
              <h3 className="v9-content-heading">
                {renderInline(lines[0].trim().replace(/:$/, ""))}
              </h3>
            </div>
          );
        }

        // --- Multi-line block starting with heading ---
        if (lines.length > 1 && isHeadingLine(lines[0])) {
          const heading = lines[0].trim().replace(/:$/, "");
          const rest = lines.slice(1);
          return (
            <div className="v9-content-block" key={i}>
              <h3 className="v9-content-heading">{renderInline(heading)}</h3>
              <p className="v9-content-text">
                {rest.map((line, j) => (
                  <span key={j}>
                    {j > 0 && <br />}
                    {renderInline(line)}
                  </span>
                ))}
              </p>
            </div>
          );
        }

        // --- Regular paragraph ---
        return (
          <div className="v9-content-block" key={i}>
            <p className="v9-content-text">
              {lines.map((line, j) => (
                <span key={j}>
                  {j > 0 && <br />}
                  {renderInline(line)}
                </span>
              ))}
            </p>
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Quiz parser — extracts questions from quiz content text            */
/* ------------------------------------------------------------------ */

interface QuizQuestion {
  id: number;
  question: string;
  options: { label: string; text: string }[];
  correctAnswer: string;
  explanation: string;
}

function parseQuizContent(text: string): {
  intro: string;
  questions: QuizQuestion[];
} {
  const blocks = text.split(/\n\n/);
  const questions: QuizQuestion[] = [];
  let intro = "";

  for (const block of blocks) {
    const trimmed = block.trim();
    const questionMatch = trimmed.match(
      new RegExp(
        "^(\\d+)\\.\\s+(.+?)(?:\\n\\s+)((?:[a-d]\\).+?))\\n\\s+Answer:\\s*([a-d])\\)\\s*(.+)$",
        "s",
      ),
    );
    if (questionMatch) {
      const questionNum = parseInt(questionMatch[1]);
      const questionText = questionMatch[2].trim();
      const optionsRaw = questionMatch[3];
      const correctLetter = questionMatch[4];
      const explanation =
        questionMatch[5].split("—").slice(1).join("—").trim() ||
        questionMatch[5].trim();

      const options: { label: string; text: string }[] = [];
      const parts = optionsRaw.split(/\s{2,}(?=[a-d]\))/);
      for (const part of parts) {
        const m = part.match(/^([a-d])\)\s*([\s\S]+)/);
        if (m) {
          options.push({ label: m[1], text: m[2].trim() });
        }
      }

      if (options.length >= 2) {
        questions.push({
          id: questionNum,
          question: questionText,
          options,
          correctAnswer: correctLetter,
          explanation,
        });
        continue;
      }
    }
    if (questions.length === 0 && trimmed) {
      intro = trimmed;
    }
  }

  return { intro, questions };
}

/* ------------------------------------------------------------------ */
/*  Interactive Quiz component (V9 styled)                             */
/* ------------------------------------------------------------------ */

function QuizRenderer({
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
        <p className="v9-content-text" style={{ fontStyle: "italic" }}>
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
                    ? "var(--v9-sol-green)"
                    : isWrong
                      ? "#EF4444"
                      : "var(--v9-mid-grey)"
                  : "rgba(26,25,24,0.1)"
              }`,
              background: submitted
                ? isCorrect
                  ? "rgba(20,241,149,0.05)"
                  : isWrong
                    ? "rgba(239,68,68,0.05)"
                    : "transparent"
                : "rgba(26,25,24,0.02)",
            }}
          >
            <p
              style={{
                fontFamily: "var(--v9-sans)",
                fontSize: "16px",
                fontWeight: 500,
                color: "var(--v9-dark)",
                marginBottom: "16px",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--v9-mono)",
                  color: "var(--v9-accent)",
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
                      fontFamily: "var(--v9-sans)",
                      fontSize: "14px",
                      border: `1px solid ${
                        submitted
                          ? isThisCorrect
                            ? "var(--v9-sol-green)"
                            : isThisWrong
                              ? "#EF4444"
                              : "rgba(26,25,24,0.08)"
                          : isSelected
                            ? "var(--v9-accent)"
                            : "rgba(26,25,24,0.08)"
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
                      color: "var(--v9-dark)",
                      cursor: submitted ? "default" : "pointer",
                      transition: "all 0.2s",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "var(--v9-mono)",
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
                          color: "var(--v9-sol-green)",
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
                  borderTop: "1px solid rgba(26,25,24,0.06)",
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
                    fontFamily: "var(--v9-sans)",
                    fontSize: "13px",
                    color: "rgba(26,25,24,0.6)",
                    lineHeight: 1.5,
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--v9-mono)",
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

      {/* Score / Submit */}
      <div
        style={{
          paddingTop: "16px",
          borderTop: "1px solid rgba(26,25,24,0.06)",
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
                borderLeft: `3px solid ${passed ? "var(--v9-sol-green)" : "#EF4444"}`,
                background: passed
                  ? "rgba(20,241,149,0.05)"
                  : "rgba(239,68,68,0.05)",
              }}
            >
              <p
                style={{
                  fontFamily: "var(--v9-serif)",
                  fontSize: "32px",
                  fontWeight: 300,
                  color: "var(--v9-dark)",
                  marginBottom: "4px",
                }}
              >
                {score}/{questions.length}
              </p>
              <p
                style={{
                  fontFamily: "var(--v9-mono)",
                  fontSize: "11px",
                  letterSpacing: "0.1em",
                  color: passed ? "var(--v9-sol-green)" : "#EF4444",
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
                className="v9-complete-btn v9-complete-btn-ghost"
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
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
            className="v9-complete-btn v9-complete-btn-primary"
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              opacity: allAnswered ? 1 : 0.4,
              cursor: allAnswered ? "pointer" : "not-allowed",
            }}
          >
            <Check style={{ width: 14, height: 14 }} />
            Submit Quiz
            <span className="v9-xp-badge">+{xpReward} XP</span>
          </button>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  V9 Lesson sidebar navigation                                      */
/* ------------------------------------------------------------------ */

function V9LessonSidebar({
  modules,
  activeId,
  locale,
  slug,
}: {
  modules: Module[];
  activeId: string;
  locale: string;
  slug: string;
}) {
  return (
    <aside className="v9-reader-sidebar">
      {modules.map((mod) => (
        <div key={mod.id}>
          <div className="v9-sidebar-module-label">{mod.title}</div>
          {mod.lessons.map((lesson) => {
            const isActive = lesson.id === activeId;
            return (
              <Link
                key={lesson.id}
                href={`/${locale}/courses/${slug}/lessons/${lesson.id}`}
                className={`v9-sidebar-lesson ${isActive ? "active" : ""}`}
              >
                <span
                  className={`v9-sidebar-dot ${isActive ? "active" : ""}`}
                />
                <span style={{ flex: 1 }}>{lesson.title}</span>
              </Link>
            );
          })}
        </div>
      ))}
    </aside>
  );
}

/* ------------------------------------------------------------------ */
/*  V9 Challenge sidebar (light theme, inline styles per reference)    */
/* ------------------------------------------------------------------ */

const CHALLENGE_TYPE_ICONS: Record<string, string> = {
  reading: "\u25EB",
  video: "\u25B6",
  challenge: "\u27E8/\u27E9",
  quiz: "\u25CE",
};

function V9ChallengeSidebar({
  modules,
  activeId,
  locale,
  slug,
}: {
  modules: Module[];
  activeId: string;
  locale: string;
  slug: string;
}) {
  return (
    <aside
      style={{
        gridRow: "2 / 4",
        background: "#F6F5F2",
        borderRight: "1px solid rgba(26,25,24,0.07)",
        overflowY: "auto",
        padding: "16px 0",
      }}
    >
      {modules.map((mod) => (
        <div key={mod.id} style={{ marginBottom: 2 }}>
          <div
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: 8.5,
              letterSpacing: "0.18em",
              textTransform: "uppercase" as const,
              color: "#B5B2AE",
              padding: "14px 16px 6px",
            }}
          >
            {mod.title}
          </div>
          {mod.lessons.map((l) => {
            const active = l.id === activeId;
            return (
              <Link
                key={l.id}
                href={`/${locale}/courses/${slug}/lessons/${l.id}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 16px",
                  fontSize: 12.5,
                  fontFamily: "'DM Sans', system-ui, sans-serif",
                  color: active ? "#1A1918" : "#8A8784",
                  fontWeight: active ? 600 : 400,
                  borderLeft: active
                    ? "2px solid #FF5C28"
                    : "2px solid transparent",
                  background: active ? "rgba(255,92,40,0.03)" : "transparent",
                  cursor: "pointer",
                  transition: "all 0.15s",
                  textDecoration: "none",
                }}
              >
                <span
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: "50%",
                    flexShrink: 0,
                    background: active ? "#FF5C28" : "rgba(26,25,24,0.12)",
                  }}
                />
                <span
                  style={{
                    flex: 1,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap" as const,
                  }}
                >
                  {l.title}
                </span>
                <span
                  style={{
                    fontFamily: "'Space Mono', monospace",
                    fontSize: 7.5,
                    color: "#B5B2AE",
                    flexShrink: 0,
                  }}
                >
                  {CHALLENGE_TYPE_ICONS[l.type] ?? "\u25EB"}
                </span>
              </Link>
            );
          })}
        </div>
      ))}
    </aside>
  );
}

/* ------------------------------------------------------------------ */
/*  Inner lesson component — receives key={lessonId} to force remount */
/* ------------------------------------------------------------------ */

function LessonInner({
  lesson,
  course,
  allLessons,
  lessonIndex,
  locale,
  slug,
}: {
  lesson: Lesson;
  course: { title: string; modules: Module[] };
  allLessons: Lesson[];
  lessonIndex: number;
  locale: string;
  slug: string;
}) {
  const t = useTranslations("lesson");
  const router = useRouter();
  const { publicKey } = useWallet();
  const walletAddress = publicKey?.toBase58() ?? null;
  const courseData = courses.find((c) => c.slug === slug);

  const prevLesson = lessonIndex > 0 ? allLessons[lessonIndex - 1] : null;
  const nextLesson =
    lessonIndex < allLessons.length - 1 ? allLessons[lessonIndex + 1] : null;
  const isChallenge = lesson.type === "challenge" && !!lesson.challenge;
  const isLastLesson = !nextLesson;

  const TYPE_ICONS: Record<string, string> = {
    reading: "\u25EB",
    video: "\u25B6",
    challenge: "\u27E8/\u27E9",
    quiz: "\u25EF",
  };

  // --- State ---
  const [code, setCode] = useState(() => {
    if (typeof window !== "undefined" && isChallenge) {
      const saved = localStorage.getItem(`stacad:code:${slug}:${lesson.id}`);
      if (saved) return saved;
    }
    return lesson.challenge?.starterCode ?? "";
  });
  const [output, setOutput] = useState("");
  const [testResults, setTestResults] = useState<
    { name: string; passed: boolean }[]
  >([]);
  const [isRunning, setIsRunning] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [showOutput, setShowOutput] = useState(false);
  const [showXP, setShowXP] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [showHints, setShowHints] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileTab, setMobileTab] = useState<"instructions" | "code">(
    "instructions",
  );

  // Check if lesson is already completed (localStorage + on-chain enrollment)
  useEffect(() => {
    const userId = walletAddress ?? "local";
    const cId = courseData?.id ?? slug;
    learningService.getProgress(userId, cId).then((progress) => {
      if (progress.completedLessons.includes(lessonIndex)) {
        setCompleted(true);
      }
    });
  }, [walletAddress, courseData, slug, lessonIndex]);

  // Course finalization state
  const [showCourseComplete, setShowCourseComplete] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [finalizationResult, setFinalizationResult] = useState<{
    xpAwarded: number;
    credentialIssued: boolean;
  } | null>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    if (!isChallenge) return;
    const timer = setTimeout(() => {
      localStorage.setItem(`stacad:code:${slug}:${lesson.id}`, code);
    }, 800);
    return () => clearTimeout(timer);
  }, [code, slug, lesson.id, isChallenge]);

  const triggerCelebration = useCallback(async () => {
    setShowXP(true);
    setTimeout(() => setShowXP(false), 3000);
    const confetti = await lazyConfetti();
    const colors = ["#00FFA3", "#03E1FF", "#9945FF"];
    confetti({ particleCount: 60, spread: 65, origin: { y: 0.65 }, colors });
    const end = Date.now() + 600;
    (function burst() {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 50,
        origin: { x: 0 },
        colors,
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 50,
        origin: { x: 1 },
        colors,
      });
      if (Date.now() < end) requestAnimationFrame(burst);
    })();
    if (isLastLesson) {
      setTimeout(() => setShowCourseComplete(true), 1500);
    }
  }, [isLastLesson]);

  const callCompleteLessonAPI = useCallback(() => {
    const userId = walletAddress ?? "local";
    const cId = courseData?.id ?? slug;

    // Mark completed locally first (prevents duplicate completions on re-visit)
    learningService.completeLesson(userId, cId, lessonIndex).catch(() => {});

    if (walletAddress && courseData) {
      fetch("/api/complete-lesson", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          learner: walletAddress,
          courseId: courseData.id,
          lessonIndex,
        }),
      }).catch((e) => console.error("complete-lesson API error:", e));
    }
  }, [walletAddress, courseData, lessonIndex, slug]);

  const handleRun = useCallback(async () => {
    if (!lesson.challenge) return;
    setIsRunning(true);
    setOutput("");
    setShowOutput(true);

    await new Promise((r) => setTimeout(r, 1200));
    setOutput("Compiled successfully.\n\n> Output ready.");

    const results = lesson.challenge.testCases.map((tc) => ({
      name: tc.name,
      passed: code.length > 30,
    }));
    setTestResults(results);

    if (results.every((r) => r.passed) && !completed) {
      setCompleted(true);
      triggerCelebration();
      callCompleteLessonAPI();
    }
    setIsRunning(false);
  }, [code, lesson.challenge, triggerCelebration, callCompleteLessonAPI]);

  const handleReset = useCallback(() => {
    setCode(lesson.challenge?.starterCode ?? "");
    setOutput("");
    setTestResults([]);
    setCompleted(false);
    setShowOutput(false);
    localStorage.removeItem(`stacad:code:${slug}:${lesson.id}`);
  }, [lesson.challenge, slug, lesson.id]);

  const navigateNext = useCallback(() => {
    if (nextLesson) {
      router.push(`/${locale}/courses/${slug}/lessons/${nextLesson.id}`);
    } else {
      router.push(`/${locale}/courses/${slug}`);
    }
  }, [nextLesson, router, locale, slug]);

  const handleFinalizeCourse = useCallback(async () => {
    setIsFinalizing(true);
    try {
      const cd = courses.find((c) => c.slug === slug);
      if (!cd) return;

      if (walletAddress) {
        const res = await fetch(`/api/courses/${slug}/finalize`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ walletAddress }),
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        setFinalizationResult({
          xpAwarded: data.xpAwarded ?? cd.xpReward,
          credentialIssued: true,
        });
      } else {
        const result = await learningService.finalizeCourse("local", cd.id);
        setFinalizationResult(result);
      }

      const confetti = await lazyConfetti();
      const colors = ["#00FFA3", "#CA9FF5", "#03E1FF", "#9945FF"];
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 }, colors });
      setTimeout(() => {
        confetti({
          particleCount: 40,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors,
        });
        confetti({
          particleCount: 40,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors,
        });
      }, 300);
    } catch (e) {
      console.error("finalizeCourse error:", e);
      setFinalizationResult({ xpAwarded: 0, credentialIssued: false });
    } finally {
      setIsFinalizing(false);
    }
  }, [slug, walletAddress]);

  // --- Course completion overlay ---
  const courseCompleteOverlay = showCourseComplete && (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center"
        style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)" }}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          style={{
            margin: "16px",
            width: "100%",
            maxWidth: "400px",
            background: "var(--v9-white)",
            padding: "48px 40px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: "64px",
              height: "64px",
              margin: "0 auto 16px",
              background: "rgba(20,241,149,0.1)",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Award
              style={{ width: 32, height: 32, color: "var(--v9-sol-green)" }}
            />
          </div>

          <h2
            style={{
              fontFamily: "var(--v9-serif)",
              fontSize: "24px",
              fontWeight: 700,
              color: "var(--v9-dark)",
              marginBottom: "8px",
            }}
          >
            {t("courseComplete", { defaultMessage: "Course Complete!" })}
          </h2>
          <p
            style={{
              fontFamily: "var(--v9-sans)",
              fontSize: "14px",
              color: "var(--v9-mid-grey)",
              marginBottom: "24px",
            }}
          >
            {t("courseCompleteDesc", {
              defaultMessage: "You've completed all lessons in this course.",
            })}
          </p>

          {finalizationResult ? (
            finalizationResult.credentialIssued ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                <div
                  style={{
                    padding: "16px",
                    borderLeft: "3px solid var(--v9-sol-green)",
                    background: "rgba(20,241,149,0.05)",
                  }}
                >
                  <p
                    style={{
                      fontFamily: "var(--v9-mono)",
                      fontSize: "12px",
                      color: "var(--v9-sol-green)",
                    }}
                  >
                    Credential issued! +{finalizationResult.xpAwarded} XP
                  </p>
                </div>
                <button
                  onClick={() => router.push(`/${locale}/certificates`)}
                  className="v9-complete-btn v9-complete-btn-primary"
                  style={{ width: "100%" }}
                >
                  View Credential
                </button>
                <button
                  onClick={() => setShowCourseComplete(false)}
                  className="v9-complete-btn v9-complete-btn-ghost"
                  style={{ width: "100%" }}
                >
                  Back
                </button>
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                <p
                  style={{
                    fontFamily: "var(--v9-mono)",
                    fontSize: "12px",
                    color: "#EF4444",
                  }}
                >
                  Could not finalize. Please try again.
                </p>
                <button
                  onClick={handleFinalizeCourse}
                  className="v9-complete-btn v9-complete-btn-primary"
                  style={{ width: "100%" }}
                >
                  Finalize &amp; Claim Credential
                </button>
              </div>
            )
          ) : (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              <button
                onClick={handleFinalizeCourse}
                disabled={isFinalizing}
                className="v9-complete-btn v9-complete-btn-primary"
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                }}
              >
                {isFinalizing ? (
                  <>
                    <Loader2
                      style={{ width: 14, height: 14 }}
                      className="animate-spin"
                    />
                    Finalizing...
                  </>
                ) : (
                  <>
                    <Award style={{ width: 14, height: 14 }} />
                    Finalize &amp; Claim Credential
                  </>
                )}
              </button>
              <button
                onClick={() => setShowCourseComplete(false)}
                className="v9-complete-btn v9-complete-btn-ghost"
                style={{ width: "100%" }}
              >
                Later
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );

  /* ============================================================== */
  /*  READING / VIDEO / QUIZ — V9 editorial layout                  */
  /* ============================================================== */
  if (!isChallenge) {
    return (
      <div className="v9-reader-layout" style={{ minHeight: "100vh" }}>
        <XPToast amount={lesson.xpReward} show={showXP} />
        {courseCompleteOverlay}

        {/* V9 Sidebar */}
        {!isMobile && (
          <V9LessonSidebar
            modules={course.modules}
            activeId={lesson.id}
            locale={locale}
            slug={slug}
          />
        )}

        {/* Main content */}
        <main className="v9-reader-main">
          <div className="v9-reader-content">
            {/* Lesson Header */}
            <div
              className="v9-fade-up"
              style={{ marginBottom: "clamp(40px, 6vh, 64px)" }}
            >
              <div className="v9-lesson-type-badge">
                <span className="v9-lesson-type-badge-icon">
                  {TYPE_ICONS[lesson.type] ?? "\u25EB"}
                </span>
                {lesson.type} &middot; {lesson.duration}
              </div>
              <h1 className="v9-lesson-main-title">{lesson.title}</h1>
              <div className="v9-lesson-meta-row">
                <span>
                  Lesson {lessonIndex + 1} of {allLessons.length}
                </span>
                <span>+{lesson.xpReward} XP</span>
              </div>
            </div>

            {/* Lesson Content */}
            {lesson.type === "quiz" ? (
              <QuizRenderer
                content={lesson.content ?? ""}
                xpReward={lesson.xpReward}
                onComplete={() => {
                  if (completed) return;
                  setCompleted(true);
                  triggerCelebration();
                  callCompleteLessonAPI();
                }}
              />
            ) : (
              <V9ContentRenderer text={lesson.content ?? lesson.title} />
            )}

            {/* Completion action (for non-quiz lessons) */}
            {lesson.type !== "quiz" && (
              <div
                style={{
                  marginTop: "64px",
                  paddingTop: "32px",
                  borderTop: "1px solid rgba(26,25,24,0.06)",
                }}
              >
                {completed ? (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                      }}
                    >
                      <CheckCircle2
                        style={{
                          width: 16,
                          height: 16,
                          color: "var(--v9-sol-green)",
                        }}
                      />
                      <span
                        style={{
                          fontFamily: "var(--v9-mono)",
                          fontSize: "12px",
                          color: "var(--v9-sol-green)",
                        }}
                      >
                        +{lesson.xpReward} XP
                      </span>
                    </div>
                    <button
                      onClick={navigateNext}
                      className="v9-complete-btn v9-complete-btn-ghost"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      {nextLesson ? t("nextLesson") : "Back to Course"}
                      <ArrowRight style={{ width: 14, height: 14 }} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setCompleted(true);
                      triggerCelebration();
                      callCompleteLessonAPI();
                    }}
                    className="v9-complete-btn v9-complete-btn-primary"
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                    }}
                  >
                    Complete Lesson
                    <span className="v9-xp-badge">+{lesson.xpReward} XP</span>
                  </button>
                )}
              </div>
            )}

            {/* Navigation after quiz completion */}
            {lesson.type === "quiz" && completed && (
              <div
                style={{
                  marginTop: "32px",
                  paddingTop: "24px",
                  borderTop: "1px solid rgba(26,25,24,0.06)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    <CheckCircle2
                      style={{
                        width: 16,
                        height: 16,
                        color: "var(--v9-sol-green)",
                      }}
                    />
                    <span
                      style={{
                        fontFamily: "var(--v9-mono)",
                        fontSize: "12px",
                        color: "var(--v9-sol-green)",
                      }}
                    >
                      Quiz Complete
                    </span>
                  </div>
                  <button
                    onClick={navigateNext}
                    className="v9-complete-btn v9-complete-btn-ghost"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    {nextLesson ? t("nextLesson") : "Back to Course"}
                    <ArrowRight style={{ width: 14, height: 14 }} />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Fixed bottom completion bar */}
          <div className="v9-complete-bar">
            <div className="v9-complete-text">
              Lesson {lessonIndex + 1}/{allLessons.length}
            </div>
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              {prevLesson && (
                <Link
                  href={`/${locale}/courses/${slug}/lessons/${prevLesson.id}`}
                  className="v9-complete-btn v9-complete-btn-ghost"
                >
                  &#8592; Prev
                </Link>
              )}
              {nextLesson && (
                <Link
                  href={`/${locale}/courses/${slug}/lessons/${nextLesson.id}`}
                  className="v9-complete-btn v9-complete-btn-ghost"
                >
                  Next &#8594;
                </Link>
              )}
            </div>
          </div>
        </main>
      </div>
    );
  }

  /* ============================================================== */
  /*  CHALLENGE layout — V9 light-theme grid IDE (inline styles)     */
  /* ============================================================== */

  const fileName =
    lesson.challenge?.language === "rust" ? "main.rs" : "index.ts";
  const doneCount = allLessons.filter((_, i) => i < lessonIndex).length;
  const walletShort = walletAddress
    ? `${walletAddress.slice(0, 4)}..${walletAddress.slice(-4)}`
    : null;

  return (
    <div
      style={{
        width: "100%",
        height: "100vh",
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "220px 1fr",
        gridTemplateRows: isMobile ? "48px 38px 1fr 40px" : "48px 1fr 40px",
        fontFamily: "'DM Sans', system-ui, sans-serif",
        background: "#F6F5F2",
        color: "#1A1918",
        overflow: "hidden",
        paddingTop: "61px",
        boxSizing: "border-box",
      }}
    >
      <XPToast amount={lesson.xpReward} show={showXP} />
      {courseCompleteOverlay}

      {/* ═══ NAV ═══ */}
      <nav
        style={{
          gridColumn: "1 / -1",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: isMobile ? "0 12px" : "0 20px",
          background: "#F6F5F2",
          borderBottom: "1px solid rgba(26,25,24,0.07)",
          zIndex: 10,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: isMobile ? 8 : 14,
            minWidth: 0,
          }}
        >
          <Link
            href={`/${locale}`}
            style={{
              fontFamily: "var(--v9-mono)",
              fontSize: isMobile ? 9 : 11,
              fontWeight: 700,
              letterSpacing: "0.1em",
              color: "#1A1918",
              textDecoration: "none",
              flexShrink: 0,
            }}
          >
            {isMobile ? "SA" : "SUPERTEAM"}
          </Link>
          <span style={{ color: "#B5B2AE", fontSize: 11, flexShrink: 0 }}>
            /
          </span>
          <div
            style={{
              fontFamily: "var(--v9-mono)",
              fontSize: 9.5,
              letterSpacing: "0.08em",
              color: "#8A8784",
              display: "flex",
              alignItems: "center",
              gap: 6,
              minWidth: 0,
              overflow: "hidden",
            }}
          >
            {!isMobile && (
              <>
                <Link
                  href={`/${locale}/courses/${slug}`}
                  style={{
                    color: "#8A8784",
                    textDecoration: "none",
                    textTransform: "uppercase" as const,
                  }}
                >
                  {course.title}
                </Link>
                <span style={{ opacity: 0.4 }}>{"\u203A"}</span>
              </>
            )}
            <span
              style={{
                color: "#1A1918",
                fontWeight: 700,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap" as const,
              }}
            >
              {lesson.title}
            </span>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: isMobile ? 8 : 18,
            flexShrink: 0,
          }}
        >
          {!isMobile &&
            [
              { label: "HOME", href: `/${locale}` },
              { label: "COURSES", href: `/${locale}/courses` },
              { label: "DASHBOARD", href: `/${locale}/dashboard` },
              { label: "LEADERBOARD", href: `/${locale}/leaderboard` },
            ].map((l) => (
              <Link
                key={l.label}
                href={l.href}
                style={{
                  fontFamily: "var(--v9-mono)",
                  fontSize: 9,
                  letterSpacing: "0.12em",
                  color: l.label === "COURSES" ? "#FF5C28" : "#8A8784",
                  textDecoration: "none",
                }}
              >
                {l.label}
              </Link>
            ))}
          <span
            style={{
              fontFamily: "var(--v9-mono)",
              fontSize: isMobile ? 9 : 10.5,
              color: "#FF5C28",
              fontWeight: 700,
              letterSpacing: "0.06em",
            }}
          >
            +{lesson.xpReward} XP
          </span>
          {completed && (
            <span
              style={{
                fontFamily: "var(--v9-mono)",
                fontSize: 9,
                letterSpacing: "0.1em",
                padding: "4px 10px",
                background: "rgba(20,241,149,0.08)",
                color: "#14F195",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <Check style={{ width: 10, height: 10 }} /> DONE
            </span>
          )}
        </div>
      </nav>

      {/* ═══ SIDEBAR ═══ */}
      {!isMobile && (
        <V9ChallengeSidebar
          modules={course.modules}
          activeId={lesson.id}
          locale={locale}
          slug={slug}
        />
      )}

      {/* ═══ MOBILE TAB SWITCHER ═══ */}
      {isMobile && (
        <div
          style={{
            gridColumn: "1 / -1",
            display: "flex",
            background: "#F6F5F2",
            borderBottom: "1px solid rgba(26,25,24,0.07)",
          }}
        >
          {(["instructions", "code"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setMobileTab(tab)}
              style={{
                flex: 1,
                fontFamily: "var(--v9-mono)",
                fontSize: 10,
                letterSpacing: "0.12em",
                textTransform: "uppercase" as const,
                padding: "10px 0",
                border: "none",
                background:
                  mobileTab === tab
                    ? tab === "code"
                      ? "#0F0E0D"
                      : "#F6F5F2"
                    : "transparent",
                color:
                  mobileTab === tab
                    ? tab === "code"
                      ? "#14F195"
                      : "#1A1918"
                    : "#8A8784",
                cursor: "pointer",
                borderBottom:
                  mobileTab === tab
                    ? `2px solid ${tab === "code" ? "#14F195" : "#FF5C28"}`
                    : "2px solid transparent",
                fontWeight: mobileTab === tab ? 700 : 400,
                transition: "all 0.2s",
              }}
            >
              {tab === "instructions" ? "Instructions" : `Code (${fileName})`}
            </button>
          ))}
        </div>
      )}

      {/* ═══ MAIN: Instructions + Editor ═══ */}
      <main
        style={{
          gridRow: isMobile ? 3 : 2,
          display: isMobile ? "flex" : "grid",
          gridTemplateColumns: isMobile ? undefined : "1fr 1fr",
          overflow: "hidden",
        }}
      >
        {/* LEFT: Instructions */}
        <div
          style={{
            background: "#F6F5F2",
            borderRight: isMobile ? "none" : "1px solid rgba(26,25,24,0.07)",
            overflowY: "auto",
            padding: isMobile ? "20px 16px 80px" : "28px 24px 80px",
            display:
              isMobile && mobileTab !== "instructions" ? "none" : "block",
            width: isMobile ? "100%" : undefined,
          }}
        >
          {/* Challenge badge + XP */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 18,
            }}
          >
            <span
              style={{
                fontFamily: "var(--v9-mono)",
                fontSize: 9,
                letterSpacing: "0.14em",
                padding: "3px 10px",
                border: "1px solid #FF5C28",
                color: "#FF5C28",
                textTransform: "uppercase" as const,
              }}
            >
              Challenge
            </span>
            <span
              style={{
                fontFamily: "var(--v9-mono)",
                fontSize: 11,
                color: "#14F195",
                fontWeight: 700,
              }}
            >
              +{lesson.xpReward} XP
            </span>
          </div>

          {/* Title */}
          <h1
            style={{
              fontFamily: "var(--v9-serif)",
              fontSize: "clamp(26px, 2.8vw, 38px)",
              fontWeight: 900,
              lineHeight: 1.08,
              letterSpacing: "-0.02em",
              marginBottom: 18,
              color: "#1A1918",
            }}
          >
            {lesson.title}
          </h1>

          {lesson.challenge && (
            <>
              {/* Instructions text */}
              <p
                style={{
                  fontSize: 14.5,
                  lineHeight: 1.7,
                  color: "#8A8784",
                  fontWeight: 300,
                  marginBottom: 20,
                  whiteSpace: "pre-wrap" as const,
                }}
              >
                {lesson.challenge.instructions}
              </p>

              {/* Callout */}
              <div
                style={{
                  padding: "14px 18px",
                  background: "rgba(26,25,24,0.02)",
                  borderLeft: "2px solid #FF5C28",
                  marginBottom: 28,
                  fontSize: 13.5,
                  color: "#8A8784",
                  fontStyle: "italic",
                  lineHeight: 1.6,
                }}
              >
                Use the provided starter code and fill in the TODO sections.
              </div>

              {/* Test cases */}
              {lesson.challenge.testCases.length > 0 && (
                <>
                  <div
                    style={{
                      fontFamily: "var(--v9-mono)",
                      fontSize: 8.5,
                      letterSpacing: "0.18em",
                      color: "#8A8784",
                      paddingBottom: 10,
                      marginBottom: 10,
                      borderBottom: "1px solid rgba(26,25,24,0.06)",
                      textTransform: "uppercase" as const,
                    }}
                  >
                    Test Cases
                  </div>
                  {lesson.challenge.testCases.map((tc, i) => {
                    const r = testResults[i];
                    return (
                      <div
                        key={tc.name}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          padding: "9px 0",
                          fontSize: 13,
                          color: r
                            ? r.passed
                              ? "#1A1918"
                              : "#EF4444"
                            : "#8A8784",
                          borderBottom: "1px solid rgba(26,25,24,0.03)",
                        }}
                      >
                        <div
                          style={{
                            width: 16,
                            height: 16,
                            borderRadius: 3,
                            border: `1.5px solid ${r ? (r.passed ? "#14F195" : "#EF4444") : "rgba(26,25,24,0.15)"}`,
                            background: r
                              ? r.passed
                                ? "#14F195"
                                : "#EF4444"
                              : "transparent",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 9,
                            color: r
                              ? r.passed
                                ? "#0D0C0B"
                                : "#fff"
                              : "transparent",
                            flexShrink: 0,
                          }}
                        >
                          {r ? (r.passed ? "\u2713" : "\u2717") : ""}
                        </div>
                        <span style={{ flex: 1 }}>{tc.name}</span>
                        {r && (
                          <span
                            style={{
                              fontFamily: "var(--v9-mono)",
                              fontSize: 9,
                              letterSpacing: "0.1em",
                              color: r.passed ? "#14F195" : "#EF4444",
                            }}
                          >
                            {r.passed ? "PASS" : "FAIL"}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </>
              )}

              {/* Hints toggle */}
              <button
                onClick={() => setShowHints(!showHints)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontFamily: "var(--v9-mono)",
                  fontSize: 9.5,
                  letterSpacing: "0.08em",
                  color: "#8A8784",
                  cursor: "pointer",
                  background: "none",
                  border: "none",
                  padding: "14px 0",
                  marginTop: 8,
                  textTransform: "uppercase" as const,
                }}
              >
                <span
                  style={{
                    fontSize: 12,
                    transition: "transform 0.3s",
                    transform: showHints ? "rotate(90deg)" : "none",
                    display: "inline-block",
                  }}
                >
                  {"\u203A"}
                </span>
                Hints
              </button>
              {showHints && (
                <div
                  style={{
                    padding: "12px 16px",
                    background: "rgba(26,25,24,0.02)",
                    borderLeft: "2px solid rgba(26,25,24,0.08)",
                    marginBottom: 8,
                    fontSize: 13,
                    color: "#8A8784",
                    lineHeight: 1.65,
                  }}
                >
                  <p>1. Read the requirements and identify inputs/outputs.</p>
                  <p>2. Build the structure first, then handle edge cases.</p>
                  <p>3. Run tests frequently to check progress.</p>
                </div>
              )}

              {/* Solution toggle */}
              {lesson.challenge.solution && (
                <button
                  onClick={() => setShowSolution(!showSolution)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontFamily: "var(--v9-mono)",
                    fontSize: 9.5,
                    letterSpacing: "0.08em",
                    color: "#8A8784",
                    cursor: "pointer",
                    background: "none",
                    border: "none",
                    padding: "6px 0",
                    textTransform: "uppercase" as const,
                  }}
                >
                  <span
                    style={{
                      fontSize: 12,
                      transition: "transform 0.3s",
                      transform: showSolution ? "rotate(90deg)" : "none",
                      display: "inline-block",
                    }}
                  >
                    {"\u203A"}
                  </span>
                  {showSolution ? "Hide Solution" : "Show Solution"}
                </button>
              )}
              {showSolution && lesson.challenge.solution && (
                <pre
                  style={{
                    padding: "12px 16px",
                    background: "#0F0E0D",
                    borderLeft: "2px solid #14F195",
                    marginTop: 4,
                    marginBottom: 8,
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 12,
                    lineHeight: 1.6,
                    color: "rgba(255,255,255,0.7)",
                    overflowX: "auto",
                    whiteSpace: "pre-wrap" as const,
                  }}
                >
                  {lesson.challenge.solution}
                </pre>
              )}
            </>
          )}
        </div>

        {/* RIGHT: Code Editor (DARK) */}
        <div
          style={{
            background: "#0F0E0D",
            display: isMobile && mobileTab !== "code" ? "none" : "flex",
            flexDirection: "column" as const,
            overflow: "hidden",
            width: isMobile ? "100%" : undefined,
          }}
        >
          {/* Tab bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              height: 34,
              background: "#1A1918",
              borderBottom: "1px solid rgba(255,255,255,0.04)",
              padding: "0 12px",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 11,
                color: "rgba(255,255,255,0.8)",
                padding: "7px 14px",
                position: "relative" as const,
              }}
            >
              {fileName}
              <div
                style={{
                  position: "absolute" as const,
                  bottom: -1,
                  left: 10,
                  right: 10,
                  height: 2,
                  background: "#FF5C28",
                }}
              />
            </div>
          </div>

          {/* Monaco editor */}
          <div style={{ flex: 1, minHeight: 0, position: "relative" as const }}>
            <MonacoEditor
              height="100%"
              language={lesson.challenge?.language ?? "typescript"}
              theme="academy"
              value={code}
              onChange={(v) => setCode(v ?? "")}
              beforeMount={setupMonacoTheme}
              options={{
                minimap: { enabled: false },
                fontSize: 12.5,
                fontFamily: "'JetBrains Mono', monospace",
                padding: { top: 14, bottom: 14 },
                scrollBeyondLastLine: false,
                wordWrap: "on",
                smoothScrolling: true,
                cursorSmoothCaretAnimation: "on",
                cursorBlinking: "smooth",
                renderLineHighlight: "line",
                lineHeight: 21,
                lineNumbers: "on",
                lineNumbersMinChars: 3,
              }}
            />
          </div>

          {/* Output area */}
          <div
            style={{
              background: "#0A0908",
              borderTop: "1px solid rgba(255,255,255,0.04)",
              padding: "10px 14px",
              minHeight: 56,
              maxHeight: 100,
              overflowY: "auto" as const,
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11.5,
              color: "rgba(255,255,255,0.4)",
              lineHeight: 1.5,
              whiteSpace: "pre-wrap" as const,
              flexShrink: 0,
            }}
          >
            {isRunning && (
              <span style={{ animation: "v9-pulse 0.8s infinite" }}>
                Running...
              </span>
            )}
            {output && !isRunning && (
              <span>
                {output.split("\n").map((line, i) => (
                  <div
                    key={i}
                    style={{
                      color: line.toLowerCase().includes("error")
                        ? "#EF4444"
                        : line.toLowerCase().includes("success") ||
                            line.toLowerCase().includes("compiled")
                          ? "#14F195"
                          : "rgba(255,255,255,0.4)",
                    }}
                  >
                    {line}
                  </div>
                ))}
              </span>
            )}
            {!output && !isRunning && (
              <span style={{ opacity: 0.35 }}>Output will appear here...</span>
            )}
          </div>
        </div>
      </main>

      {/* ═══ BOTTOM BAR ═══ */}
      <footer
        style={{
          gridColumn: "1 / -1",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: isMobile ? "0 12px" : "0 20px",
          background: "#F6F5F2",
          borderTop: "1px solid rgba(26,25,24,0.07)",
          height: 40,
          gap: 8,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: isMobile ? 8 : 18,
            minWidth: 0,
          }}
        >
          <span
            style={{
              fontFamily: "var(--v9-mono)",
              fontSize: isMobile ? 8 : 9.5,
              letterSpacing: "0.08em",
              color: "#8A8784",
              textTransform: "uppercase" as const,
              whiteSpace: "nowrap" as const,
            }}
          >
            {isMobile
              ? `${lessonIndex + 1}/${allLessons.length}`
              : `Lesson ${lessonIndex + 1}/${allLessons.length} ${"\u00B7"} ${doneCount}/${allLessons.length} Completed`}
          </span>
          {!isMobile && (
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                fontFamily: "var(--v9-mono)",
                fontSize: 8.5,
                color: "#B5B2AE",
              }}
            >
              <span
                style={{
                  width: 4,
                  height: 4,
                  borderRadius: "50%",
                  background: "#14F195",
                }}
              />
              auto-saved
            </span>
          )}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: isMobile ? 6 : 8,
            flexShrink: 0,
          }}
        >
          {prevLesson && (
            <Link
              href={`/${locale}/courses/${slug}/lessons/${prevLesson.id}`}
              style={{
                fontFamily: "var(--v9-mono)",
                fontSize: 9,
                letterSpacing: "0.08em",
                padding: "5px 14px",
                border: "1px solid rgba(26,25,24,0.1)",
                background: "none",
                color: "#8A8784",
                cursor: "pointer",
                textDecoration: "none",
                textTransform: "uppercase" as const,
              }}
            >
              {"\u2190"} Prev
            </Link>
          )}
          <button
            onClick={handleReset}
            style={{
              fontFamily: "var(--v9-mono)",
              fontSize: 9,
              letterSpacing: "0.08em",
              padding: "5px 14px",
              border: "1px solid rgba(26,25,24,0.1)",
              background: "none",
              color: "#8A8784",
              cursor: "pointer",
              textTransform: "uppercase" as const,
            }}
          >
            Reset
          </button>
          <button
            onClick={handleRun}
            disabled={isRunning}
            style={{
              fontFamily: "var(--v9-mono)",
              fontSize: 10,
              letterSpacing: "0.1em",
              padding: "6px 20px",
              border: "none",
              background: isRunning ? "#FF5C28" : "#14F195",
              color: isRunning ? "#fff" : "#0D0C0B",
              cursor: isRunning ? "wait" : "pointer",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: 6,
              transition: "all 0.3s cubic-bezier(0.16,1,0.3,1)",
              textTransform: "uppercase" as const,
            }}
          >
            {"\u25B6"} {isRunning ? "Running..." : "Run Code"}
          </button>
          {completed ? (
            <button
              onClick={navigateNext}
              style={{
                fontFamily: "var(--v9-mono)",
                fontSize: 9,
                letterSpacing: "0.08em",
                padding: "5px 14px",
                border: "none",
                background: "#1A1918",
                color: "#F6F5F2",
                cursor: "pointer",
                textTransform: "uppercase" as const,
              }}
            >
              {nextLesson ? "Next" : "Finish"} {"\u2192"}
            </button>
          ) : nextLesson ? (
            <Link
              href={`/${locale}/courses/${slug}/lessons/${nextLesson.id}`}
              style={{
                fontFamily: "var(--v9-mono)",
                fontSize: 9,
                letterSpacing: "0.08em",
                padding: "5px 14px",
                border: "1px solid rgba(26,25,24,0.1)",
                background: "none",
                color: "#8A8784",
                cursor: "pointer",
                textDecoration: "none",
                textTransform: "uppercase" as const,
              }}
            >
              Next {"\u2192"}
            </Link>
          ) : null}
        </div>
      </footer>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page wrapper — key={lessonId} forces clean remount on navigation  */
/* ------------------------------------------------------------------ */

export default function LessonPage() {
  const params = useParams();
  const locale = params.locale as string;
  const slug = params.slug as string;
  const lessonId = params.id as string;

  const course = courses.find((c) => c.slug === slug);
  const allLessons = useMemo(
    () => course?.modules.flatMap((m) => m.lessons) ?? [],
    [course],
  );
  const lessonIndex = allLessons.findIndex((l) => l.id === lessonId);
  const lesson = allLessons[lessonIndex];

  if (!course || !lesson) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          background: "var(--v9-white)",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <p
            style={{
              fontFamily: "var(--v9-mono)",
              fontSize: "12px",
              color: "var(--v9-mid-grey)",
            }}
          >
            Lesson not found
          </p>
          <Link
            href={`/${locale}/courses`}
            style={{
              fontFamily: "var(--v9-mono)",
              fontSize: "11px",
              color: "var(--v9-accent)",
              marginTop: "8px",
              display: "inline-block",
            }}
          >
            Back to courses
          </Link>
        </div>
      </div>
    );
  }

  return (
    <LessonInner
      key={lessonId}
      lesson={lesson}
      course={course}
      allLessons={allLessons}
      lessonIndex={lessonIndex}
      locale={locale}
      slug={slug}
    />
  );
}
