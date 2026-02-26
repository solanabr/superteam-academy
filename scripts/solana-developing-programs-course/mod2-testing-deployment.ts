import { CourseModule } from "../anchor-course/types";

export const MODULE_TESTING_DEPLOYMENT: CourseModule = {
  title: "Testing & Deployment",
  description:
    "Test programs with Mollusk, deploy to devnet/mainnet, generate clients with Codama, and verify builds",
  lessons: [
    {
      title: "Testing with Mollusk",
      description: "Lightweight instruction-level testing without a validator",
      type: "content",
      content: `<h2>Testing with Mollusk</h2><p><strong>Mollusk</strong> is a lightweight SVM testing harness that executes individual instructions without spinning up a full validator. It's fast and great for unit testing.</p><h3>Setup</h3><pre><code>[dev-dependencies]
mollusk-svm = "0.0.12"
solana-sdk = "2.1"</code></pre><h3>Basic Test</h3><pre><code>use mollusk_svm::Mollusk;
use solana_sdk::{
    account::AccountSharedData,
    instruction::{AccountMeta, Instruction},
    pubkey::Pubkey,
};

#[test]
fn test_initialize() {
    let program_id = Pubkey::new_unique();
    let mollusk = Mollusk::new(&program_id, "target/deploy/my_program");

    let data_account = Pubkey::new_unique();
    let signer = Pubkey::new_unique();

    let instruction = Instruction::new_with_bytes(
        program_id,
        &[0], // instruction data
        vec![
            AccountMeta::new(data_account, false),
            AccountMeta::new_readonly(signer, true),
        ],
    );

    let result = mollusk.process_instruction(
        &instruction,
        &vec![
            (data_account, AccountSharedData::new(1_000_000, 100, &program_id)),
            (signer, AccountSharedData::new(1_000_000_000, 0, &solana_sdk::system_program::ID)),
        ],
    );

    assert!(!result.program_result.is_err());
}</code></pre><h3>Key Features</h3><ul><li><strong>No validator</strong> — runs instructions in-process</li><li><strong>Fast</strong> — tests run in milliseconds</li><li><strong>CU metering</strong> — see exact compute unit usage</li><li><strong>Fixture support</strong> — dump/load test fixtures</li></ul>`,
      xp: 30,
    },
    {
      title: "Deploying Programs",
      description: "Deploy programs to devnet and mainnet-beta",
      type: "content",
      content: `<h2>Deploying Programs</h2><h3>Deploy to Devnet</h3><pre><code># Configure for devnet
solana config set --url devnet

# Airdrop SOL for deployment
solana airdrop 4

# Build with Anchor
anchor build

# Deploy
anchor deploy</code></pre><h3>Deploy to Mainnet</h3><pre><code># Configure for mainnet
solana config set --url mainnet-beta

# Deploy (requires real SOL)
anchor deploy --provider.cluster mainnet-beta</code></pre><h3>Custom Program Keypair</h3><pre><code># Deploy with a specific program ID
anchor deploy --program-keypair wallets/program-keypair.json</code></pre><h3>Program Size & Cost</h3><ul><li>Programs are stored in a <strong>buffer account</strong> during deployment</li><li>Cost depends on program size (rent exemption for data)</li><li>A typical Anchor program costs <strong>1-5 SOL</strong> to deploy</li><li>Max program size: <strong>10 MB</strong></li></ul><h3>Upgrades</h3><pre><code># Upgrade an existing program
anchor upgrade --program-id &lt;PROGRAM_ID&gt; target/deploy/my_program.so

# Make immutable (irreversible!)
solana program set-upgrade-authority &lt;PROGRAM_ID&gt; --final</code></pre>`,
      xp: 30,
    },
    {
      title: "Generating Clients with Codama",
      description: "Auto-generate TypeScript, Rust, and other clients from program IDL",
      type: "content",
      content: `<h2>Generating Clients with Codama</h2><p><strong>Codama</strong> (formerly Kinobi) is a code generation framework that creates type-safe clients from Anchor IDLs or Shank metadata.</p><h3>How It Works</h3><ol><li>Build your program → generates IDL</li><li>Codama reads the IDL</li><li>Generates type-safe client code for multiple languages</li></ol><h3>Setup</h3><pre><code>npm install @codama/renderers-js @codama/nodes-from-anchor</code></pre><h3>Generate TypeScript Client</h3><pre><code>import { createFromIdls } from "@codama/nodes-from-anchor";
import { renderJavaScriptVisitor } from "@codama/renderers-js";

// Load IDL
const idl = require("./target/idl/my_program.json");

// Create Codama tree from IDL
const codama = createFromIdls([idl]);

// Render TypeScript client
codama.accept(renderJavaScriptVisitor("./generated/js"));</code></pre><h3>What Gets Generated</h3><ul><li><strong>Instruction builders</strong> — type-safe functions for each instruction</li><li><strong>Account types</strong> — deserializers for all program accounts</li><li><strong>PDA helpers</strong> — derivation functions for all PDAs</li><li><strong>Error types</strong> — typed error codes</li></ul>`,
      xp: 30,
    },
    {
      title: "Verifying Programs",
      description: "Verified builds to prove on-chain code matches published source",
      type: "content",
      content: `<h2>Verifying Programs</h2><p><strong>Verified builds</strong> let anyone confirm that the on-chain bytecode matches the published source code. This builds trust in deployed programs.</p><h3>Build Verifiably</h3><pre><code># Build with Docker for reproducibility
anchor build --verifiable</code></pre><p>This uses a Docker container with a fixed Solana/Anchor version to produce a deterministic build.</p><h3>Verify a Deployed Program</h3><pre><code># Verify on-chain matches local build
anchor verify &lt;PROGRAM_ID&gt;</code></pre><h3>Publish to Anchor Registry</h3><pre><code># Publish your verified build
anchor publish &lt;PROGRAM_NAME&gt;</code></pre><h3>Solana Verify CLI</h3><pre><code># Install
cargo install solana-verify

# Verify a program
solana-verify verify-from-repo \\
  --program-id &lt;PROGRAM_ID&gt; \\
  https://github.com/user/repo</code></pre><h3>Why It Matters</h3><ul><li>Users can trust the program does what the source says</li><li>Auditors can verify the exact code that was audited is deployed</li><li>Explorers can show a "verified" badge</li></ul>`,
      xp: 30,
    },
    {
      title: "Program Examples & Limitations",
      description: "Common patterns, program examples, and known limitations",
      type: "content",
      content: `<h2>Program Examples & Limitations</h2><h3>Common Patterns</h3><ul><li><strong>Counter</strong> — simple state management with init/increment</li><li><strong>Vault</strong> — PDA-controlled token account for escrow</li><li><strong>Marketplace</strong> — list/buy/cancel pattern</li><li><strong>Staking</strong> — deposit tokens, track time, calculate rewards</li></ul><h3>Official Examples</h3><p>The Solana Program Examples repo contains reference implementations:</p><pre><code># Clone examples
git clone https://github.com/solana-developers/program-examples
cd program-examples

# Categories:
# basics/ — accounts, PDAs, rent, cross-program-invocation
# tokens/ — token operations, mint, transfer
# compression/ — state compression
# oracles/ — price feeds</code></pre><h3>Program Limitations</h3><ul><li><strong>Stack size: 4 KB</strong> — use heap allocation for large data</li><li><strong>Call depth: 64</strong> — nested function call limit</li><li><strong>CPI depth: 4</strong> — max nesting of cross-program calls</li><li><strong>Compute budget: 200K CU per instruction</strong> (1.4M per tx)</li><li><strong>Account size: 10 MB</strong> — max data per account</li><li><strong>Transaction size: 1232 bytes</strong> — limits accounts per tx</li><li><strong>No floating point</strong> — use fixed-point math</li><li><strong>No threads</strong> — single-threaded execution</li></ul>`,
      xp: 30,
    },
  ],
};
