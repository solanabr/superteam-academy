// Test env defaults. Vitest does not load .env.local into process.env, so
// modules that read NEXT_PUBLIC_* at import time (e.g. lib/solana/pda.ts) need
// these set before any test file is collected. Override by exporting the var.
process.env.NEXT_PUBLIC_PROGRAM_ID ??=
  "7NeJaSRyb4Wxay3Tcd9bdpD7T3GWYUQSFyrhG8SgwE8V";

// Public + server env modules (lib/env.ts, lib/env.server.ts) validate eagerly
// at import time. Tests that pull a route or a `server-only` module through the
// module graph need these present so validation passes; `??=` keeps any real or
// per-test override winning.
process.env.NEXT_PUBLIC_SUPABASE_URL ??= "https://test.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??= "test-anon-key";
process.env.NEXT_PUBLIC_SOLANA_RPC_URL ??= "https://api.devnet.solana.com";
process.env.SUPABASE_SERVICE_ROLE_KEY ??= "test-service-role-key";
process.env.SOLANA_RPC_URL ??= "https://api.devnet.solana.com";

// Registers `toBeInTheDocument()`, `toBeDisabled()`, etc. globally for every
// test file — required by component tests that render real DOM (jsdom) and
// assert on it (e.g. diff-card.test.tsx).
import "@testing-library/jest-dom/vitest";
