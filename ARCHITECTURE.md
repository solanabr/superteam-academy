# System Architecture

Superteam Academy utilizes a hybrid Web2/Web3 architecture to provide a seamless UX while maintaining cryptographic verification of skills.

## Data Flow & State Management

1.  **On-Chain State (Source of Truth for Credentials):**
    *   `Enrollment PDA`: Stores a 256-bit bitmap of completed lessons to prevent double-claiming.
    *   `Token-2022 ATA`: Stores the learner's XP balance (Soulbound).
    *   `Metaplex Core Asset`: The actual certificate.

2.  **Off-Chain State (MongoDB for UX/UI):**
    *   Acts as an indexer and cache.
    *   Stores rich content (Markdown, initial code) via the custom CMS.
    *   Tracks `XPHistory` for the Leaderboard and Notifications.
    *   Handles "Soft Gamification" like Daily Streaks (`lastLessonAt`) and Quests.

## The "Backend Signer" Pattern

To prevent cheating (e.g., a user calling the `complete_lesson` instruction directly via CLI), the platform uses a co-signing model:

1.  User submits code via the browser.
2.  Next.js API route (`/api/verify-lesson`) validates the code using regex-based `validationRules`.
3.  If valid, the server constructs the Anchor transaction and signs it using the `BACKEND_SIGNER` private key.
4.  The server pays for the gas, providing a gasless experience for the learner.

## Component Structure (Next.js 14)

*   `[locale]/`: Handles i18n routing.
*   `api/`: Secure serverless functions interacting with Prisma and `@solana/web3.js`.
*   `components/`: Reusable UI elements (shadcn/ui).
*   `hooks/useUser.ts`: Centralized state manager that syncs DB data with Wallet state.
*   `lib/sync.ts`: Background worker that synchronizes on-chain progress back to the database in case of data loss.