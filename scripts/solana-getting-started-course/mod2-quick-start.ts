import { CourseModule } from "../anchor-course/types";

export const MODULE_QUICK_START: CourseModule = {
  title: "Quick Start",
  description:
    "Hands-on introduction to reading data, writing transactions, deploying programs, and composing on-chain logic",
  lessons: [
    {
      title: "Quick Start Overview",
      description:
        "Introduction to key Solana concepts and what you will build in this module",
      type: "content",
      content: `<h2>Quick Start Overview</h2><p>This module walks you through reading data from the Solana blockchain, writing transactions, deploying your first program, and composing programs together — all using practical examples.</p><h3>What You'll Learn</h3><ul><li>Connect to a Solana cluster and read on-chain data</li><li>Create and send transactions with instructions</li><li>Write, build, and deploy a Solana program</li><li>Understand PDAs (Program Derived Addresses)</li><li>Compose programs using Cross-Program Invocations</li></ul><h3>Key Terminology</h3><ul><li><strong>Account</strong> — data storage on Solana (everything is an account)</li><li><strong>Transaction</strong> — a signed message containing one or more instructions</li><li><strong>Instruction</strong> — a single operation targeting a specific program</li><li><strong>Program</strong> — on-chain code (smart contract) that processes instructions</li></ul>`,
      xp: 30,
    },
    {
      title: "Reading from Network",
      description:
        "Connect to Solana and read account data, balances, and program state",
      type: "content",
      content: `<h2>Reading from the Network</h2><p>Use the <code>@solana/web3.js</code> library to connect to a cluster and read on-chain data.</p><h3>Create a Connection</h3><pre><code>import { Connection, clusterApiUrl, LAMPORTS_PER_SOL } from "@solana/web3.js";

const connection = new Connection(clusterApiUrl("devnet"), "confirmed");</code></pre><h3>Get Account Balance</h3><pre><code>const balance = await connection.getBalance(publicKey);
console.log(\`Balance: \${balance / LAMPORTS_PER_SOL} SOL\`);</code></pre><h3>Fetch Account Info</h3><pre><code>const accountInfo = await connection.getAccountInfo(publicKey);
console.log("Owner:", accountInfo.owner.toBase58());
console.log("Data length:", accountInfo.data.length);
console.log("Lamports:", accountInfo.lamports);</code></pre><h3>Get Recent Blockhash</h3><pre><code>const { blockhash } = await connection.getLatestBlockhash();
console.log("Blockhash:", blockhash);</code></pre><p>Every piece of state on Solana lives in an <strong>account</strong>. Reading is free and doesn't require a transaction.</p>`,
      xp: 30,
    },
    {
      title: "Writing to the Network",
      description:
        "Build and send transactions to the Solana blockchain",
      type: "content",
      content: `<h2>Writing to the Network</h2><p>To change state on Solana, you send <strong>transactions</strong> containing one or more <strong>instructions</strong>.</p><h3>Transfer SOL</h3><pre><code>import {
  Connection, Transaction, SystemProgram,
  sendAndConfirmTransaction, Keypair, PublicKey,
  LAMPORTS_PER_SOL
} from "@solana/web3.js";

const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
const sender = Keypair.generate();

// Airdrop to sender
await connection.requestAirdrop(sender.publicKey, 2 * LAMPORTS_PER_SOL);

// Build transfer instruction
const instruction = SystemProgram.transfer({
  fromPubkey: sender.publicKey,
  toPubkey: new PublicKey("...recipient..."),
  lamports: 0.1 * LAMPORTS_PER_SOL,
});

// Create transaction and send
const tx = new Transaction().add(instruction);
const sig = await sendAndConfirmTransaction(connection, tx, [sender]);
console.log("Signature:", sig);</code></pre><h3>Transaction Anatomy</h3><ul><li><strong>Signatures</strong> — every signer must sign the transaction</li><li><strong>Message</strong> — contains header, account keys, recent blockhash, and instructions</li><li>Transactions have a <strong>1232 byte</strong> size limit</li></ul>`,
      xp: 30,
    },
    {
      title: "Deploy a Program",
      description:
        "Write, build, and deploy your first on-chain Solana program using Anchor",
      type: "content",
      content: `<h2>Deploy a Program</h2><h3>Create the Project</h3><pre><code>anchor init hello-solana
cd hello-solana</code></pre><h3>Write a Simple Program</h3><pre><code>// programs/hello-solana/src/lib.rs
use anchor_lang::prelude::*;

declare_id!("...");

#[program]
pub mod hello_solana {
    use super::*;

    pub fn initialize(ctx: Context&lt;Initialize&gt;, data: u64) -> Result&lt;()&gt; {
        ctx.accounts.new_account.data = data;
        msg!("Data stored: {}", data);
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
}</code></pre><h3>Build and Deploy</h3><pre><code># Build
anchor build

# Deploy to devnet
anchor deploy --provider.cluster devnet

# Your program ID will be displayed</code></pre><h3>Test</h3><pre><code>anchor test</code></pre>`,
      xp: 30,
    },
    {
      title: "Creating Deterministic Accounts (PDAs)",
      description:
        "Derive program-owned accounts from seeds using Program Derived Addresses",
      type: "content",
      content: `<h2>Program Derived Addresses (PDAs)</h2><p>PDAs are deterministic addresses derived from a <strong>program ID</strong> and a set of <strong>seeds</strong>. They enable programs to own accounts without needing a private key.</p><h3>How PDAs Work</h3><pre><code>// Derive a PDA
const [pda, bump] = PublicKey.findProgramAddressSync(
  [Buffer.from("my-seed"), user.publicKey.toBuffer()],
  programId
);</code></pre><p>PDAs are <em>not</em> on the ed25519 curve, which means no private key can sign for them. Only the owning program can write to PDA accounts.</p><h3>Anchor PDA Usage</h3><pre><code>#[derive(Accounts)]
#[instruction(message: String)]
pub struct CreateMessage&lt;'info&gt; {
    #[account(
        init,
        payer = user,
        space = 8 + 4 + message.len(),
        seeds = [b"message", user.key().as_ref()],
        bump
    )]
    pub message_account: Account&lt;'info, MessageAccount&gt;,
    #[account(mut)]
    pub user: Signer&lt;'info&gt;,
    pub system_program: Program&lt;'info, System&gt;,
}</code></pre><h3>Key Points</h3><ul><li>Seeds can include static strings, public keys, or other data</li><li>The <strong>bump</strong> is a u8 that ensures the address is off-curve</li><li>Store the canonical bump to avoid recomputing it</li><li>PDAs are unique per program + seed combination</li></ul>`,
      xp: 30,
    },
    {
      title: "Composing Multiple Programs (CPI)",
      description:
        "Call one program from another using Cross-Program Invocations",
      type: "content",
      content: `<h2>Cross-Program Invocation (CPI)</h2><p>CPI allows one program to call instructions on another program. This is how programs compose on Solana — like function calls between smart contracts.</p><h3>CPI Example: Transfer SOL</h3><pre><code>use anchor_lang::system_program;

pub fn sol_transfer(ctx: Context&lt;SolTransfer&gt;, amount: u64) -> Result&lt;()&gt; {
    let cpi_context = CpiContext::new(
        ctx.accounts.system_program.to_account_info(),
        system_program::Transfer {
            from: ctx.accounts.sender.to_account_info(),
            to: ctx.accounts.recipient.to_account_info(),
        },
    );
    system_program::transfer(cpi_context, amount)?;
    Ok(())
}</code></pre><h3>CPI with PDA Signer</h3><p>When a PDA needs to sign a CPI, use <code>CpiContext::new_with_signer</code>:</p><pre><code>let seeds = &[b"vault", &[bump]];
let signer_seeds = &[&seeds[..]];

let cpi_context = CpiContext::new_with_signer(
    ctx.accounts.system_program.to_account_info(),
    transfer_accounts,
    signer_seeds,
);
system_program::transfer(cpi_context, amount)?;</code></pre><h3>Key Rules</h3><ul><li>Max CPI depth: <strong>4 levels</strong></li><li>Signer privileges extend through CPIs</li><li>Writable privileges extend through CPIs</li><li>Always validate the target program ID before CPI</li></ul>`,
      xp: 30,
    },
  ],
};
