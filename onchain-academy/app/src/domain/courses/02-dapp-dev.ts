import { Course } from "../models";

export const courseDappDev: Course = {
  id: "anchor-dapp-development",
  slug: "anchor-dapp-development",
  title: "Course 2: dApp Dev, Tokens & NFTs",
  description: "Continue the official Bootcamp. Learn Create, Read, Update, Delete (CRUD) operations on-chain. Then, master the SPL Token program to mint fungible tokens and Metaplex to create NFTs.",
  difficulty: "Intermediate",
  durationHours: 15,
  xpReward: 2000,
  track: "Core Bootcamp",
  thumbnailUrl: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&q=80&w=800&h=400",
  lessons: [
    {
      id: "d2-1",
      title: "CRUD App: Introduction",
      moduleTitle: "Module 1: Advanced State (CRUD)",
      durationMinutes: 30,
      type: "content",
      markdown: `Video: https://www.youtube.com/watch?v=amAq-WHAFs8&t=9105s

## Building an On-Chain Journal (CRUD App)

Welcome to Project 4. We are going to build a Journal App. This app will allow users to Create, Read, Update, and Delete journal entries entirely on the Solana blockchain.

### Why is this hard?
In a traditional database like PostgreSQL, updating or deleting rows is trivial. On a blockchain, data is stored in **Accounts**, and you must pay **Rent** (in Lamports) for the space your data occupies.

If you update a string on-chain and it becomes *longer* than the original string, you must **reallocate space** for the account and transfer more rent to it. If you delete an account, you want to get that rent money back!

### Defining the State
We will start by defining the \`JournalEntryState\` struct.

\`\`\`rust
#[account]
#[derive(InitSpace)]
pub struct JournalEntryState {
    pub owner: Pubkey,
    #[max_len(50)]
    pub title: String,
    #[max_len(1000)]
    pub message: String,
}
\`\`\`

We use \`#[max_len()]\` again because Anchor needs to know the absolute maximum size this account could ever be to calculate \`INIT_SPACE\`.

\n\nOpen-source source: https://github.com/solana-developers/developer-bootcamp-2024/tree/main/project-4-crud-app`,
      starterCode: "",
      testCases: [],
      exam: {
        question: "In Solana, how do you completely 'Delete' an account?",
        options: ["You can't delete accounts, they live forever", "You use the #[account(close = receiver)] constraint, which zeros out the data and transfers the rent lamports back to a receiver", "You overwrite the data with zeros manually"],
        correctOptionIndex: 1,
      },
    },
    {
      id: "d2-2",
      title: "CRUD App: Create Entry",
      moduleTitle: "Module 1: Advanced State (CRUD)",
      durationMinutes: 60,
      type: "challenge",
      markdown: `Video: https://www.youtube.com/watch?v=amAq-WHAFs8&t=10000s

## Challenge: The Create Instruction

Write the \`create_entry\` instruction. You must initialize a PDA using the author's public key and the journal title as seeds. 

### Dynamic Space Allocation
While we defined \`#[max_len(1000)]\` for the message, if the user only writes "Hello", allocating 1000 bytes is a waste of rent! We should only allocate the space *actually* needed for the string they pass in.

A string in Rust requires \`4 bytes\` to store its length, plus \`1 byte\` for every character.

\`\`\`rust
#[derive(Accounts)]
#[instruction(title: String, message: String)]
pub struct CreateEntry<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        init,
        payer = owner,
        // 8 (discriminator) + 32 (pubkey) + (4 + title.len()) + (4 + message.len())
        space = 8 + 32 + (4 + title.len()) + (4 + message.len()),
        seeds = [title.as_bytes(), owner.key().as_ref()],
        bump
    )]
    pub journal_entry: Account<'info, JournalEntryState>,
    pub system_program: Program<'info, System>,
}
\`\`\`

Implement the logic to save the \`title\`, \`message\`, and \`owner\` to the PDA!`,
      starterCode: `#[derive(Accounts)]
#[instruction(title: String, message: String)]
pub struct CreateEntry<'info> {
    // TODO: Define init constraints and seeds
}

pub fn create_entry(ctx: Context<CreateEntry>, title: String, message: String) -> Result<()> {
    // TODO: Save state
    Ok(())
}
`,
      testCases: ["Calculates dynamic space for string", "Initializes PDA with correct seeds", "Saves title and message"],
    },
    {
      id: "d2-3",
      title: "CRUD App: Update Entry (Realloc)",
      moduleTitle: "Module 1: Advanced State (CRUD)",
      durationMinutes: 90,
      type: "challenge",
      markdown: `Video: https://www.youtube.com/watch?v=amAq-WHAFs8&t=11500s

## Challenge: The Update Instruction

Updating data in Solana requires resizing the account if the new string is longer. In Anchor, we use the \`realloc\` constraint to resize the account dynamically.

\`\`\`rust
#[account(
    mut,
    seeds = [title.as_bytes(), owner.key().as_ref()],
    bump,
    realloc = 8 + 32 + (4 + title.len()) + (4 + new_message.len()),
    realloc::payer = owner,
    realloc::zero = true,
)]
pub journal_entry: Account<'info, JournalEntryState>,
\`\`\`

### What do these constraints do?
*   **\`realloc\`**: Tells Anchor to change the size of the account to the new calculated size.
*   **\`realloc::payer\`**: If the account gets bigger, who pays the extra rent? (The owner).
*   **\`realloc::zero\`**: If the account gets smaller, Anchor zeroes out the old data so garbage bytes don't get left behind.

Implement the context and the update logic.`,
      starterCode: `#[derive(Accounts)]
#[instruction(title: String, new_message: String)]
pub struct UpdateEntry<'info> {
    // TODO: Use mut and realloc constraints
}

pub fn update_entry(ctx: Context<UpdateEntry>, title: String, new_message: String) -> Result<()> {
    // TODO: Update state
    Ok(())
}
`,
      testCases: ["Uses realloc macro", "Handles rent differences", "Successfully updates message"],
    },
    {
      id: "d2-4",
      title: "Tokens: SPL Introduction",
      moduleTitle: "Module 2: Tokens (SPL)",
      durationMinutes: 45,
      type: "content",
      markdown: `Video: https://www.youtube.com/watch?v=amAq-WHAFs8&t=12891s

## Creating SPL Tokens

Welcome to Project 5! We are going to dive into the **Solana Program Library (SPL) Token program**.

On Ethereum, every token (like USDC, SHIB, PEPE) is a completely separate smart contract deploying its own copy of the ERC-20 standard.

On Solana, there is only **one** master Token Program deployed by the network. Every token in the ecosystem uses this exact same program.

### Mint Accounts vs Token Accounts
To create a token, you create a **Mint Account**. This account stores the global state of the token:
*   Supply (How many exist)
*   Decimals (Divisibility)
*   Mint Authority (Who is allowed to create more)

To *hold* a token, a user needs a **Token Account**. A Token Account tracks how much of a specific Mint Account's token a user owns. 

### Associated Token Accounts (ATAs)
Because you could technically create infinite Token Accounts for the same Mint, Solana created the **ATA standard**. An ATA is a PDA derived from a User's Wallet Address and the Token's Mint Address. This ensures a user only ever has *one definitive account* for a specific token, making transfers predictable.

\n\nOpen-source source: https://github.com/solana-developers/developer-bootcamp-2024/tree/main/project-5-tokens`,
      starterCode: "",
      testCases: [],
      exam: {
        question: "What is an Associated Token Account (ATA)?",
        options: ["A randomly generated wallet", "A deterministic Token Account derived from a user's wallet address and a specific Token Mint address", "A special account for staking SOL"],
        correctOptionIndex: 1,
      },
    },
    {
      id: "d2-5",
      title: "Tokens: Cross-Program Invocations",
      moduleTitle: "Module 2: Tokens (SPL)",
      durationMinutes: 50,
      type: "content",
      markdown: `Video: https://www.youtube.com/watch?v=amAq-WHAFs8&t=13200s

## Cross-Program Invocations (CPIs)

Because we want our custom Anchor program to mint tokens, we have a problem: Our program doesn't own the Token logic. The official SPL Token program does.

To solve this, Solana allows programs to call instructions on *other* programs directly on-chain. This is called a **Cross-Program Invocation (CPI)**.

### CpiContext in Anchor
To execute a CPI in Anchor, you must construct a \`CpiContext\`. This context tells Anchor:
1.  **Which program** you are calling (e.g., the SPL Token program).
2.  **Which accounts** you are passing to that program.

\`\`\`rust
let cpi_program = ctx.accounts.token_program.to_account_info();
let cpi_accounts = MintTo {
    mint: ctx.accounts.mint_account.to_account_info(),
    to: ctx.accounts.user_token_account.to_account_info(),
    authority: ctx.accounts.mint_authority.to_account_info(),
};
let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

// Execute the CPI!
token::mint_to(cpi_ctx, amount)?;
\`\`\`

In the next lesson, you will write this logic yourself!`,
      starterCode: "",
      testCases: [],
      exam: {
        question: "What does CPI stand for in Solana?",
        options: ["Central Processing Interface", "Cross-Program Invocation (calling one program from another)", "Compute Performance Index"],
        correctOptionIndex: 1,
      },
    },
    {
      id: "d2-6",
      title: "Tokens: Minting via CPI",
      moduleTitle: "Module 2: Tokens (SPL)",
      durationMinutes: 90,
      type: "challenge",
      markdown: `Video: https://www.youtube.com/watch?v=amAq-WHAFs8&t=13500s

## Challenge: Mint Tokens via CPI

Write an instruction that mints your custom SPL Token to a user's ATA. 

You must import the \`anchor_spl\` crate and use the \`token::mint_to\` function. 

### Decimals Matter!
Remember that tokens on blockchains don't use floating-point numbers. If your token has 6 decimals, and you want to mint "1" token, you actually need to pass \`1,000,000\` (1 * 10^6) as the \`amount\`!

\`\`\`rust
let amount_with_decimals = amount * 10_u64.pow(ctx.accounts.mint.decimals as u32);
\`\`\`

Implement the \`mint_token\` function below!`,
      starterCode: `use anchor_spl::token::{self, MintTo, Token, TokenAccount, Mint};

pub fn mint_token(ctx: Context<MintToken>, amount: u64) -> Result<()> {
  // TODO: Create CpiContext
  // TODO: Call token::mint_to
  Ok(())
}
`,
      testCases: ["Creates valid CpiContext", "Invokes mint_to successfully", "Increases user balance by requested amount"],
    },
    {
      id: "d2-7",
      title: "NFTs: Metaplex Introduction",
      moduleTitle: "Module 3: Non-Fungible Tokens (NFTs)",
      durationMinutes: 45,
      type: "content",
      markdown: `Video: https://www.youtube.com/watch?v=amAq-WHAFs8&t=13752s

## What is an NFT on Solana?

Welcome to Project 6. If you want to create a Non-Fungible Token (NFT) on Solana, how do you do it?

An NFT is fundamentally just a regular SPL Token that has:
1.  **Supply of exactly 1.**
2.  **Decimals set to 0** (so it can't be divided into fractions).
3.  **A Metadata Account** attached to it.

### The Metaplex Standard
The SPL Token program handles balances, but it does *not* store names, symbols, or images. To add these, the ecosystem adopted the **Metaplex Token Metadata Program**.

When you create a Mint Account, you also create a Metaplex Metadata Account (a PDA derived from the Mint address) that stores:
*   Name (e.g., "Mad Lads #1234")
*   Symbol (e.g., "MAD")
*   URI (A link to an off-chain JSON file hosted on Arweave or IPFS that contains the actual image URL and attributes).

\n\nOpen-source source: https://github.com/solana-developers/developer-bootcamp-2024/tree/main/project-6-nfts`,
      starterCode: "",
      testCases: [],
      exam: {
        question: "Which program is the standard for attaching names, symbols, and URIs to tokens on Solana?",
        options: ["The System Program", "The Metaplex Token Metadata Program", "The Serum Program"],
        correctOptionIndex: 1,
      },
    },
    {
      id: "d2-8",
      title: "NFTs: Creating Metadata via CPI",
      moduleTitle: "Module 3: Non-Fungible Tokens (NFTs)",
      durationMinutes: 90,
      type: "challenge",
      markdown: `Video: https://www.youtube.com/watch?v=amAq-WHAFs8&t=14500s

## Challenge: Mint an NFT

Write an instruction to mint an NFT directly from your Anchor program. 

You must:
1.  Mint exactly 1 token (ensure your Mint account initialization has \`decimals = 0\`).
2.  Make a CPI to \`create_metadata_accounts_v3\` to attach the \`name\`, \`symbol\`, and \`uri\`.
3.  Make a CPI to \`create_master_edition_v3\`. A Master Edition account permanently locks the supply of the mint so no more can ever be created, enforcing the "Non-Fungible" guarantee.

You will need the \`anchor_spl::metadata\` crate to access these CPI functions.`,
      starterCode: `use anchor_spl::metadata::{create_metadata_accounts_v3, CreateMetadataAccountsV3, create_master_edition_v3, CreateMasterEditionV3};

pub fn create_nft(ctx: Context<CreateNft>, name: String, symbol: String, uri: String) -> Result<()> {
  // TODO: Mint 1 token
  // TODO: CPI to Metaplex for metadata
  // TODO: CPI to Metaplex for Master Edition
  Ok(())
}
`,
      testCases: ["Mints 1 token", "Invokes create_metadata_accounts_v3", "Sets DataV2 struct properly"],
    }
  ]
};
