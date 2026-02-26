import { CourseModule } from "../anchor-course/types";

export const MODULE_FUNDAMENTALS: CourseModule = {
  title: "Solana Fundamentals",
  description:
    "Understand the foundational building blocks: accounts, instructions, transactions, and fees",
  lessons: [
    {
      title: "Core Concepts Overview",
      description:
        "High-level overview of Solana's architecture and key building blocks",
      type: "content",
      content: `<h2>Core Concepts Overview</h2><p>Solana's architecture is fundamentally different from other blockchains. Understanding these core concepts is essential for building efficient programs.</p><h3>Key Principles</h3><ul><li><strong>Everything is an account</strong> — programs, state, wallets are all accounts</li><li><strong>Programs are stateless</strong> — they process instructions but store data in separate accounts</li><li><strong>Parallel execution</strong> — transactions that don't touch the same accounts run in parallel</li><li><strong>Single global state</strong> — no sharding, all validators see the same state</li></ul><h3>Building Blocks</h3><ol><li><strong>Accounts</strong> — data containers (up to 10 MB)</li><li><strong>Instructions</strong> — operations targeting a specific program</li><li><strong>Transactions</strong> — atomic bundles of instructions</li><li><strong>Programs</strong> — on-chain code (compiled to BPF/SBF)</li></ol><p>Solana processes up to <strong>65,000 transactions per second</strong> with ~400ms block times.</p>`,
      xp: 30,
    },
    {
      title: "Accounts",
      description:
        "Deep dive into Solana's account model — the foundation of all on-chain data",
      type: "content",
      content: `<h2>Accounts</h2><p>Everything on Solana is an <strong>account</strong>. Accounts store data, SOL balances, and program code.</p><h3>Account Structure</h3><pre><code>Account {
  lamports: u64,        // SOL balance (1 SOL = 1B lamports)
  data: Vec&lt;u8&gt;,        // arbitrary data
  owner: Pubkey,        // program that owns this account
  executable: bool,     // is this a program?
  rent_epoch: u64,      // rent tracking
}</code></pre><h3>Key Rules</h3><ul><li>Only the <strong>owner program</strong> can modify an account's data</li><li>Anyone can <strong>credit</strong> lamports to an account</li><li>Only the owner can <strong>debit</strong> lamports</li><li>Account data can be <strong>zeroed</strong> by the owner</li><li>New accounts must be <strong>rent-exempt</strong> (hold minimum SOL balance)</li></ul><h3>Account Types</h3><ul><li><strong>System accounts</strong> — owned by the System Program (wallets)</li><li><strong>Program accounts</strong> — contain executable code</li><li><strong>Data accounts</strong> — owned by programs, store state</li><li><strong>Token accounts</strong> — owned by Token Program, store balances</li></ul><h3>Rent</h3><p>All accounts must hold a minimum balance to remain on-chain:</p><pre><code># Check rent exemption for 100 bytes
solana rent 100
# Output: Rent per byte-year: 0.00000348 SOL
# Minimum balance: 0.00114144 SOL</code></pre>`,
      xp: 30,
    },
    {
      title: "Instructions",
      description:
        "How instructions target programs, pass accounts, and encode data",
      type: "content",
      content: `<h2>Instructions</h2><p>An <strong>instruction</strong> is the smallest unit of execution on Solana. Each instruction tells one program to perform one operation.</p><h3>Instruction Structure</h3><pre><code>Instruction {
  program_id: Pubkey,            // which program to call
  accounts: Vec&lt;AccountMeta&gt;,    // accounts the instruction uses
  data: Vec&lt;u8&gt;,                 // encoded instruction arguments
}</code></pre><h3>AccountMeta</h3><p>Each account in the list specifies its permissions:</p><pre><code>AccountMeta {
  pubkey: Pubkey,
  is_signer: bool,     // must this account sign?
  is_writable: bool,   // will this account be modified?
}</code></pre><h3>TypeScript Example</h3><pre><code>import { TransactionInstruction, PublicKey } from "@solana/web3.js";

const instruction = new TransactionInstruction({
  programId: programId,
  keys: [
    { pubkey: account1, isSigner: true, isWritable: true },
    { pubkey: account2, isSigner: false, isWritable: false },
  ],
  data: Buffer.from([/* instruction data */]),
});</code></pre><h3>Key Points</h3><ul><li>A transaction can contain <strong>multiple instructions</strong></li><li>Instructions execute <strong>sequentially</strong> within a transaction</li><li>If any instruction fails, the <strong>entire transaction</strong> is reverted</li></ul>`,
      xp: 30,
    },
    {
      title: "Transactions",
      description:
        "Transaction structure, lifecycle, and confirmation strategies",
      type: "content",
      content: `<h2>Transactions</h2><p>A <strong>transaction</strong> is a signed message containing one or more instructions. It is the atomic unit of state change on Solana.</p><h3>Transaction Structure</h3><pre><code>Transaction {
  signatures: Vec&lt;Signature&gt;,   // ed25519 signatures
  message: Message {
    header: MessageHeader,      // signer/readonly counts
    account_keys: Vec&lt;Pubkey&gt;,  // all accounts used
    recent_blockhash: Hash,     // prevents replay
    instructions: Vec&lt;CompiledInstruction&gt;,
  }
}</code></pre><h3>Size Limit</h3><p>Transactions cannot exceed <strong>1232 bytes</strong> (fits in a single IPv6 MTU packet). This limits the number of accounts and instructions per transaction.</p><h3>Confirmation Levels</h3><ul><li><code>processed</code> — transaction has been processed by the leader</li><li><code>confirmed</code> — voted on by supermajority of stake (~66%)</li><li><code>finalized</code> — confirmed by 31+ slots (~12 seconds)</li></ul><h3>Lifecycle</h3><ol><li>Client builds transaction with instructions</li><li>Signs with required signers</li><li>Submits to an RPC node</li><li>RPC forwards to current leader</li><li>Leader validates, executes, and includes in a block</li><li>Validators vote to confirm</li></ol>`,
      xp: 30,
    },
  ],
};
