// Test env defaults. Vitest does not load .env.local into process.env, so
// modules that read NEXT_PUBLIC_* at import time (e.g. lib/solana/pda.ts) need
// these set before any test file is collected. Override by exporting the var.
process.env.NEXT_PUBLIC_PROGRAM_ID ??=
  "7NeJaSRyb4Wxay3Tcd9bdpD7T3GWYUQSFyrhG8SgwE8V";

// Registers `toBeInTheDocument()`, `toBeDisabled()`, etc. globally for every
// test file — required by component tests that render real DOM (jsdom) and
// assert on it (e.g. diff-card.test.tsx).
import "@testing-library/jest-dom/vitest";
