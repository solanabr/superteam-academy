# Superteam Academy

A full-stack Web3 learning management system (LMS) built on Solana, enabling users to learn blockchain development through interactive courses, earn XP tokens, and receive verifiable on-chain credentials.

## 🌟 Overview

Superteam Academy is a decentralized education platform that combines traditional learning management features with blockchain technology. Users can browse courses, complete interactive coding challenges, track their progress, and earn Token-2022 XP rewards—all secured by the Solana blockchain.

### Key Features

- 🎓 **Interactive Learning Platform** - Browse and enroll in Solana development courses
- 💎 **Token-2022 XP System** - Earn on-chain XP tokens as you complete lessons
- 🔐 **Verifiable Credentials** - Receive NFT certificates upon course completion via DAS (Digital Asset Standard)
- 🌍 **Multi-language Support** - Full internationalization (English, Portuguese, Spanish)
- 👤 **Flexible Authentication** - Social login (Google/GitHub) or wallet-only access
- 📊 **Gamification** - Leaderboards, achievements, and streak tracking
- 🎮 **Code Playground** - Interactive Monaco-based editor with sandboxed execution
- 📱 **Responsive Design** - Mobile-first UI with accessibility features

## 🛠️ Technology Stack

### Frontend
- **Framework**: Next.js 16 (App Router, React 19)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS v4 with CSS tokens
- **UI Components**: Radix UI, Lucide React icons
- **State Management**: Zustand + TanStack Query

### Blockchain Integration
- **Network**: Solana (Devnet/Mainnet)
- **Framework**: Anchor 0.31
- **Wallet**: Solana Wallet Adapter (multi-wallet support)
- **RPC**: Helius API for enhanced performance
- **Token Standard**: SPL Token-2022 for XP rewards

### Authentication & CMS
- **Auth**: NextAuth.js (Google, GitHub OAuth)
- **CMS**: Sanity (with local JSON fallback)
- **Content**: Markdown rendering with syntax highlighting

### Monitoring & Analytics
- **Analytics**: Google Analytics 4 (GA4)
- **Heatmaps**: Microsoft Clarity
- **Error Tracking**: Sentry (client, server, edge)
- **Performance**: Lighthouse CI audits

## 📁 Project Structure

```
superteambr-academy/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── [locale]/          # Internationalized routes
│   │   │   ├── auth/          # Authentication pages
│   │   │   ├── courses/       # Course catalog & details
│   │   │   ├── dashboard/     # User dashboard
│   │   │   ├── leaderboard/   # Global rankings
│   │   │   ├── profile/       # User profiles
│   │   │   ├── certificates/  # Credential viewer
│   │   │   └── settings/      # User settings
│   │   └── api/               # API routes
│   ├── components/            # React components
│   ├── hooks/                 # Custom React hooks
│   ├── lib/                   # Utilities & helpers
│   ├── services/              # Business logic layer
│   ├── content/               # Local course content
│   └── i18n/                  # Internationalization
├── messages/                  # Translation files
├── public/                    # Static assets
└── scripts/                   # Build & audit scripts
```

## 🚀 Getting Started

### Prerequisites

- Node.js 20+ or 22+
- npm or yarn
- Solana wallet (Phantom, Backpack, etc.)
- (Optional) Helius API key for enhanced RPC

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/superteam-br/superteambr-academy.git
   cd superteambr-academy
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file (see Environment Variables section below)

4. **Run development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   
   Navigate to `http://localhost:3000`

## 🔧 Environment Variables

### Required Variables

#### Blockchain Configuration
```bash
NEXT_PUBLIC_RPC_URL=https://devnet.helius-rpc.com/?api-key=YOUR_KEY
NEXT_PUBLIC_PROGRAM_ID=ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf
NEXT_PUBLIC_XP_MINT=xpXPUjkfk7t4AJF1tYUoyAYxzuM5DhinZWS1WjfjAu3
BACKEND_SIGNER_KEYPAIR=YOUR_BACKEND_KEYPAIR
HELIUS_API_KEY=YOUR_HELIUS_KEY
```

#### Authentication
```bash
NEXTAUTH_SECRET=YOUR_RANDOM_SECRET
NEXTAUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET
GITHUB_CLIENT_ID=YOUR_GITHUB_CLIENT_ID
GITHUB_CLIENT_SECRET=YOUR_GITHUB_CLIENT_SECRET
```

#### CMS (Sanity)
```bash
NEXT_PUBLIC_SANITY_PROJECT_ID=YOUR_PROJECT_ID
NEXT_PUBLIC_SANITY_DATASET=production
NEXT_PUBLIC_SANITY_API_VERSION=2025-01-01
SANITY_API_READ_TOKEN=YOUR_READ_TOKEN
```

### Optional Variables

#### Analytics & Monitoring
```bash
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
NEXT_PUBLIC_CLARITY_PROJECT_ID=YOUR_CLARITY_ID
NEXT_PUBLIC_SENTRY_DSN=YOUR_SENTRY_DSN
```

## 📜 Available Scripts

```bash
# Development
npm run dev              # Start development server
npm run build            # Build for production
npm start                # Start production server

# Code Quality
npm run lint             # Run ESLint
npm run type-check       # TypeScript type checking

# Audits
npm run audit:env        # Check environment variables
npm run audit:lighthouse # Run Lighthouse performance audit
npm run audit:locales    # Verify translation completeness
npm run audit:mobile-overflow # Check mobile layout issues

# CMS
npm run cms:seed         # Generate Sanity seed data
```

## 🌐 Application Routes

All routes are internationalized with locale prefix (`/en`, `/pt-BR`, `/es`):

| Route | Description |
|-------|-------------|
| `/{locale}` | Landing page |
| `/{locale}/auth` | Authentication (login/signup) |
| `/{locale}/courses` | Course catalog |
| `/{locale}/courses/[courseId]` | Course details |
| `/{locale}/courses/[courseId]/lessons/[lessonIndex]` | Interactive lesson |
| `/{locale}/dashboard` | Personal dashboard (requires auth) |
| `/{locale}/leaderboard` | Global leaderboard |
| `/{locale}/profile` | Edit profile (requires auth) |
| `/{locale}/profile/[username]` | Public profile view |
| `/{locale}/certificates/[id]` | Credential details |
| `/{locale}/settings` | User settings (requires auth) |

## 🎯 Core User Flows

### 1. Course Enrollment
- Browse course catalog
- View course details and curriculum
- Click "Enroll" → Sign transaction with wallet
- On-chain enrollment confirmed

### 2. Lesson Completion
- Read lesson content
- Complete interactive coding challenge
- Submit solution → Wallet signs action proof
- Backend validates and awards XP tokens

### 3. Course Finalization & Credentials
- Complete all lessons in a course
- Click "Claim Certificate"
- Receive verifiable NFT credential via DAS
- View credential in profile or dedicated page

### 4. Profile Management
- Complete profile with username, bio, avatar
- Toggle public profile visibility
- Share public profile URL

## 📊 Content Management

The platform supports two content modes:

1. **Local JSON** (default for development)
   - Course data stored in `src/content/courses.json`
   - Fast, no external dependencies
   - Ideal for testing

2. **Sanity CMS** (production)
   - Centralized content management
   - Automatic fallback to local content
   - Check status: `GET /api/cms-status`

## 🔐 Authentication Model

Users can access the platform through:

- **Social Login**: Google or GitHub OAuth via NextAuth
- **Wallet-Only**: Direct wallet connection without social login
- **Hybrid**: Both social account and wallet connected

**Note**: On-chain transactions always require wallet signature, regardless of login method.

## 🚢 Deployment

### Vercel (Recommended)

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "feat: initial deployment"
   git push origin main
   ```

2. **Deploy to Vercel**
   ```bash
   vercel --prod
   ```

3. **Set Environment Variables**
   - Use Vercel dashboard or CLI to add all required env vars
   - Verify OAuth callback URLs
   - Enable analytics integrations

### Manual Deployment

```bash
npm run build
npm start
```

Ensure all environment variables are set in your hosting platform.

## 📈 Monitoring & Observability

- **Integration Status**: `GET /api/integration-status`
- **CMS Status**: `GET /api/cms-status`
- **Sentry Test**: `GET /api/sentry-test` (with auth)
- **Lighthouse Reports**: Run `npm run audit:lighthouse`

## 🤝 Contributing

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed technical documentation.

## 📄 License

See [LICENSE](./LICENSE) file for details.

## 🔗 Links

- **Live Demo**: [superteambr-academy.vercel.app](https://superteambr-academy.vercel.app)
- **Documentation**: See `/docs` folder
- **Customization Guide**: [CUSTOMIZATION.md](./CUSTOMIZATION.md)
- **CMS Guide**: [CMS_GUIDE.md](./CMS_GUIDE.md)

---


