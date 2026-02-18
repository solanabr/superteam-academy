---
module: SDK / Client Generation
date: 2026-02-18
problem_type: setup
symptoms:
  - "Need Kit-native TypeScript client from Anchor program"
  - "Want repeatable codegen pipeline"
root_cause: manual_client_maintenance
severity: medium
tags: [codama, solana-kit, idl, codegen]
---

# Codama Kit SDK Generation — Superteam Academy

## Problem

Need a Solana Kit-compatible TypeScript client generated from the onchain-academy Anchor program, with a repeatable pipeline and proper monorepo integration.

## Solution

Use [Codama](https://github.com/codama-idl/codama) with @codama/renderers-js to generate a Kit-native client. Anchor IDL is auto-converted via @codama/nodes-from-anchor.

## Prerequisites

- Anchor program builds successfully
- `onchain-academy/target/idl/onchain_academy.json` exists (from `anchor build`)
- pnpm workspace at repo root (app, sdk packages)

## File Layout

```
superteam-academy/
├── codama.json              # IDL path, js script
├── package.json             # codama, renderers-js, nodes-from-anchor, build:sdk
├── pnpm-workspace.yaml      # packages: app, sdk
├── onchain-academy/
│   └── target/idl/onchain_academy.json
├── sdk/
│   ├── package.json
│   ├── src/
│   │   ├── index.ts         # export * from './generated'
│   │   └── generated/       # Codama output (DO NOT EDIT)
│   └── dist/                # tsup build output
└── app/
    └── package.json         # @superteam/academy-sdk: workspace:*
```

## Commands

| Command | Purpose |
|---------|---------|
| `pnpm build:sdk` | Full pipeline: anchor build → codama → sdk build |
| `pnpm codama:js` | Regenerate SDK from existing IDL |
| `cd onchain-academy && anchor build` | Produce/update IDL |

## Regeneration

1. Edit Anchor program
2. `anchor build` (in onchain-academy)
3. `pnpm codama:js` (from root)
4. `pnpm -C sdk build`

## Usage in App

```ts
import { getOnchainAcademyProgramId, createOnchainAcademyClient } from "@superteam/academy-sdk";
```

## Troubleshooting

- **"Cannot proceed without Anchor IDL support"** — Install `@codama/nodes-from-anchor` in root devDependencies.
- **IDL not found** — Run `anchor build` in onchain-academy first.
- **App build fails on @superteam/academy-sdk** — Run `pnpm build:sdk` before `pnpm -C app build`.
