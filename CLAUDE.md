# Solana Academy Platform

This is the official AI assistant context file for the Superteam Academy Platform project.

## Quick Links

- **Specification**: [docs/SPECIFICATION.md](docs/SPECIFICATION.md)
- **Architecture**: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- **Implementation Order**: [docs/IMPLEMENTATION_ORDER.md](docs/IMPLEMENTATION_ORDER.md)
- **Canonical Docs**: See `.claude/skills/SKILL.md`

## Monorepo Structure

```
.
├── .claude/
│   ├── agents/                  ← Specialized agents (engineer, architect, tech-docs-writer)
│   ├── commands/                ← Slash commands (/quick-commit, /deploy, /test, etc.)
│   ├── rules/                   ← Always-on constraints (typescript.md, react.md)
│   ├── skills/                  ← Skill docs (frontend, testing, deployment)
│   └── settings.json            ← Permissions, hooks, model defaults
├── .github/
│   └── workflows/               ← CI/CD pipelines (tests, linting, deployment)
├── docs/
│   ├── SPECIFICATION.md         ← Frontend & dApp specification
│   ├── ARCHITECTURE.md          ← System architecture & data flows
│   ├── IMPLEMENTATION_ORDER.md  ← Phased implementation plan
│   └── FEATURE_ROADMAP.md       ← Future features & improvements
├── app/                         ← Next.js app directory (frontend)
│   ├── globals.css
│   ├── layout.tsx
│   ├── page.tsx
│   ├── courses/
│   ├── dashboard/
│   ├── certificates/
│   └── ...
├── components/                  ← React components
│   ├── courses/
│   ├── dashboard/
│   ├── editor/
│   ├── layout/
│   └── ui/
├── lib/
│   ├── hooks/
│   ├── i18n/
│   ├── services/
│   ├── types/
│   └── utils/
├── Anchor.toml                  ← (Future) On-chain programs
├── Cargo.toml                   ← (Future) Rust workspace
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js
├── README.md
└── CLAUDE.md                    ← This file
```

## Technology Stack

| Layer         | Stack                                                    |
| ------------- | -------------------------------------------------------- |
| Frontend      | Next.js 14+, React 18, TypeScript, Tailwind CSS          |
| Wallet        | @solana/wallet-adapter-react                             |
| State Mgmt    | Zustand (client state), TanStack Query (server state)    |
| i18n          | next-intl (internationalization)                         |
| Editor        | Monaco Editor (in-browser code editor)                   |
| RPC           | Helius (production), localhost (dev)                     |
| On-Chain      | Anchor programs (future), Token-2022, Light SDK (future) |
| Testing       | Jest, Vitest, Playwright (future)                        |
| CI/CD         | GitHub Actions                                           |

## Core Features

### Phase 1: MVP (Current)
- [x] Course catalog with search & filters
- [x] Learning dashboard
- [x] In-browser code editor
- [x] Multi-language interface
- [x] User profiles
- [x] Settings panel

### Phase 2: On-Chain Integration (Upcoming)
- [ ] Wallet connection & authentication
- [ ] XP token minting
- [ ] Achievement credentials
- [ ] Leaderboard (on-chain XP)
- [ ] Certificate issuance

### Phase 3: Advanced Features
- [ ] Live collaboration
- [ ] Community forums
- [ ] Mentorship system
- [ ] Corporate training tracks

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js + React)                       │
│                                                                     │
│  Wallet Adapter ──── Anchor Client ──── Helius RPC ──── Solana     │
│                                                                     │
│  Components: Header, CourseCard, CodeEditor, GamificationUI         │
│  Pages: Dashboard, Courses, Profile, Leaderboard, Certificates      │
└────────────────────────────────────────────┬────────────────────────┘
                                             │
                           (Future) On-Chain Programs
```

## Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm build
npm start

# Type checking
npm run type-check

# Linting
npm run lint
```

## Key Files & Patterns

### Components
- **CourseCard**: Displays course preview with metadata
- **CodeEditor**: Monaco-based in-browser editor for lessons
- **ChallengeRunner**: Executes and validates code challenges
- **GamificationUI**: XP counter, streaks, achievements display
- **DashboardUI**: Learner progress & achievements overview

### Services
- `course.service.ts`: Fetch and manage course data
- `learning-progress.service.ts`: Track learner progress
- (Future) `on-chain.service.ts`: Interact with Solana programs

### Hooks
- `useI18n()`: Multi-language support
- `useLearningProgress()`: Track & update learner progress
- (Future) `useWallet()`: Wallet connection & signing
- (Future) `useProgram()`: Interact with on-chain programs

## Important Rules

### Code Quality
- Use TypeScript strictly (no `any` types)
- Follow Next.js app directory patterns
- Keep components under 300 lines
- Use Tailwind CSS for styling
- Export components via index files

### Testing
- Unit tests for business logic
- Integration tests for user flows
- E2E tests with Playwright
- Minimum 70% coverage for critical paths

### Deployment
- Always run `npm run build` before committing
- Fix all TypeScript errors & ESLint warnings
- Test locally with `npm run dev` first
- Use GitHub Actions for automated deployment

## On-Chain Integration (Future)

When implementing on-chain features:

1. **Program Development**: Anchor framework (Rust)
2. **Client SDK**: TypeScript wrapper around IDL
3. **Frontend Integration**: Connect wallet → Call program → Update UI
4. **Testing**: Mollusk (unit) + LiteSVM (integration) + Trident (fuzz)
5. **Deployment**: Devnet → Mainnet via multisig (Squads)

See `.claude/skills/` for detailed guides.

## Operating Procedure

1. **Classify the task** (frontend feature, component, service, docs, etc.)
2. **Check constraints** in `.claude/rules/`
3. **Follow patterns** in existing code
4. **Write tests** before/alongside implementation
5. **Update docs** for new features
6. **Commit with clear message**: `/quick-commit` or manual process

## Getting Help

- **Architecture questions**: See `docs/ARCHITECTURE.md`
- **Feature planning**: See `docs/IMPLEMENTATION_ORDER.md`
- **Code patterns**: See `.claude/rules/typescript.md` and `.claude/rules/react.md`
- **Component examples**: Browse `components/` directory
- **Deployment**: See `.claude/commands/deploy.md`

## License

MIT License - Superteam Brazil 2026

---

**Last Updated**: February 2026  
**Version**: 1.0.0  
**Status**: MVP Phase
