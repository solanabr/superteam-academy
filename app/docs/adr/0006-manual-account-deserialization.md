# ADR 0006: Manual On-Chain Account Deserialization

**Date:** 2026-02-12
**Status:** Accepted

## Context

The frontend reads on-chain state from three Anchor account types:

- **Config PDA**: authority, backend signer, XP mint address
- **Course PDA**: course ID, lesson count, XP per lesson, track ID, active status
- **Enrollment PDA**: course reference, enrolled/completed timestamps, lesson flags bitmap

The standard approach is to use the Anchor client library (`@coral-xyz/anchor`) which provides `program.account.Config.fetch()` with automatic deserialization via the IDL.

## Decision

**Manually deserialize** Anchor accounts from raw `Buffer` data instead of using the Anchor client's account fetchers.

### Implementation

Deserialization functions in `src/lib/onchain/deserializers.ts`:

```typescript
// Skip 8-byte Anchor discriminator, then read fields sequentially
function deserializeConfig(data: Buffer): ConfigData {
  let offset = 8; // skip discriminator
  const authority = readPubkey(data, offset); offset += 32;
  const backendSigner = readPubkey(data, offset); offset += 32;
  const xpMint = readPubkey(data, offset);
  return { authority, backendSigner, xpMint };
}
```

Helper functions: `readU8`, `readU32`, `readPubkey`, `readString` (Borsh-encoded), `readLessonFlags` (4x u64 bitmap).

### Account Fetch Pattern

```typescript
const accountInfo = await connection.getAccountInfo(pda);
if (!accountInfo?.data) return null;
return deserializeConfig(accountInfo.data);
```

## Consequences

### Positive

- **Smaller bundle**: The Anchor client library (`@coral-xyz/anchor`) pulls in `bn.js`, `borsh`, `buffer-layout`, `superstruct`, and other dependencies (~150KB minified). Manual deserialization uses only `@solana/web3.js` which is already required for wallet adapter.
- **No IDL at runtime**: The Anchor IDL JSON (~50KB for this program) doesn't need to be bundled. Type safety comes from TypeScript interfaces, not runtime IDL parsing.
- **Predictable**: Raw buffer reads have no hidden behavior. Each field's offset and encoding is explicit in the deserialization function.
- **Tree-shakeable**: Only the deserialization functions that are actually used are included in the bundle. The Anchor client loads the full program interface.

### Negative

- **Fragile to program changes**: If the Anchor program adds, removes, or reorders account fields, the manual deserialization breaks silently (reads wrong data). The Anchor client would catch this via IDL version mismatch.
- **No write helpers**: Manual deserialization is read-only. Transaction building for `enroll` and `close_enrollment` also uses manual instruction encoding (SHA-256 discriminator + Borsh-encoded args) instead of Anchor's `program.methods.enroll()`. This is more code to maintain.
- **Borsh edge cases**: String fields (Borsh-encoded with u32 length prefix) and bitmap arrays require careful handling. The helper functions are well-tested but less battle-tested than Anchor's deserializer.

### Alternatives Considered

- **Full Anchor client**: Would provide `program.account.Config.fetch()` with automatic deserialization. Simpler code but adds ~150KB to the client bundle. For a frontend that only reads 3 account types, the bundle cost outweighs the convenience.
- **Codama / Kinobi generated client**: The Solana ecosystem's newer code generation tools can produce lightweight, typed clients from an IDL. Would be the ideal middle ground but adds a build step and code generation dependency.
- **Server-side deserialization only**: Move all RPC reads to API routes or server components. Would keep the Anchor client out of the client bundle entirely but adds API latency for wallet-dependent reads.
