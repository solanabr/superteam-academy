/**
 * Push the "Setting Up Your Solana Dev Environment" course to Sanity CMS.
 * Real production content based on https://solana.com/docs/intro/installation
 *
 * Run: cd app && npx tsx ../scripts/push-install-course.ts
 */

import * as dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(__dirname, "../app/.env.local") });

const SANITY_PROJECT_ID = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!;
const SANITY_DATASET = process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production";
const SANITY_TOKEN = process.env.SANITY_API_TOKEN!;

const courseId = "solana-dev-setup";

const course = {
  _id: `course-${courseId}`,
  _type: "course",
  courseId,
  title: "Setting Up Your Solana Dev Environment",
  slug: { _type: "slug", current: "solana-dev-setup" },
  description:
    "Step-by-step guide to install Rust, the Solana CLI, Anchor Framework, and Node.js on Windows (WSL), Linux, and Mac. Your first step into Solana development.",
  difficulty: 1,
  lessonCount: 5,
  xpPerLesson: 25,
  trackId: 1,
  trackLevel: 0,
  isActive: true,
  prerequisite: null,
  totalCompletions: 0,
  creatorRewardXp: 125,
  duration: "45 min",
  creator: "Superteam Academy",
  whatYouLearn: [
    "Install and configure Rust for Solana development",
    "Set up the Solana CLI and connect to devnet",
    "Install the Anchor framework for program development",
    "Configure Node.js and Yarn for testing",
    "Verify your complete development environment",
  ],
  modules: [
    {
      _key: "mod-setup-1",
      title: "Environment Setup",
      description:
        "Install all the tools you need to build on Solana — from Rust to Anchor.",
      order: 0,
      lessons: [
        // ─── Lesson 0: Prerequisites ───
        {
          _key: "lesson-prereqs",
          title: "Prerequisites & System Requirements",
          description:
            "What you need before installing the Solana toolchain.",
          order: 0,
          type: "content",
          xp: 25,
          duration: "5 min",
          htmlContent: `
<h2>Before You Start</h2>
<p>Before installing the Solana development tools, make sure your system meets these requirements:</p>

<h3>System Requirements</h3>
<ul>
  <li><strong>OS:</strong> macOS, Linux, or Windows (via WSL2)</li>
  <li><strong>RAM:</strong> 8 GB minimum (16 GB recommended)</li>
  <li><strong>Disk:</strong> At least 10 GB free space</li>
  <li><strong>Internet:</strong> Required for installation and connecting to clusters</li>
</ul>

<h3>🪟 Windows Users: Install WSL2 First</h3>
<p>Solana development tools run natively on Unix-based systems. If you're on Windows, you'll need Windows Subsystem for Linux (WSL2).</p>
<p>Open <strong>PowerShell as Administrator</strong> and run:</p>
<pre><code>wsl --install</code></pre>
<p>This installs Ubuntu by default. After installation:</p>
<ol>
  <li>Restart your computer</li>
  <li>Open Ubuntu from the Start menu</li>
  <li>Create a Unix username and password</li>
  <li>Run <code>sudo apt update && sudo apt upgrade -y</code></li>
</ol>
<p>From here on, <strong>all commands should be run inside your WSL terminal</strong>, not PowerShell.</p>

<h3>🐧 Linux Users</h3>
<p>You may need to install some build dependencies first:</p>
<pre><code>sudo apt update && sudo apt install -y build-essential pkg-config libssl-dev libudev-dev</code></pre>

<h3>🍎 Mac Users</h3>
<p>Install Xcode Command Line Tools if you haven't already:</p>
<pre><code>xcode-select --install</code></pre>
<p>If you use Homebrew, make sure it's up to date:</p>
<pre><code>brew update</code></pre>

<h3>What We'll Install</h3>
<p>By the end of this course, you'll have the following tools ready:</p>
<table>
  <thead>
    <tr><th>Tool</th><th>Purpose</th></tr>
  </thead>
  <tbody>
    <tr><td><strong>Rust</strong></td><td>Programming language for Solana programs</td></tr>
    <tr><td><strong>Solana CLI</strong></td><td>Deploy, manage wallets, interact with clusters</td></tr>
    <tr><td><strong>Anchor</strong></td><td>Framework that simplifies Solana program development</td></tr>
    <tr><td><strong>Node.js + Yarn</strong></td><td>Run tests and build frontend clients</td></tr>
  </tbody>
</table>
<p>Let's get started! 🚀</p>
`,
        },
        // ─── Lesson 1: Install Rust ───
        {
          _key: "lesson-rust",
          title: "Installing Rust",
          description:
            "Install Rust using rustup — the foundation for Solana programs.",
          order: 1,
          type: "content",
          xp: 25,
          duration: "8 min",
          htmlContent: `
<h2>Why Rust?</h2>
<p>Solana programs (smart contracts) are written in <strong>Rust</strong>. Rust provides the performance and safety guarantees needed for on-chain code that handles real value.</p>

<h3>Step 1: Install Rust via rustup</h3>
<p>Run this command in your terminal (Mac, Linux, or WSL):</p>
<pre><code>curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y</code></pre>
<p>This installs:</p>
<ul>
  <li><strong>rustc</strong> — the Rust compiler</li>
  <li><strong>cargo</strong> — the Rust package manager and build tool</li>
  <li><strong>rustup</strong> — the Rust toolchain manager</li>
</ul>

<h3>Step 2: Load Rust into your PATH</h3>
<p>After installation, load the Rust environment in your current shell:</p>
<pre><code>. "$HOME/.cargo/env"</code></pre>
<p>This makes the <code>rustc</code> and <code>cargo</code> commands available immediately without restarting your terminal.</p>

<h3>Step 3: Verify the installation</h3>
<pre><code>rustc --version</code></pre>
<p>You should see output like:</p>
<pre><code>rustc 1.86.0 (05f9846f8 2025-03-31)</code></pre>

<h3>Step 4: Make it permanent</h3>
<p>To ensure Rust is available every time you open a new terminal, add it to your shell profile:</p>

<p><strong>If you use Bash:</strong></p>
<pre><code>echo 'source "$HOME/.cargo/env"' >> ~/.bashrc
source ~/.bashrc</code></pre>

<p><strong>If you use Zsh (default on Mac):</strong></p>
<pre><code>echo 'source "$HOME/.cargo/env"' >> ~/.zshrc
source ~/.zshrc</code></pre>

<p>Not sure which shell you use? Run <code>echo $SHELL</code> to check.</p>

<div style="background: #1a1a2e; border-left: 4px solid #14F195; padding: 16px; border-radius: 8px; margin: 20px 0;">
  <strong>💡 Tip:</strong> You can update Rust any time with <code>rustup update</code>. Solana programs work with stable Rust — no need for nightly builds.
</div>
`,
        },
        // ─── Lesson 2: Install Solana CLI ───
        {
          _key: "lesson-solana-cli",
          title: "Installing the Solana CLI",
          description:
            "Install the Solana CLI to deploy programs and manage wallets.",
          order: 2,
          type: "content",
          xp: 25,
          duration: "10 min",
          htmlContent: `
<h2>The Solana CLI</h2>
<p>The Solana Command Line Interface (CLI) is your main tool for interacting with the Solana blockchain. With it you can:</p>
<ul>
  <li>Create and manage wallets (keypairs)</li>
  <li>Deploy programs to devnet, testnet, or mainnet</li>
  <li>Send transactions and check balances</li>
  <li>Run a local test validator</li>
</ul>

<h3>Step 1: Install the Solana CLI</h3>
<pre><code>sh -c "$(curl -sSfL https://release.anza.xyz/stable/install)"</code></pre>

<h3>Step 2: Add to your PATH</h3>
<p>The installer will show you a command to add to your PATH. It looks like this:</p>
<pre><code>export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"</code></pre>

<p>Add it permanently to your shell profile:</p>

<p><strong>Bash (Linux/WSL):</strong></p>
<pre><code>echo 'export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc</code></pre>

<p><strong>Zsh (Mac):</strong></p>
<pre><code>echo 'export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc</code></pre>

<h3>Step 3: Verify installation</h3>
<pre><code>solana --version</code></pre>
<p>Expected output:</p>
<pre><code>solana-cli 2.2.12 (src:0315eb6a; feat:1522022101, client:Agave)</code></pre>

<h3>Step 4: Configure for Devnet</h3>
<p>By default, the CLI points to mainnet. For development, switch to devnet:</p>
<pre><code>solana config set --url devnet</code></pre>

<h3>Step 5: Create a dev wallet</h3>
<p>Generate a keypair for development:</p>
<pre><code>solana-keygen new --no-bip39-passphrase</code></pre>
<p>This creates a keypair at <code>~/.config/solana/id.json</code>. <strong>Never use this for real funds.</strong></p>

<h3>Step 6: Get devnet SOL</h3>
<p>Airdrop some devnet SOL for testing:</p>
<pre><code>solana airdrop 2</code></pre>
<p>Check your balance:</p>
<pre><code>solana balance</code></pre>

<div style="background: #1a1a2e; border-left: 4px solid #9945FF; padding: 16px; border-radius: 8px; margin: 20px 0;">
  <strong>📌 Important:</strong> You can update the Solana CLI anytime with <code>agave-install update</code>. The validator client is maintained by <a href="https://www.anza.xyz/" target="_blank">Anza</a> (formerly Solana Labs).
</div>
`,
        },
        // ─── Lesson 3: Install Anchor + Node.js ───
        {
          _key: "lesson-anchor",
          title: "Installing Anchor & Node.js",
          description:
            "Set up the Anchor framework and Node.js for testing.",
          order: 3,
          type: "content",
          xp: 25,
          duration: "12 min",
          htmlContent: `
<h2>Anchor Framework</h2>
<p><a href="https://www.anchor-lang.com/" target="_blank">Anchor</a> is a framework that dramatically simplifies Solana program development. It provides:</p>
<ul>
  <li><strong>Account validation macros</strong> — automatically checks accounts are valid</li>
  <li><strong>IDL generation</strong> — creates a JSON interface definition for your program</li>
  <li><strong>Testing tools</strong> — TypeScript test framework out of the box</li>
  <li><strong>CLI</strong> — scaffold, build, test, and deploy in one tool</li>
</ul>

<h3>Install Node.js First</h3>
<p>Anchor's test suite uses Node.js and Yarn. Install Node.js via NVM (Node Version Manager):</p>
<pre><code>curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/master/install.sh | bash</code></pre>
<p>Close and reopen your terminal (or run <code>source ~/.bashrc</code> / <code>source ~/.zshrc</code>), then:</p>
<pre><code>nvm install node
nvm use node</code></pre>
<p>Verify:</p>
<pre><code>node --version</code></pre>

<h3>Install Yarn</h3>
<pre><code>npm install -g yarn</code></pre>
<p>Verify:</p>
<pre><code>yarn --version</code></pre>

<h3>Install Anchor via AVM</h3>
<p>AVM (Anchor Version Manager) lets you install and switch between Anchor versions — similar to NVM for Node.js.</p>

<p><strong>Step 1:</strong> Install AVM:</p>
<pre><code>cargo install --git https://github.com/solana-foundation/anchor avm --force</code></pre>
<p>This will take a few minutes to compile.</p>

<p><strong>Step 2:</strong> Install the latest Anchor version:</p>
<pre><code>avm install latest
avm use latest</code></pre>

<p><strong>Step 3:</strong> Verify:</p>
<pre><code>anchor --version</code></pre>
<p>Expected output:</p>
<pre><code>anchor-cli 0.31.1</code></pre>

<div style="background: #1a1a2e; border-left: 4px solid #F59E0B; padding: 16px; border-radius: 8px; margin: 20px 0;">
  <strong>⚠️ Linux/WSL users:</strong> If you see <code>error: could not exec the linker cc</code>, run:
  <pre><code>sudo apt install -y build-essential pkg-config libssl-dev libudev-dev</code></pre>
  Then retry the Anchor installation.
</div>

<h3>Create Your First Anchor Project (Optional)</h3>
<p>Test that everything works by creating a new project:</p>
<pre><code>anchor init my-first-program
cd my-first-program
anchor build</code></pre>
<p>If the build succeeds, your environment is ready! 🎉</p>
`,
        },
        // ─── Lesson 4: Final Quiz ───
        {
          _key: "lesson-quiz",
          title: "Knowledge Check: Environment Setup",
          description:
            "Test your knowledge on Solana development environment setup.",
          order: 4,
          type: "quiz",
          xp: 25,
          duration: "5 min",
          htmlContent: `
<h2>Final Knowledge Check</h2>
<p>You've learned how to set up a complete Solana development environment. Let's make sure you've got the key concepts down before moving forward.</p>
<p>Answer all questions below. You need <strong>80%</strong> to pass and earn your XP.</p>
`,
          quiz: {
            passingScore: 80,
            questions: [
              {
                _key: "q1",
                question:
                  "What programming language is used to write Solana programs (smart contracts)?",
                options: ["JavaScript", "Python", "Rust", "Solidity"],
                correctIndex: 2,
                explanation:
                  "Solana programs are written in Rust. The language provides the performance and safety guarantees needed for on-chain code.",
              },
              {
                _key: "q2",
                question:
                  "Which tool do you use to install Rust?",
                options: ["npm", "brew", "rustup", "cargo"],
                correctIndex: 2,
                explanation:
                  "rustup is the official Rust toolchain installer and manager. It installs rustc (compiler), cargo (package manager), and rustup itself.",
              },
              {
                _key: "q3",
                question:
                  "What command sets the Solana CLI to use devnet?",
                options: [
                  "solana cluster devnet",
                  "solana config set --url devnet",
                  "solana use devnet",
                  "solana switch devnet",
                ],
                correctIndex: 1,
                explanation:
                  'The correct command is "solana config set --url devnet". This configures all subsequent CLI commands to use the devnet cluster.',
              },
              {
                _key: "q4",
                question:
                  "What does AVM stand for in the context of Anchor?",
                options: [
                  "Automated Virtual Machine",
                  "Anchor Version Manager",
                  "Account Validation Module",
                  "Anchor Virtual Machine",
                ],
                correctIndex: 1,
                explanation:
                  "AVM is the Anchor Version Manager. It lets you install, switch between, and manage different Anchor CLI versions.",
              },
              {
                _key: "q5",
                question:
                  "On Windows, what must you install before setting up Solana tools?",
                options: [
                  "Docker Desktop",
                  "Visual Studio",
                  "Windows Subsystem for Linux (WSL2)",
                  "Git Bash",
                ],
                correctIndex: 2,
                explanation:
                  "Solana development tools run natively on Unix-based systems. Windows users need WSL2, which provides a Linux environment within Windows.",
              },
            ],
          },
        },
      ],
    },
  ],
};

async function pushCourse() {
  const url = `https://${SANITY_PROJECT_ID}.api.sanity.io/v2024-01-01/data/mutate/${SANITY_DATASET}`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SANITY_TOKEN}`,
    },
    body: JSON.stringify({
      mutations: [{ createOrReplace: course }],
    }),
  });

  const data: any = await res.json();
  if (data.error) {
    console.error("Error:", data);
    process.exit(1);
  }
  console.log("✅ Course pushed:", data.transactionId);
  console.log(`   ${course.title} (${course.lessonCount} lessons)`);
}

pushCourse().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
