# Superteam Academy - Solana Learning Platform

A modern, gamified learning platform for Solana blockchain development with on-chain credentials, interactive lessons, and community features.

## Features

- 🎓 **Interactive Courses** - Learn Solana development with hands-on lessons
- 🏆 **Gamification** - Earn XP, level up, maintain streaks, and unlock achievements
- 🎯 **NFT Credentials** - On-chain certificates as compressed NFTs (cNFTs)
- 💻 **Code Editor** - In-browser coding environment for interactive lessons
- 👥 **Community** - Discussion forums and leaderboards
- 🔐 **Wallet Connect** - Connect Phantom/Solflare to view on-chain XP and credentials
- 📱 **Responsive Design** - Mobile-first, works on all devices
- 🌙 **Dark Mode** - Developer-friendly dark theme

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **Database**: Supabase (PostgreSQL with Row Level Security)
- **CMS**: Sanity for course content management
- **Blockchain**: Solana (Devnet), @solana/web3.js, @solana/wallet-adapter
- **Auth**: Supabase Auth; wallet connection via Solana Wallet Adapter
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ and npm/pnpm
- A Supabase account and project
- A Sanity account and project

### Environment Variables

Create a `.env.local` file in the root directory:

```bash
# Supabase (already configured via integration)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Sanity CMS
NEXT_PUBLIC_SANITY_PROJECT_ID=your_project_id
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_TOKEN=your_api_token

# Solana
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
```

### Installation

1. **Install dependencies**:
   ```bash
   npm install
   # or
   pnpm install
   ```

2. **Database setup** (already done if you used Supabase integration):
   - Tables are created via migrations
   - RLS policies are enabled
   - Initial achievements are seeded

3. **Run development server**:
   ```bash
   npm run dev
   ```

4. **Open your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

## Database Schema

The platform uses the following main tables:

- `profiles` - User profiles (extends auth.users)
- `user_progress` - XP, levels, streaks tracking
- `courses` - Course catalog (synced from Sanity)
- `lessons` - Lesson content (synced from Sanity)
- `enrollments` - User course enrollments
- `lesson_completions` - Completed lessons and XP earned
- `achievements` - Available achievements
- `user_achievements` - Earned achievements
- `community_posts` - Forum posts
- `community_comments` - Forum comments

All tables have Row Level Security (RLS) enabled.

## Project Structure

```
├── app/                      # Next.js 16 app directory
│   ├── auth/                 # Authentication pages
│   ├── courses/              # Course catalog and detail pages
│   ├── dashboard/            # User dashboard
│   ├── leaderboard/          # Leaderboard page
│   ├── profile/              # User profile page
│   └── page.tsx              # Home page
├── components/               # React components
│   ├── course/               # Course-related components
│   ├── gamification/         # XP badges, achievements
│   ├── layout/               # Navbar, footer
│   └── ui/                   # shadcn/ui components
├── lib/                      # Utilities and services
│   ├── services/             # Business logic layer
│   │   ├── blockchain.service.ts
│   │   ├── course.service.ts
│   │   └── user.service.ts
│   ├── supabase/             # Supabase client setup
│   └── types.ts              # TypeScript types
├── sanity/                   # Sanity CMS schemas
│   └── schemas/              # Content models
├── scripts/                  # Database migrations
└── public/                   # Static assets
```

## Key Features Implementation

### Authentication
- Email/password authentication via Supabase
- Wallet-based authentication (planned)
- Automatic profile creation on signup

### Course Management
- Courses managed in Sanity CMS
- Cached in Supabase for performance
- Lessons support video, article, interactive, and quiz types

### Lesson Experience
- Reading lessons render rich content via Portable Text
- Coding lessons display instructions above the editor and load starter code from Sanity
- Quiz lessons load questions, options, and correct answers from Sanity
- Code challenges include language metadata and optional test cases

### Catalog Search & Sorting
- Search courses by title and description
- Sort by Newest, Popular, or Difficulty
- Home page highlights 5 featured courses

### Gamification
- XP earned for completing lessons
- Level progression system
- Daily streak tracking
- Achievement badges (9 initial achievements)

### Blockchain Integration
- On-chain XP and credential display via wallet connection on Devnet
- Service layer abstractions ready for future on-chain writes
- Enrollment and lesson completion use Supabase

### Enrollment Flow
- Enroll via `/api/enroll` with duplicate enrollment protection
- Courses synced from Sanity to Supabase when needed

## Deployment

### Deploy to Vercel

1. **Via Vercel Dashboard**:
   - Connect your GitHub repository
   - Vercel will auto-detect Next.js
   - Add environment variables
   - Deploy

2. **Via Vercel CLI**:
   ```bash
   npm install -g vercel
   vercel
   ```

3. **Environment Variables**:
   - Add all `.env.local` variables to Vercel project settings
   - Supabase variables should already be set via integration

### Post-Deployment

1. Update Supabase Auth URLs:
   - Go to Supabase Dashboard → Authentication → URL Configuration
   - Set Site URL to your Vercel domain
   - Add redirect URLs

2. Test authentication flow

3. Seed initial content in Sanity (if using)

## Development Guidelines

### Service Layer
All blockchain and data operations use service abstractions:

- `blockchain.service.ts` - On-chain operations (stubbed)
- `course.service.ts` - Course and lesson management
- `user.service.ts` - User profile and progress

This makes it easy to swap implementations later.

### Adding New Pages

1. Create page in `app/` directory
2. Use services for data fetching
3. Follow existing component patterns
4. Ensure responsive design

### Styling Guidelines

- Use Tailwind utility classes
- Follow the existing color system (teal primary, yellow accent)
- Use semantic design tokens from `globals.css`
- Ensure dark mode compatibility

## Testing

(To be implemented)

- Unit tests: Jest + React Testing Library
- E2E tests: Playwright
- Integration tests for services

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For questions or issues:
- Open a GitHub issue
- Contact Superteam Academy support

## Roadmap

- [ ] Complete on-chain writes with Anchor program
- [ ] Add code challenge runner and automated tests
- [ ] Enhance video analytics and progress tracking
- [ ] Build admin dashboard
- [ ] Add community features (forums, Q&A)
- [ ] Implement PWA support
- [ ] Add E2E tests with Playwright
- [ ] Support for multiple languages (Portuguese, Spanish)

---

Built with ❤️ for the Solana community by Superteam Academy
