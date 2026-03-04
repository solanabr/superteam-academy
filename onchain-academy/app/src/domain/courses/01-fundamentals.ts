import { Course } from "../models";

export const courseFundamentals: Course = {
  id: "solana-bootcamp-fundamentals",
  slug: "solana-bootcamp-fundamentals",
  title: "Course 1: Solana Fundamentals & First Programs",
  description: "Start the official 2024 Solana Developer Bootcamp. Master the absolute basics of blockchain, cryptography, and write your first 3 Solana programs: Favorites, Voting, and Blinks.",
  difficulty: "Beginner",
  durationHours: 12,
  xpReward: 1500,
  track: "Core Bootcamp",
  thumbnailUrl: "https://images.unsplash.com/photo-1639762681485-074b7f4ec651?auto=format&fit=crop&q=80&w=800&h=400",
  lessons: [
    {
      id: "f1-1",
      title: "Welcome to the Bootcamp",
      moduleTitle: "Module 1: Introduction",
      durationMinutes: 15,
      type: "content",
      markdown: `Video: https://www.youtube.com/watch?v=amAq-WHAFs8&t=0s

## Welcome to the official Solana Developer Bootcamp 2024!

In this first section, our instructors—Jacob Creech, Brianna Migliaccio, and Mike MacCana—will introduce the course structure, the goals of the bootcamp, and what you will be building.

### What to Expect
This bootcamp is designed to take you from absolute zero to a competent Solana full-stack developer. By the end of this course, you will have built **nine complete projects**, including:

*   **A Favorites Program:** Storing personal data on-chain.
*   **A Voting App:** Managing decentralized state.
*   **A CRUD App:** Full database-like operations on-chain.
*   **Tokens & NFTs:** Creating custom digital assets.
*   **An AMM Swap & Token Lottery:** Advanced DeFi concepts.

### Prerequisites
Before we begin, you do not need any prior blockchain experience, but you should be familiar with:
1.  **TypeScript & React:** For building the front-ends.
2.  **Basic Rust:** (Though we will teach you what you need along the way).
3.  **Command Line:** Navigating terminals and installing packages.

Get ready to dive into the fastest blockchain in the world. Next up, we will cover the core architecture of Solana!`,
      starterCode: "",
      testCases: [],
      exam: {
        question: "Who are the instructors for the Solana Developer Bootcamp 2024?",
        options: ["Only Jacob Creech", "Jacob Creech, Brianna Migliaccio, and Mike MacCana", "Anatoly Yakovenko"],
        correctOptionIndex: 1,
      },
    },
    {
      id: "f1-2",
      title: "Blockchain Basics & Architecture",
      moduleTitle: "Module 1: Introduction",
      durationMinutes: 45,
      type: "content",
      markdown: `Video: https://www.youtube.com/watch?v=amAq-WHAFs8&t=186s

## The Architecture of Solana

Solana is fundamentally different from other blockchains like Ethereum or Bitcoin. Instead of relying on a global mempool where miners choose the highest-paying transactions, Solana uses several core innovations to achieve **high throughput and low latency**.

### Proof of History (PoH)
The most critical innovation is **Proof of History**. 
Think of PoH as a cryptographic clock. Instead of nodes communicating back and forth to agree on *when* a transaction happened, PoH allows the network to embed historical timestamps directly into the ledger using a recursive SHA-256 hashing function.

Because all validators trust this clock, they can process transactions continuously without waiting for other nodes to confirm blocks.

### The Account Model
On Ethereum, smart contracts are tightly coupled with their state (data). On Solana, **programs are stateless**. 
*   **Programs (Executable Accounts):** Store the compiled bytecode. They cannot store user data.
*   **Data Accounts:** Store state. When you execute a program, you must pass in the specific data accounts you want it to read or modify.

This separation allows Solana to execute thousands of transactions in parallel. If Transaction A touches Account X, and Transaction B touches Account Y, they can be processed at the exact same time by the runtime (Sealevel).

### Public Key Cryptography
Every user and account on Solana is identified by a **Keypair**:
*   **Public Key:** Your wallet address (starts with a base58 string).
*   **Private Key:** The secret you use to sign transactions and prove ownership.

Solana uses the **Ed25519** elliptic curve for its cryptography.`,
      starterCode: "",
      testCases: [],
      exam: {
        question: "What is Proof of History (PoH) in Solana?",
        options: ["A consensus mechanism that replaces Proof of Stake", "A cryptographic clock that helps nodes agree on the order of events", "A way to store historical transaction data off-chain"],
        correctOptionIndex: 1,
      },
    },
    {
      id: "f1-3",
      title: "Favorites Program: Setup & State",
      moduleTitle: "Module 2: Project 1 - Favorites",
      durationMinutes: 45,
      type: "content",
      markdown: `Video: https://www.youtube.com/watch?v=amAq-WHAFs8&t=622s

## Building Project 1: The Favorites Program

It's time to write some code! We are going to build a "Favorites" program using the **Anchor Framework**. Anchor is to Solana what Express.js is to Node.js—it abstracts away the boilerplate and makes development much safer.

### Project Setup
First, you would typically run \`anchor init favorites\` to generate a new workspace.

### Defining State
We want to store a user's favorite number, color, and a list of their hobbies on the blockchain. Because Solana programs are stateless, we must define a separate data structure (an **Account**) to hold this.

In Anchor, we use the \`#[account]\` macro to define this struct:

\`\`\`rust
use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Favorites {
    pub number: u64,
    #[max_len(50)]
    pub color: String,
    #[max_len(5, 50)]
    pub hobbies: Vec<String>,
}
\`\`\`

**What's happening here?**
1.  **\`#[account]\`**: Tells Anchor that this struct represents a data account. Anchor will automatically generate the code to serialize and deserialize this data.
2.  **\`#[derive(InitSpace)]\`**: A helpful macro that automatically calculates how many bytes of space this account will need on the blockchain. Because \`String\` and \`Vec\` can grow infinitely, we *must* bound them using \`#[max_len()]\` so the space calculator knows the maximum possible size.

In the next lesson, we will write the instruction that actually saves this data!
\n\nOpen-source source: https://github.com/solana-developers/developer-bootcamp-2024/tree/main/project-1-favorites`,
      starterCode: "",
      testCases: [],
      exam: {
        question: "What is the purpose of the #[account] macro in Anchor?",
        options: ["It defines a new token", "It tells Anchor to serialize and deserialize the struct as a Solana account", "It connects to the RPC node"],
        correctOptionIndex: 1,
      },
    },
    {
      id: "f1-4",
      title: "Favorites Program: Write Instruction",
      moduleTitle: "Module 2: Project 1 - Favorites",
      durationMinutes: 60,
      type: "challenge",
      markdown: `Video: https://www.youtube.com/watch?v=amAq-WHAFs8&t=1200s

## Writing the set_favorites Instruction

Now that we have our \`Favorites\` state struct, we need a way for users to write their data to it. In Solana, functions that can be called by users are called **Instructions**.

Every instruction in Anchor requires two things:
1.  **A Context Struct:** Defines *which* accounts the instruction will interact with and checks their security constraints.
2.  **The Logic Function:** The actual Rust code that modifies the data.

### The Context
We want to create a PDA (Program Derived Address) to store the user's favorites. The PDA will use the string \`"favorites"\` and the user's public key as seeds.

\`\`\`rust
#[derive(Accounts)]
pub struct SetFavorites<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        init_if_needed, 
        payer = user, 
        space = 8 + Favorites::INIT_SPACE, 
        seeds = [b"favorites", user.key().as_ref()],
        bump
    )]
    pub favorites: Account<'info, Favorites>,

    pub system_program: Program<'info, System>,
}
\`\`\`

### Your Challenge
Implement the actual \`set_favorites\` logic below. Take the parameters passed in by the user (\`number\`, \`color\`, \`hobbies\`) and save them to the \`favorites\` account from the context.`,
      starterCode: `#[program]
pub mod favorites {
    use super::*;
    pub fn set_favorites(ctx: Context<SetFavorites>, number: u64, color: String, hobbies: Vec<String>) -> Result<()> {
        // TODO: Save to ctx.accounts.favorites
        Ok(())
    }
}
`,
      testCases: ["Defines SetFavorites context struct", "Implements set_favorites logic", "Properly assigns values to the data account"],
    },
    {
      id: "f1-5",
      title: "Favorites Program: Testing",
      moduleTitle: "Module 2: Project 1 - Favorites",
      durationMinutes: 45,
      type: "content",
      markdown: `Video: https://www.youtube.com/watch?v=amAq-WHAFs8&t=1800s

## Testing Anchor Programs

Writing smart contracts without tests is incredibly dangerous. Once a program is on the mainnet, bugs can lead to millions of dollars lost. 

We will write our first integration test using **Mocha and Chai** (standard TypeScript testing libraries) using the \`@coral-xyz/anchor\` provider to ensure our state saves correctly to the local validator.

### The Testing Flow
When you run \`anchor test\`:
1. Anchor spins up a local Solana validator (\`solana-test-validator\`) in the background.
2. It compiles your Rust program into a \`.so\` binary.
3. It deploys the binary to the local validator.
4. It runs your TypeScript test files located in the \`tests/\` directory.

### Example Test
Here is how you call your program from the tests:

\`\`\`typescript
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Favorites } from "../target/types/favorites";
import { assert } from "chai";

describe("favorites", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());
  const program = anchor.workspace.Favorites as Program<Favorites>;

  it("Is saves user favorites", async () => {
    const user = anchor.web3.Keypair.generate();
    // ... request airdrop for user ...

    // Execute instruction
    await program.methods
      .setFavorites(new anchor.BN(42), "Blue", ["Coding", "Reading"])
      .accounts({ user: user.publicKey })
      .signers([user])
      .rpc();

    // Fetch the account
    const [favoritesPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("favorites"), user.publicKey.toBuffer()],
      program.programId
    );
    
    const account = await program.account.favorites.fetch(favoritesPda);
    assert.equal(account.color, "Blue");
  });
});
\`\`\`
`,
      starterCode: "",
      testCases: [],
      exam: {
        question: "Which framework is standard for testing Anchor programs?",
        options: ["Jest", "Mocha/Chai with TypeScript", "PyTest"],
        correctOptionIndex: 1,
      },
    },
    {
      id: "f1-6",
      title: "Voting App: Architecture",
      moduleTitle: "Module 3: Project 2 - Voting App",
      durationMinutes: 30,
      type: "content",
      markdown: `Video: https://www.youtube.com/watch?v=amAq-WHAFs8&t=2262s

## Project 2: Decentralized Voting

Moving on to Project 2. We are going to build a decentralized Voting App. This app will allow anyone to initialize a candidate and allow users to vote for them.

### Account Architecture
Before writing code, we must plan out the accounts:
1.  **Candidate Account (PDA):** We will use a Program Derived Address for the candidate. The seed will be the candidate's name (e.g., \`"solana"\`, \`"ethereum"\`). This ensures there is only ever *one* definitive account for a specific candidate name.
    *   *Fields:* \`candidate_name\` (String), \`candidate_votes\` (u64)
2.  **Voter Account (PDA):** If we want to prevent double-voting, we need to track who voted for whom. We can create a PDA using the voter's public key and the candidate's public key as seeds. If this account exists, the user has already voted.

In this lesson block, we will focus just on setting up the **Candidate Account** and incrementing the vote count.

\n\nOpen-source source: https://github.com/solana-developers/developer-bootcamp-2024/tree/main/project-2-voting`,
      starterCode: "",
      testCases: [],
      exam: {
        question: "Why do we use PDAs for candidates instead of Keypairs?",
        options: ["Because they are cheaper", "Because we want to programmatically find a candidate's account using their name as a deterministic seed", "To hide the vote count"],
        correctOptionIndex: 1,
      },
    },
    {
      id: "f1-7",
      title: "Voting App: Initialize Candidate",
      moduleTitle: "Module 3: Project 2 - Voting App",
      durationMinutes: 60,
      type: "challenge",
      markdown: `Video: https://www.youtube.com/watch?v=amAq-WHAFs8&t=3000s

## Challenge: Initialize Candidate

Implement the Initialize Candidate instruction. It should take a string (the candidate's name), derive the PDA, allocate space, and set the initial vote count to zero.

### Important Note on PDA Seeds
When using strings as seeds in Anchor constraints, you must convert them to bytes.

\`\`\`rust
#[account(
    init,
    payer = signer,
    space = 8 + Candidate::INIT_SPACE,
    seeds = [candidate_name.as_bytes()],
    bump
)]
pub candidate: Account<'info, Candidate>,
\`\`\`

If your string is dynamic (passed as an argument), you must declare it in the \`#[instruction()]\` macro at the top of the struct so the macro knows where the variable comes from!`,
      starterCode: `#[derive(Accounts)]
#[instruction(candidate_name: String)]
pub struct InitializeCandidate<'info> {
    // TODO: Init Candidate PDA
}
`,
      testCases: ["Initializes candidate account with 0 votes", "Allocates correct space", "Uses candidate name as PDA seed"],
    },
    {
      id: "f1-8",
      title: "Voting App: Vote Logic",
      moduleTitle: "Module 3: Project 2 - Voting App",
      durationMinutes: 60,
      type: "challenge",
      markdown: `Video: https://www.youtube.com/watch?v=amAq-WHAFs8&t=4500s

## Challenge: The Voting Logic

Implement the voting mechanism. Ensure the candidate account is loaded as mutable (\`#[account(mut)]\`), and simply increment the \`candidate_votes\` field by 1.

You must derive the candidate PDA exactly as you did in the initialization step so Anchor knows *which* candidate account you intend to modify.`,
      starterCode: `#[derive(Accounts)]
#[instruction(candidate_name: String)]
pub struct Vote<'info> {
    // TODO: Load candidate PDA as mut
}

pub fn vote(ctx: Context<Vote>, candidate_name: String) -> Result<()> {
    // TODO: Increment vote
    Ok(())
}
`,
      testCases: ["Loads Candidate PDA as mutable", "Increments vote count by exactly 1", "Saves state correctly"],
    },
    {
      id: "f1-9",
      title: "Blinks & Actions: Introduction",
      moduleTitle: "Module 4: Project 3 - Blinks",
      durationMinutes: 40,
      type: "content",
      markdown: `Video: https://www.youtube.com/watch?v=amAq-WHAFs8&t=6632s

## Project 3: Solana Actions & Blinks

Solana Actions and Blinks (Blockchain Links) are revolutionizing Web3 UX by allowing users to execute on-chain transactions directly from any platform—like a Twitter feed or a Discord chat.

### Actions
An Action is simply an API endpoint that returns:
1.  **Metadata:** A title, icon URL, and description of what the action does.
2.  **Transaction:** When the user clicks a button, the endpoint builds a Solana transaction (e.g., calling our Voting program) and returns it serialized.

### Blinks
A Blink is the front-end client (like a Chrome extension or built into Phantom wallet) that detects an Action URL, reads the metadata, and renders a beautiful UI card right in the feed.

When the user clicks "Vote" on the Twitter card, the Blink hits your Action POST endpoint, grabs the transaction, and asks the user to sign it.

\n\nOpen-source source: https://github.com/solana-developers/developer-bootcamp-2024/tree/main/project-3-blinks`,
      starterCode: "",
      testCases: [],
      exam: {
        question: "What is a Solana Blink?",
        options: ["A fast confirmation protocol", "A UI component that unfurls a Solana Action URL into an interactive interface (like on Twitter)", "A new token standard"],
        correctOptionIndex: 1,
      },
    },
    {
      id: "f1-10",
      title: "Blinks & Actions: Building the Endpoint",
      moduleTitle: "Module 4: Project 3 - Blinks",
      durationMinutes: 90,
      type: "challenge",
      markdown: `Video: https://www.youtube.com/watch?v=amAq-WHAFs8&t=7500s

## Challenge: Building the Action API

Build the actual Next.js API Route for the Blink.

### 1. The GET Request
Return the standard \`ActionGetResponse\` metadata:
\`\`\`json
{
  "title": "Vote for Solana",
  "icon": "https://example.com/icon.png",
  "description": "Vote for your favorite blockchain!",
  "label": "Vote"
}
\`\`\`

### 2. The POST Request
Extract the user's public key from the request body:
\`\`\`json
{
  "account": "UserPubKeyBase58..."
}
\`\`\`
Construct the voting transaction using \`@solana/web3.js\`, serialize it to base64, and return it.`,
      starterCode: `export async function GET(req: Request) {
  // TODO: Return action metadata (title, icon, description)
  return Response.json({});
}

export async function POST(req: Request) {
  // TODO: Return serialized transaction based on user interaction
  return Response.json({});
}
`,
      testCases: ["GET returns correct action spec metadata", "POST extracts user pubkey from body", "POST returns base64 serialized transaction"],
    }
  ]
};
