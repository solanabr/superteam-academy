import { CourseModule } from "./types";

export const MODULE_GETTING_STARTED: CourseModule = {
  title: "Getting Started",
  description:
    "Install the Anchor framework, set up your development environment, and build your first Solana program using both Solana Playground and local development.",
  lessons: [
    // ─── Lesson 1: Installation ─────────────────────────
    {
      title: "Installation",
      description:
        "Install Rust, the Solana CLI, and Anchor CLI on your system. Configure your local development environment.",
      type: "content",
      duration: "20 min",
      content: `
<h2>Installation</h2>
<p>Anchor is a development framework for building secure Solana programs (smart contracts). Before using Anchor, you need to install Rust, the Solana CLI, and the Anchor CLI.</p>

<h3>Quick Installation</h3>
<p>On Mac and Linux, run this single command to install all dependencies:</p>
<pre><code class="language-bash">curl --proto '=https' --tlsv1.2 -sSfL https://solana-install.solana.workers.dev | bash</code></pre>
<p><strong>Windows Users:</strong> You must first install WSL (Windows Subsystem for Linux), then run the command above in the Ubuntu terminal.</p>
<p>After installation, you should see output similar to:</p>
<pre><code>Installed Versions:
Rust: rustc 1.85.0
Solana CLI: solana-cli 2.1.15
Anchor CLI: anchor-cli 0.32.1
Node.js: v23.9.0
Yarn: 1.22.1</code></pre>

<h3>Install Dependencies Individually</h3>
<p>If the quick install doesn't work, install each dependency separately:</p>

<h4>1. Install Rust</h4>
<pre><code class="language-bash">curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
. "$HOME/.cargo/env"
rustc --version</code></pre>

<h4>2. Install the Solana CLI</h4>
<pre><code class="language-bash">sh -c "$(curl -sSfL https://release.anza.xyz/stable/install)"
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
solana --version</code></pre>

<h4>3. Install the Anchor CLI</h4>
<p>Install using AVM (Anchor Version Manager) — the recommended method:</p>
<pre><code class="language-bash">cargo install --git https://github.com/coral-xyz/anchor avm --force
avm --version
avm install latest
avm use latest
anchor --version</code></pre>

<h4>4. Node.js and Yarn</h4>
<p>Required for running the default TypeScript test files:</p>
<pre><code class="language-bash"># Install Node.js (via nvm recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/master/install.sh | bash
nvm install node

# Install Yarn
npm install -g yarn</code></pre>

<h3>Verify Installation</h3>
<p>Run these commands to confirm everything is installed:</p>
<pre><code class="language-bash">rustc --version
solana --version
anchor --version
node --version
yarn --version</code></pre>
<p>Reference: <a href="https://www.anchor-lang.com/docs/installation" target="_blank">Anchor Installation Docs</a></p>
`,
    },
    // ─── Lesson 2: Solana CLI Basics ────────────────────
    {
      title: "Solana CLI Basics",
      description:
        "Configure the Solana CLI, create a wallet, airdrop SOL, and run a local validator.",
      type: "content",
      duration: "15 min",
      content: `
<h2>Solana CLI Basics</h2>

<h3>Solana Config</h3>
<p>View your current configuration:</p>
<pre><code class="language-bash">solana config get</code></pre>
<p>Output shows your RPC URL, WebSocket URL, Keypair Path, and Commitment level.</p>

<p>Update the cluster (network) you're connecting to:</p>
<pre><code class="language-bash">solana config set -ud    # devnet
solana config set -ul    # localhost
solana config set -um    # mainnet-beta
solana config set -ut    # testnet</code></pre>

<h3>Create Wallet</h3>
<p>Generate a keypair at the default location:</p>
<pre><code class="language-bash">solana-keygen new</code></pre>
<p>This creates a keypair at <code>~/.config/solana/id.json</code>. Check your wallet address:</p>
<pre><code class="language-bash">solana address</code></pre>

<h3>Airdrop SOL</h3>
<p>Set your cluster to devnet and request an airdrop:</p>
<pre><code class="language-bash">solana config set -ud
solana airdrop 2
solana balance</code></pre>
<p>The airdrop command is limited to 5 SOL per request on devnet. You can also use the <a href="https://faucet.solana.com/" target="_blank">Web Faucet</a>.</p>

<h3>Run Local Validator</h3>
<p>Start a local Solana validator for development:</p>
<pre><code class="language-bash"># In a separate terminal:
solana-test-validator

# Then configure CLI to use localhost:
solana config set -ul</code></pre>
<p>Reference: <a href="https://www.anchor-lang.com/docs/installation#solana-cli-basics" target="_blank">Solana CLI Basics</a></p>
`,
    },
    // ─── Lesson 3: Quickstart — Solana Playground ───────
    {
      title: "Quickstart — Solana Playground",
      description:
        "Build, deploy, and test your first Anchor program directly in the browser using Solana Playground.",
      type: "content",
      duration: "20 min",
      content: `
<h2>Quickstart — Solana Playground</h2>
<p><a href="https://beta.solpg.io/" target="_blank">Solana Playground (Solpg)</a> is a browser-based IDE that lets you write, deploy, and test Solana programs with zero local setup.</p>

<h3>1. Create Playground Wallet</h3>
<p>Open <a href="https://beta.solpg.io/" target="_blank">beta.solpg.io</a> and click "Not connected" at the bottom left. Save your wallet keypair and click "Continue".</p>

<h3>2. Get Devnet SOL</h3>
<pre><code class="language-bash">solana airdrop 5</code></pre>
<p>Or use the <a href="https://faucet.solana.com/" target="_blank">Web Faucet</a>.</p>

<h3>3. Create Anchor Project</h3>
<p>Click "Create a new project", name it, select <strong>Anchor</strong> as the framework. You'll see this starter code in <code>src/lib.rs</code>:</p>
<pre><code class="language-rust">use anchor_lang::prelude::*;

declare_id!("11111111111111111111111111111111");

#[program]
mod hello_anchor {
    use super::*;
    pub fn initialize(ctx: Context&lt;Initialize&gt;, data: u64) -&gt; Result&lt;()&gt; {
        ctx.accounts.new_account.data = data;
        msg!("Changed data to: {}!", data);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize&lt;'info&gt; {
    #[account(init, payer = signer, space = 8 + 8)]
    pub new_account: Account&lt;'info, NewAccount&gt;,
    #[account(mut)]
    pub signer: Signer&lt;'info&gt;,
    pub system_program: Program&lt;'info, System&gt;,
}

#[account]
pub struct NewAccount {
    data: u64,
}</code></pre>

<h3>4. Build and Deploy</h3>
<pre><code class="language-bash">build
deploy</code></pre>
<p>The <code>declare_id!()</code> address updates automatically after build.</p>

<h3>5. Test</h3>
<p>The test file at <code>tests/anchor.test.ts</code> invokes the <code>initialize</code> instruction:</p>
<pre><code class="language-typescript">describe("Test", () =&gt; {
  it("initialize", async () =&gt; {
    const newAccountKp = new web3.Keypair();
    const data = new BN(42);
    const txHash = await pg.program.methods
      .initialize(data)
      .accounts({
        newAccount: newAccountKp.publicKey,
        signer: pg.wallet.publicKey,
        systemProgram: web3.SystemProgram.programId,
      })
      .signers([newAccountKp])
      .rpc();

    await pg.connection.confirmTransaction(txHash);
    const newAccount = await pg.program.account.newAccount.fetch(
      newAccountKp.publicKey
    );
    assert(data.eq(newAccount.data));
  });
});</code></pre>
<p>Run <code>test</code> in the terminal. View transaction details with <code>solana confirm -v [TxHash]</code>.</p>

<h3>6. Close Program</h3>
<p>Reclaim SOL by closing the program:</p>
<pre><code class="language-bash">solana program close [ProgramID]</code></pre>
<p>Reference: <a href="https://www.anchor-lang.com/docs/quickstart/solpg" target="_blank">Solana Playground Quickstart</a></p>
`,
    },
    // ─── Lesson 4: Quickstart — Local Development ───────
    {
      title: "Quickstart — Local Development",
      description:
        "Create, build, test, and deploy an Anchor project on your local machine. Understand the project file structure.",
      type: "content",
      duration: "20 min",
      content: `
<h2>Quickstart — Local Development</h2>

<h3>Create a New Project</h3>
<pre><code class="language-bash">anchor init my-project
cd my-project</code></pre>
<p>Anchor generates a modular program structure:</p>
<ul>
  <li><code>/programs/my-project/src/lib.rs</code> — Main entry point with module declarations</li>
  <li><code>/programs/my-project/src/instructions/</code> — Instruction handlers</li>
  <li><code>/programs/my-project/src/state/</code> — Account structures and state</li>
  <li><code>/programs/my-project/src/constants.rs</code> — Program constants</li>
  <li><code>/programs/my-project/src/error.rs</code> — Custom error definitions</li>
</ul>
<p>You can also initialize with Rust test template: <code>anchor init --test-template rust my-program</code></p>

<h3>Build the Program</h3>
<pre><code class="language-bash">anchor build</code></pre>
<p>The compiled binary is at <code>/target/deploy/my_project.so</code>.</p>

<h3>Test the Program</h3>
<pre><code class="language-bash">anchor test</code></pre>
<p>With <code>localnet</code> in <code>Anchor.toml</code>, this automatically: starts a local validator → builds → deploys → runs tests → stops validator.</p>
<p>For manual control, run the validator separately:</p>
<pre><code class="language-bash"># Terminal 1:
solana-test-validator

# Terminal 2:
anchor test --skip-local-validator</code></pre>

<h3>Deploy to Devnet</h3>
<p>Update <code>Anchor.toml</code>:</p>
<pre><code class="language-toml">[provider]
cluster = "Devnet"
wallet = "~/.config/solana/id.json"</code></pre>
<pre><code class="language-bash">anchor deploy</code></pre>

<h3>Update & Redeploy</h3>
<p>Solana programs can be updated by redeploying to the same program ID:</p>
<pre><code class="language-bash">anchor build
anchor deploy</code></pre>

<h3>Close the Program</h3>
<pre><code class="language-bash">solana program close &lt;PROGRAM_ID&gt; --bypass-warning</code></pre>
<p>Once closed, the program ID cannot be reused.</p>

<h3>Project File Structure</h3>
<table>
  <thead><tr><th>Path</th><th>Purpose</th></tr></thead>
  <tbody>
    <tr><td><code>/programs/</code></td><td>Anchor programs (workspace can have multiple)</td></tr>
    <tr><td><code>/tests/</code></td><td>Test files (TypeScript or Rust)</td></tr>
    <tr><td><code>/target/deploy/</code></td><td>Compiled .so binary and keypair</td></tr>
    <tr><td><code>/target/idl/</code></td><td>JSON IDL file</td></tr>
    <tr><td><code>/target/types/</code></td><td>TypeScript type for IDL</td></tr>
    <tr><td><code>Anchor.toml</code></td><td>Workspace configuration</td></tr>
  </tbody>
</table>
<p>Reference: <a href="https://www.anchor-lang.com/docs/quickstart/local" target="_blank">Local Development Quickstart</a></p>
`,
    },
    // ─── Lesson 5: Quiz — Getting Started ───────────────
    {
      title: "Getting Started Quiz",
      description: "Test your understanding of Anchor setup and project basics.",
      type: "quiz",
      duration: "10 min",
      quiz: {
        passingScore: 70,
        questions: [
          {
            question: "What is the recommended way to install the Anchor CLI?",
            options: [
              "npm install -g @coral-xyz/anchor",
              "cargo install anchor-cli",
              "Using AVM (Anchor Version Manager)",
              "Download binary from GitHub releases",
            ],
            correctIndex: 2,
            explanation:
              "AVM allows you to install and manage different Anchor versions. Install with: cargo install --git https://github.com/coral-xyz/anchor avm --force",
          },
          {
            question:
              "Which command creates a new Anchor project with a modular file structure?",
            options: [
              "anchor new my-project",
              "anchor init my-project",
              "anchor create my-project",
              "cargo init --anchor my-project",
            ],
            correctIndex: 1,
            explanation:
              "anchor init creates a new directory with modular program structure, tests, and configuration files.",
          },
          {
            question:
              "What does 'anchor test' do when cluster is set to localnet?",
            options: [
              "Only runs the tests",
              "Deploys to devnet and runs tests",
              "Starts local validator, builds, deploys, runs tests, stops validator",
              "Builds the program without testing",
            ],
            correctIndex: 2,
            explanation:
              "With localnet cluster, anchor test automatically manages the full lifecycle: validator → build → deploy → test → cleanup.",
          },
          {
            question:
              "Where is the compiled program binary located after running anchor build?",
            options: [
              "/build/program.so",
              "/target/deploy/my_project.so",
              "/dist/program.wasm",
              "/out/program.bin",
            ],
            correctIndex: 1,
            explanation:
              "The compiled .so file is stored in /target/deploy/ directory.",
          },
        ],
      },
    },
  ],
};
