# Bounty Requirement Mapping

Last updated: February 23, 2026

This document maps bounty requirements to our execution phases.

## 1. Must Implement (Core)

| Requirement | Phase |
|---|---|
| Wallet auth (multi-wallet) | F0 |
| XP balance display | F3 |
| Credential display and verification | F4 |
| Leaderboard experience | F4 |
| Course enrollment (wallet-signed) | F1 |

## 2. Stub with Clean Abstractions

| Requirement | Approach | Phase |
|---|---|---|
| Lesson completion flow | Service interface + BFF endpoint adapter | F2 |
| Finalization + credential issuance orchestration | Service interface + server action boundary | F2/F4 |
| Achievement claiming | UI + service abstraction; backend/on-chain integration pluggable | F4/F5 |
| Streak tracking | Frontend-managed service (local/db/CMS pluggable) | F3 |

## 3. Required Platform Features

| Feature | Planned Phase |
|---|---|
| Landing page | Existing + polish in F7 |
| Course catalog | F1 |
| Course detail | F1 |
| Lesson view + code challenge | F2 |
| Dashboard | F3 |
| Profile pages | F4 |
| Leaderboard | F4 |
| Settings | F5 |
| Certificate view | F4 |

## 4. Later Phases (Explicit)

| Requirement | Planned Phase |
|---|---|
| CMS integration (Sanity recommended) | F6 |
| Analytics (GA4 + heatmaps + Sentry) | F7 |
| i18n (PT-BR, ES, EN) full rollout | F7 (string externalization starts F0) |
| Performance hardening for Lighthouse/CWV | F7 |

## 5. Submission Deliverables Checklist (Tracking)

- [ ] PR to repo with full frontend implementation
- [ ] Live deployed demo
- [ ] Demo video
- [ ] Updated README/ARCHITECTURE/CMS/CUSTOMIZATION docs
- [ ] Twitter post
