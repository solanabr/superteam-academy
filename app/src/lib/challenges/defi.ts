import type { CodingChallenge } from './types';

export const defiChallenges: CodingChallenge[] = [
  // ─── BEGINNER (5) ────────────────────────────────────────────────────
  {
    id: 'defi-001',
    title: 'Mint SPL Tokens',
    description:
      'Write a function that constructs the instructions to mint a specified amount of SPL tokens to a destination token account. The function receives the mint address, destination token account, mint authority, and the raw amount (already adjusted for decimals). Return the transaction instruction.',
    difficulty: 'beginner',
    category: 'defi',
    language: 'typescript',
    starterCode: `import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { createMintToInstruction, TOKEN_PROGRAM_ID } from '@solana/spl-token';

/**
 * Build a MintTo instruction for an SPL token.
 * @param mint - The token mint public key
 * @param destination - The destination token account
 * @param authority - The mint authority
 * @param amount - Raw token amount (already decimal-adjusted)
 * @returns The MintTo transaction instruction
 */
export function buildMintToInstruction(
  mint: PublicKey,
  destination: PublicKey,
  authority: PublicKey,
  amount: bigint,
): TransactionInstruction {
  // TODO: Use createMintToInstruction to build and return the instruction
}`,
    solution: `import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { createMintToInstruction, TOKEN_PROGRAM_ID } from '@solana/spl-token';

export function buildMintToInstruction(
  mint: PublicKey,
  destination: PublicKey,
  authority: PublicKey,
  amount: bigint,
): TransactionInstruction {
  return createMintToInstruction(
    mint,
    destination,
    authority,
    amount,
    [],
    TOKEN_PROGRAM_ID,
  );
}`,
    testCases: [
      {
        input: 'mint=TokenMint111, dest=ATA111, authority=Auth111, amount=1000000000',
        expectedOutput: 'TransactionInstruction with programId=TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
        description: 'Returns a valid MintTo instruction targeting the Token Program',
      },
      {
        input: 'mint=TokenMint222, dest=ATA222, authority=Auth222, amount=0',
        expectedOutput: 'TransactionInstruction with amount=0 in data buffer',
        description: 'Handles zero-amount mint without error',
      },
      {
        input: 'mint=TokenMint333, dest=ATA333, authority=Auth333, amount=18446744073709551615',
        expectedOutput: 'TransactionInstruction with u64 max in data buffer',
        description: 'Handles maximum u64 amount correctly',
      },
    ],
    hints: [
      'createMintToInstruction from @solana/spl-token takes (mint, dest, authority, amount, multiSigners, programId)',
      'The amount parameter is a bigint that maps to a u64 on-chain — no decimal conversion needed here',
      'Pass an empty array [] for multiSigners when the authority is a single keypair',
    ],
    xpReward: 50,
    estimatedMinutes: 10,
  },
  {
    id: 'defi-002',
    title: 'Transfer Tokens Between Wallets',
    description:
      'Implement a function that builds a token transfer instruction. Given a source token account, destination token account, owner, and amount, return the appropriate SPL Token transfer instruction.',
    difficulty: 'beginner',
    category: 'defi',
    language: 'typescript',
    starterCode: `import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { createTransferInstruction, TOKEN_PROGRAM_ID } from '@solana/spl-token';

/**
 * Build a Transfer instruction for SPL tokens.
 * @param source - Source token account
 * @param destination - Destination token account
 * @param owner - Owner of the source account
 * @param amount - Raw token amount to transfer
 * @returns The Transfer transaction instruction
 */
export function buildTransferInstruction(
  source: PublicKey,
  destination: PublicKey,
  owner: PublicKey,
  amount: bigint,
): TransactionInstruction {
  // TODO: Use createTransferInstruction to build and return the instruction
}`,
    solution: `import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { createTransferInstruction, TOKEN_PROGRAM_ID } from '@solana/spl-token';

export function buildTransferInstruction(
  source: PublicKey,
  destination: PublicKey,
  owner: PublicKey,
  amount: bigint,
): TransactionInstruction {
  return createTransferInstruction(
    source,
    destination,
    owner,
    amount,
    [],
    TOKEN_PROGRAM_ID,
  );
}`,
    testCases: [
      {
        input: 'source=ATA111, dest=ATA222, owner=Owner111, amount=500000000',
        expectedOutput: 'TransactionInstruction with 3 account keys and Transfer discriminator',
        description: 'Creates a valid transfer instruction with correct accounts',
      },
      {
        input: 'source=ATA333, dest=ATA444, owner=Owner222, amount=1',
        expectedOutput: 'TransactionInstruction with amount=1 encoded in data',
        description: 'Handles minimum transfer amount of 1 lamport-unit',
      },
      {
        input: 'source=ATA555, dest=ATA555, owner=Owner333, amount=100',
        expectedOutput: 'TransactionInstruction with identical source and destination keys',
        description: 'Allows self-transfer (same ATA) without client-side error',
      },
    ],
    hints: [
      'createTransferInstruction takes (source, destination, owner, amount, multiSigners, programId)',
      'The instruction will have 3 account metas: source (writable), destination (writable), owner (signer)',
      'Amount is in raw token units — if the token has 9 decimals, 1 token = 1_000_000_000',
    ],
    xpReward: 50,
    estimatedMinutes: 10,
  },
  {
    id: 'defi-003',
    title: 'Create an Associated Token Account',
    description:
      'Write a function that derives the Associated Token Account (ATA) address for a given wallet and mint, and returns the create-ATA instruction if needed. The function should return both the derived address and the instruction.',
    difficulty: 'beginner',
    category: 'defi',
    language: 'typescript',
    starterCode: `import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from '@solana/spl-token';

interface ATAResult {
  address: PublicKey;
  instruction: TransactionInstruction;
}

/**
 * Derive the ATA address and build the create instruction.
 * @param payer - Account paying for ATA creation
 * @param owner - Wallet that will own the ATA
 * @param mint - The token mint
 * @returns The ATA address and its creation instruction
 */
export async function buildCreateATAInstruction(
  payer: PublicKey,
  owner: PublicKey,
  mint: PublicKey,
): Promise<ATAResult> {
  // TODO: 1. Derive the ATA address using getAssociatedTokenAddress
  // TODO: 2. Build the create instruction using createAssociatedTokenAccountInstruction
  // TODO: 3. Return both address and instruction
}`,
    solution: `import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from '@solana/spl-token';

interface ATAResult {
  address: PublicKey;
  instruction: TransactionInstruction;
}

export async function buildCreateATAInstruction(
  payer: PublicKey,
  owner: PublicKey,
  mint: PublicKey,
): Promise<ATAResult> {
  const address = await getAssociatedTokenAddress(
    mint,
    owner,
    false,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID,
  );

  const instruction = createAssociatedTokenAccountInstruction(
    payer,
    address,
    owner,
    mint,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID,
  );

  return { address, instruction };
}`,
    testCases: [
      {
        input: 'payer=Payer111, owner=Owner111, mint=Mint111',
        expectedOutput: 'ATAResult with deterministic PDA address and instruction with 6 account keys',
        description: 'Derives correct ATA address and returns valid creation instruction',
      },
      {
        input: 'payer=Owner111, owner=Owner111, mint=Mint111',
        expectedOutput: 'ATAResult where payer equals owner',
        description: 'Handles case where payer and owner are the same wallet',
      },
      {
        input: 'payer=Payer222, owner=Owner222, mint=Mint222',
        expectedOutput: 'ATAResult with different PDA than test case 1',
        description: 'Different owner/mint combo produces a different ATA address',
      },
    ],
    hints: [
      'getAssociatedTokenAddress derives a PDA from the mint, owner, Token Program, and ATA Program',
      'The third parameter of getAssociatedTokenAddress (allowOwnerOffCurve) should be false for regular wallets',
      'createAssociatedTokenAccountInstruction needs: payer, ata, owner, mint, tokenProgramId, ataProgramId',
    ],
    xpReward: 50,
    estimatedMinutes: 12,
  },
  {
    id: 'defi-004',
    title: 'Calculate Constant Product Swap Output',
    description:
      'Implement the constant product AMM formula (x * y = k). Given the input reserve, output reserve, and input amount, calculate the output amount after a swap. Account for a fee expressed in basis points (e.g., 30 = 0.3%).',
    difficulty: 'beginner',
    category: 'defi',
    language: 'typescript',
    starterCode: `/**
 * Calculate swap output using constant product formula (x * y = k).
 * @param inputReserve - Current reserve of the input token
 * @param outputReserve - Current reserve of the output token
 * @param inputAmount - Amount of input token being swapped
 * @param feeBps - Fee in basis points (e.g., 30 = 0.3%)
 * @returns The output amount the user receives
 * @throws If any input is zero or negative
 */
export function calculateSwapOutput(
  inputReserve: bigint,
  outputReserve: bigint,
  inputAmount: bigint,
  feeBps: number,
): bigint {
  // TODO: 1. Validate inputs are positive
  // TODO: 2. Calculate input after fee: inputAmount * (10000 - feeBps) / 10000
  // TODO: 3. Apply constant product: output = (outputReserve * inputAfterFee) / (inputReserve + inputAfterFee)
  // TODO: 4. Return the output amount
}`,
    solution: `export function calculateSwapOutput(
  inputReserve: bigint,
  outputReserve: bigint,
  inputAmount: bigint,
  feeBps: number,
): bigint {
  if (inputReserve <= 0n || outputReserve <= 0n || inputAmount <= 0n) {
    throw new Error('All amounts must be positive');
  }
  if (feeBps < 0 || feeBps >= 10000) {
    throw new Error('Fee must be between 0 and 9999 basis points');
  }

  const inputAfterFee = (inputAmount * BigInt(10000 - feeBps)) / 10000n;
  const numerator = outputReserve * inputAfterFee;
  const denominator = inputReserve + inputAfterFee;

  return numerator / denominator;
}`,
    testCases: [
      {
        input: 'inputReserve=1000000, outputReserve=1000000, inputAmount=1000, feeBps=30',
        expectedOutput: '996',
        description: 'Standard 1:1 pool with 0.3% fee returns ~996 for 1000 input',
      },
      {
        input: 'inputReserve=2000000, outputReserve=500000, inputAmount=10000, feeBps=30',
        expectedOutput: '2484',
        description: 'Unbalanced pool returns proportionally less of the scarce token',
      },
      {
        input: 'inputReserve=0, outputReserve=1000000, inputAmount=1000, feeBps=30',
        expectedOutput: 'throws Error: All amounts must be positive',
        description: 'Throws on zero reserve input',
      },
    ],
    hints: [
      'Use bigint arithmetic throughout to avoid floating-point precision issues',
      'The fee is subtracted from the input first: effectiveInput = input * (10000 - feeBps) / 10000',
      'The constant product formula rearranges to: dy = (y * dx) / (x + dx) where dx is the fee-adjusted input',
    ],
    xpReward: 50,
    estimatedMinutes: 15,
  },
  {
    id: 'defi-005',
    title: 'Compute Liquidity Pool Share',
    description:
      'Calculate the LP token amount a depositor should receive when adding liquidity to a constant product pool. Given the current reserves, total LP supply, and the deposited amounts, return the LP tokens to mint. Use the minimum ratio to prevent manipulation.',
    difficulty: 'beginner',
    category: 'defi',
    language: 'typescript',
    starterCode: `/**
 * Calculate LP tokens to mint for a liquidity deposit.
 * @param reserveA - Current reserve of token A
 * @param reserveB - Current reserve of token B
 * @param totalLpSupply - Current total LP token supply
 * @param depositA - Amount of token A being deposited
 * @param depositB - Amount of token B being deposited
 * @returns LP tokens to mint to the depositor
 * @throws If pool is empty and deposits are zero
 */
export function calculateLpTokens(
  reserveA: bigint,
  reserveB: bigint,
  totalLpSupply: bigint,
  depositA: bigint,
  depositB: bigint,
): bigint {
  // TODO: 1. Handle initial deposit (empty pool): return sqrt(depositA * depositB)
  // TODO: 2. For existing pool: calculate ratio for each token
  //          ratioA = depositA * totalLpSupply / reserveA
  //          ratioB = depositB * totalLpSupply / reserveB
  // TODO: 3. Return the minimum of the two ratios
}`,
    solution: `function bigintSqrt(n: bigint): bigint {
  if (n < 0n) throw new Error('Square root of negative number');
  if (n === 0n) return 0n;
  let x = n;
  let y = (x + 1n) / 2n;
  while (y < x) {
    x = y;
    y = (x + n / x) / 2n;
  }
  return x;
}

export function calculateLpTokens(
  reserveA: bigint,
  reserveB: bigint,
  totalLpSupply: bigint,
  depositA: bigint,
  depositB: bigint,
): bigint {
  if (depositA <= 0n || depositB <= 0n) {
    throw new Error('Deposit amounts must be positive');
  }

  if (totalLpSupply === 0n) {
    return bigintSqrt(depositA * depositB);
  }

  const ratioA = (depositA * totalLpSupply) / reserveA;
  const ratioB = (depositB * totalLpSupply) / reserveB;

  return ratioA < ratioB ? ratioA : ratioB;
}`,
    testCases: [
      {
        input: 'reserveA=0, reserveB=0, totalLpSupply=0, depositA=1000000, depositB=1000000',
        expectedOutput: '1000000',
        description: 'Initial deposit returns sqrt(depositA * depositB) as LP tokens',
      },
      {
        input: 'reserveA=1000000, reserveB=1000000, totalLpSupply=1000000, depositA=100000, depositB=100000',
        expectedOutput: '100000',
        description: 'Proportional deposit to balanced pool returns proportional LP tokens',
      },
      {
        input: 'reserveA=1000000, reserveB=2000000, totalLpSupply=1000000, depositA=100000, depositB=100000',
        expectedOutput: '50000',
        description: 'Imbalanced deposit returns minimum ratio to prevent manipulation',
      },
    ],
    hints: [
      'For the initial deposit when the pool is empty, LP tokens = sqrt(depositA * depositB)',
      'BigInt does not have a native sqrt — implement Newton\'s method for integer square root',
      'Always take the minimum ratio of the two deposits to prevent single-sided manipulation',
    ],
    xpReward: 50,
    estimatedMinutes: 15,
  },

  // ─── INTERMEDIATE (8) ───────────────────────────────────────────────
  {
    id: 'defi-006',
    title: 'Oracle Price Feed Parsing',
    description:
      'Parse a Pyth price feed account to extract the current price, confidence interval, and exponent. Validate the price is not stale by checking the timestamp against a maximum age parameter. Return a structured price result.',
    difficulty: 'intermediate',
    category: 'defi',
    language: 'typescript',
    starterCode: `interface PriceFeedData {
  price: bigint;
  confidence: bigint;
  exponent: number;
  publishTime: number;
}

interface PriceResult {
  price: number;
  confidence: number;
  publishTime: number;
  isStale: boolean;
}

/**
 * Parse and validate a Pyth oracle price feed.
 * @param feed - Raw price feed data
 * @param currentTime - Current Unix timestamp in seconds
 * @param maxStalenessSeconds - Maximum allowed age of price data
 * @returns Parsed and validated price result
 * @throws If price is negative or exponent is invalid
 */
export function parsePriceFeed(
  feed: PriceFeedData,
  currentTime: number,
  maxStalenessSeconds: number,
): PriceResult {
  // TODO: 1. Validate price is non-negative
  // TODO: 2. Convert price and confidence using exponent: value * 10^exponent
  // TODO: 3. Determine staleness: currentTime - publishTime > maxStalenessSeconds
  // TODO: 4. Return PriceResult
}`,
    solution: `interface PriceFeedData {
  price: bigint;
  confidence: bigint;
  exponent: number;
  publishTime: number;
}

interface PriceResult {
  price: number;
  confidence: number;
  publishTime: number;
  isStale: boolean;
}

export function parsePriceFeed(
  feed: PriceFeedData,
  currentTime: number,
  maxStalenessSeconds: number,
): PriceResult {
  if (feed.price < 0n) {
    throw new Error('Price must be non-negative');
  }

  const multiplier = Math.pow(10, feed.exponent);
  const price = Number(feed.price) * multiplier;
  const confidence = Number(feed.confidence) * multiplier;
  const isStale = currentTime - feed.publishTime > maxStalenessSeconds;

  return {
    price,
    confidence,
    publishTime: feed.publishTime,
    isStale,
  };
}`,
    testCases: [
      {
        input: 'price=15034500000n, confidence=1200000n, exponent=-8, publishTime=1700000000, currentTime=1700000010, maxStaleness=30',
        expectedOutput: '{ price: 150.345, confidence: 0.012, publishTime: 1700000000, isStale: false }',
        description: 'Parses SOL/USD feed with 8-decimal exponent correctly',
      },
      {
        input: 'price=15034500000n, confidence=1200000n, exponent=-8, publishTime=1700000000, currentTime=1700000060, maxStaleness=30',
        expectedOutput: '{ price: 150.345, confidence: 0.012, publishTime: 1700000000, isStale: true }',
        description: 'Correctly identifies stale price data beyond max age',
      },
      {
        input: 'price=-100n, confidence=10n, exponent=-2, publishTime=1700000000, currentTime=1700000000, maxStaleness=30',
        expectedOutput: 'throws Error: Price must be non-negative',
        description: 'Throws on negative price value',
      },
    ],
    hints: [
      'Pyth prices use an exponent (e.g., -8) so the real price = raw_price * 10^exponent',
      'Confidence interval uses the same exponent scaling as the price',
      'A price is stale when the difference between currentTime and publishTime exceeds maxStalenessSeconds',
    ],
    xpReward: 100,
    estimatedMinutes: 20,
  },
  {
    id: 'defi-007',
    title: 'Calculate Lending Interest Rate',
    description:
      'Implement a utilization-based interest rate model commonly used in lending protocols (similar to Aave/Solend). The model uses a kink point: below the kink, the rate increases linearly at a base slope; above the kink, a steeper jump slope applies. Return the borrow rate as a percentage with 6 decimal precision.',
    difficulty: 'intermediate',
    category: 'defi',
    language: 'typescript',
    starterCode: `interface RateModelParams {
  baseRate: number;        // Base rate (e.g., 0.02 = 2%)
  slope1: number;          // Slope below kink (e.g., 0.04 = 4%)
  slope2: number;          // Slope above kink (e.g., 0.75 = 75%)
  optimalUtilization: number; // Kink point (e.g., 0.80 = 80%)
}

/**
 * Calculate borrow interest rate based on utilization.
 * @param totalBorrowed - Total amount borrowed from the pool
 * @param totalDeposited - Total amount deposited in the pool
 * @param params - Interest rate model parameters
 * @returns Borrow rate as a decimal (e.g., 0.05 = 5%)
 * @throws If utilization > 1 or deposits are zero with borrows
 */
export function calculateBorrowRate(
  totalBorrowed: number,
  totalDeposited: number,
  params: RateModelParams,
): number {
  // TODO: 1. Calculate utilization = totalBorrowed / totalDeposited
  // TODO: 2. Handle edge case: zero deposits with zero borrows = 0 utilization
  // TODO: 3. If utilization <= optimalUtilization:
  //          rate = baseRate + (utilization / optimalUtilization) * slope1
  // TODO: 4. If utilization > optimalUtilization:
  //          rate = baseRate + slope1 + ((utilization - optimal) / (1 - optimal)) * slope2
  // TODO: 5. Return rate rounded to 6 decimal places
}`,
    solution: `interface RateModelParams {
  baseRate: number;
  slope1: number;
  slope2: number;
  optimalUtilization: number;
}

export function calculateBorrowRate(
  totalBorrowed: number,
  totalDeposited: number,
  params: RateModelParams,
): number {
  if (totalDeposited === 0) {
    if (totalBorrowed === 0) return params.baseRate;
    throw new Error('Cannot have borrows with zero deposits');
  }

  const utilization = totalBorrowed / totalDeposited;

  if (utilization > 1) {
    throw new Error('Utilization cannot exceed 100%');
  }

  let rate: number;

  if (utilization <= params.optimalUtilization) {
    rate =
      params.baseRate +
      (utilization / params.optimalUtilization) * params.slope1;
  } else {
    const excessUtilization = utilization - params.optimalUtilization;
    const maxExcess = 1 - params.optimalUtilization;
    rate =
      params.baseRate +
      params.slope1 +
      (excessUtilization / maxExcess) * params.slope2;
  }

  return Math.round(rate * 1_000_000) / 1_000_000;
}`,
    testCases: [
      {
        input: 'borrowed=400000, deposited=1000000, params={baseRate:0.02, slope1:0.04, slope2:0.75, optimalUtilization:0.80}',
        expectedOutput: '0.04',
        description: '40% utilization (below kink) yields baseRate + 50% of slope1',
      },
      {
        input: 'borrowed=900000, deposited=1000000, params={baseRate:0.02, slope1:0.04, slope2:0.75, optimalUtilization:0.80}',
        expectedOutput: '0.435',
        description: '90% utilization (above kink) activates the steep jump multiplier',
      },
      {
        input: 'borrowed=0, deposited=1000000, params={baseRate:0.02, slope1:0.04, slope2:0.75, optimalUtilization:0.80}',
        expectedOutput: '0.02',
        description: 'Zero utilization returns only the base rate',
      },
    ],
    hints: [
      'The kink-based model creates two linear segments: a gentle slope up to optimal utilization, and a steep slope above it',
      'Utilization = totalBorrowed / totalDeposited — handle the zero-deposit edge case first',
      'Above the kink: the excess utilization ratio is (util - optimal) / (1 - optimal), multiplied by slope2',
    ],
    xpReward: 100,
    estimatedMinutes: 25,
  },
  {
    id: 'defi-008',
    title: 'Determine Collateral Ratio',
    description:
      'Calculate the collateral ratio for a lending position. Given the collateral value and borrowed value (both in USD), compute the ratio and classify the position health: "healthy" (>= 150%), "warning" (>= 120% and < 150%), or "liquidatable" (< 120%). Use oracle prices for conversion.',
    difficulty: 'intermediate',
    category: 'defi',
    language: 'typescript',
    starterCode: `interface Position {
  collateralAmount: number;
  collateralPriceUsd: number;
  borrowedAmount: number;
  borrowedPriceUsd: number;
}

type HealthStatus = 'healthy' | 'warning' | 'liquidatable';

interface CollateralResult {
  ratio: number;          // e.g., 1.5 for 150%
  ratioPercent: number;   // e.g., 150
  status: HealthStatus;
  collateralValueUsd: number;
  borrowedValueUsd: number;
}

/**
 * Calculate collateral ratio and health status of a lending position.
 * @param position - The lending position details
 * @returns Collateral analysis result
 * @throws If borrowed amount is zero or prices are non-positive
 */
export function analyzeCollateral(position: Position): CollateralResult {
  // TODO: 1. Validate prices are positive
  // TODO: 2. Calculate USD values: amount * price
  // TODO: 3. Calculate ratio: collateralValueUsd / borrowedValueUsd
  // TODO: 4. Determine status based on ratio thresholds
  // TODO: 5. Return CollateralResult
}`,
    solution: `interface Position {
  collateralAmount: number;
  collateralPriceUsd: number;
  borrowedAmount: number;
  borrowedPriceUsd: number;
}

type HealthStatus = 'healthy' | 'warning' | 'liquidatable';

interface CollateralResult {
  ratio: number;
  ratioPercent: number;
  status: HealthStatus;
  collateralValueUsd: number;
  borrowedValueUsd: number;
}

export function analyzeCollateral(position: Position): CollateralResult {
  if (position.collateralPriceUsd <= 0 || position.borrowedPriceUsd <= 0) {
    throw new Error('Prices must be positive');
  }
  if (position.borrowedAmount <= 0) {
    throw new Error('Borrowed amount must be positive');
  }

  const collateralValueUsd = position.collateralAmount * position.collateralPriceUsd;
  const borrowedValueUsd = position.borrowedAmount * position.borrowedPriceUsd;

  const ratio = collateralValueUsd / borrowedValueUsd;
  const ratioPercent = Math.round(ratio * 10000) / 100;

  let status: HealthStatus;
  if (ratio >= 1.5) {
    status = 'healthy';
  } else if (ratio >= 1.2) {
    status = 'warning';
  } else {
    status = 'liquidatable';
  }

  return {
    ratio: Math.round(ratio * 1_000_000) / 1_000_000,
    ratioPercent,
    status,
    collateralValueUsd,
    borrowedValueUsd,
  };
}`,
    testCases: [
      {
        input: 'collateralAmount=10, collateralPrice=150, borrowedAmount=500, borrowedPrice=1',
        expectedOutput: '{ ratio: 3, ratioPercent: 300, status: "healthy", collateralValueUsd: 1500, borrowedValueUsd: 500 }',
        description: '300% collateral ratio is classified as healthy',
      },
      {
        input: 'collateralAmount=10, collateralPrice=150, borrowedAmount=1100, borrowedPrice=1',
        expectedOutput: '{ ratio: 1.363636, ratioPercent: 136.36, status: "warning", collateralValueUsd: 1500, borrowedValueUsd: 1100 }',
        description: '~136% ratio is classified as warning',
      },
      {
        input: 'collateralAmount=10, collateralPrice=100, borrowedAmount=1000, borrowedPrice=1',
        expectedOutput: '{ ratio: 1, ratioPercent: 100, status: "liquidatable", collateralValueUsd: 1000, borrowedValueUsd: 1000 }',
        description: '100% ratio is classified as liquidatable',
      },
    ],
    hints: [
      'Collateral ratio = (collateral_amount * collateral_price) / (borrowed_amount * borrowed_price)',
      'Healthy >= 150%, Warning >= 120% and < 150%, Liquidatable < 120%',
      'Always validate that prices are positive and borrowed amount is non-zero to prevent division errors',
    ],
    xpReward: 100,
    estimatedMinutes: 20,
  },
  {
    id: 'defi-009',
    title: 'Detect Flash Loan Pattern',
    description:
      'Implement a function that analyzes a sequence of transaction instructions to detect a flash loan pattern. A flash loan is identified when: (1) a borrow instruction occurs, (2) arbitrary instructions follow, and (3) a repay instruction for the same or greater amount occurs within the same transaction. The repay must include the flash loan fee.',
    difficulty: 'intermediate',
    category: 'defi',
    language: 'typescript',
    starterCode: `interface Instruction {
  programId: string;
  type: 'borrow' | 'repay' | 'swap' | 'transfer' | 'other';
  amount?: number;
  token?: string;
}

interface FlashLoanDetection {
  isFlashLoan: boolean;
  borrowAmount: number;
  repayAmount: number;
  fee: number;
  intermediateSteps: number;
}

/**
 * Detect flash loan pattern in a list of transaction instructions.
 * @param instructions - Ordered list of instructions in a transaction
 * @param flashLoanFeeBps - Expected flash loan fee in basis points
 * @returns Detection result with breakdown
 */
export function detectFlashLoan(
  instructions: Instruction[],
  flashLoanFeeBps: number,
): FlashLoanDetection {
  // TODO: 1. Find the first 'borrow' instruction
  // TODO: 2. Find a matching 'repay' instruction (same token, amount >= borrow + fee)
  // TODO: 3. Count intermediate steps between borrow and repay
  // TODO: 4. Calculate the fee as repayAmount - borrowAmount
  // TODO: 5. Return detection result
}`,
    solution: `interface Instruction {
  programId: string;
  type: 'borrow' | 'repay' | 'swap' | 'transfer' | 'other';
  amount?: number;
  token?: string;
}

interface FlashLoanDetection {
  isFlashLoan: boolean;
  borrowAmount: number;
  repayAmount: number;
  fee: number;
  intermediateSteps: number;
}

export function detectFlashLoan(
  instructions: Instruction[],
  flashLoanFeeBps: number,
): FlashLoanDetection {
  const noDetection: FlashLoanDetection = {
    isFlashLoan: false,
    borrowAmount: 0,
    repayAmount: 0,
    fee: 0,
    intermediateSteps: 0,
  };

  const borrowIndex = instructions.findIndex((ix) => ix.type === 'borrow' && ix.amount !== undefined && ix.token !== undefined);
  if (borrowIndex === -1) return noDetection;

  const borrow = instructions[borrowIndex];
  const borrowAmount = borrow.amount!;
  const borrowToken = borrow.token!;
  const minimumRepay = borrowAmount + (borrowAmount * flashLoanFeeBps) / 10000;

  const repayIndex = instructions.findIndex(
    (ix, i) =>
      i > borrowIndex &&
      ix.type === 'repay' &&
      ix.token === borrowToken &&
      ix.amount !== undefined &&
      ix.amount >= minimumRepay,
  );

  if (repayIndex === -1) return noDetection;

  const repayAmount = instructions[repayIndex].amount!;
  const intermediateSteps = repayIndex - borrowIndex - 1;

  return {
    isFlashLoan: true,
    borrowAmount,
    repayAmount,
    fee: repayAmount - borrowAmount,
    intermediateSteps,
  };
}`,
    testCases: [
      {
        input: 'instructions=[{type:"borrow",amount:1000000,token:"USDC"},{type:"swap",amount:1000000},{type:"swap",amount:500000},{type:"repay",amount:1000900,token:"USDC"}], feeBps=9',
        expectedOutput: '{ isFlashLoan: true, borrowAmount: 1000000, repayAmount: 1000900, fee: 900, intermediateSteps: 2 }',
        description: 'Detects classic flash loan with two swaps in between borrow and repay',
      },
      {
        input: 'instructions=[{type:"transfer",amount:500},{type:"swap",amount:1000}], feeBps=9',
        expectedOutput: '{ isFlashLoan: false, borrowAmount: 0, repayAmount: 0, fee: 0, intermediateSteps: 0 }',
        description: 'Returns no detection when no borrow instruction exists',
      },
      {
        input: 'instructions=[{type:"borrow",amount:1000000,token:"USDC"},{type:"swap",amount:500000},{type:"repay",amount:1000000,token:"USDC"}], feeBps=9',
        expectedOutput: '{ isFlashLoan: false, borrowAmount: 0, repayAmount: 0, fee: 0, intermediateSteps: 0 }',
        description: 'Rejects when repay amount does not cover the flash loan fee',
      },
    ],
    hints: [
      'A flash loan always has a borrow-then-repay pattern within the same transaction',
      'The repay amount must be >= borrowAmount + (borrowAmount * feeBps / 10000)',
      'Match on the same token — a USDC borrow must be repaid in USDC, not SOL',
    ],
    xpReward: 100,
    estimatedMinutes: 25,
  },
  {
    id: 'defi-010',
    title: 'Compute Yield Farming Rewards',
    description:
      'Calculate pending yield farming rewards for a staker. The reward distribution uses a global accumulator pattern: rewards accrue proportionally to each staker\'s share of the total staked amount. Implement the reward debt model used by MasterChef-style contracts.',
    difficulty: 'intermediate',
    category: 'defi',
    language: 'rust',
    starterCode: `/// Global farm state tracking cumulative rewards per share.
pub struct FarmState {
    pub total_staked: u64,
    pub acc_reward_per_share: u128, // Scaled by 1e12
    pub reward_per_second: u64,
    pub last_update_timestamp: i64,
}

/// Individual user staking position.
pub struct UserStake {
    pub amount: u64,
    pub reward_debt: u128, // Scaled by 1e12
}

const PRECISION: u128 = 1_000_000_000_000; // 1e12

/// Update the farm's accumulated reward per share based on elapsed time.
/// Returns the updated acc_reward_per_share.
pub fn update_farm(farm: &mut FarmState, current_timestamp: i64) -> u128 {
    // TODO: 1. If total_staked is 0, just update timestamp and return
    // TODO: 2. Calculate elapsed seconds since last update
    // TODO: 3. Calculate new rewards: elapsed * reward_per_second
    // TODO: 4. Update acc_reward_per_share += (new_rewards * PRECISION) / total_staked
    // TODO: 5. Update last_update_timestamp
    // TODO: 6. Return updated acc_reward_per_share
    todo!()
}

/// Calculate pending rewards for a user (without modifying state).
pub fn pending_rewards(farm: &FarmState, user: &UserStake, current_timestamp: i64) -> u64 {
    // TODO: 1. Calculate what acc_reward_per_share would be at current_timestamp
    // TODO: 2. pending = (user.amount * updated_acc_per_share) / PRECISION - user.reward_debt
    // TODO: 3. Return as u64
    todo!()
}`,
    solution: `pub struct FarmState {
    pub total_staked: u64,
    pub acc_reward_per_share: u128,
    pub reward_per_second: u64,
    pub last_update_timestamp: i64,
}

pub struct UserStake {
    pub amount: u64,
    pub reward_debt: u128,
}

const PRECISION: u128 = 1_000_000_000_000;

pub fn update_farm(farm: &mut FarmState, current_timestamp: i64) -> u128 {
    if farm.total_staked == 0 {
        farm.last_update_timestamp = current_timestamp;
        return farm.acc_reward_per_share;
    }

    let elapsed = (current_timestamp - farm.last_update_timestamp) as u128;
    let new_rewards = elapsed * farm.reward_per_second as u128;
    farm.acc_reward_per_share += (new_rewards * PRECISION) / farm.total_staked as u128;
    farm.last_update_timestamp = current_timestamp;

    farm.acc_reward_per_share
}

pub fn pending_rewards(farm: &FarmState, user: &UserStake, current_timestamp: i64) -> u64 {
    let mut acc = farm.acc_reward_per_share;

    if farm.total_staked > 0 {
        let elapsed = (current_timestamp - farm.last_update_timestamp) as u128;
        let new_rewards = elapsed * farm.reward_per_second as u128;
        acc += (new_rewards * PRECISION) / farm.total_staked as u128;
    }

    let accumulated = (user.amount as u128 * acc) / PRECISION;
    let pending = accumulated.saturating_sub(user.reward_debt);

    pending as u64
}`,
    testCases: [
      {
        input: 'total_staked=1000, reward_per_second=10, elapsed=100, user_amount=500, reward_debt=0',
        expectedOutput: 'pending=500',
        description: 'User with 50% of pool share earns 50% of rewards over 100 seconds',
      },
      {
        input: 'total_staked=0, reward_per_second=10, elapsed=100, user_amount=0, reward_debt=0',
        expectedOutput: 'pending=0',
        description: 'Empty pool accumulates no rewards even with time elapsed',
      },
      {
        input: 'total_staked=2000, reward_per_second=100, elapsed=60, user_amount=500, reward_debt=750000000000',
        expectedOutput: 'pending=750',
        description: 'Existing user with reward_debt correctly calculates only new pending rewards',
      },
    ],
    hints: [
      'The accumulator pattern uses acc_reward_per_share scaled by 1e12 to maintain precision with integer math',
      'reward_debt represents rewards already claimed — pending = accumulated - debt',
      'When computing pending without mutation, simulate what acc_reward_per_share would be at the current timestamp',
    ],
    xpReward: 100,
    estimatedMinutes: 30,
  },
  {
    id: 'defi-011',
    title: 'Calculate Impermanent Loss',
    description:
      'Implement a function to calculate impermanent loss for a liquidity provider in a constant product AMM. Given the initial price and current price of the token pair, compute the loss compared to simply holding the assets. Return the loss as a percentage.',
    difficulty: 'intermediate',
    category: 'defi',
    language: 'typescript',
    starterCode: `interface ImpermanentLossResult {
  lossPercent: number;     // e.g., 5.72 for 5.72%
  lpValue: number;         // Current value if providing liquidity
  holdValue: number;       // Current value if just holding
  lossAbsolute: number;    // holdValue - lpValue
}

/**
 * Calculate impermanent loss for an LP position.
 *
 * Formula: IL = 2 * sqrt(priceRatio) / (1 + priceRatio) - 1
 *
 * @param initialPrice - Price of token A in terms of token B at deposit time
 * @param currentPrice - Current price of token A in terms of token B
 * @param initialValueUsd - Total USD value deposited (split 50/50)
 * @returns Impermanent loss analysis
 * @throws If prices are non-positive
 */
export function calculateImpermanentLoss(
  initialPrice: number,
  currentPrice: number,
  initialValueUsd: number,
): ImpermanentLossResult {
  // TODO: 1. Calculate price ratio = currentPrice / initialPrice
  // TODO: 2. Apply IL formula: IL = 2 * sqrt(priceRatio) / (1 + priceRatio) - 1
  // TODO: 3. Calculate LP value: initialValueUsd * (1 + IL)
  // TODO: 4. Calculate hold value from initial token amounts at new price
  // TODO: 5. Return the result
}`,
    solution: `interface ImpermanentLossResult {
  lossPercent: number;
  lpValue: number;
  holdValue: number;
  lossAbsolute: number;
}

export function calculateImpermanentLoss(
  initialPrice: number,
  currentPrice: number,
  initialValueUsd: number,
): ImpermanentLossResult {
  if (initialPrice <= 0 || currentPrice <= 0) {
    throw new Error('Prices must be positive');
  }
  if (initialValueUsd <= 0) {
    throw new Error('Initial value must be positive');
  }

  const priceRatio = currentPrice / initialPrice;
  const ilFactor = (2 * Math.sqrt(priceRatio)) / (1 + priceRatio) - 1;

  const lpValue = initialValueUsd * (1 + ilFactor);

  const halfValue = initialValueUsd / 2;
  const initialTokenAAmount = halfValue / initialPrice;
  const initialTokenBAmount = halfValue;
  const holdValue = initialTokenAAmount * currentPrice + initialTokenBAmount;

  const lossAbsolute = holdValue - lpValue;
  const lossPercent = Math.round(Math.abs(ilFactor) * 10000) / 100;

  return {
    lossPercent,
    lpValue: Math.round(lpValue * 100) / 100,
    holdValue: Math.round(holdValue * 100) / 100,
    lossAbsolute: Math.round(lossAbsolute * 100) / 100,
  };
}`,
    testCases: [
      {
        input: 'initialPrice=100, currentPrice=100, initialValueUsd=10000',
        expectedOutput: '{ lossPercent: 0, lpValue: 10000, holdValue: 10000, lossAbsolute: 0 }',
        description: 'No impermanent loss when price remains unchanged',
      },
      {
        input: 'initialPrice=100, currentPrice=200, initialValueUsd=10000',
        expectedOutput: '{ lossPercent: 5.72, lpValue: 14142.14, holdValue: 15000, lossAbsolute: 857.86 }',
        description: '2x price increase results in ~5.72% impermanent loss',
      },
      {
        input: 'initialPrice=100, currentPrice=400, initialValueUsd=10000',
        expectedOutput: '{ lossPercent: 20, lpValue: 20000, holdValue: 25000, lossAbsolute: 5000 }',
        description: '4x price increase results in 20% impermanent loss',
      },
    ],
    hints: [
      'The IL formula is: IL = 2 * sqrt(r) / (1 + r) - 1, where r = currentPrice / initialPrice',
      'Hold value assumes you kept 50% in token A and 50% in token B from the start',
      'IL is always negative (a loss) — the LP always underperforms holding when prices diverge',
    ],
    xpReward: 100,
    estimatedMinutes: 25,
  },
  {
    id: 'defi-012',
    title: 'Order Book Matching Engine',
    description:
      'Implement a simple order book matching engine. Given a new incoming order (buy or sell) and the existing order book, match the order against resting orders using price-time priority. Return the list of fills and any remaining unfilled quantity.',
    difficulty: 'intermediate',
    category: 'defi',
    language: 'typescript',
    starterCode: `interface Order {
  id: string;
  side: 'buy' | 'sell';
  price: number;
  quantity: number;
  timestamp: number;
}

interface Fill {
  buyOrderId: string;
  sellOrderId: string;
  price: number;
  quantity: number;
}

interface MatchResult {
  fills: Fill[];
  remainingQuantity: number;
}

/**
 * Match an incoming order against the order book.
 * Buy orders match against asks (sells) sorted by lowest price first.
 * Sell orders match against bids (buys) sorted by highest price first.
 *
 * @param incoming - The new order to match
 * @param book - Existing resting orders on the opposite side
 * @returns Fills and remaining unfilled quantity
 */
export function matchOrder(incoming: Order, book: Order[]): MatchResult {
  // TODO: 1. Sort the book by price priority (best price first) then by timestamp
  // TODO: 2. Iterate through resting orders, checking price compatibility
  //          - Buy incoming: match if resting.price <= incoming.price
  //          - Sell incoming: match if resting.price >= incoming.price
  // TODO: 3. For each match, create a Fill and reduce quantities
  // TODO: 4. Stop when incoming is fully filled or no more compatible orders
  // TODO: 5. Return fills and remaining quantity
}`,
    solution: `interface Order {
  id: string;
  side: 'buy' | 'sell';
  price: number;
  quantity: number;
  timestamp: number;
}

interface Fill {
  buyOrderId: string;
  sellOrderId: string;
  price: number;
  quantity: number;
}

interface MatchResult {
  fills: Fill[];
  remainingQuantity: number;
}

export function matchOrder(incoming: Order, book: Order[]): MatchResult {
  const fills: Fill[] = [];
  let remaining = incoming.quantity;

  const sorted = [...book].sort((a, b) => {
    if (incoming.side === 'buy') {
      return a.price === b.price ? a.timestamp - b.timestamp : a.price - b.price;
    }
    return a.price === b.price ? a.timestamp - b.timestamp : b.price - a.price;
  });

  for (const resting of sorted) {
    if (remaining <= 0) break;

    const isCompatible =
      incoming.side === 'buy'
        ? resting.price <= incoming.price
        : resting.price >= incoming.price;

    if (!isCompatible) break;

    const fillQty = Math.min(remaining, resting.quantity);
    const buyId = incoming.side === 'buy' ? incoming.id : resting.id;
    const sellId = incoming.side === 'sell' ? incoming.id : resting.id;

    fills.push({
      buyOrderId: buyId,
      sellOrderId: sellId,
      price: resting.price,
      quantity: fillQty,
    });

    remaining -= fillQty;
    resting.quantity -= fillQty;
  }

  return { fills, remainingQuantity: remaining };
}`,
    testCases: [
      {
        input: 'incoming={id:"B1",side:"buy",price:105,quantity:10,ts:3}, book=[{id:"S1",side:"sell",price:100,quantity:5,ts:1},{id:"S2",side:"sell",price:103,quantity:8,ts:2}]',
        expectedOutput: '{ fills: [{buyOrderId:"B1",sellOrderId:"S1",price:100,quantity:5},{buyOrderId:"B1",sellOrderId:"S2",price:103,quantity:5}], remainingQuantity: 0 }',
        description: 'Buy order fills against two sell orders at their resting prices',
      },
      {
        input: 'incoming={id:"B2",side:"buy",price:99,quantity:10,ts:3}, book=[{id:"S1",side:"sell",price:100,quantity:5,ts:1}]',
        expectedOutput: '{ fills: [], remainingQuantity: 10 }',
        description: 'Buy order below best ask produces no fills',
      },
      {
        input: 'incoming={id:"S3",side:"sell",price:95,quantity:3,ts:3}, book=[{id:"B1",side:"buy",price:100,quantity:5,ts:1},{id:"B2",side:"buy",price:98,quantity:5,ts:2}]',
        expectedOutput: '{ fills: [{buyOrderId:"B1",sellOrderId:"S3",price:100,quantity:3}], remainingQuantity: 0 }',
        description: 'Sell order matches against the highest bid first',
      },
    ],
    hints: [
      'For a buy order, sort asks ascending by price (cheapest first); for a sell, sort bids descending (highest first)',
      'Fills execute at the resting order\'s price (the maker\'s price), not the taker\'s price',
      'Break out of the matching loop as soon as prices are no longer compatible — the book is sorted',
    ],
    xpReward: 100,
    estimatedMinutes: 30,
  },
  {
    id: 'defi-013',
    title: 'Calculate Time-Weighted Average Price',
    description:
      'Implement a TWAP (Time-Weighted Average Price) calculator. Given a series of price observations with timestamps, compute the TWAP over a specified time window. Each price is weighted by the duration it was active.',
    difficulty: 'intermediate',
    category: 'defi',
    language: 'rust',
    starterCode: `/// A single price observation at a point in time.
pub struct PriceObservation {
    pub price: u64,      // Price scaled by 1e6
    pub timestamp: i64,  // Unix timestamp in seconds
}

/// Calculate TWAP over a time window.
///
/// # Arguments
/// * \`observations\` - Price observations sorted by timestamp (ascending)
/// * \`window_start\` - Start of the TWAP window (unix timestamp)
/// * \`window_end\` - End of the TWAP window (unix timestamp)
///
/// # Returns
/// * TWAP as u64 (scaled by 1e6), or None if insufficient data
pub fn calculate_twap(
    observations: &[PriceObservation],
    window_start: i64,
    window_end: i64,
) -> Option<u64> {
    // TODO: 1. Validate window_end > window_start and observations are not empty
    // TODO: 2. Filter observations within or overlapping the window
    // TODO: 3. For each price segment, calculate: price * duration_active
    // TODO: 4. Sum all weighted prices and divide by total window duration
    // TODO: 5. Return TWAP as u64
    todo!()
}`,
    solution: `pub struct PriceObservation {
    pub price: u64,
    pub timestamp: i64,
}

pub fn calculate_twap(
    observations: &[PriceObservation],
    window_start: i64,
    window_end: i64,
) -> Option<u64> {
    if window_end <= window_start || observations.is_empty() {
        return None;
    }

    let window_duration = (window_end - window_start) as u128;
    let mut weighted_sum: u128 = 0;

    let relevant: Vec<&PriceObservation> = observations
        .iter()
        .filter(|o| o.timestamp <= window_end)
        .collect();

    if relevant.is_empty() {
        return None;
    }

    for i in 0..relevant.len() {
        let obs = relevant[i];
        let segment_start = obs.timestamp.max(window_start);
        let segment_end = if i + 1 < relevant.len() {
            relevant[i + 1].timestamp.min(window_end)
        } else {
            window_end
        };

        if segment_end > segment_start {
            let duration = (segment_end - segment_start) as u128;
            weighted_sum += obs.price as u128 * duration;
        }
    }

    if weighted_sum == 0 {
        return None;
    }

    Some((weighted_sum / window_duration) as u64)
}`,
    testCases: [
      {
        input: 'observations=[{price:100_000000,ts:0},{price:200_000000,ts:50}], window_start=0, window_end=100',
        expectedOutput: 'Some(150_000000)',
        description: 'Two equal-duration price segments produce the simple average',
      },
      {
        input: 'observations=[{price:100_000000,ts:0},{price:300_000000,ts:75}], window_start=0, window_end=100',
        expectedOutput: 'Some(150_000000)',
        description: 'Price active for 75% of window is weighted 3x more than 25% segment',
      },
      {
        input: 'observations=[], window_start=0, window_end=100',
        expectedOutput: 'None',
        description: 'Returns None when no observations are available',
      },
    ],
    hints: [
      'TWAP = sum(price_i * duration_i) / total_duration — each price is weighted by how long it was the active price',
      'Clamp observation timestamps to the window boundaries: max(obs.ts, window_start) and min(next_obs.ts, window_end)',
      'Use u128 for intermediate multiplication to avoid overflow with scaled prices and durations',
    ],
    xpReward: 100,
    estimatedMinutes: 30,
  },

  // ─── ADVANCED (7) ───────────────────────────────────────────────────
  {
    id: 'defi-014',
    title: 'Fee Structure Implementation',
    description:
      'Implement a tiered fee structure for a DEX protocol. Fees decrease based on the user\'s 30-day trading volume. The tiers are: Tier 1 (< 10K) = 30 bps, Tier 2 (10K-100K) = 25 bps, Tier 3 (100K-1M) = 20 bps, Tier 4 (1M-10M) = 15 bps, Tier 5 (>= 10M) = 10 bps. Also implement maker-taker split where makers get a 40% rebate on fees.',
    difficulty: 'advanced',
    category: 'defi',
    language: 'rust',
    starterCode: `/// Fee tier based on 30-day trading volume (in USD cents to avoid floats).
#[derive(Debug, PartialEq)]
pub enum FeeTier {
    Tier1, // < $10,000
    Tier2, // $10,000 - $100,000
    Tier3, // $100,000 - $1,000,000
    Tier4, // $1,000,000 - $10,000,000
    Tier5, // >= $10,000,000
}

pub struct FeeResult {
    pub tier: FeeTier,
    pub taker_fee_bps: u16,
    pub maker_rebate_bps: u16,
    pub gross_fee: u64,
    pub taker_net_fee: u64,
    pub maker_rebate: u64,
    pub protocol_revenue: u64,
}

/// Determine fee tier from 30-day volume (in USD, scaled by 1e6).
pub fn get_fee_tier(volume_30d: u64) -> FeeTier {
    // TODO: Implement tier determination based on volume thresholds
    todo!()
}

/// Calculate fees for a trade.
///
/// # Arguments
/// * \`trade_amount\` - Trade size in token base units
/// * \`volume_30d\` - User's 30-day volume in USD (scaled by 1e6)
///
/// # Returns
/// * FeeResult with complete fee breakdown
pub fn calculate_fees(trade_amount: u64, volume_30d: u64) -> FeeResult {
    // TODO: 1. Determine fee tier
    // TODO: 2. Get taker fee bps for the tier
    // TODO: 3. Calculate maker rebate as 40% of taker fee
    // TODO: 4. Calculate gross fee, taker net fee, maker rebate, protocol revenue
    // TODO: 5. Protocol revenue = gross_fee - maker_rebate
    todo!()
}`,
    solution: `#[derive(Debug, PartialEq)]
pub enum FeeTier {
    Tier1,
    Tier2,
    Tier3,
    Tier4,
    Tier5,
}

pub struct FeeResult {
    pub tier: FeeTier,
    pub taker_fee_bps: u16,
    pub maker_rebate_bps: u16,
    pub gross_fee: u64,
    pub taker_net_fee: u64,
    pub maker_rebate: u64,
    pub protocol_revenue: u64,
}

const VOLUME_TIER2: u64 = 10_000_000_000;      // $10K * 1e6
const VOLUME_TIER3: u64 = 100_000_000_000;      // $100K * 1e6
const VOLUME_TIER4: u64 = 1_000_000_000_000;    // $1M * 1e6
const VOLUME_TIER5: u64 = 10_000_000_000_000;   // $10M * 1e6

const MAKER_REBATE_PERCENT: u64 = 40;
const BPS_DIVISOR: u64 = 10_000;

pub fn get_fee_tier(volume_30d: u64) -> FeeTier {
    if volume_30d >= VOLUME_TIER5 {
        FeeTier::Tier5
    } else if volume_30d >= VOLUME_TIER4 {
        FeeTier::Tier4
    } else if volume_30d >= VOLUME_TIER3 {
        FeeTier::Tier3
    } else if volume_30d >= VOLUME_TIER2 {
        FeeTier::Tier2
    } else {
        FeeTier::Tier1
    }
}

fn tier_fee_bps(tier: &FeeTier) -> u16 {
    match tier {
        FeeTier::Tier1 => 30,
        FeeTier::Tier2 => 25,
        FeeTier::Tier3 => 20,
        FeeTier::Tier4 => 15,
        FeeTier::Tier5 => 10,
    }
}

pub fn calculate_fees(trade_amount: u64, volume_30d: u64) -> FeeResult {
    let tier = get_fee_tier(volume_30d);
    let taker_fee_bps = tier_fee_bps(&tier);
    let maker_rebate_bps = ((taker_fee_bps as u64 * MAKER_REBATE_PERCENT) / 100) as u16;

    let gross_fee = (trade_amount as u128 * taker_fee_bps as u128 / BPS_DIVISOR as u128) as u64;
    let maker_rebate = (gross_fee as u128 * MAKER_REBATE_PERCENT as u128 / 100) as u64;
    let taker_net_fee = gross_fee;
    let protocol_revenue = gross_fee - maker_rebate;

    FeeResult {
        tier,
        taker_fee_bps,
        maker_rebate_bps,
        gross_fee,
        taker_net_fee,
        maker_rebate,
        protocol_revenue,
    }
}`,
    testCases: [
      {
        input: 'trade_amount=1_000_000, volume_30d=5_000_000_000 (Tier1, $5K)',
        expectedOutput: 'FeeResult { tier: Tier1, taker_fee_bps: 30, gross_fee: 3000, maker_rebate: 1200, protocol_revenue: 1800 }',
        description: 'Tier 1 user pays 30 bps, protocol keeps 60% after maker rebate',
      },
      {
        input: 'trade_amount=1_000_000, volume_30d=500_000_000_000 (Tier3, $500K)',
        expectedOutput: 'FeeResult { tier: Tier3, taker_fee_bps: 20, gross_fee: 2000, maker_rebate: 800, protocol_revenue: 1200 }',
        description: 'Tier 3 user pays lower 20 bps fee',
      },
      {
        input: 'trade_amount=1_000_000, volume_30d=15_000_000_000_000 (Tier5, $15M)',
        expectedOutput: 'FeeResult { tier: Tier5, taker_fee_bps: 10, gross_fee: 1000, maker_rebate: 400, protocol_revenue: 600 }',
        description: 'Tier 5 whale gets minimum 10 bps fee',
      },
    ],
    hints: [
      'Volume thresholds are in USD scaled by 1e6: $10K = 10_000_000_000',
      'Use u128 for intermediate fee calculations to prevent overflow on large trade amounts',
      'Maker rebate is 40% of the gross fee — protocol_revenue = gross_fee - maker_rebate',
    ],
    xpReward: 200,
    estimatedMinutes: 35,
  },
  {
    id: 'defi-015',
    title: 'Slippage Protection Check',
    description:
      'Implement a comprehensive slippage protection module for a DEX. Given the expected output amount and a maximum slippage tolerance (in bps), calculate the minimum acceptable output. Also implement price impact estimation by comparing the execution price to the mid-market price, and reject trades that exceed configurable impact limits.',
    difficulty: 'advanced',
    category: 'defi',
    language: 'typescript',
    starterCode: `interface SwapQuote {
  inputAmount: bigint;
  expectedOutput: bigint;
  inputReserve: bigint;
  outputReserve: bigint;
}

interface SlippageConfig {
  maxSlippageBps: number;    // e.g., 50 = 0.5%
  maxPriceImpactBps: number; // e.g., 100 = 1%
}

interface SlippageResult {
  minimumOutput: bigint;
  priceImpactBps: number;
  midMarketPrice: number;
  executionPrice: number;
  isAcceptable: boolean;
  rejectReason: string | null;
}

/**
 * Validate a swap against slippage and price impact limits.
 * @param quote - The swap quote details
 * @param config - Slippage protection configuration
 * @returns Slippage analysis with acceptance decision
 */
export function validateSlippage(
  quote: SwapQuote,
  config: SlippageConfig,
): SlippageResult {
  // TODO: 1. Calculate minimum acceptable output: expectedOutput * (10000 - maxSlippageBps) / 10000
  // TODO: 2. Calculate mid-market price: outputReserve / inputReserve
  // TODO: 3. Calculate execution price: expectedOutput / inputAmount
  // TODO: 4. Calculate price impact: (midMarketPrice - executionPrice) / midMarketPrice * 10000
  // TODO: 5. Check if price impact exceeds maxPriceImpactBps
  // TODO: 6. Return SlippageResult with acceptance decision
}`,
    solution: `interface SwapQuote {
  inputAmount: bigint;
  expectedOutput: bigint;
  inputReserve: bigint;
  outputReserve: bigint;
}

interface SlippageConfig {
  maxSlippageBps: number;
  maxPriceImpactBps: number;
}

interface SlippageResult {
  minimumOutput: bigint;
  priceImpactBps: number;
  midMarketPrice: number;
  executionPrice: number;
  isAcceptable: boolean;
  rejectReason: string | null;
}

export function validateSlippage(
  quote: SwapQuote,
  config: SlippageConfig,
): SlippageResult {
  const minimumOutput =
    (quote.expectedOutput * BigInt(10000 - config.maxSlippageBps)) / 10000n;

  const midMarketPrice =
    Number(quote.outputReserve) / Number(quote.inputReserve);
  const executionPrice =
    Number(quote.expectedOutput) / Number(quote.inputAmount);

  const priceImpactBps = Math.round(
    ((midMarketPrice - executionPrice) / midMarketPrice) * 10000,
  );

  let isAcceptable = true;
  let rejectReason: string | null = null;

  if (priceImpactBps > config.maxPriceImpactBps) {
    isAcceptable = false;
    rejectReason = \`Price impact \${priceImpactBps} bps exceeds maximum \${config.maxPriceImpactBps} bps\`;
  }

  if (quote.expectedOutput < minimumOutput) {
    isAcceptable = false;
    rejectReason = \`Expected output below minimum after slippage tolerance\`;
  }

  return {
    minimumOutput,
    priceImpactBps,
    midMarketPrice,
    executionPrice,
    isAcceptable,
    rejectReason,
  };
}`,
    testCases: [
      {
        input: 'inputAmount=1000n, expectedOutput=990n, inputReserve=1000000n, outputReserve=1000000n, maxSlippageBps=50, maxPriceImpactBps=100',
        expectedOutput: '{ minimumOutput: 985n, priceImpactBps: 10, isAcceptable: true, rejectReason: null }',
        description: 'Small trade with low impact passes both slippage and impact checks',
      },
      {
        input: 'inputAmount=100000n, expectedOutput=90909n, inputReserve=1000000n, outputReserve=1000000n, maxSlippageBps=50, maxPriceImpactBps=100',
        expectedOutput: '{ minimumOutput: 90454n, priceImpactBps: 909, isAcceptable: false, rejectReason: "Price impact 909 bps exceeds maximum 100 bps" }',
        description: 'Large trade exceeding price impact limit is rejected',
      },
      {
        input: 'inputAmount=1000n, expectedOutput=998n, inputReserve=10000000n, outputReserve=10000000n, maxSlippageBps=10, maxPriceImpactBps=100',
        expectedOutput: '{ minimumOutput: 997n, priceImpactBps: 2, isAcceptable: true, rejectReason: null }',
        description: 'Tiny trade in deep liquidity pool has negligible price impact',
      },
    ],
    hints: [
      'Minimum output = expectedOutput * (10000 - slippageBps) / 10000 using bigint math',
      'Mid-market price = outputReserve / inputReserve (the spot price before the trade)',
      'Price impact = (midMarketPrice - executionPrice) / midMarketPrice, converted to basis points',
    ],
    xpReward: 200,
    estimatedMinutes: 35,
  },
  {
    id: 'defi-016',
    title: 'Multi-Hop Swap Routing',
    description:
      'Implement a multi-hop swap router that finds the best route through multiple liquidity pools. Given a set of pools with their reserves and fees, find the optimal path from input token to output token (up to 3 hops). Use the constant product formula at each hop to calculate the final output.',
    difficulty: 'advanced',
    category: 'defi',
    language: 'typescript',
    starterCode: `interface Pool {
  id: string;
  tokenA: string;
  tokenB: string;
  reserveA: bigint;
  reserveB: bigint;
  feeBps: number;
}

interface Route {
  pools: Pool[];
  tokens: string[];   // [inputToken, ..intermediates, outputToken]
  expectedOutput: bigint;
  priceImpactBps: number;
}

/**
 * Find the best swap route from inputToken to outputToken.
 * Supports direct swaps and up to 3-hop routes.
 *
 * @param pools - Available liquidity pools
 * @param inputToken - Token to sell
 * @param outputToken - Token to buy
 * @param inputAmount - Amount of input token
 * @returns Best route or null if no path exists
 */
export function findBestRoute(
  pools: Pool[],
  inputToken: string,
  outputToken: string,
  inputAmount: bigint,
): Route | null {
  // TODO: 1. Build adjacency map: token -> pools containing that token
  // TODO: 2. Find all valid paths up to 3 hops using BFS/DFS
  // TODO: 3. For each path, simulate the swap at each hop using constant product
  // TODO: 4. Calculate price impact for each route
  // TODO: 5. Return the route with the highest output
}`,
    solution: `interface Pool {
  id: string;
  tokenA: string;
  tokenB: string;
  reserveA: bigint;
  reserveB: bigint;
  feeBps: number;
}

interface Route {
  pools: Pool[];
  tokens: string[];
  expectedOutput: bigint;
  priceImpactBps: number;
}

function swapThroughPool(
  pool: Pool,
  inputToken: string,
  inputAmount: bigint,
): bigint {
  const isAToB = pool.tokenA === inputToken;
  const inputReserve = isAToB ? pool.reserveA : pool.reserveB;
  const outputReserve = isAToB ? pool.reserveB : pool.reserveA;

  const inputAfterFee = (inputAmount * BigInt(10000 - pool.feeBps)) / 10000n;
  const numerator = outputReserve * inputAfterFee;
  const denominator = inputReserve + inputAfterFee;

  return numerator / denominator;
}

function getOtherToken(pool: Pool, token: string): string {
  return pool.tokenA === token ? pool.tokenB : pool.tokenA;
}

function findPaths(
  pools: Pool[],
  current: string,
  target: string,
  visited: Set<string>,
  path: Pool[],
  tokens: string[],
  maxHops: number,
): Array<{ pools: Pool[]; tokens: string[] }> {
  if (current === target && path.length > 0) {
    return [{ pools: [...path], tokens: [...tokens] }];
  }
  if (path.length >= maxHops) return [];

  const results: Array<{ pools: Pool[]; tokens: string[] }> = [];

  for (const pool of pools) {
    if (visited.has(pool.id)) continue;
    if (pool.tokenA !== current && pool.tokenB !== current) continue;

    const nextToken = getOtherToken(pool, current);
    visited.add(pool.id);
    path.push(pool);
    tokens.push(nextToken);

    const found = findPaths(pools, nextToken, target, visited, path, tokens, maxHops);
    results.push(...found);

    tokens.pop();
    path.pop();
    visited.delete(pool.id);
  }

  return results;
}

export function findBestRoute(
  pools: Pool[],
  inputToken: string,
  outputToken: string,
  inputAmount: bigint,
): Route | null {
  const paths = findPaths(pools, inputToken, outputToken, new Set(), [], [inputToken], 3);

  if (paths.length === 0) return null;

  let bestRoute: Route | null = null;

  for (const { pools: routePools, tokens } of paths) {
    let currentAmount = inputAmount;
    let valid = true;

    for (let i = 0; i < routePools.length; i++) {
      currentAmount = swapThroughPool(routePools[i], tokens[i], currentAmount);
      if (currentAmount <= 0n) {
        valid = false;
        break;
      }
    }

    if (!valid) continue;

    const spotPrice = Number(inputAmount) > 0
      ? Number(currentAmount) / Number(inputAmount)
      : 0;

    const firstPool = routePools[0];
    const isAToB = firstPool.tokenA === inputToken;
    const idealSpotPrice = Number(isAToB ? firstPool.reserveB : firstPool.reserveA) /
      Number(isAToB ? firstPool.reserveA : firstPool.reserveB);

    const priceImpactBps = idealSpotPrice > 0
      ? Math.round(((idealSpotPrice - spotPrice) / idealSpotPrice) * 10000)
      : 0;

    const route: Route = {
      pools: routePools,
      tokens,
      expectedOutput: currentAmount,
      priceImpactBps: Math.max(0, priceImpactBps),
    };

    if (!bestRoute || currentAmount > bestRoute.expectedOutput) {
      bestRoute = route;
    }
  }

  return bestRoute;
}`,
    testCases: [
      {
        input: 'pools=[{id:"P1",tokenA:"SOL",tokenB:"USDC",reserveA:10000n,reserveB:1500000n,feeBps:30}], input="SOL", output="USDC", amount=10n',
        expectedOutput: 'Route with expectedOutput ~1496n via direct swap',
        description: 'Direct single-hop swap through SOL/USDC pool',
      },
      {
        input: 'pools=[{id:"P1",tokenA:"SOL",tokenB:"USDC",reserveA:10000n,reserveB:1500000n,feeBps:30},{id:"P2",tokenA:"USDC",tokenB:"RAY",reserveA:1000000n,reserveB:500000n,feeBps:25}], input="SOL", output="RAY", amount=10n',
        expectedOutput: 'Route with 2 hops: SOL->USDC->RAY, tokens=["SOL","USDC","RAY"]',
        description: 'Two-hop route through intermediate USDC pool',
      },
      {
        input: 'pools=[{id:"P1",tokenA:"SOL",tokenB:"USDC",reserveA:10000n,reserveB:1500000n,feeBps:30}], input="SOL", output="RAY", amount=10n',
        expectedOutput: 'null',
        description: 'Returns null when no path exists between tokens',
      },
    ],
    hints: [
      'Use DFS with backtracking to enumerate all paths up to 3 hops — mark pools as visited to avoid cycles',
      'At each hop, apply the constant product formula accounting for the pool\'s fee',
      'Compare routes by expectedOutput — the route giving the most output tokens is the best',
    ],
    xpReward: 200,
    estimatedMinutes: 45,
  },
  {
    id: 'defi-017',
    title: 'Vault Deposit and Withdraw Logic',
    description:
      'Implement a yield vault that accepts deposits and withdrawals using a shares-based accounting model (like ERC-4626). Depositors receive vault shares proportional to their deposit relative to total assets. Withdrawals burn shares and return the proportional underlying assets. Handle edge cases like first deposit, rounding, and donation attacks.',
    difficulty: 'advanced',
    category: 'defi',
    language: 'rust',
    starterCode: `pub struct Vault {
    pub total_shares: u64,
    pub total_assets: u64,
    /// Minimum shares locked on first deposit to prevent donation attacks
    pub minimum_locked_shares: u64,
}

pub struct DepositResult {
    pub shares_minted: u64,
    pub shares_locked: u64,  // Only non-zero for first depositor
}

pub struct WithdrawResult {
    pub assets_returned: u64,
    pub shares_burned: u64,
}

impl Vault {
    pub fn new() -> Self {
        Vault {
            total_shares: 0,
            total_assets: 0,
            minimum_locked_shares: 1000, // Dead shares to prevent manipulation
        }
    }

    /// Deposit assets into the vault and receive shares.
    ///
    /// First depositor: shares = assets - minimum_locked_shares (locked shares go to vault)
    /// Subsequent: shares = (assets * total_shares) / total_assets
    pub fn deposit(&mut self, assets: u64) -> Result<DepositResult, &'static str> {
        // TODO: 1. Validate assets > 0
        // TODO: 2. Handle first deposit with dead shares
        // TODO: 3. Calculate shares for subsequent deposits
        // TODO: 4. Update totals
        // TODO: 5. Return DepositResult
        todo!()
    }

    /// Withdraw assets by burning shares.
    ///
    /// assets = (shares * total_assets) / total_shares
    pub fn withdraw(&mut self, shares: u64) -> Result<WithdrawResult, &'static str> {
        // TODO: 1. Validate shares > 0 and <= user's balance (caller responsibility)
        // TODO: 2. Calculate assets to return
        // TODO: 3. Validate vault has enough assets
        // TODO: 4. Update totals
        // TODO: 5. Return WithdrawResult
        todo!()
    }

    /// Preview how many shares a deposit would mint (read-only).
    pub fn preview_deposit(&self, assets: u64) -> u64 {
        // TODO: Return preview without modifying state
        todo!()
    }

    /// Preview how many assets a withdrawal would return (read-only).
    pub fn preview_withdraw(&self, shares: u64) -> u64 {
        // TODO: Return preview without modifying state
        todo!()
    }
}`,
    solution: `pub struct Vault {
    pub total_shares: u64,
    pub total_assets: u64,
    pub minimum_locked_shares: u64,
}

pub struct DepositResult {
    pub shares_minted: u64,
    pub shares_locked: u64,
}

pub struct WithdrawResult {
    pub assets_returned: u64,
    pub shares_burned: u64,
}

impl Vault {
    pub fn new() -> Self {
        Vault {
            total_shares: 0,
            total_assets: 0,
            minimum_locked_shares: 1000,
        }
    }

    pub fn deposit(&mut self, assets: u64) -> Result<DepositResult, &'static str> {
        if assets == 0 {
            return Err("Deposit amount must be greater than zero");
        }

        let (shares_minted, shares_locked) = if self.total_shares == 0 {
            if assets <= self.minimum_locked_shares {
                return Err("Initial deposit must exceed minimum locked shares");
            }
            let total_shares = assets;
            let user_shares = assets - self.minimum_locked_shares;
            (user_shares, self.minimum_locked_shares)
        } else {
            let shares = (assets as u128)
                .checked_mul(self.total_shares as u128)
                .ok_or("Overflow in share calculation")?
                / self.total_assets as u128;
            if shares == 0 {
                return Err("Deposit too small to mint any shares");
            }
            (shares as u64, 0u64)
        };

        self.total_assets = self.total_assets
            .checked_add(assets)
            .ok_or("Overflow in total assets")?;
        self.total_shares = self.total_shares
            .checked_add(shares_minted)
            .checked_and_then(|s| s.checked_add(shares_locked))
            .unwrap_or(
                self.total_shares
                    .checked_add(shares_minted + shares_locked)
                    .ok_or("Overflow in total shares")?,
            );

        Ok(DepositResult {
            shares_minted,
            shares_locked,
        })
    }

    pub fn withdraw(&mut self, shares: u64) -> Result<WithdrawResult, &'static str> {
        if shares == 0 {
            return Err("Withdrawal shares must be greater than zero");
        }
        if shares > self.total_shares {
            return Err("Insufficient shares in vault");
        }

        let assets = (shares as u128)
            .checked_mul(self.total_assets as u128)
            .ok_or("Overflow in asset calculation")?
            / self.total_shares as u128;

        let assets = assets as u64;
        if assets > self.total_assets {
            return Err("Insufficient assets in vault");
        }

        self.total_shares = self.total_shares
            .checked_sub(shares)
            .ok_or("Underflow in total shares")?;
        self.total_assets = self.total_assets
            .checked_sub(assets)
            .ok_or("Underflow in total assets")?;

        Ok(WithdrawResult {
            assets_returned: assets,
            shares_burned: shares,
        })
    }

    pub fn preview_deposit(&self, assets: u64) -> u64 {
        if self.total_shares == 0 {
            if assets <= self.minimum_locked_shares {
                return 0;
            }
            return assets - self.minimum_locked_shares;
        }
        ((assets as u128 * self.total_shares as u128) / self.total_assets as u128) as u64
    }

    pub fn preview_withdraw(&self, shares: u64) -> u64 {
        if self.total_shares == 0 {
            return 0;
        }
        ((shares as u128 * self.total_assets as u128) / self.total_shares as u128) as u64
    }
}`,
    testCases: [
      {
        input: 'vault=new(), deposit(1_000_000)',
        expectedOutput: 'DepositResult { shares_minted: 999_000, shares_locked: 1000 }',
        description: 'First deposit locks minimum dead shares to prevent donation attacks',
      },
      {
        input: 'vault={total_shares:1_000_000, total_assets:1_100_000}, deposit(110_000)',
        expectedOutput: 'DepositResult { shares_minted: 100_000, shares_locked: 0 }',
        description: 'Subsequent deposit gets shares proportional to current exchange rate',
      },
      {
        input: 'vault={total_shares:1_000_000, total_assets:1_100_000}, withdraw(100_000)',
        expectedOutput: 'WithdrawResult { assets_returned: 110_000, shares_burned: 100_000 }',
        description: 'Withdrawal returns proportional assets including accrued yield',
      },
    ],
    hints: [
      'First deposit mints dead shares (locked forever) to prevent the donation attack where an attacker inflates share price',
      'shares_to_mint = (deposit_amount * total_shares) / total_assets — use u128 intermediates',
      'Rounding favors the vault (round down on deposits, round down on withdrawals) to prevent draining',
    ],
    xpReward: 200,
    estimatedMinutes: 40,
  },
  {
    id: 'defi-018',
    title: 'Staking Reward Distribution',
    description:
      'Implement a staking reward distribution system that supports multiple reward tokens, time-locked bonuses, and early unstake penalties. Stakers earn base rewards proportional to their share, plus bonus multipliers based on lock duration (30d=1x, 90d=1.5x, 180d=2x, 365d=3x). Early unstaking forfeits the bonus and incurs a 10% penalty on the base reward.',
    difficulty: 'advanced',
    category: 'defi',
    language: 'rust',
    starterCode: `use std::collections::HashMap;

#[derive(Debug, Clone, PartialEq)]
pub enum LockDuration {
    Days30,
    Days90,
    Days180,
    Days365,
}

pub struct StakePosition {
    pub amount: u64,
    pub lock_duration: LockDuration,
    pub start_timestamp: i64,
    pub lock_end_timestamp: i64,
}

pub struct RewardPool {
    pub total_staked: u64,
    pub reward_rate_per_second: HashMap<String, u64>, // token_id -> rate
    pub last_update: i64,
    pub acc_rewards_per_share: HashMap<String, u128>,  // token_id -> accumulator (1e12)
}

pub struct ClaimResult {
    pub rewards: HashMap<String, u64>,  // token_id -> amount
    pub bonus_multiplier: u64,          // basis points (10000 = 1x)
    pub penalty_applied: bool,
    pub penalty_amount: HashMap<String, u64>,
}

const PRECISION: u128 = 1_000_000_000_000;

/// Get the bonus multiplier in basis points for a lock duration.
pub fn get_multiplier(duration: &LockDuration) -> u64 {
    // TODO: 30d=10000, 90d=15000, 180d=20000, 365d=30000
    todo!()
}

/// Update reward accumulators for all reward tokens.
pub fn update_rewards(pool: &mut RewardPool, current_timestamp: i64) {
    // TODO: For each reward token, update acc_rewards_per_share
    todo!()
}

/// Calculate claimable rewards for a position. Apply bonus if lock is complete,
/// or penalty if claiming early.
pub fn calculate_rewards(
    pool: &RewardPool,
    position: &StakePosition,
    reward_debt: &HashMap<String, u128>,
    current_timestamp: i64,
) -> ClaimResult {
    // TODO: 1. Calculate base pending rewards per token
    // TODO: 2. Determine if lock period has completed
    // TODO: 3. If completed: apply bonus multiplier
    // TODO: 4. If early: apply 10% penalty on base, no bonus
    // TODO: 5. Return ClaimResult
    todo!()
}`,
    solution: `use std::collections::HashMap;

#[derive(Debug, Clone, PartialEq)]
pub enum LockDuration {
    Days30,
    Days90,
    Days180,
    Days365,
}

pub struct StakePosition {
    pub amount: u64,
    pub lock_duration: LockDuration,
    pub start_timestamp: i64,
    pub lock_end_timestamp: i64,
}

pub struct RewardPool {
    pub total_staked: u64,
    pub reward_rate_per_second: HashMap<String, u64>,
    pub last_update: i64,
    pub acc_rewards_per_share: HashMap<String, u128>,
}

pub struct ClaimResult {
    pub rewards: HashMap<String, u64>,
    pub bonus_multiplier: u64,
    pub penalty_applied: bool,
    pub penalty_amount: HashMap<String, u64>,
}

const PRECISION: u128 = 1_000_000_000_000;
const EARLY_PENALTY_BPS: u64 = 1000; // 10%
const BPS_BASE: u64 = 10000;

pub fn get_multiplier(duration: &LockDuration) -> u64 {
    match duration {
        LockDuration::Days30 => 10000,
        LockDuration::Days90 => 15000,
        LockDuration::Days180 => 20000,
        LockDuration::Days365 => 30000,
    }
}

pub fn update_rewards(pool: &mut RewardPool, current_timestamp: i64) {
    if pool.total_staked == 0 {
        pool.last_update = current_timestamp;
        return;
    }

    let elapsed = (current_timestamp - pool.last_update) as u128;

    for (token, rate) in &pool.reward_rate_per_second {
        let new_rewards = elapsed * (*rate as u128);
        let acc = pool
            .acc_rewards_per_share
            .entry(token.clone())
            .or_insert(0);
        *acc += (new_rewards * PRECISION) / pool.total_staked as u128;
    }

    pool.last_update = current_timestamp;
}

pub fn calculate_rewards(
    pool: &RewardPool,
    position: &StakePosition,
    reward_debt: &HashMap<String, u128>,
    current_timestamp: i64,
) -> ClaimResult {
    let lock_complete = current_timestamp >= position.lock_end_timestamp;
    let multiplier = if lock_complete {
        get_multiplier(&position.lock_duration)
    } else {
        BPS_BASE
    };

    let mut rewards = HashMap::new();
    let mut penalty_amount = HashMap::new();

    for (token, acc) in &pool.acc_rewards_per_share {
        let mut current_acc = *acc;

        if pool.total_staked > 0 {
            let elapsed = (current_timestamp - pool.last_update).max(0) as u128;
            if let Some(rate) = pool.reward_rate_per_second.get(token) {
                let new_rewards = elapsed * (*rate as u128);
                current_acc += (new_rewards * PRECISION) / pool.total_staked as u128;
            }
        }

        let accumulated = (position.amount as u128 * current_acc) / PRECISION;
        let debt = reward_debt.get(token).copied().unwrap_or(0);
        let base_pending = accumulated.saturating_sub(debt) as u64;

        if lock_complete {
            let boosted = (base_pending as u128 * multiplier as u128 / BPS_BASE as u128) as u64;
            rewards.insert(token.clone(), boosted);
            penalty_amount.insert(token.clone(), 0);
        } else {
            let penalty = (base_pending as u128 * EARLY_PENALTY_BPS as u128 / BPS_BASE as u128) as u64;
            rewards.insert(token.clone(), base_pending.saturating_sub(penalty));
            penalty_amount.insert(token.clone(), penalty);
        }
    }

    ClaimResult {
        rewards,
        bonus_multiplier: multiplier,
        penalty_applied: !lock_complete,
        penalty_amount,
    }
}`,
    testCases: [
      {
        input: 'total_staked=1000, rate={"REWARD":10}, elapsed=100, position={amount:500,lock:Days90,complete:true}, debt={}',
        expectedOutput: 'rewards={"REWARD":750}, bonus_multiplier=15000, penalty_applied=false',
        description: 'Completed 90-day lock earns 1.5x multiplier on base rewards',
      },
      {
        input: 'total_staked=1000, rate={"REWARD":10}, elapsed=100, position={amount:500,lock:Days365,complete:false}, debt={}',
        expectedOutput: 'rewards={"REWARD":450}, penalty_applied=true, penalty_amount={"REWARD":50}',
        description: 'Early unstake from 365-day lock incurs 10% penalty and no bonus',
      },
      {
        input: 'total_staked=2000, rate={"SOL":5,"BONK":1000}, elapsed=60, position={amount:1000,lock:Days30,complete:true}, debt={}',
        expectedOutput: 'rewards={"SOL":150,"BONK":30000}, bonus_multiplier=10000',
        description: 'Multi-token rewards calculated correctly for 30-day lock (1x multiplier)',
      },
    ],
    hints: [
      'Lock multipliers in bps: 30d=10000(1x), 90d=15000(1.5x), 180d=20000(2x), 365d=30000(3x)',
      'Early unstake: no bonus applied, plus 10% penalty subtracted from base rewards',
      'For multi-token rewards, iterate over all tokens in acc_rewards_per_share and compute independently',
    ],
    xpReward: 200,
    estimatedMinutes: 45,
  },
  {
    id: 'defi-019',
    title: 'Governance Token Allocation',
    description:
      'Implement a governance token allocation system with vesting schedules. Supports multiple allocation categories (team, investors, community, treasury) with different vesting cliffs and linear unlock periods. Calculate the total unlocked, claimable, and still-vesting amounts at any given timestamp.',
    difficulty: 'advanced',
    category: 'defi',
    language: 'typescript',
    starterCode: `interface AllocationCategory {
  name: string;
  totalTokens: bigint;
  tgeUnlockBps: number;      // % unlocked at TGE (basis points)
  cliffMonths: number;        // Months before linear vesting starts
  vestingMonths: number;      // Duration of linear vesting after cliff
}

interface VestingState {
  category: string;
  totalAllocated: bigint;
  unlockedAtTge: bigint;
  vestedToDate: bigint;
  totalClaimable: bigint;
  claimed: bigint;
  pendingClaim: bigint;
  remainingLocked: bigint;
}

interface AllocationSummary {
  states: VestingState[];
  grandTotalAllocated: bigint;
  grandTotalClaimable: bigint;
  grandTotalClaimed: bigint;
  grandTotalLocked: bigint;
}

const SECONDS_PER_MONTH = 30 * 24 * 60 * 60; // 2,592,000

/**
 * Calculate vesting state for all allocation categories.
 * @param categories - Token allocation categories with vesting params
 * @param tgeTimestamp - Token Generation Event timestamp
 * @param currentTimestamp - Current time
 * @param claimedAmounts - Map of category name to already claimed amount
 * @returns Complete allocation summary
 */
export function calculateAllocations(
  categories: AllocationCategory[],
  tgeTimestamp: number,
  currentTimestamp: number,
  claimedAmounts: Map<string, bigint>,
): AllocationSummary {
  // TODO: 1. For each category, calculate:
  //          a. TGE unlock = totalTokens * tgeUnlockBps / 10000
  //          b. If before cliff end: only TGE unlock is available
  //          c. If after cliff, during vesting: linear unlock per month
  //          d. If after full vesting: everything unlocked
  // TODO: 2. Calculate pendingClaim = totalClaimable - claimed
  // TODO: 3. Calculate remainingLocked = totalAllocated - totalClaimable
  // TODO: 4. Aggregate grand totals
  // TODO: 5. Return AllocationSummary
}`,
    solution: `interface AllocationCategory {
  name: string;
  totalTokens: bigint;
  tgeUnlockBps: number;
  cliffMonths: number;
  vestingMonths: number;
}

interface VestingState {
  category: string;
  totalAllocated: bigint;
  unlockedAtTge: bigint;
  vestedToDate: bigint;
  totalClaimable: bigint;
  claimed: bigint;
  pendingClaim: bigint;
  remainingLocked: bigint;
}

interface AllocationSummary {
  states: VestingState[];
  grandTotalAllocated: bigint;
  grandTotalClaimable: bigint;
  grandTotalClaimed: bigint;
  grandTotalLocked: bigint;
}

const SECONDS_PER_MONTH = 30 * 24 * 60 * 60;

export function calculateAllocations(
  categories: AllocationCategory[],
  tgeTimestamp: number,
  currentTimestamp: number,
  claimedAmounts: Map<string, bigint>,
): AllocationSummary {
  const states: VestingState[] = [];
  let grandTotalAllocated = 0n;
  let grandTotalClaimable = 0n;
  let grandTotalClaimed = 0n;
  let grandTotalLocked = 0n;

  for (const cat of categories) {
    const elapsed = currentTimestamp - tgeTimestamp;
    const unlockedAtTge = (cat.totalTokens * BigInt(cat.tgeUnlockBps)) / 10000n;
    const vestingPool = cat.totalTokens - unlockedAtTge;

    const cliffEndSeconds = cat.cliffMonths * SECONDS_PER_MONTH;
    const vestingEndSeconds = cliffEndSeconds + cat.vestingMonths * SECONDS_PER_MONTH;

    let vestedToDate: bigint;

    if (elapsed < 0) {
      vestedToDate = 0n;
    } else if (elapsed < cliffEndSeconds) {
      vestedToDate = unlockedAtTge;
    } else if (elapsed >= vestingEndSeconds || cat.vestingMonths === 0) {
      vestedToDate = cat.totalTokens;
    } else {
      const vestingElapsed = elapsed - cliffEndSeconds;
      const vestingDuration = cat.vestingMonths * SECONDS_PER_MONTH;
      const linearVested = (vestingPool * BigInt(vestingElapsed)) / BigInt(vestingDuration);
      vestedToDate = unlockedAtTge + linearVested;
    }

    const totalClaimable = vestedToDate;
    const claimed = claimedAmounts.get(cat.name) ?? 0n;
    const pendingClaim = totalClaimable > claimed ? totalClaimable - claimed : 0n;
    const remainingLocked = cat.totalTokens - totalClaimable;

    states.push({
      category: cat.name,
      totalAllocated: cat.totalTokens,
      unlockedAtTge,
      vestedToDate,
      totalClaimable,
      claimed,
      pendingClaim,
      remainingLocked,
    });

    grandTotalAllocated += cat.totalTokens;
    grandTotalClaimable += totalClaimable;
    grandTotalClaimed += claimed;
    grandTotalLocked += remainingLocked;
  }

  return {
    states,
    grandTotalAllocated,
    grandTotalClaimable,
    grandTotalClaimed,
    grandTotalLocked,
  };
}`,
    testCases: [
      {
        input: 'categories=[{name:"team",total:1000000n,tgeBps:0,cliff:12,vesting:24}], tge=0, current=0, claimed={}',
        expectedOutput: 'states=[{totalClaimable:0n,remainingLocked:1000000n}]',
        description: 'Team allocation with 12-month cliff has zero claimable at TGE',
      },
      {
        input: 'categories=[{name:"community",total:500000n,tgeBps:2000,cliff:0,vesting:12}], tge=0, current=15552000 (6mo), claimed={"community":50000n}',
        expectedOutput: 'states=[{unlockedAtTge:100000n,vestedToDate:300000n,pendingClaim:250000n}]',
        description: 'Community with 20% TGE + 6/12 months vested, minus already claimed',
      },
      {
        input: 'categories=[{name:"investors",total:200000n,tgeBps:1000,cliff:6,vesting:18}], tge=0, current=62208000 (24mo), claimed={}',
        expectedOutput: 'states=[{totalClaimable:200000n,remainingLocked:0n}]',
        description: 'Investors fully vested after cliff + vesting period, all tokens claimable',
      },
    ],
    hints: [
      'TGE unlock is immediate: unlockedAtTge = totalTokens * tgeUnlockBps / 10000',
      'During cliff period (before cliff end), only the TGE amount is available — no linear vesting yet',
      'Linear vesting: vestedAmount = vestingPool * elapsedAfterCliff / totalVestingDuration',
    ],
    xpReward: 200,
    estimatedMinutes: 40,
  },
  {
    id: 'defi-020',
    title: 'Protocol Fee Accounting',
    description:
      'Implement a protocol fee accounting system that tracks fees across multiple pools, distributes them to stakeholders (protocol treasury, stakers, referrers), and handles fee epochs for periodic distribution. The system must maintain an audit trail and support fee parameter changes that take effect at the next epoch boundary.',
    difficulty: 'advanced',
    category: 'defi',
    language: 'rust',
    starterCode: `use std::collections::HashMap;

pub struct FeeConfig {
    pub protocol_share_bps: u16,   // e.g., 2000 = 20%
    pub staker_share_bps: u16,     // e.g., 7000 = 70%
    pub referrer_share_bps: u16,   // e.g., 1000 = 10%
}

pub struct FeeEpoch {
    pub epoch_id: u64,
    pub start_timestamp: i64,
    pub end_timestamp: i64,
    pub total_fees_collected: HashMap<String, u64>,  // pool_id -> fees
    pub config: FeeConfig,
    pub finalized: bool,
}

pub struct FeeDistribution {
    pub protocol_amount: u64,
    pub staker_amount: u64,
    pub referrer_amount: u64,
    pub total: u64,
}

pub struct FeeAccounting {
    pub current_epoch: FeeEpoch,
    pub pending_config: Option<FeeConfig>,
    pub epochs_history: Vec<FeeEpoch>,
    pub cumulative_protocol: HashMap<String, u64>,  // token -> total
    pub cumulative_staker: HashMap<String, u64>,
    pub cumulative_referrer: HashMap<String, u64>,
}

impl FeeAccounting {
    /// Create a new fee accounting system.
    pub fn new(config: FeeConfig, start_timestamp: i64, epoch_duration: i64) -> Self {
        // TODO: Initialize with first epoch
        todo!()
    }

    /// Record fees collected from a pool.
    pub fn record_fee(&mut self, pool_id: &str, amount: u64) -> Result<(), &'static str> {
        // TODO: Add fee to current epoch's collection for the pool
        todo!()
    }

    /// Queue a config change for the next epoch.
    pub fn queue_config_change(&mut self, new_config: FeeConfig) -> Result<(), &'static str> {
        // TODO: Validate shares sum to 10000 bps, store as pending
        todo!()
    }

    /// Finalize current epoch and start a new one.
    pub fn advance_epoch(&mut self, current_timestamp: i64) -> Result<FeeDistribution, &'static str> {
        // TODO: 1. Finalize current epoch
        // TODO: 2. Calculate distribution using current epoch's config
        // TODO: 3. Update cumulative totals
        // TODO: 4. Apply pending config if any
        // TODO: 5. Create new epoch
        // TODO: 6. Return distribution for the finalized epoch
        todo!()
    }

    /// Calculate distribution for an epoch's total fees.
    pub fn calculate_distribution(&self, total_fees: u64, config: &FeeConfig) -> FeeDistribution {
        // TODO: Split total_fees according to config shares
        todo!()
    }
}`,
    solution: `use std::collections::HashMap;

pub struct FeeConfig {
    pub protocol_share_bps: u16,
    pub staker_share_bps: u16,
    pub referrer_share_bps: u16,
}

pub struct FeeEpoch {
    pub epoch_id: u64,
    pub start_timestamp: i64,
    pub end_timestamp: i64,
    pub total_fees_collected: HashMap<String, u64>,
    pub config: FeeConfig,
    pub finalized: bool,
}

pub struct FeeDistribution {
    pub protocol_amount: u64,
    pub staker_amount: u64,
    pub referrer_amount: u64,
    pub total: u64,
}

pub struct FeeAccounting {
    pub current_epoch: FeeEpoch,
    pub pending_config: Option<FeeConfig>,
    pub epochs_history: Vec<FeeEpoch>,
    pub cumulative_protocol: HashMap<String, u64>,
    pub cumulative_staker: HashMap<String, u64>,
    pub cumulative_referrer: HashMap<String, u64>,
    pub epoch_duration: i64,
}

const BPS_TOTAL: u16 = 10000;

impl FeeConfig {
    fn validate(&self) -> Result<(), &'static str> {
        let total = self.protocol_share_bps as u32
            + self.staker_share_bps as u32
            + self.referrer_share_bps as u32;
        if total != BPS_TOTAL as u32 {
            return Err("Fee shares must sum to 10000 basis points");
        }
        Ok(())
    }

    fn clone_config(&self) -> FeeConfig {
        FeeConfig {
            protocol_share_bps: self.protocol_share_bps,
            staker_share_bps: self.staker_share_bps,
            referrer_share_bps: self.referrer_share_bps,
        }
    }
}

impl FeeAccounting {
    pub fn new(config: FeeConfig, start_timestamp: i64, epoch_duration: i64) -> Self {
        let current_epoch = FeeEpoch {
            epoch_id: 0,
            start_timestamp,
            end_timestamp: start_timestamp + epoch_duration,
            total_fees_collected: HashMap::new(),
            config: config.clone_config(),
            finalized: false,
        };

        FeeAccounting {
            current_epoch,
            pending_config: None,
            epochs_history: Vec::new(),
            cumulative_protocol: HashMap::new(),
            cumulative_staker: HashMap::new(),
            cumulative_referrer: HashMap::new(),
            epoch_duration,
        }
    }

    pub fn record_fee(&mut self, pool_id: &str, amount: u64) -> Result<(), &'static str> {
        if amount == 0 {
            return Err("Fee amount must be greater than zero");
        }
        if self.current_epoch.finalized {
            return Err("Current epoch is already finalized");
        }

        let entry = self
            .current_epoch
            .total_fees_collected
            .entry(pool_id.to_string())
            .or_insert(0);
        *entry = entry.checked_add(amount).ok_or("Fee overflow")?;

        Ok(())
    }

    pub fn queue_config_change(&mut self, new_config: FeeConfig) -> Result<(), &'static str> {
        new_config.validate()?;
        self.pending_config = Some(new_config);
        Ok(())
    }

    pub fn advance_epoch(
        &mut self,
        current_timestamp: i64,
    ) -> Result<FeeDistribution, &'static str> {
        if current_timestamp < self.current_epoch.end_timestamp {
            return Err("Current epoch has not ended yet");
        }

        let total_fees: u64 = self
            .current_epoch
            .total_fees_collected
            .values()
            .sum();

        let distribution =
            self.calculate_distribution(total_fees, &self.current_epoch.config);

        *self
            .cumulative_protocol
            .entry("total".to_string())
            .or_insert(0) += distribution.protocol_amount;
        *self
            .cumulative_staker
            .entry("total".to_string())
            .or_insert(0) += distribution.staker_amount;
        *self
            .cumulative_referrer
            .entry("total".to_string())
            .or_insert(0) += distribution.referrer_amount;

        self.current_epoch.finalized = true;
        let next_epoch_id = self.current_epoch.epoch_id + 1;
        let next_start = self.current_epoch.end_timestamp;

        let next_config = self
            .pending_config
            .take()
            .unwrap_or_else(|| self.current_epoch.config.clone_config());

        let finalized = std::mem::replace(
            &mut self.current_epoch,
            FeeEpoch {
                epoch_id: next_epoch_id,
                start_timestamp: next_start,
                end_timestamp: next_start + self.epoch_duration,
                total_fees_collected: HashMap::new(),
                config: next_config,
                finalized: false,
            },
        );

        self.epochs_history.push(finalized);

        Ok(distribution)
    }

    pub fn calculate_distribution(
        &self,
        total_fees: u64,
        config: &FeeConfig,
    ) -> FeeDistribution {
        let protocol_amount =
            (total_fees as u128 * config.protocol_share_bps as u128 / BPS_TOTAL as u128) as u64;
        let staker_amount =
            (total_fees as u128 * config.staker_share_bps as u128 / BPS_TOTAL as u128) as u64;
        let referrer_amount = total_fees - protocol_amount - staker_amount;

        FeeDistribution {
            protocol_amount,
            staker_amount,
            referrer_amount,
            total: total_fees,
        }
    }
}`,
    testCases: [
      {
        input: 'config={protocol:2000,staker:7000,referrer:1000}, record_fee("pool1",100000), advance_epoch',
        expectedOutput: 'FeeDistribution { protocol: 20000, staker: 70000, referrer: 10000, total: 100000 }',
        description: 'Fees distributed according to 20/70/10 split at epoch end',
      },
      {
        input: 'config={protocol:2000,staker:7000,referrer:1000}, queue_config({protocol:3000,staker:6000,referrer:1000}), advance_epoch, record_fee("pool1",100000), advance_epoch',
        expectedOutput: 'Second epoch FeeDistribution { protocol: 30000, staker: 60000, referrer: 10000, total: 100000 }',
        description: 'Queued config change takes effect in the next epoch',
      },
      {
        input: 'queue_config_change({protocol:5000,staker:3000,referrer:3000})',
        expectedOutput: 'Err("Fee shares must sum to 10000 basis points")',
        description: 'Rejects config where shares exceed 10000 basis points',
      },
    ],
    hints: [
      'All fee shares (protocol + staker + referrer) must sum to exactly 10000 basis points',
      'Config changes are queued and only applied when advance_epoch is called — never mid-epoch',
      'Give referrers the remainder (total - protocol - staker) to handle rounding dust correctly',
    ],
    xpReward: 200,
    estimatedMinutes: 45,
  },
];
