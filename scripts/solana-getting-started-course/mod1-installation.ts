import { CourseModule } from "../anchor-course/types";

export const MODULE_INSTALLATION: CourseModule = {
  title: "Installation",
  description:
    "Set up your local Solana development environment with Rust, Solana CLI, and Anchor Framework",
  lessons: [
    {
      title: "Quick Installation",
      description:
        "One-command installation of Solana development tools using Solana Install",
      type: "content",
      content: `<h2>Quick Installation</h2><p>The fastest way to start developing on Solana is the <strong>Solana Install</strong> tool, which installs the Solana CLI, Rust, and Anchor in a single command.</p><pre><code>npx solana install</code></pre><p>This handles all dependencies automatically. If you prefer manual control, check the next lessons for step-by-step setup.</p><h3>Prerequisites</h3><ul><li><strong>Node.js</strong> — v18+ recommended</li><li><strong>Windows users</strong> — must use WSL (Windows Subsystem for Linux)</li></ul><h3>After Installation</h3><pre><code># Check Solana CLI
solana --version

# Check Anchor
anchor --version

# Check Rust
rustc --version</code></pre>`,
      xp: 30,
    },
    {
      title: "Install Dependencies",
      description:
        "Step-by-step guide for installing Rust, Solana CLI, and Anchor on all platforms",
      type: "content",
      content: `<h2>Install Dependencies</h2><h3>1. Install Rust</h3><p>Rust is the primary language for Solana programs.</p><pre><code>curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
source ~/.bashrc</code></pre><h3>2. Install Solana CLI</h3><pre><code>sh -c "$(curl -sSfL https://release.anza.xyz/stable/install)"
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"</code></pre><p>Verify with <code>solana --version</code>.</p><h3>3. Install Anchor CLI</h3><p>Anchor is the standard framework for Solana program development.</p><pre><code># Install avm (Anchor Version Manager)
cargo install --git https://github.com/coral-xyz/anchor avm --force

# Install latest Anchor
avm install latest
avm use latest</code></pre><h3>Platform Notes</h3><ul><li><strong>Windows</strong> — must use WSL (Ubuntu recommended)</li><li><strong>macOS</strong> — install Xcode command line tools first: <code>xcode-select --install</code></li><li><strong>Linux</strong> — install build essentials: <code>sudo apt install build-essential pkg-config libudev-dev llvm libclang-dev</code></li></ul>`,
      xp: 30,
    },
    {
      title: "Solana CLI Basics",
      description:
        "Essential Solana CLI commands: wallets, airdrops, config, and cluster management",
      type: "content",
      content: `<h2>Solana CLI Basics</h2><h3>Configure CLI</h3><pre><code># Set cluster to devnet
solana config set --url devnet

# Check current config
solana config get</code></pre><h3>Create a Wallet</h3><pre><code># Generate a new keypair
solana-keygen new --outfile ~/.config/solana/id.json

# View your public key
solana address</code></pre><h3>Get Devnet SOL</h3><pre><code># Request airdrop
solana airdrop 2

# Check balance
solana balance</code></pre><h3>Useful Commands</h3><ul><li><code>solana transfer &lt;RECIPIENT&gt; &lt;AMOUNT&gt;</code> — send SOL</li><li><code>solana account &lt;ADDRESS&gt;</code> — inspect any account</li><li><code>solana program show &lt;PROGRAM_ID&gt;</code> — view deployed program</li><li><code>solana logs</code> — stream program logs in real-time</li><li><code>solana-keygen pubkey</code> — show public key from default keypair</li></ul>`,
      xp: 30,
    },
    {
      title: "Anchor CLI Basics",
      description:
        "Essential Anchor commands for building, testing, and deploying programs",
      type: "content",
      content: `<h2>Anchor CLI Basics</h2><h3>Create a New Project</h3><pre><code>anchor init my-project
cd my-project</code></pre><p>This generates the standard Anchor project structure with <code>programs/</code>, <code>tests/</code>, <code>app/</code>, and config files.</p><h3>Core Commands</h3><pre><code># Build the program
anchor build

# Run tests (starts local validator automatically)
anchor test

# Deploy to configured cluster
anchor deploy

# Build, deploy, and test in one command
anchor test --skip-local-validator</code></pre><h3>Key Files</h3><ul><li><code>Anchor.toml</code> — project configuration (cluster, program IDs, test command)</li><li><code>programs/&lt;name&gt;/src/lib.rs</code> — program entry point</li><li><code>target/idl/&lt;name&gt;.json</code> — generated IDL (Interface Definition Language)</li><li><code>target/types/&lt;name&gt;.ts</code> — generated TypeScript types</li></ul><h3>Version Management</h3><pre><code># List installed versions
avm list

# Install specific version
avm install 0.31.0

# Switch version
avm use 0.31.0</code></pre>`,
      xp: 30,
    },
    {
      title: "Surfpool CLI Basics",
      description:
        "Alternative local development with Surfpool — simulated Solana environment",
      type: "content",
      content: `<h2>Surfpool CLI Basics</h2><p><strong>Surfpool</strong> is an alternative to <code>solana-test-validator</code> that provides a simulated Solana environment with real mainnet data via RPC proxying.</p><h3>Installation</h3><pre><code># macOS / Linux
brew install txtx/tap/surfpool

# Or from source
cargo install surfpool</code></pre><h3>Usage</h3><pre><code># Start the Surfpool validator
surfpool start

# The simulated validator runs at http://localhost:8899
# It proxies requests to mainnet for accounts not in local state</code></pre><h3>Key Features</h3><ul><li><strong>Mainnet data</strong> — access real mainnet accounts without copying them manually</li><li><strong>Fast startup</strong> — no ledger to bootstrap</li><li><strong>Auto-airdrop</strong> — automatically funds test wallets</li><li><strong>Program deployment</strong> — deploy programs just like on a real validator</li></ul><p>Surfpool is useful when your program needs to interact with existing mainnet programs or accounts during development.</p>`,
      xp: 30,
    },
  ],
};
