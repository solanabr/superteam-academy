/**
 * Course 6 seed data — Full Stack Solana with Next.js
 * 4 modules, 14 lessons, 5 challenges
 */
export function getCourse6() {
  return {
    slug: "nextjs-solana-dapps",
    title: "Full Stack Solana with Next.js",
    description:
      "Build production-ready dApps using Next.js, Wallet Adapter, and Anchor client. From wallet connection to transaction signing.",
    difficulty: "intermediate",
    duration: "7 hours",
    xpTotal: 900,
    trackId: 5,
    trackLevel: 1,
    trackName: "Frontend & dApps",
    creator: "Superteam Brazil",
    tags: ["nextjs", "react", "frontend", "dapp"],
    prerequisites: ["intro-to-solana"],
    modules: {
      create: [
        // ── Module 1: Project Setup ───────────────────────────────────────────
        {
          title: "Project Setup",
          description:
            "Bootstrap a Next.js project with Solana Wallet Adapter and connect your first wallet.",
          order: 0,
          lessons: {
            create: [
              {
                title: "Next.js for Solana dApps",
                description:
                  "Understand why Next.js is the go-to framework for Solana front-ends and how to scaffold a project.",
                type: "content",
                order: 0,
                xpReward: 20,
                duration: "15 min",
                content: `# Next.js for Solana dApps

## Why Next.js?

Next.js has become the dominant framework for building Solana front-ends. Projects like Jupiter, Tensor, Magic Eden, and Marinade all ship production dApps on Next.js. The reasons are practical: server-side rendering improves first-paint speed for data-heavy dashboards, the App Router gives you fine-grained control over which code runs on the server versus the client, and the file-based routing convention keeps large dApps navigable.

## Scaffolding the Project

Start with \`create-next-app\`:

\`\`\`bash
npx create-next-app@latest my-solana-dapp --typescript --tailwind --app --src-dir
cd my-solana-dapp
\`\`\`

Install the Solana dependencies you will use throughout this course:

\`\`\`bash
npm install @solana/web3.js @solana/wallet-adapter-base \\
  @solana/wallet-adapter-react @solana/wallet-adapter-react-ui \\
  @solana/wallet-adapter-wallets @coral-xyz/anchor
\`\`\`

## Project Structure

A typical Solana dApp extends the default Next.js layout with a few extra directories:

\`\`\`
src/
  app/
    layout.tsx        # Root layout with WalletProvider
    page.tsx          # Landing page
  components/
    WalletButton.tsx  # Wallet connect/disconnect
  lib/
    anchor.ts         # Anchor provider helpers
    constants.ts      # Program IDs, cluster URLs
  idl/
    my_program.json   # Anchor IDL (generated)
\`\`\`

The key architectural decision is where to place the \`WalletProvider\`. Because Wallet Adapter uses React Context, it must wrap any component that reads wallet state. In the App Router you mark the provider file with \`"use client"\` and import it inside \`layout.tsx\`.

## Client vs. Server Components

Solana wallet interactions are inherently client-side: they access browser APIs like \`window.solana\` and trigger pop-up signing dialogs. Any component that calls \`useWallet()\` or \`useConnection()\` must be a Client Component. However, you can still leverage Server Components for pages that only display static content or fetch on-chain data through an RPC on the server before hydration.

A good rule of thumb: keep the provider boundary as narrow as possible. Wrap only the subtree that needs wallet access, and let the rest of the page render on the server for speed.

## Environment Variables

Store your RPC endpoint in \`.env.local\`:

\`\`\`
NEXT_PUBLIC_RPC_URL=https://api.devnet.solana.com
\`\`\`

Prefix with \`NEXT_PUBLIC_\` so the value is available in Client Components. For production you should use a dedicated RPC provider such as Helius or Triton to avoid rate limits on the public endpoint.

## Summary

You now have a clean Next.js project with every Solana package you need installed. In the next lesson you will configure Wallet Adapter and make the provider tree work inside the App Router.`,
              },
              {
                title: "Wallet Adapter Setup",
                description:
                  "Configure the Solana Wallet Adapter provider tree inside a Next.js App Router layout.",
                type: "content",
                order: 1,
                xpReward: 25,
                duration: "20 min",
                content: `# Wallet Adapter Setup

## Overview

The \`@solana/wallet-adapter-react\` library provides three React context providers that your dApp needs: \`ConnectionProvider\`, \`WalletProvider\`, and the optional \`WalletModalProvider\` from the UI package. In this lesson you will wire them together inside the Next.js App Router.

## Creating the Provider Component

Create a Client Component that bundles all three providers:

\`\`\`tsx
// src/components/SolanaProvider.tsx
"use client";

import { FC, ReactNode, useMemo } from "react";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter, SolflareWalletAdapter } from "@solana/wallet-adapter-wallets";
import { clusterApiUrl } from "@solana/web3.js";

import "@solana/wallet-adapter-react-ui/styles.css";

export const SolanaProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const endpoint = process.env.NEXT_PUBLIC_RPC_URL || clusterApiUrl("devnet");

  const wallets = useMemo(
    () => [new PhantomWalletAdapter(), new SolflareWalletAdapter()],
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};
\`\`\`

## Key Details

**\`"use client"\`** -- This directive is mandatory. The three providers use \`useContext\` and \`useState\` internally, so they cannot run on the server.

**\`useMemo\` for wallets** -- Without \`useMemo\`, React would create new adapter instances on every render, causing the wallet modal to reset. Always memoize the array.

**\`autoConnect\`** -- When \`true\`, Wallet Adapter attempts to reconnect the last-used wallet on page load. This gives returning users a seamless experience.

## Plugging Into the Layout

Open \`src/app/layout.tsx\` and wrap the children:

\`\`\`tsx
import { SolanaProvider } from "@/components/SolanaProvider";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SolanaProvider>{children}</SolanaProvider>
      </body>
    </html>
  );
}
\`\`\`

Because \`layout.tsx\` itself is a Server Component, importing a Client Component here is fine -- Next.js will render the server parts on the server and hydrate the client parts on the browser.

## Supported Wallets

The \`wallets\` array controls which wallets appear in the modal. For Solana in 2024-2025, most dApps include Phantom and Solflare at minimum. The Wallet Standard also allows browser extensions to register themselves automatically, so users with newer wallets may see them even without explicit adapters.

## Styling

The default UI package ships with a CSS file (\`@solana/wallet-adapter-react-ui/styles.css\`). Import it once in your provider component. You can override styles with Tailwind utility classes or a custom theme if the defaults do not match your design system.

## Summary

Your provider tree is now complete. Every Client Component in the app can call \`useWallet()\` and \`useConnection()\` to interact with the blockchain. Next, you will build the actual Connect Wallet button.`,
              },
              {
                title: "Connect Wallet Button",
                description:
                  "Build a custom Connect Wallet button component using the useWallet hook.",
                type: "challenge",
                order: 2,
                xpReward: 75,
                duration: "30 min",
                content: `# Connect Wallet Button

## Why Build a Custom Button?

The Wallet Adapter UI package ships a ready-made \`<WalletMultiButton />\` that works out of the box. For many prototypes that is enough. However, production dApps almost always need a custom button that matches their design system, shows a truncated address, displays the user avatar, or integrates with a dropdown menu. In this lesson you will build one from scratch using the \`useWallet\` hook.

## The useWallet Hook

\`useWallet()\` returns everything you need:

\`\`\`tsx
const {
  publicKey,    // PublicKey | null
  connected,    // boolean
  connecting,   // boolean
  disconnect,   // () => Promise<void>
  select,       // (walletName) => void
  wallet,       // WalletAdapter | null
} = useWallet();
\`\`\`

When no wallet is connected, \`publicKey\` is \`null\` and \`connected\` is \`false\`. After the user approves the connection, \`publicKey\` becomes available and \`connected\` flips to \`true\`.

## Building the Component

A minimal custom button handles three states:

1. **Disconnected** -- show "Connect Wallet" and open the modal.
2. **Connecting** -- show a spinner or "Connecting..." text.
3. **Connected** -- show the truncated address and a disconnect option.

\`\`\`tsx
"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";

export function ConnectWalletButton() {
  const { publicKey, connected, connecting, disconnect } = useWallet();
  const { setVisible } = useWalletModal();

  if (connecting) {
    return <button disabled className="btn-secondary">Connecting...</button>;
  }

  if (connected && publicKey) {
    const address = publicKey.toBase58();
    const short = address.slice(0, 4) + "..." + address.slice(-4);
    return (
      <button onClick={() => disconnect()} className="btn-primary">
        {short}
      </button>
    );
  }

  return (
    <button onClick={() => setVisible(true)} className="btn-primary">
      Connect Wallet
    </button>
  );
}
\`\`\`

## Truncating Addresses

Solana public keys are 32 bytes encoded as base58, typically 43-44 characters. Displaying the full key is never a good UX choice. The standard convention is to show the first 4 and last 4 characters separated by an ellipsis.

## Accessibility

Make sure the button communicates state to screen readers. Use \`aria-busy={connecting}\` during the connecting phase and \`aria-label\` to describe the current action. A production component should also handle keyboard navigation if you build a dropdown for the connected state.

## What Happens Under the Hood

When the user clicks "Connect Wallet" and selects Phantom, the adapter calls \`window.solana.connect()\`. The wallet extension opens a pop-up asking the user to approve the connection. On approval, the adapter fires an event that updates the React context, causing every component that reads \`useWallet()\` to re-render with the new \`publicKey\`.

## Summary

You now understand how to build a fully custom wallet button. The challenge below asks you to implement this component with all three states and proper address truncation.`,
                challenge: {
                  create: {
                    prompt:
                      "Create a React component called ConnectWalletButton that uses the useWallet and useWalletModal hooks. It should render: a disabled button with text 'Connecting...' when connecting is true; a button showing the truncated public key (first 4 + '...' + last 4 base58 characters) that calls disconnect() when clicked; or a 'Connect Wallet' button that opens the wallet modal. Export the component as a named export.",
                    starterCode: `"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";

export function ConnectWalletButton() {
  // TODO: Destructure wallet state from useWallet()
  // TODO: Get setVisible from useWalletModal()
  // TODO: Handle three states: connecting, connected, disconnected
  // TODO: Truncate the public key for display

  return <button>Connect Wallet</button>;
}`,
                    language: "typescript",
                    hints: [
                      "Destructure { publicKey, connected, connecting, disconnect } from useWallet()",
                      "Use publicKey.toBase58() to get the string representation, then slice(0,4) + '...' + slice(-4)",
                      "Call setVisible(true) from useWalletModal() to open the wallet selection modal",
                    ],
                    solution: `"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";

export function ConnectWalletButton() {
  const { publicKey, connected, connecting, disconnect } = useWallet();
  const { setVisible } = useWalletModal();

  if (connecting) {
    return <button disabled>Connecting...</button>;
  }

  if (connected && publicKey) {
    const address = publicKey.toBase58();
    const short = address.slice(0, 4) + "..." + address.slice(-4);
    return <button onClick={() => disconnect()}>{short}</button>;
  }

  return <button onClick={() => setVisible(true)}>Connect Wallet</button>;
}`,
                    testCases: {
                      create: [
                        {
                          name: "Renders connect button when disconnected",
                          input: "connected=false, connecting=false, publicKey=null",
                          expectedOutput: "Button with text 'Connect Wallet' that calls setVisible(true)",
                          order: 0,
                        },
                        {
                          name: "Shows connecting state",
                          input: "connected=false, connecting=true, publicKey=null",
                          expectedOutput: "Disabled button with text 'Connecting...'",
                          order: 1,
                        },
                        {
                          name: "Shows truncated address when connected",
                          input: "connected=true, publicKey=PublicKey('7EcDhSYGxXyscszYEp35KHN8vvw3svAuLKTzXwCFLtV')",
                          expectedOutput: "Button with text '7EcD...LtV' that calls disconnect()",
                          order: 2,
                        },
                      ],
                    },
                  },
                },
              },
            ],
          },
        },
        // ── Module 2: Reading On-Chain Data ──────────────────────────────────
        {
          title: "Reading On-Chain Data",
          description:
            "Fetch balances, account data, and token holdings from the Solana blockchain inside React components.",
          order: 1,
          lessons: {
            create: [
              {
                title: "RPC Methods Overview",
                description:
                  "Learn the most important Solana JSON-RPC methods and how to call them with @solana/web3.js.",
                type: "content",
                order: 0,
                xpReward: 25,
                duration: "20 min",
                content: `# RPC Methods Overview

## How dApps Talk to Solana

Every Solana dApp communicates with the network through JSON-RPC calls. The \`@solana/web3.js\` library wraps these calls in a \`Connection\` object. When you call \`useConnection()\` from Wallet Adapter, you get a \`Connection\` instance pre-configured with the endpoint you specified in your provider.

\`\`\`tsx
import { useConnection } from "@solana/wallet-adapter-react";

function MyComponent() {
  const { connection } = useConnection();
  // connection is a web3.js Connection object
}
\`\`\`

## Essential RPC Methods

Here are the methods you will use most often when building dApps:

### getBalance

Returns the SOL balance in lamports (1 SOL = 1,000,000,000 lamports):

\`\`\`ts
const lamports = await connection.getBalance(publicKey);
const sol = lamports / 1e9;
\`\`\`

### getAccountInfo

Returns the raw account data including the owner program, lamports, and the data buffer:

\`\`\`ts
const info = await connection.getAccountInfo(publicKey);
if (info) {
  console.log("Owner:", info.owner.toBase58());
  console.log("Data length:", info.data.length);
}
\`\`\`

This is the foundation for reading program-owned accounts. The \`data\` buffer contains the serialized state that you decode with Borsh or Anchor's IDL.

### getTokenAccountsByOwner

Returns all SPL token accounts owned by a wallet:

\`\`\`ts
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";

const response = await connection.getTokenAccountsByOwner(publicKey, {
  programId: TOKEN_PROGRAM_ID,
});
\`\`\`

### getProgramAccounts

Fetches all accounts owned by a specific program. This is powerful but expensive -- always use filters to narrow results:

\`\`\`ts
const accounts = await connection.getProgramAccounts(programId, {
  filters: [
    { dataSize: 165 },
    { memcmp: { offset: 32, bytes: publicKey.toBase58() } },
  ],
});
\`\`\`

### getLatestBlockhash

Required for building transactions. Returns the recent blockhash and the last valid block height:

\`\`\`ts
const { blockhash, lastValidBlockHeight } =
  await connection.getLatestBlockhash();
\`\`\`

## Commitment Levels

Every RPC method accepts an optional commitment parameter: \`processed\`, \`confirmed\`, or \`finalized\`. For UI updates, \`confirmed\` (the default) is usually the right choice. Use \`finalized\` when you need certainty that a transaction will not be rolled back, such as before issuing a credential.

## Rate Limits

The public RPC endpoint (\`api.devnet.solana.com\`) has strict rate limits. In production, use a dedicated provider like Helius, Triton, or QuickNode. They offer higher throughput and additional APIs such as DAS (Digital Asset Standard) for compressed NFTs.

## Summary

You now know the core RPC methods for reading Solana state. In the next lesson you will fetch account data inside a React component and display it to the user.`,
              },
              {
                title: "Fetch Account Data",
                description:
                  "Use useConnection and useWallet hooks together to fetch and display on-chain account data in React.",
                type: "content",
                order: 1,
                xpReward: 30,
                duration: "25 min",
                content: `# Fetch Account Data

## Combining useConnection and useWallet

To read on-chain data for the connected user, you need both hooks:

\`\`\`tsx
"use client";

import { useConnection } from "@solana/wallet-adapter-react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useEffect, useState } from "react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";

export function BalanceDisplay() {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    if (!publicKey) {
      setBalance(null);
      return;
    }

    connection.getBalance(publicKey).then((lamports) => {
      setBalance(lamports / LAMPORTS_PER_SOL);
    });
  }, [publicKey, connection]);

  if (!publicKey) return <p>Connect your wallet to see your balance.</p>;
  if (balance === null) return <p>Loading...</p>;

  return <p>Balance: {balance.toFixed(4)} SOL</p>;
}
\`\`\`

## The Data Fetching Pattern

This pattern recurs throughout Solana dApp development:

1. Check that \`publicKey\` is not null (wallet is connected).
2. Call an RPC method with the connection.
3. Store the result in local state.
4. Re-fetch when \`publicKey\` or \`connection\` changes.

## Handling Loading and Error States

Production components need to handle three states: loading, success, and error. A clean approach:

\`\`\`tsx
const [state, setState] = useState<{
  loading: boolean;
  data: number | null;
  error: string | null;
}>({ loading: false, data: null, error: null });

useEffect(() => {
  if (!publicKey) return;
  setState({ loading: true, data: null, error: null });

  connection
    .getBalance(publicKey)
    .then((lamports) =>
      setState({ loading: false, data: lamports / LAMPORTS_PER_SOL, error: null })
    )
    .catch((err) =>
      setState({ loading: false, data: null, error: err.message })
    );
}, [publicKey, connection]);
\`\`\`

## Fetching Program Accounts

To read data from a custom program, use \`getAccountInfo\` and decode the buffer:

\`\`\`ts
import { Program, AnchorProvider } from "@coral-xyz/anchor";
import idl from "@/idl/my_program.json";

const program = new Program(idl, provider);
const account = await program.account.myAccount.fetch(accountPublicKey);
\`\`\`

Anchor's \`program.account\` namespace handles deserialization automatically using the IDL. This is far easier than manually parsing Borsh-encoded buffers.

## Avoiding Unnecessary Re-fetches

Each RPC call costs time and counts against your rate limit. Common strategies:

- **Stale-while-revalidate**: Show cached data immediately, refresh in the background.
- **Polling interval**: Re-fetch every 30 seconds instead of on every render.
- **Subscription**: Use WebSocket subscriptions for real-time updates (covered later in this module).

## Null Safety

Always guard against \`publicKey\` being null. If the user disconnects mid-session, any pending RPC call should be ignored. Use an AbortController or a cleanup function in your \`useEffect\` to prevent state updates on unmounted components.

## Summary

You can now fetch and display any on-chain data inside a React component. The next challenge asks you to build a complete balance display with proper loading and error handling.`,
              },
              {
                title: "Build a Balance Display",
                description:
                  "Build a React component that fetches and displays the connected wallet's SOL balance with loading and error states.",
                type: "challenge",
                order: 2,
                xpReward: 75,
                duration: "35 min",
                content: `# Build a Balance Display

## The Goal

In this challenge you will build a production-quality \`BalanceDisplay\` component that shows the connected wallet's SOL balance. This is one of the most common UI patterns in Solana dApps -- you will find it in wallet dashboards, DEX interfaces, and portfolio trackers.

## Requirements

Your component must handle four distinct states:

1. **No wallet connected** -- render a message prompting the user to connect.
2. **Loading** -- show a loading indicator while the RPC call is in flight.
3. **Error** -- display an error message if the RPC call fails.
4. **Success** -- show the balance formatted to 4 decimal places.

## Implementation Strategy

The cleanest approach is a reducer or a simple state object:

\`\`\`tsx
type BalanceState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; balance: number };
\`\`\`

Use \`useEffect\` to trigger the fetch whenever \`publicKey\` changes. Remember to handle the case where the component unmounts before the fetch completes.

## Cleanup Pattern

When a user rapidly switches wallets or disconnects, you may have stale promises resolving. Use a boolean flag:

\`\`\`tsx
useEffect(() => {
  if (!publicKey) {
    setState({ status: "idle" });
    return;
  }

  let cancelled = false;
  setState({ status: "loading" });

  connection.getBalance(publicKey).then(
    (lamports) => {
      if (!cancelled) {
        setState({ status: "success", balance: lamports / LAMPORTS_PER_SOL });
      }
    },
    (err) => {
      if (!cancelled) {
        setState({ status: "error", message: err.message });
      }
    }
  );

  return () => { cancelled = true; };
}, [publicKey, connection]);
\`\`\`

## Formatting

Use \`toFixed(4)\` for displaying SOL amounts. For very large or very small amounts you might want \`Intl.NumberFormat\`, but four decimal places is the standard convention in the Solana ecosystem.

## Refresh Button

A nice touch is a refresh button that re-triggers the fetch. You can implement this by keeping a \`refreshKey\` counter in state and including it in the \`useEffect\` dependency array.

## Testing Considerations

When writing tests for this component, you will mock \`useWallet\` and \`useConnection\`. The mocked connection should return a resolved promise for happy-path tests and a rejected promise for error tests. Check that the component does not update state after unmounting.

## Summary

This challenge tests your ability to combine Wallet Adapter hooks with RPC calls and React state management. Handle all four states correctly and you will have a reusable pattern for every data-fetching component in your dApp.`,
                challenge: {
                  create: {
                    prompt:
                      "Create a BalanceDisplay component that uses useWallet and useConnection to fetch the connected wallet's SOL balance. Handle four states: (1) no wallet - show 'Connect your wallet'; (2) loading - show 'Loading...'; (3) error - show the error message; (4) success - show balance formatted to 4 decimal places like 'Balance: 1.5000 SOL'. Use a cleanup flag in useEffect to prevent stale updates. Export as a named export.",
                    starterCode: `"use client";

import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useEffect, useState } from "react";

type BalanceState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; balance: number };

export function BalanceDisplay() {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [state, setState] = useState<BalanceState>({ status: "idle" });

  // TODO: useEffect to fetch balance when publicKey changes
  // TODO: Handle cleanup to prevent stale updates
  // TODO: Render based on state.status

  return <div>TODO</div>;
}`,
                    language: "typescript",
                    hints: [
                      "Use a 'let cancelled = false' flag inside useEffect and set it to true in the cleanup function",
                      "Call connection.getBalance(publicKey) and divide by LAMPORTS_PER_SOL",
                      "Use .toFixed(4) to format the balance to 4 decimal places",
                    ],
                    solution: `"use client";

import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useEffect, useState } from "react";

type BalanceState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; balance: number };

export function BalanceDisplay() {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [state, setState] = useState<BalanceState>({ status: "idle" });

  useEffect(() => {
    if (!publicKey) {
      setState({ status: "idle" });
      return;
    }

    let cancelled = false;
    setState({ status: "loading" });

    connection.getBalance(publicKey).then(
      (lamports) => {
        if (!cancelled) {
          setState({ status: "success", balance: lamports / LAMPORTS_PER_SOL });
        }
      },
      (err) => {
        if (!cancelled) {
          setState({ status: "error", message: err.message });
        }
      }
    );

    return () => { cancelled = true; };
  }, [publicKey, connection]);

  if (state.status === "idle") return <p>Connect your wallet</p>;
  if (state.status === "loading") return <p>Loading...</p>;
  if (state.status === "error") return <p>Error: {state.message}</p>;
  return <p>Balance: {state.balance.toFixed(4)} SOL</p>;
}`,
                    testCases: {
                      create: [
                        {
                          name: "Shows connect prompt when no wallet",
                          input: "publicKey=null",
                          expectedOutput: "Text 'Connect your wallet'",
                          order: 0,
                        },
                        {
                          name: "Shows loading state",
                          input: "publicKey=valid, getBalance=pending",
                          expectedOutput: "Text 'Loading...'",
                          order: 1,
                        },
                        {
                          name: "Displays formatted balance",
                          input: "publicKey=valid, getBalance resolves 2500000000",
                          expectedOutput: "Text 'Balance: 2.5000 SOL'",
                          order: 2,
                        },
                        {
                          name: "Displays error on RPC failure",
                          input: "publicKey=valid, getBalance rejects 'RPC timeout'",
                          expectedOutput: "Text containing 'RPC timeout'",
                          order: 3,
                        },
                      ],
                    },
                  },
                },
              },
              {
                title: "Real-Time Subscriptions",
                description:
                  "Use Solana WebSocket subscriptions to get live updates for account changes and log events.",
                type: "content",
                order: 3,
                xpReward: 30,
                duration: "25 min",
                content: `# Real-Time Subscriptions

## Why Subscriptions?

Polling the RPC every few seconds wastes bandwidth and gives a sluggish user experience. Solana validators expose a WebSocket API that pushes updates to your client whenever an account changes. This is how DEX interfaces show live price feeds and wallet apps update balances instantly.

## Account Change Subscription

The \`Connection\` object provides \`onAccountChange\` to listen for updates to a specific account:

\`\`\`tsx
"use client";

import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useEffect, useState } from "react";

export function LiveBalance() {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    if (!publicKey) return;

    // Fetch initial balance
    connection.getBalance(publicKey).then((lamports) => {
      setBalance(lamports / LAMPORTS_PER_SOL);
    });

    // Subscribe to changes
    const subId = connection.onAccountChange(
      publicKey,
      (accountInfo) => {
        setBalance(accountInfo.lamports / LAMPORTS_PER_SOL);
      },
      "confirmed"
    );

    return () => {
      connection.removeAccountChangeListener(subId);
    };
  }, [publicKey, connection]);

  if (!publicKey) return <p>Connect wallet</p>;
  if (balance === null) return <p>Loading...</p>;
  return <p>Balance: {balance.toFixed(4)} SOL</p>;
}
\`\`\`

## How It Works

When you call \`onAccountChange\`, the library opens a WebSocket connection to the validator and sends a \`accountSubscribe\` message. Whenever the account's data or lamports change on-chain, the validator pushes the updated \`AccountInfo\` object through the socket. Your callback fires with the new data.

## Log Subscription

You can also subscribe to program logs with \`onLogs\`:

\`\`\`ts
const subId = connection.onLogs(
  programId,
  (logs) => {
    console.log("Transaction:", logs.signature);
    console.log("Logs:", logs.logs);
  },
  "confirmed"
);
\`\`\`

This is useful for monitoring program events in real time -- for example, showing a notification when a new bid arrives in an auction program.

## Cleanup is Critical

Every subscription holds an open WebSocket. If you forget to remove the listener in your \`useEffect\` cleanup, you will leak connections. This causes memory issues and may hit the RPC provider's concurrent subscription limit. Always return a cleanup function:

\`\`\`ts
return () => {
  connection.removeAccountChangeListener(subId);
};
\`\`\`

## Subscription Limits

Public RPC endpoints typically allow only a handful of concurrent subscriptions. Dedicated providers offer higher limits, but you should still be judicious. Subscribe only to accounts the user is actively viewing. When the component unmounts, unsubscribe.

## Combining Polling and Subscriptions

A robust pattern is to use subscriptions for low-latency updates and a slow poll (every 60 seconds) as a fallback. WebSocket connections can drop silently, so the poll catches any missed updates:

\`\`\`ts
const interval = setInterval(() => {
  connection.getBalance(publicKey).then((lamports) => {
    setBalance(lamports / LAMPORTS_PER_SOL);
  });
}, 60_000);

return () => {
  clearInterval(interval);
  connection.removeAccountChangeListener(subId);
};
\`\`\`

## Summary

WebSocket subscriptions give your dApp real-time data without polling overhead. Use \`onAccountChange\` for balance and account state updates, \`onLogs\` for program events, and always clean up your listeners.`,
              },
            ],
          },
        },
        // ── Module 3: Sending Transactions ──────────────────────────────────
        {
          title: "Sending Transactions",
          description:
            "Build and send Solana transactions from React components, including error handling and confirmation UI.",
          order: 2,
          lessons: {
            create: [
              {
                title: "Transaction Building in React",
                description:
                  "Learn how to construct, sign, and send Solana transactions from a React component.",
                type: "content",
                order: 0,
                xpReward: 30,
                duration: "25 min",
                content: `# Transaction Building in React

## The Transaction Lifecycle

Sending a transaction from a dApp involves four steps:

1. **Build** -- Construct a \`Transaction\` or \`VersionedTransaction\` with one or more instructions.
2. **Sign** -- The connected wallet signs the transaction.
3. **Send** -- Submit the signed transaction to the network.
4. **Confirm** -- Wait for the network to confirm inclusion.

Wallet Adapter provides \`sendTransaction\` on the \`useWallet\` hook, which handles steps 2 and 3 together.

## Building a SOL Transfer

The most common transaction is a simple SOL transfer using the System Program:

\`\`\`tsx
import {
  Transaction,
  SystemProgram,
  PublicKey,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";

function buildTransferTx(from: PublicKey, to: PublicKey, solAmount: number) {
  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: from,
      toPubkey: to,
      lamports: Math.round(solAmount * LAMPORTS_PER_SOL),
    })
  );
  return transaction;
}
\`\`\`

## Sending with Wallet Adapter

The \`sendTransaction\` method takes a \`Transaction\` and a \`Connection\`, requests the wallet to sign, and submits it:

\`\`\`tsx
const { publicKey, sendTransaction } = useWallet();
const { connection } = useConnection();

async function handleSend() {
  if (!publicKey) return;

  const recipient = new PublicKey("TARGET_ADDRESS_HERE");
  const tx = buildTransferTx(publicKey, recipient, 0.1);

  const signature = await sendTransaction(tx, connection);
  console.log("Sent:", signature);
}
\`\`\`

Under the hood, \`sendTransaction\` fetches the latest blockhash, sets it on the transaction, asks the wallet to sign, and calls \`connection.sendRawTransaction\`.

## Confirming the Transaction

After sending you get a signature string. To wait for confirmation:

\`\`\`ts
const { blockhash, lastValidBlockHeight } =
  await connection.getLatestBlockhash();

const confirmation = await connection.confirmTransaction({
  signature,
  blockhash,
  lastValidBlockHeight,
});

if (confirmation.value.err) {
  console.error("Transaction failed:", confirmation.value.err);
} else {
  console.log("Transaction confirmed!");
}
\`\`\`

## Versioned Transactions

Solana supports Versioned Transactions which enable Address Lookup Tables (ALTs) for more compact transactions. For simple transfers the legacy \`Transaction\` class works fine. When interacting with complex DeFi protocols that reference many accounts, you may need \`VersionedTransaction\`:

\`\`\`ts
import { TransactionMessage, VersionedTransaction } from "@solana/web3.js";

const message = new TransactionMessage({
  payerKey: publicKey,
  recentBlockhash: blockhash,
  instructions: [transferIx],
}).compileToV0Message();

const vtx = new VersionedTransaction(message);
\`\`\`

## Priority Fees

During periods of network congestion, transactions without priority fees may be delayed or dropped. Add a Compute Budget instruction to set a priority fee:

\`\`\`ts
import { ComputeBudgetProgram } from "@solana/web3.js";

transaction.add(
  ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 50_000 })
);
\`\`\`

This tells the validator you are willing to pay extra per compute unit, increasing the likelihood your transaction is included in the next block.

## Summary

You now understand the full lifecycle of a Solana transaction in a React context. In the next challenge you will build a complete Send SOL component.`,
              },
              {
                title: "Send SOL Component",
                description:
                  "Build an interactive component that lets users send SOL to any address with transaction confirmation feedback.",
                type: "challenge",
                order: 1,
                xpReward: 75,
                duration: "35 min",
                content: `# Send SOL Component

## The Goal

In this challenge you will build a \`SendSol\` component that lets the connected user send SOL to any address. This is a core pattern that appears in every wallet interface and many dApp UIs. The component needs a recipient input, an amount input, a send button, and transaction status feedback.

## Component Structure

A well-organized Send SOL component manages several pieces of state:

\`\`\`tsx
const [recipient, setRecipient] = useState("");
const [amount, setAmount] = useState("");
const [status, setStatus] = useState<"idle" | "sending" | "confirmed" | "error">("idle");
const [signature, setSignature] = useState<string | null>(null);
const [error, setError] = useState<string | null>(null);
\`\`\`

## Validation

Before sending, validate the inputs:

1. **Recipient** must be a valid base58 public key. Use a try/catch around \`new PublicKey(recipient)\` -- it throws if the string is invalid.
2. **Amount** must be a positive number. Check \`parseFloat(amount) > 0\`.
3. **Wallet** must be connected. Guard with \`if (!publicKey) return\`.

\`\`\`ts
function isValidPublicKey(address: string): boolean {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
}
\`\`\`

## The Send Flow

When the user clicks "Send":

1. Set status to \`"sending"\` and disable the button.
2. Build a \`Transaction\` with a \`SystemProgram.transfer\` instruction.
3. Call \`sendTransaction(tx, connection)\`.
4. Await \`connection.confirmTransaction\`.
5. On success, set status to \`"confirmed"\` and store the signature.
6. On failure, set status to \`"error"\` and store the error message.

## Showing the Transaction Link

After confirmation, display a link to the transaction on Solana Explorer:

\`\`\`tsx
{signature && (
  <a
    href={\`https://explorer.solana.com/tx/\${signature}?cluster=devnet\`}
    target="_blank"
    rel="noopener noreferrer"
  >
    View on Explorer
  </a>
)}
\`\`\`

## Preventing Double Sends

Disable the send button while \`status === "sending"\`. This prevents the user from accidentally submitting the same transaction twice, which would transfer double the SOL.

## Error Messages

Common errors to handle:
- **Insufficient balance** -- the wallet does not have enough SOL.
- **Invalid recipient** -- the address is not a valid base58 public key.
- **User rejected** -- the user clicked "Reject" in the wallet pop-up.
- **RPC error** -- network timeout or rate limit.

Each of these should display a human-readable message, not a raw stack trace.

## Summary

This challenge combines input handling, validation, transaction building, wallet signing, and confirmation into one cohesive component. It is the most complete transaction flow you will build in this course.`,
                challenge: {
                  create: {
                    prompt:
                      "Create a SendSol component with: a text input for recipient address, a number input for SOL amount, and a Send button. On click, validate the recipient is a valid PublicKey and amount > 0, build a SystemProgram.transfer transaction, send it via sendTransaction, confirm it, and display the signature. Show status: 'idle', 'sending', 'confirmed', or 'error'. Disable the button while sending. Export as a named export.",
                    starterCode: `"use client";

import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  Transaction,
  SystemProgram,
  PublicKey,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import { useState } from "react";

export function SendSol() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "confirmed" | "error">("idle");
  const [signature, setSignature] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSend() {
    // TODO: Validate inputs
    // TODO: Build transaction
    // TODO: Send and confirm
  }

  return (
    <div>
      {/* TODO: Render inputs, button, and status */}
    </div>
  );
}`,
                    language: "typescript",
                    hints: [
                      "Wrap 'new PublicKey(recipient)' in a try/catch to validate the address",
                      "Use SystemProgram.transfer({ fromPubkey: publicKey, toPubkey, lamports }) to build the instruction",
                      "After sendTransaction returns the signature, call connection.confirmTransaction to wait for confirmation",
                    ],
                    solution: `"use client";

import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  Transaction,
  SystemProgram,
  PublicKey,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import { useState } from "react";

export function SendSol() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "confirmed" | "error">("idle");
  const [signature, setSignature] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSend() {
    if (!publicKey) return;

    let toPubkey: PublicKey;
    try {
      toPubkey = new PublicKey(recipient);
    } catch {
      setError("Invalid recipient address");
      setStatus("error");
      return;
    }

    const solAmount = parseFloat(amount);
    if (isNaN(solAmount) || solAmount <= 0) {
      setError("Amount must be greater than 0");
      setStatus("error");
      return;
    }

    try {
      setStatus("sending");
      setError(null);

      const tx = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey,
          lamports: Math.round(solAmount * LAMPORTS_PER_SOL),
        })
      );

      const sig = await sendTransaction(tx, connection);
      setSignature(sig);

      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash();
      await connection.confirmTransaction({
        signature: sig,
        blockhash,
        lastValidBlockHeight,
      });

      setStatus("confirmed");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Transaction failed");
      setStatus("error");
    }
  }

  return (
    <div>
      <input
        type="text"
        placeholder="Recipient address"
        value={recipient}
        onChange={(e) => setRecipient(e.target.value)}
      />
      <input
        type="number"
        placeholder="Amount (SOL)"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
      <button onClick={handleSend} disabled={status === "sending" || !publicKey}>
        {status === "sending" ? "Sending..." : "Send SOL"}
      </button>
      {status === "confirmed" && <p>Confirmed! Signature: {signature}</p>}
      {status === "error" && <p>Error: {error}</p>}
    </div>
  );
}`,
                    testCases: {
                      create: [
                        {
                          name: "Validates invalid recipient address",
                          input: "recipient='not-a-valid-key', amount='1'",
                          expectedOutput: "Error: 'Invalid recipient address'",
                          order: 0,
                        },
                        {
                          name: "Validates zero amount",
                          input: "recipient=validPubkey, amount='0'",
                          expectedOutput: "Error: 'Amount must be greater than 0'",
                          order: 1,
                        },
                        {
                          name: "Sends transaction and shows confirmed",
                          input: "recipient=validPubkey, amount='0.1', sendTransaction resolves, confirmTransaction resolves",
                          expectedOutput: "Status 'confirmed' with signature displayed",
                          order: 2,
                        },
                        {
                          name: "Button disabled while sending",
                          input: "status='sending'",
                          expectedOutput: "Button disabled with text 'Sending...'",
                          order: 3,
                        },
                      ],
                    },
                  },
                },
              },
              {
                title: "Error Handling in dApps",
                description:
                  "Learn how to handle common Solana transaction errors and present user-friendly messages.",
                type: "content",
                order: 2,
                xpReward: 25,
                duration: "20 min",
                content: `# Error Handling in dApps

## Why Error Handling Matters

Solana transactions can fail for many reasons: insufficient balance, the user rejecting the signing request, network congestion, program errors, expired blockhashes, or simulation failures. A good dApp turns these raw errors into clear, actionable messages.

## Common Error Categories

### Wallet Errors

These occur before the transaction reaches the network:

\`\`\`
WalletSignTransactionError: User rejected the request
WalletNotConnectedError: Wallet not connected
WalletSendTransactionError: Failed to send transaction
\`\`\`

The most frequent is user rejection. Handle it gracefully -- do not show it as a red error banner. A simple "Transaction cancelled" is enough.

### Simulation Errors

Before submitting, most wallets simulate the transaction. If simulation fails, the wallet throws an error containing the program logs:

\`\`\`
SendTransactionError: Simulation failed.
  Program log: Error: insufficient funds
  Program log: AnchorError { error_code: InsufficientFunds }
\`\`\`

Parse the logs to extract the meaningful message. Anchor programs emit structured error codes you can match against.

### Confirmation Errors

After the transaction is sent, \`confirmTransaction\` may report a failure:

\`\`\`ts
const result = await connection.confirmTransaction(/* ... */);
if (result.value.err) {
  // Transaction was included but failed during execution
}
\`\`\`

This happens when the on-chain program returns an error. The transaction consumes fees but has no effect.

## Building an Error Parser

A centralized error parser keeps your component code clean:

\`\`\`ts
export function parseTransactionError(err: unknown): string {
  if (err instanceof Error) {
    const msg = err.message;

    if (msg.includes("User rejected")) return "Transaction cancelled";
    if (msg.includes("insufficient funds")) return "Insufficient SOL balance";
    if (msg.includes("Blockhash not found")) return "Transaction expired. Please try again.";
    if (msg.includes("0x1")) return "Insufficient funds for transfer";

    // Anchor program errors
    const anchorMatch = msg.match(/AnchorError.*error_code: (\\w+)/);
    if (anchorMatch) return \`Program error: \${anchorMatch[1]}\`;

    return msg;
  }
  return "An unknown error occurred";
}
\`\`\`

## User Experience Patterns

**Toast notifications** work well for transaction outcomes. Show a persistent toast for errors and an auto-dismissing one for success. Libraries like \`react-hot-toast\` or \`sonner\` integrate easily:

\`\`\`ts
try {
  const sig = await sendTransaction(tx, connection);
  toast.success("Transaction sent!");
} catch (err) {
  toast.error(parseTransactionError(err));
}
\`\`\`

**Retry logic** -- For expired blockhash errors, automatically rebuild the transaction with a fresh blockhash and prompt the user to sign again. Do not auto-retry user rejections.

## Anchor Error Codes

If your dApp interacts with Anchor programs, import the IDL and map error codes to messages:

\`\`\`ts
import idl from "@/idl/my_program.json";

const errorMap = new Map(
  (idl.errors || []).map((e) => [e.code, e.msg])
);
\`\`\`

Then check \`errorMap.get(code)\` when parsing simulation logs.

## Summary

Robust error handling separates a prototype from a production dApp. Parse errors into human-readable messages, use toast notifications for feedback, and handle each error category differently.`,
              },
              {
                title: "Transaction Confirmation UI",
                description:
                  "Build a confirmation flow with progress indicators that guide the user through the transaction lifecycle.",
                type: "content",
                order: 3,
                xpReward: 25,
                duration: "20 min",
                content: `# Transaction Confirmation UI

## The Transaction Lifecycle from the User's Perspective

When a user clicks "Send" in your dApp, multiple things happen behind the scenes. Without UI feedback, the user stares at a frozen button and wonders if anything is happening. A good confirmation UI guides the user through each step.

## The Five Stages

Design your UI around five stages:

1. **Idle** -- The form is ready. No activity.
2. **Awaiting signature** -- The wallet pop-up is open. Show "Awaiting wallet approval..."
3. **Sending** -- The signed transaction has been submitted. Show "Submitting transaction..."
4. **Confirming** -- Waiting for network confirmation. Show "Confirming..." with a spinner.
5. **Complete / Error** -- Final state. Show success with an explorer link, or an error message.

\`\`\`tsx
type TxStage = "idle" | "signing" | "sending" | "confirming" | "confirmed" | "error";

const [stage, setStage] = useState<TxStage>("idle");

async function handleSubmit() {
  try {
    setStage("signing");
    const tx = buildTransaction();

    setStage("sending");
    const sig = await sendTransaction(tx, connection);

    setStage("confirming");
    const { blockhash, lastValidBlockHeight } =
      await connection.getLatestBlockhash();
    await connection.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight });

    setStage("confirmed");
  } catch (err) {
    setStage("error");
  }
}
\`\`\`

## Visual Progress Indicator

A step indicator gives the user spatial awareness of where they are in the flow:

\`\`\`tsx
const stages = ["Sign", "Send", "Confirm", "Done"];
const currentIndex = ["signing", "sending", "confirming", "confirmed"].indexOf(stage);

<div className="flex gap-2">
  {stages.map((label, i) => (
    <div
      key={label}
      className={\`step \${i <= currentIndex ? "step-active" : "step-inactive"}\`}
    >
      {label}
    </div>
  ))}
</div>
\`\`\`

## Explorer Links

Once you have a signature, link to it immediately -- do not wait for confirmation. The user can monitor progress on Explorer even while your UI is still waiting:

\`\`\`tsx
function explorerUrl(sig: string, cluster: string = "devnet") {
  return \`https://explorer.solana.com/tx/\${sig}?cluster=\${cluster}\`;
}
\`\`\`

## Timeout Handling

Transactions expire after roughly 60-90 seconds (150 blocks). If \`confirmTransaction\` does not resolve in time, inform the user:

\`\`\`ts
const timeoutMs = 60_000;
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), timeoutMs);

try {
  await connection.confirmTransaction(
    { signature: sig, blockhash, lastValidBlockHeight },
    "confirmed"
  );
} catch (err) {
  if (controller.signal.aborted) {
    setErrorMsg("Transaction timed out. Check Explorer for status.");
  }
} finally {
  clearTimeout(timeout);
}
\`\`\`

## Disable and Reset

Disable all form inputs and the submit button while any stage other than \`idle\`, \`confirmed\`, or \`error\` is active. After success or error, provide a "New Transaction" button that resets the stage to \`idle\` and clears the form.

## Mobile Considerations

On mobile, the wallet signing step may redirect the user to the wallet app. When they return, the dApp should detect the response and continue the flow. Wallet Adapter handles this for most wallets, but test thoroughly on mobile browsers.

## Summary

A multi-stage confirmation UI turns a confusing black box into a guided experience. Show the user what is happening at every step, link to Explorer as soon as possible, and handle timeouts gracefully.`,
              },
            ],
          },
        },
        // ── Module 4: Anchor Client Integration ─────────────────────────────
        {
          title: "Anchor Client Integration",
          description:
            "Connect your React front-end to an Anchor program using the IDL, call instructions, and deploy your dApp.",
          order: 3,
          lessons: {
            create: [
              {
                title: "Using the Anchor IDL",
                description:
                  "Understand the Anchor IDL and how to generate a typed client for your program in a Next.js app.",
                type: "content",
                order: 0,
                xpReward: 30,
                duration: "25 min",
                content: `# Using the Anchor IDL

## What Is the IDL?

When you run \`anchor build\`, Anchor generates an IDL (Interface Definition Language) file at \`target/idl/my_program.json\`. This JSON file describes every instruction, account struct, and error in your program. It is the contract between your on-chain program and your front-end.

\`\`\`json
{
  "version": "0.1.0",
  "name": "counter",
  "instructions": [
    {
      "name": "initialize",
      "accounts": [
        { "name": "counter", "isMut": true, "isSigner": false },
        { "name": "user", "isMut": true, "isSigner": true },
        { "name": "systemProgram", "isMut": false, "isSigner": false }
      ],
      "args": []
    },
    {
      "name": "increment",
      "accounts": [
        { "name": "counter", "isMut": true, "isSigner": false }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "Counter",
      "type": {
        "kind": "struct",
        "fields": [
          { "name": "count", "type": "u64" }
        ]
      }
    }
  ]
}
\`\`\`

## Setting Up the Anchor Client

Copy the IDL into your Next.js project (typically \`src/idl/counter.json\`) and create a helper to instantiate the \`Program\` object:

\`\`\`tsx
// src/lib/anchor.ts
import { Program, AnchorProvider } from "@coral-xyz/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import { AnchorWallet } from "@solana/wallet-adapter-react";
import idl from "@/idl/counter.json";

export const PROGRAM_ID = new PublicKey("YOUR_PROGRAM_ID");

export function getProgram(connection: Connection, wallet: AnchorWallet) {
  const provider = new AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });
  return new Program(idl as any, PROGRAM_ID, provider);
}
\`\`\`

## AnchorProvider from Wallet Adapter

The \`AnchorProvider\` needs a \`Wallet\` interface with \`publicKey\` and \`signTransaction\`. Wallet Adapter's \`useAnchorWallet\` hook provides exactly this:

\`\`\`tsx
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import { useConnection } from "@solana/wallet-adapter-react";

function MyComponent() {
  const wallet = useAnchorWallet();
  const { connection } = useConnection();

  if (!wallet) return <p>Connect wallet</p>;

  const program = getProgram(connection, wallet);
  // Now you can call program.methods.initialize()...
}
\`\`\`

## Reading Accounts

Once you have a \`Program\` instance, fetching account data is a single call:

\`\`\`ts
const counterPda = PublicKey.findProgramAddressSync(
  [Buffer.from("counter"), wallet.publicKey.toBuffer()],
  PROGRAM_ID
)[0];

const counterAccount = await program.account.counter.fetch(counterPda);
console.log("Count:", counterAccount.count.toString());
\`\`\`

Anchor automatically deserializes the raw bytes into a typed JavaScript object matching the IDL definition.

## Calling Instructions

\`\`\`ts
const tx = await program.methods
  .increment()
  .accounts({ counter: counterPda })
  .rpc();
console.log("Transaction:", tx);
\`\`\`

The \`.rpc()\` method builds the transaction, requests the wallet to sign, sends it, and returns the signature. For more control, use \`.transaction()\` instead to get the unsigned transaction object.

## Type Safety

For full TypeScript types, generate the client using \`anchor build\` and import the generated types. Some teams use \`@coral-xyz/anchor\`'s type inference from the IDL to get autocomplete on instruction names, account fields, and argument types.

## Summary

The Anchor IDL bridges your on-chain program and your React front-end. Import the IDL, create an AnchorProvider from the wallet, and use the Program object to read accounts and call instructions with full type safety.`,
              },
              {
                title: "Interact with a Program",
                description:
                  "Call an Anchor program instruction from a React component using the IDL and AnchorProvider.",
                type: "challenge",
                order: 1,
                xpReward: 100,
                duration: "45 min",
                content: `# Interact with a Program

## Overview

This challenge brings together everything you have learned: wallet connection, the Anchor client, transaction building, and confirmation UI. You will build a component that interacts with a simple counter program -- calling \`initialize\` and \`increment\` instructions and displaying the current count.

## The Counter Program

The target program has two instructions:

- **\`initialize\`** -- Creates a PDA account with an initial count of 0. Accounts: \`counter\` (PDA, mutable), \`user\` (signer, payer), \`system_program\`.
- **\`increment\`** -- Increments the count by 1. Accounts: \`counter\` (PDA, mutable).

The PDA is derived from seeds \`["counter", user_pubkey]\`.

## Deriving the PDA

\`\`\`ts
import { PublicKey } from "@solana/web3.js";

const [counterPda] = PublicKey.findProgramAddressSync(
  [Buffer.from("counter"), wallet.publicKey.toBuffer()],
  PROGRAM_ID
);
\`\`\`

## Component Architecture

Your component should:

1. Derive the counter PDA from the connected wallet.
2. Check if the counter account already exists (use \`connection.getAccountInfo\`).
3. If it does not exist, show an "Initialize" button.
4. If it exists, fetch the count and show it with an "Increment" button.
5. After each transaction, re-fetch the account to update the displayed count.

\`\`\`tsx
const [count, setCount] = useState<number | null>(null);
const [initialized, setInitialized] = useState(false);

async function fetchCount() {
  try {
    const account = await program.account.counter.fetch(counterPda);
    setCount(account.count.toNumber());
    setInitialized(true);
  } catch {
    setInitialized(false);
    setCount(null);
  }
}
\`\`\`

## Calling Initialize

\`\`\`ts
async function handleInitialize() {
  const tx = await program.methods
    .initialize()
    .accounts({
      counter: counterPda,
      user: wallet.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  await connection.confirmTransaction(tx);
  await fetchCount();
}
\`\`\`

## Calling Increment

\`\`\`ts
async function handleIncrement() {
  const tx = await program.methods
    .increment()
    .accounts({ counter: counterPda })
    .rpc();

  await connection.confirmTransaction(tx);
  await fetchCount();
}
\`\`\`

## Error Handling

Wrap both handlers in try/catch. The \`initialize\` call will fail if the account already exists. The \`increment\` call will fail if the account has not been initialized. Map these to user-friendly messages.

## Optimistic Updates

For a snappier UI, increment the displayed count immediately before the transaction confirms, then correct it if the transaction fails:

\`\`\`ts
setCount((prev) => (prev !== null ? prev + 1 : prev));
try {
  await program.methods.increment().accounts({ counter: counterPda }).rpc();
} catch {
  setCount((prev) => (prev !== null ? prev - 1 : prev)); // rollback
}
\`\`\`

## Summary

This challenge requires you to combine PDA derivation, account fetching, instruction calls, and React state management. It is the definitive pattern for any dApp that interacts with an Anchor program.`,
                challenge: {
                  create: {
                    prompt:
                      "Create a CounterApp component that interacts with an Anchor counter program. It should: (1) derive a PDA from seeds ['counter', walletPublicKey] and PROGRAM_ID; (2) fetch the counter account on mount and display the count; (3) show an 'Initialize' button if the account does not exist, calling program.methods.initialize(); (4) show the count and an 'Increment' button if the account exists, calling program.methods.increment(); (5) re-fetch the count after each transaction. Use useAnchorWallet, useConnection, and the getProgram helper. Export as a named export.",
                    starterCode: `"use client";

import { useAnchorWallet } from "@solana/wallet-adapter-react";
import { useConnection } from "@solana/wallet-adapter-react";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { useEffect, useState, useCallback } from "react";

// Assume these are imported from your lib/anchor.ts
// import { getProgram, PROGRAM_ID } from "@/lib/anchor";
const PROGRAM_ID = new PublicKey("CounterProgram11111111111111111111111111111");

export function CounterApp() {
  const wallet = useAnchorWallet();
  const { connection } = useConnection();
  const [count, setCount] = useState<number | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [loading, setLoading] = useState(false);

  // TODO: Derive the counter PDA
  // TODO: Create program instance with getProgram(connection, wallet)
  // TODO: fetchCount function
  // TODO: handleInitialize function
  // TODO: handleIncrement function
  // TODO: useEffect to fetch count on mount

  if (!wallet) return <p>Connect your wallet</p>;

  return (
    <div>
      {/* TODO: Render Initialize or Increment UI */}
    </div>
  );
}`,
                    language: "typescript",
                    hints: [
                      "Use PublicKey.findProgramAddressSync([Buffer.from('counter'), wallet.publicKey.toBuffer()], PROGRAM_ID) to derive the PDA",
                      "Wrap program.account.counter.fetch(pda) in a try/catch -- if it throws, the account is not initialized",
                      "Call program.methods.initialize().accounts({ counter: pda, user: wallet.publicKey, systemProgram: SystemProgram.programId }).rpc()",
                      "After each .rpc() call, await connection.confirmTransaction(tx) then re-fetch the count",
                    ],
                    solution: `"use client";

import { useAnchorWallet } from "@solana/wallet-adapter-react";
import { useConnection } from "@solana/wallet-adapter-react";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { useEffect, useState, useCallback } from "react";
import { getProgram, PROGRAM_ID } from "@/lib/anchor";

export function CounterApp() {
  const wallet = useAnchorWallet();
  const { connection } = useConnection();
  const [count, setCount] = useState<number | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [loading, setLoading] = useState(false);

  const counterPda = wallet
    ? PublicKey.findProgramAddressSync(
        [Buffer.from("counter"), wallet.publicKey.toBuffer()],
        PROGRAM_ID
      )[0]
    : null;

  const fetchCount = useCallback(async () => {
    if (!wallet || !counterPda) return;
    const program = getProgram(connection, wallet);
    try {
      const account = await program.account.counter.fetch(counterPda);
      setCount(account.count.toNumber());
      setInitialized(true);
    } catch {
      setInitialized(false);
      setCount(null);
    }
  }, [wallet, counterPda, connection]);

  useEffect(() => {
    fetchCount();
  }, [fetchCount]);

  async function handleInitialize() {
    if (!wallet || !counterPda) return;
    setLoading(true);
    try {
      const program = getProgram(connection, wallet);
      const tx = await program.methods
        .initialize()
        .accounts({
          counter: counterPda,
          user: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      await connection.confirmTransaction(tx);
      await fetchCount();
    } catch (err) {
      console.error("Initialize failed:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleIncrement() {
    if (!wallet || !counterPda) return;
    setLoading(true);
    try {
      const program = getProgram(connection, wallet);
      const tx = await program.methods
        .increment()
        .accounts({ counter: counterPda })
        .rpc();
      await connection.confirmTransaction(tx);
      await fetchCount();
    } catch (err) {
      console.error("Increment failed:", err);
    } finally {
      setLoading(false);
    }
  }

  if (!wallet) return <p>Connect your wallet</p>;

  return (
    <div>
      {!initialized ? (
        <button onClick={handleInitialize} disabled={loading}>
          {loading ? "Initializing..." : "Initialize Counter"}
        </button>
      ) : (
        <div>
          <p>Count: {count}</p>
          <button onClick={handleIncrement} disabled={loading}>
            {loading ? "Incrementing..." : "Increment"}
          </button>
        </div>
      )}
    </div>
  );
}`,
                    testCases: {
                      create: [
                        {
                          name: "Shows connect prompt without wallet",
                          input: "wallet=null",
                          expectedOutput: "Text 'Connect your wallet'",
                          order: 0,
                        },
                        {
                          name: "Shows Initialize button when account does not exist",
                          input: "wallet=connected, program.account.counter.fetch throws",
                          expectedOutput: "Button with text 'Initialize Counter'",
                          order: 1,
                        },
                        {
                          name: "Shows count and Increment button after initialization",
                          input: "wallet=connected, counter.count=5",
                          expectedOutput: "Text 'Count: 5' and button 'Increment'",
                          order: 2,
                        },
                        {
                          name: "Increments count after clicking Increment",
                          input: "wallet=connected, counter.count=5, increment succeeds, re-fetch returns 6",
                          expectedOutput: "Text 'Count: 6'",
                          order: 3,
                        },
                      ],
                    },
                  },
                },
              },
              {
                title: "Deploy & Test Your dApp",
                description:
                  "Deploy your Next.js Solana dApp to Vercel and test it against devnet end-to-end.",
                type: "challenge",
                order: 2,
                xpReward: 75,
                duration: "40 min",
                content: `# Deploy & Test Your dApp

## Overview

You have built wallet connection, data fetching, transaction sending, and Anchor program integration. In this final challenge you will prepare the project for deployment, configure environment variables, and verify everything works end-to-end on devnet.

## Pre-Deployment Checklist

Before deploying, verify these items:

### 1. Environment Variables

Your \`.env.local\` should contain:

\`\`\`
NEXT_PUBLIC_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_PROGRAM_ID=YOUR_DEPLOYED_PROGRAM_ID
NEXT_PUBLIC_CLUSTER=devnet
\`\`\`

For production, replace the RPC URL with a dedicated provider endpoint.

### 2. Network Configuration

Create a cluster configuration helper:

\`\`\`ts
// src/lib/cluster.ts
import { clusterApiUrl } from "@solana/web3.js";

export type Cluster = "devnet" | "mainnet-beta" | "localnet";

export function getClusterUrl(cluster: Cluster): string {
  if (cluster === "localnet") return "http://localhost:8899";
  return process.env.NEXT_PUBLIC_RPC_URL || clusterApiUrl(cluster);
}
\`\`\`

### 3. IDL Verification

Make sure the IDL in your \`src/idl/\` directory matches the deployed program. After deploying with \`anchor deploy\`, the IDL should be in \`target/idl/\`. Copy the fresh version into your Next.js project.

## Deploying to Vercel

Vercel is the natural host for Next.js applications:

\`\`\`bash
npm install -g vercel
vercel
\`\`\`

During setup, add your environment variables in the Vercel dashboard under Settings > Environment Variables. Never commit \`.env.local\` to version control.

## End-to-End Testing

After deployment, test every flow manually:

1. **Wallet Connection** -- Open the deployed URL, click Connect Wallet, approve in Phantom/Solflare. Verify the truncated address appears.
2. **Balance Display** -- Confirm the SOL balance matches what Phantom shows.
3. **Send SOL** -- Send a small amount (0.001 SOL) to another address. Verify the transaction appears on Explorer.
4. **Program Interaction** -- Initialize the counter (if first time), then increment it. Verify the count updates on-chain.
5. **Error Handling** -- Reject a transaction in the wallet pop-up. Verify the error message is user-friendly.
6. **Mobile** -- Open the URL on a mobile browser with a mobile wallet. Verify the redirect flow works.

## Automated Testing

For repeatable testing, write Playwright or Cypress tests with a mock wallet:

\`\`\`ts
// Pseudo-code for a Playwright test
test("displays balance after connecting wallet", async ({ page }) => {
  await page.goto("/");
  await mockWalletConnection(page, { balance: 5_000_000_000 });
  await expect(page.getByText("5.0000 SOL")).toBeVisible();
});
\`\`\`

Mock the RPC responses so tests run without a real network connection.

## Performance Optimization

Before going to mainnet:

- **Lazy-load wallet adapters** -- Import them dynamically to reduce initial bundle size.
- **Cache RPC responses** -- Use SWR or React Query to avoid redundant fetches.
- **Compress the IDL** -- The IDL JSON can be large. Consider importing only the parts you need or using dynamic imports.

## Security Checklist

- Verify the program ID in your deployed environment matches the audited program.
- Ensure \`.env.local\` is in \`.gitignore\`.
- Set a Content Security Policy that restricts which domains can be connected to.
- Validate all user inputs on the client before building transactions.

## Summary

Deploying a Solana dApp is straightforward with Vercel. The harder part is thorough testing: every wallet state, every error path, every network condition. Run through the full checklist on devnet before touching mainnet.`,
                challenge: {
                  create: {
                    prompt:
                      "Create a deployment configuration module that exports: (1) a getClusterUrl function accepting a cluster parameter ('devnet' | 'mainnet-beta' | 'localnet') and returning the appropriate RPC URL using NEXT_PUBLIC_RPC_URL env var with fallback to clusterApiUrl; (2) a getExplorerUrl function that takes a transaction signature and optional cluster parameter and returns the Solana Explorer URL; (3) a validateDeployment async function that takes a Connection and program ID PublicKey, checks the program account exists via getAccountInfo, and returns { valid: boolean, error?: string }.",
                    starterCode: `import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";

export type Cluster = "devnet" | "mainnet-beta" | "localnet";

export function getClusterUrl(cluster: Cluster): string {
  // TODO: Return localhost for localnet, env var or clusterApiUrl otherwise
  return "";
}

export function getExplorerUrl(signature: string, cluster: Cluster = "devnet"): string {
  // TODO: Return Solana Explorer transaction URL with cluster param
  return "";
}

export async function validateDeployment(
  connection: Connection,
  programId: PublicKey
): Promise<{ valid: boolean; error?: string }> {
  // TODO: Check if program account exists and is executable
  return { valid: false };
}`,
                    language: "typescript",
                    hints: [
                      "For localnet, return 'http://localhost:8899'. For other clusters, use process.env.NEXT_PUBLIC_RPC_URL || clusterApiUrl(cluster)",
                      "Explorer URL format: https://explorer.solana.com/tx/{signature}?cluster={cluster}",
                      "Use connection.getAccountInfo(programId) and check that the result is not null and info.executable is true",
                    ],
                    solution: `import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";

export type Cluster = "devnet" | "mainnet-beta" | "localnet";

export function getClusterUrl(cluster: Cluster): string {
  if (cluster === "localnet") return "http://localhost:8899";
  return process.env.NEXT_PUBLIC_RPC_URL || clusterApiUrl(cluster);
}

export function getExplorerUrl(signature: string, cluster: Cluster = "devnet"): string {
  return \`https://explorer.solana.com/tx/\${signature}?cluster=\${cluster}\`;
}

export async function validateDeployment(
  connection: Connection,
  programId: PublicKey
): Promise<{ valid: boolean; error?: string }> {
  try {
    const info = await connection.getAccountInfo(programId);
    if (!info) {
      return { valid: false, error: "Program account not found" };
    }
    if (!info.executable) {
      return { valid: false, error: "Account is not executable" };
    }
    return { valid: true };
  } catch (err) {
    return {
      valid: false,
      error: err instanceof Error ? err.message : "Failed to validate",
    };
  }
}`,
                    testCases: {
                      create: [
                        {
                          name: "getClusterUrl returns localhost for localnet",
                          input: "cluster='localnet'",
                          expectedOutput: "http://localhost:8899",
                          order: 0,
                        },
                        {
                          name: "getExplorerUrl builds correct URL",
                          input: "signature='5xK...abc', cluster='devnet'",
                          expectedOutput: "https://explorer.solana.com/tx/5xK...abc?cluster=devnet",
                          order: 1,
                        },
                        {
                          name: "validateDeployment returns valid for executable account",
                          input: "getAccountInfo returns { executable: true, data: Buffer, lamports: 1000000 }",
                          expectedOutput: "{ valid: true }",
                          order: 2,
                        },
                        {
                          name: "validateDeployment returns error for missing account",
                          input: "getAccountInfo returns null",
                          expectedOutput: "{ valid: false, error: 'Program account not found' }",
                          order: 3,
                        },
                      ],
                    },
                  },
                },
              },
            ],
          },
        },
      ],
    },
  };
}
