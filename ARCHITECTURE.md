# Superteam Academy - Architecture & Technical Specification

## Overview
Superteam Academy is a production-ready Learning Management System (LMS) built for the Solana ecosystem. It features interactive coding challenges, on-chain gamification (XP, Levels), and verifiable credentials (cNFTs).

## Tech Stack
- **Frontend**: Next.js 16 (App Router), TypeScript, Tailwind CSS
- **Authentication**: Supabase Auth (Email/Social) + Solana Wallet Adapter
- **Database**: Supabase (PostgreSQL)
- **CMS**: Sanity (Course content & structure)
- **On-Chain**: 
  - **Solana Devnet**: Deployment target
  - **Compressed NFTs (cNFTs)**: Course completion certificates via Metaplex Bubblegum
  - **Token-2022**: On-chain XP tracking
  - **Light Protocol**: Future ZK-Compression for private credentials

## Core Features

### 1. Dynamic i18n
The platform supports English, Portuguese (Brazil), and Spanish. 
- **Implementation**: `next-intl` with locale-based routing.
- **Middleware**: Automatically detects and redirects to the preferred locale.

### 2. Gamification System
- **XP (Experience Points)**: Earned through lesson completion and coding challenges.
- **Levels**: Automatically calculated based on total XP.
- **Streaks**: Encourages daily learning via activity tracking.
- **Leaderboard**: Global ranking of learners by XP.

### 3. On-Chain Credentials
Completed courses award learners with cNFTs.
- **Efficiency**: Uses Merkle trees for near-zero cost minting.
- **Verifiability**: Mint addresses are stored on-chain and displayable via Solscan.
- **Service Layer**: `BlockchainService` abstracts all Solana interactions.

### 4. Interactive Learning
- **Coding Challenges**: Integrated code editor for Rust/Anchor exercises.
- **Progress Tracking**: Real-time progress persistence via Supabase.

## Project Structure
```
app/[locale]/          # Next.js App Router (i18n)
components/            # Shared UI components (Radix UI + Lucide)
  course/              # Course-specific components
  gamification/        # XP badges, leaderboards
  layout/              # Navbar, Footer
lib/                   # Core logic and services
  services/            # Business logic (Blockchain, Course, User)
  supabase/            # Database client and server helpers
  types.ts             # Global TypeScript interfaces
messages/              # Translation JSON files
```

## On-Chain Integration Flow
1. **Wallet Connection**: Users connect via `WalletMultiButton`.
2. **Account Linking**: The wallet address is automatically linked to the Supabase profile.
3. **Completion**: Upon finishing a course, the backend triggers a cNFT minting process.
4. **Display**: The `Certificates` page fetches cNFTs from Devnet using the Metaplex DAS API (Helius/Metaplex).

## Security & Performance
- **SSR**: Server-side rendering for course catalogs and SEO.
- **Middleware**: Protected routes and locale management.
- **Caching**: Supabase/Sanity caching for high-speed content delivery.
