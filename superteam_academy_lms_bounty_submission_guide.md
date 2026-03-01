# Superteam Academy — LMS dApp: Build-to-Win Guide

> Production-ready roadmap, research-backed tech choices, MVP + stretch features, demo script, and a submission checklist tailored to the Superteam Brazil LMS bounty.

---

## TL;DR
- Goal: deliver a **production-ready Learning Management System (LMS) dApp** that impresses judges with a working demo, clean architecture, polished UX, and Web3-native features (wallet login, on-chain certificate or badge).  
- Prize: 1st ≈ 4,000 USDG — submission must be live, documented, and demo-ready.  
- Approach recommended: **Hybrid architecture** (fast frontend + DB for UX; selective on-chain elements for credibility and bonus points — e.g., NFT certificate or lesson-proof anchor via Solana Anchor).  

---

## Quick research highlights (what I checked before making this plan)
- The Superteam listing is a bounty for a production-ready LMS dApp with a prize pool of ~4,800 USDG and winner announcement scheduled by March 12, 2026.  
- Superteam Earn runs bounties as competitive submissions (multiple submissions, winners chosen by sponsor/judges).  
- For content permanence consider **Arweave** (pay-once permanence) for final certificates/immutable course assets; **IPFS + pinning/Filecoin** is cheaper but availability depends on pinning.  
- For on-chain NFTs / certificates on Solana, use modern Metaplex tooling (Core / Candy Machine alternatives) to mint low-cost NFTs or use programmable NFTs for certificates.

---

## What the judges likely expect (priority ranking)
1. **Working product** (must be usable end-to-end) — login, enroll, view content, mark lessons complete.  
2. **Polish & UX** — clear flows, responsive UI, error handling.  
3. **Clear Web3 integration** — wallet connect & on‑chain interactions (even if small).  
4. **Documentation & demo** — README, architecture diagram, deployment link, short demo video.  
5. **Innovation** — NFT certificates, on-chain proof-of-completion, incentives, or unique pedagogy for Web3 devs.

---

## MVP feature list (must-have for submission)
- Wallet-based login (Phantom / Solflare) + user profile (wallet address).  
- Course list & course detail pages.  
- Lesson viewer (text + video embed) with completion tracking.  
- Enrollment flow and dashboard showing progress with progress bars.  
- Instructor/admin UI to create/edit courses and lessons.  
- Deploy frontend to Vercel (or Netlify) and backend to a managed service (Supabase / Firebase) — live link required.  
- README with architecture, run instructions, and a 3–5 minute demo video link.

---

## Stretch features (win boosters)
- Issue a **certificate NFT** on Solana when a student finishes a course.  
- Store a compressed proof-of-completion on-chain (Anchor program) or mint a SBT/badge.  
- Permanent course assets (Arweave) or IPFS + pinning with backup.  
- Gamification: progress badges, leaderboards, rewards in token.  
- Offline export of certificate (PDF) plus on-chain proof.

---

## Recommended tech stack (fast to build & judged-friendly)
- **Frontend:** Next.js + React + Tailwind CSS  
- **Wallet & Web3 libs:** @solana/wallet-adapter, Phantom support, @metaplex/js or metaplex-foundation/sdk for NFTs  
- **Backend / DB:** Supabase (Postgres + Auth + storage) or Firebase — quick to iterate and host  
- **On-chain tooling (optional):** Anchor for Solana programs; deploy to devnet/testnet then mainnet if needed  
- **Storage for final assets:** Arweave (permanent) for certificates and essential immutable files; IPFS + pinning for general course media  
- **Deploy:** Vercel for frontend; Supabase or Render for server functions/API; Anchor deployments via Solana CLI for program steps

---

## Architecture (hybrid pattern)
- **Client (Next.js):** UI, wallet connect, lesson UI, triggers on-chain actions for certificates.  
- **API (Serverless / Supabase functions):** CRUD for courses, lessons, enrollments, and off-chain progress state; webhooks for minting certificates.  
- **DB (Supabase Postgres):** Users (wallet address), courses, lessons, enrollments, progress logs.  
- **On-chain (optional):** Anchor program for minimal proofs (e.g., store `wallet+courseID+timestamp` on chain) and minting certificates via Metaplex.  
- **Asset store:** Media on IPFS (pinned) or Arweave for immutable certificate files.

---

## Step-by-step build plan (4-week aggressive schedule)
**Week 1 — Foundation & MVP UI**
1. Scaffold Next.js + Tailwind; set up routing and skeleton pages.  
2. Integrate Solana wallet adapter; implement wallet connect and store wallet address in DB.  
3. Create DB schema in Supabase: users, courses, lessons, enrollments, progress.

**Week 2 — Course flows & instructor UI**
1. Implement course list, course creation/edit pages (Admin).  
2. Build lesson viewer and completion toggles that write to DB.  
3. Dashboard with progress visualization.

**Week 3 — On‑chain features + certificates**
1. Option A (hybrid): integrate Metaplex SDK to mint NFT certificate when completion conditions met.  
2. Option B (on‑chain proof): write lightweight Anchor program to record completions (devnet) and confirm via UI.  
3. Pin certificate metadata/media to Arweave or IPFS.

**Week 4 — Polish, tests, docs, demo**
1. UX polish, responsive fixes, error flows, form validation.  
2. Full README, architecture diagram, API docs, and deployment instructions.  
3. Record 3–5 min demo video (scripted) showing core flows and the on-chain proof (or minted NFT).  
4. Submit on Superteam with live link, repo, and demo.

---

## Demo script (exact order to present to judges)
1. Quick 15s intro: problem + your solution in one sentence.  
2. Show wallet connect + new user creation (10s).  
3. Enroll in course, play a lesson, mark complete (40s).  
4. Show dashboard progress and instructor creating a lesson (30s).  
5. Trigger certificate mint or on-chain proof and show transaction explorer (30–40s).  
6. Link to repo + README + how to run locally (15s).  
7. Closing (call-to-action + future work) (10s).

---

## Submission checklist (must include these)
- [ ] Live deployed frontend link (Vercel/Netlify).  
- [ ] Public GitHub repo with clear README and run instructions.  
- [ ] Demo video (YouTube or hosted) and short pitch paragraph.  
- [ ] Documented tech choices + architecture diagram.  
- [ ] Evidence of Web3 features (tx link or NFT shown).  
- [ ] Contact details (Telegram handle) so sponsor can reach you.

---

## Security, costs & KYC notes
- KYC required to receive prize — be ready with ID.  
- If you mint NFTs on mainnet, factor minting costs and SOL for transactions; use devnet for testing and record transaction proofs on devnet/mainnet depending on judge expectations.  
- Arweave permanence costs real AR — limit what you pin permanently to essential certificate metadata.

---

## Risk mitigation & backup plan
- Keep a video recording of the entire demo flow (backup if live demo fails).  
- Host a static backup on Netlify/Vercel and include screenshots in README.  
- For storage: use IPFS pinned + a secondary Arweave pin for critical certificate files.

---

## Judging edge-cases & what wins
- Judges reward *completeness* and *reliability* over clever experimental work that’s half-broken. Deliver a solid core that works flawlessly.  
- On-chain novelty (SBTs, programmable NFTs, or minimal Anchor program) is a differentiator if implemented correctly.  

---

## Appendix — Useful resources (dev shortcuts)
- Solana wallet adapter & Phantom docs (official)  
- Metaplex (Core) docs for NFT issuance  
- Anchor quickstart (Solana smart contract framework)  
- Supabase quickstart (Postgres, Auth, storage)  
- Arweave gateway & pinning services

---

## Final note
I created this guide using the latest listing details and ecosystem tooling trends so you can submit a focused, high-quality entry. If you want, I can now:
- scaffold the repo with file structure and starter code, or  
- generate the exact README + `package.json` + Next.js pages and a minimal working demo.  

Tell me which of the above to start now (scaffold repo / full starter code / implement on-chain certificate).  

