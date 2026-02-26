import { CourseModule } from "../anchor-course/types";

export const MODULE_NFT_PLUGINS: CourseModule = {
  title: "Core Plugins & Advanced Features",
  description:
    "Explore Metaplex Core's plugin system — royalties, freeze delegates, burn delegates, and attributes — for advanced NFT functionality.",
  lessons: [
    {
      title: "Core Plugins Overview",
      description:
        "Understand the Metaplex Core plugin system and how plugins extend NFT functionality.",
      type: "content",
      duration: "15 min",
      content: `
<h2>Core Plugins</h2>
<p>Metaplex Core's plugin system lets you attach modular functionality to assets and collections. Plugins are stored directly on the asset account — no separate PDAs needed.</p>

<h3>Plugin Types</h3>
<table>
  <tr><th>Plugin</th><th>Level</th><th>Description</th></tr>
  <tr><td><strong>Royalties</strong></td><td>Asset / Collection</td><td>Enforce creator royalties on transfers</td></tr>
  <tr><td><strong>FreezeDelegate</strong></td><td>Asset</td><td>Allow a delegate to freeze/thaw the asset (prevents transfers)</td></tr>
  <tr><td><strong>BurnDelegate</strong></td><td>Asset</td><td>Allow a delegate to burn the asset</td></tr>
  <tr><td><strong>TransferDelegate</strong></td><td>Asset</td><td>Allow a delegate to transfer the asset</td></tr>
  <tr><td><strong>PermanentFreezeDelegate</strong></td><td>Asset / Collection</td><td>Permanently freeze an asset (soulbound)</td></tr>
  <tr><td><strong>PermanentTransferDelegate</strong></td><td>Asset / Collection</td><td>Allow permanent transfer authority</td></tr>
  <tr><td><strong>PermanentBurnDelegate</strong></td><td>Asset / Collection</td><td>Allow permanent burn authority</td></tr>
  <tr><td><strong>Attributes</strong></td><td>Asset</td><td>Store on-chain key-value attributes</td></tr>
  <tr><td><strong>Edition</strong></td><td>Asset</td><td>Edition numbering for prints</td></tr>
</table>

<h3>Adding Plugins at Creation</h3>
<pre><code>import { create, ruleSet } from '@metaplex-foundation/mpl-core'
import { generateSigner, publicKey } from '@metaplex-foundation/umi'

const asset = generateSigner(umi)
await create(umi, {
  asset,
  name: 'My NFT with Plugins',
  uri: 'https://example.com/metadata.json',
  plugins: [
    {
      type: 'Royalties',
      basisPoints: 500, // 5%
      creators: [
        { address: umi.identity.publicKey, percentage: 100 },
      ],
      ruleSet: ruleSet('None'),
    },
    {
      type: 'FreezeDelegate',
      frozen: false,
      authority: {
        type: 'Address',
        address: publicKey('DELEGATE_ADDRESS'),
      },
    },
  ],
}).sendAndConfirm(umi)</code></pre>

<h3>Plugin Authority Types</h3>
<ul>
  <li><strong>Owner</strong> — The asset owner controls the plugin</li>
  <li><strong>UpdateAuthority</strong> — The update authority controls the plugin</li>
  <li><strong>Address</strong> — A specific address controls the plugin</li>
  <li><strong>None</strong> — No one can modify it (immutable)</li>
</ul>

<h3>Soulbound NFTs</h3>
<p>Use <code>PermanentFreezeDelegate</code> with <code>frozen: true</code> to create soulbound (non-transferable) NFTs:</p>
<pre><code>plugins: [
  {
    type: 'PermanentFreezeDelegate',
    frozen: true,
    authority: {
      type: 'UpdateAuthority',
    },
  },
]</code></pre>
<p>This is exactly how Superteam Academy issues credential NFTs — they're soulbound, permanently frozen in the learner's wallet.</p>
`,
    },
    {
      title: "Compressed NFTs (Bubblegum)",
      description:
        "Learn about compressed NFTs using Metaplex Bubblegum and state compression for large-scale minting.",
      type: "content",
      duration: "18 min",
      content: `
<h2>Compressed NFTs (cNFTs)</h2>
<p>Compressed NFTs use <strong>Solana State Compression</strong> to store NFT data in Merkle trees, reducing minting costs by 1000x+ compared to regular NFTs.</p>

<h3>How It Works</h3>
<ul>
  <li>NFT data is hashed and stored as leaves in a concurrent Merkle tree</li>
  <li>Only the tree root hash is stored on-chain (in a single account)</li>
  <li>Full data is stored by RPC indexers (DAS API)</li>
  <li>Proofs verify ownership and enable transfers/burns</li>
</ul>

<h3>Cost Comparison</h3>
<table>
  <tr><th>Method</th><th>Cost per NFT (approx)</th></tr>
  <tr><td>Token Metadata</td><td>~0.022 SOL</td></tr>
  <tr><td>Metaplex Core</td><td>~0.003 SOL</td></tr>
  <tr><td>Compressed (Bubblegum)</td><td>~0.00005 SOL</td></tr>
</table>

<h3>Creating a Merkle Tree</h3>
<pre><code>import { createTree } from '@metaplex-foundation/mpl-bubblegum'
import { generateSigner } from '@metaplex-foundation/umi'

const merkleTree = generateSigner(umi)

await createTree(umi, {
  merkleTree,
  maxDepth: 14,     // 2^14 = 16,384 max leaves
  maxBufferSize: 64,
}).sendAndConfirm(umi)</code></pre>

<h3>Minting Compressed NFTs</h3>
<pre><code>import { mintV1 } from '@metaplex-foundation/mpl-bubblegum'

await mintV1(umi, {
  leafOwner: umi.identity.publicKey,
  merkleTree: merkleTree.publicKey,
  metadata: {
    name: 'Compressed NFT #1',
    uri: 'https://example.com/cnft.json',
    sellerFeeBasisPoints: 500,
    collection: { key: collectionMint, verified: false },
    creators: [
      { address: umi.identity.publicKey, verified: true, share: 100 },
    ],
  },
}).sendAndConfirm(umi)</code></pre>

<h3>Tree Size Guide</h3>
<table>
  <tr><th>Max Depth</th><th>Max NFTs</th><th>Tree Cost (SOx)</th></tr>
  <tr><td>14</td><td>16,384</td><td>~1.1 SOL</td></tr>
  <tr><td>20</td><td>1,048,576</td><td>~70 SOL</td></tr>
  <tr><td>30</td><td>1 billion+</td><td>~6,800 SOL</td></tr>
</table>

<h3>When to Use cNFTs</h3>
<ul>
  <li><strong>Large collections</strong> — 10k+ NFTs where per-unit cost matters</li>
  <li><strong>Loyalty programs</strong> — Mass distribution of rewards</li>
  <li><strong>Gaming</strong> — In-game items at scale</li>
  <li><strong>Proof of attendance</strong> — Event tickets and POAPs</li>
</ul>

<h3>Limitations</h3>
<ul>
  <li>Requires DAS API (Helius, Triton, etc.) for reading data</li>
  <li>Transfers require Merkle proofs (more complex than Core transfers)</li>
  <li>Tree must be pre-allocated with a fixed max capacity</li>
</ul>
`,
    },
    {
      title: "Core NFTs Final Quiz",
      description:
        "Test your knowledge of Metaplex Core NFTs, plugins, and compressed NFTs.",
      type: "quiz",
      duration: "8 min",
      quiz: {
        passingScore: 70,
        questions: [
          {
            question: "How do you make a Metaplex Core NFT soulbound (non-transferable)?",
            options: [
              "Set owner to null",
              "Use PermanentFreezeDelegate plugin with frozen: true",
              "Remove the TransferDelegate plugin",
              "Set isMutable to false",
            ],
            correctIndex: 1,
            explanation:
              "PermanentFreezeDelegate with frozen: true permanently prevents transfers, making the NFT soulbound.",
          },
          {
            question: "What is the approximate cost reduction of compressed NFTs vs regular Core NFTs?",
            options: [
              "2x cheaper",
              "10x cheaper",
              "60x cheaper",
              "1000x+ cheaper",
            ],
            correctIndex: 2,
            explanation:
              "Compressed NFTs cost ~0.00005 SOL vs ~0.003 SOL for Core, roughly 60x cheaper per NFT.",
          },
          {
            question: "Where is compressed NFT data stored?",
            options: [
              "Entirely on-chain in individual accounts",
              "Root hash on-chain in a Merkle tree, full data indexed off-chain by DAS providers",
              "Entirely off-chain on Arweave",
              "In the wallet's local storage",
            ],
            correctIndex: 1,
            explanation:
              "Compressed NFTs store only the Merkle root on-chain. The full data is indexed by DAS API providers like Helius.",
          },
          {
            question: "Which plugin would you use to enforce 5% creator royalties on a Core NFT?",
            options: [
              "FreezeDelegate",
              "TransferDelegate",
              "Royalties with basisPoints: 500",
              "Attributes",
            ],
            correctIndex: 2,
            explanation:
              "The Royalties plugin with basisPoints: 500 (500/10000 = 5%) enforces creator royalties on marketplace transfers.",
          },
        ],
      },
    },
  ],
};
