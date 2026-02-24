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

// Hardcoded fallback quiz data — must match app/lib/quiz-data.ts
const QUIZ_DATA: Record<string, Record<number, QuizQuestion[]>> = {
  "solana-101": {
    0: [{ question: "What consensus mechanism does Solana use?", options: ["Proof of Work", "Proof of History", "Proof of Authority", "Delegated PoS"], correctIndex: 1 }],
    1: [{ question: "What is a Program Derived Address (PDA)?", options: ["A wallet address", "A deterministic address derived from seeds and a program ID", "An NFT address", "A validator address"], correctIndex: 1 }],
    2: [{ question: "Which token standard does Solana XP use?", options: ["SPL Token", "Token-2022", "ERC-20", "Metaplex"], correctIndex: 1 }],
    3: [{ question: "What makes Token-2022 different from SPL Token?", options: ["Nothing", "Extensions like NonTransferable and PermanentDelegate", "It only works on devnet", "It uses more SOL"], correctIndex: 1 }],
    4: [{ question: "What framework is used to build this program?", options: ["Hardhat", "Foundry", "Anchor", "Truffle"], correctIndex: 2 }],
  },
  "anchor-101": {
    0: [{ question: "What does the #[account] attribute do in Anchor?", options: ["Creates a new token", "Defines account deserialization and validation", "Sends a transaction", "Deploys a program"], correctIndex: 1 }],
    1: [{ question: "How are PDAs derived in Anchor?", options: ["Random generation", "Using seeds and findProgramAddressSync", "Manual assignment", "From the wallet"], correctIndex: 1 }],
    2: [{ question: "What is the purpose of the bump seed?", options: ["To increase gas fees", "To ensure the PDA is off the ed25519 curve", "To validate transactions", "To create tokens"], correctIndex: 1 }],
    3: [{ question: "Which constraint ensures only the authority can call an instruction?", options: ["has_one", "init", "mut", "seeds"], correctIndex: 0 }],
    4: [{ question: "What does #[error_code] generate?", options: ["Transaction logs", "Custom error types with codes and messages", "Account structs", "Event listeners"], correctIndex: 1 }],
  },
  "defi-fundamentals": {
    0: [{ question: "What is an Automated Market Maker (AMM)?", options: ["A centralized exchange", "A protocol that uses math formulas for asset pricing", "A wallet", "A blockchain"], correctIndex: 1 }],
    1: [{ question: "What is impermanent loss?", options: ["Losing your private key", "Loss from price divergence between pooled assets", "Transaction fee", "Slippage"], correctIndex: 1 }],
    2: [{ question: "What is TVL?", options: ["Transaction Verification Layer", "Total Value Locked in a protocol", "Token Validation Logic", "Transfer Volume Limit"], correctIndex: 1 }],
    3: [{ question: "What is a flash loan?", options: ["A loan with high interest", "An uncollateralized loan repaid within one transaction", "A bank loan", "A staking reward"], correctIndex: 1 }],
    4: [{ question: "Which Solana DEX uses concentrated liquidity?", options: ["Raydium", "Orca", "Jupiter", "Marinade"], correctIndex: 1 }],
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
