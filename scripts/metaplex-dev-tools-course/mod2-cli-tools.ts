import { CourseModule } from "../anchor-course/types";

export const MODULE_CLI_TOOLS: CourseModule = {
  title: "CLI, IDL Generation & Local Testing",
  description:
    "Use the Metaplex CLI for asset management, Shank for IDL generation, and Amman for local validator testing.",
  lessons: [
    {
      title: "Metaplex CLI (mplx)",
      description:
        "Use the Metaplex CLI to create, manage, and query digital assets from the command line.",
      type: "content",
      duration: "18 min",
      content: `
<h2>Metaplex CLI</h2>
<p>The Metaplex CLI (<code>mplx</code>) is a command-line tool for interacting with Metaplex programs — create NFTs, manage collections, deploy Candy Machines, and more.</p>

<h3>Installation</h3>
<pre><code>npm install -g @metaplex-foundation/cli

# Or use npx
npx @metaplex-foundation/cli --help</code></pre>

<h3>Configuration</h3>
<pre><code># Set wallet
mplx config set --keypair ~/wallets/wallet.json

# Set RPC
mplx config set --rpc https://api.devnet.solana.com

# Set explorer
mplx config set --explorer solscan</code></pre>

<h3>Core Commands</h3>
<pre><code># Create a Core asset
mplx create core asset \\
  --name "My NFT" \\
  --uri "https://example.com/metadata.json"

# Create a Core collection
mplx create core collection \\
  --name "My Collection" \\
  --uri "https://example.com/collection.json"

# Fetch asset info
mplx fetch core asset --address ASSET_ADDRESS

# Update asset
mplx update core asset \\
  --asset ASSET_ADDRESS \\
  --name "Updated Name"

# Burn asset
mplx burn core asset --asset ASSET_ADDRESS

# Add plugin
mplx plugin add \\
  --asset ASSET_ADDRESS \\
  --type royalties \\
  --basis-points 500</code></pre>

<h3>Candy Machine Commands</h3>
<pre><code># Create Candy Machine
mplx candy-machine create \\
  --collection COLLECTION_ADDRESS \\
  --item-count 100

# Upload assets from folder
mplx candy-machine upload \\
  --candy-machine CM_ADDRESS \\
  --assets-dir ./assets

# Insert items
mplx candy-machine insert \\
  --candy-machine CM_ADDRESS

# Validate cache
mplx candy-machine validate \\
  --candy-machine CM_ADDRESS

# Fetch info
mplx candy-machine info \\
  --candy-machine CM_ADDRESS

# Withdraw (after mint complete)
mplx candy-machine withdraw \\
  --candy-machine CM_ADDRESS</code></pre>

<h3>Token Commands</h3>
<pre><code># Create fungible token
mplx create fungible \\
  --name "My Token" \\
  --symbol "MTK" \\
  --decimals 9 \\
  --initial-supply 1000000

# Transfer tokens
mplx transfer tokens \\
  --mint MINT_ADDRESS \\
  --recipient WALLET \\
  --amount 100

# Check SOL balance
mplx sol balance

# Airdrop SOL (devnet)
mplx sol airdrop --amount 2</code></pre>
`,
    },
    {
      title: "Shank — IDL Generation",
      description:
        "Generate IDL files from Solana program code using Shank macros for SDK generation.",
      type: "content",
      duration: "15 min",
      content: `
<h2>Shank — IDL Extraction</h2>
<p>Shank is a collection of Rust crates that extract Interface Definition Language (IDL) from Solana program code. The IDL can then generate TypeScript SDKs automatically.</p>

<h3>Why Shank?</h3>
<p>While Anchor auto-generates IDL from its framework annotations, native Solana programs don't have this. Shank fills that gap by providing macros for native programs.</p>

<h3>Installation</h3>
<pre><code># Install CLI
cargo install shank-cli

# Add to Cargo.toml
[dependencies]
shank = "0.4"</code></pre>

<h3>Macros</h3>

<h4>ShankAccount</h4>
<pre><code>use shank::ShankAccount;

#[derive(ShankAccount)]
pub struct UserProfile {
    pub authority: Pubkey,
    pub name: String,
    pub level: u32,
    pub xp: u64,
}</code></pre>

<h4>ShankInstruction</h4>
<pre><code>use shank::ShankInstruction;

#[derive(ShankInstruction)]
pub enum ProgramInstruction {
    /// Create a new user profile
    #[account(0, writable, signer, name = "payer", desc = "Transaction payer")]
    #[account(1, writable, name = "profile", desc = "User profile PDA")]
    #[account(2, name = "system_program", desc = "System Program")]
    CreateProfile {
        name: String,
    },

    /// Update user XP
    #[account(0, signer, name = "authority", desc = "Profile authority")]
    #[account(1, writable, name = "profile", desc = "User profile PDA")]
    UpdateXp {
        amount: u64,
    },
}</code></pre>

<h3>Generate IDL</h3>
<pre><code># From your program directory
shank idl --out-dir ./target/idl --crate-root ./

# Output: target/idl/program_name.json</code></pre>

<h3>IDL → SDK Pipeline</h3>
<p>The generated IDL can be fed to <strong>Kinobi</strong> (code generator) to produce TypeScript SDKs:</p>
<pre><code># Shank flow:
# 1. Annotate Rust code with Shank macros
# 2. Run shank idl to generate JSON IDL
# 3. Use Kinobi to generate TypeScript SDK
# 4. Publish SDK to npm</code></pre>

<h3>Shank vs Anchor IDL</h3>
<table>
  <tr><th>Feature</th><th>Shank</th><th>Anchor</th></tr>
  <tr><td>Program type</td><td>Native Solana</td><td>Anchor framework</td></tr>
  <tr><td>Annotations</td><td>Shank macros</td><td>Anchor attributes</td></tr>
  <tr><td>IDL format</td><td>Shank JSON</td><td>Anchor JSON</td></tr>
  <tr><td>SDK generation</td><td>Kinobi</td><td>Built-in</td></tr>
</table>
`,
    },
    {
      title: "Amman — Local Testing Toolkit",
      description:
        "Test Solana programs locally with Amman — a toolkit for running and configuring local validators.",
      type: "content",
      duration: "12 min",
      content: `
<h2>Amman — Local Validator Toolkit</h2>
<p>Amman is a testing toolkit for Solana development. It helps you run a local validator with pre-configured accounts, programs, and state.</p>

<h3>Installation</h3>
<pre><code>npm install -g @metaplex-foundation/amman

# Or as dev dependency
npm install -D @metaplex-foundation/amman</code></pre>

<h3>CLI Commands</h3>
<pre><code># Start local validator with config
amman start

# Start with specific config file
amman start --config .ammanrc.js

# Stop validator
amman stop

# Check validator status
amman status

# Airdrop SOL to an address
amman airdrop &lt;address&gt; &lt;amount&gt;

# Label an address for debugging
amman label &lt;address&gt; "My Account"</code></pre>

<h3>Configuration (.ammanrc.js)</h3>
<pre><code>module.exports = {
  validator: {
    // Programs to deploy
    programs: [
      {
        label: 'My Program',
        programId: 'YOUR_PROGRAM_ID',
        deployPath: './target/deploy/my_program.so',
      },
    ],
    // Accounts to load from mainnet
    accounts: [
      {
        label: 'Token Metadata',
        accountId: 'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s',
        executable: true,
      },
    ],
    // Keypairs
    jsonAccounts: [
      {
        label: 'Authority',
        json: './wallets/authority.json',
        lamports: 10 * 1e9,
      },
    ],
  },
  relay: {
    enabled: true,
    killRunningRelay: true,
  },
  storage: {
    enabled: true,
    storageId: 'mock-storage',
    clearOnStart: true,
  },
}</code></pre>

<h3>Pre-made Configs</h3>
<p>Amman provides ready-made configurations for Metaplex programs:</p>
<pre><code>const { PROGRAM_ADDRESS: TOKEN_METADATA } =
  require('@metaplex-foundation/mpl-token-metadata')

module.exports = {
  validator: {
    accounts: [
      {
        label: 'Token Metadata',
        accountId: TOKEN_METADATA,
        executable: true,
      },
    ],
  },
}</code></pre>

<h3>Benefits</h3>
<ul>
  <li><strong>Deterministic testing</strong> — Same starting state every run</li>
  <li><strong>No rate limits</strong> — Unlimited transactions on localhost</li>
  <li><strong>Fast iteration</strong> — Instant confirmation</li>
  <li><strong>Account cloning</strong> — Load mainnet accounts into local validator</li>
  <li><strong>Address labels</strong> — Human-readable names in logs</li>
</ul>
`,
    },
    {
      title: "Dev Tools Quiz",
      description:
        "Test your knowledge of Umi, DAS API, Metaplex CLI, Shank, and Amman.",
      type: "quiz",
      duration: "8 min",
      quiz: {
        passingScore: 70,
        questions: [
          {
            question: "What is Umi?",
            options: [
              "A Solana RPC provider",
              "A modular JavaScript framework for building Solana clients",
              "A Rust testing framework",
              "A blockchain explorer",
            ],
            correctIndex: 1,
            explanation:
              "Umi is a modular framework for building JavaScript clients for Solana programs, providing core interfaces that all Metaplex SDKs build upon.",
          },
          {
            question:
              "Which DAS API method would you use to get all NFTs owned by a wallet?",
            options: [
              "getAsset",
              "searchAssets",
              "getAssetsByOwner",
              "getTokenAccounts",
            ],
            correctIndex: 2,
            explanation:
              "getAssetsByOwner returns all digital assets (NFTs, compressed NFTs, etc.) owned by a specific wallet address.",
          },
          {
            question: "What does Shank generate from Solana program code?",
            options: [
              "Test suites",
              "Interface Definition Language (IDL) files",
              "Deployment scripts",
              "Account state snapshots",
            ],
            correctIndex: 1,
            explanation:
              "Shank extracts IDL from annotated Rust code using ShankAccount and ShankInstruction macros. The IDL can then generate TypeScript SDKs.",
          },
          {
            question: "How do you add Metaplex Core support to Umi?",
            options: [
              "Import it directly",
              "Use umi.use(mplCore())",
              "Call umi.addProgram('core')",
              "Set an environment variable",
            ],
            correctIndex: 1,
            explanation:
              "Umi uses a plugin system — you add program support via .use() method: umi.use(mplCore())",
          },
          {
            question: "What is the primary benefit of Amman?",
            options: [
              "Faster RPC responses on mainnet",
              "Deterministic local testing with pre-configured accounts and programs",
              "Automatic deployment to devnet",
              "Real-time transaction monitoring",
            ],
            correctIndex: 1,
            explanation:
              "Amman provides deterministic local testing by configuring a local validator with specific programs, accounts, and state.",
          },
        ],
      },
    },
    {
      title: "Query Assets with DAS API",
      description:
        "Build a script that uses the DAS API to query assets by owner, collection, and search criteria.",
      type: "challenge",
      duration: "18 min",
      challenge: {
        prompt:
          "Create a TypeScript script that: (1) Fetches all NFTs owned by a wallet using getAssetsByOwner, (2) Groups them by collection, (3) Logs the collection name and count for each group.",
        objectives: [
          "Call getAssetsByOwner via DAS API",
          "Parse the response to extract collection groupings",
          "Group assets by their collection address",
          "Log each collection name and asset count",
        ],
        starterCode: `const RPC_URL = 'https://mainnet.helius-rpc.com/?api-key=YOUR_KEY'
const WALLET = 'YOUR_WALLET_ADDRESS'

// TODO: Fetch all assets owned by WALLET using getAssetsByOwner

// TODO: Group assets by collection

// TODO: Log each collection name and count
// Example output:
//   Collection "Cool Cats": 3 assets
//   Collection "DeGods": 1 asset
//   No collection: 5 assets
`,
        language: "typescript",
        solution: `const RPC_URL = 'https://mainnet.helius-rpc.com/?api-key=YOUR_KEY'
const WALLET = 'YOUR_WALLET_ADDRESS'

async function main() {
  const response = await fetch(RPC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'getAssetsByOwner',
      params: {
        ownerAddress: WALLET,
        page: 1,
        limit: 1000,
        displayOptions: { showCollectionMetadata: true },
      },
    }),
  })

  const { result } = await response.json()
  const groups: Record<string, { name: string; count: number }> = {}

  for (const item of result.items) {
    const collection = item.grouping?.find(
      (g: any) => g.group_key === 'collection'
    )
    const key = collection?.group_value ?? 'none'
    const name = collection?.collection_metadata?.name ?? 'No collection'

    if (!groups[key]) groups[key] = { name, count: 0 }
    groups[key].count++
  }

  for (const [, { name, count }] of Object.entries(groups)) {
    console.log(\`Collection "\${name}": \${count} asset(s)\`)
  }
}

main()`,
        hints: [
          "Use displayOptions.showCollectionMetadata: true to get collection names",
          "Each item has a grouping array with group_key: 'collection'",
          "Assets without a collection won't have a collection grouping entry",
        ],
        testCases: [
          {
            id: "tc1",
            name: "Groups assets by collection",
            expectedOutput: "Collection",
          },
        ],
      },
    },
  ],
};
