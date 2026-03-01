import type { Course } from "./types";

export const defiCourses: Course[] = [
  {
    id: "defi-fundamentals",
    slug: "defi-fundamentals",
    title: "DeFi Fundamentals",
    description:
      "Master the core concepts of decentralized finance on Solana — AMMs, liquidity pools, and yield strategies. Build a solid foundation for protocol development.",
    shortDescription:
      "Core DeFi primitives, AMMs, liquidity pools, and yield strategies on Solana.",
    thumbnail: "/thumbnails/defi-fundamentals.jpg",
    trackId: "defi-on-solana",
    difficulty: 2,
    modules: [
      {
        id: "defi-primitives",
        title: "DeFi Primitives",
        description: "Core building blocks of decentralized finance.",
        lessons: [
          {
            id: "defi-primitives-1",
            title: "What is DeFi?",
            type: "content",
            duration: 8,
            xp: 150,
            body: "DeFi removes intermediaries by using smart contracts for lending, trading, and yield. On Solana, programs execute atomically with sub-second finality, enabling efficient capital deployment.",
          },
          {
            id: "defi-primitives-2",
            title: "Token Standards on Solana",
            type: "content",
            duration: 10,
            xp: 150,
            body: "SPL Token and Token-2022 define fungible and non-fungible assets. Token-2022 adds transfer hooks, confidential transfers, and interest-bearing tokens for DeFi use cases.",
          },
          {
            id: "defi-primitives-3",
            title: "Implement Token Transfer",
            type: "challenge",
            duration: 20,
            xp: 225,
            prompt: "Write a function that transfers SPL tokens between two accounts. Validate the source has sufficient balance and the mint matches. Return the signature on success.",
            starterCode: `fn transfer_tokens(
  source: &AccountInfo,
  destination: &AccountInfo,
  authority: &AccountInfo,
  amount: u64,
) -> Result<()> {
  todo!("Implement token transfer")
}`,
            language: "rust",
            testCases: [
              {
                input: "amount: 100",
                expectedOutput: "Ok(())",
                label: "Valid transfer",
              },
              {
                input: "amount: 0",
                expectedOutput: "Err(InvalidAmount)",
                label: "Zero amount rejected",
              },
            ],
          },
        ],
      },
      {
        id: "automated-market-makers",
        title: "Automated Market Makers",
        description: "Understand constant product and other AMM formulas.",
        lessons: [
          {
            id: "amm-1",
            title: "Constant Product Formula",
            type: "content",
            duration: 12,
            xp: 150,
            body: "x * y = k ensures that trades move the price along a curve. Larger trades incur more slippage. The invariant is preserved before and after each swap.",
          },
          {
            id: "amm-2",
            title: "Price Impact and Slippage",
            type: "content",
            duration: 10,
            xp: 150,
            body: "Slippage is the difference between expected and executed price. Deeper liquidity reduces impact. Min-out parameters protect traders from front-running.",
          },
          {
            id: "amm-3",
            title: "Implement Swap Output",
            type: "challenge",
            duration: 25,
            xp: 225,
            prompt: "Implement the output amount for a constant-product swap. Given reserves (x, y) and input amount `amount_in`, compute `amount_out` using x * y = k. Apply 0.3% fee to input.",
            starterCode: `fn compute_swap_output(
  reserve_in: u64,
  reserve_out: u64,
  amount_in: u64,
) -> u64 {
  todo!("Implement constant product swap math")
}`,
            language: "rust",
            testCases: [
              {
                input: "1000, 1000, 100",
                expectedOutput: "90",
                label: "Symmetric pool",
              },
              {
                input: "10000, 5000, 500",
                expectedOutput: "238",
                label: "Asymmetric pool",
              },
            ],
          },
        ],
      },
      {
        id: "liquidity-pools",
        title: "Liquidity Pools",
        description: "Add and remove liquidity from AMM pools.",
        lessons: [
          {
            id: "lp-1",
            title: "LP Tokens and Share Accounting",
            type: "content",
            duration: 10,
            xp: 150,
            body: "Liquidity providers receive LP tokens representing their share. Shares are minted proportionally on deposit and burned on withdrawal. Total supply tracks pool ownership.",
          },
          {
            id: "lp-2",
            title: "Impermanent Loss",
            type: "content",
            duration: 8,
            xp: 150,
            body: "When token prices diverge, LPs may end up with less value than holding. IL is the opportunity cost of providing liquidity versus simply holding both assets.",
          },
          {
            id: "lp-3",
            title: "Add Liquidity",
            type: "content",
            duration: 12,
            xp: 150,
            body: "Deposits must maintain the pool ratio or specify a price range. First depositor sets the initial ratio. Subsequent LPs get LP tokens based on the smaller of their contribution ratios.",
          },
          {
            id: "lp-4",
            title: "Implement LP Mint Amount",
            type: "challenge",
            duration: 25,
            xp: 225,
            prompt: "Given pool reserves (a, b), total LP supply, and user deposit (amount_a, amount_b), compute how many LP tokens to mint. Use the minimum ratio to prevent pool dilution.",
            starterCode: `fn compute_lp_mint_amount(
  reserve_a: u64,
  reserve_b: u64,
  total_lp_supply: u64,
  amount_a: u64,
  amount_b: u64,
) -> u64 {
  todo!("Implement LP mint calculation")
}`,
            language: "rust",
            testCases: [
              {
                input: "1000, 1000, 1000, 100, 100",
                expectedOutput: "100",
                label: "Proportional deposit",
              },
              {
                input: "1000, 2000, 1000, 50, 150",
                expectedOutput: "75",
                label: "Ratio-limited deposit",
              },
            ],
          },
        ],
      },
      {
        id: "yield-strategies",
        title: "Yield Strategies",
        description: "Earn yield from liquidity provision and incentives.",
        lessons: [
          {
            id: "yield-1",
            title: "Trading Fees as Yield",
            type: "content",
            duration: 8,
            xp: 150,
            body: "LPs earn a share of swap fees proportional to their pool share. Higher volume means more fees. Fee tiers (0.01%, 0.05%, 0.3%) attract different strategies.",
          },
          {
            id: "yield-2",
            title: "Liquidity Mining and Incentives",
            type: "content",
            duration: 10,
            xp: 150,
            body: "Protocols emit tokens to LPs to bootstrap liquidity. APY combines fees and incentives. Incentives often target specific pools or concentration ranges.",
          },
          {
            id: "yield-3",
            title: "Calculate APY from Fees",
            type: "challenge",
            duration: 20,
            xp: 225,
            prompt: "Given 24h fee volume, pool TVL, and LP share (0-1), compute the annualized fee APY. Assume 365 days and compound daily for simplicity.",
            starterCode: `function calculateFeeApy(
  feeVolume24h: number,
  poolTvl: number,
  lpShare: number
): number {
  return 0;
}`,
            language: "typescript",
            testCases: [
              {
                input: "10000, 100000, 0.1",
                expectedOutput: "36.5",
                label: "10% LP share",
              },
              {
                input: "5000, 50000, 1",
                expectedOutput: "36.5",
                label: "Full pool",
              },
            ],
          },
        ],
      },
    ],
    totalLessons: 12,
    totalDuration: 178,
    xpReward: 2250,
    enrollmentCount: 756,
    creator: {
      name: "Marina Costa",
      avatar: "/avatars/marina.jpg",
      title: "DeFi Protocol Engineer",
    },
    prerequisiteSlug: null,
    isActive: true,
    tags: ["defi", "amm", "liquidity", "yield"],
  },
  {
    id: "building-a-dex",
    slug: "building-a-dex",
    title: "Building a DEX",
    description:
      "Design and implement a decentralized exchange from order book to swap engine. Learn matching logic, liquidity management, and frontend integration with Solana programs.",
    shortDescription:
      "Build a DEX with order book, swap engine, and frontend integration.",
    thumbnail: "/thumbnails/building-dex.jpg",
    trackId: "defi-on-solana",
    difficulty: 3,
    modules: [
      {
        id: "dex-architecture",
        title: "DEX Architecture",
        description: "High-level design of a decentralized exchange.",
        lessons: [
          {
            id: "dex-arch-1",
            title: "Order Book vs AMM",
            type: "content",
            duration: 10,
            xp: 200,
            body: "Order books offer precise price control and capital efficiency for makers. AMMs provide passive liquidity and simpler UX. Hybrid designs combine both for different use cases.",
          },
          {
            id: "dex-arch-2",
            title: "Solana Program Layout",
            type: "content",
            duration: 12,
            xp: 200,
            body: "Use PDAs for order books, open orders, and vaults. Keep hot paths in single instructions. Offload matching to a crank or allow users to self-match for scalability.",
          },
          {
            id: "dex-arch-3",
            title: "Design Order PDA",
            type: "challenge",
            duration: 25,
            xp: 300,
            prompt: "Define a PDA seed scheme for user orders. Each user can have multiple open orders per market. Include market id and a nonce or timestamp for uniqueness.",
            starterCode: `pub fn order_pda(
  program_id: &Pubkey,
  user: &Pubkey,
  market: &Pubkey,
  order_id: u64,
) -> (Pubkey, u8) {
  todo!("Derive order PDA")
}`,
            language: "rust",
            testCases: [
              {
                input: "user1, market_sol_usdc, 1",
                expectedOutput: "valid PDA",
                label: "First order",
              },
              {
                input: "user1, market_sol_usdc, 2",
                expectedOutput: "distinct PDA",
                label: "Second order",
              },
            ],
          },
        ],
      },
      {
        id: "order-book-design",
        title: "Order Book Design",
        description: "Implement limit orders and matching logic.",
        lessons: [
          {
            id: "ob-1",
            title: "Bids and Asks",
            type: "content",
            duration: 8,
            xp: 200,
            body: "Bids are buy orders, asks are sell orders. Price-time priority: best price first, then earliest timestamp. Orders can be partially filled across multiple counterparties.",
          },
          {
            id: "ob-2",
            title: "Order Lifecycle",
            type: "content",
            duration: 10,
            xp: 200,
            body: "Place, cancel, or fill. Filled orders update balances and remove from book. Expired orders can be pruned. Use account size limits to avoid bloat.",
          },
          {
            id: "ob-3",
            title: "Implement Order Placement",
            type: "challenge",
            duration: 30,
            xp: 300,
            prompt: "Implement place_order: validate user, create order account, transfer base token to vault, insert into order book. Reject if insufficient balance or invalid price.",
            starterCode: `pub fn place_order(
  ctx: Context<PlaceOrder>,
  side: OrderSide,
  price: u64,
  size: u64,
) -> Result<()> {
  todo!("Implement order placement")
}`,
            language: "rust",
            testCases: [
              {
                input: "Buy, 100, 10",
                expectedOutput: "Ok(())",
                label: "Valid buy",
              },
              {
                input: "Sell, 100, 999999",
                expectedOutput: "Err(InsufficientBalance)",
                label: "Insufficient balance",
              },
            ],
          },
        ],
      },
      {
        id: "swap-engine",
        title: "Swap Engine",
        description: "Match orders and execute swaps.",
        lessons: [
          {
            id: "swap-1",
            title: "Matching Algorithm",
            type: "content",
            duration: 12,
            xp: 200,
            body: "Walk the order book from best price until fill size is met. Split fills across multiple orders if needed. Update both sides atomically in a single transaction.",
          },
          {
            id: "swap-2",
            title: "Settlement and Slippage",
            type: "content",
            duration: 10,
            xp: 200,
            body: "Takers specify min_out to bound slippage. Settlement moves tokens from maker vaults to taker. Fee can be taken from output or charged separately.",
          },
          {
            id: "swap-3",
            title: "Implement Match Logic",
            type: "content",
            duration: 15,
            xp: 200,
            body: "Matching iterates orders, computes fill amounts, updates accounts. Handle partial fills by reducing order size. Emit fill events for indexing and analytics.",
          },
          {
            id: "swap-4",
            title: "Execute Swap",
            type: "challenge",
            duration: 35,
            xp: 300,
            prompt: "Implement execute_swap: take a market order (side, size), match against book, transfer tokens, update order states. Return actual output amount for taker.",
            starterCode: `pub fn execute_swap(
  ctx: Context<ExecuteSwap>,
  side: OrderSide,
  size: u64,
  min_out: u64,
) -> Result<u64> {
  todo!("Implement swap execution")
}`,
            language: "rust",
            testCases: [
              {
                input: "Buy, 5, 450",
                expectedOutput: ">= 450",
                label: "Buy with min out",
              },
              {
                input: "Sell, 100, 0",
                expectedOutput: "Err(InsufficientLiquidity)",
                label: "Empty book",
              },
            ],
          },
        ],
      },
      {
        id: "liquidity-management",
        title: "Liquidity Management",
        description: "Manage vaults and LP incentives.",
        lessons: [
          {
            id: "liq-1",
            title: "Token Vaults",
            type: "content",
            duration: 10,
            xp: 200,
            body: "Each market has base and quote vaults. Orders lock tokens in vaults until filled or cancelled. Vault PDAs are owned by the program for security.",
          },
          {
            id: "liq-2",
            title: "Market Making Strategies",
            type: "content",
            duration: 12,
            xp: 200,
            body: "Market makers post both sides to earn spread. Inventory risk requires hedging. On Solana, low latency and parallel execution enable competitive market making.",
          },
          {
            id: "liq-3",
            title: "Implement Withdraw",
            type: "challenge",
            duration: 25,
            xp: 300,
            prompt: "Implement withdraw: user withdraws unused balance from vault. Validate order account shows no open orders for this user/market. Transfer tokens back to user ATA.",
            starterCode: `pub fn withdraw(
  ctx: Context<Withdraw>,
  amount: u64,
) -> Result<()> {
  todo!("Implement vault withdraw")
}`,
            language: "rust",
            testCases: [
              {
                input: "100",
                expectedOutput: "Ok(())",
                label: "Valid withdraw",
              },
              {
                input: "999999",
                expectedOutput: "Err(InsufficientBalance)",
                label: "Over withdraw",
              },
            ],
          },
        ],
      },
      {
        id: "frontend-integration",
        title: "Frontend Integration",
        description: "Connect a UI to the DEX program.",
        lessons: [
          {
            id: "fe-1",
            title: "Fetching Order Book",
            type: "content",
            duration: 10,
            xp: 200,
            body: "Query order accounts by market PDA. Sort by price and aggregate. Use getProgramAccounts with filters or an indexer for production scale.",
          },
          {
            id: "fe-2",
            title: "Building and Sending Transactions",
            type: "content",
            duration: 12,
            xp: 200,
            body: "Use @solana/kit or similar to build place_order and execute_swap instructions. Add priority fees for inclusion. Handle simulation and confirmation.",
          },
          {
            id: "fe-3",
            title: "Place Order from Frontend",
            type: "challenge",
            duration: 30,
            xp: 300,
            prompt: "Implement a function that builds a place_order instruction, gets the user's recent blockhash, and returns a transaction ready for wallet signing. Use @solana/kit.",
            starterCode: `export async function buildPlaceOrderTx(
  connection: Connection,
  payer: PublicKey,
  market: PublicKey,
  side: "buy" | "sell",
  price: number,
  size: number
): Promise<Transaction> {
  return new Transaction();
}`,
            language: "typescript",
            testCases: [
              {
                input: "buy, 100, 10",
                expectedOutput: "Transaction with 1 instruction",
                label: "Buy order tx",
              },
              {
                input: "sell, 99, 5",
                expectedOutput: "Transaction with 1 instruction",
                label: "Sell order tx",
              },
            ],
          },
        ],
      },
    ],
    totalLessons: 16,
    totalDuration: 266,
    xpReward: 3700,
    enrollmentCount: 298,
    creator: {
      name: "Marina Costa",
      avatar: "/avatars/marina.jpg",
      title: "DeFi Protocol Engineer",
    },
    prerequisiteSlug: "defi-fundamentals",
    isActive: true,
    tags: ["dex", "orderbook", "swap", "matching"],
  },
  {
    id: "lending-protocols",
    slug: "lending-protocols",
    title: "Lending Protocols",
    description:
      "Build lending and borrowing protocols on Solana. Master interest rate models, collateralization, liquidation engines, and oracle integration for production-grade lending.",
    shortDescription:
      "Lending mechanics, interest models, collateral, liquidation, and oracles.",
    thumbnail: "/thumbnails/lending-protocols.jpg",
    trackId: "defi-on-solana",
    difficulty: 3,
    modules: [
      {
        id: "lending-mechanics",
        title: "Lending Mechanics",
        description: "Core concepts of lending and borrowing.",
        lessons: [
          {
            id: "lend-1",
            title: "Supply and Borrow",
            type: "content",
            duration: 10,
            xp: 200,
            body: "Suppliers deposit assets and earn interest. Borrowers post collateral and take out loans. Utilization (borrowed/supplied) drives interest rates. Over-collateralization is standard.",
          },
          {
            id: "lend-2",
            title: "cTokens and Share Accounting",
            type: "content",
            duration: 12,
            xp: 200,
            body: "Depositors receive cTokens representing their share. Exchange rate increases over time as interest accrues. Withdraw converts cTokens back to underlying at current rate.",
          },
          {
            id: "lend-3",
            title: "Flash Loans",
            type: "content",
            duration: 10,
            xp: 200,
            body: "Flash loans allow uncollateralized borrowing within a single transaction. Loan must be repaid plus fee before tx ends. Enables arbitrage, liquidation, and leverage.",
          },
          {
            id: "lend-4",
            title: "Implement Exchange Rate",
            type: "challenge",
            duration: 25,
            xp: 300,
            prompt: "Compute cToken exchange rate: total_borrows + total_cash - total_reserves, divided by cToken supply. Scale by 1e18 for precision. Return rate as u64.",
            starterCode: `fn compute_exchange_rate(
  total_cash: u64,
  total_borrows: u64,
  total_reserves: u64,
  c_token_supply: u64,
) -> u64 {
  todo!("Implement exchange rate")
}`,
            language: "rust",
            testCases: [
              {
                input: "1000, 500, 10, 100",
                expectedOutput: "1490000000000000000",
                label: "Accrued interest",
              },
              {
                input: "1000, 0, 0, 100",
                expectedOutput: "10000000000000000000",
                label: "Initial rate",
              },
            ],
          },
        ],
      },
      {
        id: "interest-rate-models",
        title: "Interest Rate Models",
        description: "Dynamic interest based on utilization.",
        lessons: [
          {
            id: "irm-1",
            title: "Utilization-Based Rates",
            type: "content",
            duration: 12,
            xp: 200,
            body: "When utilization is high, borrow rate rises to attract supply and discourage borrowing. Common models: linear, kink, or jump rate. Parameters control slope and kink point.",
          },
          {
            id: "irm-2",
            title: "Stable vs Variable Rates",
            type: "content",
            duration: 8,
            xp: 200,
            body: "Variable rates change with utilization. Stable rates smooth volatility for borrowers. Some protocols offer both; stable typically costs more to account for rate risk.",
          },
          {
            id: "irm-3",
            title: "Implement Borrow Rate",
            type: "challenge",
            duration: 25,
            xp: 300,
            prompt: "Implement a linear rate model: base_rate + utilization * multiplier. Utilization = borrows / (cash + borrows). Return basis points (e.g. 500 = 5%).",
            starterCode: `fn borrow_rate(
  cash: u64,
  borrows: u64,
  base_rate_bps: u64,
  multiplier_bps: u64,
) -> u64 {
  todo!("Implement borrow rate")
}`,
            language: "rust",
            testCases: [
              {
                input: "1000, 1000, 100, 2000",
                expectedOutput: "2100",
                label: "50% util",
              },
              {
                input: "9000, 1000, 100, 2000",
                expectedOutput: "300",
                label: "10% util",
              },
            ],
          },
        ],
      },
      {
        id: "collateral-liquidation",
        title: "Collateral & Liquidation",
        description: "Health factors and liquidation mechanics.",
        lessons: [
          {
            id: "liq-1",
            title: "Health Factor",
            type: "content",
            duration: 10,
            xp: 200,
            body: "Health factor = (collateral * LTV) / debt. Below 1.0, position is liquidatable. Liquidation threshold is typically lower than max LTV to create a buffer.",
          },
          {
            id: "liq-2",
            title: "Liquidation Engine",
            type: "content",
            duration: 12,
            xp: 200,
            body: "Liquidators repay debt and receive collateral at a discount (e.g. 8%). Incentivizes quick liquidation. Partial liquidations allow gradual deleveraging. Oracle price feeds are critical.",
          },
          {
            id: "liq-3",
            title: "Liquidation Incentives",
            type: "content",
            duration: 8,
            xp: 200,
            body: "Liquidation bonus (5-15%) compensates liquidators for gas and risk. Too high hurts borrowers; too low reduces liquidation throughput. Protocol parameters tune this.",
          },
          {
            id: "liq-4",
            title: "Implement Liquidation Check",
            type: "challenge",
            duration: 30,
            xp: 300,
            prompt: "Given collateral value, debt value, LTV limit, and liquidation threshold, return whether the position is liquidatable. Use fixed-point math. LTV limit 80%, liq threshold 85%.",
            starterCode: `function isLiquidatable(
  collateralValue: number,
  debtValue: number,
  ltvLimit: number,
  liqThreshold: number
): boolean {
  return false;
}`,
            language: "typescript",
            testCases: [
              {
                input: "100, 90, 0.8, 0.85",
                expectedOutput: "false",
                label: "Healthy",
              },
              {
                input: "100, 86, 0.8, 0.85",
                expectedOutput: "true",
                label: "Liquidatable",
              },
            ],
          },
        ],
      },
      {
        id: "oracle-integration",
        title: "Oracle Integration",
        description: "Price feeds for collateral and liquidation.",
        lessons: [
          {
            id: "oracle-1",
            title: "Oracle Design",
            type: "content",
            duration: 10,
            xp: 200,
            body: "Oracles provide off-chain prices on-chain. Pyth and Switchboard are common on Solana. Use TWAP or median to reduce manipulation. Staleness checks reject old prices.",
          },
          {
            id: "oracle-2",
            title: "Pyth and Switchboard",
            type: "content",
            duration: 12,
            xp: 200,
            body: "Pyth uses pull-based price accounts. Switchboard uses verifiable randomness. Both support many assets. Integrate by passing price account to your program and validating.",
          },
          {
            id: "oracle-3",
            title: "Consume Oracle Price",
            type: "challenge",
            duration: 30,
            xp: 300,
            prompt: "Write a function that accepts a Pyth price account, deserializes it, checks staleness (max 60s), and returns the price. Revert if invalid or stale.",
            starterCode: `fn get_oracle_price(price_account: &AccountInfo) -> Result<u64> {
  todo!("Parse Pyth price and check staleness")
}`,
            language: "rust",
            testCases: [
              {
                input: "valid_account",
                expectedOutput: "Ok(50000)",
                label: "Fresh price",
              },
              {
                input: "stale_account",
                expectedOutput: "Err(StalePrice)",
                label: "Stale rejected",
              },
            ],
          },
        ],
      },
    ],
    totalLessons: 14,
    totalDuration: 214,
    xpReward: 3200,
    enrollmentCount: 213,
    creator: {
      name: "Rafael Oliveira",
      avatar: "/avatars/rafael.jpg",
      title: "Protocol Architect",
    },
    prerequisiteSlug: "defi-fundamentals",
    isActive: true,
    tags: ["lending", "borrowing", "collateral", "liquidation"],
  },
];
