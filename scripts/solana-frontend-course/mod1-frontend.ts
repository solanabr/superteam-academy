import { CourseModule } from "../anchor-course/types";

export const MODULE_SOLANA_FRONTEND: CourseModule = {
  title: "Solana Frontend Development",
  description:
    "Build web apps with @solana/client, React hooks, wallet adapters, and Next.js integration",
  lessons: [
    {
      title: "Frontend Overview",
      description: "Introduction to building web applications on Solana",
      type: "content",
      content: `<h2>Frontend Development on Solana</h2><p>Solana offers a modern frontend stack for building dApps: new-generation client libraries, React hooks, and wallet adapters.</p><h3>The Modern Solana Frontend Stack</h3><ul><li><strong>@solana/client</strong> — new RPC client (replaces Connection from web3.js)</li><li><strong>@solana/react-hooks</strong> — React hooks for Solana operations</li><li><strong>@solana/web3-compat</strong> — compatibility layer with legacy web3.js</li><li><strong>@solana/wallet-adapter</strong> — wallet connection UI components</li></ul><h3>Legacy vs Modern</h3><table><tr><th>Legacy (web3.js)</th><th>Modern (@solana/kit)</th></tr><tr><td>Connection class</td><td>createSolanaRpc()</td></tr><tr><td>Keypair</td><td>generateKeyPairSigner()</td></tr><tr><td>Transaction</td><td>pipe(createTransaction, ...)</td></tr><tr><td>sendAndConfirmTransaction</td><td>sendAndConfirmTransactionFactory</td></tr></table><p>Both stacks work. The modern stack is more tree-shakeable and has better TypeScript types.</p>`,
      xp: 30,
    },
    {
      title: "@solana/client",
      description: "The new RPC client for interacting with Solana clusters",
      type: "content",
      content: `<h2>@solana/client</h2><p>The new <code>@solana/client</code> package provides a modern, tree-shakeable RPC client.</p><h3>Installation</h3><pre><code>npm install @solana/client</code></pre><h3>Create RPC Connection</h3><pre><code>import { createSolanaRpc, createSolanaRpcSubscriptions } from "@solana/client";

const rpc = createSolanaRpc("https://api.devnet.solana.com");
const rpcSubscriptions = createSolanaRpcSubscriptions("wss://api.devnet.solana.com");</code></pre><h3>Query Data</h3><pre><code>// Get balance
const balance = await rpc.getBalance(address).send();

// Get account info
const accountInfo = await rpc.getAccountInfo(address, { encoding: "base64" }).send();

// Get latest blockhash
const { value: blockhash } = await rpc.getLatestBlockhash().send();</code></pre><h3>Subscribe to Changes</h3><pre><code>// Subscribe to account changes
const subscription = await rpcSubscriptions
  .accountNotifications(address, { encoding: "base64" })
  .subscribe();

for await (const notification of subscription) {
  console.log("Account changed:", notification);
}</code></pre>`,
      xp: 30,
    },
    {
      title: "@solana/react-hooks",
      description: "React hooks for wallet connection, signing, and on-chain data",
      type: "content",
      content: `<h2>@solana/react-hooks</h2><p>React hooks that abstract Solana operations into a familiar React pattern.</p><h3>Installation</h3><pre><code>npm install @solana/react @solana/react-hooks</code></pre><h3>Provider Setup</h3><pre><code>import { SolanaProvider } from "@solana/react";

function App() {
  return (
    &lt;SolanaProvider&gt;
      &lt;MyComponent /&gt;
    &lt;/SolanaProvider&gt;
  );
}</code></pre><h3>Useful Hooks</h3><pre><code>import { useSignAndSendTransaction, useSignTransaction } from "@solana/react-hooks";

function SendButton() {
  const signAndSend = useSignAndSendTransaction();

  const handleClick = async () => {
    const result = await signAndSend(transaction);
    console.log("Signature:", result);
  };

  return &lt;button onClick={handleClick}&gt;Send&lt;/button&gt;;
}</code></pre><h3>Legacy Wallet Adapter</h3><pre><code>import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

function MyComponent() {
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();

  return (
    &lt;div&gt;
      &lt;WalletMultiButton /&gt;
      {publicKey && &lt;p&gt;Connected: {publicKey.toBase58()}&lt;/p&gt;}
    &lt;/div&gt;
  );
}</code></pre>`,
      xp: 30,
    },
    {
      title: "Next.js + Solana",
      description: "Build full-stack Solana dApps with Next.js, SSR, and React Server Components",
      type: "content",
      content: `<h2>Next.js + Solana</h2><p>Next.js is the most popular framework for Solana dApps. Here's how to integrate wallet connection and on-chain operations.</p><h3>Project Setup</h3><pre><code>npx create-next-app@latest my-solana-app
cd my-solana-app
npm install @solana/web3.js @solana/wallet-adapter-react \\
  @solana/wallet-adapter-react-ui @solana/wallet-adapter-wallets</code></pre><h3>Wallet Provider (Client Component)</h3><pre><code>"use client";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";

export function SolanaProviders({ children }: { children: React.ReactNode }) {
  const endpoint = process.env.NEXT_PUBLIC_SOLANA_RPC_URL!;

  return (
    &lt;ConnectionProvider endpoint={endpoint}&gt;
      &lt;WalletProvider wallets={[]} autoConnect&gt;
        &lt;WalletModalProvider&gt;
          {children}
        &lt;/WalletModalProvider&gt;
      &lt;/WalletProvider&gt;
    &lt;/ConnectionProvider&gt;
  );
}</code></pre><h3>Key Patterns</h3><ul><li><strong>"use client"</strong> — wallet components must be client-side rendered</li><li><strong>Server actions</strong> — use for backend signing (backend signer pattern)</li><li><strong>Environment variables</strong> — <code>NEXT_PUBLIC_*</code> for client, others for server only</li><li><strong>Dynamic imports</strong> — lazy-load wallet modal for better performance</li></ul>`,
      xp: 30,
    },
    {
      title: "@solana/web3-compat",
      description: "Migration path from legacy web3.js to the modern Solana SDK",
      type: "content",
      content: `<h2>@solana/web3-compat</h2><p>The compatibility layer helps migrate from legacy <code>@solana/web3.js</code> to the new <code>@solana/kit</code> stack incrementally.</p><h3>Installation</h3><pre><code>npm install @solana/web3-compat</code></pre><h3>Converting Types</h3><pre><code>import { fromLegacyPublicKey, toLegacyPublicKey } from "@solana/web3-compat";

// Legacy PublicKey → new Address
const address = fromLegacyPublicKey(legacyPublicKey);

// New Address → Legacy PublicKey
const pubkey = toLegacyPublicKey(address);</code></pre><h3>Migration Strategy</h3><ol><li><strong>Add compat layer</strong> — install @solana/web3-compat</li><li><strong>New code uses kit</strong> — write new features with @solana/client</li><li><strong>Convert at boundaries</strong> — use compat functions where old meets new</li><li><strong>Gradually migrate</strong> — update existing code module by module</li><li><strong>Remove compat</strong> — once fully migrated, drop the compat layer</li></ol><h3>Why Migrate?</h3><ul><li><strong>Tree-shaking</strong> — only import what you use</li><li><strong>Better types</strong> — branded types prevent bugs</li><li><strong>Smaller bundle</strong> — new stack is much lighter</li><li><strong>Future-proof</strong> — new features only land in kit</li></ul>`,
      xp: 30,
    },
  ],
};
