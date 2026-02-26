import { CourseModule } from "../anchor-course/types";

export const MODULE_RUST_SDK_FUNDAMENTALS: CourseModule = {
  title: "Rust SDK Fundamentals",
  description:
    "Core concepts for interacting with Solana using the official Rust crates",
  lessons: [
    {
      title: "Rust SDK Overview",
      description: "Introduction to the official Solana Rust SDK and its crate ecosystem",
      type: "content",
      content: `<h2>Solana Rust SDK</h2><p>The official Solana Rust SDK is the most performant way to interact with Solana. It's used for on-chain programs, off-chain clients, and tooling.</p><h3>Key Crates</h3><ul><li><strong>solana-sdk</strong> — core types: Pubkey, Keypair, Transaction, Instruction</li><li><strong>solana-client</strong> — RPC client for querying and sending transactions</li><li><strong>solana-program</strong> — on-chain program development primitives</li><li><strong>solana-transaction-status</strong> — parsing transaction results</li><li><strong>solana-account-decoder</strong> — decoding account data</li></ul><h3>Installation</h3><pre><code>[dependencies]
solana-sdk = "2.2"
solana-client = "2.2"</code></pre><h3>When to Use Rust</h3><ul><li>High-performance off-chain clients (bots, indexers)</li><li>On-chain program development (native or Anchor)</li><li>Custom CLIs and tooling</li><li>Backend services that need speed</li></ul>`,
      xp: 30,
    },
    {
      title: "Keypairs & Addresses",
      description: "Working with Pubkey, Keypair, and address derivation in Rust",
      type: "content",
      content: `<h2>Keypairs &amp; Addresses</h2><p>Understanding key management is fundamental to any Solana Rust application.</p><h3>Creating Keypairs</h3><pre><code>use solana_sdk::signer::keypair::Keypair;
use solana_sdk::signer::Signer;

// Generate a new random keypair
let keypair = Keypair::new();
println!("Public key: {}", keypair.pubkey());

// From a seed (deterministic)
let seed: [u8; 32] = [1; 32];
let keypair = Keypair::from_seed(&seed).unwrap();

// From a JSON file (like solana-keygen output)
let keypair = solana_sdk::signer::keypair::read_keypair_file("wallet.json").unwrap();</code></pre><h3>Pubkey Operations</h3><pre><code>use solana_sdk::pubkey::Pubkey;
use std::str::FromStr;

// From string
let pubkey = Pubkey::from_str("11111111111111111111111111111111").unwrap();

// PDA derivation
let (pda, bump) = Pubkey::find_program_address(
    &[b"seed", user.as_ref()],
    &program_id,
);

// Create with seed
let derived = Pubkey::create_with_seed(&base, "seed", &owner).unwrap();</code></pre>`,
      xp: 30,
    },
    {
      title: "RPC Client",
      description: "Querying the Solana network with RpcClient",
      type: "content",
      content: `<h2>RPC Client</h2><p>The <code>solana-client</code> crate provides <code>RpcClient</code> for interacting with Solana validators.</p><h3>Setup</h3><pre><code>use solana_client::rpc_client::RpcClient;
use solana_sdk::commitment_config::CommitmentConfig;

let client = RpcClient::new_with_commitment(
    "https://api.devnet.solana.com".to_string(),
    CommitmentConfig::confirmed(),
);</code></pre><h3>Common Queries</h3><pre><code>// Get balance (in lamports)
let balance = client.get_balance(&pubkey)?;
println!("Balance: {} SOL", balance as f64 / 1e9);

// Get account info
let account = client.get_account(&pubkey)?;
println!("Owner: {}", account.owner);
println!("Data length: {}", account.data.len());

// Get latest blockhash
let blockhash = client.get_latest_blockhash()?;

// Get slot
let slot = client.get_slot()?;

// Get multiple accounts
let accounts = client.get_multiple_accounts(&[pubkey1, pubkey2])?;</code></pre><h3>Async Client</h3><pre><code>use solana_client::nonblocking::rpc_client::RpcClient as AsyncRpcClient;

let client = AsyncRpcClient::new("https://api.devnet.solana.com".to_string());
let balance = client.get_balance(&pubkey).await?;</code></pre>`,
      xp: 30,
    },
    {
      title: "Transactions in Rust",
      description: "Building, signing, and sending transactions with the Rust SDK",
      type: "content",
      content: `<h2>Building Transactions</h2><p>Transactions bundle one or more instructions for atomic execution on Solana.</p><h3>Simple Transfer</h3><pre><code>use solana_sdk::{
    system_instruction,
    transaction::Transaction,
    signer::Signer,
};

let instruction = system_instruction::transfer(
    &payer.pubkey(),
    &recipient,
    1_000_000_000, // 1 SOL in lamports
);

let blockhash = client.get_latest_blockhash()?;
let tx = Transaction::new_signed_with_payer(
    &[instruction],
    Some(&payer.pubkey()),
    &[&payer],
    blockhash,
);

let signature = client.send_and_confirm_transaction(&tx)?;
println!("Signature: {}", signature);</code></pre><h3>Multiple Instructions</h3><pre><code>let ix1 = system_instruction::transfer(&payer.pubkey(), &alice, 500_000_000);
let ix2 = system_instruction::transfer(&payer.pubkey(), &bob, 300_000_000);

let tx = Transaction::new_signed_with_payer(
    &[ix1, ix2],
    Some(&payer.pubkey()),
    &[&payer],
    blockhash,
);</code></pre><h3>Versioned Transactions</h3><pre><code>use solana_sdk::message::{v0::Message as V0Message, VersionedMessage};
use solana_sdk::transaction::VersionedTransaction;

let msg = V0Message::try_compile(
    &payer.pubkey(),
    &[instruction],
    &[], // address lookup tables
    blockhash,
)?;

let tx = VersionedTransaction::try_new(
    VersionedMessage::V0(msg),
    &[&payer],
)?;</code></pre>`,
      xp: 30,
    },
  ],
};
