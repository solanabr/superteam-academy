import { CourseModule } from "../anchor-course/types";

export const MODULE_TOKEN_OPERATIONS: CourseModule = {
  title: "Token Operations",
  description:
    "Transfer, update, and burn fungible tokens on Solana using Metaplex SDKs.",
  lessons: [
    {
      title: "Transfer Tokens",
      description:
        "Transfer fungible tokens between wallets on Solana using Umi.",
      type: "content",
      duration: "12 min",
      content: `
<h2>Transfer Fungible Tokens</h2>
<p>Transferring tokens moves them from one token account to another. The sender must sign the transaction.</p>

<h3>Prerequisites</h3>
<pre><code>npm install @metaplex-foundation/mpl-toolbox \\
  @metaplex-foundation/umi \\
  @metaplex-foundation/umi-bundle-defaults</code></pre>

<h3>Transfer Tokens (Umi)</h3>
<pre><code>import {
  createTokenIfMissing,
  findAssociatedTokenPda,
  transferTokens,
} from '@metaplex-foundation/mpl-toolbox'
import {
  keypairIdentity,
  publicKey,
  transactionBuilder,
} from '@metaplex-foundation/umi'
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'
import { readFileSync } from 'fs'

const umi = createUmi('https://api.devnet.solana.com')

const secretKey = JSON.parse(readFileSync('wallet.json', 'utf-8'))
const keypair = umi.eddsa.createKeypairFromSecretKey(
  new Uint8Array(secretKey)
)
umi.use(keypairIdentity(keypair))

const mintAddress = publicKey('YOUR_MINT_ADDRESS')
const recipientAddress = publicKey('RECIPIENT_WALLET')

await transactionBuilder()
  .add(
    createTokenIfMissing(umi, {
      mint: mintAddress,
      owner: recipientAddress,
    })
  )
  .add(
    transferTokens(umi, {
      source: findAssociatedTokenPda(umi, {
        mint: mintAddress,
        owner: umi.identity.publicKey,
      }),
      destination: findAssociatedTokenPda(umi, {
        mint: mintAddress,
        owner: recipientAddress,
      }),
      amount: 100_000_000_000, // 100 tokens (9 decimals)
    })
  )
  .sendAndConfirm(umi)

console.log('Tokens transferred!')</code></pre>

<h3>Key Points</h3>
<ul>
  <li><strong>createTokenIfMissing</strong> — Creates the recipient's ATA if it doesn't exist</li>
  <li><strong>Source & Destination</strong> — Both are token accounts (ATAs), not wallet addresses</li>
  <li><strong>Amount</strong> — Raw amount including decimals (100 tokens with 9 decimals = <code>100_000_000_000</code>)</li>
  <li><strong>Signer</strong> — The owner of the source token account must sign</li>
</ul>

<h3>Using the CLI</h3>
<pre><code>metaplex transfer tokens \\
  --mint YOUR_MINT_ADDRESS \\
  --recipient RECIPIENT_WALLET \\
  --amount 100</code></pre>
`,
    },
    {
      title: "Update Token Metadata",
      description:
        "Update the metadata of your fungible token — name, symbol, image, and other properties.",
      type: "content",
      duration: "12 min",
      content: `
<h2>Update Token Metadata</h2>
<p>You can update token metadata (name, symbol, URI) using the Token Metadata program. Only the <strong>update authority</strong> can make changes.</p>

<h3>Update Metadata (Umi)</h3>
<pre><code>import {
  fetchDigitalAsset,
  mplTokenMetadata,
  updateV1,
} from '@metaplex-foundation/mpl-token-metadata'
import {
  keypairIdentity,
  publicKey,
} from '@metaplex-foundation/umi'
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'
import { readFileSync } from 'fs'

const umi = createUmi('https://api.devnet.solana.com')
  .use(mplTokenMetadata())

const secretKey = JSON.parse(readFileSync('wallet.json', 'utf-8'))
const keypair = umi.eddsa.createKeypairFromSecretKey(
  new Uint8Array(secretKey)
)
umi.use(keypairIdentity(keypair))

const mintAddress = publicKey('YOUR_MINT_ADDRESS')

// Fetch current state
const asset = await fetchDigitalAsset(umi, mintAddress)

// Update metadata
await updateV1(umi, {
  mint: mintAddress,
  data: {
    ...asset.metadata,
    name: 'Updated Token Name',
    symbol: 'UTK',
    uri: 'https://example.com/updated-metadata.json',
  },
}).sendAndConfirm(umi)

console.log('Metadata updated!')</code></pre>

<h3>What Can Be Updated</h3>
<table>
  <tr><th>Field</th><th>Description</th></tr>
  <tr><td><code>name</code></td><td>Display name of the token</td></tr>
  <tr><td><code>symbol</code></td><td>Ticker symbol</td></tr>
  <tr><td><code>uri</code></td><td>Link to off-chain metadata JSON</td></tr>
  <tr><td><code>sellerFeeBasisPoints</code></td><td>Royalty percentage</td></tr>
  <tr><td><code>creators</code></td><td>List of creators and their shares</td></tr>
</table>

<h3>Update Authority</h3>
<ul>
  <li>Only the <strong>update authority</strong> can change metadata</li>
  <li>Update authority is set during token creation (defaults to the creator)</li>
  <li>You can transfer update authority to another wallet</li>
  <li>Setting <code>isMutable: false</code> makes the metadata permanently immutable</li>
</ul>

<h3>Using the CLI</h3>
<pre><code>metaplex update token \\
  --mint YOUR_MINT_ADDRESS \\
  --name "New Name" \\
  --symbol "NEW" \\
  --uri "https://example.com/new-metadata.json"</code></pre>
`,
    },
    {
      title: "Burn Tokens",
      description:
        "Burn fungible tokens to permanently remove them from circulation.",
      type: "content",
      duration: "10 min",
      content: `
<h2>Burn Tokens</h2>
<p>Burning tokens permanently destroys them, reducing the circulating supply. <strong>This action cannot be undone.</strong></p>

<h3>Burn Tokens (Umi)</h3>
<pre><code>import {
  burnToken,
  findAssociatedTokenPda,
} from '@metaplex-foundation/mpl-toolbox'
import {
  keypairIdentity,
  publicKey,
} from '@metaplex-foundation/umi'
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'
import { readFileSync } from 'fs'

const umi = createUmi('https://api.devnet.solana.com')

const secretKey = JSON.parse(readFileSync('wallet.json', 'utf-8'))
const keypair = umi.eddsa.createKeypairFromSecretKey(
  new Uint8Array(secretKey)
)
umi.use(keypairIdentity(keypair))

const mintAddress = publicKey('YOUR_MINT_ADDRESS')

await burnToken(umi, {
  account: findAssociatedTokenPda(umi, {
    mint: mintAddress,
    owner: umi.identity.publicKey,
  }),
  mint: mintAddress,
  amount: 50_000_000_000, // 50 tokens (9 decimals)
}).sendAndConfirm(umi)

console.log('Tokens burned!')</code></pre>

<h3>Key Points</h3>
<ul>
  <li><strong>Permanent</strong> — Burned tokens are gone forever. The supply is reduced.</li>
  <li><strong>Owner Only</strong> — Only the token account owner can burn their tokens.</li>
  <li><strong>Delegates</strong> — A delegated authority can also burn tokens on behalf of the owner.</li>
  <li><strong>Close Account</strong> — After burning all tokens, you can close the token account to reclaim rent SOL.</li>
</ul>

<h3>Using the CLI</h3>
<pre><code>metaplex burn tokens \\
  --mint YOUR_MINT_ADDRESS \\
  --amount 50</code></pre>
`,
    },
  ],
};
