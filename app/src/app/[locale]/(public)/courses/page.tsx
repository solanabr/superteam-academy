import { getTranslations } from "next-intl/server";
import { getAllCourses } from "@/lib/sanity";
import { CourseCard } from "@/components/course/CourseCard";
import type { Metadata } from "next";
import type { SanityCourse } from "@/types";
import { Link } from "@/i18n/navigation";
import { Search } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "courses" });
  return { title: t("title"), description: t("subtitle") };
}

// Fallback mock courses for when CMS is not configured
const MOCK_COURSES: SanityCourse[] = [
  {
    _id: "mock-1",
    title: "Solana Fundamentals",
    slug: "solana-fundamentals",
    description: "Master the core concepts of Solana: accounts, programs, transactions, and the runtime model. Learn how accounts store state, how programs process instructions, and why Solana is the fastest blockchain for developers.",
    difficulty: "beginner",
    durationHours: 4,
    xpReward: 500,
    trackId: 1,
    instructor: { _id: "i1", name: "Lucas Oliveira", bio: "Solana core contributor & educator", twitterHandle: "lucasoldev" },
    tags: ["solana", "basics", "accounts", "transactions"],
    modules: [
      {
        _id: "m1", title: "Introduction to Solana", order: 1, lessons: [
          { _id: "l1", title: "What is Solana?", type: "content", order: 1, xpReward: 25, estimatedMinutes: 10 },
          { _id: "l2", title: "Why Solana is Different", type: "content", order: 2, xpReward: 25, estimatedMinutes: 12 },
          { _id: "l3", title: "Setting Up Your Environment", type: "content", order: 3, xpReward: 50, estimatedMinutes: 20 },
        ],
      },
      {
        _id: "m2", title: "The Account Model", order: 2, lessons: [
          { _id: "l4", title: "Everything is an Account", type: "content", order: 1, xpReward: 50, estimatedMinutes: 15 },
          { _id: "l5", title: "System Program & Rent", type: "content", order: 2, xpReward: 50, estimatedMinutes: 12 },
          { _id: "l6", title: "Account Challenge: Read On-Chain Data", type: "challenge", order: 3, xpReward: 100, estimatedMinutes: 30 },
        ],
      },
      {
        _id: "m3", title: "Transactions & Instructions", order: 3, lessons: [
          { _id: "l7", title: "Anatomy of a Transaction", type: "content", order: 1, xpReward: 50, estimatedMinutes: 15 },
          { _id: "l8", title: "Signing & Sending", type: "content", order: 2, xpReward: 50, estimatedMinutes: 15 },
          { _id: "l9", title: "Build a Transfer Script", type: "challenge", order: 3, xpReward: 100, estimatedMinutes: 25 },
        ],
      },
    ],
  },
  {
    _id: "mock-2",
    title: "Anchor Framework Basics",
    slug: "anchor-basics",
    description: "Build production-grade Solana programs with Anchor. Learn PDAs, CPIs, account validation, and error handling. Go from zero to deploying your first program on Devnet.",
    difficulty: "intermediate",
    durationHours: 6,
    xpReward: 1200,
    trackId: 2,
    instructor: { _id: "i2", name: "Ana Lima", bio: "Anchor maintainer & DeFi builder", twitterHandle: "anaanchor" },
    tags: ["anchor", "programs", "pda", "cpi"],
    modules: [
      {
        _id: "m4", title: "Anchor Fundamentals", order: 1, lessons: [
          { _id: "l10", title: "What is Anchor?", type: "content", order: 1, xpReward: 25, estimatedMinutes: 10 },
          { _id: "l11", title: "Project Structure & Workspace", type: "content", order: 2, xpReward: 50, estimatedMinutes: 20 },
          { _id: "l12", title: "Your First Anchor Program", type: "challenge", order: 3, xpReward: 100, estimatedMinutes: 40 },
        ],
      },
      {
        _id: "m5", title: "PDAs & Seeds", order: 2, lessons: [
          { _id: "l13", title: "Program Derived Addresses", type: "content", order: 1, xpReward: 75, estimatedMinutes: 20 },
          { _id: "l14", title: "Bump Seeds & Canonical Bumps", type: "content", order: 2, xpReward: 75, estimatedMinutes: 18 },
          { _id: "l15", title: "PDA Challenge: Counter with PDA", type: "challenge", order: 3, xpReward: 150, estimatedMinutes: 45 },
        ],
      },
      {
        _id: "m6", title: "CPIs & Composability", order: 3, lessons: [
          { _id: "l16", title: "Cross-Program Invocations", type: "content", order: 1, xpReward: 75, estimatedMinutes: 20 },
          { _id: "l17", title: "CPI with Signer Seeds", type: "content", order: 2, xpReward: 75, estimatedMinutes: 18 },
          { _id: "l18", title: "Build a Token Vault", type: "challenge", order: 3, xpReward: 200, estimatedMinutes: 60 },
        ],
      },
    ],
  },
  {
    _id: "mock-3",
    title: "Token-2022 & Extensions",
    slug: "token-2022",
    description: "Deep dive into Token-2022 — the next-generation SPL token standard. Master transfer hooks, confidential transfers, metadata pointers, non-transferable mints, and interest-bearing tokens.",
    difficulty: "advanced",
    durationHours: 5,
    xpReward: 2000,
    trackId: 4,
    instructor: { _id: "i3", name: "Pedro Carvalho", bio: "Token program specialist at Solana Labs", twitterHandle: "pedrotokens" },
    tags: ["token-2022", "extensions", "defi", "spl"],
    modules: [
      {
        _id: "m7", title: "Token-2022 Architecture", order: 1, lessons: [
          { _id: "l19", title: "From SPL Token to Token-2022", type: "content", order: 1, xpReward: 75, estimatedMinutes: 18 },
          { _id: "l20", title: "Extension System Deep Dive", type: "content", order: 2, xpReward: 75, estimatedMinutes: 20 },
          { _id: "l21", title: "Non-Transferable Tokens (Soulbound)", type: "challenge", order: 3, xpReward: 150, estimatedMinutes: 35 },
        ],
      },
      {
        _id: "m8", title: "Advanced Extensions", order: 2, lessons: [
          { _id: "l22", title: "Transfer Hooks", type: "content", order: 1, xpReward: 100, estimatedMinutes: 25 },
          { _id: "l23", title: "Metadata Pointer & Token Metadata", type: "content", order: 2, xpReward: 100, estimatedMinutes: 25 },
          { _id: "l24", title: "Build a Soulbound XP Token", type: "challenge", order: 3, xpReward: 250, estimatedMinutes: 60 },
        ],
      },
    ],
  },
  {
    _id: "mock-4",
    title: "DeFi on Solana: AMMs & DEXes",
    slug: "defi-amm",
    description: "Build a constant-product AMM from scratch. Understand liquidity pools, swap math, slippage, price impact, and flash loans. Learn how Raydium and Orca work under the hood.",
    difficulty: "advanced",
    durationHours: 8,
    xpReward: 2500,
    trackId: 3,
    instructor: { _id: "i4", name: "Rafael Souza", bio: "DeFi protocol engineer & MEV researcher", twitterHandle: "rafadefi" },
    tags: ["defi", "amm", "liquidity", "swap", "raydium"],
    modules: [
      {
        _id: "m9", title: "AMM Fundamentals", order: 1, lessons: [
          { _id: "l25", title: "Constant Product Formula (x·y=k)", type: "content", order: 1, xpReward: 75, estimatedMinutes: 20 },
          { _id: "l26", title: "Liquidity Providers & LP Tokens", type: "content", order: 2, xpReward: 75, estimatedMinutes: 20 },
          { _id: "l27", title: "Swap Math Challenge", type: "challenge", order: 3, xpReward: 200, estimatedMinutes: 45 },
        ],
      },
      {
        _id: "m10", title: "Building the AMM Program", order: 2, lessons: [
          { _id: "l28", title: "Pool Account Design", type: "content", order: 1, xpReward: 100, estimatedMinutes: 25 },
          { _id: "l29", title: "Initialize & Add Liquidity", type: "challenge", order: 2, xpReward: 250, estimatedMinutes: 60 },
          { _id: "l30", title: "Swap Instruction", type: "challenge", order: 3, xpReward: 300, estimatedMinutes: 90 },
        ],
      },
      {
        _id: "m11", title: "Security & Optimization", order: 3, lessons: [
          { _id: "l31", title: "Slippage Protection & Price Oracles", type: "content", order: 1, xpReward: 100, estimatedMinutes: 20 },
          { _id: "l32", title: "Reentrancy & Flash Loan Attacks", type: "content", order: 2, xpReward: 100, estimatedMinutes: 20 },
          { _id: "l33", title: "CU Optimization for DEX Programs", type: "challenge", order: 3, xpReward: 200, estimatedMinutes: 40 },
        ],
      },
    ],
  },
  {
    _id: "mock-5",
    title: "Solana Program Security",
    slug: "program-security",
    description: "Learn to audit and secure Solana programs. Study real exploit patterns: missing signer checks, account confusion, integer overflows, PDA collisions, and reentrancy. Build an immune program.",
    difficulty: "advanced",
    durationHours: 7,
    xpReward: 2200,
    trackId: 5,
    instructor: { _id: "i5", name: "Gabriela Torres", bio: "Security researcher at Superteam & audit firm lead", twitterHandle: "gabsec" },
    tags: ["security", "audit", "exploits", "rust"],
    modules: [
      {
        _id: "m12", title: "Attack Surface Overview", order: 1, lessons: [
          { _id: "l34", title: "Solana Security Model", type: "content", order: 1, xpReward: 75, estimatedMinutes: 20 },
          { _id: "l35", title: "Common Vulnerability Classes", type: "content", order: 2, xpReward: 75, estimatedMinutes: 25 },
          { _id: "l36", title: "Exploit Playground: Find the Bug", type: "challenge", order: 3, xpReward: 200, estimatedMinutes: 40 },
        ],
      },
      {
        _id: "m13", title: "Account Validation Attacks", order: 2, lessons: [
          { _id: "l37", title: "Missing Owner Checks", type: "content", order: 1, xpReward: 100, estimatedMinutes: 20 },
          { _id: "l38", title: "Account Confusion & Type Confusion", type: "content", order: 2, xpReward: 100, estimatedMinutes: 20 },
          { _id: "l39", title: "PDA Substitution Attack — Fix It", type: "challenge", order: 3, xpReward: 250, estimatedMinutes: 50 },
        ],
      },
      {
        _id: "m14", title: "Arithmetic & Logic Bugs", order: 3, lessons: [
          { _id: "l40", title: "Integer Overflow & Underflow", type: "content", order: 1, xpReward: 100, estimatedMinutes: 18 },
          { _id: "l41", title: "Rounding Errors in DeFi", type: "content", order: 2, xpReward: 100, estimatedMinutes: 18 },
          { _id: "l42", title: "Audit Challenge: Secure the Vault", type: "challenge", order: 3, xpReward: 300, estimatedMinutes: 60 },
        ],
      },
    ],
  },
];

interface CoursesPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ difficulty?: string; track?: string; q?: string }>;
}

export default async function CoursesPage({ searchParams }: CoursesPageProps) {
  const t = await getTranslations("courses");
  const { difficulty, track, q } = await searchParams;

  let courses = await getAllCourses().catch(() => [] as SanityCourse[]);
  if (courses.length === 0) courses = MOCK_COURSES;

  // Filter
  let filtered = courses;
  if (difficulty && difficulty !== "all") {
    filtered = filtered.filter((c) => c.difficulty === difficulty);
  }
  if (track) {
    filtered = filtered.filter((c) => c.trackId === Number(track));
  }
  if (q) {
    const query = q.toLowerCase();
    filtered = filtered.filter(
      (c) =>
        c.title.toLowerCase().includes(query) ||
        c.description.toLowerCase().includes(query)
    );
  }

  const difficulties: Array<{ value: string; label: string }> = [
    { value: "all", label: t("filters.all") },
    { value: "beginner", label: t("filters.beginner") },
    { value: "intermediate", label: t("filters.intermediate") },
    { value: "advanced", label: t("filters.advanced") },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-mono text-3xl font-bold text-[#EDEDED] mb-1">
          {t("title")}
        </h1>
        <p className="text-sm text-[#666666]">{t("subtitle")}</p>
      </div>

      {/* Search */}
      <form method="GET" action="" className="mb-4">
        {difficulty && <input type="hidden" name="difficulty" value={difficulty} />}
        {track && <input type="hidden" name="track" value={track} />}
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#666666] pointer-events-none" />
          <input
            type="text"
            name="q"
            defaultValue={q ?? ""}
            placeholder="Search courses..."
            className="w-full bg-[#111111] border border-[#1F1F1F] focus:border-[#14F195]/50 rounded pl-9 pr-3 py-1.5 text-sm font-mono text-[#EDEDED] placeholder-[#666666] focus:outline-none transition-colors"
          />
        </div>
      </form>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-8">
        {difficulties.map(({ value, label }) => {
          const filterQuery: Record<string, string> = {};
          if (value !== "all") filterQuery.difficulty = value;
          if (track) filterQuery.track = track;
          if (q) filterQuery.q = q;
          return (
            <Link
              key={value}
              href={{ pathname: "/courses", query: Object.keys(filterQuery).length ? filterQuery : undefined }}
              className={[
                "px-3 py-1.5 rounded text-xs font-mono transition-colors border",
                (difficulty ?? "all") === value
                  ? "bg-[#14F195] text-black border-[#14F195]"
                  : "bg-transparent text-[#666666] border-[#1F1F1F] hover:border-[#2E2E2E] hover:text-[#EDEDED]",
              ].join(" ")}
            >
              {label}
            </Link>
          );
        })}
        <span className="ml-auto text-xs text-[#666666] font-mono">
          {filtered.length} {filtered.length === 1 ? "course" : "courses"}
        </span>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 text-[#666666] font-mono text-sm">
          {t("empty")}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((course) => (
            <CourseCard key={course._id} course={course} />
          ))}
        </div>
      )}
    </div>
  );
}
