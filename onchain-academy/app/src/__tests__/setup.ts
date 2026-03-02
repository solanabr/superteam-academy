import { afterEach } from "vitest";

// Stub env vars required by constants.ts → env.ts
process.env.NEXT_PUBLIC_SOLANA_NETWORK = "devnet";
process.env.NEXT_PUBLIC_PROGRAM_ID = "11111111111111111111111111111111";
process.env.NEXT_PUBLIC_XP_MINT_ADDRESS = "11111111111111111111111111111111";
process.env.NEXT_PUBLIC_CREDENTIAL_COLLECTION =
  "11111111111111111111111111111111";
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://placeholder.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "placeholder";
process.env.NEXT_PUBLIC_SANITY_PROJECT_ID = "placeholder";
process.env.NEXT_PUBLIC_SANITY_DATASET = "production";

afterEach(() => {
  localStorage.clear();
});
