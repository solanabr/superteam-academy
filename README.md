# 🎓 Superteam Academy

> **Decentralized Learning Platform on Solana**  
> Learn. Earn XP. Collect Verifiable Credentials.

[![Solana](https://img.shields.io/badge/Solana-0.31+-9945FF?style=flat-square&logo=solana)](https://solana.com)
[![Anchor](https://img.shields.io/badge/Anchor-0.31+-black?style=flat-square)](https://anchor-lang.com)
[![Token-2022](https://img.shields.io/badge/Token--2022-Enabled-blue?style=flat-square)](https://spl.solana.com/token-2022)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

---

## 🚀 Live Demo

**Deployed on Vercel:** [https://superteam-academy-nu.vercel.app/](https://superteam-academy-nu.vercel.app/)

**Video Walkthrough:** [https://youtu.be/9tsGeCwoeaQ](https://youtu.be/9tsGeCwoeaQ)

**X Tweet:** [https://x.com/AbhijeetKakade0/status/2029193398205464666](https://x.com/AbhijeetKakade0/status/2029193398205464666)

---

## 💡 What is Superteam Academy?

Superteam Academy is a **gamified decentralized learning management system** that revolutionizes how developers learn Solana. Unlike traditional platforms, we use:

- 🪙 **Soulbound XP Tokens** - Token-2022 with NonTransferable + PermanentDelegate
- 🎖️ **ZK-Compressed Credentials** - Rent-free, upgradeable per learning track
- 📊 **Bitmap Tracking** - Efficient on-chain lesson completion
- 💰 **Creator Economics** - Automatic XP rewards for course authors
- 🔥 **Streak System** - Activity-derived streaks with freeze protection

---

## ✨ Key Features

### For Learners

- **Earn Soulbound XP** - Complete lessons and courses to earn XP tokens that permanently record your achievements
- **Collect Credentials** - Earn ZK-compressed credentials that upgrade as you progress through tracks
- **Maintain Streaks** - Keep daily learning streaks alive with automatic tracking
- **Climb the Leaderboard** - Compete with other learners based on XP earned
- **Achievement System** - Unlock achievements and earn bonus XP

### For Creators

- **Earn Rewards** - Receive XP when students complete your courses
- **Course Registry** - Register courses with metadata, prerequisites, and XP amounts
- **Track Analytics** - Monitor enrollments, completions, and student progress

### Technical Highlights

- ✅ **16 On-Chain Instructions** - Complete learning platform logic
- ✅ **Token-2022 Integration** - NonTransferable + PermanentDelegate extensions
- ✅ **ZK Compression Ready** - Architecture prepared for Light Protocol integration
- ✅ **Bitmap Operations** - Track up to 256 lessons per course efficiently
- ✅ **Security First** - Daily XP caps, backend signer verification, prerequisite enforcement

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    SOLANA DEVNET/MAINNET                    │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │   Config     │  │    Course    │  │  LearnerProfile  │  │
│  │  (Singleton) │  │   (Factory)  │  │   (Per user)     │  │
│  │              │  │              │  │                  │  │
│  │ • Authority  │  │ • Lessons    │  │ • Streaks        │  │
│  │ • Backend    │  │ • XP amounts │  │ • Achievements   │  │
│  │ • Season     │  │ • Creator    │  │ • Rate limiting  │  │
│  └──────────────┘  └──────┬───────┘  └──────────────────┘  │
│                            │                                 │
│  ┌─────────────────────────┴──────────────────────────┐     │
│  │           Enrollment PDA (Per user per course)      │     │
│  │                                                    │     │
│  │  • Lesson bitmap (256 lessons max)                 │     │
│  │  • Completion tracking                             │     │
│  │  • Closeable (rent reclaim)                        │     │
│  └────────────────────────────────────────────────────┘     │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │     ZK COMPRESSED CREDENTIALS (Light Protocol)      │    │
│  │                                                     │    │
│  │  • One per learner per track                        │    │
│  │  • Upgradeable: Beginner → Intermediate → Advanced  │    │
│  │  • Zero rent, deterministic address                 │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  ┌────────────────────────────────────────────────────┐     │
│  │   XP TOKEN (Token-2022)                            │     │
│  │                                                    │     │
│  │  • NonTransferable (soulbound)                     │     │
│  │  • PermanentDelegate (platform controlled)         │     │
│  │  • New mint per season                             │     │
│  └────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Hackathon Submission

**Event:** Superteam Brazil Hackathon - LMS Bounty

**Track:** DeFi/Development Tools

**Team:** @abhijeetkakade1234

**Submission Date:** February 2026

### Why We Built This

Traditional learning platforms are centralized, don't provide verifiable credentials, and don't incentivize creators. Superteam Academy solves this by:

1. **Verifiable On-Chain Credentials** - Every course completion is recorded permanently on Solana
2. **Creator Economics** - Course authors earn XP rewards proportional to student completions
3. **Gamification** - Streaks, achievements, and leaderboards drive engagement
4. **Zero Rent Credentials** - Using ZK Compression for scalable, rent-free credentials

### Competitive Advantages

- ✅ **Production-Ready Code** - 16 instructions, 5 account types, comprehensive error handling
- ✅ **Advanced Token Standard** - Token-2022 with NonTransferable + PermanentDelegate
- ✅ **ZK-Ready Architecture** - Prepared for Light Protocol ZK Compression
- ✅ **Security Model** - Daily XP caps, backend signer verification, prerequisite enforcement
- ✅ **Creator Incentives** - Automatic XP rewards for course authors

---

## 📦 Project Structure

```
superteam-academy/
├── programs/superteam-academy/    # Anchor program
│   ├── src/
│   │   ├── lib.rs                 # Program entrypoint (16 instructions)
│   │   ├── instructions/          # All instruction handlers
│   │   ├── state/                 # Account structs
│   │   ├── errors.rs              # Error definitions
│   │   └── events.rs              # Event definitions
│   └── Cargo.toml
├── app/                           # Next.js frontend
│   ├── src/
│   │   ├── app/                   # Next.js app router
│   │   └── components/            # React components
│   └── package.json
├── sdk/                           # TypeScript SDK
│   ├── client.ts                  # SDK client
│   ├── types.ts                   # TypeScript types
│   └── index.ts
├── tests/                         # Test suites
│   ├── rust/                      # LiteSVM tests
│   └── ts/                        # TypeScript integration tests
├── docs/                          # Documentation
│   ├── SPEC.md                    # Full specification
│   ├── ARCHITECTURE.md            # Architecture reference
│   └── IMPLEMENTATION_ORDER.md    # Build phases
└── scripts/                       # Deployment scripts
    ├── deploy.sh
    └── lint.sh
```

---

## 🛠️ Technology Stack

### On-Chain

- **Framework:** Anchor 0.31+
- **Language:** Rust 1.82+
- **Token Standard:** Token-2022 (NonTransferable + PermanentDelegate)
- **Compression:** Light Protocol SDK (ZK compressed credentials)
- **Testing:** LiteSVM, Mollusk

### Frontend

- **Framework:** Next.js 14
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Wallet:** Solana Wallet Adapter (Phantom, Solflare, Backpack)

### Infrastructure

- **RPC:** Helius (DAS API + Photon for ZK Compression)
- **Content:** Arweave / Sanity CMS
- **Analytics:** Google Analytics 4, Microsoft Clarity (Heatmaps)
- **Monitoring:** Sentry (Error Tracking)
- **CI/CD:** Vercel / GitHub Actions

---

## 🚀 Quick Start

### Prerequisites

```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/v1.18.0/install)"

# Install Anchor
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install latest
avm use latest
```

### Build & Test

```bash
# Clone repository
git clone https://github.com/AbhijeetKakade2004/superteam-academy.git
cd superteam-academy

# Build program
anchor build

# Run tests
anchor test

# Deploy to devnet
anchor deploy --provider.cluster devnet
```

### Run Frontend

```bash
cd app
npm install
npm run dev
```

---

## 📋 Instructions (16 Total)

### Platform Management (4)

- `initialize` - Create Config PDA
- `create_season` - Create new XP mint
- `close_season` - Close current season
- `update_config` - Rotate backend signer, adjust caps

### Learner (4)

- `init_learner` - Create learner profile
- `claim_achievement` - Claim achievement XP
- `award_streak_freeze` - Award freeze protection
- `register_referral` - Register referrer

### Courses (2)

- `create_course` - Register new course
- `update_course` - Update course content

### Enrollment & Progress (6)

- `enroll` - Enroll in course
- `unenroll` - Abandon course (24h cooldown)
- `complete_lesson` - Complete lesson + earn XP
- `finalize_course` - Complete course + rewards
- `issue_credential` - Create/upgrade credential
- `close_enrollment` - Reclaim rent

---

## 🔐 Security Model

| Instruction      | Platform | Course Auth | Backend | Learner |
| ---------------- | -------- | ----------- | ------- | ------- |
| initialize       | ✅       |             |         |         |
| create_season    | ✅       |             |         |         |
| create_course    | ✅       |             |         |         |
| update_course    |          | ✅          |         |         |
| complete_lesson  |          |             | ✅      |         |
| finalize_course  |          |             | ✅      |         |
| issue_credential |          |             | ✅      |         |
| enroll           |          |             |         | ✅      |

**Security Features:**

- ✅ Backend signer for all XP-awarding operations
- ✅ On-chain daily XP caps
- ✅ Bitmap double-completion prevention
- ✅ Prerequisite enforcement
- ✅ Self-referral prevention
- ✅ Checked arithmetic throughout

---

## 💰 Cost Analysis

### One-Time Setup

| Item           | Cost       |
| -------------- | ---------- |
| Deploy program | ~2 SOL     |
| Config PDA     | ~0.002 SOL |
| **Total**      | **~2 SOL** |

### Per Learner (Annual)

| Action             | Cost           |
| ------------------ | -------------- |
| Init learner       | ~0.001 SOL     |
| Enroll (5 courses) | ~0.005 SOL     |
| Complete lessons   | ~0.001 SOL     |
| **Net annual**     | **~0.002 SOL** |

_Credentials use ZK Compression: zero rent_

---

## 🧪 Testing

```bash
# Format check
cargo fmt -- --check

# Lint
cargo clippy -- -W clippy::all -D warnings

# Unit tests
cargo test

# Integration tests
anchor test

# Run lint script
./scripts/lint.sh
```

---

## 📚 Documentation

- **[SPEC.md](docs/SPEC.md)** - Complete program specification (1245 lines)
- **[ARCHITECTURE.md](docs/ARCHITECTURE.md)** - System architecture & data flows
- **[IMPLEMENTATION_ORDER.md](docs/IMPLEMENTATION_ORDER.md)** - 10-phase build plan
- **[FUTURE_IMPROVEMENTS.md](docs/FUTURE_IMPROVEMENTS.md)** - V2/V3 roadmap

---

## 🤝 Contributing

This project was built for the **Superteam Brazil Hackathon**.

### Development Workflow

```bash
# Create feature branch
git checkout -b feat/<feature-name>-<DD-MM-YYYY>

# Make changes
# ... edit code ...

# Format & lint
cargo fmt
cargo clippy -- -W clippy::all
anchor test

# Commit
git add .
git commit -m "feat: description"

# Push
git push origin feat/<feature-name>-<DD-MM-YYYY>
```

---

## 📝 License

MIT License - see [LICENSE](LICENSE) file

---

## 🙏 Acknowledgments

- **Superteam Brazil** for the hackathon opportunity
- **Anchor Framework** for excellent Solana development tools
- **Light Protocol** for ZK Compression technology
- **Solana Foundation** for Token-2022 standard

---

## 📬 Contact

- **Telegram:** [@kauenet](https://t.me/kauenet)
- **GitHub:** [abhijeetkakade1234](https://github.com/AbhijeetKakade200abhijeetkakade1234)

---

**Built with ❤️ for the Solana ecosystem**

_This project represents 16 days of focused development, implementing a complete decentralized learning platform with advanced features like Token-2022 soulbound tokens and ZK-ready credential architecture._
