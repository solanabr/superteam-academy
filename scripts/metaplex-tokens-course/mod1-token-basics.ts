import { CourseModule } from "../anchor-course/types";

export const MODULE_TOKEN_BASICS: CourseModule = {
  title: "Token Fundamentals",
  description:
    "Learn the fundamentals of fungible tokens on Solana — how the SPL Token and Token Metadata programs work, and how to create your first token using Metaplex SDKs.",
  lessons: [
    {
      title: "Introduction to Solana Tokens",
      description:
        "Understand the token model on Solana: Mint accounts, Token accounts, ATAs, and how Metaplex Token Metadata extends them.",
      type: "content",
      duration: "15 min",
      content: `
<h2>Solana Token Model</h2>
<p>On Solana, fungible tokens are managed by the <strong>SPL Token Program</strong>. Every token has three key components:</p>
<ul>
  <li><strong>Mint Account</strong> — Defines the token (supply, decimals, authorities)</li>
  <li><strong>Token Account</strong> — Holds a specific user's balance of a given mint</li>
  <li><strong>Associated Token Account (ATA)</strong> — A deterministic token account derived from the owner's wallet + mint address</li>
</ul>

<h3>Why Metaplex Token Metadata?</h3>
<p>The base SPL Token program has no concept of a token's name, symbol, or image. The <strong>Metaplex Token Metadata</strong> program solves this by creating a Metadata account (PDA) linked to each mint, storing:</p>
<ul>
  <li><code>name</code> — Human-readable name (e.g., "USD Coin")</li>
  <li><code>symbol</code> — Short ticker (e.g., "USDC")</li>
  <li><code>uri</code> — URL pointing to a JSON file with image, description, and extended attributes</li>
  <li><code>sellerFeeBasisPoints</code> — Royalty percentage (mainly for NFTs)</li>
</ul>

<h3>Token Metadata JSON Standard</h3>
<p>The URI in the metadata account points to a JSON file following the Metaplex standard:</p>
<pre><code>{
  "name": "My Token",
  "symbol": "MTK",
  "description": "A fungible token on Solana",
  "image": "https://example.com/token-icon.png",
  "attributes": []
}</code></pre>
<p>This JSON is typically hosted on decentralized storage like Arweave or IPFS.</p>

<h3>Key Addresses</h3>
<table>
  <tr><th>Program</th><th>Address</th></tr>
  <tr><td>SPL Token</td><td><code>TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA</code></td></tr>
  <tr><td>Token-2022</td><td><code>TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb</code></td></tr>
  <tr><td>Token Metadata</td><td><code>metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s</code></td></tr>
  <tr><td>Associated Token</td><td><code>ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL</code></td></tr>
</table>

<h3>Metaplex SDKs</h3>
<p>Metaplex provides two main JavaScript SDKs for token operations:</p>
<ul>
  <li><strong>Umi</strong> — Low-level, flexible framework for building Solana transactions. Used with <code>@metaplex-foundation/mpl-token-metadata</code> and <code>@metaplex-foundation/mpl-toolbox</code>.</li>
  <li><strong>Kit</strong> — Higher-level SDK with simpler APIs for common operations.</li>
</ul>
<p>Both support creating, minting, transferring, updating, and burning tokens.</p>
`,
    },
    {
      title: "Create a Fungible Token",
      description:
        "Create a fungible token with metadata on Solana using the Metaplex Token Metadata program and Umi SDK.",
      type: "content",
      duration: "20 min",
      content: `
<h2>Create a Fungible Token</h2>
<p>Creating a fungible token on Solana involves two steps:</p>
<ol>
  <li>Create the mint account with metadata (name, symbol, URI, decimals)</li>
  <li>Mint an initial supply to your wallet</li>
</ol>

<h3>Prerequisites</h3>
<pre><code>npm install @metaplex-foundation/mpl-token-metadata \\
  @metaplex-foundation/mpl-toolbox \\
  @metaplex-foundation/umi \\
  @metaplex-foundation/umi-bundle-defaults</code></pre>

<h3>Full Example (Umi)</h3>
<pre><code>import {
  createFungible,
  mplTokenMetadata,
} from '@metaplex-foundation/mpl-token-metadata'
import {
  createTokenIfMissing,
  findAssociatedTokenPda,
  mintTokensTo,
} from '@metaplex-foundation/mpl-toolbox'
import {
  generateSigner,
  keypairIdentity,
  percentAmount,
  some,
} from '@metaplex-foundation/umi'
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'
import { readFileSync } from 'fs'

// Initialize Umi
const umi = createUmi('https://api.devnet.solana.com')
  .use(mplTokenMetadata())

// Load wallet
const secretKey = JSON.parse(
  readFileSync('wallet.json', 'utf-8')
)
const keypair = umi.eddsa.createKeypairFromSecretKey(
  new Uint8Array(secretKey)
)
umi.use(keypairIdentity(keypair))

// Generate mint signer
const mint = generateSigner(umi)

// Step 1: Create fungible token with metadata
await createFungible(umi, {
  mint,
  name: 'My Fungible Token',
  symbol: 'MFT',
  uri: 'https://example.com/metadata.json',
  sellerFeeBasisPoints: percentAmount(0),
  decimals: some(9),
}).sendAndConfirm(umi)

// Step 2: Mint initial supply
await createTokenIfMissing(umi, {
  mint: mint.publicKey,
  owner: umi.identity.publicKey,
})
.add(
  mintTokensTo(umi, {
    mint: mint.publicKey,
    token: findAssociatedTokenPda(umi, {
      mint: mint.publicKey,
      owner: umi.identity.publicKey,
    }),
    amount: 1_000_000_000_000_000, // 1M tokens (9 decimals)
  })
)
.sendAndConfirm(umi)

console.log('Token created:', mint.publicKey)</code></pre>

<h3>Parameters to Customize</h3>
<table>
  <tr><th>Parameter</th><th>Description</th></tr>
  <tr><td><code>name</code></td><td>Token name displayed in wallets</td></tr>
  <tr><td><code>symbol</code></td><td>Short ticker symbol</td></tr>
  <tr><td><code>uri</code></td><td>URL to token metadata JSON (image, description)</td></tr>
  <tr><td><code>decimals</code></td><td>Number of decimal places (9 is standard for SOL-like tokens)</td></tr>
  <tr><td><code>sellerFeeBasisPoints</code></td><td>Royalty % (0 for fungible tokens)</td></tr>
</table>

<h3>Using the CLI</h3>
<p>You can also create tokens using the Metaplex CLI:</p>
<pre><code>metaplex create fungible \\
  --name "My Token" \\
  --symbol "MTK" \\
  --uri "https://example.com/metadata.json" \\
  --decimals 9 \\
  --initial-supply 1000000</code></pre>

<h3>What Happens On-Chain</h3>
<p>The <code>createFungible</code> instruction creates:</p>
<ul>
  <li>A <strong>Mint account</strong> owned by SPL Token program</li>
  <li>A <strong>Metadata PDA</strong> at <code>["metadata", TOKEN_METADATA_ID, mint]</code></li>
</ul>
<p>The mint authority and freeze authority default to your wallet. You can later revoke these to make the token immutable.</p>
`,
    },
    {
      title: "Mint Tokens",
      description:
        "Mint additional fungible tokens to increase the circulating supply of your token.",
      type: "content",
      duration: "12 min",
      content: `
<h2>Mint Additional Tokens</h2>
<p>After creating a token, you can mint additional supply using the mint authority. This increases the circulating supply of your token.</p>

<h3>Prerequisites</h3>
<p>You need an existing token mint address and the mint authority keypair.</p>
<pre><code>npm install @metaplex-foundation/mpl-toolbox \\
  @metaplex-foundation/umi \\
  @metaplex-foundation/umi-bundle-defaults</code></pre>

<h3>Mint Tokens (Umi)</h3>
<pre><code>import {
  createTokenIfMissing,
  findAssociatedTokenPda,
  mintTokensTo,
} from '@metaplex-foundation/mpl-toolbox'
import {
  keypairIdentity,
  publicKey,
  transactionBuilder,
} from '@metaplex-foundation/umi'
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'
import { readFileSync } from 'fs'

const umi = createUmi('https://api.devnet.solana.com')

// Load wallet (must be mint authority)
const secretKey = JSON.parse(
  readFileSync('wallet.json', 'utf-8')
)
const keypair = umi.eddsa.createKeypairFromSecretKey(
  new Uint8Array(secretKey)
)
umi.use(keypairIdentity(keypair))

const mintAddress = publicKey('YOUR_MINT_ADDRESS')

// Ensure ATA exists, then mint
await transactionBuilder()
  .add(
    createTokenIfMissing(umi, {
      mint: mintAddress,
      owner: umi.identity.publicKey,
    })
  )
  .add(
    mintTokensTo(umi, {
      mint: mintAddress,
      token: findAssociatedTokenPda(umi, {
        mint: mintAddress,
        owner: umi.identity.publicKey,
      }),
      amount: 500_000_000_000, // 500 tokens (9 decimals)
    })
  )
  .sendAndConfirm(umi)

console.log('Minted tokens successfully!')</code></pre>

<h3>Using the CLI</h3>
<pre><code>metaplex mint tokens \\
  --mint YOUR_MINT_ADDRESS \\
  --amount 500 \\
  --recipient YOUR_WALLET_ADDRESS</code></pre>

<h3>Key Concepts</h3>
<ul>
  <li><strong>Mint Authority</strong> — Only the mint authority can create new tokens. This is set when the mint is created.</li>
  <li><strong>createTokenIfMissing</strong> — Ensures the recipient's ATA exists before minting. If it already exists, this is a no-op.</li>
  <li><strong>Decimals</strong> — Remember to account for decimals. With 9 decimals, minting 1 token requires an amount of <code>1_000_000_000</code>.</li>
  <li><strong>Revoking Mint Authority</strong> — You can revoke the mint authority to make the supply fixed and immutable.</li>
</ul>
`,
    },
  ],
};
