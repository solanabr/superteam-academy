# Codama Kit SDK — Implementation Plan

**Date:** 2026-02-18

## Goal

Generate a Solana Kit-compatible TypeScript client for onchain-academy using Codama and @codama/renderers-js, with proper monorepo integration.

## Architecture

```
Anchor build → onchain-academy/target/idl/onchain_academy.json
                    ↓
              codama.json (at repo root)
                    ↓
         codama run js (@codama/renderers-js)
                    ↓
         sdk/src/generated/ (Kit client)
                    ↓
         tsup build → sdk/dist/
                    ↓
         app imports @superteam/academy-sdk (workspace:*)
```

## Files

| File | Purpose |
|------|---------|
| `codama.json` | IDL path, js script (renderers-js) |
| `package.json` (root) | codama, @codama/renderers-js, @codama/nodes-from-anchor, build:sdk script |
| `pnpm-workspace.yaml` | packages: app, sdk |
| `sdk/package.json` | @superteam/academy-sdk, tsup build, peerDep @solana/kit |
| `app/package.json` | @superteam/academy-sdk: workspace:* |

## Commands

```bash
# Full SDK build (from repo root)
pnpm build:sdk

# Regenerate after Anchor program changes
cd onchain-academy && anchor build && cd .. && pnpm codama:js && pnpm -C sdk build

# Codama only (IDL must exist)
pnpm codama:js
```

## Regeneration

1. Change Anchor program
2. `anchor build` (in onchain-academy)
3. `pnpm codama:js` (from root)
4. `pnpm -C sdk build`

Or: `pnpm build:sdk` does all steps.
