import { CourseModule } from "../anchor-course/types";

export const MODULE_ADVANCED_PROGRAMS: CourseModule = {
  title: "Advanced Metaplex Programs",
  description:
    "Explore Bubblegum (compressed NFTs), Inscription (on-chain data), MPL-Hybrid (NFT/token swaps), and Genesis (token launches).",
  lessons: [
    {
      title: "Bubblegum v2 — Compressed NFTs",
      description:
        "Create and manage compressed NFTs at scale using Bubblegum v2 and concurrent Merkle trees.",
      type: "content",
      duration: "22 min",
      content: `
<h2>Bubblegum v2 — Compressed NFTs</h2>
<p>Bubblegum is the Metaplex program for compressed NFTs (cNFTs). It uses Solana's state compression to store NFT data in concurrent Merkle trees, enabling millions of NFTs at minimal cost.</p>

<h3>Key Concepts</h3>
<ul>
  <li><strong>Merkle Tree</strong> — A data structure where each NFT is a leaf, and only the root hash is stored on-chain</li>
  <li><strong>Canopy</strong> — Cached upper tree nodes that reduce proof sizes in transactions</li>
  <li><strong>DAS API</strong> — Off-chain indexers that store and serve full cNFT data</li>
  <li><strong>Proofs</strong> — Merkle proofs required for transfers, burns, and updates</li>
</ul>

<h3>Create a Tree</h3>
<pre><code>import { createTree } from '@metaplex-foundation/mpl-bubblegum'
import { generateSigner } from '@metaplex-foundation/umi'

const merkleTree = generateSigner(umi)
await createTree(umi, {
  merkleTree,
  maxDepth: 14,       // 2^14 = 16,384 leaves
  maxBufferSize: 64,  // Concurrent writes
  canopyDepth: 10,    // Cache top 10 levels
}).sendAndConfirm(umi)</code></pre>

<h3>Mint cNFTs</h3>
<pre><code>import { mintV1 } from '@metaplex-foundation/mpl-bubblegum'

await mintV1(umi, {
  leafOwner: recipientAddress,
  merkleTree: merkleTree.publicKey,
  metadata: {
    name: 'cNFT #1',
    uri: 'https://example.com/1.json',
    sellerFeeBasisPoints: 500,
    collection: { key: collectionMint, verified: false },
    creators: [
      { address: umi.identity.publicKey, verified: true, share: 100 },
    ],
  },
}).sendAndConfirm(umi)</code></pre>

<h3>Transfer cNFTs (requires proof)</h3>
<pre><code>import { transfer } from '@metaplex-foundation/mpl-bubblegum'
import { getAssetWithProof } from '@metaplex-foundation/mpl-bubblegum'

// Fetch asset + merkle proof from DAS
const assetWithProof = await getAssetWithProof(umi, assetId)

await transfer(umi, {
  ...assetWithProof,
  leafOwner: currentOwner,
  newLeafOwner: newOwner,
}).sendAndConfirm(umi)</code></pre>

<h3>Bubblegum v2 Improvements</h3>
<ul>
  <li>More flexible tree management</li>
  <li>Better collection verification</li>
  <li>Improved delegate support</li>
  <li>Enhanced concurrency handling</li>
</ul>

<h3>Tree Sizing</h3>
<table>
  <tr><th>Max Depth</th><th>Max NFTs</th><th>Cost (approx)</th></tr>
  <tr><td>14</td><td>16,384</td><td>~1.1 SOL</td></tr>
  <tr><td>17</td><td>131,072</td><td>~8.5 SOL</td></tr>
  <tr><td>20</td><td>1,048,576</td><td>~70 SOL</td></tr>
  <tr><td>24</td><td>16,777,216</td><td>~1,100 SOL</td></tr>
</table>
`,
    },
    {
      title: "Inscription — On-Chain Data Storage",
      description:
        "Write data directly to Solana using the Inscription program — store images, JSON, and files on-chain.",
      type: "content",
      duration: "15 min",
      content: `
<h2>Inscription Program</h2>
<p>The Metaplex Inscription program lets you write arbitrary data directly to the Solana blockchain. Instead of storing images on Arweave or IPFS, you can inscribe them on-chain.</p>

<h3>Use Cases</h3>
<ul>
  <li><strong>On-chain images</strong> — Fully on-chain NFT artwork</li>
  <li><strong>On-chain JSON metadata</strong> — No external dependencies</li>
  <li><strong>Data permanence</strong> — Data lives as long as the Solana blockchain</li>
  <li><strong>Linked inscriptions</strong> — Attach data to existing NFTs</li>
</ul>

<h3>Key Operations</h3>
<table>
  <tr><th>Operation</th><th>Description</th></tr>
  <tr><td>Initialize</td><td>Create an inscription account</td></tr>
  <tr><td>Write</td><td>Write data to the inscription (can be done in chunks)</td></tr>
  <tr><td>Fetch</td><td>Read inscription data</td></tr>
  <tr><td>Clear</td><td>Clear inscription data (keeps account)</td></tr>
  <tr><td>Close</td><td>Close account and reclaim rent</td></tr>
</table>

<h3>Create & Write an Inscription</h3>
<pre><code>import {
  initialize,
  write,
  findInscriptionPda,
} from '@metaplex-foundation/mpl-inscription'

// Initialize inscription
const inscriptionAccount = generateSigner(umi)
await initialize(umi, {
  inscriptionAccount,
}).sendAndConfirm(umi)

// Write data (can be done in multiple chunks for large data)
const imageData = readFileSync('artwork.png')
const chunkSize = 900 // bytes per transaction

for (let offset = 0; offset < imageData.length; offset += chunkSize) {
  const chunk = imageData.slice(offset, offset + chunkSize)
  await write(umi, {
    inscriptionAccount: inscriptionAccount.publicKey,
    value: Buffer.from(chunk),
    associatedTag: null,
    offset,
  }).sendAndConfirm(umi)
}</code></pre>

<h3>Inscription Sharding</h3>
<p>For large files, inscriptions support <strong>sharding</strong> — splitting data across multiple accounts. This allows storing files larger than the 10MB account size limit.</p>

<h3>Cost Considerations</h3>
<ul>
  <li>On-chain storage costs rent-exempt lamports (~6.96 SOL per MB)</li>
  <li>Best for small files (logos, icons, short JSON)</li>
  <li>For large files, traditional off-chain storage (Arweave) is more cost-effective</li>
</ul>
`,
    },
    {
      title: "MPL-Hybrid (MPL-404)",
      description:
        "Build hybrid assets that swap between fungible tokens and NFTs using the MPL-Hybrid program.",
      type: "content",
      duration: "18 min",
      content: `
<h2>MPL-Hybrid (MPL-404)</h2>
<p>MPL-404 introduces a new model for digital assets: <strong>hybrid assets</strong> that can seamlessly swap between fungible tokens and NFTs through a dual escrow system.</p>

<h3>How It Works</h3>
<p>The core concept is simple: a swap program trades a fixed number of fungible tokens for a non-fungible asset and vice versa. All swaps are backed by escrow — ensuring every NFT is backed by tokens and every token is backed by NFTs.</p>

<h3>Escrow Configuration</h3>
<pre><code>import { createEscrow } from '@metaplex-foundation/mpl-hybrid'

await createEscrow(umi, {
  escrow: escrowSigner,
  collection: collectionAddress,
  token: tokenMintAddress,
  feeLocation: feeWallet,
  name: 'My Hybrid Collection',
  uri: 'https://example.com/escrow.json',
  min: 0,           // Min NFT index
  max: 999,         // Max NFT index
  amount: 1000,     // Tokens per NFT swap
  feeAmount: 10,    // Fee in tokens
  path: 0,          // Metadata update path
  solFeeAmount: sol(0.01),
}).sendAndConfirm(umi)</code></pre>

<h3>Swapping</h3>
<pre><code>// Swap NFT → Tokens (burn NFT, receive tokens)
import { swapNftToTokens } from '@metaplex-foundation/mpl-hybrid'

await swapNftToTokens(umi, {
  escrow: escrowAddress,
  asset: nftAddress,
  collection: collectionAddress,
  token: tokenMintAddress,
}).sendAndConfirm(umi)

// Swap Tokens → NFT (burn tokens, receive NFT)
import { swapTokensToNft } from '@metaplex-foundation/mpl-hybrid'

await swapTokensToNft(umi, {
  escrow: escrowAddress,
  collection: collectionAddress,
  token: tokenMintAddress,
}).sendAndConfirm(umi)</code></pre>

<h3>Use Cases</h3>
<ul>
  <li><strong>Gaming</strong> — Convert in-game items (NFTs) to currency (tokens) and back</li>
  <li><strong>DeFi + NFTs</strong> — Add liquidity to NFT collections via fungible tokens</li>
  <li><strong>Dynamic collections</strong> — NFT metadata updates based on token interactions</li>
  <li><strong>Community tokens</strong> — Trade membership NFTs for community tokens</li>
</ul>

<h3>Key Features</h3>
<ul>
  <li>Dual escrow ensures all assets are backed</li>
  <li>Configurable swap ratios and fees</li>
  <li>Supports metadata updates on swap (path configuration)</li>
  <li>UI templates available for quick deployment</li>
</ul>
`,
    },
    {
      title: "Genesis — Token Launch Platform",
      description:
        "Build token launches with Genesis — launch pools, presales, and uniform price auctions.",
      type: "content",
      duration: "18 min",
      content: `
<h2>Genesis — Token Launch Platform</h2>
<p>Genesis is the Metaplex smart contract for Token Generation Events (TGE). It provides on-chain infrastructure for launching tokens with fair distribution mechanisms.</p>

<h3>Launch Types</h3>
<table>
  <tr><th>Type</th><th>Description</th></tr>
  <tr><td><strong>Launch Pool</strong></td><td>Users deposit SOL during a window, receive tokens proportional to their share</td></tr>
  <tr><td><strong>Presale</strong></td><td>Fixed-price token sale with allocation limits</td></tr>
  <tr><td><strong>Uniform Price Auction</strong></td><td>Price discovery through bidding, all winners pay the same price</td></tr>
</table>

<h3>Launch Pool Flow</h3>
<ol>
  <li><strong>Setup</strong> — Create token, configure pool, set time windows</li>
  <li><strong>Deposit Window</strong> — Users deposit SOL</li>
  <li><strong>Transition</strong> — Close deposits, calculate allocation</li>
  <li><strong>Claim</strong> — Users claim tokens proportional to deposit</li>
  <li><strong>Revoke</strong> — Optionally revoke mint/freeze authorities</li>
</ol>

<h3>JavaScript SDK</h3>
<pre><code>import {
  createLaunchPool,
  activateLaunchPool,
  deposit,
  transitionLaunchPool,
  claimTokens,
} from '@metaplex-foundation/genesis'

// Create and configure launch pool
await createLaunchPool(umi, {
  launchPool: poolSigner,
  mint: mintAddress,
  depositStartTime: startTimestamp,
  depositEndTime: endTimestamp,
  vestingDuration: 0,
  tokenSupply: 1_000_000_000_000_000,
}).sendAndConfirm(umi)

// Activate the pool
await activateLaunchPool(umi, {
  launchPool: poolAddress,
}).sendAndConfirm(umi)</code></pre>

<h3>Aggregation API</h3>
<p>Genesis provides an Aggregation API for integrators to display launch data:</p>
<ul>
  <li>Total deposits per pool</li>
  <li>Number of participants</li>
  <li>Estimated allocation per user</li>
  <li>Pool status and timeline</li>
</ul>

<h3>Key Features</h3>
<ul>
  <li>On-chain coordination for fair token distribution</li>
  <li>Automatic fund collection and token distribution</li>
  <li>Vesting support for gradual token release</li>
  <li>Multiple launch types for different strategies</li>
  <li>Open-source and composable</li>
</ul>
`,
    },
    {
      title: "Metaplex Programs Challenge",
      description:
        "Build a mini launchpad that creates a Core Candy Machine with guards and mints an NFT.",
      type: "challenge",
      duration: "20 min",
      challenge: {
        prompt:
          "Create a TypeScript script that: (1) Creates a Core collection, (2) Creates a Candy Machine with 10 items, SolPayment guard (0.1 SOL), and StartDate guard, (3) Inserts 3 config lines, (4) Logs the Candy Machine address.",
        objectives: [
          "Create a Core collection with createCollection",
          "Create a Candy Machine linked to the collection with 10 items",
          "Add SolPayment and StartDate guards",
          "Insert at least 3 config lines",
          "Log the Candy Machine public key",
        ],
        starterCode: `import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'
import { mplCore, createCollection } from '@metaplex-foundation/mpl-core'
import {
  create,
  addConfigLines,
  mplCandyMachine,
} from '@metaplex-foundation/mpl-core-candy-machine'
import { generateSigner, sol, some } from '@metaplex-foundation/umi'

// TODO: Initialize Umi with mplCore and mplCandyMachine plugins

// TODO: Create a collection "Launch Collection"

// TODO: Create a Candy Machine with:
//   - 10 items
//   - SolPayment guard: 0.1 SOL
//   - StartDate guard: now

// TODO: Insert 3 config lines

// TODO: Log the Candy Machine address
`,
        language: "typescript",
        hints: [
          "Use generateSigner(umi) for both collection and candyMachine",
          "configLineSettings needs prefixName, nameLength, prefixUri, uriLength",
          "Guards use some() wrapper for optional values",
        ],
        testCases: [
          {
            id: "tc1",
            name: "Creates Candy Machine",
            expectedOutput: "Candy Machine:",
          },
        ],
      },
    },
  ],
};
