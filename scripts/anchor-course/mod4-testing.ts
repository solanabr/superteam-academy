import { CourseModule } from "./types";

export const MODULE_TESTING: CourseModule = {
  title: "Testing Libraries",
  description:
    "Test Anchor programs using LiteSVM for integration tests and Mollusk for instruction-level unit tests.",
  lessons: [
    // ─── Lesson 1: LiteSVM ──────────────────────────────
    {
      title: "LiteSVM",
      description:
        "Use LiteSVM for fast, lightweight integration testing of Anchor programs in Rust.",
      type: "content",
      duration: "25 min",
      content: `
<h2>LiteSVM</h2>
<p>LiteSVM is a fast, lightweight Solana VM simulator for Rust-based integration testing. It runs a minimal SVM instance in-process — no validator needed.</p>

<h3>Setup</h3>
<p>Add to your <code>Cargo.toml</code>:</p>
<pre><code class="language-toml">[dev-dependencies]
litesvm = "0.3.0"
solana-sdk = "2.1"</code></pre>

<h3>Basic Test</h3>
<pre><code class="language-rust">use litesvm::LiteSVM;
use solana_sdk::{
    instruction::{AccountMeta, Instruction},
    pubkey::Pubkey,
    signature::Keypair,
    signer::Signer,
    transaction::Transaction,
};

#[test]
fn test_initialize() {
    let mut svm = LiteSVM::new();

    // Load your program
    let program_id = Pubkey::new_unique();
    let program_bytes = include_bytes!("../../target/deploy/my_program.so");
    svm.add_program(program_id, program_bytes);

    // Create and fund accounts
    let payer = Keypair::new();
    svm.airdrop(&payer.pubkey(), 10_000_000_000).unwrap();

    // Build instruction
    let ix = Instruction {
        program_id,
        accounts: vec![
            AccountMeta::new(new_account.pubkey(), true),
            AccountMeta::new(payer.pubkey(), true),
            AccountMeta::new_readonly(solana_sdk::system_program::id(), false),
        ],
        data: instruction_data,
    };

    // Send transaction
    let tx = Transaction::new_signed_with_payer(
        &[ix],
        Some(&payer.pubkey()),
        &[&payer, &new_account],
        svm.latest_blockhash(),
    );

    let result = svm.send_transaction(tx);
    assert!(result.is_ok());
}</code></pre>

<h3>Key Features</h3>
<ul>
  <li>No external validator process needed</li>
  <li>Fast execution — tests run in milliseconds</li>
  <li>Full transaction simulation with CPI support</li>
  <li>Account state management (airdrop, set_account)</li>
</ul>

<p>Reference: <a href="https://www.anchor-lang.com/docs/testing/litesvm" target="_blank">LiteSVM Docs</a></p>
`,
    },
    // ─── Lesson 2: Mollusk ──────────────────────────────
    {
      title: "Mollusk",
      description:
        "Use Mollusk for instruction-level unit testing of Solana programs without a full runtime.",
      type: "content",
      duration: "25 min",
      content: `
<h2>Mollusk</h2>
<p>Mollusk is an instruction-level testing harness. It processes a single instruction at a time, making it ideal for focused unit testing of individual instructions.</p>

<h3>Setup</h3>
<pre><code class="language-toml">[dev-dependencies]
mollusk-svm = "0.0.12"
solana-sdk = "2.1"</code></pre>

<h3>Basic Test</h3>
<pre><code class="language-rust">use mollusk_svm::Mollusk;
use solana_sdk::{
    account::Account,
    instruction::{AccountMeta, Instruction},
    pubkey::Pubkey,
};

#[test]
fn test_initialize_instruction() {
    let program_id = Pubkey::new_unique();
    let mollusk = Mollusk::new(&program_id, "target/deploy/my_program");

    let new_account_key = Pubkey::new_unique();
    let signer_key = Pubkey::new_unique();

    let instruction = Instruction {
        program_id,
        accounts: vec![
            AccountMeta::new(new_account_key, true),
            AccountMeta::new(signer_key, true),
            AccountMeta::new_readonly(solana_sdk::system_program::id(), false),
        ],
        data: instruction_data,
    };

    let accounts = vec![
        (new_account_key, Account::default()),
        (signer_key, Account { lamports: 1_000_000_000, ..Account::default() }),
        (solana_sdk::system_program::id(), Account::default()),
    ];

    let result = mollusk.process_instruction(&instruction, &accounts);
    assert!(!result.program_result.is_err());
}</code></pre>

<h3>Mollusk vs LiteSVM</h3>
<table>
  <thead><tr><th>Feature</th><th>Mollusk</th><th>LiteSVM</th></tr></thead>
  <tbody>
    <tr><td>Scope</td><td>Single instruction</td><td>Full transactions</td></tr>
    <tr><td>CPI support</td><td>Limited</td><td>Full</td></tr>
    <tr><td>Speed</td><td>Very fast</td><td>Fast</td></tr>
    <tr><td>Best for</td><td>Unit tests per instruction</td><td>Integration tests with CPIs</td></tr>
  </tbody>
</table>

<p>Reference: <a href="https://www.anchor-lang.com/docs/testing/mollusk" target="_blank">Mollusk Docs</a></p>
`,
    },
    // ─── Lesson 3: Write Tests Challenge ────────────────
    {
      title: "Write an Integration Test",
      description:
        "Write a TypeScript integration test for a counter program.",
      type: "challenge",
      duration: "25 min",
      challenge: {
        prompt:
          "Complete the integration test for a counter program. Test both initialize and increment instructions.",
        objectives: [
          "Derive the counter PDA",
          "Call initialize and verify count is 0",
          "Call increment and verify count is 1",
        ],
        starterCode: `import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { expect } from "chai";
import { Counter } from "../target/types/counter";

describe("counter", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.Counter as Program<Counter>;

  it("initializes the counter", async () => {
    // TODO: Derive counter PDA
    // TODO: Call initialize
    // TODO: Fetch and assert count === 0
  });

  it("increments the counter", async () => {
    // TODO: Derive counter PDA
    // TODO: Call increment
    // TODO: Fetch and assert count === 1
  });
});`,
        language: "typescript",
        solution: `import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { expect } from "chai";
import { Counter } from "../target/types/counter";

describe("counter", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.Counter as Program<Counter>;

  const [counterPda] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("counter"), provider.wallet.publicKey.toBuffer()],
    program.programId
  );

  it("initializes the counter", async () => {
    await program.methods
      .initialize()
      .accounts({
        user: provider.wallet.publicKey,
        counter: counterPda,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    const account = await program.account.counter.fetch(counterPda);
    expect(account.count.toNumber()).to.equal(0);
  });

  it("increments the counter", async () => {
    await program.methods
      .increment()
      .accounts({
        user: provider.wallet.publicKey,
        counter: counterPda,
      })
      .rpc();

    const account = await program.account.counter.fetch(counterPda);
    expect(account.count.toNumber()).to.equal(1);
  });
});`,
        hints: [
          "Derive PDA with PublicKey.findProgramAddressSync([Buffer.from('counter'), pubkey.toBuffer()], programId)",
          "Use program.methods.initialize().accounts({...}).rpc()",
          "Fetch state with program.account.counter.fetch(pda)",
        ],
        testCases: [
          {
            id: "tc-1",
            name: "Derives counter PDA",
            expectedOutput: "findProgramAddressSync",
            hidden: false,
          },
          {
            id: "tc-2",
            name: "Fetches and asserts state",
            expectedOutput: "expect",
            hidden: false,
          },
        ],
      },
    },
  ],
};
