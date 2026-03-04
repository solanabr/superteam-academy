import { Course } from "../models";

export const courseFullstack: Course = {
  id: "fullstack-solana-dapps",
  slug: "fullstack-solana-dapps",
  title: "Course 4: Full-Stack dApp Development",
  description: "Connect your Rust programs to the real world. Learn to build production-ready frontends using React, Wallet Adapter, and Anchor. Master data fetching, writing state, and local testing.",
  difficulty: "Advanced",
  durationHours: 10,
  xpReward: 4000,
  track: "Full Stack",
  thumbnailUrl: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&q=80&w=800&h=400",
  lessons: [
    {
      id: "fs-1",
      title: "Environment Setup & CLI",
      moduleTitle: "Module 1: The Dev Environment",
      durationMinutes: 30,
      type: "content",
      markdown: `Video: https://www.youtube.com/watch?v=vUHF1X48zM4&t=55s

## Setting up your Dev Environment

Before we can build full-stack apps, we need to configure our machine. Unlike web development where you just need Node.js, Solana development requires a few more tools.

### 1. The Solana CLI
The Solana Command Line Interface is your primary tool for interacting with the network. It allows you to:
*   Generate wallets (\`solana-keygen new\`)
*   Airdrop devnet SOL (\`solana airdrop 1\`)
*   Deploy programs (\`solana program deploy\`)

### 2. The Local Validator
You don't want to test your smart contracts on the real network (even Devnet) immediately, because it's slow. Instead, you run a **local validator**. 

By typing \`solana-test-validator\` in your terminal, you spin up a completely isolated, ultra-fast Solana blockchain running locally on your computer.

### 3. Rust & Anchor
Install Rust (via \`rustup\`) and the Anchor framework. Anchor provides the \`anchor test\` command, which automatically spins up the test validator, compiles your Rust code, deploys it, and runs your TypeScript tests against it.`,
      starterCode: "",
      testCases: [],
      exam: {
        question: "Which command starts the local Solana testing network (validator) on your machine?",
        options: ["solana start", "anchor test", "solana-test-validator", "npm run dev"],
        correctOptionIndex: 2,
      },
    },
    {
      id: "fs-2",
      title: "Anchor Project & Development Flow",
      moduleTitle: "Module 1: The Dev Environment",
      durationMinutes: 45,
      type: "content",
      markdown: `Video: https://www.youtube.com/watch?v=vUHF1X48zM4&t=276s

## The Anchor Workspace

When you run \`anchor init my_project\`, Anchor generates a massive boilerplate repository. Let's break down the most important files:

### 1. \`programs/my_project/src/lib.rs\`
This is where your actual Rust smart contract lives. It contains your state structs, your instruction contexts, and your program logic.

### 2. \`Anchor.toml\`
This is the configuration file for your workspace. It defines:
*   The clusters (Localnet, Devnet, Mainnet).
*   The Program IDs (the public keys where your programs will be deployed).
*   Your testing scripts.

### 3. The IDL (Interface Description Language)
When you run \`anchor build\`, Anchor parses your Rust code and generates a JSON file called the IDL. 
**This is the most important file for frontend developers.** The IDL tells your React app exactly what instructions your program has, what arguments they expect, and what the state accounts look like.`,
      starterCode: "",
      testCases: [],
      exam: {
        question: "What does the command `anchor build` produce that is critical for front-end integration?",
        options: ["The React Native app", "The IDL (Interface Description Language) JSON file", "A new wallet private key", "The Solana CLI"],
        correctOptionIndex: 1,
      },
    },
    {
      id: "fs-3",
      title: "The Anchor Program Structure",
      moduleTitle: "Module 2: On-Chain Programs",
      durationMinutes: 60,
      type: "challenge",
      markdown: `Video: https://www.youtube.com/watch?v=vUHF1X48zM4&t=894s

## Challenge: The Counter Program

Let's write a simple "Counter" smart contract. This program will initialize a data account with a number, and provide an instruction to increment that number.

### Space Calculation
When you initialize an account, you must tell the Solana runtime exactly how many bytes of memory it needs.
*   **Discriminator:** Anchor always requires 8 bytes at the start of every account to identify its type.
*   **u64 (unsigned 64-bit integer):** Requires exactly 8 bytes.

So, the total space is \`8 + 8 = 16\` bytes!

\`\`\`rust
#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        init,
        payer = user,
        space = 8 + 8
    )]
    pub counter: Account<'info, Counter>,
    pub system_program: Program<'info, System>,
}
\`\`\`

Implement the logic to initialize the count to 0, and increment it by 1!`,
      starterCode: `#[program]
pub mod counter_app {
    use super::*;
    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        // TODO: set count to 0
        Ok(())
    }
    pub fn increment(ctx: Context<Increment>) -> Result<()> {
        // TODO: add 1 to count
        Ok(())
    }
}
`,
      testCases: ["Defines Initialize context with space calculation", "Implements initialize logic", "Implements increment logic successfully"],
    },
    {
      id: "fs-4",
      title: "How Data is Stored (PDAs)",
      moduleTitle: "Module 2: On-Chain Programs",
      durationMinutes: 45,
      type: "content",
      markdown: `Video: https://www.youtube.com/watch?v=vUHF1X48zM4&t=1870s

## Keypairs vs PDAs

When building applications, you have two choices for how to store data accounts:

### 1. Keypair Accounts
You can generate a random Keypair, use its public key as the account address, and save your data there.
**The Problem:** Because the address is random, your frontend has no idea where to find the data later unless you save that random public key in a centralized database (like MongoDB).

### 2. Program Derived Addresses (PDAs)
A PDA is an address generated deterministically using a string of "seeds" and your Program ID. 
For example, if you derive an account using the seeds \`["counter", user_public_key]\`, the resulting address will **always be exactly the same** for that specific user.

**The Solution:** Your frontend doesn't need a database! It can just ask the connected wallet for its public key, combine it with the string \`"counter"\`, and instantly find the user's data account on the blockchain.`,
      starterCode: "",
      testCases: [],
      exam: {
        question: "Which of the following is true about a Program Derived Address (PDA)?",
        options: ["It has a known private key", "It is derived from seeds and a program ID, and sits off the Ed25519 elliptic curve", "It can only store SOL, not custom data", "It requires 100 SOL to create"],
        correctOptionIndex: 1,
      },
    },
    {
      id: "fs-5",
      title: "Deploying and Upgrading Programs",
      moduleTitle: "Module 3: Deployment",
      durationMinutes: 30,
      type: "content",
      markdown: `Video: https://www.youtube.com/watch?v=vUHF1X48zM4&t=2480s

## Smart Contract Upgrades

On Ethereum, smart contracts are immutable. If you deploy a contract with a bug, you cannot fix it. You have to deploy a brand new contract and convince everyone to migrate.

**On Solana, programs are upgradeable by default.**

### The BPF Loader
When you run \`solana program deploy\`, the CLI uploads your compiled \`.so\` binary to a buffer account, and then the BPF Loader program marks that account as executable. 

### The Upgrade Authority
When you deploy, your wallet is marked as the **Upgrade Authority**. If you make changes to your Rust code, you can simply run \`solana program deploy\` again. The network will replace the old bytecode with the new bytecode at the exact same Program ID.

If you want to make your program truly immutable, you can permanently revoke the upgrade authority.`,
      starterCode: "",
      testCases: [],
      exam: {
        question: "Who has the permission to upgrade a deployed Solana program by default?",
        options: ["Any validator", "The Upgrade Authority (usually the developer's wallet who deployed it)", "It is impossible to upgrade programs", "The Solana Foundation"],
        correctOptionIndex: 1,
      },
    },
    {
      id: "fs-6",
      title: "React Frontend & Wallet Connect",
      moduleTitle: "Module 4: Client Integration",
      durationMinutes: 60,
      type: "challenge",
      markdown: `Video: https://www.youtube.com/watch?v=vUHF1X48zM4&t=3045s

## Challenge: The Wallet Adapter

It's time to build the frontend! We will use React/Next.js. 

To allow users to connect Phantom, Solflare, or Backpack to your app, you use the **Solana Wallet Adapter**. 

You must wrap your entire application in two Context Providers:
1.  **\`ConnectionProvider\`**: Connects your app to the RPC node (e.g., Devnet).
2.  **\`WalletProvider\`**: Manages the state of the connected browser wallet.

\`\`\`tsx
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui';

export function App() {
  return (
    <ConnectionProvider endpoint="https://api.devnet.solana.com">
      <WalletProvider wallets={[]} autoConnect>
        <WalletModalProvider>
            {/* Your App Here */}
            <WalletMultiButton />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
\`\`\`

Set up the providers and render the \`WalletMultiButton\`!`,
      starterCode: `import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui';

export function AppProvider({ children }) {
  // TODO: Setup providers for devnet and return wrapped children with WalletMultiButton
  return <div>{children}</div>;
}
`,
      testCases: ["Includes ConnectionProvider with endpoint", "Includes WalletProvider", "Renders WalletMultiButton component"],
    },
    {
      id: "fs-7",
      title: "Reading Data from the Blockchain",
      moduleTitle: "Module 4: Client Integration",
      durationMinutes: 60,
      type: "challenge",
      markdown: `Video: https://www.youtube.com/watch?v=vUHF1X48zM4&t=3250s

## Challenge: Fetching State

To read data from our program, we use the \`@coral-xyz/anchor\` library on the frontend. 

By passing our generated IDL JSON into the \`Program\` class, Anchor automatically creates a fully typed TypeScript client for us!

\`\`\`typescript
import { Program } from '@coral-xyz/anchor';
import idl from './idl.json';

const program = new Program(idl, programId, provider);

// Fetch a single account
const account = await program.account.counter.fetch(counterPubkey);
console.log(account.count.toNumber());

// Fetch ALL counter accounts on the network
const allAccounts = await program.account.counter.all();
\`\`\`

Implement a function that fetches a specific counter account's state.`,
      starterCode: `import { Program, AnchorProvider } from '@coral-xyz/anchor';

export async function fetchCounterState(program: Program, accountPubkey: string) {
  // TODO: Fetch the specific account data using the program instance
  return { count: 0 };
}
`,
      testCases: ["Uses program.account API", "Correctly passes the account public key", "Returns the deserialized state object"],
    },
    {
      id: "fs-8",
      title: "Writing Data to the Blockchain",
      moduleTitle: "Module 4: Client Integration",
      durationMinutes: 90,
      type: "challenge",
      markdown: `Video: https://www.youtube.com/watch?v=vUHF1X48zM4&t=3467s

## Challenge: Sending Transactions

To modify state, we must construct a transaction and ask the user to sign it. Anchor makes this incredibly easy via the \`.methods\` API.

You call the instruction name, pass any arguments, supply the required accounts in the \`.accounts({})\` object, and call \`.rpc()\`. 

The \`.rpc()\` function automatically:
1. Builds the transaction.
2. Prompts the connected wallet to sign it.
3. Sends it to the RPC node.
4. Waits for the network signature.

\`\`\`typescript
const txSignature = await program.methods
  .increment()
  .accounts({
    counter: counterPubkey,
    user: provider.wallet.publicKey,
  })
  .rpc();

console.log("Transaction sent:", txSignature);
\`\`\`

Implement the \`increment\` transaction!`,
      starterCode: `export async function submitIncrementTx(program: Program, counterPubkey: string) {
  // TODO: Call program.methods.increment().accounts({ ... }).rpc()
  return { signature: '' };
}
`,
      testCases: ["Uses program.methods.increment()", "Provides correct accounts context", "Invokes .rpc() to sign and send the transaction"],
    }
  ]
};
