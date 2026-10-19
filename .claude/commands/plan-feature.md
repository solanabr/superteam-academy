---
description: "Plan feature implementation with technical specifications for Solana projects"
---

Create a detailed implementation plan for a feature of Superteam Academy.

## Feature Description

$ARGUMENTS

## This repo

Most features touch more than the program: the Next.js app and its API routes (`apps/web`),
Supabase migrations (`supabase/migrations`), the course content repo, and sometimes the Pinocchio
program (`onchain-academy`). Plan every layer the feature reaches, read each area's `CLAUDE.md`,
and state the risk tier per `REVIEW.md`. Skip the on-chain sections when the program doesn't change.

## Planning Framework

### 1. Feature Analysis

Break down the feature into:

**User Stories**

- As a [user type], I want to [action] so that [benefit]

**Technical Requirements**

- On-chain components (programs, accounts)
- Off-chain components (clients, indexers)
- Integration points

**Dependencies**

- External programs (Token, Metaplex, etc.)
- SDKs and libraries
- Infrastructure (RPC, indexer)

**Edge Cases**

- Error conditions
- Boundary values
- Concurrent access

**Success Criteria**

- Functional requirements met
- Security requirements met
- Performance targets met

### 2. Architecture Design

**On-Chain Architecture**

```
┌─────────────────────────────────────────────────┐
│                  Your Program                    │
├─────────────────────────────────────────────────┤
│  Instructions      │  Accounts       │  Events  │
│  - initialize      │  - UserAccount  │  - Init  │
│  - action          │  - StateAccount │  - Action│
│  - close           │  - VaultPDA     │  - Close │
└─────────────────────────────────────────────────┘
          │                    │
          ▼                    ▼
┌─────────────────┐  ┌─────────────────┐
│  Token Program  │  │  System Program │
└─────────────────┘  └─────────────────┘
```

**Client Architecture**

```
┌──────────────┐     ┌──────────────────┐     ┌──────────────┐
│   Frontend   │────▶│  lib/solana      │────▶│     RPC      │
│  (Next.js)   │     │  (web3.js 1.x +  │     │   (Helius)   │
│              │     │  anchor client)  │     │              │
└──────────────┘     └──────────────────┘     └──────────────┘
        │
        ▼
  API routes (apps/web/src/app/api) ──▶ Supabase (RLS) + backend-signed txs
```

**Data Flow**

```
User Action → Frontend → Transaction Build → Sign → Send → Confirm → Update UI
```

### 3. Account Design

For each account type:

```markdown
### [AccountName]

**Purpose:** [What this account stores]

**Seeds (if PDA):** `["prefix", key1, key2]`

**Size:** [Calculate exact bytes]

| Field         | Type    | Size  | Description                              |
| ------------- | ------- | ----- | ---------------------------------------- |
| discriminator | [u8; 8] | 8     | 8-byte discriminator (Anchor-compatible) |
| field1        | Pubkey  | 32    | Description                              |
| field2        | u64     | 8     | Description                              |
| **Total**     |         | **X** | + rent exempt                            |

**Rent:** ~X.XXX SOL

**Lifecycle:**

1. Created by: [instruction]
2. Modified by: [instructions]
3. Closed by: [instruction]
```

### 4. Instruction Design

For each instruction:

```markdown
### `instruction_name`

**Purpose:** [What it does]

**Accounts:**
| Name | Type | Description |
|------|------|-------------|
| user | Signer, Mut | Pays for transaction |
| state | Mut | State to modify |
| system_program | Program | For account creation |

**Arguments:**
| Name | Type | Validation |
|------|------|------------|
| amount | u64 | > 0, <= balance |

**Logic:**

1. Validate inputs
2. Check permissions
3. Perform action
4. Emit event

**Errors:**
| Error | When |
|-------|------|
| InvalidAmount | amount == 0 |
| Unauthorized | signer != authority |

**CU Estimate:** ~X,XXX CU
```

### 5. Implementation Phases

```markdown
## Phase 1: Foundation (Day 1)

### What will be implemented:

- [ ] Project setup and dependencies
- [ ] Account structures
- [ ] Basic instruction scaffolding

### Files to create:

- `onchain-academy/programs/onchain-academy-pinocchio/src/state/` - Account layouts
- `onchain-academy/programs/onchain-academy-pinocchio/src/instructions/` - Instruction handlers
- `supabase/migrations/<timestamp>_<what>.sql` - Tables, RLS, functions

### What to review:

- Account sizes calculated correctly
- PDA seeds are unique and deterministic
- Dependencies are correct versions

---

## Phase 2: Core Logic (Day 2-3)

### What will be implemented:

- [ ] Initialize instruction
- [ ] Main feature instruction(s)
- [ ] Event emission

### Files to create/modify:

- `onchain-academy/programs/onchain-academy-pinocchio/src/instructions/<name>.rs`
- `onchain-academy/programs/onchain-academy-pinocchio/src/{lib.rs,errors.rs,events.rs}`
- `onchain-academy/idl/onchain_academy.json` and the copies in `apps/web/src/lib/solana/idl/`

### What to review:

- All validations in place
- Error handling complete
- Events contain necessary data

---

## Phase 3: Testing (Day 3-4)

### What will be implemented:

- [ ] Unit tests for each instruction
- [ ] Integration tests for flows
- [ ] Edge case testing

### Files to create:

- `onchain-academy/programs/onchain-academy-pinocchio/tests/` - Layout and parity tests
- `onchain-academy/tests/differential/` - LiteSVM instruction tests
- `apps/web/src/**/__tests__/` - Vitest; `apps/web/e2e/` - Playwright

### What to review:

- All success paths tested
- All error conditions tested
- Concurrent access scenarios

---

## Phase 4: Client Integration (Day 4-5)

### What will be implemented:

- [ ] Instruction builders and account reads
- [ ] API routes and UI
- [ ] UI strings in all three locale files

### Files to create:

- `apps/web/src/lib/solana/instructions.ts` - Client-side instruction builders
- `apps/web/src/lib/solana/academy-reads.ts`, `academy-program.ts` - Reads and backend-signed calls
- `apps/web/src/app/api/<route>/route.ts` - API routes
- `apps/web/src/messages/{en,pt-BR,es}.json` - Strings

### What to review:

- Error handling in client
- Loading states
- Transaction confirmation UX

---

## Phase 5: Polish & Deploy (Day 5-6)

### What will be implemented:

- [ ] Documentation
- [ ] Devnet deployment
- [ ] Final testing on devnet

### Files to create:

- `docs/SPEC.md`, `docs/ARCHITECTURE.md` - Update what changed
- Devnet deploy per `docs/DEPLOY-PROGRAM.md` (Helius only)

### What to review:

- Documentation complete
- Devnet tests pass
- Ready for audit (if needed)
```

### 6. Risk Assessment

```markdown
## Risks and Mitigations

### Technical Risks

| Risk                     | Likelihood | Impact   | Mitigation                      |
| ------------------------ | ---------- | -------- | ------------------------------- |
| CU limits exceeded       | Medium     | High     | Profile early, optimize         |
| Account size too small   | Low        | High     | Calculate carefully, add buffer |
| Reentrancy vulnerability | Low        | Critical | Use checks-effects-interactions |

### Integration Risks

| Risk                     | Likelihood | Impact | Mitigation            |
| ------------------------ | ---------- | ------ | --------------------- |
| External program changes | Low        | Medium | Pin versions, monitor |
| RPC rate limits          | Medium     | Medium | Use dedicated RPC     |

### Timeline Risks

| Risk                      | Likelihood | Impact | Mitigation          |
| ------------------------- | ---------- | ------ | ------------------- |
| Underestimated complexity | High       | Medium | Add buffer time     |
| Testing reveals issues    | Medium     | Medium | Test early, iterate |
```

### 7. Security Checklist

```markdown
## Security Considerations

### Access Control

- [ ] All instructions check signer authority
- [ ] PDAs use appropriate seeds
- [ ] No unauthorized account modifications

### Input Validation

- [ ] All numeric inputs have bounds checks
- [ ] String inputs have length limits
- [ ] Account ownership verified

### Economic Security

- [ ] No fund extraction vulnerabilities
- [ ] Proper rent handling
- [ ] No arithmetic overflow/underflow

### Program Security

- [ ] CPI calls verify program IDs
- [ ] No unvalidated account reuse
- [ ] Proper error handling (no silent failures)
```

### 8. Testing Strategy

```markdown
## Testing Plan

### Unit Tests

- [ ] Each instruction in isolation
- [ ] Each error condition
- [ ] Boundary values

### Integration Tests

- [ ] Complete user flows
- [ ] Multi-instruction sequences
- [ ] Concurrent operations

### Security Tests

- [ ] Unauthorized access attempts
- [ ] Invalid input handling
- [ ] Edge case exploitation

### Performance Tests

- [ ] CU profiling
- [ ] Transaction size verification
- [ ] Latency under load
```

## Output Format

### Feature Overview

- What problem does this solve?
- Who is it for?
- Key functionality

### Technical Design

- Account structure diagram
- Instruction flow diagram
- Data flow diagram

### Implementation Plan

- Phased task breakdown
- File changes list
- Dependencies

### Risk Assessment

- Technical risks
- Timeline risks
- Mitigations

### Success Criteria

- Functional checklist
- Security checklist
- Performance targets

### Next Steps

1. Review plan
2. Set up environment
3. Start Phase 1
4. Test incrementally
5. Deploy to devnet
6. Production deploy

Provide a clear, actionable plan that can be executed phase by phase with clear milestones and review checkpoints.
