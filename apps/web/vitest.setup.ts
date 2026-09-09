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
process.env.NEXT_PUBLIC_APP_URL ??= "http://localhost:3000";
process.env.SUPABASE_SERVICE_ROLE_KEY ??= "test-service-role-key";
process.env.SOLANA_RPC_URL ??= "https://api.devnet.solana.com";

// jsdom installs its OWN `Uint8Array` on the global, from a different realm
// than Node's `Buffer`. `@solana/buffer-layout` type-checks with
// `b instanceof Uint8Array` against whatever global was in scope when it
// loaded, so under jsdom every web3.js instruction encode (e.g.
// `SystemProgram.transfer`) fails with "b must be a Uint8Array" even though the
// value IS one. Restoring Node's constructor before any test module imports
// web3.js is what lets component tests exercise real transaction building.
if (typeof window !== "undefined") {
  const nodeUint8Array = Object.getPrototypeOf(Buffer.prototype).constructor;
  globalThis.Uint8Array = nodeUint8Array;
  window.Uint8Array = nodeUint8Array;
}

// Registers `toBeInTheDocument()`, `toBeDisabled()`, etc. globally for every
// test file — required by component tests that render real DOM (jsdom) and
// assert on it (e.g. diff-card.test.tsx).
import "@testing-library/jest-dom/vitest";
