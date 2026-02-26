import { CourseModule } from "../anchor-course/types";

export const MODULE_TYPESCRIPT_SDK: CourseModule = {
  title: "TypeScript SDK for Solana",
  description:
    "Build Solana clients with @solana/kit, @solana/web3.js, and the modern TypeScript SDK stack",
  lessons: [
    {
      title: "TypeScript SDK Overview",
      description: "Introduction to the official TypeScript SDK packages",
      type: "content",
      content: `<h2>Solana TypeScript SDK</h2><p>The official Solana TypeScript SDK is the primary way frontend and Node.js developers interact with Solana.</p><h3>Package Ecosystem</h3><ul><li><strong>@solana/kit</strong> — umbrella package bundling all new packages</li><li><strong>@solana/client</strong> — RPC client (JSON-RPC + subscriptions)</li><li><strong>@solana/signers</strong> — transaction signing abstractions</li><li><strong>@solana/transactions</strong> — transaction building and serialization</li><li><strong>@solana/addresses</strong> — base58 address type and validation</li><li><strong>@solana/programs</strong> — program interaction helpers</li></ul><h3>Legacy vs Modern</h3><p><strong>@solana/web3.js</strong> (legacy) is still widely used but is being superseded by the new modular packages under <code>@solana/kit</code>.</p><pre><code>// Modern (recommended for new projects)
npm install @solana/kit

// Legacy (still supported)
npm install @solana/web3.js</code></pre>`,
      xp: 30,
    },
    {
      title: "@solana/kit Essentials",
      description: "Core operations using the modern @solana/kit umbrella package",
      type: "content",
      content: `<h2>@solana/kit Essentials</h2><p>The <code>@solana/kit</code> package re-exports the entire modern SDK stack.</p><h3>Connecting to a Cluster</h3><pre><code>import { createSolanaRpc, createSolanaRpcSubscriptions } from "@solana/kit";

const rpc = createSolanaRpc("https://api.devnet.solana.com");
const rpcSub = createSolanaRpcSubscriptions("wss://api.devnet.solana.com");</code></pre><h3>Generating Keypairs</h3><pre><code>import { generateKeyPairSigner, address } from "@solana/kit";

const signer = await generateKeyPairSigner();
console.log("Address:", signer.address);</code></pre><h3>Querying Balances</h3><pre><code>const balance = await rpc.getBalance(address("...")).send();
console.log("Lamports:", balance.value);</code></pre><h3>Building Transactions</h3><pre><code>import {
  pipe,
  createTransactionMessage,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
  appendTransactionMessageInstruction,
  signTransactionMessageWithSigners,
  sendAndConfirmTransactionFactory,
} from "@solana/kit";

const { value: blockhash } = await rpc.getLatestBlockhash().send();
const sendAndConfirm = sendAndConfirmTransactionFactory({ rpc, rpcSubscriptions: rpcSub });

const tx = pipe(
  createTransactionMessage({ version: 0 }),
  (msg) => setTransactionMessageFeePayerSigner(signer, msg),
  (msg) => setTransactionMessageLifetimeUsingBlockhash(blockhash, msg),
  (msg) => appendTransactionMessageInstruction(transferInstruction, msg),
);

const signedTx = await signTransactionMessageWithSigners(tx);
await sendAndConfirm(signedTx, { commitment: "confirmed" });</code></pre>`,
      xp: 30,
    },
    {
      title: "Legacy @solana/web3.js",
      description: "Using the widely adopted legacy web3.js library",
      type: "content",
      content: `<h2>Legacy @solana/web3.js</h2><p>Many existing projects and tutorials use <code>@solana/web3.js</code>. Understanding it is essential for working with existing codebases.</p><h3>Connection</h3><pre><code>import { Connection, clusterApiUrl } from "@solana/web3.js";

const connection = new Connection(clusterApiUrl("devnet"), "confirmed");</code></pre><h3>Keypairs</h3><pre><code>import { Keypair } from "@solana/web3.js";

const keypair = Keypair.generate();
console.log("Public Key:", keypair.publicKey.toBase58());

// From secret key bytes
const restored = Keypair.fromSecretKey(secretKeyUint8Array);</code></pre><h3>Sending SOL</h3><pre><code>import { SystemProgram, Transaction, sendAndConfirmTransaction } from "@solana/web3.js";

const transaction = new Transaction().add(
  SystemProgram.transfer({
    fromPubkey: payer.publicKey,
    toPubkey: recipient,
    lamports: 1_000_000_000, // 1 SOL
  })
);

const signature = await sendAndConfirmTransaction(connection, transaction, [payer]);
console.log("Signature:", signature);</code></pre><h3>Get Account Data</h3><pre><code>const accountInfo = await connection.getAccountInfo(pubkey);
if (accountInfo) {
  console.log("Owner:", accountInfo.owner.toBase58());
  console.log("Data:", accountInfo.data);
}</code></pre>`,
      xp: 30,
    },
    {
      title: "Signers & Wallets",
      description: "Transaction signing patterns: keypair signers, wallet adapters, and multisig",
      type: "content",
      content: `<h2>Signers &amp; Wallets</h2><p>Solana supports multiple signing patterns depending on the environment.</p><h3>Modern Signer Types (@solana/signers)</h3><pre><code>import {
  generateKeyPairSigner,
  createSignerFromKeyPair,
  type TransactionSigner,
} from "@solana/kit";

// Full keypair signer (for scripts/backends)
const signer = await generateKeyPairSigner();

// From existing key pair
const keypairSigner = await createSignerFromKeyPair(keyPair);</code></pre><h3>Wallet Adapter Signer</h3><pre><code>import { useWallet } from "@solana/wallet-adapter-react";

function Component() {
  const { publicKey, signTransaction, signAllTransactions } = useWallet();

  // signTransaction returns a signed Transaction object
  // Wallet prompts user for approval
}</code></pre><h3>Backend Signing Patterns</h3><ul><li><strong>Full keypair</strong> — for automated operations (backend signers, bots)</li><li><strong>Wallet adapter</strong> — for user-facing dApps</li><li><strong>Multisig</strong> — Squads protocol for team operations</li><li><strong>Hardware wallet</strong> — Ledger support via adapter</li></ul><h3>Security Best Practices</h3><ul><li>Never expose private keys in frontend code</li><li>Use environment variables for backend keypairs</li><li>Validate all transaction contents before signing</li><li>Use simulation before sending to catch errors early</li></ul>`,
      xp: 30,
    },
    {
      title: "Advanced Patterns",
      description: "Priority fees, compute budget, address lookup tables, and retries",
      type: "content",
      content: `<h2>Advanced TypeScript Patterns</h2><p>Production-grade Solana clients need to handle priority fees, retries, and compute budgets.</p><h3>Priority Fees</h3><pre><code>import { ComputeBudgetProgram } from "@solana/web3.js";

const modifyComputeUnits = ComputeBudgetProgram.setComputeUnitLimit({
  units: 200_000,
});

const addPriorityFee = ComputeBudgetProgram.setComputeUnitPrice({
  microLamports: 50_000, // priority fee
});

const tx = new Transaction()
  .add(modifyComputeUnits)
  .add(addPriorityFee)
  .add(yourInstruction);</code></pre><h3>Address Lookup Tables</h3><pre><code>import { AddressLookupTableProgram, TransactionMessage, VersionedTransaction } from "@solana/web3.js";

// Create ALT
const [createIx, lookupTableAddress] = AddressLookupTableProgram.createLookupTable({
  authority: payer.publicKey,
  payer: payer.publicKey,
  recentSlot: await connection.getSlot(),
});

// Use ALT in versioned transaction
const lookupTableAccount = (await connection.getAddressLookupTable(lookupTableAddress)).value;
const message = new TransactionMessage({
  payerKey: payer.publicKey,
  recentBlockhash: blockhash,
  instructions: [...instructions],
}).compileToV0Message([lookupTableAccount]);

const tx = new VersionedTransaction(message);</code></pre><h3>Transaction Retries</h3><pre><code>async function sendWithRetry(connection, tx, signers, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const sig = await sendAndConfirmTransaction(connection, tx, signers);
      return sig;
    } catch (err) {
      if (i === maxRetries - 1) throw err;
      // Refresh blockhash and retry
      tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
    }
  }
}</code></pre>`,
      xp: 30,
    },
  ],
};
