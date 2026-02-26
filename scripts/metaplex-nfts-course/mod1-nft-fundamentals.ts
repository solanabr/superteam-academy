import { CourseModule } from "../anchor-course/types";

export const MODULE_NFT_FUNDAMENTALS: CourseModule = {
  title: "NFT Fundamentals",
  description:
    "Understand Metaplex Core — the most efficient NFT standard on Solana — and learn to create your first NFT.",
  lessons: [
    {
      title: "Introduction to NFTs on Solana",
      description:
        "Understand the NFT ecosystem on Solana, Metaplex Core vs Token Metadata, and how Core Assets work.",
      type: "content",
      duration: "15 min",
      content: `
<h2>NFTs on Solana</h2>
<p>NFTs (Non-Fungible Tokens) on Solana represent unique digital assets — art, collectibles, gaming items, credentials, and more. Metaplex provides the standard infrastructure for creating and managing NFTs.</p>

<h3>Metaplex Core vs Token Metadata</h3>
<p>There are two NFT standards on Solana:</p>
<table>
  <tr><th>Feature</th><th>Metaplex Core</th><th>Token Metadata (Legacy)</th></tr>
  <tr><td>Account model</td><td>Single account per asset</td><td>Multiple accounts (Mint + Metadata + Master Edition + Token Account)</td></tr>
  <tr><td>Cost</td><td>~0.0029 SOL per NFT</td><td>~0.022 SOL per NFT (4+ accounts)</td></tr>
  <tr><td>Plugins</td><td>Built-in plugin system (royalties, freeze, burn, transfer delegates)</td><td>Limited, requires separate programs</td></tr>
  <tr><td>Collections</td><td>First-class collection support</td><td>Separate collection verification step</td></tr>
  <tr><td>Status</td><td>Current standard</td><td>Legacy (still widely used)</td></tr>
</table>

<h3>Core Asset Structure</h3>
<p>A Metaplex Core Asset is a single account that stores:</p>
<ul>
  <li><strong>name</strong> — Display name of the NFT</li>
  <li><strong>uri</strong> — URL to off-chain metadata JSON (image, description, attributes)</li>
  <li><strong>owner</strong> — Current owner wallet</li>
  <li><strong>updateAuthority</strong> — Who can modify the asset</li>
  <li><strong>plugins</strong> — Optional: royalties, freeze, burn, transfer delegates</li>
</ul>

<h3>Off-Chain Metadata JSON</h3>
<pre><code>{
  "name": "My NFT",
  "description": "A unique digital collectible",
  "image": "https://arweave.net/abc123",
  "attributes": [
    { "trait_type": "Background", "value": "Blue" },
    { "trait_type": "Rarity", "value": "Legendary" }
  ]
}</code></pre>

<h3>Collections</h3>
<p>Core supports first-class collections. A <strong>Collection</strong> is a separate account that groups related assets. Assets can reference their collection, enabling:</p>
<ul>
  <li>Verified collection membership</li>
  <li>Collection-level royalties and plugins</li>
  <li>Marketplace grouping and filtering</li>
</ul>

<h3>Key SDK</h3>
<p>NFTs use the <code>@metaplex-foundation/mpl-core</code> package with Umi:</p>
<pre><code>npm install @metaplex-foundation/mpl-core \\
  @metaplex-foundation/umi \\
  @metaplex-foundation/umi-bundle-defaults</code></pre>
`,
    },
    {
      title: "Create an NFT",
      description:
        "Create an NFT using Metaplex Core on Solana with the Umi SDK.",
      type: "content",
      duration: "15 min",
      content: `
<h2>Create an NFT</h2>
<p>Creating an NFT with Metaplex Core requires just a few lines of code. Unlike Token Metadata, Core uses a single account per asset.</p>

<h3>Prerequisites</h3>
<pre><code>npm install @metaplex-foundation/mpl-core \\
  @metaplex-foundation/umi \\
  @metaplex-foundation/umi-bundle-defaults</code></pre>

<h3>Create a Basic NFT</h3>
<pre><code>import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'
import { create, mplCore } from '@metaplex-foundation/mpl-core'
import {
  generateSigner,
  keypairIdentity,
} from '@metaplex-foundation/umi'
import { readFileSync } from 'fs'

const umi = createUmi('https://api.devnet.solana.com')
  .use(mplCore())

// Load wallet
const secretKey = JSON.parse(readFileSync('wallet.json', 'utf-8'))
const keypair = umi.eddsa.createKeypairFromSecretKey(
  new Uint8Array(secretKey)
)
umi.use(keypairIdentity(keypair))

// Create NFT
const asset = generateSigner(umi)
await create(umi, {
  asset,
  name: 'My NFT',
  uri: 'https://example.com/metadata.json',
}).sendAndConfirm(umi)

console.log('NFT created:', asset.publicKey)</code></pre>

<h3>Create an NFT in a Collection</h3>
<pre><code>import { createCollection, create } from '@metaplex-foundation/mpl-core'

// First, create the collection
const collection = generateSigner(umi)
await createCollection(umi, {
  collection,
  name: 'My Collection',
  uri: 'https://example.com/collection.json',
}).sendAndConfirm(umi)

// Then create an NFT in the collection
const asset = generateSigner(umi)
await create(umi, {
  asset,
  name: 'NFT #1',
  uri: 'https://example.com/nft-1.json',
  collection: collection.publicKey,
}).sendAndConfirm(umi)</code></pre>

<h3>Using the CLI</h3>
<pre><code># Create a single NFT
metaplex create core asset \\
  --name "My NFT" \\
  --uri "https://example.com/metadata.json"

# Create a collection
metaplex create core collection \\
  --name "My Collection" \\
  --uri "https://example.com/collection.json"</code></pre>

<h3>Parameters</h3>
<table>
  <tr><th>Parameter</th><th>Required</th><th>Description</th></tr>
  <tr><td><code>name</code></td><td>Yes</td><td>Display name</td></tr>
  <tr><td><code>uri</code></td><td>Yes</td><td>URL to metadata JSON</td></tr>
  <tr><td><code>collection</code></td><td>No</td><td>Collection to add the NFT to</td></tr>
  <tr><td><code>plugins</code></td><td>No</td><td>Array of plugins (royalties, freeze, etc.)</td></tr>
  <tr><td><code>owner</code></td><td>No</td><td>Owner (defaults to payer)</td></tr>
</table>
`,
    },
    {
      title: "Fetch NFT Data",
      description:
        "Read NFT data from the blockchain using Umi SDK and DAS API.",
      type: "content",
      duration: "12 min",
      content: `
<h2>Fetch NFT Data</h2>
<p>You can read NFT data on-chain using the Umi SDK or the DAS (Digital Asset Standard) API.</p>

<h3>Fetch with Umi</h3>
<pre><code>import {
  fetchAsset,
  fetchCollection,
  mplCore,
} from '@metaplex-foundation/mpl-core'
import { publicKey } from '@metaplex-foundation/umi'
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'

const umi = createUmi('https://api.devnet.solana.com')
  .use(mplCore())

// Fetch a single asset
const assetAddress = publicKey('YOUR_ASSET_ADDRESS')
const asset = await fetchAsset(umi, assetAddress)
console.log('Name:', asset.name)
console.log('Owner:', asset.owner)
console.log('URI:', asset.uri)

// Fetch a collection
const collectionAddress = publicKey('YOUR_COLLECTION_ADDRESS')
const collection = await fetchCollection(umi, collectionAddress)
console.log('Collection:', collection.name)
console.log('Size:', collection.numMinted)</code></pre>

<h3>Fetch with DAS API</h3>
<p>The DAS API provides a REST/RPC interface for querying digital assets, useful for marketplaces and explorers:</p>
<pre><code>// Using DAS API via RPC
const response = await fetch('https://mainnet.helius-rpc.com/?api-key=YOUR_KEY', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'getAsset',
    params: { id: 'ASSET_ADDRESS' },
  }),
})

const { result } = await response.json()
console.log('Name:', result.content.metadata.name)
console.log('Image:', result.content.links.image)</code></pre>

<h3>Fetch Assets by Owner</h3>
<pre><code>// Get all NFTs owned by a wallet
const response = await fetch(rpcUrl, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'getAssetsByOwner',
    params: {
      ownerAddress: 'WALLET_ADDRESS',
      page: 1,
      limit: 100,
    },
  }),
})

const { result } = await response.json()
console.log('Total assets:', result.total)
result.items.forEach(item => {
  console.log(item.content.metadata.name)
})</code></pre>

<h3>Umi vs DAS</h3>
<table>
  <tr><th>Method</th><th>Best For</th></tr>
  <tr><td>Umi <code>fetchAsset</code></td><td>Reading a single asset's on-chain data directly</td></tr>
  <tr><td>DAS API</td><td>Querying multiple assets, searching by owner/collection, marketplace UIs</td></tr>
</table>
`,
    },
  ],
};
