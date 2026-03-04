# Osmos Academy (Frontend)

Osmos Academy (formerly BlockZero) is a decentralized learning platform built on Solana. It allows users to take courses, complete coding challenges, and earn on-chain verifiable credentials and XP (soulbound tokens).

This directory contains the Next.js frontend application.

## 🚀 Tech Stack

- **Framework**: [Next.js 15 (App Router)](https://nextjs.org/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) with custom Glassmorphism/Neon UI (Vanilla CSS in `globals.css`)
- **State/Data Fetching**: React Server Components & Client Components
- **CMS**: [Sanity.io](https://sanity.io) (Embedded Studio)
- **Authentication**: NextAuth.js (v5 Beta) + Wallet Adapter
- **Web3 Integration**: `@solana/wallet-adapter-react`, `@solana/web3.js`
- **Code Editor**: Monaco Editor (`@monaco-editor/react`) & CodeMirror

## 🛠️ Local Development Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables
Copy the `.env.example` file to `.env.local`:
```bash
cp .env.example .env.local
```
Fill in the required environment variables:
- `AUTH_SECRET`: Generate using `npx auth secret` or `openssl rand -base64 32`
- `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET`: For Google OAuth
- `NEXT_PUBLIC_API_URL`: URL to the backend API (e.g., `http://localhost:5000/api/v1`)
- `NEXT_PUBLIC_GITHUB_CLIENT_ID`: For GitHub OAuth
- `NEXT_PUBLIC_SANITY_PROJECT_ID` / `NEXT_PUBLIC_SANITY_DATASET`: For CMS data fetching

### 3. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.
The Sanity Studio runs locally at [http://localhost:3000/studio](http://localhost:3000/studio).

## 🌍 Internationalization (i18n)

The app supports multiple languages using `next-intl`. The routing structure uses `[locale]` at the root of the `app` directory to serve localized content.

## 🚀 Deployment

The project is optimized for deployment on **Vercel**:

1. Push your code to GitHub.
2. Import the repository into Vercel.
3. Ensure the Build Command is set to `npm run build` or `next build`.
4. Add the necessary Environment Variables in the Vercel dashboard.
5. Deploy!

For CMS capabilities to work in production, ensure your Vercel deployment URL is added to the CORS origins in your Sanity project settings.
