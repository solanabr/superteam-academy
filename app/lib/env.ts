import { z } from "zod";

const clientSchema = z.object({
  NEXT_PUBLIC_SOLANA_NETWORK: z
    .enum(["mainnet", "devnet", "testnet"])
    .default("devnet"),
});

const clientEnv = {
  NEXT_PUBLIC_SOLANA_NETWORK: process.env.NEXT_PUBLIC_SOLANA_NETWORK,
};

const parsed = clientSchema.safeParse(clientEnv);

if (!parsed.success) {
  const pretty = z.prettifyError(parsed.error);
  console.error("Invalid environment variables:\n", pretty);
  throw new Error("Invalid environment variables");
}

export const env = parsed.data;
export type Env = z.infer<typeof clientSchema>;
