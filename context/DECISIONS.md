# Decisions Log

## Accepted Decisions

1. On-chain code is out of scope for this phase.
2. Priority is backend productionization first, then frontend pages.
3. Backend should stay simple and modular (separation of concern over clever abstractions).
4. Keep existing route paths and request semantics stable while refactoring internals.
5. Maintain context docs under `/context` for planning continuity.

## Backend Architectural Decisions

- Route composition in a thin entry file.
- Domain-based handlers (`course`, `credential`, `minter`, `achievement`, `config`).
- Shared validation and error libraries for consistency.
- Shared Solana helpers for account/program/ATA boilerplate.
- Cached keypair/program initialization for lower per-request overhead.

## Open Decisions

1. API authentication model:
   - static service token (faster)
   - signed nonce (stronger)
2. Rate-limit strategy:
   - in-memory
   - Redis-backed
3. First frontend phase cut:
   - learner-first only
   - learner + limited admin MVP
