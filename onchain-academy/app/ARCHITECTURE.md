# Frontend Architecture

This document describes the structure, data flow, and key components of the Osmos Academy frontend application.

## 📂 Directory Structure

The project uses the **Next.js App Router** architecture.

```text
app/
├── app/                  # Next.js App Router root
│   ├── [locale]/         # i18n dynamic routing wrap (pages & layouts)
│   ├── api/              # Next.js API Routes (Serverless functions)
│   ├── studio/           # Embedded Sanity Studio route (/studio)
│   └── globals.css       # Core styling, glassmorphism, & CSS variables
├── components/           # Reusable React components (UI, layout, features)
├── lib/                  # Utility functions, API clients, and helpers
├── public/               # Static assets (images, icons)
├── studio/               # Sanity CMS config and schemas
├── sanity.config.ts      # Sanity Studio configuration
└── tailwind.config.js    # Tailwind v4 configuration
```

## 🏗️ System Architecture & Data Flow

### 1. Client-Server Separation
- **Server Components (RSC)**: Used by default for fetching static data (e.g., fetching course catalogs from the backend or Sanity) and heavy rendering to optimize bundle size and SEO.
- **Client Components**: Used for interactive sections, such as the Monaco Code Editor, Wallet connection states, and form submissions. Marked with `"use client"`.

### 2. Content Management (Sanity CMS)
- The app uses an **Embedded Sanity Studio** accessible at `/studio`.
- Sanity acts as the Headless CMS managing courses, milestones, lessons, quizzes, and code challenges.
- **Data Synchronization**: A backend sync process pulls content from Sanity to populate the MongoDB database. The Next.js frontend primarily interfaces with the backend API, but can fetch rich text content and images directly from Sanity using `@sanity/client`.

### 3. Authentication & Authorization
- **NextAuth.js (v5)**: Handles Google, GitHub, and potentially Web3 (SIWS) authentication sessions.
- **Role-Based Access**: Admins have access to specific CMS syncing dashboard features (`/osadmin`).
- **State**: Authentication state is maintained server-side via NextAuth, and passed down securely to client components.

### 4. Web3 / On-chain Integration
- **Wallet Connection**: Managed using `@solana/wallet-adapter-react` and `@solana/wallet-adapter-ui`.
- **Data Reading/Writing**: Uses `@solana/web3.js` to read user XP balances (Soulbound Tokens) and trigger on-chain transactions (e.g., minting completion NFTs). 
- Interactions with the `superteam-academy` Solana program are typically proxied through the backend or signed directly on the client if it requires user funds/signatures.

### 5. Code Execution Environment
- The lesson view uses `@monaco-editor/react` for the heavy lifting of code input.
- Code execution and testing (for Rust/TypeScript challenges) are usually sent to the backend API or a dedicated execution runner for validation against predefined test cases.

## 🎨 Styling Strategy

We enforce a highly polished, aesthetic-first approach:
- **Tailwind CSS (v4)** for utility-first layout construction.
- **Vanilla CSS (`globals.css`)**: Used for complex animations (orbits, shimmers, grain overlays) and premium glassmorphism tokens (`.glass-panel`).
- Theme colors are tightly controlled using CSS variables (`--color-neon-green`, `--color-surface`).
