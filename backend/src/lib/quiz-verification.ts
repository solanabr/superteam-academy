import { createClient } from "@sanity/client";

interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
}

// Sanity client (optional)
const sanityClient = process.env.SANITY_PROJECT_ID
  ? createClient({
      projectId: process.env.SANITY_PROJECT_ID,
      dataset: process.env.SANITY_DATASET || "production",
      apiVersion: "2024-01-01",
      useCdn: true,
    })
  : null;

const quizCache = new Map<string, { data: QuizQuestion[]; ts: number }>();
const CACHE_TTL = 5 * 60 * 1000;

async function fetchSanityQuiz(courseId: string, lessonIndex: number): Promise<QuizQuestion[] | null> {
  if (!sanityClient) return null;
  const key = `${courseId}:${lessonIndex}`;
  const cached = quizCache.get(key);
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.data;

  try {
    const result = await sanityClient.fetch<{ quizQuestions: QuizQuestion[] } | null>(
      `*[_type == "lesson" && course->courseId == $courseId && lessonIndex == $lessonIndex][0]{quizQuestions}`,
      { courseId, lessonIndex }
    );
    if (result?.quizQuestions?.length) {
      quizCache.set(key, { data: result.quizQuestions, ts: Date.now() });
      return result.quizQuestions;
    }
  } catch { /* fall through */ }
  return null;
}

// Hardcoded fallback quiz data
const QUIZ_DATA: Record<string, Record<number, QuizQuestion[]>> = {
  "solana-101": {
    0: [{ question: "What consensus mechanism does Solana use?", options: ["Proof of Work", "Proof of Stake", "Proof of History + Tower BFT", "Delegated Proof of Stake"], correctIndex: 2 }],
    1: [{ question: "What is an SPL Token?", options: ["A Solana smart contract", "Solana Program Library token standard", "A consensus algorithm", "A wallet type"], correctIndex: 1 }],
    2: [{ question: "What are PDAs?", options: ["Private Data Accounts", "Program Derived Addresses", "Public Data Arrays", "Protocol Data Anchors"], correctIndex: 1 }],
    3: [{ question: "What is the Solana runtime?", options: ["JavaScript engine", "Sealevel parallel execution engine", "Docker container", "WebAssembly runtime"], correctIndex: 1 }],
    4: [{ question: "What is Solana's block time?", options: ["10 minutes", "12 seconds", "~400 milliseconds", "1 second"], correctIndex: 2 }],
  },
  "anchor-101": {
    0: [{ question: "What is Anchor?", options: ["A Solana wallet", "A framework for Solana programs", "A token standard", "A consensus mechanism"], correctIndex: 1 }],
    1: [{ question: "What does #[account] do in Anchor?", options: ["Creates a wallet", "Defines account serialization/deserialization", "Sends transactions", "Generates keypairs"], correctIndex: 1 }],
    2: [{ question: "What is an IDL?", options: ["Interface Definition Language for program API", "Internal Data Layer", "Integrated Development Library", "Input Data Logger"], correctIndex: 0 }],
    3: [{ question: "How are errors handled in Anchor?", options: ["Try-catch blocks", "Error enum with #[error_code]", "Panic messages", "Return codes"], correctIndex: 1 }],
    4: [{ question: "What is anchor test?", options: ["Unit test runner", "Integration test runner with local validator", "Linter", "Formatter"], correctIndex: 1 }],
  },
  "defi-fundamentals": {
    0: [{ question: "What is an AMM?", options: ["Automated Market Maker", "Advanced Mining Module", "Atomic Message Manager", "Asset Management Model"], correctIndex: 0 }],
    1: [{ question: "What is impermanent loss?", options: ["Permanent token loss", "Temporary loss vs holding due to price divergence", "Transaction fee loss", "Slippage loss"], correctIndex: 1 }],
    2: [{ question: "What is a liquidity pool?", options: ["A mining pool", "Token reserves enabling trading", "A staking mechanism", "A governance vault"], correctIndex: 1 }],
    3: [{ question: "What is TVL?", options: ["Token Value Locked", "Total Value Locked in a protocol", "Transaction Verification Layer", "Token Validation Logic"], correctIndex: 1 }],
    4: [{ question: "What is yield farming?", options: ["Mining cryptocurrency", "Earning rewards by providing liquidity", "Staking tokens", "Day trading"], correctIndex: 1 }],
  },
};

export async function hasQuiz(
  courseId: string,
  lessonIndex: number
): Promise<boolean> {
  const sanityQuestions = await fetchSanityQuiz(courseId, lessonIndex);
  if (sanityQuestions?.length) return true;
  return !!QUIZ_DATA[courseId]?.[lessonIndex]?.length;
}

export async function verifyAnswers(
  courseId: string,
  lessonIndex: number,
  answers: number[]
): Promise<boolean> {
  // Try Sanity first
  const sanityQuestions = await fetchSanityQuiz(courseId, lessonIndex);
  if (sanityQuestions) {
    return sanityQuestions.every((q, i) => answers[i] === q.correctIndex);
  }

  // Fallback to hardcoded
  const questions = QUIZ_DATA[courseId]?.[lessonIndex];
  if (!questions) return true; // no quiz = auto-pass
  return questions.every((q, i) => answers[i] === q.correctIndex);
}
