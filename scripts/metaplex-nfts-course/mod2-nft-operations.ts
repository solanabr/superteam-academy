import { CourseModule } from "../anchor-course/types";

export const MODULE_NFT_OPERATIONS: CourseModule = {
  title: "NFT Operations",
  description:
    "Transfer, update, and burn NFTs using Metaplex Core. Includes a quiz and hands-on challenge.",
  lessons: [
    {
      title: "Transfer an NFT",
      description:
        "Transfer NFT ownership between wallets on Solana using Metaplex Core.",
      type: "content",
      duration: "10 min",
      content: `
<h2>Transfer an NFT</h2>
<p>Transferring a Metaplex Core asset changes its owner. Only the current owner (or an approved delegate) can transfer it.</p>

<h3>Transfer with Umi</h3>
<pre><code>import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'
import { transfer, mplCore } from '@metaplex-foundation/mpl-core'
import { publicKey, keypairIdentity } from '@metaplex-foundation/umi'
import { readFileSync } from 'fs'

const umi = createUmi('https://api.devnet.solana.com')
  .use(mplCore())

const secretKey = JSON.parse(readFileSync('wallet.json', 'utf-8'))
const keypair = umi.eddsa.createKeypairFromSecretKey(
  new Uint8Array(secretKey)
)
umi.use(keypairIdentity(keypair))

const assetAddress = publicKey('YOUR_ASSET_ADDRESS')
const recipient = publicKey('RECIPIENT_WALLET')

await transfer(umi, {
  asset: assetAddress,
  newOwner: recipient,
}).sendAndConfirm(umi)

console.log('NFT transferred!')</code></pre>

<h3>Key Points</h3>
<ul>
  <li><strong>No token accounts</strong> — Unlike SPL tokens, Core assets don't need ATAs. The owner field is updated directly on the asset account.</li>
  <li><strong>Transfer Delegate</strong> — You can approve a delegate to transfer on your behalf using the TransferDelegate plugin.</li>
  <li><strong>Frozen assets</strong> — Assets with a FreezeDelegate plugin in frozen state cannot be transferred.</li>
  <li><strong>Collection transfers</strong> — Collection-level plugins can restrict or control transfers for all assets in a collection.</li>
</ul>
`,
    },
    {
      title: "Update an NFT",
      description:
        "Update your NFT's name, URI, and metadata as the update authority.",
      type: "content",
      duration: "10 min",
      content: `
<h2>Update an NFT</h2>
<p>The update authority can modify an NFT's name, URI, and plugins. This is useful for evolving game items, updating artwork, or correcting metadata.</p>

<h3>Update with Umi</h3>
<pre><code>import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'
import { update, mplCore } from '@metaplex-foundation/mpl-core'
import { publicKey, keypairIdentity } from '@metaplex-foundation/umi'
import { readFileSync } from 'fs'

const umi = createUmi('https://api.devnet.solana.com')
  .use(mplCore())

const secretKey = JSON.parse(readFileSync('wallet.json', 'utf-8'))
const keypair = umi.eddsa.createKeypairFromSecretKey(
  new Uint8Array(secretKey)
)
umi.use(keypairIdentity(keypair))

const assetAddress = publicKey('YOUR_ASSET_ADDRESS')

await update(umi, {
  asset: assetAddress,
  name: 'Updated NFT Name',
  uri: 'https://example.com/updated-metadata.json',
}).sendAndConfirm(umi)

console.log('NFT updated!')</code></pre>

<h3>What Can Be Updated</h3>
<table>
  <tr><th>Field</th><th>Description</th></tr>
  <tr><td><code>name</code></td><td>Display name</td></tr>
  <tr><td><code>uri</code></td><td>Off-chain metadata URL</td></tr>
  <tr><td><code>plugins</code></td><td>Add, remove, or modify plugins</td></tr>
  <tr><td><code>updateAuthority</code></td><td>Transfer update authority to another wallet</td></tr>
</table>

<h3>Update Authority</h3>
<ul>
  <li>Only the update authority can modify the asset</li>
  <li>Default update authority is the creator</li>
  <li>Can be transferred to another wallet or a PDA</li>
  <li>Setting to <code>None</code> makes the asset permanently immutable</li>
</ul>

<h3>Using the CLI</h3>
<pre><code>metaplex update core asset \\
  --asset YOUR_ASSET_ADDRESS \\
  --name "New Name" \\
  --uri "https://example.com/new-metadata.json"</code></pre>
`,
    },
    {
      title: "Burn an NFT",
      description:
        "Permanently destroy an NFT and reclaim rent fees.",
      type: "content",
      duration: "8 min",
      content: `
<h2>Burn an NFT</h2>
<p>Burning a Metaplex Core asset permanently destroys it and reclaims the rent-exempt SOL. <strong>This cannot be undone.</strong></p>

<h3>Burn with Umi</h3>
<pre><code>import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'
import { burn, mplCore } from '@metaplex-foundation/mpl-core'
import { publicKey, keypairIdentity } from '@metaplex-foundation/umi'
import { readFileSync } from 'fs'

const umi = createUmi('https://api.devnet.solana.com')
  .use(mplCore())

const secretKey = JSON.parse(readFileSync('wallet.json', 'utf-8'))
const keypair = umi.eddsa.createKeypairFromSecretKey(
  new Uint8Array(secretKey)
)
umi.use(keypairIdentity(keypair))

const assetAddress = publicKey('YOUR_ASSET_ADDRESS')

await burn(umi, {
  asset: assetAddress,
}).sendAndConfirm(umi)

console.log('NFT burned!')</code></pre>

<h3>Key Points</h3>
<ul>
  <li><strong>Owner only</strong> — Only the asset owner can burn it (or a BurnDelegate)</li>
  <li><strong>Rent reclaimed</strong> — The SOL used for rent-exemption is returned to the payer</li>
  <li><strong>Collection assets</strong> — Burning an asset in a collection updates the collection's count</li>
  <li><strong>Permanent</strong> — The account is closed and data is lost forever</li>
</ul>

<h3>Using the CLI</h3>
<pre><code>metaplex burn core asset \\
  --asset YOUR_ASSET_ADDRESS</code></pre>
`,
    },
    {
      title: "NFT Operations Quiz",
      description:
        "Test your knowledge of Metaplex Core NFTs — creation, fetching, transfers, and more.",
      type: "quiz",
      duration: "8 min",
      quiz: {
        passingScore: 70,
        questions: [
          {
            question: "What is the main advantage of Metaplex Core over Token Metadata for NFTs?",
            options: [
              "Core supports fungible tokens",
              "Core uses a single account per asset, reducing cost (~0.003 SOL vs ~0.022 SOL)",
              "Core requires no off-chain metadata",
              "Core is compatible with Token-2022",
            ],
            correctIndex: 1,
            explanation:
              "Metaplex Core stores everything in a single account per asset, making it ~7x cheaper than Token Metadata which requires 4+ accounts.",
          },
          {
            question: "Which SDK package is used for Metaplex Core NFT operations?",
            options: [
              "@metaplex-foundation/mpl-token-metadata",
              "@metaplex-foundation/mpl-core",
              "@metaplex-foundation/mpl-toolbox",
              "@solana/spl-token",
            ],
            correctIndex: 1,
            explanation:
              "Metaplex Core uses @metaplex-foundation/mpl-core for all asset operations (create, update, transfer, burn).",
          },
          {
            question: "How do you query all NFTs owned by a wallet efficiently?",
            options: [
              "Call fetchAsset for every possible address",
              "Use the DAS API getAssetsByOwner method",
              "Read the wallet's token accounts",
              "Use getProgramAccounts on Metaplex Core",
            ],
            correctIndex: 1,
            explanation:
              "The DAS (Digital Asset Standard) API provides indexed queries like getAssetsByOwner for efficient bulk lookups.",
          },
          {
            question: "What happens to the SOL when you burn a Core NFT?",
            options: [
              "It's lost forever",
              "It's sent to the Metaplex treasury",
              "It's returned to the payer as reclaimed rent",
              "It's distributed to collection holders",
            ],
            correctIndex: 2,
            explanation:
              "Burning closes the account and returns the rent-exempt SOL to the payer.",
          },
          {
            question: "Who can transfer a Metaplex Core NFT?",
            options: [
              "Anyone",
              "Only the update authority",
              "The owner or an approved TransferDelegate",
              "Only the original creator",
            ],
            correctIndex: 2,
            explanation:
              "The current owner can transfer the asset, or a TransferDelegate plugin can authorize another account to transfer on the owner's behalf.",
          },
        ],
      },
    },
    {
      title: "Create an NFT Collection",
      description:
        "Build a script that creates a collection and mints NFTs into it using Metaplex Core.",
      type: "challenge",
      duration: "20 min",
      challenge: {
        prompt:
          "Create a TypeScript script that: (1) Creates a Metaplex Core collection, (2) Mints 3 NFTs into the collection with different names, (3) Fetches and logs all 3 assets.",
        objectives: [
          "Initialize Umi with mplCore plugin",
          "Create a collection using createCollection",
          "Create 3 assets in the collection using create with collection parameter",
          "Fetch each asset with fetchAsset and log name + owner",
        ],
        starterCode: `import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'
import {
  create,
  createCollection,
  fetchAsset,
  mplCore,
} from '@metaplex-foundation/mpl-core'
import { generateSigner, keypairIdentity } from '@metaplex-foundation/umi'

// TODO: Initialize Umi with devnet and mplCore plugin

// TODO: Create a collection called "Academy Collection"

// TODO: Create 3 NFTs in the collection:
//   "Academy NFT #1", "Academy NFT #2", "Academy NFT #3"

// TODO: Fetch and log each NFT's name and owner
`,
        language: "typescript",
        solution: `import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'
import {
  create,
  createCollection,
  fetchAsset,
  mplCore,
} from '@metaplex-foundation/mpl-core'
import { generateSigner, keypairIdentity } from '@metaplex-foundation/umi'

const umi = createUmi('https://api.devnet.solana.com').use(mplCore())

const collection = generateSigner(umi)
await createCollection(umi, {
  collection,
  name: 'Academy Collection',
  uri: 'https://example.com/collection.json',
}).sendAndConfirm(umi)

const assets = []
for (let i = 1; i <= 3; i++) {
  const asset = generateSigner(umi)
  await create(umi, {
    asset,
    name: \`Academy NFT #\${i}\`,
    uri: \`https://example.com/nft-\${i}.json\`,
    collection: collection.publicKey,
  }).sendAndConfirm(umi)
  assets.push(asset.publicKey)
}

for (const addr of assets) {
  const data = await fetchAsset(umi, addr)
  console.log(\`\${data.name} - Owner: \${data.owner}\`)
}`,
        hints: [
          "Use generateSigner(umi) for both collection and each asset",
          "Pass collection: collection.publicKey when creating assets",
          "fetchAsset returns the full on-chain data including name and owner",
        ],
        testCases: [
          {
            id: "tc1",
            name: "Creates collection and 3 NFTs",
            expectedOutput: "Academy NFT #1",
          },
        ],
      },
    },
  ],
};
