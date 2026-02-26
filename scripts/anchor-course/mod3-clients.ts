import { CourseModule } from "./types";

export const MODULE_CLIENTS: CourseModule = {
  title: "Client Libraries",
  description:
    "Interact with Anchor programs using the TypeScript and Rust client libraries.",
  lessons: [
    // ─── Lesson 1: TypeScript Client ────────────────────
    {
      title: "TypeScript Client",
      description:
        "Use @coral-xyz/anchor to build transactions, fetch accounts, and subscribe to program events in TypeScript.",
      type: "content",
      duration: "25 min",
      content: `
<h2>TypeScript Client</h2>
<p>The <code>@coral-xyz/anchor</code> package provides a TypeScript client generated from your program's IDL. It auto-resolves PDA addresses, encodes/decodes instruction data, and more.</p>

<h3>Setup</h3>
<pre><code class="language-typescript">import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { MyProgram } from "../target/types/my_program";

const provider = anchor.AnchorProvider.env();
anchor.setProvider(provider);
const program = anchor.workspace.MyProgram as Program&lt;MyProgram&gt;;</code></pre>

<h3>Sending Instructions</h3>
<pre><code class="language-typescript">// Build and send a transaction
const tx = await program.methods
  .initialize(new anchor.BN(42))
  .accounts({
    newAccount: newAccountKp.publicKey,
    signer: provider.wallet.publicKey,
    systemProgram: anchor.web3.SystemProgram.programId,
  })
  .signers([newAccountKp])
  .rpc();

// Or build the instruction without sending
const ix = await program.methods
  .initialize(new anchor.BN(42))
  .accounts({ ... })
  .instruction();</code></pre>

<h3>Fetching Accounts</h3>
<pre><code class="language-typescript">// Fetch a single account
const account = await program.account.newAccount.fetch(accountAddress);
console.log("Data:", account.data.toString());

// Fetch multiple accounts
const accounts = await program.account.newAccount.all();

// Fetch with filters
const filtered = await program.account.newAccount.all([
  { memcmp: { offset: 8, bytes: authority.toBase58() } }
]);</code></pre>

<h3>Subscribing to Events</h3>
<pre><code class="language-typescript">const listener = program.addEventListener("MyEvent", (event, slot) =&gt; {
  console.log("Event:", event);
  console.log("Slot:", slot);
});

// Later, remove listener
program.removeEventListener(listener);</code></pre>

<h3>PDA Auto-Resolution</h3>
<p>If the IDL contains PDA seeds, the client can automatically derive addresses — you don't always need to pass them manually.</p>

<p>Reference: <a href="https://www.anchor-lang.com/docs/clients/typescript" target="_blank">TypeScript Client Docs</a></p>
`,
    },
    // ─── Lesson 2: Rust Client ──────────────────────────
    {
      title: "Rust Client",
      description:
        "Use the anchor-client crate to interact with Anchor programs from Rust applications.",
      type: "content",
      duration: "20 min",
      content: `
<h2>Rust Client</h2>
<p>The <code>anchor-client</code> crate provides a Rust client for interacting with Anchor programs.</p>

<h3>Setup</h3>
<pre><code class="language-rust">use anchor_client::{
    solana_sdk::{
        commitment_config::CommitmentConfig,
        signature::Keypair,
        signer::Signer,
    },
    Client, Cluster,
};
use std::rc::Rc;

let payer = Rc::new(Keypair::new());
let client = Client::new_with_options(
    Cluster::Localnet,
    payer.clone(),
    CommitmentConfig::confirmed(),
);
let program = client.program(program_id)?;</code></pre>

<h3>Sending Instructions</h3>
<pre><code class="language-rust">// Build and send transaction
let tx = program
    .request()
    .accounts(my_program::accounts::Initialize {
        new_account: new_account_kp.pubkey(),
        signer: payer.pubkey(),
        system_program: system_program::id(),
    })
    .args(my_program::instruction::Initialize { data: 42 })
    .signer(&new_account_kp)
    .send()?;</code></pre>

<h3>Fetching Accounts</h3>
<pre><code class="language-rust">let account: NewAccount = program.account(account_address)?;
println!("Data: {}", account.data);</code></pre>

<h3>Rust Test Template</h3>
<p>Initialize a project with Rust tests:</p>
<pre><code class="language-bash">anchor init --test-template rust my-program</code></pre>
<p>Test file is at <code>/tests/src/test_initialize.rs</code>.</p>

<p>Reference: <a href="https://www.anchor-lang.com/docs/clients/rust" target="_blank">Rust Client Docs</a></p>
`,
    },
    // ─── Lesson 3: Client Quiz ──────────────────────────
    {
      title: "Client Libraries Quiz",
      description:
        "Test your understanding of TypeScript and Rust clients.",
      type: "quiz",
      duration: "10 min",
      quiz: {
        passingScore: 70,
        questions: [
          {
            question:
              "Which method sends a transaction and returns the signature in the TypeScript client?",
            options: [".instruction()", ".rpc()", ".send()", ".execute()"],
            correctIndex: 1,
            explanation:
              ".rpc() builds, signs, sends the transaction and returns the signature. .instruction() only builds the instruction without sending.",
          },
          {
            question:
              "How do you fetch all accounts of a specific type in TypeScript?",
            options: [
              "program.getAccounts()",
              "program.account.myAccount.all()",
              "program.fetchAll('myAccount')",
              "program.accounts.getAll()",
            ],
            correctIndex: 1,
            explanation:
              "program.account.<accountName>.all() fetches all accounts of that type, with optional filters.",
          },
          {
            question:
              "What crate provides the Rust client for Anchor programs?",
            options: [
              "anchor-lang",
              "solana-client",
              "anchor-client",
              "anchor-sdk",
            ],
            correctIndex: 2,
            explanation:
              "The anchor-client crate provides the Rust client for interacting with Anchor programs.",
          },
        ],
      },
    },
  ],
};
