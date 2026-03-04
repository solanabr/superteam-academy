import { Course } from "../models";

export const courseAdvanced: Course = {
  id: "advanced-solana-architecture",
  slug: "advanced-solana-architecture",
  title: "Course 3: Advanced Solana & DeFi Architecture",
  description: "The final stretch of the Bootcamp. Master complex DeFi mechanisms, Automated Market Makers (AMMs), time-based vesting using the Clock Sysvar, and generating secure randomness on-chain.",
  difficulty: "Advanced",
  durationHours: 20,
  xpReward: 3500,
  track: "Core Bootcamp",
  thumbnailUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=800&h=400",
  lessons: [
    {
      id: "a3-1",
      title: "AMM Swap: Understanding DeFi",
      moduleTitle: "Module 1: AMM Swap Program",
      durationMinutes: 45,
      type: "content",
      markdown: `Video: https://www.youtube.com/watch?v=amAq-WHAFs8&t=15922s

## Introduction to DeFi (Decentralized Finance)

Welcome to Project 7. We are building an Automated Market Maker (AMM). Before we write code, we need to understand the math that powers decentralized exchanges (DEXs) like Raydium or Orca.

### The Constant Product Formula
Traditional exchanges (like Binance or Coinbase) use **Order Books**, matching buyers directly with sellers.

AMMs use **Liquidity Pools**—smart contract vaults containing two tokens (e.g., SOL and USDC). 
The price of the tokens is determined automatically by a mathematical formula:

$$ x * y = k $$

*   **x**: The amount of Token A in the pool.
*   **y**: The amount of Token B in the pool.
*   **k**: A constant value that must remain the same *after* a swap.

If a user buys Token A from the pool, the supply of \`x\` decreases. To keep \`k\` constant, the amount of \`y\` (Token B) must increase, meaning the user must deposit Token B, effectively setting a slippage curve.

\n\nOpen-source source: https://github.com/solana-developers/developer-bootcamp-2024/tree/main/project-7-swap`,
      starterCode: "",
      testCases: [],
      exam: {
        question: "In the formula x * y = k, what does 'k' represent?",
        options: ["The current price of token x", "A constant value that must be maintained after a swap, determining the price slippage", "The total number of users"],
        correctOptionIndex: 1,
      },
    },
    {
      id: "a3-2",
      title: "AMM Swap: Initializing the Pool",
      moduleTitle: "Module 1: AMM Swap Program",
      durationMinutes: 90,
      type: "challenge",
      markdown: `Video: https://www.youtube.com/watch?v=amAq-WHAFs8&t=17000s

## Challenge: AMM Initialization

Set up the AMM pool. You must create an \`AmmState\` PDA that will store the mint addresses and fees.

Most importantly, you must initialize two **Token Vaults** (Token Accounts) that are owned by the \`AmmState\` PDA. Because the PDA owns the vaults, only your program can transfer funds out of them during a swap.

### Anchor Constraints
You will use the \`token::authority\` constraint to assign ownership of the vaults to the PDA:

\`\`\`rust
#[account(
    init,
    payer = maker,
    associated_token::mint = mint_a,
    associated_token::authority = amm_state, // The PDA owns this!
)]
pub vault_a: Account<'info, TokenAccount>,
\`\`\`

Implement the Context and the initialization logic.`,
      starterCode: `#[derive(Accounts)]
pub struct InitializePool<'info> {
    // TODO: Define Pool PDA and Token Vaults
}

pub fn initialize_pool(ctx: Context<InitializePool>) -> Result<()> {
    // TODO: Set initial state
    Ok(())
}
`,
      testCases: ["Creates Pool PDA", "Initializes Vault A and Vault B owned by the PDA", "Saves mint addresses to state"],
    },
    {
      id: "a3-3",
      title: "AMM Swap: Executing a Swap",
      moduleTitle: "Module 1: AMM Swap Program",
      durationMinutes: 120,
      type: "challenge",
      markdown: `Video: https://www.youtube.com/watch?v=amAq-WHAFs8&t=19000s

## Challenge: The Swap Math

Implement the swap logic.

### Step 1: Calculate Output
You must calculate the output amount using curve math. If the user deposits \`amount_in\` of Token A, how much Token B do they get so that \`x * y = k\` is respected? (Hint: don't forget to subtract your protocol fee first!)

### Step 2: Transfer In
Use a standard CPI to transfer Token A from the user to \`vault_a\`.

### Step 3: Transfer Out (PDA Signer)
Use \`CpiContext::new_with_signer\` to transfer Token B from \`vault_b\` back to the user. Because the vault is owned by the PDA, the PDA must "sign" the transaction.

\`\`\`rust
let seeds = &[
    b"amm".as_ref(),
    // ... other seeds
    &[bump],
];
let signer_seeds = &[&seeds[..]];

let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);
token::transfer(cpi_ctx, amount_out)?;
\`\`\`
`,
      starterCode: `pub fn swap(ctx: Context<Swap>, amount_in: u64, min_amount_out: u64) -> Result<()> {
    // TODO: Calculate output with x * y = k
    // TODO: Transfer from user to vault
    // TODO: Transfer from vault to user (PDA signer)
    Ok(())
}
`,
      testCases: ["Calculates output token amount correctly", "Transfers input token to vault", "Uses PDA seeds to sign the outgoing transfer"],
    },
    {
      id: "a3-4",
      title: "Token Vesting: The Clock Sysvar",
      moduleTitle: "Module 2: Token Vesting",
      durationMinutes: 45,
      type: "content",
      markdown: `Video: https://www.youtube.com/watch?v=amAq-WHAFs8&t=20895s

## Project 8: Token Vesting

In crypto, team members and investors rarely get all their tokens at launch. They are subject to a **Vesting Schedule**, where tokens unlock gradually over several years. We are going to build a vesting smart contract.

### The Clock Sysvar
To unlock tokens over time, our program needs to know what time it is. 

Solana uses **Sysvars** (System Variables)—special accounts that the network automatically updates. The \`Clock\` sysvar contains the current network timestamp (in Unix seconds).

In Anchor, fetching the current time is as simple as:
\`\`\`rust
let current_time = Clock::get()?.unix_timestamp;
\`\`\`

\n\nOpen-source source: https://github.com/solana-developers/developer-bootcamp-2024/tree/main/project-8-token-vesting`,
      starterCode: "",
      testCases: [],
      exam: {
        question: "How do you access the current timestamp in Anchor?",
        options: ["SystemTime::now()", "Clock::get()?.unix_timestamp", "Requesting it from an API"],
        correctOptionIndex: 1,
      },
    },
    {
      id: "a3-5",
      title: "Token Vesting: Claim Logic",
      moduleTitle: "Module 2: Token Vesting",
      durationMinutes: 90,
      type: "challenge",
      markdown: `Video: https://www.youtube.com/watch?v=amAq-WHAFs8&t=25000s

## Challenge: Linear Vesting Math

Implement the claim logic for the vesting contract.

When a user calls \`claim_tokens\`, the program must:
1. Fetch the current Unix timestamp from \`Clock\`.
2. Check if the timestamp is past the cliff (the initial lockup period).
3. Calculate the percentage of time that has passed between \`start_time\` and \`end_time\`.
4. Multiply that percentage by the \`total_allocation\` to find the \`vested_amount\`.
5. Subtract \`amount_already_claimed\` from \`vested_amount\` to find how much the user can claim *right now*.
6. Transfer the tokens from the program vault to the user and update the \`amount_already_claimed\` state.

Watch out for integer division and precision loss!`,
      starterCode: `pub fn claim_tokens(ctx: Context<ClaimTokens>) -> Result<()> {
    // TODO: Fetch Clock sysvar
    // TODO: Calculate vested amount
    // TODO: Transfer tokens
    Ok(())
}
`,
      testCases: ["Fetches Clock sysvar", "Calculates linear unlocked amount accurately", "Prevents claiming more than vested amount"],
    },
    {
      id: "a3-6",
      title: "Token Lottery: Oracles & VRF",
      moduleTitle: "Module 3: Randomness & Lottery",
      durationMinutes: 50,
      type: "content",
      markdown: `Video: https://www.youtube.com/watch?v=amAq-WHAFs8&t=30677s

## Project 9: Randomness on Solana

Welcome to the final Bootcamp project: An On-Chain Lottery.

### The Determinism Problem
Blockchains are entirely deterministic. If you run a transaction with the same inputs on a million different validator nodes, they must all calculate the exact same output. Because of this, **true randomness is impossible natively on-chain**.

If you try to use a blockhash or the \`Clock\` sysvar as a random number seed, malicious validators can manipulate or withhold blocks to cheat the outcome.

### Verifiable Random Functions (VRF)
To get secure randomness, we use an **Oracle**—a decentralized network that sits outside the blockchain (like **Switchboard** or **Pyth**). 

Switchboard's VRF generates a random number off-chain, mathematically proves it was generated fairly, and pushes that number onto a Solana account where your program can read it.

\n\nOpen-source source: https://github.com/solana-developers/developer-bootcamp-2024/tree/main/project-9-token-lottery`,
      starterCode: "",
      testCases: [],
      exam: {
        question: "Why can't you just use blockhashes for randomness on Solana?",
        options: ["It's too expensive", "Validators can manipulate or withhold blocks to cheat the random outcome", "Blockhashes are always the same"],
        correctOptionIndex: 1,
      },
    },
    {
      id: "a3-7",
      title: "Token Lottery: Picking a Winner",
      moduleTitle: "Module 3: Randomness & Lottery",
      durationMinutes: 120,
      type: "challenge",
      markdown: `Video: https://www.youtube.com/watch?v=amAq-WHAFs8&t=35000s

## Challenge: Resolve the Lottery

Implement the \`resolve_winner\` instruction.

1.  **Enforce the Deadline:** Use the \`Clock\` sysvar to ensure the current timestamp is greater than the \`lottery_end_time\`. If it's not, return a custom error using the \`require!()\` macro.
2.  **Read Oracle Data:** Deserialize the Switchboard VRF account passed into the context to extract the random \`u256\` buffer.
3.  **Pick the Winner:** Use the modulo operator (\`%\`) against the \`total_tickets_sold\` to pick a winning ticket index between \`0\` and \`total_tickets_sold - 1\`. Save this winner to the lottery state.

Once resolved, the winning user can call a separate \`claim_prize\` instruction!`,
      starterCode: `pub fn resolve_winner(ctx: Context<ResolveWinner>) -> Result<()> {
    // TODO: Enforce time deadline using Clock
    // TODO: Read Oracle data for random number
    // TODO: Set winner index
    Ok(())
}
`,
      testCases: ["Enforces time deadline", "Parses Oracle data", "Correctly applies modulo math for winner selection"],
    }
  ]
};
