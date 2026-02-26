import { CourseModule } from "../anchor-course/types";

export const MODULE_TOKEN_METADATA_CANDY: CourseModule = {
  title: "Token Metadata & Candy Machine",
  description:
    "Learn the Token Metadata program for digital ownership and Core Candy Machine for NFT launchpads with guards and anti-bot protection.",
  lessons: [
    {
      title: "Token Metadata Program",
      description:
        "Understand the Token Metadata program — the foundational standard for digital assets on Solana.",
      type: "content",
      duration: "20 min",
      content: `
<h2>Token Metadata Program</h2>
<p>The Token Metadata program (<code>metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s</code>) is the foundational program for managing digital assets on Solana. It extends SPL Token mints with rich metadata.</p>

<h3>Account Structure</h3>
<p>For each mint, Token Metadata creates several PDAs:</p>
<ul>
  <li><strong>Metadata</strong> — Name, symbol, URI, creators, royalties</li>
  <li><strong>Master Edition</strong> — Marks an NFT as the original (supply=1, decimals=0)</li>
  <li><strong>Edition</strong> — Prints/copies of a Master Edition</li>
  <li><strong>Token Record</strong> — Per-token state for Programmable NFTs (pNFTs)</li>
</ul>

<h3>Token Standards</h3>
<table>
  <tr><th>Standard</th><th>Decimals</th><th>Supply</th><th>Master Edition</th></tr>
  <tr><td>Fungible</td><td>Any (typically 9)</td><td>Any</td><td>No</td></tr>
  <tr><td>Fungible Asset</td><td>0</td><td>Any</td><td>No</td></tr>
  <tr><td>NonFungible</td><td>0</td><td>1</td><td>Yes</td></tr>
  <tr><td>ProgrammableNonFungible</td><td>0</td><td>1</td><td>Yes + Token Record</td></tr>
</table>

<h3>Key Features</h3>
<ul>
  <li><strong>Verified Collections</strong> — On-chain verification that an NFT belongs to a collection</li>
  <li><strong>Verified Creators</strong> — Creator signatures proving authenticity</li>
  <li><strong>Delegated Authorities</strong> — Approve delegates for specific operations</li>
  <li><strong>Printed Editions</strong> — Create limited edition prints from a Master Edition</li>
  <li><strong>Programmable NFTs (pNFTs)</strong> — NFTs with enforced royalties via rule sets</li>
</ul>

<h3>Creating an NFT with Token Metadata</h3>
<pre><code>import {
  createNft,
  mplTokenMetadata,
} from '@metaplex-foundation/mpl-token-metadata'
import { generateSigner, percentAmount } from '@metaplex-foundation/umi'

const umi = createUmi('https://api.devnet.solana.com')
  .use(mplTokenMetadata())

const mint = generateSigner(umi)
await createNft(umi, {
  mint,
  name: 'My NFT',
  symbol: 'MNFT',
  uri: 'https://example.com/metadata.json',
  sellerFeeBasisPoints: percentAmount(5.5),
}).sendAndConfirm(umi)</code></pre>

<h3>Locking Assets</h3>
<p>Token Metadata supports locking assets to prevent transfers, useful for staking, escrow, and rental systems.</p>

<h3>SPL Token-2022 Support</h3>
<p>Token Metadata works with both SPL Token and Token-2022 mints, supporting extensions like NonTransferable, PermanentDelegate, and more.</p>

<h3>When to Use Token Metadata vs Core</h3>
<ul>
  <li><strong>New projects</strong> → Use Metaplex Core (cheaper, simpler)</li>
  <li><strong>Existing Token Metadata NFTs</strong> → Continue using Token Metadata</li>
  <li><strong>Fungible tokens</strong> → Token Metadata (Core is for NFTs only)</li>
  <li><strong>pNFTs with enforced royalties</strong> → Token Metadata</li>
</ul>
`,
    },
    {
      title: "Core Candy Machine",
      description:
        "Build NFT launchpads with Core Candy Machine — guards, anti-bot protection, and minting phases.",
      type: "content",
      duration: "25 min",
      content: `
<h2>Core Candy Machine</h2>
<p>Core Candy Machine is the NFT launchpad for Metaplex Core assets. It handles inserting items, configuring mint guards, and managing phases for NFT drops.</p>

<h3>How It Works</h3>
<ol>
  <li><strong>Create</strong> a Candy Machine with item count and settings</li>
  <li><strong>Insert</strong> items (name + URI for each NFT)</li>
  <li><strong>Add Guards</strong> to control who can mint and when</li>
  <li><strong>Mint</strong> — users mint NFTs following guard rules</li>
  <li><strong>Withdraw</strong> the Candy Machine when complete</li>
</ol>

<h3>Create a Candy Machine</h3>
<pre><code>import {
  create,
  addConfigLines,
  mplCandyMachine,
} from '@metaplex-foundation/mpl-core-candy-machine'

const umi = createUmi('https://api.devnet.solana.com')
  .use(mplCandyMachine())

const candyMachine = generateSigner(umi)
const collection = generateSigner(umi)

// Create collection first
await createCollection(umi, {
  collection,
  name: 'My Drop',
  uri: 'https://example.com/collection.json',
}).sendAndConfirm(umi)

// Create Candy Machine
await create(umi, {
  candyMachine,
  collection: collection.publicKey,
  itemCount: 100,
  configLineSettings: {
    prefixName: 'NFT #',
    nameLength: 4,
    prefixUri: 'https://example.com/nfts/',
    uriLength: 10,
    isSequential: false,
  },
}).sendAndConfirm(umi)</code></pre>

<h3>Insert Items</h3>
<pre><code>await addConfigLines(umi, {
  candyMachine: candyMachine.publicKey,
  index: 0,
  configLines: [
    { name: '1', uri: '1.json' },
    { name: '2', uri: '2.json' },
    { name: '3', uri: '3.json' },
  ],
}).sendAndConfirm(umi)</code></pre>

<h3>Available Guards</h3>
<table>
  <tr><th>Guard</th><th>Purpose</th></tr>
  <tr><td>SolPayment</td><td>Require SOL payment to mint</td></tr>
  <tr><td>TokenPayment</td><td>Require SPL token payment</td></tr>
  <tr><td>StartDate</td><td>Mint opens at a specific time</td></tr>
  <tr><td>EndDate</td><td>Mint closes at a specific time</td></tr>
  <tr><td>MintLimit</td><td>Limit mints per wallet</td></tr>
  <tr><td>AllowList</td><td>Whitelist using Merkle proof</td></tr>
  <tr><td>BotTax</td><td>Charge failed minters (anti-bot)</td></tr>
  <tr><td>Gatekeeper</td><td>Require Civic gateway token</td></tr>
  <tr><td>NftBurn</td><td>Burn an NFT to mint</td></tr>
  <tr><td>NftPayment</td><td>Transfer an NFT to mint</td></tr>
  <tr><td>RedeemedAmount</td><td>Stop minting after N redeemed</td></tr>
  <tr><td>AddressGate</td><td>Restrict to a single address</td></tr>
</table>

<h3>Guard Groups (Phases)</h3>
<p>Use guard groups for multi-phase launches:</p>
<pre><code>// Phase 1: Allowlist with SOL payment
// Phase 2: Public mint with higher price
guards: {
  default: {
    solPayment: some({ lamports: sol(1), destination: treasury }),
    startDate: some({ date: publicStartDate }),
  },
  groups: [
    {
      label: 'allowlist',
      guards: {
        solPayment: some({ lamports: sol(0.5), destination: treasury }),
        allowList: some({ merkleRoot: allowlistRoot }),
        startDate: some({ date: allowlistStartDate }),
      },
    },
  ],
}</code></pre>

<h3>Best Practices</h3>
<ul>
  <li>Always use BotTax guard to deter bots</li>
  <li>Test on devnet before mainnet launches</li>
  <li>Use MintLimit to prevent wallet sniping</li>
  <li>Withdraw the Candy Machine after the drop to reclaim rent</li>
</ul>
`,
    },
    {
      title: "Smart Contracts Quiz",
      description:
        "Test your knowledge of Metaplex Core, Token Metadata, and Candy Machine.",
      type: "quiz",
      duration: "8 min",
      quiz: {
        passingScore: 70,
        questions: [
          {
            question: "How many accounts does a Metaplex Core NFT use?",
            options: [
              "1 account per asset",
              "3 accounts (mint + metadata + master edition)",
              "4+ accounts",
              "Depends on the plugins",
            ],
            correctIndex: 0,
            explanation:
              "Metaplex Core uses a single account per asset, storing name, URI, owner, and plugins in one place.",
          },
          {
            question: "What is the purpose of the AddBlocker plugin?",
            options: [
              "Block certain addresses from owning the asset",
              "Prevent new plugins from being added to the asset",
              "Block transfers to specific wallets",
              "Add rate limiting to mint operations",
            ],
            correctIndex: 1,
            explanation:
              "AddBlocker prevents any new plugins from being added to the asset after it's set, useful for ensuring immutability.",
          },
          {
            question: "Which Candy Machine guard would you use for a whitelist mint?",
            options: [
              "AddressGate",
              "Gatekeeper",
              "AllowList (Merkle proof)",
              "MintLimit",
            ],
            correctIndex: 2,
            explanation:
              "AllowList uses a Merkle root to verify that a minter's address is on the whitelist, enabling gas-efficient whitelist minting.",
          },
          {
            question: "What does the BotTax guard do?",
            options: [
              "Blocks all automated transactions",
              "Charges a fee to wallets that fail to mint (deterring bots)",
              "Adds a CAPTCHA requirement",
              "Limits minting speed to one per block",
            ],
            correctIndex: 1,
            explanation:
              "BotTax charges a SOL fee to wallets that fail guard checks, making it expensive for bots to spam mint attempts.",
          },
          {
            question: "When should you use Token Metadata instead of Core?",
            options: [
              "For all new NFT projects",
              "For fungible tokens, pNFTs, or existing Token Metadata collections",
              "Only for compressed NFTs",
              "Never, Core has fully replaced it",
            ],
            correctIndex: 1,
            explanation:
              "Token Metadata is still needed for fungible tokens, Programmable NFTs (pNFTs) with enforced royalties, and maintaining existing collections.",
          },
        ],
      },
    },
  ],
};
