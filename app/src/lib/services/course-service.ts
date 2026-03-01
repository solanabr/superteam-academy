import { PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import { getConnection } from "@/lib/solana/connection";
import { getCoursePda, getEnrollmentPda, getConfigPda } from "@/lib/solana/pda";
import { Course, Enrollment, PROGRAM_ID, CourseAccount } from "@/types/academy";
import { BN } from "@coral-xyz/anchor";
import { countCompletedLessons } from "@/lib/utils/bitmap";

// ─── Mock course data for demo (supplements on-chain data) ───────
const MOCK_COURSES_META: Record<string, { title: string; description: string; imageUrl: string; lessons: string[] }> = {
  "anchor-101": {
    title: "Anchor 101: Building on Solana",
    description: "Learn the fundamentals of building Solana programs with the Anchor framework. From PDAs to CPIs, master the building blocks of on-chain development.",
    imageUrl: "/images/course-anchor.svg",
    lessons: [
      "Introduction to Anchor",
      "Setting Up Your Environment",
      "Understanding PDAs",
      "Account Validation",
      "Instruction Handlers",
      "Error Handling",
      "Cross-Program Invocations",
      "Token Operations",
      "Testing with Bankrun",
      "Deploying to Devnet",
    ],
  },
  "defi-101": {
    title: "DeFi Fundamentals on Solana",
    description: "Understand decentralized finance protocols on Solana. Build AMMs, lending protocols, and understand yield farming mechanics.",
    imageUrl: "/images/course-defi.svg",
    lessons: [
      "DeFi Primitives",
      "Token Swaps & AMMs",
      "Liquidity Pools",
      "Lending & Borrowing",
      "Oracle Integration",
      "Yield Farming",
      "Risk Management",
      "Protocol Security",
    ],
  },
  "nft-metaplex": {
    title: "NFTs with Metaplex Core",
    description: "Master NFT creation and management using Metaplex Core. Learn about collections, plugins, and soulbound tokens.",
    imageUrl: "/images/course-nft.svg",
    lessons: [
      "Metaplex Core Overview",
      "Creating Collections",
      "Minting Assets",
      "Plugin System",
      "Soulbound Tokens",
      "Marketplace Integration",
    ],
  },
  "client-dev": {
    title: "Solana Client Development",
    description: "Build production-ready frontends for Solana dApps using TypeScript, React, and the Solana Web3.js SDK.",
    imageUrl: "/images/course-client.svg",
    lessons: [
      "Web3.js Fundamentals",
      "Wallet Adapter Setup",
      "Transaction Building",
      "Account Deserialization",
      "Real-time Subscriptions",
      "Error Handling Patterns",
      "Performance Optimization",
    ],
  },
  "security-101": {
    title: "Solana Security & Auditing",
    description: "Learn to identify and prevent common vulnerabilities in Solana programs. Understand attack vectors and audit methodologies.",
    imageUrl: "/images/course-security.svg",
    lessons: [
      "Common Vulnerabilities",
      "Account Validation Attacks",
      "Arithmetic Overflows",
      "Reentrancy on Solana",
      "PDA Manipulation",
      "Audit Methodology",
      "Formal Verification",
      "Bug Bounty Programs",
      "Incident Response",
    ],
  },
};

export function getCourseMetadata(courseId: string) {
  return MOCK_COURSES_META[courseId] || {
    title: courseId.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    description: "A Superteam Academy course on Solana development.",
    imageUrl: "/images/course-default.svg",
    lessons: Array.from({ length: 5 }, (_, i) => `Lesson ${i + 1}`),
  };
}

// ─── On-chain course fetching ────────────────────────────────────
export async function fetchAllCourses(): Promise<Course[]> {
  // In production, this would fetch from the on-chain program
  // For the bounty demo, we return structured mock data that matches the program schema
  const courses: Course[] = [
    {
      publicKey: getCoursePda("anchor-101"),
      courseId: "anchor-101",
      creator: new PublicKey("ACAd3USj2sMV6drKcMY2wZtNkhVDHWpC4tfJe93hgqYn"),
      lessonCount: 10,
      difficulty: 1,
      xpPerLesson: 100,
      trackId: 1,
      trackLevel: 1,
      prerequisite: null,
      isActive: true,
      totalCompletions: 47,
      totalXp: 1500, // 10*100 + floor(10*100/2) = 1500
    },
    {
      publicKey: getCoursePda("defi-101"),
      courseId: "defi-101",
      creator: new PublicKey("ACAd3USj2sMV6drKcMY2wZtNkhVDHWpC4tfJe93hgqYn"),
      lessonCount: 8,
      difficulty: 2,
      xpPerLesson: 150,
      trackId: 2,
      trackLevel: 1,
      prerequisite: null,
      isActive: true,
      totalCompletions: 23,
      totalXp: 1800,
    },
    {
      publicKey: getCoursePda("nft-metaplex"),
      courseId: "nft-metaplex",
      creator: new PublicKey("ACAd3USj2sMV6drKcMY2wZtNkhVDHWpC4tfJe93hgqYn"),
      lessonCount: 6,
      difficulty: 2,
      xpPerLesson: 200,
      trackId: 3,
      trackLevel: 1,
      prerequisite: null,
      isActive: true,
      totalCompletions: 31,
      totalXp: 1800,
    },
    {
      publicKey: getCoursePda("client-dev"),
      courseId: "client-dev",
      creator: new PublicKey("ACAd3USj2sMV6drKcMY2wZtNkhVDHWpC4tfJe93hgqYn"),
      lessonCount: 7,
      difficulty: 1,
      xpPerLesson: 120,
      trackId: 4,
      trackLevel: 1,
      prerequisite: null,
      isActive: true,
      totalCompletions: 56,
      totalXp: 1260,
    },
    {
      publicKey: getCoursePda("security-101"),
      courseId: "security-101",
      creator: new PublicKey("ACAd3USj2sMV6drKcMY2wZtNkhVDHWpC4tfJe93hgqYn"),
      lessonCount: 9,
      difficulty: 3,
      xpPerLesson: 250,
      trackId: 5,
      trackLevel: 1,
      prerequisite: "anchor-101",
      isActive: true,
      totalCompletions: 12,
      totalXp: 3375,
    },
  ];
  return courses;
}

export async function fetchEnrollment(
  courseId: string,
  learner: PublicKey
): Promise<Enrollment | null> {
  // In production: fetch enrollment PDA from on-chain
  // Returns null if not enrolled
  return null;
}

export async function buildEnrollTransaction(
  courseId: string,
  learner: PublicKey
): Promise<Transaction> {
  // Build the enroll instruction
  // In production, this uses the Anchor program client
  const coursePda = getCoursePda(courseId);
  const enrollmentPda = getEnrollmentPda(courseId, learner);
  const configPda = getConfigPda();

  // Placeholder transaction — in production this would use program.methods.enroll()
  const tx = new Transaction();
  // The actual instruction would be added here via Anchor
  // For now we create a memo-style transaction to demonstrate wallet interaction
  return tx;
}

// ─── Stub interfaces for backend-signed operations ───────────────
export interface LessonCompletionService {
  completeLesson(courseId: string, lessonIndex: number, learner: PublicKey): Promise<string>;
}

export interface CourseFinalizationService {
  finalizeCourse(courseId: string, learner: PublicKey): Promise<string>;
}

export interface CredentialIssuanceService {
  issueCredential(courseId: string, learner: PublicKey): Promise<string>;
}

// Stub implementations
export const lessonCompletionService: LessonCompletionService = {
  async completeLesson(courseId, lessonIndex, learner) {
    console.log(`[STUB] Would complete lesson ${lessonIndex} for ${courseId} by ${learner.toBase58()}`);
    throw new Error("Lesson completion requires backend signer — not available in demo mode");
  },
};

export const courseFinalizationService: CourseFinalizationService = {
  async finalizeCourse(courseId, learner) {
    console.log(`[STUB] Would finalize course ${courseId} for ${learner.toBase58()}`);
    throw new Error("Course finalization requires backend signer — not available in demo mode");
  },
};

export const credentialIssuanceService: CredentialIssuanceService = {
  async issueCredential(courseId, learner) {
    console.log(`[STUB] Would issue credential for ${courseId} to ${learner.toBase58()}`);
    throw new Error("Credential issuance requires backend signer — not available in demo mode");
  },
};
