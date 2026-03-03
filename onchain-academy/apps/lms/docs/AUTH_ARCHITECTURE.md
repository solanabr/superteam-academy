# Authentication & Session Architecture

Superteam Academy requires a hybrid authentication system to support both Web2 users (Google, GitHub) and Web3 crypto-native developers (Solana Wallets).

The application uses **NextAuth.js (Auth.js)** as the single source of truth for user sessions, ensuring a unified session state regardless of how the user logs in.

## 1. Authentication Providers

### Web2 Authentication (Google & GitHub)

- Handled entirely via NextAuth's built-in OAuth providers.
- When a user signs in, NextAuth captures their email, name, and provider ID, checking against the **Payload CMS** user table.
- If no user exists, a new profile is created. If one exists, they are logged in.

### Web3 Authentication (Solana Wallet Adapter)

- Handled via the standard `@solana/wallet-adapter-react` library for connecting the wallet extension (Phantom, Backpack, etc.).
- **Sign-in With Solana (SIWS):** To create a secure session, the user must prove ownership of the wallet. NextAuth handles this via the `CredentialsProvider`.
- When a user clicks "Sign In with Wallet":
  1. The backend generates a secure `nonce` (message challenge).
  2. The frontend prompts the user's wallet to sign this message.
  3. The signature and public key are submitted to NextAuth.
  4. NextAuth verifies the signature. If valid, it checks Payload CMS for a user with that `wallet_address`. Creates or logs in the user.

---

## 2. Managing the Session (Single Source of Truth)

The biggest challenge in a hybrid app is avoiding "split-brain" sessions where the Wallet Adapter thinks the user is logged in, but the backend doesn't, or vice-versa.

**The Solution: NextAuth dictates the session state.**

1. The `<WalletProvider>` from Solana is used strictly for _connecting_ to extensions and _requesting signatures_. It is **NOT** used to define if the user is authenticated in the application.
2. Only when NextAuth issues a session cookie (JWT or database-backed) is the user considered "logged in."
3. Every protected route, API endpoint, and TRPC/server-action relies solely on checking `getServerSession()` from NextAuth.

---

## 3. Account Linking Workflows

A core requirement is allowing users to sign up with Google/GitHub and link a wallet later (which is required to finalize courses and receive on-chain credentials).

### Workflow: Linking a Wallet to an Existing Google Account

1. User logs in with Google. NextAuth creates an active session for User A.
2. User proceeds to the settings page and clicks "Link Solana Wallet".
3. The Wallet Adapter prompts the user to connect their Phantom wallet.
4. The application asks the wallet to sign a unique message to prove ownership of that exact wallet address.
5. The signature is sent to a protected API endpoint (e.g., `/api/auth/link-wallet`).
6. Because the user has an active NextAuth session, the API knows this request is from User A.
7. The API verifies the Solana signature. If valid, it updates User A's profile in Payload CMS to include the `wallet_address`.
8. The NextAuth session is refreshed to include the newly linked wallet address.

### Important Edge Cases:

- **Wallet already linked:** Before linking, the API must check if the `wallet_address` is already attached to another user in Payload CMS to prevent duplicate accounts.
- **Merge accounts:** If the wallet is attached to a temporary "wallet-only" account, but the user now wants to link it to their Google account, you must gracefully merge the XP, achievements, and course progress into the primary Google-backed account in Payload CMS.
