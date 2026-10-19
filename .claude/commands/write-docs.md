---
description: "Generate documentation for Solana programs, APIs, and components"
---

Generate comprehensive documentation for Solana blockchain code.

## Code to Document

$ARGUMENTS

## Related Context

- **The program**: `docs/SPEC.md` is the authoritative program spec; the IDL is
  `onchain-academy/idl/onchain_academy.json`
- **Existing docs**: `docs/` (architecture, deploy runbooks, admin guide). Update the doc that
  already covers the topic before adding a new one
- **Style**: plain, direct prose in the repo's writing style (root `CLAUDE.md`); no emoji

## Documentation Strategy

### 1. Identify Documentation Type

| Type          | What to Generate                                   |
| ------------- | -------------------------------------------------- |
| **Program**   | Instructions, accounts, PDAs, errors, security, CU |
| **SDK/API**   | Functions, params, returns, errors, examples       |
| **Component** | Props/properties, events, usage patterns           |
| **README**    | Overview, setup, quick start, deployment           |

### 2. Documentation Requirements

**For Instructions/Endpoints:**

- Accounts table (name, type, description)
- Arguments table (name, type, validation)
- Error codes with descriptions
- Access control notes
- Compute units estimate
- Working code example

**For Account Structures:**

- Purpose and lifecycle
- Size calculation (include discriminator)
- Field table with types and offsets
- PDA seeds (if applicable)
- Rent cost

**For README:**

- Program IDs (mainnet/devnet)
- Installation command
- Quick start example
- Instruction summary table
- Security/audit status

### 3. Best Practices

**Do:**

- Document ALL public functions/instructions
- Include working code examples
- Explain "why", not just "what"
- Include error scenarios
- Update docs when code changes

**Don't:**

- Document obvious code
- Leave non-compiling examples
- Skip security considerations
- Forget to document errors

## Output

Generate documentation appropriate to the code type:

1. **Programs**: Instruction docs, account docs, error codes
2. **SDKs**: Function docs, type definitions, examples
3. **Components**: Props, events, usage patterns
4. **Projects**: README with setup and deployment

The repo is public: never document key rotation status, custody, budgets or unpatched findings.
