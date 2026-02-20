
import { prisma } from "@/lib/db";
import { createLearningProgressService } from "@/lib/learning-progress/prisma-impl";
import { OnChainLearningService } from "@/lib/learning-progress/onchain-impl";
import { Connection } from "@solana/web3.js";

const USE_ONCHAIN = process.env.NEXT_PUBLIC_USE_ONCHAIN === "true";

export const learningProgressService = USE_ONCHAIN
    ? new OnChainLearningService(new Connection(process.env.NEXT_PUBLIC_RPC_URL || "https://api.devnet.solana.com"))
    : createLearningProgressService(prisma);
