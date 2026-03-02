# Architecture Decision Records

This directory contains Architecture Decision Records (ADRs) for the Superteam Academy frontend. ADRs document significant architectural choices, their context, and consequences.

## Index

| ADR | Title | Status |
|-----|-------|--------|
| [0001](0001-nextjs-app-router.md) | Next.js App Router as Frontend Framework | Accepted |
| [0002](0002-sanity-cms-with-mock-fallback.md) | Sanity CMS with Mock Data Fallback | Accepted |
| [0003](0003-wallet-auth-hybrid-approach.md) | Hybrid Wallet + OAuth Authentication | Accepted |
| [0004](0004-hybrid-service-layer.md) | Hybrid Service Layer (localStorage + On-Chain) | Accepted |
| [0005](0005-cookie-based-i18n.md) | Cookie-Based i18n Without URL Prefixes | Accepted |
| [0006](0006-manual-account-deserialization.md) | Manual On-Chain Account Deserialization | Accepted |
| [0007](0007-client-side-gamification.md) | Client-Side Gamification State | Accepted |

## ADR Format

Each ADR follows the format:

- **Status**: Accepted, Superseded, or Deprecated
- **Context**: What is the issue that we're seeing that motivates this decision?
- **Decision**: What is the change that we're proposing/implementing?
- **Consequences**: What becomes easier or harder because of this change?
