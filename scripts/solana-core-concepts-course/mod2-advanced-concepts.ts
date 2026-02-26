import { CourseModule } from "../anchor-course/types";

export const MODULE_ADVANCED_CONCEPTS: CourseModule = {
  title: "Advanced Core Concepts",
  description:
    "Transaction fees, programs architecture, PDAs, and Cross-Program Invocation in depth",
  lessons: [
    {
      title: "Transaction Fees",
      description:
        "How fees work on Solana: base fees, priority fees, and compute units",
      type: "content",
      content: `<h2>Transaction Fees</h2><p>Solana transactions have two fee components: a <strong>base fee</strong> and an optional <strong>priority fee</strong>.</p><h3>Base Fee</h3><p>Every transaction pays a base fee of <strong>5,000 lamports per signature</strong> (0.000005 SOL). Most transactions have one signature.</p><h3>Priority Fees</h3><p>Priority fees are optional and help your transaction get processed faster during network congestion.</p><pre><code>import { ComputeBudgetProgram } from "@solana/web3.js";

// Set compute unit price (priority fee)
const priorityFeeIx = ComputeBudgetProgram.setComputeUnitPrice({
  microLamports: 50_000, // price per CU
});

// Set compute unit limit
const computeLimitIx = ComputeBudgetProgram.setComputeUnitLimit({
  units: 200_000,
});</code></pre><h3>Compute Units (CU)</h3><ul><li>Default limit: <strong>200,000 CU</strong> per instruction</li><li>Max per transaction: <strong>1,400,000 CU</strong></li><li>Simple transfers: ~150 CU</li><li>Token transfers: ~5,000 CU</li><li>Complex program calls: 50,000+ CU</li></ul><h3>Fee Distribution</h3><ul><li><strong>50%</strong> of base fees are burned</li><li><strong>50%</strong> go to the block producer</li><li><strong>100%</strong> of priority fees go to the block producer</li></ul>`,
      xp: 30,
    },
    {
      title: "Programs",
      description:
        "How Solana programs work — stateless, upgradeable, and composable",
      type: "content",
      content: `<h2>Programs</h2><p>Solana programs (smart contracts) are <strong>stateless</strong> on-chain code compiled to BPF/SBF bytecode.</p><h3>Key Properties</h3><ul><li><strong>Stateless</strong> — programs don't store data; they read/write separate accounts</li><li><strong>Deterministic</strong> — same inputs always produce same outputs</li><li><strong>Upgradeable</strong> — programs can be upgraded by the upgrade authority</li><li><strong>Composable</strong> — programs invoke each other via CPI</li></ul><h3>Built-in Programs</h3><ul><li><strong>System Program</strong> (<code>11111111111111111111111111111111</code>) — creates accounts, transfers SOL</li><li><strong>Token Program</strong> (<code>TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA</code>) — SPL tokens</li><li><strong>Token-2022</strong> (<code>TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb</code>) — tokens with extensions</li><li><strong>Associated Token Account</strong> — deterministic token account creation</li><li><strong>BPF Loader</strong> — deploys and upgrades programs</li></ul><h3>Program Lifecycle</h3><ol><li>Write program in Rust (native or Anchor)</li><li>Compile to BPF bytecode: <code>anchor build</code></li><li>Deploy: <code>anchor deploy</code></li><li>Upgrade: <code>anchor upgrade</code> (if upgrade authority exists)</li><li>Immutable: relinquish upgrade authority to lock forever</li></ol>`,
      xp: 30,
    },
    {
      title: "Program Derived Addresses",
      description:
        "Deterministic addresses for program-owned data, signing, and access control",
      type: "content",
      content: `<h2>Program Derived Addresses (PDAs)</h2><p>PDAs are addresses derived deterministically from a <strong>program ID</strong> and a set of <strong>seeds</strong>. They lie off the ed25519 curve, meaning no private key exists for them.</p><h3>Derivation</h3><pre><code>// TypeScript
const [pda, bump] = PublicKey.findProgramAddressSync(
  [Buffer.from("user-stats"), userPubkey.toBuffer()],
  programId
);

// Rust (in program)
let (pda, bump) = Pubkey::find_program_address(
    &[b"user-stats", user.key().as_ref()],
    &program_id,
);</code></pre><h3>How It Works</h3><ol><li>Hash <code>SHA256(seeds + program_id + "ProgramDerivedAddress")</code></li><li>If result is on the curve, <strong>decrement bump</strong> (from 255) and retry</li><li>The first off-curve result gives the <strong>canonical bump</strong></li></ol><h3>Common PDA Patterns</h3><ul><li><strong>Config</strong>: <code>seeds = [b"config"]</code> — singleton per program</li><li><strong>User state</strong>: <code>seeds = [b"user", user.key()]</code> — per-user data</li><li><strong>Relationship</strong>: <code>seeds = [b"enrollment", user.key(), course_id]</code></li><li><strong>Vault</strong>: <code>seeds = [b"vault"]</code> — PDA-owned token account</li></ul><h3>Security</h3><ul><li>Always store and reuse the <strong>canonical bump</strong></li><li>Never recompute bumps on every call (wastes CU)</li><li>PDAs ensure only the owning program can "sign" as that address</li></ul>`,
      xp: 30,
    },
    {
      title: "Cross Program Invocation",
      description:
        "Calling one program from another — composability on Solana",
      type: "content",
      content: `<h2>Cross Program Invocation (CPI)</h2><p>CPI enables composability: one program calls instructions on another, much like function calls between contracts.</p><h3>Two Types</h3><ul><li><code>invoke()</code> — standard CPI, no PDA signer</li><li><code>invoke_signed()</code> — CPI where a PDA signs</li></ul><h3>Standard CPI</h3><pre><code>use solana_program::program::invoke;

invoke(
    &system_instruction::transfer(from, to, amount),
    &[from_info.clone(), to_info.clone(), system_program.clone()],
)?;</code></pre><h3>CPI with PDA Signer</h3><pre><code>use solana_program::program::invoke_signed;

let seeds = &[b"vault", &[bump_seed]];
invoke_signed(
    &transfer_instruction,
    &[vault_info.clone(), recipient_info.clone()],
    &[seeds],
)?;</code></pre><h3>Anchor CPI</h3><pre><code>// Easy CPI with Anchor
let cpi_accounts = Transfer {
    from: ctx.accounts.vault.to_account_info(),
    to: ctx.accounts.user.to_account_info(),
    authority: ctx.accounts.vault_authority.to_account_info(),
};
let cpi_ctx = CpiContext::new_with_signer(
    ctx.accounts.token_program.to_account_info(),
    cpi_accounts,
    signer_seeds,
);
token::transfer(cpi_ctx, amount)?;</code></pre><h3>Rules</h3><ul><li>Max depth: <strong>4 levels</strong> of CPI nesting</li><li>Signer privileges propagate through CPI</li><li>Writable privileges propagate through CPI</li><li>Always validate the CPI target <code>program_id</code></li><li>Reload accounts after CPI if they were modified</li></ul>`,
      xp: 30,
    },
  ],
};
