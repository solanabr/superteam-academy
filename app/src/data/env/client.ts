import { createEnv } from "@t3-oss/env-nextjs"
import { z } from "zod"

export const env = createEnv({
  client: {
    NEXT_PUBLIC_SERVER_URL: z.string().min(1).optional(),
    NEXT_PUBLIC_SOLANA_RPC_URL: z.string().min(1).optional(),
    NEXT_PUBLIC_SOLANA_NETWORK: z.enum(["mainnet-beta", "devnet", "testnet"]).optional(),
    NEXT_PUBLIC_SANITY_PROJECT_ID: z.string().min(1).optional(),
    NEXT_PUBLIC_SANITY_DATASET: z.string().min(1).optional(),
    NEXT_PUBLIC_GA_ID: z.string().min(1).optional(),
  },
  experimental__runtimeEnv: {
    NEXT_PUBLIC_SERVER_URL: process.env.NEXT_PUBLIC_SERVER_URL,
    NEXT_PUBLIC_SOLANA_RPC_URL: process.env.NEXT_PUBLIC_SOLANA_RPC_URL,
    NEXT_PUBLIC_SOLANA_NETWORK: process.env.NEXT_PUBLIC_SOLANA_NETWORK,
    NEXT_PUBLIC_SANITY_PROJECT_ID: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
    NEXT_PUBLIC_SANITY_DATASET: process.env.NEXT_PUBLIC_SANITY_DATASET,
    NEXT_PUBLIC_GA_ID: process.env.NEXT_PUBLIC_GA_ID,
  },
})