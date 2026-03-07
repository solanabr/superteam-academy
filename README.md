# Superteam Academy

A premium, decentralized web3 learning platform built on Solana. Superteam Academy combines a modern Next.js full-stack application with an Anchor-based Solana smart contract to deliver an immersive educational experience.

## Features

- **Interactive Learning** - Engage with video lessons, reading materials, code challenges, and quizzes
- **On-Chain Credentials** - Earn soulbound XP tokens (SPL Token-2022) and Metaplex Core NFT certificates
- **Gamification** - Track progress with XP rewards, daily streaks, and leaderboards
- **Multi-Language Support** - Full internationalization (English, Spanish, Portuguese)
- **Dual Authentication** - Sign in with Solana wallet, Google, or GitHub
- **Content Management** - Powerful CMS with custom admin dashboard and Payload CMS
- **Analytics & Monitoring** - Integrated PostHog, Sentry, and Google Analytics

## Architecture

The platform is structured as a monorepo with two main components:

### Smart Contract Layer

**`onchain-academy/`** - Anchor program handling all on-chain logic

- Rust-based Solana program (deployable on devnet/mainnet)
- Course enrollment and completion tracking
- XP token minting (SPL Token-2022)
- Credential NFT issuance (Metaplex Core)
- Achievement system
- Comprehensive test suite (TypeScript + Rust)

### Application Layer

**`onchain-academy/apps/academy`** - Next.js frontend and admin dashboard

- Server-side rendered React application (App Router)
- Dual authentication system (Better Auth + Solana wallet)
- Payload CMS for content management
- Custom admin dashboard for course creation
- PostgreSQL database with Prisma ORM
- Real-time analytics and monitoring

## Tech Stack

### Frontend & Backend

| Category                 | Technology                                                |
| ------------------------ | --------------------------------------------------------- |
| **Framework**            | Next.js 16 (App Router), React 19                         |
| **Styling**              | Tailwind CSS 4, Shadcn UI, Framer Motion                  |
| **Authentication**       | Better Auth (Google, GitHub, Email + Solana Wallet)       |
| **CMS**                  | Payload CMS 3 with Lexical Rich Text Editor               |
| **Database**             | PostgreSQL with Payload ORM                               |
| **State Management**     | Zustand, React Query (TanStack Query)                     |
| **Forms**                | React Hook Form with Zod validation                       |
| **Internationalization** | Next-Intl (EN, ES, PT)                                    |
| **Analytics**            | PostHog, Google Analytics 4                               |
| **Monitoring**           | Sentry (error tracking and performance)                   |
| **Deployment**           | Vercel (frontend), Solana devnet/mainnet (smart contract) |

### Web3 Integration

| Category                   | Technology                                     |
| -------------------------- | ---------------------------------------------- |
| **Smart Contracts**        | Anchor Framework 0.32+ (Rust)                  |
| **Blockchain**             | Solana (devnet/mainnet-beta)                   |
| **Wallet Connection**      | Solana Wallet Adapter React                    |
| **RPC Interaction**        | @solana/web3.js, @coral-xyz/anchor             |
| **Token Standard**         | SPL Token-2022 (XP system with transfer hooks) |
| **NFT Standard**           | Metaplex Core (soulbound credentials)          |
| **Signature Verification** | TweetNaCl (Ed25519), bs58 encoding             |

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 20+ and npm/yarn
- **PostgreSQL** 14+ (running locally or remote)
- **Rust** 1.75+ and Cargo
- **Solana CLI** 1.18+
- **Anchor CLI** 0.32+
- **Git** for version control

## Local Development Setup

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/superteam-academy.git
cd superteam-academy
```

### 2. Web Application Setup

Navigate to the frontend app directory:

```bash
cd onchain-academy/apps/academy
```

Install dependencies:

```bash
npm install
```

#### Database Setup

Ensure PostgreSQL is running locally and create a new database:

```bash
createdb superteam_academy
```

Create a `.env` file (copy from `.env.example`):

```bash
cp .env.example .env
```

Edit `.env` with your configuration (see Environment Variables section below).

#### Initialize Database

Run Better Auth migrations to create authentication tables:

```bash
npm run better:migrate
```

Seed the database with sample courses and users:

```bash
npm run seed
```

This will create:

- Sample courses with modules and lessons
- Test users with different roles (admin, instructor, learner)
- Sample XP records and streaks
- Demo content in multiple languages

#### Start Development Server

```bash
npm run dev
```

The application will be accessible at `http://localhost:3000`.

**Available Routes:**

- `/` - Landing page
- `/en/courses` - Course catalog
- `/en/login` - Authentication
- `/en/dashboard` - Learner dashboard
- `/en/admin` - Custom admin dashboard (requires admin role)
- `/admin` - Payload CMS dashboard

### 3. Smart Contract Setup

Navigate to the Anchor program directory:

```bash
cd onchain-academy
```

Install dependencies:

```bash
yarn install
```

Build the Anchor program:

```bash
anchor build
```

This compiles the Rust program and generates TypeScript client code.

#### Run Tests

Run TypeScript integration tests:

```bash
anchor test
```

Run Rust unit tests:

```bash
cargo test --manifest-path tests/rust/Cargo.toml
```

#### Local Validator (Optional)

To test against a local Solana validator:

```bash
# Start local validator with test fixtures
anchor localnet

# In another terminal, run tests
anchor test --skip-local-validator
```

## Environment Variables

Create a `.env` file in `onchain-academy/apps/academy/` with the following variables:

### Required Variables

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/superteam_academy

# Payload CMS
PAYLOAD_SECRET=your_random_secret_key_min_32_chars

# Better Auth
BETTER_AUTH_SECRET=your_random_auth_secret_min_32_chars
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3000
```

### OAuth Providers (Optional)

```env
# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# GitHub OAuth
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
```

### Analytics & Monitoring (Optional)

```env
# PostHog Analytics
NEXT_PUBLIC_POSTHOG_KEY=your_posthog_project_key
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com

# Google Analytics
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX

# Sentry Error Tracking
SENTRY_AUTH_TOKEN=your_sentry_auth_token
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
```

### Solana Configuration (Optional)

```env
# Solana RPC (defaults to devnet if not set)
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_SOLANA_NETWORK=devnet

# Program IDs
NEXT_PUBLIC_PROGRAM_ID=ACAD7Gj75zuQiBAtar5y6rPiUrMjPstFyUeTBZk3QpsB
```

### Generating Secrets

Generate secure random secrets for `PAYLOAD_SECRET` and `BETTER_AUTH_SECRET`:

```bash
# Using OpenSSL
openssl rand -base64 32

# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### OAuth Setup

**Google OAuth:**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`

**GitHub OAuth:**

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Create a new OAuth App
3. Set Authorization callback URL: `http://localhost:3000/api/auth/callback/github`
4. Copy Client ID and generate Client Secret

## Deployment

### Frontend Deployment (Vercel)

#### Prerequisites

- Vercel account
- GitHub repository connected to Vercel
- PostgreSQL database (Vercel Postgres, Supabase, or other provider)

#### Steps

1. **Import Repository**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "Add New Project"
   - Import your GitHub repository

2. **Configure Build Settings**
   - **Framework Preset**: Next.js
   - **Root Directory**: `onchain-academy/apps/academy`
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)
   - **Install Command**: `npm install` (default)

3. **Add Environment Variables**
   - Go to Project Settings → Environment Variables
   - Add all variables from your `.env` file
   - Update URLs to production values:
     ```env
     BETTER_AUTH_URL=https://your-domain.vercel.app
     NEXT_PUBLIC_BETTER_AUTH_URL=https://your-domain.vercel.app
     ```
   - Add production database URL
   - Add production OAuth redirect URIs to Google/GitHub apps

4. **Deploy**
   - Click "Deploy"
   - Vercel will build and deploy your application
   - Subsequent pushes to main branch will auto-deploy

#### Post-Deployment

1. **Run Database Migrations**

   ```bash
   # SSH into Vercel or run locally against production DB
   npm run better:migrate
   ```

2. **Seed Initial Data** (optional)

   ```bash
   npm run seed
   ```

3. **Update OAuth Redirect URIs**
   - Google: Add `https://your-domain.vercel.app/api/auth/callback/google`
   - GitHub: Add `https://your-domain.vercel.app/api/auth/callback/github`

### Smart Contract Deployment (Solana Devnet)

#### Prerequisites

- Solana CLI installed and configured
- Anchor CLI installed
- Wallet with sufficient SOL for deployment (~5 SOL for devnet)
- Devnet SOL (get from [Solana Faucet](https://faucet.solana.com/))

#### Steps

1. **Configure Anchor for Devnet**

Edit `onchain-academy/Anchor.toml`:

```toml
[provider]
cluster = "devnet"
wallet = "/path/to/your/wallet.json"
```

2. **Build the Program**

```bash
cd onchain-academy
anchor build
```

3. **Deploy to Devnet**

```bash
anchor deploy --provider.cluster devnet
```

This will output your program ID. Copy it for the next step.

4. **Update Program ID**

Update the program ID in:

- `onchain-academy/Anchor.toml` (under `[programs.devnet]`)
- `onchain-academy/programs/onchain-academy/src/lib.rs` (declare_id! macro)
- Frontend `.env`: `NEXT_PUBLIC_PROGRAM_ID=<your_program_id>`

5. **Rebuild with New Program ID**

```bash
anchor build
anchor deploy --provider.cluster devnet
```

6. **Initialize Program State**

Run the initialization script:

```bash
cd onchain-academy
npx ts-node scripts/initialize.ts
```

This creates:

- XP token mint (SPL Token-2022)
- Program authority accounts
- Initial course configurations

7. **Verify Deployment**

```bash
# Check program account
solana program show <PROGRAM_ID> --url devnet

# Check program logs
solana logs <PROGRAM_ID> --url devnet
```

### Smart Contract Deployment (Mainnet-Beta)

⚠️ **Warning**: Mainnet deployment requires real SOL and thorough testing.

#### Prerequisites

- Thoroughly tested program on devnet
- Security audit completed (recommended)
- Mainnet wallet with sufficient SOL (~10-20 SOL)
- Backup wallet for program authority

#### Steps

1. **Update Anchor.toml**

```toml
[provider]
cluster = "mainnet-beta"
wallet = "/path/to/mainnet/wallet.json"
```

2. **Build and Deploy**

```bash
anchor build
anchor deploy --provider.cluster mainnet-beta
```

3. **Update Program ID** (same as devnet steps)

4. **Initialize Program** (with mainnet wallet)

```bash
npx ts-node scripts/initialize.ts
```

5. **Update Frontend Environment**

```env
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta
NEXT_PUBLIC_PROGRAM_ID=<mainnet_program_id>
```

6. **Verify and Monitor**

- Test all program instructions
- Monitor program logs
- Set up alerts for errors
- Keep upgrade authority secure

## Project Structure

```
superteam-academy/
├── onchain-academy/                    # Anchor workspace
│   ├── programs/
│   │   └── onchain-academy/           # Solana program (Rust)
│   │       ├── src/
│   │       │   ├── lib.rs            # Program entry point
│   │       │   ├── instructions/     # Program instructions
│   │       │   ├── state/            # Account structures
│   │       │   └── errors.rs         # Custom errors
│   │       └── Cargo.toml
│   ├── tests/                         # Integration tests
│   │   ├── onchain-academy.ts        # TypeScript tests
│   │   └── rust/                     # Rust unit tests
│   ├── scripts/                       # Deployment scripts
│   │   └── initialize.ts             # Program initialization
│   ├── apps/
│   │   └── academy/                  # Next.js application
│   │       ├── app/                  # App Router pages
│   │       │   ├── (frontend)/       # Public-facing pages
│   │       │   │   ├── [locale]/     # Localized routes
│   │       │   │   │   ├── courses/  # Course catalog
│   │       │   │   │   ├── dashboard/# Learner dashboard
│   │       │   │   │   ├── admin/    # Custom admin UI
│   │       │   │   │   └── settings/ # User settings
│   │       │   │   └── api/          # API routes
│   │       │   └── admin/            # Payload CMS admin
│   │       ├── collections/          # Payload collections
│   │       │   ├── Courses.ts
│   │       │   ├── Modules.ts
│   │       │   ├── Lessons.ts
│   │       │   ├── LessonContents.ts
│   │       │   ├── Users.ts
│   │       │   ├── XpRecords.ts
│   │       │   └── Streaks.ts
│   │       ├── services/             # Backend services
│   │       │   ├── courses.service.ts
│   │       │   ├── lessons.service.ts
│   │       │   ├── users.service.ts
│   │       │   ├── leaderboard.service.ts
│   │       │   └── auth-sync.service.ts
│   │       ├── actions/              # Server actions
│   │       │   └── xp.actions.ts
│   │       ├── libs/                 # Utilities
│   │       │   ├── api/              # API clients
│   │       │   ├── auth.ts           # Better Auth config
│   │       │   ├── auth-client.ts    # Auth client
│   │       │   ├── payload.ts        # Payload client
│   │       │   └── solana-auth-plugin.ts
│   │       ├── hooks/                # React hooks
│   │       │   └── useOnchainAcademy.ts
│   │       ├── components/           # React components
│   │       ├── messages/             # i18n translations
│   │       │   ├── en.json
│   │       │   ├── es.json
│   │       │   └── pt.json
│   │       ├── scripts/
│   │       │   └── seed.ts           # Database seeding
│   │       ├── payload.config.ts     # Payload configuration
│   │       └── package.json
│   ├── Anchor.toml                   # Anchor configuration
│   └── package.json
├── docs/                              # Documentation
│   ├── ARCHITECTURE.md               # System architecture
│   ├── DEPLOY-PROGRAM.md             # Deployment guide
│   ├── INTEGRATION.md                # Integration guide
│   └── SPEC.md                       # Technical specs
├── ARCHITECTURE.md                    # Architecture overview
├── CMS_GUIDE.md                      # CMS usage guide
├── CUSTOMIZATION.md                  # Customization guide
└── README.md                         # This file
```

## Key Features Explained

### Authentication System

**Dual Authentication:**

- **Better Auth** - Traditional OAuth (Google, GitHub) and email/password
- **Solana Wallet** - Sign-in with Solana (SIWS) using wallet signature

**Flow:**

1. User connects wallet or chooses OAuth provider
2. For wallet: Sign message to prove ownership
3. Better Auth creates session and syncs to Payload CMS
4. User profile created with unique `betterAuthId`

**User Sync:**

- Better Auth (primary) → Payload CMS (secondary)
- Automatic sync via database hooks
- Wallet users get generated email: `{hash}@wallet.superteam.academy`

### XP System

**Token Standard:** SPL Token-2022 with transfer hooks (soulbound)

**XP Sources:**

- Lesson completion (10-100 XP per lesson)
- Course completion (bonus XP)
- Daily streaks (bonus XP)
- Account setup (100 XP)
- Special achievements

**XP Flow:**

1. User completes lesson in frontend
2. Frontend calls smart contract `complete_lesson` instruction
3. Smart contract mints XP tokens to user's account
4. XP record created in Payload CMS for tracking
5. Leaderboard updated in real-time

**Leaderboard:**

- Real-time rankings based on XP
- Time-filtered views (all-time, monthly, weekly)
- Infinite scroll pagination
- Cached for performance

### Course Completion Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Smart Contract
    participant Payload CMS

    User->>Frontend: Complete Lesson
    Frontend->>Smart Contract: complete_lesson(course_id, lesson_index)
    Smart Contract->>Smart Contract: Update enrollment bitmap
    Smart Contract->>Smart Contract: Mint XP tokens
    Smart Contract-->>Frontend: Success + XP amount
    Frontend->>Payload CMS: Create XP record
    Frontend->>User: Show completion + XP earned

    Note over Smart Contract: If all lessons complete
    Smart Contract->>Smart Contract: Mark course complete
    Smart Contract->>Smart Contract: Mint credential NFT
    Smart Contract-->>Frontend: Course complete + NFT
    Frontend->>User: Show certificate + NFT
```

### Content Management

**Two Admin Interfaces:**

1. **Custom Admin Dashboard** (`/en/admin`)
   - Streamlined UI for course management
   - Visual course builder with drag-and-drop
   - Analytics and user management
   - Built with React and Tailwind CSS

2. **Payload CMS** (`/admin`)
   - Full database access
   - Advanced filtering and bulk operations
   - Media library management
   - Collection-level permissions

**Content Types:**

- **Markdown** - Rich text with code highlighting
- **Video** - Embedded video players (YouTube, Vimeo)
- **Code Challenge** - Interactive coding exercises with test cases
- **Quiz** - Multiple choice and code-based assessments
- **Callouts** - Info, warning, and tip boxes

### Internationalization

**Supported Languages:**

- English (EN) - Primary
- Spanish (ES)
- Portuguese (PT-BR)

**Localized Content:**

- All course content (titles, descriptions, lessons)
- UI strings and navigation
- Error messages and notifications
- Email templates

**URL Structure:**

- `/en/courses` - English
- `/es/courses` - Spanish
- `/pt/courses` - Portuguese

## Development Workflow

### Making Changes

1. **Create a feature branch**

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make changes and test locally**

   ```bash
   npm run dev  # Frontend
   anchor test  # Smart contract
   ```

3. **Run linting**

   ```bash
   npm run lint
   ```

4. **Commit changes**

   ```bash
   git add .
   git commit -m "feat: your feature description"
   ```

5. **Push and create PR**
   ```bash
   git push origin feature/your-feature-name
   ```

### Database Migrations

When modifying Payload collections:

1. Update collection schema in `collections/`
2. Restart dev server (Payload auto-migrates)
3. For Better Auth schema changes:
   ```bash
   npm run better:migrate
   ```

### Smart Contract Updates

When modifying the Anchor program:

1. Update Rust code in `programs/onchain-academy/src/`
2. Rebuild program:
   ```bash
   anchor build
   ```
3. Update tests in `tests/`
4. Run tests:
   ```bash
   anchor test
   ```
5. If changing account structures, update TypeScript types
6. Redeploy to devnet for testing

## Testing

### Frontend Tests

```bash
cd onchain-academy/apps/academy

# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```

### Smart Contract Tests

```bash
cd onchain-academy

# TypeScript integration tests
anchor test

# Rust unit tests
cargo test --manifest-path tests/rust/Cargo.toml

# Test specific file
anchor test --skip-build tests/onchain-academy.ts

# Test with logs
anchor test -- --nocapture
```

### Manual Testing Checklist

- [ ] User registration (wallet + OAuth)
- [ ] Course enrollment
- [ ] Lesson completion
- [ ] XP minting and display
- [ ] Leaderboard updates
- [ ] Daily streak tracking
- [ ] Course completion and NFT minting
- [ ] Admin dashboard access
- [ ] Content creation in CMS
- [ ] Multi-language switching
- [ ] Mobile responsiveness

## Troubleshooting

### Common Issues

**Database Connection Error**

```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

Solution: Ensure PostgreSQL is running

```bash
# macOS
brew services start postgresql

# Linux
sudo systemctl start postgresql
```

**Better Auth Migration Fails**

```
Error: Migration failed
```

Solution: Drop and recreate database

```bash
dropdb superteam_academy
createdb superteam_academy
npm run better:migrate
```

**Anchor Build Fails**

```
Error: package `solana-program` cannot be built
```

Solution: Update Rust and Solana CLI

```bash
rustup update
solana-install update
```

**Wallet Connection Issues**

- Clear browser cache and cookies
- Disconnect wallet from site settings
- Try different wallet adapter
- Check RPC endpoint is accessible

**XP Not Minting**

- Verify program is deployed and initialized
- Check wallet has SOL for transaction fees
- Verify lesson completion transaction succeeded
- Check program logs: `solana logs <PROGRAM_ID>`

### Getting Help

- **Documentation**: See `docs/` folder for detailed guides
- **Issues**: Open an issue on GitHub
- **Discussions**: Join GitHub Discussions
- **Discord**: Join Superteam Discord server

## Performance Optimization

### Frontend

- **Image Optimization**: Use Next.js Image component
- **Code Splitting**: Lazy load components with `React.lazy()`
- **Caching**: React Query caches API responses
- **Static Generation**: Pre-render pages at build time
- **Edge Functions**: Deploy API routes to edge network

### Database

- **Indexing**: Key fields are indexed (slug, betterAuthId, etc.)
- **Connection Pooling**: PostgreSQL connection pool configured
- **Query Optimization**: Use Payload's efficient query builder
- **Caching**: Implement Redis for frequently accessed data

### Smart Contract

- **Account Size**: Minimize account data size
- **Compute Units**: Optimize instruction compute usage
- **Rent Exemption**: All accounts are rent-exempt
- **Batch Operations**: Group multiple operations when possible

## Security Considerations

### Frontend Security

- **Environment Variables**: Never expose secrets in client code
- **CSRF Protection**: Better Auth handles CSRF tokens
- **XSS Prevention**: React escapes content by default
- **Content Security Policy**: Configure in `next.config.js`
- **Rate Limiting**: Implement on API routes

### Smart Contract Security

- **Access Control**: Owner and authority checks on all instructions
- **Account Validation**: Verify all account ownership and types
- **Integer Overflow**: Use checked math operations
- **Reentrancy**: No external calls in critical sections
- **Signer Verification**: Verify all required signers

### Best Practices

- Regular dependency updates
- Security audits before mainnet
- Monitor error logs (Sentry)
- Implement rate limiting
- Use environment-specific configs
- Regular database backups
- Secure private key management

## Contributing

We welcome contributions! Please follow these guidelines:

1. **Fork the repository**
2. **Create a feature branch**
3. **Make your changes**
4. **Write/update tests**
5. **Update documentation**
6. **Submit a pull request**

### Code Style

- **TypeScript**: Follow ESLint configuration
- **Rust**: Follow Rust style guidelines (`cargo fmt`)
- **Commits**: Use conventional commits (feat, fix, docs, etc.)
- **Documentation**: Update relevant docs with changes

## License

This project is licensed under the MIT License. See `LICENSE` file for details.

## Acknowledgments

- **Solana Foundation** - Blockchain infrastructure
- **Anchor Framework** - Smart contract framework
- **Payload CMS** - Content management system
- **Better Auth** - Authentication library
- **Superteam** - Community and support

## Additional Resources

- **Documentation**: See `docs/` folder
- **Architecture**: `ARCHITECTURE.md`
- **CMS Guide**: `CMS_GUIDE.md`
- **Customization**: `CUSTOMIZATION.md`
- **Solana Docs**: https://docs.solana.com
- **Anchor Docs**: https://www.anchor-lang.com
- **Payload Docs**: https://payloadcms.com/docs
- **Next.js Docs**: https://nextjs.org/docs

---

Built with ❤️ by the Superteam community
