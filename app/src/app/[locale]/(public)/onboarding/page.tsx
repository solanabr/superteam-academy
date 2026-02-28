"use client";

import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { ChevronRight, CheckCircle } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Answers = {
  experience?: "beginner" | "some" | "intermediate" | "advanced";
  background?: "web2" | "rust" | "blockchain" | "other";
  goal?: "defi" | "nft" | "dao" | "tools";
  time?: "light" | "moderate" | "heavy" | "fulltime";
};

type TrackResult = {
  heading: string;
  track: string;
  color: string;
  description: string;
  xpReward: number;
  slug: string;
};

// ─── Result logic ─────────────────────────────────────────────────────────────

function computeResult(answers: Answers): TrackResult {
  const { experience, goal } = answers;

  if (experience === "beginner") {
    return {
      heading: "Start with: Solana Fundamentals",
      track: "◎ Solana Basics",
      color: "#14F195",
      description:
        "Build a solid foundation — accounts, transactions, PDAs, and Token-2022. No prior Solana knowledge required.",
      xpReward: 300,
      slug: "solana-fundamentals",
    };
  }

  if (experience === "some") {
    return {
      heading: "Start with: Anchor Framework Basics",
      track: "⚓ Anchor Framework",
      color: "#9945FF",
      description:
        "Level up from tutorials to real programs. Master Anchor macros, constraints, error handling, and CPIs.",
      xpReward: 500,
      slug: "anchor-framework-101",
    };
  }

  // intermediate or advanced
  if (goal === "defi") {
    return {
      heading: "Start with: DeFi on Solana",
      track: "💹 DeFi",
      color: "#00D4FF",
      description:
        "Build AMMs, lending protocols, and liquidity pools from scratch. Deep dive into Solana's DeFi primitives.",
      xpReward: 1200,
      slug: "defi-amm",
    };
  }

  if (goal === "nft") {
    return {
      heading: "Start with: Token-2022 & Extensions",
      track: "🎨 NFT/Token",
      color: "#F5A623",
      description:
        "Explore transfer hooks, confidential transfers, and non-transferable mints with Token-2022 Extensions.",
      xpReward: 800,
      slug: "token-2022-extensions",
    };
  }

  return {
    heading: "Start with: Solana Program Security",
    track: "🛡 Security",
    color: "#FF4444",
    description:
      "Identify and prevent real exploits — signer checks, owner validation, reentrancy, and arithmetic overflow.",
    xpReward: 600,
    slug: "solana-program-security",
  };
}

// ─── Option card ──────────────────────────────────────────────────────────────

function OptionCard({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-card border rounded p-4 cursor-pointer transition-all flex items-center justify-between gap-3"
      style={{
        borderColor: selected ? "#14F195" : "#1F1F1F",
        backgroundColor: selected ? "rgba(20,241,149,0.05)" : undefined,
      }}
    >
      <span className="font-mono text-sm text-foreground">{label}</span>
      {selected && <CheckCircle className="h-4 w-4 text-[#14F195] flex-shrink-0" />}
    </button>
  );
}

// ─── Progress bar ─────────────────────────────────────────────────────────────

function ProgressBar({ step }: { step: number }) {
  const pct = (step / 4) * 100;
  return (
    <div className="w-full mb-8">
      <div className="flex justify-between items-center mb-2">
        <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
          Step {step} of 4
        </span>
        <span className="text-[10px] font-mono text-muted-foreground">{Math.round(pct)}%</span>
      </div>
      <div className="h-0.5 bg-border rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: "#14F195" }}
        />
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [result, setResult] = useState<TrackResult | null>(null);

  function pick<K extends keyof Answers>(key: K, value: Answers[K]) {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  }

  function next() {
    if (step === 4) {
      setResult(computeResult(answers));
    } else {
      setStep((s) => s + 1);
    }
  }

  const canAdvance =
    (step === 1 && !!answers.experience) ||
    (step === 2 && !!answers.background) ||
    (step === 3 && !!answers.goal) ||
    (step === 4 && !!answers.time);

  // ── Welcome ──
  if (step === 0) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="text-6xl mb-6 font-mono text-[#14F195]">◎</div>
          <h1 className="font-mono text-3xl font-black text-foreground mb-4 leading-tight">
            Welcome to Superteam Academy
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed mb-10 font-mono">
            Let&apos;s personalize your learning path. Answer a few quick questions.
          </p>
          <button
            onClick={() => setStep(1)}
            className="inline-flex items-center gap-2 bg-[#14F195] text-black font-mono font-semibold text-sm px-8 py-3 rounded hover:bg-accent-dim transition-colors"
          >
            Start Assessment
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  // ── Result ──
  if (result) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center px-4">
        <div className="max-w-lg w-full">
          <div className="text-center mb-8">
            <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-3">
              Assessment Complete
            </div>
            <h2 className="font-mono text-2xl font-black text-foreground">
              Your Recommended Path
            </h2>
          </div>

          <div
            className="bg-card rounded p-6 mb-6 relative overflow-hidden"
            style={{ border: `1px solid ${result.color}30` }}
          >
            {/* Glow */}
            <div
              className="absolute top-0 right-0 w-40 h-40 rounded-full pointer-events-none"
              style={{
                background: `radial-gradient(circle at top right, ${result.color}10, transparent 70%)`,
              }}
            />

            {/* Track badge */}
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono font-semibold mb-4"
              style={{
                color: result.color,
                backgroundColor: `${result.color}15`,
                border: `1px solid ${result.color}35`,
              }}
            >
              {result.track}
            </div>

            <h3 className="font-mono text-sm font-bold text-[#14F195] mb-2">
              {result.heading}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed mb-4">
              {result.description}
            </p>

            <div className="flex items-center gap-2 pt-4 border-t border-border">
              <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                XP you&apos;ll earn
              </span>
              <span className="font-mono text-lg font-bold text-[#14F195] ml-auto">
                +{result.xpReward.toLocaleString()}
              </span>
              <span className="text-[10px] font-mono text-muted-foreground">XP</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href={{
                pathname: "/courses/[slug]",
                params: { slug: result.slug },
              }}
              className="flex-1 inline-flex items-center justify-center gap-2 bg-[#14F195] text-black font-mono font-semibold text-sm px-6 py-2.5 rounded hover:bg-accent-dim transition-colors"
            >
              Start Learning
              <ChevronRight className="h-4 w-4" />
            </Link>
            <Link
              href="/courses"
              className="flex-1 inline-flex items-center justify-center gap-2 border border-border text-foreground font-mono text-sm px-6 py-2.5 rounded hover:bg-card hover:border-border-hover transition-colors"
            >
              Browse All Courses
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Questions ──
  const QUESTIONS: {
    key: keyof Answers;
    question: string;
    options: { label: string; value: string }[];
  }[] = [
    {
      key: "experience",
      question: "What's your Solana experience level?",
      options: [
        { label: "Complete beginner — never touched Solana", value: "beginner" },
        { label: "Some experience — read docs, maybe one tutorial", value: "some" },
        { label: "Intermediate — built something on Solana", value: "intermediate" },
        { label: "Advanced — shipped production programs", value: "advanced" },
      ],
    },
    {
      key: "background",
      question: "What's your background?",
      options: [
        { label: "Web2 developer (JS/TS)", value: "web2" },
        { label: "Rust developer", value: "rust" },
        { label: "Blockchain developer (other chains)", value: "blockchain" },
        { label: "Designer / non-engineer", value: "other" },
      ],
    },
    {
      key: "goal",
      question: "What do you want to build?",
      options: [
        { label: "DeFi protocols (AMMs, lending)", value: "defi" },
        { label: "NFT projects & marketplaces", value: "nft" },
        { label: "DAOs & governance", value: "dao" },
        { label: "Dev tools & infrastructure", value: "tools" },
      ],
    },
    {
      key: "time",
      question: "How much time can you dedicate?",
      options: [
        { label: "1-2 hours/week", value: "light" },
        { label: "3-5 hours/week", value: "moderate" },
        { label: "5-10 hours/week", value: "heavy" },
        { label: "Full-time learner", value: "fulltime" },
      ],
    },
  ];

  const q = QUESTIONS[step - 1];

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4">
      <div className="max-w-lg w-full">
        <ProgressBar step={step} />

        <h2 className="font-mono text-xl font-bold text-foreground mb-6">
          {q.question}
        </h2>

        <div className="flex flex-col gap-3 mb-8">
          {q.options.map((opt) => (
            <OptionCard
              key={opt.value}
              label={opt.label}
              selected={answers[q.key] === opt.value}
              onClick={() => pick(q.key, opt.value as Answers[typeof q.key])}
            />
          ))}
        </div>

        <button
          onClick={next}
          disabled={!canAdvance}
          className="w-full font-mono font-semibold text-sm px-6 py-2.5 rounded transition-colors flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            backgroundColor: canAdvance ? "#14F195" : "#1F1F1F",
            color: canAdvance ? "#000000" : "#666666",
          }}
        >
          {step === 4 ? "See My Path" : "Next"}
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
