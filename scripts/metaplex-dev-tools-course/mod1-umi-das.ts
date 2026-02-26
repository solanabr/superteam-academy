import { CourseModule } from "../anchor-course/types";

export const MODULE_UMI_DAS: CourseModule = {
  title: "Umi Framework & DAS API",
  description:
    "Master Umi — the modular JavaScript framework for Solana — and the Digital Asset Standard API for querying on-chain assets.",
  lessons: [
    {
      title: "Umi Framework Overview",
      description:
        "Learn Umi — the modular client framework that powers all Metaplex JavaScript SDKs.",
      type: "content",
      duration: "20 min",
      content: `
<h2>Umi — A Solana Framework for JavaScript</h2>
<p>Umi is a modular framework for building JavaScript clients for Solana programs. It provides zero-dependency core interfaces that all Metaplex SDKs build upon.</p>

<h3>Why Umi?</h3>
<ul>
  <li><strong>Modular</strong> — Swap implementations (RPC, storage, signers) without changing code</li>
  <li><strong>Type-safe</strong> — Full TypeScript support with strict types</li>
  <li><strong>Plugin system</strong> — Extend functionality via <code>.use()</code></li>
  <li><strong>Transaction builder</strong> — Chain instructions with <code>.add()</code> and batch send</li>
</ul>

<h3>Installation</h3>
<pre><code>npm install @metaplex-foundation/umi \\
  @metaplex-foundation/umi-bundle-defaults</code></pre>

<h3>Basic Setup</h3>
<pre><code>import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'
import { keypairIdentity } from '@metaplex-foundation/umi'
import { readFileSync } from 'fs'

// Create Umi instance
const umi = createUmi('https://api.devnet.solana.com')

// Load wallet
const secretKey = JSON.parse(readFileSync('wallet.json', 'utf-8'))
const keypair = umi.eddsa.createKeypairFromSecretKey(
  new Uint8Array(secretKey)
)
umi.use(keypairIdentity(keypair))</code></pre>

<h3>Core Interfaces</h3>
<table>
  <tr><th>Interface</th><th>Purpose</th></tr>
  <tr><td><code>Umi</code></td><td>Main context object containing all services</td></tr>
  <tr><td><code>Signer</code></td><td>Keypair that can sign transactions</td></tr>
  <tr><td><code>PublicKey</code></td><td>Umi's public key type (different from web3.js)</td></tr>
  <tr><td><code>TransactionBuilder</code></td><td>Chainable instruction builder</td></tr>
  <tr><td><code>RpcInterface</code></td><td>RPC communication layer</td></tr>
</table>

<h3>Plugins</h3>
<p>Add Metaplex program support via plugins:</p>
<pre><code>import { mplCore } from '@metaplex-foundation/mpl-core'
import { mplTokenMetadata } from '@metaplex-foundation/mpl-token-metadata'
import { mplCandyMachine } from '@metaplex-foundation/mpl-core-candy-machine'

const umi = createUmi('https://api.devnet.solana.com')
  .use(mplCore())
  .use(mplTokenMetadata())
  .use(mplCandyMachine())</code></pre>

<h3>Transaction Builder</h3>
<pre><code>import { transactionBuilder } from '@metaplex-foundation/umi'

// Chain multiple instructions
await transactionBuilder()
  .add(instruction1)
  .add(instruction2)
  .add(instruction3)
  .sendAndConfirm(umi)</code></pre>

<h3>Differences from @solana/web3.js</h3>
<table>
  <tr><th>Feature</th><th>Umi</th><th>web3.js</th></tr>
  <tr><td>Public keys</td><td><code>publicKey('...')</code></td><td><code>new PublicKey('...')</code></td></tr>
  <tr><td>Keypairs</td><td><code>generateSigner(umi)</code></td><td><code>Keypair.generate()</code></td></tr>
  <tr><td>Transactions</td><td>Builder pattern with <code>.add()</code></td><td>Manual <code>Transaction.add()</code></td></tr>
  <tr><td>Plugins</td><td>First-class <code>.use()</code></td><td>No plugin system</td></tr>
</table>

<h3>Adapters</h3>
<p>Umi provides adapters to convert between Umi and web3.js types:</p>
<pre><code>import { fromWeb3JsPublicKey, toWeb3JsPublicKey } from '@metaplex-foundation/umi-web3js-adapters'

// web3.js → Umi
const umiKey = fromWeb3JsPublicKey(web3JsPublicKey)

// Umi → web3.js
const web3JsKey = toWeb3JsPublicKey(umiPublicKey)</code></pre>
`,
    },
    {
      title: "DAS API — Digital Asset Standard",
      description:
        "Query NFTs, tokens, and digital assets using the Metaplex DAS API — methods, pagination, and search.",
      type: "content",
      duration: "22 min",
      content: `
<h2>DAS API — Digital Asset Standard</h2>
<p>The DAS API is a unified interface for querying digital assets on Solana. It indexes on-chain data and provides fast, structured access to NFTs, tokens, and collections.</p>

<h3>RPC Providers</h3>
<p>DAS API is available through RPC providers:</p>
<ul>
  <li><strong>Helius</strong> — <code>https://mainnet.helius-rpc.com/?api-key=YOUR_KEY</code></li>
  <li><strong>Triton</strong> — <code>https://YOUR_KEY.triton.one</code></li>
  <li><strong>Shyft</strong>, <strong>Ironforge</strong>, and others</li>
</ul>

<h3>Core Methods</h3>
<table>
  <tr><th>Method</th><th>Description</th></tr>
  <tr><td><code>getAsset</code></td><td>Fetch a single asset by ID</td></tr>
  <tr><td><code>getAssets</code></td><td>Fetch multiple assets by IDs</td></tr>
  <tr><td><code>getAssetProof</code></td><td>Get Merkle proof for compressed NFTs</td></tr>
  <tr><td><code>getAssetsByOwner</code></td><td>All assets owned by a wallet</td></tr>
  <tr><td><code>getAssetsByCreator</code></td><td>All assets by a creator</td></tr>
  <tr><td><code>getAssetsByGroup</code></td><td>All assets in a collection</td></tr>
  <tr><td><code>getAssetsByAuthority</code></td><td>All assets by update authority</td></tr>
  <tr><td><code>searchAssets</code></td><td>Advanced search with filters</td></tr>
  <tr><td><code>getTokenAccounts</code></td><td>Token accounts for a wallet</td></tr>
  <tr><td><code>getNftEditions</code></td><td>Edition prints of a master NFT</td></tr>
</table>

<h3>Basic Usage</h3>
<pre><code>// Fetch a single asset
const response = await fetch(rpcUrl, {
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
console.log('Image:', result.content.links.image)
console.log('Owner:', result.ownership.owner)</code></pre>

<h3>Get All NFTs by Owner</h3>
<pre><code>const response = await fetch(rpcUrl, {
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
      displayOptions: {
        showCollectionMetadata: true,
        showFungible: true,
      },
    },
  }),
})</code></pre>

<h3>Search Assets</h3>
<pre><code>// Search by collection + specific criteria
const response = await fetch(rpcUrl, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'searchAssets',
    params: {
      grouping: ['collection', 'COLLECTION_ADDRESS'],
      burnt: false,
      page: 1,
      limit: 50,
    },
  }),
})</code></pre>

<h3>Pagination</h3>
<p>DAS API supports two pagination methods:</p>
<ul>
  <li><strong>Page-based</strong> — Use <code>page</code> parameter (1-indexed)</li>
  <li><strong>Cursor-based</strong> — Use <code>cursor</code> from previous response for sequential access</li>
</ul>

<h3>Core Extension</h3>
<p>DAS has dedicated methods for Metaplex Core assets:</p>
<pre><code>// Get Core assets by collection
method: 'getCoreAssetsByCollection'
params: { collectionAddress: '...' }

// Search Core assets
method: 'searchCoreAssets'
params: { owner: '...', collection: '...' }</code></pre>
`,
    },
    {
      title: "Umi Toolbox",
      description:
        "Use the Umi Toolbox for common Solana operations — account creation, SOL transfers, token management, and priority fees.",
      type: "content",
      duration: "15 min",
      content: `
<h2>Umi Toolbox</h2>
<p>The <code>@metaplex-foundation/mpl-toolbox</code> package provides helper instructions for common Solana operations.</p>

<h3>Installation</h3>
<pre><code>npm install @metaplex-foundation/mpl-toolbox</code></pre>

<h3>Create Account</h3>
<pre><code>import { createAccount } from '@metaplex-foundation/mpl-toolbox'

await createAccount(umi, {
  newAccount: generateSigner(umi),
  lamports: sol(0.01),
  space: 200,
  programId: programAddress,
}).sendAndConfirm(umi)</code></pre>

<h3>Transfer SOL</h3>
<pre><code>import { transferSol } from '@metaplex-foundation/mpl-toolbox'

await transferSol(umi, {
  destination: recipientAddress,
  amount: sol(1.5),
}).sendAndConfirm(umi)</code></pre>

<h3>Token Management</h3>
<pre><code>import {
  createTokenIfMissing,
  findAssociatedTokenPda,
  mintTokensTo,
  transferTokens,
  burnToken,
} from '@metaplex-foundation/mpl-toolbox'

// Create ATA if missing
await createTokenIfMissing(umi, {
  mint: mintAddress,
  owner: ownerAddress,
}).sendAndConfirm(umi)

// Mint tokens
await mintTokensTo(umi, {
  mint: mintAddress,
  token: findAssociatedTokenPda(umi, {
    mint: mintAddress,
    owner: ownerAddress,
  }),
  amount: 1000,
}).sendAndConfirm(umi)

// Transfer
await transferTokens(umi, {
  source: sourceAta,
  destination: destAta,
  amount: 500,
}).sendAndConfirm(umi)</code></pre>

<h3>Priority Fees & Compute</h3>
<pre><code>import {
  setComputeUnitLimit,
  setComputeUnitPrice,
} from '@metaplex-foundation/mpl-toolbox'

await transactionBuilder()
  .add(setComputeUnitLimit(umi, { units: 200_000 }))
  .add(setComputeUnitPrice(umi, { microLamports: 50_000 }))
  .add(yourInstruction)
  .sendAndConfirm(umi)</code></pre>

<h3>Address Lookup Tables</h3>
<pre><code>import {
  createLut,
  findAddressLookupTablePda,
} from '@metaplex-foundation/mpl-toolbox'

// Create LUT for transaction size optimization
await createLut(umi, {
  recentSlot: await umi.rpc.getSlot(),
  addresses: [address1, address2, address3],
}).sendAndConfirm(umi)</code></pre>

<h3>Transaction Memo</h3>
<pre><code>import { addMemo } from '@metaplex-foundation/mpl-toolbox'

await transactionBuilder()
  .add(addMemo(umi, { memo: 'Hello from Umi!' }))
  .add(yourInstruction)
  .sendAndConfirm(umi)</code></pre>
`,
    },
  ],
};
