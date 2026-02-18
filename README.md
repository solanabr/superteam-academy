# Superteam Academy - Solana LMS

A production-grade, open-source, forkable, scalable Solana-native Learning Management System (LMS) designed to serve as the foundation of Solana developer education across Latin America.

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16+-black.svg)](https://nextjs.org/)
[![Solana](https://img.shields.io/badge/Solana-1.18+-blue.svg)](https://solana.com/)

## Overview

Superteam Academy is a comprehensive learning platform that combines interactive coding challenges, gamified progression, and on-chain credentials. Built for the Solana ecosystem, it supports 100k+ users with verifiable credentials stored as compressed NFTs.

### Key Features

- **Interactive Code Editor**: Monaco Editor for TypeScript, CodeMirror 6 for lightweight editing
- **Gamification System**: XP tokens (Token-2022 non-transferable) and achievement system
- **On-Chain Credentials**: Metaplex Bubblegum cNFTs for verifiable learning achievements
- **Multi-Language Support**: PT-BR, ES, EN with full internationalization
- **Wallet + OAuth Auth**: Phantom, Solflare + Google/GitHub integration
- **CMS-Powered Content**: Sanity.io for content management
- **Advanced Analytics**: GA4 with custom event tracking and privacy controls
- **Accessibility First**: WCAG 2.1 AA compliant
- **Dark-First Design**: Modern UI with comprehensive design system
- **Production Ready**: Comprehensive testing, monitoring, and DevOps

## Quick Start

### Prerequisites

- Node.js 18+
- Bun 1.1+
- Rust 1.70+ (for Solana programs)
- Anchor CLI 0.30+
- Solana CLI 1.18+

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/solanabr/superteam-academy.git
   cd superteam-academy
   ```

2. **Install dependencies**
   ```bash
   bun install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Build the project**
   ```bash
   bun run build
   ```

5. **Start development server**
   ```bash
   bun dev
   ```

## Architecture

### Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 16 App Router, TypeScript, Tailwind CSS |
| **On-Chain** | Solana, Anchor, Token-2022, Bubblegum cNFTs |
| **CMS** | Sanity.io with GROQ |
| **Auth** | Wallet Adapter + Better Auth (OAuth) |
| **Database** | PostgreSQL + Drizzle ORM |
| **Cache** | Redis |
| **Analytics** | GA4 + Custom Pipeline |
| **Hosting** | Vercel Edge Runtime |

### Project Structure

```
superteam-academy/
├── apps/
│   └── app/                    # Next.js application
├── packages/
│   ├── services/               # Service abstraction layer
│   ├── solana/                 # Solana client utilities
│   ├── anchor/                 # Program type definitions
│   ├── cms-types/              # Sanity schema types
│   ├── auth/                   # Authentication utilities
│   ├── editor/                 # Code editor adapters
│   ├── i18n/                   # Internationalization
│   ├── analytics/              # GA4 & telemetry
│   ├── config/                 # Shared configurations
│   └── gamification/           # XP & achievement system
├── programs/
│   └── superteam-academy/      # Anchor program
├── tests/                      # Integration tests
└── docs/                       # Documentation
```

### Service Architecture

The platform uses a strict service abstraction layer for complete swappability:

- **Interface-Driven Design**: All services defined by TypeScript interfaces
- **Environment Switching**: Local dev ↔ Devnet ↔ Mainnet
- **Error Handling**: Typed errors with retry logic and circuit breakers
- **Caching Strategy**: Multi-level caching (Redis, in-memory, CDN)
- **Monitoring**: Comprehensive observability with Sentry and custom telemetry

## Core Concepts

### XP & Gamification

- **XP Tokens**: Soul-bound Token-2022 tokens (non-transferable)
- **Level System**: Mathematical progression with diminishing returns
- **Achievements**: 256-bit bitmap system for efficient storage
- **Streaks**: Daily activity tracking with freeze mechanics

### On-Chain Credentials

- **cNFT Standard**: Compressed NFTs using Metaplex Bubblegum
- **Verifiable Credentials**: Immutable proof of learning achievements
- **Upgradeable**: Support for credential evolution and versioning
- **Privacy-Preserving**: Zero-knowledge proofs for selective disclosure

### Learning Experience

- **Project-Based**: Real-world coding challenges
- **Progressive Difficulty**: Adaptive learning paths
- **Instant Feedback**: Automated testing and grading
- **Collaborative**: Social learning features

## Development

### Available Scripts

```bash
# Development
bun dev               # Start development server
bun run build         # Build all packages
bun test              # Run test suite
bun run lint          # Run ESLint
bun run type-check    # TypeScript type checking

# Solana Programs
bun run program:build # Build Anchor program
bun run program:test  # Test Solana program
bun run program:deploy # Deploy to devnet

# Analytics
bun run analytics:build  # Build analytics package
bun run analytics:test   # Test analytics package
```

### Environment Setup

1. **Local Development**
   ```bash
   # Start local Solana validator
   solana-test-validator

   # Deploy program locally
   anchor deploy
   ```

2. **Devnet Deployment**
   ```bash
   # Switch to devnet
   solana config set --url devnet

   # Deploy program
   anchor deploy
   ```

### Testing Strategy

- **Unit Tests**: Vitest for component and utility testing
- **Integration Tests**: API and database integration
- **E2E Tests**: Playwright for user journey testing
- **Program Tests**: Anchor testing framework
- **Performance Tests**: Lighthouse CI and custom benchmarks

## Analytics & Monitoring

### GA4 Integration

- **Custom Events**: Comprehensive event tracking for user actions
- **Privacy Controls**: GDPR compliance with consent management
- **Funnel Analysis**: Conversion tracking and drop-off analysis
- **Audience Segmentation**: Dynamic user grouping
- **Cross-Domain Tracking**: Unified analytics across domains

### Error Monitoring

- **Sentry Integration**: Real-time error tracking and alerting
- **Custom Telemetry**: Structured logging with correlation IDs
- **Performance Monitoring**: Core Web Vitals and custom metrics
- **Distributed Tracing**: Request tracing across services

## Internationalization

- **Supported Languages**: Portuguese (Brazil), Spanish, English
- **CMS Integration**: Localized content management
- **RTL Support**: Prepared for right-to-left languages
- **Dynamic Loading**: Efficient locale loading and caching

## Accessibility

- **WCAG 2.1 AA**: Full compliance with accessibility standards
- **Keyboard Navigation**: Complete keyboard accessibility
- **Screen Reader Support**: ARIA labels and semantic HTML
- **Focus Management**: Proper focus indicators and trapping
- **Reduced Motion**: Respect for user motion preferences

## Deployment

### Vercel Deployment

1. **Connect Repository**
   ```bash
   # Vercel will automatically detect Next.js
   vercel --prod
   ```

2. **Environment Variables**
   ```bash
   # Set production environment variables
   vercel env add ANALYTICS_ID
   vercel env add DATABASE_URL
   vercel env add SOLANA_RPC_URL
   ```

### Solana Program Deployment

1. **Build and Test**
   ```bash
   anchor build
   anchor test
   ```

2. **Deploy to Devnet**
   ```bash
   anchor deploy --provider.cluster devnet
   ```

3. **Verify Deployment**
   ```bash
   solana program show <PROGRAM_ID>
   ```

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow

1. **Fork and Clone**
2. **Create Feature Branch**: `git checkout -b feature/your-feature`
3. **Make Changes**: Follow our coding standards
4. **Run Tests**: `bun test`
5. **Submit PR**: With detailed description

### Code Quality

- **TypeScript Strict**: Zero `any` types, strict mode enabled
- **ESLint**: Airbnb config with custom rules
- **Prettier**: Consistent code formatting
- **Husky**: Pre-commit hooks for quality checks
- **Bundle Analysis**: Size monitoring and optimization

## Documentation

- [Specification](docs/SPEC.md)
- [Architecture Guide](docs/ARCHITECTURE.md)
- [Implementation Order](docs/IMPLEMENTATION_ORDER.md)
- [Future Improvements](docs/FUTURE_IMPROVEMENTS.md)

## Security

- **Content Security Policy**: Strict CSP headers
- **Input Validation**: Server-side validation for all inputs
- **Rate Limiting**: Per-IP and per-user rate limiting
- **Dependency Scanning**: Automated vulnerability scanning
- **Secret Management**: Environment-based secret management
- **Audit Logging**: Comprehensive security event logging

## Performance

- **Core Web Vitals**: Optimized for LCP, FID, CLS
- **Bundle Optimization**: Under 250KB initial bundle
- **Image Optimization**: Next.js Image component with WebP/AVIF
- **Caching Strategy**: Multi-level caching (browser, CDN, server)
- **CDN Integration**: Global content delivery
- **Edge Computing**: Vercel Edge Runtime for global performance

## Roadmap

### Phase 1-8: Foundation (Complete)
- Monorepo setup, authentication, CMS, i18n, UI system, on-chain programs, service layer, code editor

### Phase 9-12: Advanced Features (In Progress)
- Gamification, leaderboard, analytics, performance optimization

### Phase 13-17: Polish & Scale (Planned)
- Testing, DevOps, documentation, frontend pages, advanced features

### Future Enhancements
- PWA support, mobile apps, DAO integration, paid tracks, enterprise features

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- **Solana Foundation** for ecosystem support
- **Superteam** for community and funding
- **Open Source Community** for amazing tools and libraries

## Support

- **Issues**: [GitHub Issues](https://github.com/solanabr/superteam-academy/issues)
- **Discussions**: [GitHub Discussions](https://github.com/solanabr/superteam-academy/discussions)
- **Discord**: [Superteam Discord](https://discord.gg/superteam)
- **Documentation**: [Full Docs](https://docs.superteam.academy)

---

Built for the Solana ecosystem by [Superteam Brazil](https://superteam.com.br)
