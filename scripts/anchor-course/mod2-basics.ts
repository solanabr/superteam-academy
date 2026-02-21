import { CourseModule } from "./types";

export const MODULE_BASICS: CourseModule = {
  title: "The Basics",
  description:
    "Core concepts of Anchor programs — program structure, IDL files, Program Derived Addresses, and Cross Program Invocations.",
  lessons: [
    // ─── Lesson 1: Program Structure ────────────────────
    {
      title: "Program Structure",
      description:
        "Learn the four key macros in every Anchor program: declare_id!, #[program], #[derive(Accounts)], and #[account].",
      type: "content",
      duration: "25 min",
      content: `
<h2>Anchor Program Structure</h2>
<p>Anchor uses Rust macros to reduce boilerplate and enforce security. Every program uses four main macros:</p>

<h3>1. declare_id!</h3>
<p>Specifies the program's on-chain address (program ID):</p>
<pre><code class="language-rust">use anchor_lang::prelude::*;

declare_id!("11111111111111111111111111111111");</code></pre>
<p>The program ID defaults to the keypair at <code>/target/deploy/your_program_name.json</code>. Sync it with:</p>
<pre><code class="language-bash">anchor keys sync</code></pre>

<h3>2. #[program]</h3>
<p>Annotates the module containing instruction handlers. Each public function is an invocable instruction:</p>
<pre><code class="language-rust">#[program]
mod hello_anchor {
    use super::*;
    pub fn initialize(ctx: Context&lt;Initialize&gt;, data: u64) -&gt; Result&lt;()&gt; {
        ctx.accounts.new_account.data = data;
        msg!("Changed data to: {}!", data);
        Ok(())
    }
}</code></pre>

<h4>Instruction Context</h4>
<p>The first parameter is always <code>Context&lt;T&gt;</code> where T implements the Accounts trait. It provides access to:</p>
<ul>
  <li><code>ctx.accounts</code> — deserialized accounts</li>
  <li><code>ctx.program_id</code> — the program's public key</li>
  <li><code>ctx.remaining_accounts</code> — extra accounts not in the struct</li>
  <li><code>ctx.bumps</code> — bump seeds for PDA accounts</li>
</ul>

<h3>3. #[derive(Accounts)]</h3>
<p>Defines the accounts required by an instruction. Each field represents an account:</p>
<pre><code class="language-rust">#[derive(Accounts)]
pub struct Initialize&lt;'info&gt; {
    #[account(init, payer = signer, space = 8 + 8)]
    pub new_account: Account&lt;'info, NewAccount&gt;,
    #[account(mut)]
    pub signer: Signer&lt;'info&gt;,
    pub system_program: Program&lt;'info, System&gt;,
}</code></pre>

<h4>Account Validation</h4>
<p>Anchor validates accounts in two ways:</p>
<ol>
  <li><strong>Account Constraints</strong> — <code>#[account(..)]</code> attributes like <code>init</code>, <code>mut</code>, <code>seeds</code>, <code>has_one</code>, <code>constraint</code></li>
  <li><strong>Account Types</strong> — <code>Account</code>, <code>Signer</code>, <code>Program</code>, <code>SystemAccount</code>, etc.</li>
</ol>

<h3>4. #[account]</h3>
<p>Defines the data structure stored in custom accounts:</p>
<pre><code class="language-rust">#[account]
pub struct NewAccount {
    data: u64,
}</code></pre>
<p>This macro handles:</p>
<ul>
  <li><strong>Program Owner</strong> — automatically set to the program in <code>declare_id</code></li>
  <li><strong>Discriminator</strong> — unique 8-byte identifier (first 8 bytes of SHA256 of <code>account:&lt;Name&gt;</code>)</li>
  <li><strong>Serialization</strong> — automatic Borsh serialization/deserialization</li>
</ul>

<h3>Account Discriminator</h3>
<p>Anchor reserves the first 8 bytes of every account for a discriminator. You must allocate space for it:</p>
<pre><code class="language-rust">#[account(init, payer = signer, space = 8 + 8)]
//                                       ^^^
//                              discriminator + u64</code></pre>
<p>The discriminator prevents passing wrong account types — if there's a mismatch, Anchor rejects the transaction.</p>

<p>Reference: <a href="https://www.anchor-lang.com/docs/basics/program-structure" target="_blank">Program Structure Docs</a></p>
`,
    },
    // ─── Lesson 2: Program IDL File ─────────────────────
    {
      title: "Program IDL File",
      description:
        "Understand the Interface Description Language (IDL) file — how it describes instructions, accounts, and enables client generation.",
      type: "content",
      duration: "20 min",
      content: `
<h2>Program IDL File</h2>
<p>An IDL (Interface Description Language) file is a standardized JSON file that describes your program's instructions and accounts. It is generated automatically by <code>anchor build</code> at <code>/target/idl/&lt;program-name&gt;.json</code>.</p>

<h3>Key Benefits</h3>
<ul>
  <li><strong>Standardization</strong> — consistent format for describing program interfaces</li>
  <li><strong>Client Generation</strong> — used to generate TypeScript clients automatically</li>
</ul>

<h3>Instructions in the IDL</h3>
<p>Each instruction in your program maps to an entry in the <code>instructions</code> array:</p>
<pre><code class="language-json">{
  "instructions": [
    {
      "name": "initialize",
      "discriminator": [175, 175, 109, 31, 13, 152, 155, 237],
      "accounts": [
        { "name": "newAccount", "writable": true, "signer": true },
        { "name": "signer", "writable": true, "signer": true },
        { "name": "systemProgram" }
      ],
      "args": [
        { "name": "data", "type": "u64" }
      ]
    }
  ]
}</code></pre>

<h3>Accounts in the IDL</h3>
<p>Structs with <code>#[account]</code> appear in the <code>accounts</code> array:</p>
<pre><code class="language-json">{
  "accounts": [
    {
      "name": "NewAccount",
      "discriminator": [176, 176, 110, 32, 14, 153, 156, 238],
      "type": {
        "kind": "struct",
        "fields": [
          { "name": "data", "type": "u64" }
        ]
      }
    }
  ]
}</code></pre>

<h3>Discriminators</h3>
<p>Anchor assigns an 8-byte discriminator to each instruction and account type:</p>
<ul>
  <li><strong>Instructions:</strong> First 8 bytes of <code>SHA256("global:&lt;instruction_name&gt;")</code></li>
  <li><strong>Accounts:</strong> First 8 bytes of <code>SHA256("account:&lt;AccountName&gt;")</code></li>
</ul>
<p>Discriminators are included in the IDL and used to route instructions and validate account types.</p>

<p>Reference: <a href="https://www.anchor-lang.com/docs/basics/idl" target="_blank">Program IDL File Docs</a></p>
`,
    },
    // ─── Lesson 3: Program Derived Address ──────────────
    {
      title: "Program Derived Address (PDA)",
      description:
        "Use Anchor's PDA constraints (seeds, bump, seeds::program) to derive deterministic account addresses.",
      type: "content",
      duration: "25 min",
      content: `
<h2>Program Derived Addresses (PDAs)</h2>
<p>PDAs are deterministic addresses derived from pre-defined inputs (seeds) and a program ID. They fall off the Ed25519 curve — no private key exists for them.</p>

<h3>Anchor PDA Constraints</h3>
<p>Use <code>seeds</code>, <code>bump</code>, and optionally <code>seeds::program</code>:</p>
<ul>
  <li><code>seeds</code> — array of values to derive the PDA (static or dynamic)</li>
  <li><code>bump</code> — bump seed to ensure the address is off-curve</li>
  <li><code>seeds::program</code> — (optional) program ID if deriving for a different program</li>
</ul>

<h3>Usage Examples</h3>

<h4>No Optional Seeds</h4>
<pre><code class="language-rust">#[derive(Accounts)]
pub struct InstructionAccounts&lt;'info&gt; {
    #[account(seeds = [], bump)]
    pub pda_account: SystemAccount&lt;'info&gt;,
}</code></pre>

<h4>Single Static Seed</h4>
<pre><code class="language-rust">#[derive(Accounts)]
pub struct InstructionAccounts&lt;'info&gt; {
    #[account(seeds = [b"hello_world"], bump)]
    pub pda_account: SystemAccount&lt;'info&gt;,
}</code></pre>

<h4>Multiple Seeds + Account References</h4>
<pre><code class="language-rust">#[derive(Accounts)]
pub struct InstructionAccounts&lt;'info&gt; {
    pub signer: Signer&lt;'info&gt;,
    #[account(
        seeds = [b"hello_world", signer.key().as_ref()],
        bump,
    )]
    pub pda_account: SystemAccount&lt;'info&gt;,
}</code></pre>

<h4>Init PDA Account</h4>
<pre><code class="language-rust">#[derive(Accounts)]
pub struct CreateAccount&lt;'info&gt; {
    #[account(mut)]
    pub signer: Signer&lt;'info&gt;,
    #[account(
        init,
        payer = signer,
        space = 8 + 8,
        seeds = [b"data", signer.key().as_ref()],
        bump,
    )]
    pub pda_account: Account&lt;'info, DataAccount&gt;,
    pub system_program: Program&lt;'info, System&gt;,
}</code></pre>

<h3>PDA Seeds in the IDL</h3>
<p>Seeds defined in <code>#[account]</code> constraints are included in the IDL file, allowing the Anchor client to <strong>automatically resolve PDA addresses</strong> when constructing instructions.</p>

<h3>Client-Side PDA Derivation</h3>
<pre><code class="language-typescript">const [PDA] = PublicKey.findProgramAddressSync(
  [Buffer.from("hello_world"), wallet.publicKey.toBuffer()],
  program.programId
);</code></pre>

<p>Reference: <a href="https://www.anchor-lang.com/docs/basics/pda" target="_blank">PDA Docs</a></p>
`,
    },
    // ─── Lesson 4: Cross Program Invocation ─────────────
    {
      title: "Cross Program Invocation (CPI)",
      description:
        "Invoke instructions on other programs from within your Anchor program. Learn CPI with and without PDA signers.",
      type: "content",
      duration: "30 min",
      content: `
<h2>Cross Program Invocations (CPIs)</h2>
<p>CPIs allow one program to invoke instructions on another program, enabling composability. You need three things:</p>
<ol>
  <li>The <strong>program ID</strong> of the target program</li>
  <li>The <strong>accounts</strong> required by the instruction</li>
  <li>Any <strong>instruction data</strong> (arguments)</li>
</ol>

<h3>Basic CPI — SOL Transfer</h3>
<pre><code class="language-rust">use anchor_lang::prelude::*;
use anchor_lang::system_program::{transfer, Transfer};

#[program]
pub mod cpi_example {
    use super::*;

    pub fn sol_transfer(ctx: Context&lt;SolTransfer&gt;, amount: u64) -&gt; Result&lt;()&gt; {
        let cpi_context = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            Transfer {
                from: ctx.accounts.sender.to_account_info(),
                to: ctx.accounts.recipient.to_account_info(),
            },
        );
        transfer(cpi_context, amount)?;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct SolTransfer&lt;'info&gt; {
    #[account(mut)]
    sender: Signer&lt;'info&gt;,
    #[account(mut)]
    recipient: SystemAccount&lt;'info&gt;,
    system_program: Program&lt;'info, System&gt;,
}</code></pre>

<h3>CPI with PDA Signer</h3>
<p>When a PDA needs to sign a CPI, use <code>CpiContext::new_with_signer</code>:</p>
<pre><code class="language-rust">pub fn sol_transfer(ctx: Context&lt;SolTransfer&gt;, amount: u64) -&gt; Result&lt;()&gt; {
    let seed = ctx.accounts.recipient.key();
    let bump_seed = ctx.bumps.pda_account;
    let signer_seeds: &[&[&[u8]]] = &[&[b"pda", seed.as_ref(), &[bump_seed]]];

    let cpi_context = CpiContext::new(
        ctx.accounts.system_program.to_account_info(),
        Transfer {
            from: ctx.accounts.pda_account.to_account_info(),
            to: ctx.accounts.recipient.to_account_info(),
        },
    ).with_signer(signer_seeds);

    transfer(cpi_context, amount)?;
    Ok(())
}

#[derive(Accounts)]
pub struct SolTransfer&lt;'info&gt; {
    #[account(
        mut,
        seeds = [b"pda", recipient.key().as_ref()],
        bump,
    )]
    pda_account: SystemAccount&lt;'info&gt;,
    #[account(mut)]
    recipient: SystemAccount&lt;'info&gt;,
    system_program: Program&lt;'info, System&gt;,
}</code></pre>

<h3>Client-Side CPI Test</h3>
<pre><code class="language-typescript">const [PDA] = PublicKey.findProgramAddressSync(
  [Buffer.from("pda"), wallet.publicKey.toBuffer()],
  program.programId
);

const tx = await program.methods
  .solTransfer(new BN(transferAmount))
  .accounts({
    pdaAccount: PDA,
    recipient: wallet.publicKey,
  })
  .rpc();</code></pre>

<p>When the CPI is processed, the Solana runtime validates the PDA seeds and adds the PDA as a signer automatically.</p>

<p>Reference: <a href="https://www.anchor-lang.com/docs/basics/cpi" target="_blank">CPI Docs</a></p>
`,
    },
    // ─── Lesson 5: Build a Counter Program ──────────────
    {
      title: "Build a Counter Program",
      description:
        "Apply the basics — build a counter program with initialize and increment instructions using PDAs.",
      type: "challenge",
      duration: "30 min",
      challenge: {
        prompt:
          "Complete the counter program with initialize and increment instructions. The counter account should be a PDA seeded with the user's public key.",
        objectives: [
          "Define a Counter account struct with a count field",
          "Implement initialize to create the counter PDA",
          "Implement increment to increase count by 1",
          "Use proper PDA seeds and account constraints",
        ],
        starterCode: `use anchor_lang::prelude::*;

declare_id!("11111111111111111111111111111111");

#[program]
mod counter {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        // TODO: Set initial count to 0
        Ok(())
    }

    pub fn increment(ctx: Context<Increment>) -> Result<()> {
        // TODO: Increment the counter
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    // TODO: Add counter account with init, PDA seeds
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Increment<'info> {
    pub user: Signer<'info>,
    // TODO: Add counter account with mut, PDA seeds
}

#[account]
pub struct Counter {
    // TODO: Define fields
}`,
        language: "rust",
        solution: `use anchor_lang::prelude::*;

declare_id!("11111111111111111111111111111111");

#[program]
mod counter {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        ctx.accounts.counter.count = 0;
        Ok(())
    }

    pub fn increment(ctx: Context<Increment>) -> Result<()> {
        ctx.accounts.counter.count = ctx.accounts.counter.count.checked_add(1).unwrap();
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(
        init,
        payer = user,
        space = 8 + 8,
        seeds = [b"counter", user.key().as_ref()],
        bump,
    )]
    pub counter: Account<'info, Counter>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Increment<'info> {
    pub user: Signer<'info>,
    #[account(
        mut,
        seeds = [b"counter", user.key().as_ref()],
        bump,
    )]
    pub counter: Account<'info, Counter>,
}

#[account]
pub struct Counter {
    pub count: u64,
}`,
        hints: [
          "Use #[account(init, payer = user, space = 8 + 8, seeds = [b\"counter\", user.key().as_ref()], bump)] for initialization",
          "For increment, use #[account(mut, seeds = [...], bump)] without init",
          "Use checked_add for safe arithmetic",
        ],
        testCases: [
          {
            id: "tc-1",
            name: "Counter PDA with seeds",
            expectedOutput: 'seeds = [b"counter"',
            hidden: false,
          },
          {
            id: "tc-2",
            name: "Uses checked arithmetic",
            expectedOutput: "checked_add",
            hidden: false,
          },
        ],
      },
    },
  ],
};
