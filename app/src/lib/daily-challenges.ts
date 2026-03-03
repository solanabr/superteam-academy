/**
 * Daily Challenges — Solana/Rust coding challenges that rotate every 24 hours.
 * Challenge selection is deterministic: all users see the same challenge on a given day.
 */

export interface DailyChallengeTest {
  description: string;
  expectedOutput: string;
  testExpression?: string; // executable expression for TS (e.g. "levelFromXp(400)")
  actualOutput?: string; // filled by API
  executionTimeMs?: number; // filled by API
  passed?: boolean;
}

export interface DailyChallenge {
  id: number;
  title: string;
  description: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  category: "rust" | "anchor" | "solana" | "tokens" | "defi";
  language: "rust" | "typescript";
  xpReward: number;
  starterCode: string;
  solutionCode: string;
  testCases: DailyChallengeTest[];
  estimatedMinutes: number;
  hints: string[];
  tags: string[];
  expectedBehavior: string[];
  examples: { input: string; output: string; explanation?: string }[];
}

export interface DailyChallengeCompletion {
  challengeId: number;
  date: string; // YYYY-MM-DD
  xpEarned: number;
  completedAt: string; // ISO
}

export interface SpeedLeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  wallet: string | null;
  avatar: string | null;
  timeSeconds: number; // completedAt - startedAt in seconds
  testsPassed: number;
  totalTests: number;
}

// ── Date-based helpers ───────────────────────────────────────────────────────

export const CHALLENGE_START_DATE = new Date("2026-02-01T00:00:00Z");

const MS_PER_DAY = 86_400_000;

/** Get the challenge assigned to a specific date. */
export function getChallengeForDate(date: Date): DailyChallenge {
  const dayIndex = Math.floor(date.getTime() / MS_PER_DAY);
  return CHALLENGE_BANK[dayIndex % CHALLENGE_BANK.length];
}

/** Get all past challenges from yesterday back to CHALLENGE_START_DATE. */
export function getAllPastChallenges(): {
  challenge: DailyChallenge;
  date: string;
}[] {
  const todayMs = Math.floor(Date.now() / MS_PER_DAY) * MS_PER_DAY;
  const startMs = CHALLENGE_START_DATE.getTime();
  const results: { challenge: DailyChallenge; date: string }[] = [];

  // From yesterday back to start date
  for (let ms = todayMs - MS_PER_DAY; ms >= startMs; ms -= MS_PER_DAY) {
    const d = new Date(ms);
    const dateKey = d.toISOString().slice(0, 10);
    const dayIndex = Math.floor(ms / MS_PER_DAY);
    results.push({
      challenge: CHALLENGE_BANK[dayIndex % CHALLENGE_BANK.length],
      date: dateKey,
    });
  }

  return results;
}

// ── 28-challenge bank (4-week rotation) ─────────────────────────────────────

export const CHALLENGE_BANK: DailyChallenge[] = [
  {
    id: 1,
    title: "Hello, Solana!",
    description:
      "Write a Solana program entry point that logs 'Hello, Solana!' using the `msg!` macro. This is the first step to any on-chain program.",
    difficulty: "beginner",
    estimatedMinutes: 10,
    category: "rust",
    language: "rust",
    xpReward: 50,
    starterCode: `use solana_program::{
  account_info::AccountInfo,
  entrypoint,
  entrypoint::ProgramResult,
  pubkey::Pubkey,
};

entrypoint!(process_instruction);

pub fn process_instruction(
  _program_id: &Pubkey,
  _accounts: &[AccountInfo],
  _instruction_data: &[u8],
) -> ProgramResult {
  // Your code here: log "Hello, Solana!"
  Ok(())
}`,
    solutionCode: `use solana_program::{
  account_info::AccountInfo,
  entrypoint,
  entrypoint::ProgramResult,
  msg,
  pubkey::Pubkey,
};

entrypoint!(process_instruction);

pub fn process_instruction(
  _program_id: &Pubkey,
  _accounts: &[AccountInfo],
  _instruction_data: &[u8],
) -> ProgramResult {
  msg!("Hello, Solana!");
  Ok(())
}`,
    testCases: [
      {
        description: "Program logs the correct greeting",
        expectedOutput: "Hello, Solana!",
      },
      { description: "Returns Ok(())", expectedOutput: "ProgramResult::Ok" },
    ],
    hints: [
      "Import `msg` from `solana_program`",
      "Use the `msg!` macro with the greeting string",
    ],
    tags: ["basics", "logging", "entrypoint"],
    expectedBehavior: [
      "Import the `msg` macro from `solana_program`",
      'Call `msg!("Hello, Solana!")` inside the instruction handler',
      "Return `Ok(())` to indicate success",
    ],
    examples: [
      {
        input: "Any instruction data",
        output: "Program log: Hello, Solana!",
        explanation: "The msg! macro writes to the program log",
      },
    ],
  },
  {
    id: 2,
    title: "Level from XP",
    description:
      "Implement the XP-to-level formula used by Superteam Academy: `Level = floor(sqrt(totalXP / 100))`. Write a TypeScript function `levelFromXp(xp: number): number`.",
    difficulty: "beginner",
    estimatedMinutes: 10,
    category: "solana",
    language: "typescript",
    xpReward: 40,
    starterCode: `export function levelFromXp(xp: number): number {
  // Implement: Level = floor(sqrt(xp / 100))
}`,
    solutionCode: `export function levelFromXp(xp: number): number {
  return Math.floor(Math.sqrt(xp / 100));
}`,
    testCases: [
      {
        description: "levelFromXp(0) === 0",
        expectedOutput: "0",
        testExpression: "levelFromXp(0)",
      },
      {
        description: "levelFromXp(100) === 1",
        expectedOutput: "1",
        testExpression: "levelFromXp(100)",
      },
      {
        description: "levelFromXp(400) === 2",
        expectedOutput: "2",
        testExpression: "levelFromXp(400)",
      },
      {
        description: "levelFromXp(2500) === 5",
        expectedOutput: "5",
        testExpression: "levelFromXp(2500)",
      },
    ],
    hints: [
      "Use `Math.sqrt` and `Math.floor`",
      "Divide xp by 100 before taking the square root",
    ],
    tags: ["math", "gamification", "typescript"],
    expectedBehavior: [
      "Divide XP by 100",
      "Take the square root of the result",
      "Floor the value to get a whole number level",
    ],
    examples: [
      { input: "levelFromXp(0)", output: "0", explanation: "sqrt(0/100) = 0" },
      {
        input: "levelFromXp(400)",
        output: "2",
        explanation: "floor(sqrt(400/100)) = floor(2) = 2",
      },
      {
        input: "levelFromXp(2500)",
        output: "5",
        explanation: "floor(sqrt(2500/100)) = floor(5) = 5",
      },
    ],
  },
  {
    id: 3,
    title: "Lesson Bitmap Check",
    description:
      "Lesson completion is stored as a bitmap. Write a Rust function that checks if lesson `n` (0-indexed) is completed given a `u64` bitmap.",
    difficulty: "beginner",
    estimatedMinutes: 10,
    category: "rust",
    language: "rust",
    xpReward: 60,
    starterCode: `/// Returns true if lesson at index n is marked complete in bitmap.
pub fn is_lesson_complete(bitmap: u64, n: u8) -> bool {
  // Your code here
}`,
    solutionCode: `pub fn is_lesson_complete(bitmap: u64, n: u8) -> bool {
  (bitmap >> n) & 1 == 1
}`,
    testCases: [
      {
        description: "is_lesson_complete(0b0001, 0) == true",
        expectedOutput: "true",
      },
      {
        description: "is_lesson_complete(0b0001, 1) == false",
        expectedOutput: "false",
      },
      {
        description: "is_lesson_complete(0b1010, 1) == true",
        expectedOutput: "true",
      },
    ],
    hints: [
      "Shift bitmap right by n positions",
      "Use bitwise AND with 1 to check the LSB",
    ],
    tags: ["bitwise", "bitmap", "on-chain"],
    expectedBehavior: [
      "Right-shift the bitmap by n positions",
      "Bitwise AND the result with 1",
      "Return whether the result equals 1",
    ],
    examples: [
      {
        input: "bitmap=0b0001, n=0",
        output: "true",
        explanation: "Bit 0 is set",
      },
      {
        input: "bitmap=0b1010, n=1",
        output: "true",
        explanation: "Bit 1 is set in 1010",
      },
    ],
  },
  {
    id: 4,
    title: "Derive Program Address",
    description:
      'Derive the PDA for a learner\'s enrollment in a course. Seeds: `[b"enrollment", program_id_bytes, learner_pubkey_bytes]`. Use `Pubkey::find_program_address`.',
    difficulty: "intermediate",
    estimatedMinutes: 20,
    category: "solana",
    language: "rust",
    xpReward: 80,
    starterCode: `use solana_program::pubkey::Pubkey;

pub fn find_enrollment_pda(
  program_id: &Pubkey,
  learner: &Pubkey,
  course_program_id: &Pubkey,
) -> (Pubkey, u8) {
  // Derive the enrollment PDA
}`,
    solutionCode: `use solana_program::pubkey::Pubkey;

pub fn find_enrollment_pda(
  program_id: &Pubkey,
  learner: &Pubkey,
  course_program_id: &Pubkey,
) -> (Pubkey, u8) {
  Pubkey::find_program_address(
    &[b"enrollment", course_program_id.as_ref(), learner.as_ref()],
    program_id,
  )
}`,
    testCases: [
      {
        description: "Returns a tuple (Pubkey, u8)",
        expectedOutput: "(Pubkey, u8)",
      },
      {
        description: "PDA is off the ed25519 curve",
        expectedOutput: "off-curve",
      },
      { description: "Bump seed is in range 0-255", expectedOutput: "0..=255" },
    ],
    hints: [
      "Use `Pubkey::find_program_address` with a slice of seeds",
      "Convert pubkeys to bytes with `.as_ref()`",
    ],
    tags: ["pda", "seeds", "program-derived"],
    expectedBehavior: [
      'Use seeds: b"enrollment", course_program_id bytes, learner bytes',
      "Call Pubkey::find_program_address with the seeds and program_id",
      "Return the resulting (Pubkey, bump) tuple",
    ],
    examples: [
      {
        input: "Any valid program_id, learner, course_program_id",
        output: "(Pubkey, u8)",
        explanation: "Returns deterministic PDA + bump seed",
      },
    ],
  },
  {
    id: 5,
    title: "Lamports to SOL",
    description:
      "Write a TypeScript utility that converts lamports to SOL. 1 SOL = 1,000,000,000 lamports. Return a string formatted to 4 decimal places.",
    difficulty: "beginner",
    estimatedMinutes: 10,
    category: "solana",
    language: "typescript",
    xpReward: 40,
    starterCode: `export function lamportsToSol(lamports: number): string {
  // Convert lamports to SOL string (4 decimal places)
}`,
    solutionCode: `export function lamportsToSol(lamports: number): string {
  return (lamports / 1_000_000_000).toFixed(4);
}`,
    testCases: [
      {
        description: "1_000_000_000 → '1.0000'",
        expectedOutput: "1.0000",
        testExpression: "lamportsToSol(1000000000)",
      },
      {
        description: "500_000_000 → '0.5000'",
        expectedOutput: "0.5000",
        testExpression: "lamportsToSol(500000000)",
      },
      {
        description: "1_500_000 → '0.0015'",
        expectedOutput: "0.0015",
        testExpression: "lamportsToSol(1500000)",
      },
    ],
    hints: ["1 SOL = 1e9 lamports", "Use `.toFixed(4)` for formatting"],
    tags: ["sol", "lamports", "conversion"],
    expectedBehavior: [
      "Divide lamports by 1,000,000,000 (1e9)",
      "Format the result to exactly 4 decimal places",
      "Return as a string",
    ],
    examples: [
      { input: "lamportsToSol(1_000_000_000)", output: "'1.0000'" },
      { input: "lamportsToSol(500_000_000)", output: "'0.5000'" },
      { input: "lamportsToSol(1_500_000)", output: "'0.0015'" },
    ],
  },
  {
    id: 6,
    title: "Anchor Account Constraint",
    description:
      "Add an Anchor account constraint that ensures `vault` is owned by the program and has at least 1 SOL. Use `constraint` and `minimum_balance`.",
    difficulty: "intermediate",
    estimatedMinutes: 20,
    category: "anchor",
    language: "rust",
    xpReward: 90,
    starterCode: `use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct Withdraw<'info> {
  #[account(mut)]
  pub vault: Account<'info, VaultState>,
  pub authority: Signer<'info>,
}

#[account]
pub struct VaultState {
  pub balance: u64,
}`,
    solutionCode: `use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct Withdraw<'info> {
  #[account(
    mut,
    constraint = vault.to_account_info().lamports() >= 1_000_000_000 @ ErrorCode::InsufficientFunds
  )]
  pub vault: Account<'info, VaultState>,
  pub authority: Signer<'info>,
}

#[account]
pub struct VaultState {
  pub balance: u64,
}`,
    testCases: [
      {
        description: "Constraint rejects vault with < 1 SOL",
        expectedOutput: "InsufficientFunds",
      },
      { description: "Constraint passes with >= 1 SOL", expectedOutput: "Ok" },
    ],
    hints: [
      "Use the `constraint` attribute with `@` to specify a custom error",
      "Access lamport balance via `.to_account_info().lamports()`",
    ],
    tags: ["anchor", "constraints", "validation"],
    expectedBehavior: [
      "Add a `constraint` attribute to the vault account",
      "Check that vault lamports >= 1_000_000_000 (1 SOL)",
      "Use `@ ErrorCode::InsufficientFunds` for the error variant",
    ],
    examples: [
      { input: "Vault with 0.5 SOL", output: "Error: InsufficientFunds" },
      { input: "Vault with 1.5 SOL", output: "Ok (constraint passes)" },
    ],
  },
  {
    id: 7,
    title: "Borsh Deserialize Config",
    description:
      "Deserialize a binary config struct: first 32 bytes = authority pubkey, next 8 bytes = total_xp (u64 little-endian). Return both fields.",
    difficulty: "intermediate",
    estimatedMinutes: 20,
    category: "rust",
    language: "rust",
    xpReward: 100,
    starterCode: `use solana_program::pubkey::Pubkey;

pub struct ConfigData {
  pub authority: Pubkey,
  pub total_xp: u64,
}

pub fn deserialize_config(data: &[u8]) -> Option<ConfigData> {
  // Parse: [32 bytes authority][8 bytes u64 total_xp]
}`,
    solutionCode: `use solana_program::pubkey::Pubkey;

pub struct ConfigData {
  pub authority: Pubkey,
  pub total_xp: u64,
}

pub fn deserialize_config(data: &[u8]) -> Option<ConfigData> {
  if data.len() < 40 { return None; }
  let authority = Pubkey::from(<[u8; 32]>::try_from(&data[..32]).ok()?);
  let total_xp = u64::from_le_bytes(data[32..40].try_into().ok()?);
  Some(ConfigData { authority, total_xp })
}`,
    testCases: [
      { description: "Returns None for < 40 bytes", expectedOutput: "None" },
      {
        description: "Correctly reads authority pubkey",
        expectedOutput: "Pubkey(32 bytes)",
      },
      {
        description: "Correctly reads u64 little-endian",
        expectedOutput: "u64::from_le_bytes",
      },
    ],
    hints: [
      "Check data length before indexing",
      "Use `u64::from_le_bytes` with a 8-byte array slice",
    ],
    tags: ["borsh", "deserialization", "binary"],
    expectedBehavior: [
      "Return None if data is less than 40 bytes",
      "Extract first 32 bytes as a Pubkey",
      "Extract bytes 32..40 as a u64 in little-endian",
    ],
    examples: [
      { input: "data.len() < 40", output: "None" },
      {
        input: "[32 bytes pubkey][8 bytes u64 LE]",
        output: "Some(ConfigData { authority, total_xp })",
      },
    ],
  },
  {
    id: 8,
    title: "Token 2022 NonTransferable",
    description:
      "Write a TypeScript function that checks if a mint account has the NonTransferable extension (Token-2022), which makes it soulbound. Use `@solana/spl-token`.",
    difficulty: "intermediate",
    estimatedMinutes: 20,
    category: "tokens",
    language: "typescript",
    xpReward: 110,
    starterCode: `import { getMint, TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import { Connection, PublicKey } from "@solana/web3.js";

export async function isSoulbound(
  connection: Connection,
  mintAddress: PublicKey,
): Promise<boolean> {
  // Check for NonTransferable extension on the mint
}`,
    solutionCode: `import { getMint, TOKEN_2022_PROGRAM_ID, ExtensionType, getExtensionTypes } from "@solana/spl-token";
import { Connection, PublicKey } from "@solana/web3.js";

export async function isSoulbound(
  connection: Connection,
  mintAddress: PublicKey,
): Promise<boolean> {
  const mint = await getMint(connection, mintAddress, "confirmed", TOKEN_2022_PROGRAM_ID);
  const extensions = getExtensionTypes(mint.tlvData);
  return extensions.includes(ExtensionType.NonTransferable);
}`,
    testCases: [
      {
        description: "Returns true for NonTransferable mint",
        expectedOutput: "true",
      },
      {
        description: "Returns false for standard mint",
        expectedOutput: "false",
      },
    ],
    hints: [
      "Use `getMint` with the Token-2022 program ID",
      "Use `getExtensionTypes` to list extensions",
      "Check for `ExtensionType.NonTransferable`",
    ],
    tags: ["token-2022", "soulbound", "extensions"],
    expectedBehavior: [
      "Fetch the mint account using Token-2022 program",
      "Extract extension types from the mint's TLV data",
      "Check if NonTransferable extension is present",
    ],
    examples: [
      { input: "Mint with NonTransferable extension", output: "true" },
      { input: "Standard SPL Token mint", output: "false" },
    ],
  },
  {
    id: 9,
    title: "Streak Bonus XP",
    description:
      "Calculate daily XP including streak bonuses. Base XP is always earned. At 7-day streak: +50 XP bonus. At 30-day streak: +150 XP bonus.",
    difficulty: "beginner",
    estimatedMinutes: 10,
    category: "solana",
    language: "typescript",
    xpReward: 40,
    starterCode: `export function calculateDailyXp(baseXp: number, streakDays: number): number {
  // Add streak bonuses: +50 at day 7, +150 at day 30
}`,
    solutionCode: `export function calculateDailyXp(baseXp: number, streakDays: number): number {
  let bonus = 0;
  if (streakDays >= 30) bonus = 150;
  else if (streakDays >= 7) bonus = 50;
  return baseXp + bonus;
}`,
    testCases: [
      {
        description: "No bonus for streak < 7",
        expectedOutput: "100",
        testExpression: "calculateDailyXp(100, 3)",
      },
      {
        description: "+50 XP for streak >= 7",
        expectedOutput: "150",
        testExpression: "calculateDailyXp(100, 7)",
      },
      {
        description: "+150 XP for streak >= 30",
        expectedOutput: "250",
        testExpression: "calculateDailyXp(100, 30)",
      },
    ],
    hints: [
      "Use `if/else if` to check streak thresholds",
      "30-day bonus should override 7-day bonus",
    ],
    tags: ["gamification", "streaks", "xp"],
    expectedBehavior: [
      "Always return at least the base XP",
      "Add +50 bonus when streak is 7 or more days",
      "Add +150 bonus (not +50) when streak is 30 or more days",
    ],
    examples: [
      {
        input: "calculateDailyXp(100, 3)",
        output: "100",
        explanation: "No bonus below 7-day streak",
      },
      {
        input: "calculateDailyXp(100, 7)",
        output: "150",
        explanation: "+50 bonus at 7+ days",
      },
      {
        input: "calculateDailyXp(100, 30)",
        output: "250",
        explanation: "+150 bonus at 30+ days",
      },
    ],
  },
  {
    id: 10,
    title: "Anchor Error Codes",
    description:
      "Define a custom Anchor error enum for an enrollment program with: `AlreadyEnrolled (6000)`, `CourseNotFound (6001)`, `InsufficientXP (6002)`.",
    difficulty: "beginner",
    estimatedMinutes: 10,
    category: "anchor",
    language: "rust",
    xpReward: 60,
    starterCode: `use anchor_lang::prelude::*;

// Define the error enum with correct codes
#[error_code]
pub enum EnrollmentError {
  // Your code here
}`,
    solutionCode: `use anchor_lang::prelude::*;

#[error_code]
pub enum EnrollmentError {
  #[msg("Learner is already enrolled in this course")]
  AlreadyEnrolled,
  #[msg("Course not found on-chain")]
  CourseNotFound,
  #[msg("Learner does not have sufficient XP for this course")]
  InsufficientXP,
}`,
    testCases: [
      { description: "AlreadyEnrolled has code 6000", expectedOutput: "6000" },
      { description: "CourseNotFound has code 6001", expectedOutput: "6001" },
      { description: "InsufficientXP has code 6002", expectedOutput: "6002" },
    ],
    hints: [
      "Use `#[error_code]` attribute macro",
      "Add descriptive `#[msg(...)]` to each variant",
      "Anchor auto-assigns codes starting at 6000",
    ],
    tags: ["anchor", "errors", "error-codes"],
    expectedBehavior: [
      "Use #[error_code] attribute on the enum",
      "Define three variants in order: AlreadyEnrolled, CourseNotFound, InsufficientXP",
      'Add #[msg("...")] with descriptive messages to each',
    ],
    examples: [
      { input: "AlreadyEnrolled", output: "Error code 6000" },
      { input: "CourseNotFound", output: "Error code 6001" },
    ],
  },
  {
    id: 11,
    title: "CPI Transfer SOL",
    description:
      "Implement a Cross-Program Invocation that transfers SOL from one account to another using the System Program's Transfer instruction.",
    difficulty: "intermediate",
    estimatedMinutes: 20,
    category: "anchor",
    language: "rust",
    xpReward: 120,
    starterCode: `use anchor_lang::prelude::*;
use anchor_lang::system_program;

pub fn transfer_sol(ctx: Context<TransferSol>, amount: u64) -> Result<()> {
  // CPI to system_program::transfer
}

#[derive(Accounts)]
pub struct TransferSol<'info> {
  #[account(mut)]
  pub from: Signer<'info>,
  #[account(mut)]
  pub to: SystemAccount<'info>,
  pub system_program: Program<'info, System>,
}`,
    solutionCode: `use anchor_lang::prelude::*;
use anchor_lang::system_program;

pub fn transfer_sol(ctx: Context<TransferSol>, amount: u64) -> Result<()> {
  system_program::transfer(
    CpiContext::new(
      ctx.accounts.system_program.to_account_info(),
      system_program::Transfer {
        from: ctx.accounts.from.to_account_info(),
        to: ctx.accounts.to.to_account_info(),
      },
    ),
    amount,
  )?;
  Ok(())
}

#[derive(Accounts)]
pub struct TransferSol<'info> {
  #[account(mut)]
  pub from: Signer<'info>,
  #[account(mut)]
  pub to: SystemAccount<'info>,
  pub system_program: Program<'info, System>,
}`,
    testCases: [
      {
        description: "Invokes system_program::transfer",
        expectedOutput: "CpiContext",
      },
      {
        description: "Amount is transferred correctly",
        expectedOutput: "amount",
      },
    ],
    hints: [
      "Use `system_program::transfer` with a `CpiContext::new`",
      "Pass `.to_account_info()` for from, to, and program",
    ],
    tags: ["cpi", "sol-transfer", "system-program"],
    expectedBehavior: [
      "Create a CpiContext with the system program account info",
      "Build the Transfer struct with from and to account infos",
      "Call system_program::transfer with the context and amount",
    ],
    examples: [
      {
        input: "amount = 1_000_000_000 (1 SOL)",
        output: "Ok(()) — 1 SOL transferred",
      },
    ],
  },
  {
    id: 12,
    title: "AMM Price Calculation",
    description:
      "Calculate the output amount for a constant-product AMM swap. Formula: `outputAmount = (reserveOut * inputAmount) / (reserveIn + inputAmount)`. No fees.",
    difficulty: "intermediate",
    estimatedMinutes: 20,
    category: "defi",
    language: "typescript",
    xpReward: 90,
    starterCode: `export function getSwapOutput(
  inputAmount: bigint,
  reserveIn: bigint,
  reserveOut: bigint,
): bigint {
  // Implement constant product formula
}`,
    solutionCode: `export function getSwapOutput(
  inputAmount: bigint,
  reserveIn: bigint,
  reserveOut: bigint,
): bigint {
  return (reserveOut * inputAmount) / (reserveIn + inputAmount);
}`,
    testCases: [
      {
        description: "getSwapOutput(1000n, 10000n, 10000n) === 909n",
        expectedOutput: "909",
        testExpression: "String(getSwapOutput(1000n, 10000n, 10000n))",
      },
      {
        description: "getSwapOutput(100n, 1000n, 2000n) === 181n",
        expectedOutput: "181",
        testExpression: "String(getSwapOutput(100n, 1000n, 2000n))",
      },
    ],
    hints: [
      "Use `bigint` for exact integer arithmetic",
      "The formula is: `(reserveOut * inputAmount) / (reserveIn + inputAmount)`",
    ],
    tags: ["amm", "defi", "constant-product"],
    expectedBehavior: [
      "Multiply reserveOut by inputAmount",
      "Divide by (reserveIn + inputAmount)",
      "Use native bigint arithmetic (no precision loss)",
    ],
    examples: [
      {
        input: "getSwapOutput(1000n, 10000n, 10000n)",
        output: "909n",
        explanation: "(10000*1000)/(10000+1000) = 909",
      },
    ],
  },
  {
    id: 13,
    title: "Check SOL Balance",
    description:
      "Write a TypeScript function that returns true if an account has at least `minLamports` SOL balance, using the Solana RPC connection.",
    difficulty: "beginner",
    estimatedMinutes: 10,
    category: "solana",
    language: "typescript",
    xpReward: 50,
    starterCode: `import { Connection, PublicKey } from "@solana/web3.js";

export async function hasEnoughSol(
  connection: Connection,
  address: PublicKey,
  minLamports: number,
): Promise<boolean> {
  // Return true if balance >= minLamports
}`,
    solutionCode: `import { Connection, PublicKey } from "@solana/web3.js";

export async function hasEnoughSol(
  connection: Connection,
  address: PublicKey,
  minLamports: number,
): Promise<boolean> {
  const balance = await connection.getBalance(address);
  return balance >= minLamports;
}`,
    testCases: [
      {
        description: "Returns true when balance >= min",
        expectedOutput: "true",
      },
      {
        description: "Returns false when balance < min",
        expectedOutput: "false",
      },
    ],
    hints: [
      "Use `connection.getBalance(address)` to get lamports",
      "Compare result to `minLamports`",
    ],
    tags: ["rpc", "balance", "lamports"],
    expectedBehavior: [
      "Call connection.getBalance() with the address",
      "Compare the returned balance to minLamports",
      "Return true if balance >= minLamports",
    ],
    examples: [
      { input: "Balance: 2 SOL, min: 1 SOL", output: "true" },
      { input: "Balance: 0.5 SOL, min: 1 SOL", output: "false" },
    ],
  },
  {
    id: 14,
    title: "Count Set Lessons",
    description:
      "Given a 64-bit bitmap where each bit represents a lesson, count how many lessons are completed (bits set to 1).",
    difficulty: "beginner",
    estimatedMinutes: 10,
    category: "rust",
    language: "rust",
    xpReward: 50,
    starterCode: `/// Count the number of completed lessons in a bitmap.
pub fn count_completed(bitmap: u64) -> u32 {
  // Count set bits
}`,
    solutionCode: `pub fn count_completed(bitmap: u64) -> u32 {
  bitmap.count_ones()
}`,
    testCases: [
      { description: "count_completed(0) == 0", expectedOutput: "0" },
      { description: "count_completed(0b1111) == 4", expectedOutput: "4" },
      { description: "count_completed(u64::MAX) == 64", expectedOutput: "64" },
    ],
    hints: [
      "Rust integers have a built-in `count_ones()` method",
      "No loop needed!",
    ],
    tags: ["bitwise", "popcount", "rust"],
    expectedBehavior: [
      "Use the built-in count_ones() method on u64",
      "Return the number of 1 bits in the bitmap",
    ],
    examples: [
      { input: "bitmap = 0", output: "0" },
      { input: "bitmap = 0b1111", output: "4" },
      { input: "bitmap = u64::MAX", output: "64" },
    ],
  },
  {
    id: 15,
    title: "Derive ATA",
    description:
      "Derive the Associated Token Account (ATA) address for a wallet + mint pair using `@solana/spl-token`.",
    difficulty: "beginner",
    estimatedMinutes: 10,
    category: "tokens",
    language: "typescript",
    xpReward: 60,
    starterCode: `import { PublicKey } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token";

export function deriveAta(owner: PublicKey, mint: PublicKey): PublicKey {
  // Derive the ATA address
}`,
    solutionCode: `import { PublicKey } from "@solana/web3.js";
import {
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

export function deriveAta(owner: PublicKey, mint: PublicKey): PublicKey {
  return getAssociatedTokenAddressSync(mint, owner, false, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID);
}`,
    testCases: [
      { description: "Returns a valid PublicKey", expectedOutput: "PublicKey" },
      { description: "ATA is off ed25519 curve", expectedOutput: "off-curve" },
    ],
    hints: [
      "Use `getAssociatedTokenAddressSync` from `@solana/spl-token`",
      "Parameters are: (mint, owner, allowOwnerOffCurve, tokenProgramId, ataProgramId)",
    ],
    tags: ["ata", "token", "spl"],
    expectedBehavior: [
      "Import getAssociatedTokenAddressSync from @solana/spl-token",
      "Pass mint and owner (in that order) to derive the ATA",
      "Return the derived PublicKey",
    ],
    examples: [
      {
        input: "owner + USDC mint",
        output: "Deterministic ATA PublicKey (off-curve)",
      },
    ],
  },
  {
    id: 16,
    title: "Realloc Account Space",
    description:
      "In Anchor, reallocate a data account to fit a new field. Use the `realloc` constraint with space calculation and `zero` set to `true`.",
    difficulty: "advanced",
    estimatedMinutes: 30,
    category: "anchor",
    language: "rust",
    xpReward: 150,
    starterCode: `use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct AddField<'info> {
  // Reallocate 'data_account' to space = 8 + old_size + 32 (new Pubkey field)
  // payer pays for extra rent
  pub data_account: Account<'info, DataStore>,
  #[account(mut)]
  pub payer: Signer<'info>,
  pub system_program: Program<'info, System>,
}

#[account]
pub struct DataStore {
  pub value: u64,
}`,
    solutionCode: `use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct AddField<'info> {
  #[account(
    mut,
    realloc = 8 + 8 + 32,
    realloc::payer = payer,
    realloc::zero = true,
  )]
  pub data_account: Account<'info, DataStore>,
  #[account(mut)]
  pub payer: Signer<'info>,
  pub system_program: Program<'info, System>,
}

#[account]
pub struct DataStore {
  pub value: u64,
  pub authority: Pubkey,
}`,
    testCases: [
      { description: "Uses `realloc` constraint", expectedOutput: "realloc" },
      {
        description: "Specifies payer for rent",
        expectedOutput: "realloc::payer",
      },
      {
        description: "Sets zero = true to clear new bytes",
        expectedOutput: "realloc::zero",
      },
    ],
    hints: [
      "Use `realloc = <new_size>` constraint",
      "Specify `realloc::payer = payer` for rent payment",
      "8 bytes discriminator + field sizes",
    ],
    tags: ["anchor", "realloc", "account-resize"],
    expectedBehavior: [
      "Add realloc = 8 + 8 + 32 (discriminator + u64 + Pubkey)",
      "Specify realloc::payer = payer for rent payment",
      "Set realloc::zero = true to zero-initialize new bytes",
      "Add the new Pubkey field to DataStore struct",
    ],
    examples: [
      {
        input: "Old size: 16 (8 disc + 8 u64)",
        output: "New size: 48 (8 disc + 8 u64 + 32 Pubkey)",
      },
    ],
  },
  {
    id: 17,
    title: "Verify Ed25519 Signature",
    description:
      "Write a TypeScript function that verifies an ed25519 signature for a message. Use `@solana/web3.js` or `tweetnacl`.",
    difficulty: "intermediate",
    estimatedMinutes: 20,
    category: "solana",
    language: "typescript",
    xpReward: 110,
    starterCode: `import nacl from "tweetnacl";
import { PublicKey } from "@solana/web3.js";

export function verifySignature(
  message: Uint8Array,
  signature: Uint8Array,
  publicKey: PublicKey,
): boolean {
  // Verify ed25519 signature
}`,
    solutionCode: `import nacl from "tweetnacl";
import { PublicKey } from "@solana/web3.js";

export function verifySignature(
  message: Uint8Array,
  signature: Uint8Array,
  publicKey: PublicKey,
): boolean {
  return nacl.sign.detached.verify(message, signature, publicKey.toBytes());
}`,
    testCases: [
      {
        description: "Returns true for valid signature",
        expectedOutput: "true",
      },
      {
        description: "Returns false for tampered message",
        expectedOutput: "false",
      },
    ],
    hints: [
      "Use `nacl.sign.detached.verify(message, signature, publicKeyBytes)`",
      "Convert PublicKey to bytes with `.toBytes()`",
    ],
    tags: ["signatures", "ed25519", "nacl"],
    expectedBehavior: [
      "Convert the PublicKey to bytes using .toBytes()",
      "Call nacl.sign.detached.verify with message, signature, and public key bytes",
      "Return the boolean result",
    ],
    examples: [
      { input: "Valid message + matching signature", output: "true" },
      { input: "Tampered message + original signature", output: "false" },
    ],
  },
  {
    id: 18,
    title: "Fibonacci (Iterative)",
    description:
      "Implement an iterative (non-recursive) Fibonacci function in Rust that's safe for on-chain use (no stack overflow).",
    difficulty: "beginner",
    estimatedMinutes: 10,
    category: "rust",
    language: "rust",
    xpReward: 45,
    starterCode: `/// Returns the nth Fibonacci number (0-indexed).
/// Must be iterative — recursive is not allowed.
pub fn fibonacci(n: u32) -> u64 {
  // Your code here
}`,
    solutionCode: `pub fn fibonacci(n: u32) -> u64 {
  if n == 0 { return 0; }
  if n == 1 { return 1; }
  let (mut a, mut b) = (0u64, 1u64);
  for _ in 2..=n {
    (a, b) = (b, a + b);
  }
  b
}`,
    testCases: [
      { description: "fibonacci(0) == 0", expectedOutput: "0" },
      { description: "fibonacci(1) == 1", expectedOutput: "1" },
      { description: "fibonacci(10) == 55", expectedOutput: "55" },
      { description: "fibonacci(20) == 6765", expectedOutput: "6765" },
    ],
    hints: [
      "Use a loop from 2..=n",
      "Keep track of two previous values",
      "Tuple destructuring `(a, b) = (b, a+b)` works in Rust",
    ],
    tags: ["rust", "iterative", "math"],
    expectedBehavior: [
      "Handle base cases: fib(0) = 0, fib(1) = 1",
      "Use a loop (not recursion) to compute the value",
      "Track two previous values and swap them each iteration",
    ],
    examples: [
      { input: "fibonacci(0)", output: "0" },
      { input: "fibonacci(10)", output: "55" },
      { input: "fibonacci(20)", output: "6765" },
    ],
  },
  {
    id: 19,
    title: "Achievement Bitmap Check",
    description:
      "The on-chain achievement system uses a 256-bit bitmap (4x u64). Write a function to check if achievement `n` (0-255) is unlocked.",
    difficulty: "intermediate",
    estimatedMinutes: 20,
    category: "rust",
    language: "rust",
    xpReward: 80,
    starterCode: `/// Check if achievement at bit position n is set in a 256-bit bitmap (4x u64).
pub fn is_achievement_unlocked(bitmap: &[u64; 4], n: u8) -> bool {
  // Each u64 holds 64 bits; n / 64 selects the word, n % 64 the bit
}`,
    solutionCode: `pub fn is_achievement_unlocked(bitmap: &[u64; 4], n: u8) -> bool {
  let word = (n / 64) as usize;
  let bit = n % 64;
  (bitmap[word] >> bit) & 1 == 1
}`,
    testCases: [
      { description: "Bit 0 in [1,0,0,0] -> true", expectedOutput: "true" },
      { description: "Bit 64 in [0,1,0,0] -> true", expectedOutput: "true" },
      {
        description: "Bit 255 in [0,0,0,2^63] -> true",
        expectedOutput: "true",
      },
    ],
    hints: [
      "n / 64 gives the word index, n % 64 gives the bit within the word",
      "Shift and AND with 1 to extract the bit",
    ],
    tags: ["bitwise", "achievements", "on-chain"],
    expectedBehavior: [
      "Compute word index: n / 64",
      "Compute bit position within word: n % 64",
      "Shift the word right by bit position and AND with 1",
    ],
    examples: [
      {
        input: "bitmap=[1,0,0,0], n=0",
        output: "true",
        explanation: "Bit 0 is set in word 0",
      },
      {
        input: "bitmap=[0,1,0,0], n=64",
        output: "true",
        explanation: "Bit 0 of word 1 (position 64)",
      },
    ],
  },
  {
    id: 20,
    title: "Leaderboard Rank",
    description:
      "Given an array of XP values (sorted descending), find a user's rank (1-based). Return `null` if not in the list.",
    difficulty: "beginner",
    estimatedMinutes: 10,
    category: "solana",
    language: "typescript",
    xpReward: 40,
    starterCode: `export function findRank(
  leaderboard: { wallet: string; xp: number }[],
  wallet: string,
): number | null {
  // Return 1-based rank or null
}`,
    solutionCode: `export function findRank(
  leaderboard: { wallet: string; xp: number }[],
  wallet: string,
): number | null {
  const idx = leaderboard.findIndex((e) => e.wallet === wallet);
  return idx === -1 ? null : idx + 1;
}`,
    testCases: [
      {
        description: "Returns 1 for first entry",
        expectedOutput: "1",
        testExpression:
          "findRank([{wallet:'a',xp:100},{wallet:'b',xp:50}], 'a')",
      },
      {
        description: "Returns null if not found",
        expectedOutput: "null",
        testExpression: "String(findRank([{wallet:'a',xp:100}], 'z'))",
      },
      {
        description: "Returns correct rank for middle entry",
        expectedOutput: "2",
        testExpression:
          "findRank([{wallet:'a',xp:100},{wallet:'b',xp:50}], 'b')",
      },
    ],
    hints: [
      "Use `Array.findIndex` to get 0-based index",
      "Add 1 for 1-based rank, return null if -1",
    ],
    tags: ["leaderboard", "ranking", "arrays"],
    expectedBehavior: [
      "Find the wallet in the leaderboard array",
      "Convert 0-based index to 1-based rank",
      "Return null if wallet is not found",
    ],
    examples: [
      { input: "findRank([{wallet:'a',xp:100}], 'a')", output: "1" },
      { input: "findRank([{wallet:'a',xp:100}], 'z')", output: "null" },
    ],
  },
  {
    id: 21,
    title: "Close Account Refund",
    description:
      "In Anchor, close an enrollment account and refund its lamports to the learner. Use the `close` constraint.",
    difficulty: "intermediate",
    estimatedMinutes: 20,
    category: "anchor",
    language: "rust",
    xpReward: 100,
    starterCode: `use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct CloseEnrollment<'info> {
  // Close 'enrollment' and send rent to 'learner'
  pub enrollment: Account<'info, Enrollment>,
  pub learner: Signer<'info>,
}

#[account]
pub struct Enrollment {
  pub learner: Pubkey,
  pub course_id: Pubkey,
  pub completed: bool,
}`,
    solutionCode: `use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct CloseEnrollment<'info> {
  #[account(
    mut,
    has_one = learner,
    close = learner,
  )]
  pub enrollment: Account<'info, Enrollment>,
  #[account(mut)]
  pub learner: Signer<'info>,
}

#[account]
pub struct Enrollment {
  pub learner: Pubkey,
  pub course_id: Pubkey,
  pub completed: bool,
}`,
    testCases: [
      {
        description: "Uses `close = learner` constraint",
        expectedOutput: "close",
      },
      {
        description: "has_one = learner for authorization",
        expectedOutput: "has_one",
      },
      { description: "Refunds rent to learner", expectedOutput: "lamports" },
    ],
    hints: [
      "Add `close = <destination>` to the account constraint",
      "Use `has_one` to ensure only the learner can close",
      "Mark learner as `mut` since it receives lamports",
    ],
    tags: ["anchor", "close-account", "rent"],
    expectedBehavior: [
      "Add `close = learner` to transfer lamports and zero data",
      "Add `has_one = learner` to verify ownership",
      "Mark both accounts as `mut`",
    ],
    examples: [
      {
        input: "Enrollment with learner = signer",
        output: "Account closed, rent refunded to learner",
      },
    ],
  },
  {
    id: 22,
    title: "Parse Instruction Data",
    description:
      "Solana instruction data starts with a 1-byte discriminant. Write a Rust function to extract the discriminant and remaining data.",
    difficulty: "beginner",
    estimatedMinutes: 10,
    category: "rust",
    language: "rust",
    xpReward: 55,
    starterCode: `pub fn parse_instruction(data: &[u8]) -> Option<(u8, &[u8])> {
  // Return (discriminant, rest_of_data) or None if empty
}`,
    solutionCode: `pub fn parse_instruction(data: &[u8]) -> Option<(u8, &[u8])> {
  data.split_first().map(|(&disc, rest)| (disc, rest))
}`,
    testCases: [
      { description: "Returns None for empty data", expectedOutput: "None" },
      {
        description: "Returns (0, &[]) for single byte 0",
        expectedOutput: "(0, [])",
      },
      {
        description: "Returns (1, &[2, 3]) for [1, 2, 3]",
        expectedOutput: "(1, [2, 3])",
      },
    ],
    hints: [
      "`slice.split_first()` returns `Option<(&T, &[T])>`",
      "Pattern match with `map`",
    ],
    tags: ["instruction", "parsing", "discriminant"],
    expectedBehavior: [
      "Handle empty slice by returning None",
      "Split the first byte as discriminant",
      "Return the remaining bytes as a slice",
    ],
    examples: [
      { input: "&[]", output: "None" },
      { input: "&[1, 2, 3]", output: "Some((1, &[2, 3]))" },
    ],
  },
  {
    id: 23,
    title: "Calculate Rent Exemption",
    description:
      "Write a TypeScript function that calculates the minimum lamports needed to make an account rent-exempt using the Solana RPC.",
    difficulty: "beginner",
    estimatedMinutes: 10,
    category: "solana",
    language: "typescript",
    xpReward: 55,
    starterCode: `import { Connection } from "@solana/web3.js";

export async function getRentExemption(
  connection: Connection,
  dataSize: number,
): Promise<number> {
  // Get minimum lamports for rent exemption
}`,
    solutionCode: `import { Connection } from "@solana/web3.js";

export async function getRentExemption(
  connection: Connection,
  dataSize: number,
): Promise<number> {
  return connection.getMinimumBalanceForRentExemption(dataSize);
}`,
    testCases: [
      {
        description: "Returns a positive number of lamports",
        expectedOutput: "> 0",
      },
      {
        description: "Larger data = more lamports",
        expectedOutput: "monotonic",
      },
    ],
    hints: ["Use `connection.getMinimumBalanceForRentExemption(dataSize)`"],
    tags: ["rent", "rpc", "lamports"],
    expectedBehavior: [
      "Call connection.getMinimumBalanceForRentExemption(dataSize)",
      "Return the result directly as a number",
    ],
    examples: [
      { input: "dataSize = 0", output: "890880 lamports (minimum)" },
      { input: "dataSize = 100", output: "~1_566_720 lamports" },
    ],
  },
  {
    id: 24,
    title: "Merkle Root",
    description:
      "Compute a Merkle root from an array of leaf hashes. If the array has an odd length, duplicate the last element before hashing pairs.",
    difficulty: "advanced",
    estimatedMinutes: 30,
    category: "rust",
    language: "rust",
    xpReward: 200,
    starterCode: `use sha2::{Sha256, Digest};

pub fn merkle_root(leaves: Vec<[u8; 32]>) -> [u8; 32] {
  // Build merkle tree and return root hash
}`,
    solutionCode: `use sha2::{Sha256, Digest};

pub fn merkle_root(mut leaves: Vec<[u8; 32]>) -> [u8; 32] {
  if leaves.is_empty() { return [0u8; 32]; }
  while leaves.len() > 1 {
    if leaves.len() % 2 == 1 { leaves.push(*leaves.last().unwrap()); }
    leaves = leaves.chunks(2).map(|pair| {
      let mut hasher = Sha256::new();
      hasher.update(pair[0]);
      hasher.update(pair[1]);
      hasher.finalize().into()
    }).collect();
  }
  leaves[0]
}`,
    testCases: [
      { description: "Single leaf returns itself", expectedOutput: "leaf[0]" },
      {
        description: "Odd count duplicates last leaf",
        expectedOutput: "hash(last, last)",
      },
      {
        description: "Two leaves hash correctly",
        expectedOutput: "hash(leaf[0], leaf[1])",
      },
    ],
    hints: [
      "Use a while loop until 1 leaf remains",
      "Duplicate the last leaf if odd count",
      "Hash pairs with SHA-256",
    ],
    tags: ["merkle", "hashing", "cryptography"],
    expectedBehavior: [
      "Return [0u8; 32] for empty input",
      "Loop until only one node remains",
      "Duplicate last leaf when count is odd",
      "Hash each pair with SHA-256 to produce the next level",
    ],
    examples: [
      { input: "Single leaf [0xAB...]", output: "[0xAB...] (unchanged)" },
      { input: "Two leaves [A, B]", output: "SHA256(A || B)" },
    ],
  },
  {
    id: 25,
    title: "XP Token Metadata",
    description:
      "Build the Token-2022 metadata for a soulbound XP token. Create a TypeScript object with name, symbol, uri, and NonTransferable extension.",
    difficulty: "intermediate",
    estimatedMinutes: 20,
    category: "tokens",
    language: "typescript",
    xpReward: 90,
    starterCode: `export interface XpTokenConfig {
  name: string;
  symbol: string;
  uri: string;
  decimals: number;
  extensions: string[];
}

export function buildXpTokenConfig(programName: string): XpTokenConfig {
  // Return config for a soulbound XP token
}`,
    solutionCode: `export interface XpTokenConfig {
  name: string;
  symbol: string;
  uri: string;
  decimals: number;
  extensions: string[];
}

export function buildXpTokenConfig(programName: string): XpTokenConfig {
  return {
    name: \`\${programName} XP\`,
    symbol: "XP",
    uri: \`https://academy.superteam.fun/tokens/\${programName.toLowerCase()}-xp.json\`,
    decimals: 0,
    extensions: ["NonTransferable", "MetadataPointer"],
  };
}`,
    testCases: [
      {
        description: "Symbol is 'XP'",
        expectedOutput: "XP",
        testExpression: "buildXpTokenConfig('Test').symbol",
      },
      {
        description: "decimals is 0 (non-divisible)",
        expectedOutput: "0",
        testExpression: "String(buildXpTokenConfig('Test').decimals)",
      },
      {
        description: "NonTransferable extension present",
        expectedOutput: "true",
        testExpression:
          "String(buildXpTokenConfig('Test').extensions.includes('NonTransferable'))",
      },
    ],
    hints: [
      "XP tokens should have 0 decimals",
      "NonTransferable makes it soulbound (can't be sent)",
    ],
    tags: ["token-2022", "metadata", "soulbound"],
    expectedBehavior: [
      "Set name to `{programName} XP`",
      "Set symbol to 'XP' and decimals to 0",
      "Include NonTransferable and MetadataPointer extensions",
    ],
    examples: [
      {
        input: "buildXpTokenConfig('Academy')",
        output: "{ name: 'Academy XP', symbol: 'XP', decimals: 0, ... }",
      },
    ],
  },
  {
    id: 26,
    title: "Anchor Init Space",
    description:
      "Calculate the correct `space` value for an Anchor account with: discriminator, `u64` value, `Pubkey` owner, `bool` active, `String` name (max 50 chars).",
    difficulty: "intermediate",
    estimatedMinutes: 20,
    category: "anchor",
    language: "rust",
    xpReward: 80,
    starterCode: `// Calculate: 8 (disc) + u64 + Pubkey + bool + String(50)
// Hint: String = 4 (length prefix) + N bytes
pub const MY_ACCOUNT_SIZE: usize = /* ? */;

use anchor_lang::prelude::*;

#[account]
pub struct MyAccount {
  pub value: u64,
  pub owner: Pubkey,
  pub active: bool,
  pub name: String,
}`,
    solutionCode: `// 8 (discriminator) + 8 (u64) + 32 (Pubkey) + 1 (bool) + 4 + 50 (String)
pub const MY_ACCOUNT_SIZE: usize = 8 + 8 + 32 + 1 + 4 + 50; // = 103

use anchor_lang::prelude::*;

#[account]
pub struct MyAccount {
  pub value: u64,
  pub owner: Pubkey,
  pub active: bool,
  pub name: String,
}`,
    testCases: [
      { description: "8 bytes for discriminator", expectedOutput: "8" },
      { description: "8 bytes for u64", expectedOutput: "8" },
      { description: "32 bytes for Pubkey", expectedOutput: "32" },
      { description: "String = 4 + max_chars", expectedOutput: "54" },
    ],
    hints: [
      "Discriminator = 8 bytes",
      "u64 = 8 bytes, Pubkey = 32 bytes, bool = 1 byte",
      "String = 4 bytes (length) + N bytes (content)",
    ],
    tags: ["anchor", "account-size", "space"],
    expectedBehavior: [
      "Include 8 bytes for the Anchor discriminator",
      "Calculate field sizes: u64=8, Pubkey=32, bool=1",
      "String needs 4 bytes length prefix + max content bytes",
      "Total: 8 + 8 + 32 + 1 + 4 + 50 = 103",
    ],
    examples: [
      { input: "u64", output: "8 bytes" },
      { input: "Pubkey", output: "32 bytes" },
      { input: "String (max 50)", output: "4 + 50 = 54 bytes" },
    ],
  },
  {
    id: 27,
    title: "Validate SOL Transfer",
    description:
      "Write a TypeScript function that validates a SOL transfer instruction: checks it's from SystemProgram, has the right `Transfer` type, and amount > 0.",
    difficulty: "intermediate",
    estimatedMinutes: 20,
    category: "solana",
    language: "typescript",
    xpReward: 95,
    starterCode: `import { TransactionInstruction, SystemProgram } from "@solana/web3.js";
import { SystemInstruction } from "@solana/web3.js";

export function isValidTransfer(
  ix: TransactionInstruction,
  minAmount: number,
): boolean {
  // Validate it's a system transfer >= minAmount
}`,
    solutionCode: `import { TransactionInstruction, SystemProgram } from "@solana/web3.js";
import { SystemInstruction } from "@solana/web3.js";

export function isValidTransfer(
  ix: TransactionInstruction,
  minAmount: number,
): boolean {
  if (!ix.programId.equals(SystemProgram.programId)) return false;
  try {
    const type = SystemInstruction.decodeInstructionType(ix);
    if (type !== "Transfer") return false;
    const { lamports } = SystemInstruction.decodeTransfer(ix);
    return Number(lamports) >= minAmount;
  } catch {
    return false;
  }
}`,
    testCases: [
      {
        description: "Returns false for non-System programs",
        expectedOutput: "false",
      },
      {
        description: "Returns false for wrong instruction type",
        expectedOutput: "false",
      },
      {
        description: "Returns false for amount below minimum",
        expectedOutput: "false",
      },
      {
        description: "Returns true for valid transfer",
        expectedOutput: "true",
      },
    ],
    hints: [
      "Check `programId.equals(SystemProgram.programId)` first",
      "Use `SystemInstruction.decodeInstructionType` to get type",
      "Use `SystemInstruction.decodeTransfer` for the amount",
    ],
    tags: ["validation", "system-program", "instructions"],
    expectedBehavior: [
      "Verify the instruction's programId is the System Program",
      "Decode and check the instruction type is 'Transfer'",
      "Decode the transfer amount and compare to minAmount",
      "Return false and catch errors for invalid instructions",
    ],
    examples: [
      { input: "SystemProgram Transfer, 1 SOL, min=0.5 SOL", output: "true" },
      { input: "Token Program instruction, any amount", output: "false" },
    ],
  },
  {
    id: 28,
    title: "NFT Metadata URI",
    description:
      "Generate an on-chain Metaplex NFT metadata URI for a credential cNFT. It should include: name, description, image, attributes (track, level, xp).",
    difficulty: "intermediate",
    estimatedMinutes: 20,
    category: "tokens",
    language: "typescript",
    xpReward: 85,
    starterCode: `export interface CredentialMetadata {
  name: string;
  symbol: string;
  description: string;
  image: string;
  attributes: { trait_type: string; value: string | number }[];
}

export function buildCredentialMetadata(
  track: string,
  level: number,
  xp: number,
  learnerName: string,
): CredentialMetadata {
  // Build Metaplex-compatible metadata
}`,
    solutionCode: `export interface CredentialMetadata {
  name: string;
  symbol: string;
  description: string;
  image: string;
  attributes: { trait_type: string; value: string | number }[];
}

export function buildCredentialMetadata(
  track: string,
  level: number,
  xp: number,
  learnerName: string,
): CredentialMetadata {
  return {
    name: \`Superteam Academy \u2014 \${track} Credential\`,
    symbol: "STA",
    description: \`On-chain credential for \${learnerName} on the \${track} learning track, Level \${level}.\`,
    image: \`https://academy.superteam.fun/credentials/\${track.toLowerCase()}-level-\${level}.png\`,
    attributes: [
      { trait_type: "Track", value: track },
      { trait_type: "Level", value: level },
      { trait_type: "XP", value: xp },
      { trait_type: "Learner", value: learnerName },
    ],
  };
}`,
    testCases: [
      {
        description: "name contains track name",
        expectedOutput: "true",
        testExpression:
          "String(buildCredentialMetadata('Rust', 1, 100, 'Alice').name.includes('Rust'))",
      },
      {
        description: "Has 4 attributes (Track, Level, XP, Learner)",
        expectedOutput: "4",
        testExpression:
          "String(buildCredentialMetadata('Rust', 1, 100, 'Alice').attributes.length)",
      },
      {
        description: "symbol is 'STA'",
        expectedOutput: "STA",
        testExpression:
          "buildCredentialMetadata('Rust', 1, 100, 'Alice').symbol",
      },
    ],
    hints: [
      "Follow Metaplex NFT standard: name, symbol, description, image, attributes",
      "Attributes are `{ trait_type, value }` objects",
    ],
    tags: ["metaplex", "nft", "metadata"],
    expectedBehavior: [
      "Set name to include the track name",
      "Use 'STA' as the symbol",
      "Include Track, Level, XP, Learner as attributes",
      "Generate an image URL based on track and level",
    ],
    examples: [
      {
        input: "buildCredentialMetadata('Rust', 2, 500, 'Alice')",
        output:
          "{ name: 'Superteam Academy — Rust Credential', symbol: 'STA', ... }",
      },
    ],
  },
];

// ── Daily selection logic ────────────────────────────────────────────────────

/**
 * Get today's challenge index based on UTC day number.
 * All users see the same challenge on a given day.
 */
export function getTodayChallenge(): DailyChallenge {
  const dayIndex = Math.floor(Date.now() / MS_PER_DAY);
  return CHALLENGE_BANK[dayIndex % CHALLENGE_BANK.length];
}

/**
 * Get the UTC date string for the current challenge day (YYYY-MM-DD).
 */
export function getTodayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Get recent challenges (last N days, excluding today).
 * Delegates to getAllPastChallenges().
 */
export function getRecentChallenges(count: number = 6): DailyChallenge[] {
  return getAllPastChallenges()
    .slice(0, count)
    .map((entry) => entry.challenge);
}

/**
 * Get time in seconds until the next challenge resets (UTC midnight).
 */
export function getSecondsUntilReset(): number {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  tomorrow.setUTCHours(0, 0, 0, 0);
  return Math.floor((tomorrow.getTime() - now.getTime()) / 1000);
}

/**
 * Get a challenge by its ID from the bank.
 */
export function getChallengeById(id: number): DailyChallenge | undefined {
  return CHALLENGE_BANK.find((c) => c.id === id);
}

// ── localStorage helpers ─────────────────────────────────────────────────────

const STORAGE_KEY = "sta_daily_challenges";

/** Load all past completions from localStorage. */
export function loadCompletions(): DailyChallengeCompletion[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as DailyChallengeCompletion[]) : [];
  } catch {
    return [];
  }
}

/** Check if today's challenge is already completed. */
export function isTodayCompleted(): boolean {
  const today = getTodayKey();
  return loadCompletions().some((c) => c.date === today);
}

/** Save a completion record to localStorage. */
export function saveCompletion(challengeId: number, xpEarned: number): void {
  if (typeof window === "undefined") return;
  const completions = loadCompletions();
  const today = getTodayKey();
  if (completions.some((c) => c.date === today)) return; // already done
  completions.unshift({
    challengeId,
    date: today,
    xpEarned,
    completedAt: new Date().toISOString(),
  });
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(completions.slice(0, 90)));
  } catch {
    // ignore storage errors
  }
}
