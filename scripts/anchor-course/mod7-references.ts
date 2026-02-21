import { CourseModule } from "./types";

export const MODULE_REFERENCES: CourseModule = {
  title: "References",
  description:
    "Complete reference for account types, constraints, Anchor.toml, CLI commands, space calculation, verifiable builds, and security.",
  lessons: [
    // ─── Lesson 1: Account Types ────────────────────────
    {
      title: "Account Types",
      description:
        "All Anchor account types: Account, Signer, SystemAccount, Program, Interface, UncheckedAccount, and more.",
      type: "content",
      duration: "20 min",
      content: `
<h2>Account Types</h2>
<p>Anchor provides specialized account types that enforce validation at deserialization time.</p>

<table>
  <thead><tr><th>Type</th><th>Description</th><th>Checks</th></tr></thead>
  <tbody>
    <tr><td><code>Account&lt;'info, T&gt;</code></td><td>Deserialized account owned by your program</td><td>Owner, discriminator</td></tr>
    <tr><td><code>Signer&lt;'info&gt;</code></td><td>Account that signed the transaction</td><td>Is signer</td></tr>
    <tr><td><code>SystemAccount&lt;'info&gt;</code></td><td>Account owned by System Program</td><td>Owner = System</td></tr>
    <tr><td><code>Program&lt;'info, T&gt;</code></td><td>A program account</td><td>Executable, key matches</td></tr>
    <tr><td><code>Interface&lt;'info, T&gt;</code></td><td>Program supporting an interface (e.g., TokenInterface)</td><td>Executable, interface match</td></tr>
    <tr><td><code>InterfaceAccount&lt;'info, T&gt;</code></td><td>Account from interface program (Token or Token-2022)</td><td>Owner matches interface</td></tr>
    <tr><td><code>AccountLoader&lt;'info, T&gt;</code></td><td>Zero-copy deserialized account</td><td>Owner, discriminator</td></tr>
    <tr><td><code>UncheckedAccount&lt;'info&gt;</code></td><td>No validation — use with <code>/// CHECK:</code> comment</td><td>None</td></tr>
    <tr><td><code>BoxedAccount&lt;'info, T&gt;</code></td><td>Heap-allocated Account for stack-heavy instructions</td><td>Same as Account</td></tr>
  </tbody>
</table>

<h3>UncheckedAccount Safety</h3>
<pre><code class="language-rust">#[derive(Accounts)]
pub struct Example&lt;'info&gt; {
    /// CHECK: This account is validated in the instruction handler
    pub unchecked: UncheckedAccount&lt;'info&gt;,
}</code></pre>
<p>Always document why an unchecked account is safe with <code>/// CHECK:</code>.</p>

<p>Reference: <a href="https://www.anchor-lang.com/docs/references/account-types" target="_blank">Account Types Docs</a></p>
`,
    },
    // ─── Lesson 2: Account Constraints ──────────────────
    {
      title: "Account Constraints",
      description:
        "Complete reference for all Anchor account constraints: init, mut, seeds, bump, has_one, constraint, close, and more.",
      type: "content",
      duration: "25 min",
      content: `
<h2>Account Constraints</h2>
<p>Constraints are applied via <code>#[account(...)]</code> attributes. They generate validation code at compile time.</p>

<h3>Common Constraints</h3>
<table>
  <thead><tr><th>Constraint</th><th>Description</th></tr></thead>
  <tbody>
    <tr><td><code>init</code></td><td>Create and initialize account (requires <code>payer</code> and <code>space</code>)</td></tr>
    <tr><td><code>init_if_needed</code></td><td>Only init if account doesn't exist (use carefully)</td></tr>
    <tr><td><code>mut</code></td><td>Account is mutable</td></tr>
    <tr><td><code>seeds = [...]</code></td><td>PDA seed derivation</td></tr>
    <tr><td><code>bump</code></td><td>PDA bump seed (auto-found or specified)</td></tr>
    <tr><td><code>payer = &lt;account&gt;</code></td><td>Account paying for initialization rent</td></tr>
    <tr><td><code>space = &lt;expr&gt;</code></td><td>Account data size in bytes</td></tr>
    <tr><td><code>has_one = &lt;field&gt;</code></td><td>Validates account.field matches another account key</td></tr>
    <tr><td><code>constraint = &lt;expr&gt;</code></td><td>Custom boolean validation</td></tr>
    <tr><td><code>close = &lt;account&gt;</code></td><td>Close account, transfer lamports to target</td></tr>
    <tr><td><code>realloc</code></td><td>Resize account data</td></tr>
    <tr><td><code>address = &lt;pubkey&gt;</code></td><td>Verify account has specific address</td></tr>
    <tr><td><code>owner = &lt;pubkey&gt;</code></td><td>Verify account owner</td></tr>
  </tbody>
</table>

<h3>Examples</h3>
<pre><code class="language-rust">#[derive(Accounts)]
pub struct UpdateConfig&lt;'info&gt; {
    // PDA with seed validation
    #[account(
        mut,
        seeds = [b"config"],
        bump = config.bump,
        has_one = authority,
    )]
    pub config: Account&lt;'info, Config&gt;,

    // Must be the authority stored in config
    pub authority: Signer&lt;'info&gt;,
}

#[derive(Accounts)]
pub struct CloseAccount&lt;'info&gt; {
    #[account(mut)]
    pub authority: Signer&lt;'info&gt;,

    #[account(
        mut,
        close = authority,
        has_one = authority,
    )]
    pub data_account: Account&lt;'info, DataAccount&gt;,
}

#[derive(Accounts)]
pub struct CustomConstraint&lt;'info&gt; {
    #[account(
        mut,
        constraint = clock.unix_timestamp > config.unlock_time @ MyError::TooEarly,
    )]
    pub config: Account&lt;'info, Config&gt;,
    pub clock: Sysvar&lt;'info, Clock&gt;,
}</code></pre>

<p>Reference: <a href="https://www.anchor-lang.com/docs/references/account-constraints" target="_blank">Account Constraints Docs</a></p>
`,
    },
    // ─── Lesson 3: Anchor.toml & CLI ────────────────────
    {
      title: "Anchor.toml & CLI Commands",
      description:
        "Configure your Anchor workspace with Anchor.toml and master essential CLI commands.",
      type: "content",
      duration: "15 min",
      content: `
<h2>Anchor.toml Configuration</h2>
<pre><code class="language-toml">[toolchain]

[features]
resolution = true
skip-lint = false

[programs.localnet]
my_program = "3ynNB373Q3VAzKp7m4x238po36hjAGFXFJB4ybN2iTyg"

[programs.devnet]
my_program = "3ynNB373Q3VAzKp7m4x238po36hjAGFXFJB4ybN2iTyg"

[registry]
url = "https://api.apr.dev"

[provider]
cluster = "Localnet"
wallet = "~/.config/solana/id.json"

[scripts]
test = "yarn run ts-mocha -p ./tsconfig.json -t 1000000 tests/**/*.ts"</code></pre>

<h3>Key Sections</h3>
<ul>
  <li><code>[programs.&lt;cluster&gt;]</code> — maps program names to IDs per cluster</li>
  <li><code>[provider]</code> — cluster and wallet for deployment</li>
  <li><code>[scripts]</code> — custom test/build scripts</li>
  <li><code>[toolchain]</code> — pin Anchor/Solana versions</li>
</ul>

<h2>Essential CLI Commands</h2>
<table>
  <thead><tr><th>Command</th><th>Description</th></tr></thead>
  <tbody>
    <tr><td><code>anchor init &lt;name&gt;</code></td><td>Create new project</td></tr>
    <tr><td><code>anchor build</code></td><td>Build all programs</td></tr>
    <tr><td><code>anchor test</code></td><td>Build, deploy, and test</td></tr>
    <tr><td><code>anchor deploy</code></td><td>Deploy to configured cluster</td></tr>
    <tr><td><code>anchor keys sync</code></td><td>Sync program IDs with keypairs</td></tr>
    <tr><td><code>anchor keys list</code></td><td>List all program keypairs</td></tr>
    <tr><td><code>anchor idl init</code></td><td>Initialize IDL on-chain</td></tr>
    <tr><td><code>anchor idl upgrade</code></td><td>Upgrade on-chain IDL</td></tr>
    <tr><td><code>anchor verify &lt;id&gt;</code></td><td>Verify deployed program matches source</td></tr>
    <tr><td><code>anchor expand</code></td><td>Expand macros to see generated code</td></tr>
  </tbody>
</table>

<h2>AVM Commands</h2>
<pre><code class="language-bash">avm list               # List installed versions
avm install latest     # Install latest Anchor
avm use latest         # Switch to latest version
avm install 0.32.1     # Install specific version
avm use 0.32.1         # Switch to specific version</code></pre>

<p>Reference: <a href="https://www.anchor-lang.com/docs/references/anchor-toml" target="_blank">Anchor.toml Docs</a>, <a href="https://www.anchor-lang.com/docs/references/cli" target="_blank">CLI Docs</a>, <a href="https://www.anchor-lang.com/docs/references/avm" target="_blank">AVM Docs</a></p>
`,
    },
    // ─── Lesson 4: Account Space & Type Conversion ──────
    {
      title: "Account Space & Type Conversion",
      description:
        "Calculate account space correctly and understand Rust-to-JavaScript type mappings.",
      type: "content",
      duration: "20 min",
      content: `
<h2>Account Space</h2>
<p>Every account needs its space declared at initialization. Remember: 8 bytes for discriminator + data fields.</p>

<h3>Type Sizes</h3>
<table>
  <thead><tr><th>Rust Type</th><th>Bytes</th><th>JS Type</th></tr></thead>
  <tbody>
    <tr><td><code>bool</code></td><td>1</td><td><code>boolean</code></td></tr>
    <tr><td><code>u8</code> / <code>i8</code></td><td>1</td><td><code>number</code></td></tr>
    <tr><td><code>u16</code> / <code>i16</code></td><td>2</td><td><code>number</code></td></tr>
    <tr><td><code>u32</code> / <code>i32</code></td><td>4</td><td><code>number</code></td></tr>
    <tr><td><code>u64</code> / <code>i64</code></td><td>8</td><td><code>BN</code></td></tr>
    <tr><td><code>u128</code> / <code>i128</code></td><td>16</td><td><code>BN</code></td></tr>
    <tr><td><code>f32</code></td><td>4</td><td><code>number</code></td></tr>
    <tr><td><code>f64</code></td><td>8</td><td><code>number</code></td></tr>
    <tr><td><code>Pubkey</code></td><td>32</td><td><code>PublicKey</code></td></tr>
    <tr><td><code>[u8; N]</code></td><td>N</td><td><code>number[]</code></td></tr>
    <tr><td><code>String</code></td><td>4 + len</td><td><code>string</code></td></tr>
    <tr><td><code>Vec&lt;T&gt;</code></td><td>4 + (count × sizeof(T))</td><td><code>T[]</code></td></tr>
    <tr><td><code>Option&lt;T&gt;</code></td><td>1 + sizeof(T)</td><td><code>T | null</code></td></tr>
    <tr><td><code>Enum</code></td><td>1 + largest variant</td><td><code>object</code></td></tr>
  </tbody>
</table>

<h3>INIT_SPACE Macro</h3>
<p>Use <code>#[derive(InitSpace)]</code> to auto-calculate space:</p>
<pre><code class="language-rust">#[account]
#[derive(InitSpace)]
pub struct Config {
    pub authority: Pubkey,     // 32
    pub counter: u64,          // 8
    pub is_active: bool,       // 1
    #[max_len(32)]
    pub name: String,          // 4 + 32 = 36
    pub bump: u8,              // 1
}
// Total: 8 (discriminator) + 32 + 8 + 1 + 36 + 1 = 86 bytes

#[derive(Accounts)]
pub struct Initialize&lt;'info&gt; {
    #[account(
        init,
        payer = authority,
        space = 8 + Config::INIT_SPACE,
    )]
    pub config: Account&lt;'info, Config&gt;,
    // ...
}</code></pre>

<p>Reference: <a href="https://www.anchor-lang.com/docs/references/space" target="_blank">Space Docs</a>, <a href="https://www.anchor-lang.com/docs/references/type-conversion" target="_blank">Type Conversion Docs</a></p>
`,
    },
    // ─── Lesson 5: Verifiable Builds ────────────────────
    {
      title: "Verifiable Builds",
      description:
        "Build and deploy verifiable programs so anyone can confirm your on-chain binary matches the source code.",
      type: "content",
      duration: "15 min",
      content: `
<h2>Verifiable Builds</h2>
<p>Verifiable builds ensure that the deployed program binary exactly matches the source code. This is critical for trust and security.</p>

<h3>Build Verifiably</h3>
<pre><code class="language-bash">anchor build --verifiable</code></pre>
<p>This uses a Docker container with a deterministic build environment to produce the same binary every time.</p>

<h3>Verify a Deployed Program</h3>
<pre><code class="language-bash">anchor verify &lt;PROGRAM_ID&gt;</code></pre>
<p>This rebuilds from source and compares the hash against the deployed binary.</p>

<h3>Prerequisites</h3>
<ul>
  <li>Docker must be installed and running</li>
  <li>Your <code>Anchor.toml</code> must specify the correct program ID</li>
  <li>Source code must be in a clean state (committed, no local changes)</li>
</ul>

<h3>Why Verify?</h3>
<ul>
  <li>Users can trust the program does what the source says</li>
  <li>Auditors can confirm the deployed code matches audited source</li>
  <li>Required for programs handling real value</li>
</ul>

<p>Reference: <a href="https://www.anchor-lang.com/docs/references/verifiable-builds" target="_blank">Verifiable Builds Docs</a></p>
`,
    },
    // ─── Lesson 6: Sealevel Attacks & Security ──────────
    {
      title: "Sealevel Attacks & Security",
      description:
        "Understand common Solana program vulnerabilities and how Anchor prevents them.",
      type: "content",
      duration: "25 min",
      content: `
<h2>Sealevel Attacks & Security</h2>
<p>Solana programs face specific vulnerability classes. Anchor mitigates many automatically, but understanding them is essential.</p>

<h3>Common Vulnerabilities</h3>
<table>
  <thead><tr><th>Attack</th><th>Description</th><th>Anchor Mitigation</th></tr></thead>
  <tbody>
    <tr>
      <td><strong>Missing Signer Check</strong></td>
      <td>Not verifying an account signed the tx</td>
      <td><code>Signer&lt;'info&gt;</code> type</td>
    </tr>
    <tr>
      <td><strong>Missing Owner Check</strong></td>
      <td>Not verifying account ownership</td>
      <td><code>Account&lt;'info, T&gt;</code> auto-checks owner</td>
    </tr>
    <tr>
      <td><strong>Account Substitution</strong></td>
      <td>Passing wrong account for expected one</td>
      <td>PDA seeds validation, <code>has_one</code></td>
    </tr>
    <tr>
      <td><strong>Reinitialization</strong></td>
      <td>Re-initializing an existing account</td>
      <td><code>init</code> checks discriminator is zeroed</td>
    </tr>
    <tr>
      <td><strong>Arithmetic Overflow</strong></td>
      <td>Integer overflow/underflow</td>
      <td>Use <code>checked_add/sub/mul</code></td>
    </tr>
    <tr>
      <td><strong>PDA Bump Manipulation</strong></td>
      <td>Using non-canonical bumps</td>
      <td>Store bump, <code>bump = account.bump</code></td>
    </tr>
    <tr>
      <td><strong>Closing Account Revival</strong></td>
      <td>Account revived after closing</td>
      <td><code>close</code> constraint zeroes data first</td>
    </tr>
    <tr>
      <td><strong>Type Cosplay</strong></td>
      <td>Passing wrong account type</td>
      <td>8-byte discriminator check</td>
    </tr>
    <tr>
      <td><strong>CPI Target Spoofing</strong></td>
      <td>CPI to wrong program</td>
      <td><code>Program&lt;'info, T&gt;</code> validates program key</td>
    </tr>
  </tbody>
</table>

<h3>Security Checklist</h3>
<ol>
  <li>All accounts validated with proper types and constraints</li>
  <li>Signer checks on all authority accounts</li>
  <li>Owner checks via <code>Account&lt;'info, T&gt;</code></li>
  <li>PDA bumps stored and reused (never recalculated)</li>
  <li>All arithmetic uses <code>checked_*</code> methods</li>
  <li>CPI targets validated via <code>Program&lt;'info, T&gt;</code></li>
  <li>Accounts closed properly with <code>close</code> constraint</li>
  <li>No <code>UncheckedAccount</code> without documented <code>/// CHECK:</code></li>
</ol>

<p>Reference: <a href="https://www.anchor-lang.com/docs/references/security-exploits" target="_blank">Sealevel Attacks Docs</a>, <a href="https://github.com/coral-xyz/sealevel-attacks" target="_blank">Sealevel Attacks Repo</a></p>
`,
    },
    // ─── Lesson 7: Final Quiz ───────────────────────────
    {
      title: "Anchor Framework Final Quiz",
      description:
        "Comprehensive quiz covering the entire Anchor framework.",
      type: "quiz",
      duration: "15 min",
      quiz: {
        passingScore: 70,
        questions: [
          {
            question:
              "What is the purpose of the 8-byte account discriminator in Anchor?",
            options: [
              "Store the account's balance",
              "Identify the account type and prevent type cosplay attacks",
              "Store the PDA bump seed",
              "Cache the program ID",
            ],
            correctIndex: 1,
            explanation:
              "The discriminator (SHA256 of 'account:<Name>') uniquely identifies account types, preventing attackers from substituting wrong account types.",
          },
          {
            question:
              "How do you sign a CPI with a PDA in Anchor?",
            options: [
              "CpiContext::new() with a Keypair",
              "CpiContext::new_with_signer() with signer_seeds",
              "CpiContext::signed() with the PDA address",
              "Add the PDA as a Signer in the accounts struct",
            ],
            correctIndex: 1,
            explanation:
              "Use CpiContext::new_with_signer() or .with_signer(seeds) to let the runtime verify the PDA derivation and add it as a signer.",
          },
          {
            question:
              "What constraint should you use to close an account and reclaim rent?",
            options: [
              "#[account(delete)]",
              "#[account(close = target)]",
              "#[account(destroy)]",
              "#[account(remove = target)]",
            ],
            correctIndex: 1,
            explanation:
              "The close constraint zeroes the account data, transfers all lamports to the target account, and sets the discriminator to closed.",
          },
          {
            question:
              "Which account type should you use for zero-copy deserialization?",
            options: [
              "Account<'info, T>",
              "BoxedAccount<'info, T>",
              "AccountLoader<'info, T>",
              "UncheckedAccount<'info>",
            ],
            correctIndex: 2,
            explanation:
              "AccountLoader provides zero-copy deserialization. Access data with .load()? (read) or .load_mut()? (write).",
          },
          {
            question:
              "What's the correct way to use InterfaceAccount for Token-2022 compatibility?",
            options: [
              "Account<'info, Mint> with Token program",
              "InterfaceAccount<'info, Mint> with Interface<'info, TokenInterface>",
              "UncheckedAccount with manual deserialization",
              "AccountLoader<'info, Mint> with zero-copy",
            ],
            correctIndex: 1,
            explanation:
              "InterfaceAccount + Interface supports both Token and Token-2022, making your program compatible with either token program.",
          },
        ],
      },
    },
  ],
};
