import { CourseModule } from "../anchor-course/types";

export const MODULE_PYTHON_SDK: CourseModule = {
  title: "Solana Python SDK",
  description:
    "Build Solana clients with the community Python SDK (solana-py and solders)",
  lessons: [
    {
      title: "Python SDK Overview",
      description: "Introduction to Solana development with Python",
      type: "content",
      content: `<h2>Solana Python SDK</h2><p>The community Python SDK lets you interact with Solana from Python applications — useful for scripting, data analysis, trading bots, and backend services.</p><h3>Packages</h3><ul><li><strong>solana-py</strong> — high-level RPC client (pip install solana)</li><li><strong>solders</strong> — low-level Rust-powered Python bindings (fast serialization)</li><li><strong>anchorpy</strong> — Anchor IDL integration for Python</li></ul><h3>Installation</h3><pre><code>pip install solana solders anchorpy</code></pre><h3>Quick Example</h3><pre><code>from solana.rpc.api import Client
from solders.pubkey import Pubkey

client = Client("https://api.devnet.solana.com")

# Get balance
pubkey = Pubkey.from_string("YourPublicKeyHere")
balance = client.get_balance(pubkey)
print(f"Balance: {balance.value / 1e9} SOL")</code></pre>`,
      xp: 30,
    },
    {
      title: "RPC Client & Queries",
      description: "Querying the Solana blockchain from Python using solana-py",
      type: "content",
      content: `<h2>RPC Client &amp; Queries</h2><h3>Synchronous Client</h3><pre><code>from solana.rpc.api import Client

client = Client("https://api.devnet.solana.com")

# Get latest blockhash
blockhash_resp = client.get_latest_blockhash()
blockhash = blockhash_resp.value.blockhash

# Get account info
account_info = client.get_account_info(pubkey)
if account_info.value:
    print(f"Owner: {account_info.value.owner}")
    print(f"Lamports: {account_info.value.lamports}")

# Get slot
slot = client.get_slot()

# Get multiple accounts
accounts = client.get_multiple_accounts([pubkey1, pubkey2])</code></pre><h3>Async Client</h3><pre><code>from solana.rpc.async_api import AsyncClient
import asyncio

async def main():
    async with AsyncClient("https://api.devnet.solana.com") as client:
        balance = await client.get_balance(pubkey)
        print(f"Balance: {balance.value}")

asyncio.run(main())</code></pre>`,
      xp: 30,
    },
    {
      title: "Transactions in Python",
      description: "Building and sending transactions with solders and solana-py",
      type: "content",
      content: `<h2>Transactions in Python</h2><h3>Simple SOL Transfer</h3><pre><code>from solders.keypair import Keypair
from solders.system_program import TransferParams, transfer
from solana.rpc.api import Client
from solana.transaction import Transaction

# Create client and keypair
client = Client("https://api.devnet.solana.com")
sender = Keypair()  # or Keypair.from_seed(bytes)

# Build transfer instruction
ix = transfer(TransferParams(
    from_pubkey=sender.pubkey(),
    to_pubkey=recipient_pubkey,
    lamports=1_000_000_000,  # 1 SOL
))

# Create and send transaction
blockhash = client.get_latest_blockhash().value.blockhash
tx = Transaction(recent_blockhash=blockhash, fee_payer=sender.pubkey())
tx.add(ix)
tx.sign(sender)

result = client.send_transaction(tx, sender)
print(f"Signature: {result.value}")</code></pre><h3>Using AnchorPy</h3><pre><code>from anchorpy import Provider, Program, Wallet

# Load program from IDL
provider = Provider.env()
program = Program.from_idl("path/to/idl.json", provider)

# Call an instruction
await program.rpc["initialize"](ctx=...)</code></pre>`,
      xp: 30,
    },
  ],
};
