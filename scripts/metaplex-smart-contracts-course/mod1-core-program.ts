import { CourseModule } from "../anchor-course/types";

export const MODULE_CORE_PROGRAM: CourseModule = {
  title: "Metaplex Core Program",
  description:
    "Deep dive into the Metaplex Core smart contract — the next-gen NFT standard for Solana. Learn about assets, collections, plugins, and the on-chain architecture.",
  lessons: [
    {
      title: "Core Program Overview",
      description:
        "Understand the Metaplex Core smart contract architecture — single-account assets, collections, and the plugin system.",
      type: "content",
      duration: "18 min",
      content: `
<h2>Metaplex Core Program</h2>
<p>Metaplex Core is the next-generation NFT standard on Solana. It replaces the multi-account model of Token Metadata with a single-account-per-asset design, dramatically reducing costs and complexity.</p>

<h3>Program Address</h3>
<pre><code>CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d</code></pre>

<h3>Architecture</h3>
<p>Core uses two main account types:</p>
<ul>
  <li><strong>Asset</strong> — A single account storing the NFT's name, URI, owner, update authority, and plugins</li>
  <li><strong>Collection</strong> — Groups related assets with shared settings and plugins</li>
</ul>

<h3>What is an Asset?</h3>
<p>A Core Asset contains:</p>
<table>
  <tr><th>Field</th><th>Description</th></tr>
  <tr><td><code>key</code></td><td>Account discriminator</td></tr>
  <tr><td><code>owner</code></td><td>Current owner (wallet)</td></tr>
  <tr><td><code>updateAuthority</code></td><td>Who can modify the asset</td></tr>
  <tr><td><code>name</code></td><td>On-chain display name</td></tr>
  <tr><td><code>uri</code></td><td>URL to off-chain metadata JSON</td></tr>
  <tr><td><code>seq</code></td><td>Sequence number for ordering</td></tr>
  <tr><td><code>plugins</code></td><td>Attached plugin data</td></tr>
</table>

<h3>vs Token Metadata</h3>
<table>
  <tr><th>Feature</th><th>Core</th><th>Token Metadata</th></tr>
  <tr><td>Accounts per NFT</td><td>1</td><td>4+</td></tr>
  <tr><td>Cost</td><td>~0.003 SOL</td><td>~0.022 SOL</td></tr>
  <tr><td>Plugin system</td><td>Built-in, extensible</td><td>Limited</td></tr>
  <tr><td>Collection</td><td>First-class</td><td>Separate verification</td></tr>
  <tr><td>Royalty enforcement</td><td>Plugin-based</td><td>pNFT rules</td></tr>
</table>

<h3>JSON Schema</h3>
<p>The off-chain metadata JSON follows the Metaplex standard:</p>
<pre><code>{
  "name": "Asset Name",
  "description": "Description of the asset",
  "image": "https://arweave.net/...",
  "animation_url": "https://arweave.net/...",
  "external_url": "https://example.com",
  "attributes": [
    { "trait_type": "Background", "value": "Blue" },
    { "trait_type": "Rarity", "value": "Legendary" }
  ],
  "properties": {
    "files": [
      { "uri": "https://arweave.net/...", "type": "image/png" }
    ],
    "category": "image"
  }
}</code></pre>

<h3>Ecosystem Support</h3>
<p>Core is supported by major Solana ecosystem tools:</p>
<ul>
  <li><strong>Wallets</strong> — Phantom, Backpack, Solflare</li>
  <li><strong>Marketplaces</strong> — Magic Eden, Tensor</li>
  <li><strong>Indexers</strong> — Helius DAS API, Triton</li>
  <li><strong>Explorers</strong> — Solana Explorer, SolanaFM</li>
</ul>
`,
    },
    {
      title: "Core CRUD Operations",
      description:
        "Create, fetch, update, transfer, and burn Core assets using the JavaScript and Rust SDKs.",
      type: "content",
      duration: "20 min",
      content: `
<h2>Core CRUD Operations</h2>
<p>The Core program provides five main instructions for managing assets.</p>

<h3>Create</h3>
<pre><code>import { create, mplCore } from '@metaplex-foundation/mpl-core'
import { generateSigner } from '@metaplex-foundation/umi'

const umi = createUmi('https://api.devnet.solana.com').use(mplCore())
const asset = generateSigner(umi)

await create(umi, {
  asset,
  name: 'My Asset',
  uri: 'https://example.com/metadata.json',
}).sendAndConfirm(umi)</code></pre>

<h3>Fetch</h3>
<pre><code>import { fetchAsset } from '@metaplex-foundation/mpl-core'

const asset = await fetchAsset(umi, assetAddress)
console.log(asset.name, asset.owner, asset.uri)</code></pre>

<h3>Update</h3>
<pre><code>import { update } from '@metaplex-foundation/mpl-core'

await update(umi, {
  asset: assetAddress,
  name: 'Updated Name',
  uri: 'https://example.com/updated.json',
}).sendAndConfirm(umi)</code></pre>

<h3>Transfer</h3>
<pre><code>import { transfer } from '@metaplex-foundation/mpl-core'

await transfer(umi, {
  asset: assetAddress,
  newOwner: recipientAddress,
}).sendAndConfirm(umi)</code></pre>

<h3>Burn</h3>
<pre><code>import { burn } from '@metaplex-foundation/mpl-core'

await burn(umi, {
  asset: assetAddress,
}).sendAndConfirm(umi)</code></pre>

<h3>Collection Management</h3>
<pre><code>import { createCollection, fetchCollection } from '@metaplex-foundation/mpl-core'

// Create
const collection = generateSigner(umi)
await createCollection(umi, {
  collection,
  name: 'My Collection',
  uri: 'https://example.com/collection.json',
}).sendAndConfirm(umi)

// Create asset in collection
await create(umi, {
  asset: generateSigner(umi),
  name: 'Asset #1',
  uri: 'https://example.com/1.json',
  collection: collection.publicKey,
}).sendAndConfirm(umi)

// Fetch collection
const col = await fetchCollection(umi, collection.publicKey)
console.log('Minted:', col.numMinted)</code></pre>

<h3>Rust SDK</h3>
<p>For on-chain programs, use the <code>mpl-core</code> Rust crate:</p>
<pre><code>// Cargo.toml
[dependencies]
mpl-core = "0.9"

// In your program
use mpl_core::instructions::CreateV2Builder;

let ix = CreateV2Builder::new()
    .asset(asset_key)
    .payer(payer_key)
    .name("My Asset".to_string())
    .uri("https://example.com/metadata.json".to_string())
    .instruction();</code></pre>
`,
    },
    {
      title: "Core Plugins Deep Dive",
      description:
        "Learn all Core plugins — adding, updating, removing, delegating, and revoking plugin authorities.",
      type: "content",
      duration: "22 min",
      content: `
<h2>Core Plugins Deep Dive</h2>
<p>Plugins are modular pieces of functionality attached to Core assets or collections. They control behavior like royalties, freezing, burning, and custom attributes.</p>

<h3>Adding Plugins</h3>
<pre><code>import { addPlugin } from '@metaplex-foundation/mpl-core'

// Add royalties plugin to existing asset
await addPlugin(umi, {
  asset: assetAddress,
  plugin: {
    type: 'Royalties',
    basisPoints: 500,
    creators: [
      { address: creatorAddress, percentage: 100 },
    ],
    ruleSet: ruleSet('None'),
  },
}).sendAndConfirm(umi)</code></pre>

<h3>Updating Plugins</h3>
<pre><code>import { updatePlugin } from '@metaplex-foundation/mpl-core'

await updatePlugin(umi, {
  asset: assetAddress,
  plugin: {
    type: 'Royalties',
    basisPoints: 750, // Update to 7.5%
    creators: [
      { address: creatorAddress, percentage: 100 },
    ],
    ruleSet: ruleSet('None'),
  },
}).sendAndConfirm(umi)</code></pre>

<h3>Removing Plugins</h3>
<pre><code>import { removePlugin } from '@metaplex-foundation/mpl-core'

await removePlugin(umi, {
  asset: assetAddress,
  pluginType: 'FreezeDelegate',
}).sendAndConfirm(umi)</code></pre>

<h3>Delegating Plugins</h3>
<pre><code>import { approvePluginAuthority } from '@metaplex-foundation/mpl-core'

await approvePluginAuthority(umi, {
  asset: assetAddress,
  pluginType: 'TransferDelegate',
  newAuthority: {
    type: 'Address',
    address: delegateAddress,
  },
}).sendAndConfirm(umi)</code></pre>

<h3>Plugin Reference</h3>
<table>
  <tr><th>Plugin</th><th>Purpose</th><th>Authority</th></tr>
  <tr><td>Royalties</td><td>Enforce creator royalties on transfers</td><td>UpdateAuthority</td></tr>
  <tr><td>FreezeDelegate</td><td>Freeze/thaw asset (prevent transfers)</td><td>Owner/Address</td></tr>
  <tr><td>BurnDelegate</td><td>Allow delegate to burn</td><td>Owner/Address</td></tr>
  <tr><td>TransferDelegate</td><td>Allow delegate to transfer</td><td>Owner/Address</td></tr>
  <tr><td>Attribute</td><td>On-chain key-value metadata</td><td>UpdateAuthority</td></tr>
  <tr><td>PermanentFreezeDelegate</td><td>Soulbound (permanent freeze)</td><td>UpdateAuthority</td></tr>
  <tr><td>PermanentTransferDelegate</td><td>Permanent transfer authority</td><td>UpdateAuthority</td></tr>
  <tr><td>PermanentBurnDelegate</td><td>Permanent burn authority</td><td>UpdateAuthority</td></tr>
  <tr><td>Edition</td><td>Edition numbering</td><td>UpdateAuthority</td></tr>
  <tr><td>AddBlocker</td><td>Prevent adding new plugins</td><td>UpdateAuthority</td></tr>
  <tr><td>ImmutableMetadata</td><td>Prevent name/URI changes</td><td>UpdateAuthority</td></tr>
  <tr><td>Autograph</td><td>On-chain signatures from creators</td><td>Owner</td></tr>
  <tr><td>VerifiedCreators</td><td>Verified creator list</td><td>UpdateAuthority</td></tr>
</table>

<h3>External Plugins</h3>
<p>Core also supports external plugins — on-chain programs that act as plugin adapters:</p>
<ul>
  <li><strong>Oracle</strong> — External program validates operations</li>
  <li><strong>AppData</strong> — Store arbitrary data in a linked account</li>
</ul>
`,
    },
  ],
};
