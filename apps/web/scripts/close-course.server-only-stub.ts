// Stub for the `server-only` marker package, used only by
// `close-course.tsconfig.json`'s `paths` remap. The real package throws
// unconditionally on import outside the `react-server` condition (see
// node_modules/server-only/index.js) — fine inside Next.js, fatal under plain
// `tsx`. `close-course.ts` imports `@/lib/solana/admin-signer`, which imports
// `server-only`; this empty module lets that import graph resolve under tsx
// without needing `--conditions=react-server` (which would flip React into
// its RSC-only subset and crash the run).
export {};
