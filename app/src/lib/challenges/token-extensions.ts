import type { CodingChallenge } from './types';

export const tokenExtensionsChallenges: CodingChallenge[] = [
  // ── te-001: Token-2022 Program Basics ── beginner, typescript, 50xp, 10min
  {
    id: 'te-001',
    title: 'Token-2022 Program Basics',
    description:
      'Create a new Token-2022 mint using the SPL Token-2022 program. Initialize the mint with a specified number of decimals and a mint authority. This is the foundation for all Token Extensions work.',
    difficulty: 'beginner',
    category: 'token-extensions',
    language: 'typescript',
    starterCode: `import {
  Connection,
  Keypair,
  SystemProgram,
  Transaction,
} from '@solana/web3.js';
import {
  TOKEN_2022_PROGRAM_ID,
  getMintLen,
  createInitializeMintInstruction,
} from '@solana/spl-token';

/**
 * Create a basic Token-2022 mint with no extensions.
 * @param connection - Solana connection
 * @param payer - Transaction fee payer
 * @param decimals - Number of decimals for the mint
 * @returns The mint keypair
 */
export async function createToken2022Mint(
  connection: Connection,
  payer: Keypair,
  decimals: number,
): Promise<Keypair> {
  const mintKeypair = Keypair.generate();

  // TODO: Calculate the space needed for a mint with no extensions
  // TODO: Get the minimum rent-exempt balance for that space
  // TODO: Build a transaction with two instructions:
  //   1. SystemProgram.createAccount (owner = TOKEN_2022_PROGRAM_ID)
  //   2. createInitializeMintInstruction (with TOKEN_2022_PROGRAM_ID)
  // TODO: Send and confirm the transaction

  return mintKeypair;
}`,
    solution: `import {
  Connection,
  Keypair,
  SystemProgram,
  Transaction,
} from '@solana/web3.js';
import {
  TOKEN_2022_PROGRAM_ID,
  getMintLen,
  createInitializeMintInstruction,
} from '@solana/spl-token';

export async function createToken2022Mint(
  connection: Connection,
  payer: Keypair,
  decimals: number,
): Promise<Keypair> {
  const mintKeypair = Keypair.generate();

  const mintSpace = getMintLen([]);
  const lamports = await connection.getMinimumBalanceForRentExemption(mintSpace);

  const transaction = new Transaction().add(
    SystemProgram.createAccount({
      fromPubkey: payer.publicKey,
      newAccountPubkey: mintKeypair.publicKey,
      space: mintSpace,
      lamports,
      programId: TOKEN_2022_PROGRAM_ID,
    }),
    createInitializeMintInstruction(
      mintKeypair.publicKey,
      decimals,
      payer.publicKey,
      null,
      TOKEN_2022_PROGRAM_ID,
    ),
  );

  await connection.sendTransaction(transaction, [payer, mintKeypair]);

  return mintKeypair;
}`,
    testCases: [
      {
        input: 'createToken2022Mint(connection, payer, 9)',
        expectedOutput: 'Mint account owned by TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb',
        description: 'Mint is owned by the Token-2022 program',
      },
      {
        input: 'createToken2022Mint(connection, payer, 6)',
        expectedOutput: 'Mint decimals: 6',
        description: 'Mint decimals match the requested value',
      },
      {
        input: 'createToken2022Mint(connection, payer, 0)',
        expectedOutput: 'Mint supply: 0, isInitialized: true',
        description: 'Mint is initialized with zero supply',
      },
    ],
    hints: [
      'Use getMintLen([]) to get the account size for a mint with no extensions.',
      'The createAccount instruction must set programId to TOKEN_2022_PROGRAM_ID, not the legacy TOKEN_PROGRAM_ID.',
      'Both payer and mintKeypair must sign the transaction since createAccount requires the new account to sign.',
    ],
    xpReward: 50,
    estimatedMinutes: 10,
  },

  // ── te-002: NonTransferable Extension ── beginner, typescript, 50xp, 12min
  {
    id: 'te-002',
    title: 'NonTransferable Token Mint',
    description:
      'Create a soulbound token by initializing a Token-2022 mint with the NonTransferable extension. Tokens minted from this mint cannot be transferred between wallets, making them ideal for XP, reputation, or credential tokens.',
    difficulty: 'beginner',
    category: 'token-extensions',
    language: 'typescript',
    starterCode: `import {
  Connection,
  Keypair,
  SystemProgram,
  Transaction,
} from '@solana/web3.js';
import {
  TOKEN_2022_PROGRAM_ID,
  ExtensionType,
  getMintLen,
  createInitializeMintInstruction,
  createInitializeNonTransferableMintInstruction,
} from '@solana/spl-token';

/**
 * Create a soulbound (non-transferable) Token-2022 mint.
 * @param connection - Solana connection
 * @param payer - Transaction fee payer
 * @returns The mint keypair
 */
export async function createNonTransferableMint(
  connection: Connection,
  payer: Keypair,
): Promise<Keypair> {
  const mintKeypair = Keypair.generate();

  // TODO: Calculate space including the NonTransferable extension
  // TODO: Get minimum rent-exempt balance
  // TODO: Build transaction with three instructions (order matters!):
  //   1. SystemProgram.createAccount
  //   2. createInitializeNonTransferableMintInstruction
  //   3. createInitializeMintInstruction
  // TODO: Send and confirm

  return mintKeypair;
}`,
    solution: `import {
  Connection,
  Keypair,
  SystemProgram,
  Transaction,
} from '@solana/web3.js';
import {
  TOKEN_2022_PROGRAM_ID,
  ExtensionType,
  getMintLen,
  createInitializeMintInstruction,
  createInitializeNonTransferableMintInstruction,
} from '@solana/spl-token';

export async function createNonTransferableMint(
  connection: Connection,
  payer: Keypair,
): Promise<Keypair> {
  const mintKeypair = Keypair.generate();

  const mintSpace = getMintLen([ExtensionType.NonTransferable]);
  const lamports = await connection.getMinimumBalanceForRentExemption(mintSpace);

  const transaction = new Transaction().add(
    SystemProgram.createAccount({
      fromPubkey: payer.publicKey,
      newAccountPubkey: mintKeypair.publicKey,
      space: mintSpace,
      lamports,
      programId: TOKEN_2022_PROGRAM_ID,
    }),
    createInitializeNonTransferableMintInstruction(
      mintKeypair.publicKey,
      TOKEN_2022_PROGRAM_ID,
    ),
    createInitializeMintInstruction(
      mintKeypair.publicKey,
      0,
      payer.publicKey,
      null,
      TOKEN_2022_PROGRAM_ID,
    ),
  );

  await connection.sendTransaction(transaction, [payer, mintKeypair]);

  return mintKeypair;
}`,
    testCases: [
      {
        input: 'createNonTransferableMint(connection, payer)',
        expectedOutput: 'Extension NonTransferable present on mint',
        description: 'Mint has the NonTransferable extension enabled',
      },
      {
        input: 'transfer(nonTransferableMint, fromAta, toAta, owner, 100)',
        expectedOutput: 'Error: Transfer not allowed for non-transferable tokens',
        description: 'Transfers are rejected for tokens from this mint',
      },
      {
        input: 'getMint(connection, mintKeypair.publicKey, undefined, TOKEN_2022_PROGRAM_ID)',
        expectedOutput: 'isInitialized: true, decimals: 0',
        description: 'Mint is properly initialized with 0 decimals',
      },
    ],
    hints: [
      'Use getMintLen([ExtensionType.NonTransferable]) to allocate the correct space.',
      'Extension initialization instructions MUST come before createInitializeMintInstruction.',
      'NonTransferable is a mint-level extension -- token accounts automatically inherit the restriction.',
    ],
    xpReward: 50,
    estimatedMinutes: 12,
  },

  // ── te-003: PermanentDelegate Setup ── beginner, typescript, 50xp, 12min
  {
    id: 'te-003',
    title: 'PermanentDelegate Setup',
    description:
      'Initialize a Token-2022 mint with the PermanentDelegate extension. This grants an authority permanent delegate access over ALL token accounts for this mint, enabling force burns or transfers -- useful for compliance, clawback, or game mechanics.',
    difficulty: 'beginner',
    category: 'token-extensions',
    language: 'typescript',
    starterCode: `import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
} from '@solana/web3.js';
import {
  TOKEN_2022_PROGRAM_ID,
  ExtensionType,
  getMintLen,
  createInitializeMintInstruction,
  createInitializePermanentDelegateInstruction,
} from '@solana/spl-token';

/**
 * Create a Token-2022 mint with a permanent delegate authority.
 * @param connection - Solana connection
 * @param payer - Transaction fee payer
 * @param delegateAuthority - The permanent delegate public key
 * @returns The mint keypair
 */
export async function createPermanentDelegateMint(
  connection: Connection,
  payer: Keypair,
  delegateAuthority: PublicKey,
): Promise<Keypair> {
  const mintKeypair = Keypair.generate();

  // TODO: Calculate space with PermanentDelegate extension
  // TODO: Get rent-exempt balance
  // TODO: Build transaction:
  //   1. SystemProgram.createAccount
  //   2. createInitializePermanentDelegateInstruction (set the delegate)
  //   3. createInitializeMintInstruction
  // TODO: Send and confirm

  return mintKeypair;
}`,
    solution: `import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
} from '@solana/web3.js';
import {
  TOKEN_2022_PROGRAM_ID,
  ExtensionType,
  getMintLen,
  createInitializeMintInstruction,
  createInitializePermanentDelegateInstruction,
} from '@solana/spl-token';

export async function createPermanentDelegateMint(
  connection: Connection,
  payer: Keypair,
  delegateAuthority: PublicKey,
): Promise<Keypair> {
  const mintKeypair = Keypair.generate();

  const mintSpace = getMintLen([ExtensionType.PermanentDelegate]);
  const lamports = await connection.getMinimumBalanceForRentExemption(mintSpace);

  const transaction = new Transaction().add(
    SystemProgram.createAccount({
      fromPubkey: payer.publicKey,
      newAccountPubkey: mintKeypair.publicKey,
      space: mintSpace,
      lamports,
      programId: TOKEN_2022_PROGRAM_ID,
    }),
    createInitializePermanentDelegateInstruction(
      mintKeypair.publicKey,
      delegateAuthority,
      TOKEN_2022_PROGRAM_ID,
    ),
    createInitializeMintInstruction(
      mintKeypair.publicKey,
      9,
      payer.publicKey,
      null,
      TOKEN_2022_PROGRAM_ID,
    ),
  );

  await connection.sendTransaction(transaction, [payer, mintKeypair]);

  return mintKeypair;
}`,
    testCases: [
      {
        input: 'createPermanentDelegateMint(connection, payer, delegateAuthority.publicKey)',
        expectedOutput: 'PermanentDelegate extension with delegate: <delegateAuthority>',
        description: 'Mint has PermanentDelegate extension with the correct delegate',
      },
      {
        input: 'burnChecked(connection, holderAta, mint, delegateAuthority, 50, 9)',
        expectedOutput: 'Burn successful: holderAta balance reduced by 50',
        description: 'Permanent delegate can burn tokens from any holder account',
      },
      {
        input: 'transferChecked(connection, holderAta, mint, recipientAta, delegateAuthority, 25, 9)',
        expectedOutput: 'Transfer successful via permanent delegate',
        description: 'Permanent delegate can transfer tokens from any holder account',
      },
    ],
    hints: [
      'PermanentDelegate extension type goes in getMintLen to calculate the correct space.',
      'The delegate authority is set at mint creation and cannot be changed afterward.',
      'The permanent delegate can burn or transfer tokens from ANY token account for this mint, regardless of the account owner.',
    ],
    xpReward: 50,
    estimatedMinutes: 12,
  },

  // ── te-004: TransferFee Configuration ── intermediate, typescript, 100xp, 20min
  {
    id: 'te-004',
    title: 'TransferFee Configuration',
    description:
      'Configure a Token-2022 mint with the TransferFee extension. Every transfer automatically withholds a percentage fee in the recipient token account. This enables protocol-level fee collection without smart contract intermediaries.',
    difficulty: 'intermediate',
    category: 'token-extensions',
    language: 'typescript',
    starterCode: `import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
} from '@solana/web3.js';
import {
  TOKEN_2022_PROGRAM_ID,
  ExtensionType,
  getMintLen,
  createInitializeMintInstruction,
  createInitializeTransferFeeConfigInstruction,
} from '@solana/spl-token';

/**
 * Create a Token-2022 mint with transfer fees.
 * @param connection - Solana connection
 * @param payer - Transaction fee payer
 * @param feeAuthority - Authority that can modify fee config
 * @param withdrawAuthority - Authority that can withdraw collected fees
 * @param feeBasisPoints - Fee in basis points (e.g. 250 = 2.5%)
 * @param maxFee - Maximum fee per transfer (in smallest unit)
 * @returns The mint keypair
 */
export async function createTransferFeeMint(
  connection: Connection,
  payer: Keypair,
  feeAuthority: PublicKey,
  withdrawAuthority: PublicKey,
  feeBasisPoints: number,
  maxFee: bigint,
): Promise<Keypair> {
  const mintKeypair = Keypair.generate();

  // TODO: Calculate space with TransferFeeConfig extension
  // TODO: Get rent-exempt balance
  // TODO: Build transaction:
  //   1. SystemProgram.createAccount
  //   2. createInitializeTransferFeeConfigInstruction
  //   3. createInitializeMintInstruction
  // TODO: Send and confirm

  return mintKeypair;
}`,
    solution: `import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
} from '@solana/web3.js';
import {
  TOKEN_2022_PROGRAM_ID,
  ExtensionType,
  getMintLen,
  createInitializeMintInstruction,
  createInitializeTransferFeeConfigInstruction,
} from '@solana/spl-token';

export async function createTransferFeeMint(
  connection: Connection,
  payer: Keypair,
  feeAuthority: PublicKey,
  withdrawAuthority: PublicKey,
  feeBasisPoints: number,
  maxFee: bigint,
): Promise<Keypair> {
  const mintKeypair = Keypair.generate();

  const mintSpace = getMintLen([ExtensionType.TransferFeeConfig]);
  const lamports = await connection.getMinimumBalanceForRentExemption(mintSpace);

  const transaction = new Transaction().add(
    SystemProgram.createAccount({
      fromPubkey: payer.publicKey,
      newAccountPubkey: mintKeypair.publicKey,
      space: mintSpace,
      lamports,
      programId: TOKEN_2022_PROGRAM_ID,
    }),
    createInitializeTransferFeeConfigInstruction(
      mintKeypair.publicKey,
      feeAuthority,
      withdrawAuthority,
      feeBasisPoints,
      maxFee,
      TOKEN_2022_PROGRAM_ID,
    ),
    createInitializeMintInstruction(
      mintKeypair.publicKey,
      9,
      payer.publicKey,
      null,
      TOKEN_2022_PROGRAM_ID,
    ),
  );

  await connection.sendTransaction(transaction, [payer, mintKeypair]);

  return mintKeypair;
}`,
    testCases: [
      {
        input: 'createTransferFeeMint(connection, payer, feeAuth, withdrawAuth, 250, 5000000000n)',
        expectedOutput: 'TransferFeeConfig: feeBasisPoints=250, maxFee=5000000000',
        description: 'Mint has TransferFeeConfig with 2.5% fee and 5 token max',
      },
      {
        input: 'transferChecked(mint, from, to, owner, 1000_000_000_000n, 9)',
        expectedOutput: 'Withheld fee on recipient account: 25_000_000_000',
        description: 'Transfer of 1000 tokens withholds 25 tokens (2.5%) on recipient',
      },
      {
        input: 'createTransferFeeMint(connection, payer, feeAuth, withdrawAuth, 10000, 0n)',
        expectedOutput: 'TransferFeeConfig: feeBasisPoints=10000, maxFee=0',
        description: 'Fee of 100% with maxFee=0 means zero fee is actually charged',
      },
    ],
    hints: [
      'feeBasisPoints uses basis points: 100 = 1%, 250 = 2.5%, 10000 = 100%.',
      'maxFee caps the fee per transfer in the smallest token unit. Setting it to 0 means no fee is ever charged regardless of basis points.',
      'TransferFeeConfig has two authorities: one to update fee parameters, one to withdraw collected fees.',
    ],
    xpReward: 100,
    estimatedMinutes: 20,
  },

  // ── te-005: TransferFee Harvesting ── intermediate, typescript, 100xp, 25min
  {
    id: 'te-005',
    title: 'Harvest Withheld Transfer Fees',
    description:
      'Implement fee harvesting for a TransferFee-enabled Token-2022 mint. Withheld fees accumulate in recipient token accounts and must be harvested (moved to the mint) before withdrawal. Implement both the harvest and withdraw steps.',
    difficulty: 'intermediate',
    category: 'token-extensions',
    language: 'typescript',
    starterCode: `import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
} from '@solana/web3.js';
import {
  TOKEN_2022_PROGRAM_ID,
  createHarvestWithheldTokensToMintInstruction,
  createWithdrawWithheldTokensFromMintInstruction,
} from '@solana/spl-token';

/**
 * Harvest withheld fees from token accounts to the mint,
 * then withdraw them to a destination account.
 * @param connection - Solana connection
 * @param payer - Transaction fee payer
 * @param mint - The transfer-fee mint
 * @param withdrawAuthority - Authority that can withdraw fees
 * @param destinationAta - Where to send the collected fees
 * @param tokenAccountsWithFees - Token accounts holding withheld fees
 */
export async function harvestAndWithdrawFees(
  connection: Connection,
  payer: Keypair,
  mint: PublicKey,
  withdrawAuthority: Keypair,
  destinationAta: PublicKey,
  tokenAccountsWithFees: PublicKey[],
): Promise<void> {
  // TODO: Step 1 - Create harvest instruction to move withheld fees
  //   from token accounts to the mint account
  // TODO: Step 2 - Create withdraw instruction to move accumulated
  //   fees from the mint to the destination ATA
  // TODO: Send both instructions in a single transaction
}`,
    solution: `import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
} from '@solana/web3.js';
import {
  TOKEN_2022_PROGRAM_ID,
  createHarvestWithheldTokensToMintInstruction,
  createWithdrawWithheldTokensFromMintInstruction,
} from '@solana/spl-token';

export async function harvestAndWithdrawFees(
  connection: Connection,
  payer: Keypair,
  mint: PublicKey,
  withdrawAuthority: Keypair,
  destinationAta: PublicKey,
  tokenAccountsWithFees: PublicKey[],
): Promise<void> {
  const harvestIx = createHarvestWithheldTokensToMintInstruction(
    mint,
    tokenAccountsWithFees,
    TOKEN_2022_PROGRAM_ID,
  );

  const withdrawIx = createWithdrawWithheldTokensFromMintInstruction(
    mint,
    destinationAta,
    withdrawAuthority.publicKey,
    [],
    TOKEN_2022_PROGRAM_ID,
  );

  const transaction = new Transaction().add(harvestIx, withdrawIx);

  await connection.sendTransaction(transaction, [payer, withdrawAuthority]);
}`,
    testCases: [
      {
        input: 'harvestAndWithdrawFees(conn, payer, mint, withdrawAuth, destAta, [ata1, ata2])',
        expectedOutput: 'Withheld amounts on ata1 and ata2 reset to 0',
        description: 'Harvest clears withheld fees from all specified token accounts',
      },
      {
        input: 'getAccount(connection, destinationAta, undefined, TOKEN_2022_PROGRAM_ID)',
        expectedOutput: 'destinationAta balance increased by total harvested fees',
        description: 'Withdraw moves accumulated fees to the destination ATA',
      },
      {
        input: 'harvestAndWithdrawFees(conn, payer, mint, wrongAuth, destAta, [ata1])',
        expectedOutput: 'Error: Signature verification failed for withdraw authority',
        description: 'Only the withdraw authority can withdraw fees from the mint',
      },
    ],
    hints: [
      'Harvesting is a two-step process: first move fees from token accounts to the mint, then withdraw from the mint to a destination.',
      'createHarvestWithheldTokensToMintInstruction is permissionless -- anyone can call it. Only the withdraw step requires authority.',
      'Pass an empty array [] as the multiSigners parameter to createWithdrawWithheldTokensFromMintInstruction when using a single signer.',
    ],
    xpReward: 100,
    estimatedMinutes: 25,
  },

  // ── te-006: MintCloseAuthority ── beginner, typescript, 50xp, 10min
  {
    id: 'te-006',
    title: 'MintCloseAuthority Extension',
    description:
      'Create a Token-2022 mint with the MintCloseAuthority extension. By default, SPL Token mints cannot be closed. This extension allows a designated authority to close the mint and reclaim the rent-exempt SOL, provided the supply is zero.',
    difficulty: 'beginner',
    category: 'token-extensions',
    language: 'typescript',
    starterCode: `import {
  Connection,
  Keypair,
  SystemProgram,
  Transaction,
} from '@solana/web3.js';
import {
  TOKEN_2022_PROGRAM_ID,
  ExtensionType,
  getMintLen,
  createInitializeMintInstruction,
  createInitializeMintCloseAuthorityInstruction,
} from '@solana/spl-token';

/**
 * Create a Token-2022 mint that can be closed.
 * @param connection - Solana connection
 * @param payer - Transaction fee payer
 * @returns The mint keypair
 */
export async function createClosableMint(
  connection: Connection,
  payer: Keypair,
): Promise<Keypair> {
  const mintKeypair = Keypair.generate();

  // TODO: Calculate space with MintCloseAuthority extension
  // TODO: Get rent-exempt balance
  // TODO: Build transaction:
  //   1. SystemProgram.createAccount
  //   2. createInitializeMintCloseAuthorityInstruction (payer as close authority)
  //   3. createInitializeMintInstruction
  // TODO: Send and confirm

  return mintKeypair;
}`,
    solution: `import {
  Connection,
  Keypair,
  SystemProgram,
  Transaction,
} from '@solana/web3.js';
import {
  TOKEN_2022_PROGRAM_ID,
  ExtensionType,
  getMintLen,
  createInitializeMintInstruction,
  createInitializeMintCloseAuthorityInstruction,
} from '@solana/spl-token';

export async function createClosableMint(
  connection: Connection,
  payer: Keypair,
): Promise<Keypair> {
  const mintKeypair = Keypair.generate();

  const mintSpace = getMintLen([ExtensionType.MintCloseAuthority]);
  const lamports = await connection.getMinimumBalanceForRentExemption(mintSpace);

  const transaction = new Transaction().add(
    SystemProgram.createAccount({
      fromPubkey: payer.publicKey,
      newAccountPubkey: mintKeypair.publicKey,
      space: mintSpace,
      lamports,
      programId: TOKEN_2022_PROGRAM_ID,
    }),
    createInitializeMintCloseAuthorityInstruction(
      mintKeypair.publicKey,
      payer.publicKey,
      TOKEN_2022_PROGRAM_ID,
    ),
    createInitializeMintInstruction(
      mintKeypair.publicKey,
      9,
      payer.publicKey,
      null,
      TOKEN_2022_PROGRAM_ID,
    ),
  );

  await connection.sendTransaction(transaction, [payer, mintKeypair]);

  return mintKeypair;
}`,
    testCases: [
      {
        input: 'createClosableMint(connection, payer)',
        expectedOutput: 'MintCloseAuthority extension present, closeAuthority: <payer>',
        description: 'Mint has MintCloseAuthority with payer as the close authority',
      },
      {
        input: 'closeAccount(connection, mint, destination, closeAuthority, [], TOKEN_2022_PROGRAM_ID)',
        expectedOutput: 'Mint account closed, rent reclaimed to destination',
        description: 'Close authority can close the mint when supply is 0',
      },
      {
        input: 'closeAccount(connection, mintWithSupply, dest, auth, [], TOKEN_2022_PROGRAM_ID)',
        expectedOutput: 'Error: Account has non-zero supply',
        description: 'Cannot close a mint that still has outstanding supply',
      },
    ],
    hints: [
      'Without MintCloseAuthority, mint accounts can never be closed and their SOL is locked forever.',
      'The close authority must be set before the mint is initialized.',
      'You can only close a mint if the total supply is zero -- burn all tokens first.',
    ],
    xpReward: 50,
    estimatedMinutes: 10,
  },

  // ── te-007: DefaultAccountState ── beginner, rust, 50xp, 15min
  {
    id: 'te-007',
    title: 'DefaultAccountState Extension',
    description:
      'Implement a Token-2022 mint with DefaultAccountState set to Frozen in Rust. Every new token account created for this mint will start frozen, requiring an explicit thaw from the freeze authority before tokens can be transferred. This is useful for KYC-gated tokens.',
    difficulty: 'beginner',
    category: 'token-extensions',
    language: 'rust',
    starterCode: `use anchor_lang::prelude::*;
use anchor_spl::token_2022;
use anchor_spl::token_interface::{
    Mint, TokenInterface,
    token2022::instruction::initialize_default_account_state,
};
use spl_token_2022::state::AccountState;

#[derive(Accounts)]
pub struct CreateFrozenMint<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    /// CHECK: Validated in instruction
    #[account(mut)]
    pub mint: Signer<'info>,
    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
}

pub fn create_frozen_default_mint(ctx: Context<CreateFrozenMint>) -> Result<()> {
    // TODO: Calculate mint space with DefaultAccountState extension
    // TODO: Create account via CPI to system_program
    // TODO: Initialize DefaultAccountState to Frozen via CPI
    // TODO: Initialize the mint with freeze_authority set to payer
    // Hint: Extension init must come before mint init

    Ok(())
}`,
    solution: `use anchor_lang::prelude::*;
use anchor_lang::solana_program::program::invoke;
use anchor_spl::token_2022;
use anchor_spl::token_interface::{
    Mint, TokenInterface,
};
use spl_token_2022::{
    extension::ExtensionType,
    instruction::{initialize_default_account_state, initialize_mint},
    state::AccountState,
};

#[derive(Accounts)]
pub struct CreateFrozenMint<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    /// CHECK: Validated in instruction
    #[account(mut)]
    pub mint: Signer<'info>,
    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
}

pub fn create_frozen_default_mint(ctx: Context<CreateFrozenMint>) -> Result<()> {
    let mint_size = ExtensionType::try_calculate_account_len::<spl_token_2022::state::Mint>(
        &[ExtensionType::DefaultAccountState],
    )?;
    let lamports = Rent::get()?.minimum_balance(mint_size);

    anchor_lang::system_program::create_account(
        CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            anchor_lang::system_program::CreateAccount {
                from: ctx.accounts.payer.to_account_info(),
                to: ctx.accounts.mint.to_account_info(),
            },
        ),
        lamports,
        mint_size as u64,
        ctx.accounts.token_program.key,
    )?;

    invoke(
        &initialize_default_account_state(
            ctx.accounts.token_program.key,
            ctx.accounts.mint.key,
            &AccountState::Frozen,
        )?,
        &[ctx.accounts.mint.to_account_info()],
    )?;

    invoke(
        &initialize_mint(
            ctx.accounts.token_program.key,
            ctx.accounts.mint.key,
            ctx.accounts.payer.key,
            Some(ctx.accounts.payer.key),
            9,
        )?,
        &[ctx.accounts.mint.to_account_info()],
    )?;

    Ok(())
}`,
    testCases: [
      {
        input: 'create_frozen_default_mint(ctx)',
        expectedOutput: 'DefaultAccountState: Frozen on mint',
        description: 'Mint has DefaultAccountState extension set to Frozen',
      },
      {
        input: 'create_associated_token_account(payer, owner, mint, TOKEN_2022_PROGRAM_ID)',
        expectedOutput: 'New token account state: Frozen',
        description: 'Newly created token accounts start in Frozen state',
      },
      {
        input: 'thaw_account(mint, frozenAta, freezeAuthority, [], TOKEN_2022_PROGRAM_ID)',
        expectedOutput: 'Account state changed to Initialized (unfrozen)',
        description: 'Freeze authority can thaw individual accounts for KYC-approved users',
      },
    ],
    hints: [
      'Use ExtensionType::try_calculate_account_len to get the correct size for the mint account.',
      'DefaultAccountState must be initialized BEFORE the mint itself -- order matters in the instruction sequence.',
      'A freeze_authority must be set on the mint for DefaultAccountState to work, otherwise accounts cannot be thawed.',
    ],
    xpReward: 50,
    estimatedMinutes: 15,
  },

  // ── te-008: ImmutableOwner ── beginner, typescript, 50xp, 10min
  {
    id: 'te-008',
    title: 'ImmutableOwner Extension',
    description:
      'Create a token account with the ImmutableOwner extension. This prevents the owner of a token account from being reassigned, protecting against a class of token account hijacking attacks. Note: Associated Token Accounts (ATAs) for Token-2022 already include this extension by default.',
    difficulty: 'beginner',
    category: 'token-extensions',
    language: 'typescript',
    starterCode: `import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
} from '@solana/web3.js';
import {
  TOKEN_2022_PROGRAM_ID,
  ExtensionType,
  getAccountLen,
  createInitializeAccountInstruction,
  createInitializeImmutableOwnerInstruction,
} from '@solana/spl-token';

/**
 * Create a token account with ImmutableOwner extension.
 * @param connection - Solana connection
 * @param payer - Transaction fee payer
 * @param mint - The token mint
 * @param owner - The token account owner
 * @returns The token account keypair
 */
export async function createImmutableOwnerAccount(
  connection: Connection,
  payer: Keypair,
  mint: PublicKey,
  owner: PublicKey,
): Promise<Keypair> {
  const tokenAccountKeypair = Keypair.generate();

  // TODO: Calculate space with ImmutableOwner extension
  // TODO: Get rent-exempt balance
  // TODO: Build transaction:
  //   1. SystemProgram.createAccount (owner = TOKEN_2022_PROGRAM_ID)
  //   2. createInitializeImmutableOwnerInstruction
  //   3. createInitializeAccountInstruction
  // TODO: Send and confirm

  return tokenAccountKeypair;
}`,
    solution: `import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
} from '@solana/web3.js';
import {
  TOKEN_2022_PROGRAM_ID,
  ExtensionType,
  getAccountLen,
  createInitializeAccountInstruction,
  createInitializeImmutableOwnerInstruction,
} from '@solana/spl-token';

export async function createImmutableOwnerAccount(
  connection: Connection,
  payer: Keypair,
  mint: PublicKey,
  owner: PublicKey,
): Promise<Keypair> {
  const tokenAccountKeypair = Keypair.generate();

  const accountSpace = getAccountLen([ExtensionType.ImmutableOwner]);
  const lamports = await connection.getMinimumBalanceForRentExemption(accountSpace);

  const transaction = new Transaction().add(
    SystemProgram.createAccount({
      fromPubkey: payer.publicKey,
      newAccountPubkey: tokenAccountKeypair.publicKey,
      space: accountSpace,
      lamports,
      programId: TOKEN_2022_PROGRAM_ID,
    }),
    createInitializeImmutableOwnerInstruction(
      tokenAccountKeypair.publicKey,
      TOKEN_2022_PROGRAM_ID,
    ),
    createInitializeAccountInstruction(
      tokenAccountKeypair.publicKey,
      mint,
      owner,
      TOKEN_2022_PROGRAM_ID,
    ),
  );

  await connection.sendTransaction(transaction, [payer, tokenAccountKeypair]);

  return tokenAccountKeypair;
}`,
    testCases: [
      {
        input: 'createImmutableOwnerAccount(connection, payer, mint, owner.publicKey)',
        expectedOutput: 'ImmutableOwner extension present on token account',
        description: 'Token account has the ImmutableOwner extension',
      },
      {
        input: 'setAuthority(connection, tokenAccount, owner, AuthorityType.AccountOwner, newOwner)',
        expectedOutput: 'Error: Cannot reassign owner of immutable owner account',
        description: 'Owner reassignment is rejected for immutable owner accounts',
      },
      {
        input: 'getAccount(connection, tokenAccountKeypair.publicKey, undefined, TOKEN_2022_PROGRAM_ID)',
        expectedOutput: 'owner: <owner>, isInitialized: true',
        description: 'Token account is properly initialized with the correct owner',
      },
    ],
    hints: [
      'Use getAccountLen (not getMintLen) since ImmutableOwner is a token-account-level extension.',
      'ImmutableOwner initialization must come before the account initialization instruction.',
      'ATAs created via createAssociatedTokenAccountInstruction for Token-2022 include ImmutableOwner automatically.',
    ],
    xpReward: 50,
    estimatedMinutes: 10,
  },

  // ── te-009: MemoTransfer Requirement ── intermediate, typescript, 100xp, 20min
  {
    id: 'te-009',
    title: 'MemoTransfer Requirement',
    description:
      'Create a token account with the MemoTransfer extension enabled. When enabled, all incoming transfers to this account require a preceding memo instruction in the same transaction. This is useful for compliance, exchange deposits, and audit trails.',
    difficulty: 'intermediate',
    category: 'token-extensions',
    language: 'typescript',
    starterCode: `import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js';
import {
  TOKEN_2022_PROGRAM_ID,
  ExtensionType,
  getAccountLen,
  createInitializeAccountInstruction,
  createInitializeImmutableOwnerInstruction,
  createEnableRequiredMemoTransfersInstruction,
} from '@solana/spl-token';

const MEMO_PROGRAM_ID = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');

/**
 * Create a token account that requires memo on incoming transfers,
 * then perform a transfer with a memo.
 */
export async function createMemoRequiredAccount(
  connection: Connection,
  payer: Keypair,
  mint: PublicKey,
  owner: Keypair,
): Promise<Keypair> {
  const tokenAccountKeypair = Keypair.generate();

  // TODO: Calculate space with ImmutableOwner + MemoTransfer extensions
  // TODO: Build transaction to create and initialize the account
  // TODO: After init, enable required memo transfers (needs owner signature)
  // Hint: MemoTransfer can only be enabled AFTER the account is initialized

  return tokenAccountKeypair;
}

/**
 * Build a memo instruction.
 */
export function createMemoInstruction(memo: string, signer: PublicKey): TransactionInstruction {
  // TODO: Create an instruction for the Memo program
  // The memo text is the instruction data, signer is in the accounts
  throw new Error('Not implemented');
}`,
    solution: `import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js';
import {
  TOKEN_2022_PROGRAM_ID,
  ExtensionType,
  getAccountLen,
  createInitializeAccountInstruction,
  createInitializeImmutableOwnerInstruction,
  createEnableRequiredMemoTransfersInstruction,
} from '@solana/spl-token';

const MEMO_PROGRAM_ID = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');

export async function createMemoRequiredAccount(
  connection: Connection,
  payer: Keypair,
  mint: PublicKey,
  owner: Keypair,
): Promise<Keypair> {
  const tokenAccountKeypair = Keypair.generate();

  const accountSpace = getAccountLen([
    ExtensionType.ImmutableOwner,
    ExtensionType.MemoTransfer,
  ]);
  const lamports = await connection.getMinimumBalanceForRentExemption(accountSpace);

  const createAndInitTx = new Transaction().add(
    SystemProgram.createAccount({
      fromPubkey: payer.publicKey,
      newAccountPubkey: tokenAccountKeypair.publicKey,
      space: accountSpace,
      lamports,
      programId: TOKEN_2022_PROGRAM_ID,
    }),
    createInitializeImmutableOwnerInstruction(
      tokenAccountKeypair.publicKey,
      TOKEN_2022_PROGRAM_ID,
    ),
    createInitializeAccountInstruction(
      tokenAccountKeypair.publicKey,
      mint,
      owner.publicKey,
      TOKEN_2022_PROGRAM_ID,
    ),
    createEnableRequiredMemoTransfersInstruction(
      tokenAccountKeypair.publicKey,
      owner.publicKey,
      [],
      TOKEN_2022_PROGRAM_ID,
    ),
  );

  await connection.sendTransaction(createAndInitTx, [payer, tokenAccountKeypair, owner]);

  return tokenAccountKeypair;
}

export function createMemoInstruction(memo: string, signer: PublicKey): TransactionInstruction {
  return new TransactionInstruction({
    programId: MEMO_PROGRAM_ID,
    keys: [{ pubkey: signer, isSigner: true, isWritable: false }],
    data: Buffer.from(memo, 'utf-8'),
  });
}`,
    testCases: [
      {
        input: 'createMemoRequiredAccount(connection, payer, mint, owner)',
        expectedOutput: 'MemoTransfer extension enabled, requireIncomingMemos: true',
        description: 'Token account requires memo on all incoming transfers',
      },
      {
        input: 'transferChecked(mint, from, memoRequiredAta, sender, 100, 9) // no memo',
        expectedOutput: 'Error: Transfer requires a preceding memo instruction',
        description: 'Transfer without memo fails when MemoTransfer is enabled',
      },
      {
        input: '[memoIx("deposit-ref-123", sender), transferIx(from, memoRequiredAta, 100)]',
        expectedOutput: 'Transfer successful with memo: deposit-ref-123',
        description: 'Transfer succeeds when preceded by a memo instruction',
      },
    ],
    hints: [
      'MemoTransfer is enabled/disabled AFTER account initialization -- it is a post-init toggle, not an init-time config.',
      'The memo instruction must appear BEFORE the transfer instruction in the same transaction.',
      'Include ImmutableOwner when calculating account space -- it is best practice for all Token-2022 accounts.',
    ],
    xpReward: 100,
    estimatedMinutes: 20,
  },

  // ── te-010: InterestBearing Mint ── intermediate, typescript, 100xp, 25min
  {
    id: 'te-010',
    title: 'InterestBearing Token Mint',
    description:
      'Create a Token-2022 mint with the InterestBearingConfig extension. This extension allows the UI display amount to grow over time based on a configurable interest rate, without actually minting new tokens. The on-chain balance stays constant but the "amount to UI amount" conversion factors in accrued interest.',
    difficulty: 'intermediate',
    category: 'token-extensions',
    language: 'typescript',
    starterCode: `import {
  Connection,
  Keypair,
  SystemProgram,
  Transaction,
} from '@solana/web3.js';
import {
  TOKEN_2022_PROGRAM_ID,
  ExtensionType,
  getMintLen,
  createInitializeMintInstruction,
  createInitializeInterestBearingMintInstruction,
  createAmountToUiAmountInstruction,
} from '@solana/spl-token';

/**
 * Create an interest-bearing Token-2022 mint.
 * @param connection - Solana connection
 * @param payer - Transaction fee payer
 * @param rate - Interest rate in basis points (e.g. 500 = 5%)
 * @returns The mint keypair
 */
export async function createInterestBearingMint(
  connection: Connection,
  payer: Keypair,
  rate: number,
): Promise<Keypair> {
  const mintKeypair = Keypair.generate();

  // TODO: Calculate space with InterestBearingConfig extension
  // TODO: Get rent-exempt balance
  // TODO: Build transaction:
  //   1. SystemProgram.createAccount
  //   2. createInitializeInterestBearingMintInstruction (payer as rate authority)
  //   3. createInitializeMintInstruction
  // TODO: Send and confirm

  return mintKeypair;
}

/**
 * Get the UI amount with accrued interest for a given raw amount.
 */
export async function getUiAmountWithInterest(
  connection: Connection,
  mint: Keypair,
  rawAmount: bigint,
): Promise<string> {
  // TODO: Use amountToUiAmount to calculate the display amount
  //   that includes accrued interest
  // TODO: Simulate the transaction and parse the return data
  throw new Error('Not implemented');
}`,
    solution: `import {
  Connection,
  Keypair,
  SystemProgram,
  Transaction,
} from '@solana/web3.js';
import {
  TOKEN_2022_PROGRAM_ID,
  ExtensionType,
  getMintLen,
  createInitializeMintInstruction,
  createInitializeInterestBearingMintInstruction,
  createAmountToUiAmountInstruction,
} from '@solana/spl-token';

export async function createInterestBearingMint(
  connection: Connection,
  payer: Keypair,
  rate: number,
): Promise<Keypair> {
  const mintKeypair = Keypair.generate();

  const mintSpace = getMintLen([ExtensionType.InterestBearingConfig]);
  const lamports = await connection.getMinimumBalanceForRentExemption(mintSpace);

  const transaction = new Transaction().add(
    SystemProgram.createAccount({
      fromPubkey: payer.publicKey,
      newAccountPubkey: mintKeypair.publicKey,
      space: mintSpace,
      lamports,
      programId: TOKEN_2022_PROGRAM_ID,
    }),
    createInitializeInterestBearingMintInstruction(
      mintKeypair.publicKey,
      payer.publicKey,
      rate,
      TOKEN_2022_PROGRAM_ID,
    ),
    createInitializeMintInstruction(
      mintKeypair.publicKey,
      9,
      payer.publicKey,
      null,
      TOKEN_2022_PROGRAM_ID,
    ),
  );

  await connection.sendTransaction(transaction, [payer, mintKeypair]);

  return mintKeypair;
}

export async function getUiAmountWithInterest(
  connection: Connection,
  mint: Keypair,
  rawAmount: bigint,
): Promise<string> {
  const ix = createAmountToUiAmountInstruction(
    mint.publicKey,
    rawAmount,
    TOKEN_2022_PROGRAM_ID,
  );

  const tx = new Transaction().add(ix);
  tx.feePayer = mint.publicKey;
  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

  const simulation = await connection.simulateTransaction(tx);
  const returnData = simulation.value.returnData;

  if (!returnData) {
    throw new Error('No return data from simulation');
  }

  return Buffer.from(returnData.data[0], returnData.data[1] as BufferEncoding).toString('utf-8');
}`,
    testCases: [
      {
        input: 'createInterestBearingMint(connection, payer, 500)',
        expectedOutput: 'InterestBearingConfig: rate=500, rateAuthority=<payer>',
        description: 'Mint has InterestBearingConfig extension with 5% rate',
      },
      {
        input: 'getUiAmountWithInterest(connection, mint, 1_000_000_000n) // at t=0',
        expectedOutput: '1.0 (no interest accrued yet)',
        description: 'At creation time UI amount equals raw amount (no interest yet)',
      },
      {
        input: 'updateRateInterestBearingMint(conn, mint, rateAuth, 1000) // change to 10%',
        expectedOutput: 'InterestBearingConfig: rate updated to 1000',
        description: 'Rate authority can update the interest rate',
      },
    ],
    hints: [
      'Interest is purely cosmetic -- the on-chain raw balance never changes. Only the amountToUiAmount conversion reflects interest.',
      'The rate is in basis points: 500 = 5% annual. The rate authority can update it anytime.',
      'Use simulateTransaction with createAmountToUiAmountInstruction to compute the UI amount off-chain.',
    ],
    xpReward: 100,
    estimatedMinutes: 25,
  },

  // ── te-011: ConfidentialTransfer Basics ── advanced, typescript, 200xp, 40min
  {
    id: 'te-011',
    title: 'ConfidentialTransfer Basics',
    description:
      'Set up a Token-2022 mint with the ConfidentialTransfer extension. This extension enables encrypted token balances using zero-knowledge proofs (ElGamal encryption). Configure the mint, prepare a token account for confidential transfers, and deposit tokens into the confidential balance.',
    difficulty: 'advanced',
    category: 'token-extensions',
    language: 'typescript',
    starterCode: `import {
  Connection,
  Keypair,
  SystemProgram,
  Transaction,
} from '@solana/web3.js';
import {
  TOKEN_2022_PROGRAM_ID,
  ExtensionType,
  getMintLen,
  createInitializeMintInstruction,
} from '@solana/spl-token';

/**
 * Create a Token-2022 mint configured for confidential transfers.
 *
 * Steps:
 * 1. Create the mint account with ConfidentialTransferMint extension space
 * 2. Initialize ConfidentialTransferMint with an auto-approve policy
 * 3. Initialize the mint itself
 *
 * @param connection - Solana connection
 * @param payer - Transaction fee payer
 * @param authority - Confidential transfer authority
 * @returns The mint keypair
 */
export async function createConfidentialMint(
  connection: Connection,
  payer: Keypair,
  authority: Keypair,
): Promise<Keypair> {
  const mintKeypair = Keypair.generate();

  // TODO: Calculate space with ConfidentialTransferMint extension
  // TODO: Create account and initialize ConfidentialTransferMint
  //   with autoApproveNewAccounts = true so accounts don't need
  //   manual approval for confidential transfers
  // TODO: Initialize the mint
  // NOTE: ConfidentialTransfer requires the confidential-transfer
  //   feature of spl-token-2022. The ElGamal keypair generation
  //   and proof creation happen client-side.

  return mintKeypair;
}

/**
 * Configure a token account for confidential transfers.
 * This involves generating an ElGamal keypair for the account
 * and submitting the configure instruction.
 */
export async function configureConfidentialAccount(
  connection: Connection,
  payer: Keypair,
  mint: Keypair,
  owner: Keypair,
): Promise<void> {
  // TODO: Get or create the associated token account
  // TODO: Generate ElGamal keypair for the owner
  // TODO: Create and submit ConfigureAccount instruction
  //   with the ElGamal public key and decryptable zero balance
  throw new Error('Not implemented');
}`,
    solution: `import {
  Connection,
  Keypair,
  SystemProgram,
  Transaction,
} from '@solana/web3.js';
import {
  TOKEN_2022_PROGRAM_ID,
  ExtensionType,
  getMintLen,
  createInitializeMintInstruction,
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddressSync,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from '@solana/spl-token';

/*
 * Note: Full ConfidentialTransfer implementation requires the
 * @solana/spl-token-confidential-transfers package for ElGamal
 * keypair generation and proof creation. This solution shows
 * the mint setup and account structure.
 */

export async function createConfidentialMint(
  connection: Connection,
  payer: Keypair,
  authority: Keypair,
): Promise<Keypair> {
  const mintKeypair = Keypair.generate();

  const extensions = [ExtensionType.ConfidentialTransferMint];
  const mintSpace = getMintLen(extensions);
  const lamports = await connection.getMinimumBalanceForRentExemption(mintSpace);

  /*
   * ConfidentialTransferMint initialization requires:
   * - authority: can approve/reject confidential transfer accounts
   * - autoApproveNewAccounts: if true, skip manual approval
   * - auditorElGamalPubkey: optional auditor key (null for no auditor)
   */
  const transaction = new Transaction().add(
    SystemProgram.createAccount({
      fromPubkey: payer.publicKey,
      newAccountPubkey: mintKeypair.publicKey,
      space: mintSpace,
      lamports,
      programId: TOKEN_2022_PROGRAM_ID,
    }),
    // In production, use createInitializeConfidentialTransferMintInstruction
    // from @solana/spl-token with:
    //   mint, authority.publicKey, autoApproveNewAccounts=true, auditorElGamalPubkey=null
    createInitializeMintInstruction(
      mintKeypair.publicKey,
      9,
      payer.publicKey,
      null,
      TOKEN_2022_PROGRAM_ID,
    ),
  );

  await connection.sendTransaction(transaction, [payer, mintKeypair]);

  return mintKeypair;
}

export async function configureConfidentialAccount(
  connection: Connection,
  payer: Keypair,
  mint: Keypair,
  owner: Keypair,
): Promise<void> {
  const ata = getAssociatedTokenAddressSync(
    mint.publicKey,
    owner.publicKey,
    false,
    TOKEN_2022_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID,
  );

  const createAtaTx = new Transaction().add(
    createAssociatedTokenAccountInstruction(
      payer.publicKey,
      ata,
      owner.publicKey,
      mint.publicKey,
      TOKEN_2022_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID,
    ),
  );

  await connection.sendTransaction(createAtaTx, [payer]);

  /*
   * In production, the next steps are:
   * 1. Generate ElGamal keypair: ElGamalKeypair.create(owner)
   * 2. Create ConfigureAccount instruction with:
   *    - the token account address
   *    - the ElGamal public key
   *    - a decryptable zero balance (AES-encrypted zero)
   *    - proofInstructionOffset for range proof
   * 3. Submit the configure transaction signed by owner
   */
}`,
    testCases: [
      {
        input: 'createConfidentialMint(connection, payer, authority)',
        expectedOutput: 'ConfidentialTransferMint extension present, autoApprove: true',
        description: 'Mint has ConfidentialTransferMint with auto-approve enabled',
      },
      {
        input: 'configureConfidentialAccount(connection, payer, mint, owner)',
        expectedOutput: 'ConfidentialTransferAccount configured with ElGamal pubkey',
        description: 'Token account is configured for confidential transfers',
      },
      {
        input: 'confidentialTransfer(mint, from, to, owner, 1000, proof)',
        expectedOutput: 'Encrypted balance updated, public balance unchanged',
        description: 'Confidential transfer updates encrypted balance without revealing amount',
      },
    ],
    hints: [
      'ConfidentialTransfer uses ElGamal encryption for balances. Each token account needs its own ElGamal keypair.',
      'autoApproveNewAccounts=true means any account can configure for confidential transfers without authority approval.',
      'Token accounts have both a public balance and an encrypted (pending/available) balance. Use deposit/apply to move between them.',
    ],
    xpReward: 200,
    estimatedMinutes: 40,
  },

  // ── te-012: TransferHook Implementation ── advanced, rust, 200xp, 45min
  {
    id: 'te-012',
    title: 'TransferHook Program',
    description:
      'Implement a TransferHook program in Rust that is invoked automatically on every token transfer. The hook validates custom conditions (e.g., allowlist check) and can reject transfers. Includes the mint setup with TransferHook extension pointing to your program.',
    difficulty: 'advanced',
    category: 'token-extensions',
    language: 'rust',
    starterCode: `use anchor_lang::prelude::*;
use anchor_spl::token_interface;
use spl_transfer_hook_interface::instruction::TransferHookInstruction;

declare_id!("Hook111111111111111111111111111111111111111");

#[program]
pub mod transfer_hook {
    use super::*;

    /// The transfer hook handler -- called automatically on every transfer.
    /// Validate that the transfer is allowed (e.g., check allowlist).
    pub fn transfer_hook(ctx: Context<TransferHookAccounts>, amount: u64) -> Result<()> {
        // TODO: Read the allowlist account data
        // TODO: Check if the destination wallet is in the allowlist
        // TODO: If not allowed, return an error
        // TODO: If allowed, return Ok(())

        Ok(())
    }

    /// Initialize the allowlist account with approved wallets.
    pub fn initialize_allowlist(
        ctx: Context<InitializeAllowlist>,
        allowed_wallets: Vec<Pubkey>,
    ) -> Result<()> {
        // TODO: Store the allowed wallets in the allowlist PDA
        // TODO: Set the authority who can update the list

        Ok(())
    }
}

#[derive(Accounts)]
pub struct TransferHookAccounts<'info> {
    // TODO: Define the required accounts for the transfer hook
    // The interface expects specific accounts in a specific order:
    //   1. source token account
    //   2. mint
    //   3. destination token account
    //   4. source authority/delegate
    //   5. extra account metas PDA
    //   6+. additional accounts (your allowlist PDA)
}

#[derive(Accounts)]
pub struct InitializeAllowlist<'info> {
    // TODO: Define accounts for allowlist initialization
}

#[account]
pub struct Allowlist {
    pub authority: Pubkey,
    pub wallets: Vec<Pubkey>,
}`,
    solution: `use anchor_lang::prelude::*;
use anchor_spl::token_interface;
use spl_transfer_hook_interface::instruction::TransferHookInstruction;

declare_id!("Hook111111111111111111111111111111111111111");

#[program]
pub mod transfer_hook {
    use super::*;

    pub fn transfer_hook(ctx: Context<TransferHookAccounts>, amount: u64) -> Result<()> {
        let allowlist = &ctx.accounts.allowlist;
        let destination_owner = ctx.accounts.destination.owner;

        require!(
            allowlist.wallets.contains(&destination_owner),
            TransferHookError::DestinationNotAllowed
        );

        msg!(
            "TransferHook: {} tokens to allowed destination {}",
            amount,
            destination_owner
        );

        Ok(())
    }

    pub fn initialize_allowlist(
        ctx: Context<InitializeAllowlist>,
        allowed_wallets: Vec<Pubkey>,
    ) -> Result<()> {
        let allowlist = &mut ctx.accounts.allowlist;
        allowlist.authority = ctx.accounts.authority.key();
        allowlist.wallets = allowed_wallets;

        Ok(())
    }

    /// Required by the TransferHook interface -- initializes the
    /// ExtraAccountMetas account that tells Token-2022 which
    /// additional accounts to pass to the hook.
    pub fn initialize_extra_account_meta_list(
        ctx: Context<InitializeExtraAccountMetas>,
    ) -> Result<()> {
        // In production: use ExtraAccountMetaList::init to write
        // the allowlist PDA as an extra account meta
        Ok(())
    }
}

#[derive(Accounts)]
pub struct TransferHookAccounts<'info> {
    /// CHECK: Token account validated by Token-2022
    pub source: AccountInfo<'info>,
    pub mint: InterfaceAccount<'info, token_interface::Mint>,
    /// CHECK: Token account validated by Token-2022
    pub destination: AccountInfo<'info>,
    /// CHECK: Source authority validated by Token-2022
    pub authority: AccountInfo<'info>,
    /// CHECK: PDA validated by seed derivation
    #[account(
        seeds = [b"extra-account-metas", mint.key().as_ref()],
        bump,
    )]
    pub extra_account_meta_list: AccountInfo<'info>,
    #[account(
        seeds = [b"allowlist", mint.key().as_ref()],
        bump,
    )]
    pub allowlist: Account<'info, Allowlist>,
}

#[derive(Accounts)]
pub struct InitializeAllowlist<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        init,
        payer = authority,
        space = 8 + 32 + 4 + (32 * 50),
        seeds = [b"allowlist", mint.key().as_ref()],
        bump,
    )]
    pub allowlist: Account<'info, Allowlist>,
    pub mint: InterfaceAccount<'info, token_interface::Mint>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct InitializeExtraAccountMetas<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    /// CHECK: Written to by ExtraAccountMetaList::init
    #[account(mut)]
    pub extra_account_meta_list: AccountInfo<'info>,
    pub mint: InterfaceAccount<'info, token_interface::Mint>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct Allowlist {
    pub authority: Pubkey,
    pub wallets: Vec<Pubkey>,
}

#[error_code]
pub enum TransferHookError {
    #[msg("Destination wallet is not on the allowlist")]
    DestinationNotAllowed,
}`,
    testCases: [
      {
        input: 'transfer_hook(ctx, 1000) where destination owner is in allowlist',
        expectedOutput: 'Ok(()) -- transfer proceeds',
        description: 'Transfer to an allowlisted wallet succeeds',
      },
      {
        input: 'transfer_hook(ctx, 1000) where destination owner is NOT in allowlist',
        expectedOutput: 'Error: DestinationNotAllowed',
        description: 'Transfer to a non-allowlisted wallet is rejected by the hook',
      },
      {
        input: 'initialize_allowlist(ctx, [wallet_a, wallet_b, wallet_c])',
        expectedOutput: 'Allowlist PDA created with 3 wallets and authority set',
        description: 'Allowlist is initialized with the provided wallets',
      },
    ],
    hints: [
      'TransferHook programs must implement the spl-transfer-hook-interface. The execute (transfer_hook) function signature is fixed.',
      'The ExtraAccountMetas PDA tells Token-2022 which additional accounts your hook needs. Initialize it before any transfers.',
      'Account ordering in TransferHookAccounts must match the interface: source, mint, destination, authority, extra_account_metas, then your custom accounts.',
    ],
    xpReward: 200,
    estimatedMinutes: 45,
  },

  // ── te-013: CPI Guard Configuration ── intermediate, typescript, 100xp, 20min
  {
    id: 'te-013',
    title: 'CPI Guard Configuration',
    description:
      'Enable the CPI Guard extension on a Token-2022 token account. When enabled, CPI Guard prevents certain dangerous actions from being performed via Cross-Program Invocations (CPIs), such as transferring tokens or closing the account through a malicious program. This protects users from CPI-based exploits.',
    difficulty: 'intermediate',
    category: 'token-extensions',
    language: 'typescript',
    starterCode: `import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
} from '@solana/web3.js';
import {
  TOKEN_2022_PROGRAM_ID,
  ExtensionType,
  getAccountLen,
  createEnableCpiGuardInstruction,
  createDisableCpiGuardInstruction,
  getAccount,
} from '@solana/spl-token';

/**
 * Enable CPI Guard on an existing Token-2022 token account.
 * The account must already have space allocated for the CpiGuard extension.
 *
 * @param connection - Solana connection
 * @param payer - Transaction fee payer
 * @param tokenAccount - The token account to protect
 * @param owner - The token account owner (must sign)
 */
export async function enableCpiGuard(
  connection: Connection,
  payer: Keypair,
  tokenAccount: PublicKey,
  owner: Keypair,
): Promise<void> {
  // TODO: Create an EnableCpiGuard instruction
  // TODO: Build and send the transaction (needs owner signature)
}

/**
 * Disable CPI Guard on a Token-2022 token account.
 * Only the account owner can disable it.
 */
export async function disableCpiGuard(
  connection: Connection,
  payer: Keypair,
  tokenAccount: PublicKey,
  owner: Keypair,
): Promise<void> {
  // TODO: Create a DisableCpiGuard instruction
  // TODO: Build and send the transaction
}

/**
 * Check if CPI Guard is enabled on a token account.
 */
export async function isCpiGuardEnabled(
  connection: Connection,
  tokenAccount: PublicKey,
): Promise<boolean> {
  // TODO: Fetch the account and check the CpiGuard extension state
  throw new Error('Not implemented');
}`,
    solution: `import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
} from '@solana/web3.js';
import {
  TOKEN_2022_PROGRAM_ID,
  ExtensionType,
  getAccountLen,
  createEnableCpiGuardInstruction,
  createDisableCpiGuardInstruction,
  getAccount,
  getExtensionData,
} from '@solana/spl-token';
import { CpiGuardLayout } from '@solana/spl-token';

export async function enableCpiGuard(
  connection: Connection,
  payer: Keypair,
  tokenAccount: PublicKey,
  owner: Keypair,
): Promise<void> {
  const ix = createEnableCpiGuardInstruction(
    tokenAccount,
    owner.publicKey,
    [],
    TOKEN_2022_PROGRAM_ID,
  );

  const transaction = new Transaction().add(ix);
  await connection.sendTransaction(transaction, [payer, owner]);
}

export async function disableCpiGuard(
  connection: Connection,
  payer: Keypair,
  tokenAccount: PublicKey,
  owner: Keypair,
): Promise<void> {
  const ix = createDisableCpiGuardInstruction(
    tokenAccount,
    owner.publicKey,
    [],
    TOKEN_2022_PROGRAM_ID,
  );

  const transaction = new Transaction().add(ix);
  await connection.sendTransaction(transaction, [payer, owner]);
}

export async function isCpiGuardEnabled(
  connection: Connection,
  tokenAccount: PublicKey,
): Promise<boolean> {
  const account = await getAccount(
    connection,
    tokenAccount,
    undefined,
    TOKEN_2022_PROGRAM_ID,
  );

  const extensionData = getExtensionData(
    ExtensionType.CpiGuard,
    account.tlvData,
  );

  if (!extensionData) {
    return false;
  }

  const cpiGuard = CpiGuardLayout.decode(extensionData);
  return cpiGuard.lockCpi;
}`,
    testCases: [
      {
        input: 'enableCpiGuard(connection, payer, tokenAccount, owner)',
        expectedOutput: 'CpiGuard enabled: lockCpi = true',
        description: 'CPI Guard is enabled on the token account',
      },
      {
        input: 'cpiTransfer(program, guardedAccount, dest, ownerPda, amount)',
        expectedOutput: 'Error: CPI Guard prevents transfer via CPI',
        description: 'CPI-initiated transfers are blocked when CPI Guard is enabled',
      },
      {
        input: 'disableCpiGuard(connection, payer, tokenAccount, owner)',
        expectedOutput: 'CpiGuard disabled: lockCpi = false',
        description: 'Owner can disable CPI Guard to allow CPI operations',
      },
    ],
    hints: [
      'CPI Guard blocks transfers, burns, close-account, and approve when invoked via CPI. Direct (top-level) instructions still work.',
      'The owner must sign the enable/disable instruction. Pass [] for multiSigners when using a single Keypair signer.',
      'The token account must have CpiGuard extension space allocated at creation time. You cannot add it to an existing account without realloc.',
    ],
    xpReward: 100,
    estimatedMinutes: 20,
  },

  // ── te-014: MetadataPointer Setup ── intermediate, rust, 100xp, 25min
  {
    id: 'te-014',
    title: 'MetadataPointer Extension',
    description:
      'Initialize a Token-2022 mint with the MetadataPointer extension. This extension tells clients where to find the token metadata -- it can point to the mint itself (when using the TokenMetadata extension), an external Metaplex metadata account, or any other address. This is the foundation for on-chain token metadata.',
    difficulty: 'intermediate',
    category: 'token-extensions',
    language: 'rust',
    starterCode: `use anchor_lang::prelude::*;
use anchor_lang::solana_program::program::invoke;
use spl_token_2022::{
    extension::ExtensionType,
    instruction::initialize_mint,
};
use spl_token_metadata_interface;

declare_id!("Meta111111111111111111111111111111111111111");

#[derive(Accounts)]
pub struct CreateMintWithMetadataPointer<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    /// CHECK: Validated in instruction
    #[account(mut)]
    pub mint: Signer<'info>,
    pub token_program: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}

/// Create a mint with MetadataPointer pointing to the mint itself.
/// This means the metadata will be stored directly on the mint account
/// using the TokenMetadata extension.
pub fn create_mint_with_metadata_pointer(
    ctx: Context<CreateMintWithMetadataPointer>,
) -> Result<()> {
    // TODO: Calculate space for mint with MetadataPointer extension
    // TODO: Create the account
    // TODO: Initialize MetadataPointer to point to the mint itself
    //   (metadata_address = mint address, authority = payer)
    // TODO: Initialize the mint
    // NOTE: Order matters -- MetadataPointer before mint init

    Ok(())
}`,
    solution: `use anchor_lang::prelude::*;
use anchor_lang::solana_program::program::invoke;
use spl_token_2022::{
    extension::{
        metadata_pointer::instruction::initialize as init_metadata_pointer,
        ExtensionType,
    },
    instruction::initialize_mint,
};

declare_id!("Meta111111111111111111111111111111111111111");

#[derive(Accounts)]
pub struct CreateMintWithMetadataPointer<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    /// CHECK: Validated in instruction
    #[account(mut)]
    pub mint: Signer<'info>,
    pub token_program: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}

pub fn create_mint_with_metadata_pointer(
    ctx: Context<CreateMintWithMetadataPointer>,
) -> Result<()> {
    let mint_size = ExtensionType::try_calculate_account_len::<spl_token_2022::state::Mint>(
        &[ExtensionType::MetadataPointer],
    )?;
    let lamports = Rent::get()?.minimum_balance(mint_size);

    anchor_lang::system_program::create_account(
        CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            anchor_lang::system_program::CreateAccount {
                from: ctx.accounts.payer.to_account_info(),
                to: ctx.accounts.mint.to_account_info(),
            },
        ),
        lamports,
        mint_size as u64,
        ctx.accounts.token_program.key,
    )?;

    invoke(
        &init_metadata_pointer(
            ctx.accounts.token_program.key,
            ctx.accounts.mint.key,
            Some(ctx.accounts.payer.key()),
            Some(ctx.accounts.mint.key()),
        )?,
        &[ctx.accounts.mint.to_account_info()],
    )?;

    invoke(
        &initialize_mint(
            ctx.accounts.token_program.key,
            ctx.accounts.mint.key,
            ctx.accounts.payer.key,
            None,
            9,
        )?,
        &[ctx.accounts.mint.to_account_info()],
    )?;

    Ok(())
}`,
    testCases: [
      {
        input: 'create_mint_with_metadata_pointer(ctx)',
        expectedOutput: 'MetadataPointer: metadataAddress = <mint>, authority = <payer>',
        description: 'Mint has MetadataPointer pointing to itself',
      },
      {
        input: 'getMetadataPointerState(mint)',
        expectedOutput: 'authority: <payer>, metadataAddress: <mint>',
        description: 'MetadataPointer state correctly references mint as metadata source',
      },
      {
        input: 'create_mint_with_metadata_pointer(ctx) // with external address',
        expectedOutput: 'MetadataPointer: metadataAddress = <external>',
        description: 'MetadataPointer can reference an external metadata account',
      },
    ],
    hints: [
      'MetadataPointer tells clients WHERE to find metadata. It does not store the metadata itself.',
      'When pointing to the mint itself, you need BOTH MetadataPointer and TokenMetadata extensions.',
      'The metadata_pointer::instruction::initialize function takes Option<Pubkey> for both authority and metadata_address.',
    ],
    xpReward: 100,
    estimatedMinutes: 25,
  },

  // ── te-015: TokenMetadata Extension ── intermediate, typescript, 100xp, 30min
  {
    id: 'te-015',
    title: 'TokenMetadata Extension',
    description:
      'Create a Token-2022 mint with both MetadataPointer and TokenMetadata extensions. Store the token name, symbol, URI, and custom additional fields directly on the mint account -- no external metadata program needed. This is the native Token-2022 approach to on-chain metadata.',
    difficulty: 'intermediate',
    category: 'token-extensions',
    language: 'typescript',
    starterCode: `import {
  Connection,
  Keypair,
  SystemProgram,
  Transaction,
} from '@solana/web3.js';
import {
  TOKEN_2022_PROGRAM_ID,
  ExtensionType,
  getMintLen,
  createInitializeMintInstruction,
  createInitializeMetadataPointerInstruction,
  TYPE_SIZE,
  LENGTH_SIZE,
} from '@solana/spl-token';
import {
  createInitializeInstruction,
  createUpdateFieldInstruction,
  pack,
  TokenMetadata,
} from '@solana/spl-token-metadata';

interface TokenMetadataInput {
  name: string;
  symbol: string;
  uri: string;
  additionalFields: [string, string][];
}

/**
 * Create a Token-2022 mint with on-chain metadata.
 */
export async function createMintWithMetadata(
  connection: Connection,
  payer: Keypair,
  metadata: TokenMetadataInput,
): Promise<Keypair> {
  const mintKeypair = Keypair.generate();

  // TODO: Build the TokenMetadata object
  // TODO: Calculate space:
  //   - Base mint with MetadataPointer extension
  //   - PLUS TYPE_SIZE + LENGTH_SIZE + metadata packed size
  // TODO: Transaction 1: createAccount + initMetadataPointer + initMint
  // TODO: Transaction 2: initializeMetadata + updateField for each additional field
  // Note: Metadata init requires the mint to exist first

  return mintKeypair;
}`,
    solution: `import {
  Connection,
  Keypair,
  SystemProgram,
  Transaction,
} from '@solana/web3.js';
import {
  TOKEN_2022_PROGRAM_ID,
  ExtensionType,
  getMintLen,
  createInitializeMintInstruction,
  createInitializeMetadataPointerInstruction,
  TYPE_SIZE,
  LENGTH_SIZE,
} from '@solana/spl-token';
import {
  createInitializeInstruction,
  createUpdateFieldInstruction,
  pack,
  TokenMetadata,
} from '@solana/spl-token-metadata';

interface TokenMetadataInput {
  name: string;
  symbol: string;
  uri: string;
  additionalFields: [string, string][];
}

export async function createMintWithMetadata(
  connection: Connection,
  payer: Keypair,
  metadata: TokenMetadataInput,
): Promise<Keypair> {
  const mintKeypair = Keypair.generate();

  const tokenMetadata: TokenMetadata = {
    mint: mintKeypair.publicKey,
    name: metadata.name,
    symbol: metadata.symbol,
    uri: metadata.uri,
    updateAuthority: payer.publicKey,
    additionalMetadata: metadata.additionalFields,
  };

  const mintBaseSpace = getMintLen([ExtensionType.MetadataPointer]);
  const metadataSpace = TYPE_SIZE + LENGTH_SIZE + pack(tokenMetadata).length;
  const totalSpace = mintBaseSpace + metadataSpace;
  const lamports = await connection.getMinimumBalanceForRentExemption(totalSpace);

  const initTx = new Transaction().add(
    SystemProgram.createAccount({
      fromPubkey: payer.publicKey,
      newAccountPubkey: mintKeypair.publicKey,
      space: totalSpace,
      lamports,
      programId: TOKEN_2022_PROGRAM_ID,
    }),
    createInitializeMetadataPointerInstruction(
      mintKeypair.publicKey,
      payer.publicKey,
      mintKeypair.publicKey,
      TOKEN_2022_PROGRAM_ID,
    ),
    createInitializeMintInstruction(
      mintKeypair.publicKey,
      9,
      payer.publicKey,
      null,
      TOKEN_2022_PROGRAM_ID,
    ),
    createInitializeInstruction({
      programId: TOKEN_2022_PROGRAM_ID,
      mint: mintKeypair.publicKey,
      metadata: mintKeypair.publicKey,
      name: metadata.name,
      symbol: metadata.symbol,
      uri: metadata.uri,
      mintAuthority: payer.publicKey,
      updateAuthority: payer.publicKey,
    }),
  );

  for (const [key, value] of metadata.additionalFields) {
    initTx.add(
      createUpdateFieldInstruction({
        programId: TOKEN_2022_PROGRAM_ID,
        metadata: mintKeypair.publicKey,
        updateAuthority: payer.publicKey,
        field: key,
        value,
      }),
    );
  }

  await connection.sendTransaction(initTx, [payer, mintKeypair]);

  return mintKeypair;
}`,
    testCases: [
      {
        input: 'createMintWithMetadata(conn, payer, { name: "Academy XP", symbol: "AXP", uri: "https://arweave.net/abc", additionalFields: [] })',
        expectedOutput: 'Metadata: name=Academy XP, symbol=AXP, uri=https://arweave.net/abc',
        description: 'Mint has on-chain metadata with name, symbol, and URI',
      },
      {
        input: 'createMintWithMetadata(conn, payer, { name: "T", symbol: "T", uri: "", additionalFields: [["track", "DeFi"], ["level", "201"]] })',
        expectedOutput: 'additionalMetadata: [["track","DeFi"],["level","201"]]',
        description: 'Custom additional metadata fields are stored on-chain',
      },
      {
        input: 'updateField(mint, updateAuth, "uri", "https://arweave.net/new")',
        expectedOutput: 'Metadata uri updated to https://arweave.net/new',
        description: 'Update authority can modify metadata fields',
      },
    ],
    hints: [
      'Account space must include base mint + MetadataPointer extension + TYPE_SIZE + LENGTH_SIZE + packed metadata length.',
      'MetadataPointer and mint initialization come first, THEN the metadata initialize instruction (metadata init requires an existing mint).',
      'Additional fields are added one at a time via createUpdateFieldInstruction after the metadata is initialized.',
    ],
    xpReward: 100,
    estimatedMinutes: 30,
  },

  // ── te-016: GroupPointer Configuration ── advanced, rust, 200xp, 35min
  {
    id: 'te-016',
    title: 'GroupPointer Extension',
    description:
      'Configure a Token-2022 mint with the GroupPointer extension. This extension designates a mint as a "group" that can contain member tokens. Combined with GroupMemberPointer, this enables on-chain token collections, game item sets, or course credential groups -- all natively in Token-2022.',
    difficulty: 'advanced',
    category: 'token-extensions',
    language: 'rust',
    starterCode: `use anchor_lang::prelude::*;
use anchor_lang::solana_program::program::invoke;
use spl_token_2022::{
    extension::ExtensionType,
    instruction::initialize_mint,
};

declare_id!("Grp1111111111111111111111111111111111111111");

#[derive(Accounts)]
pub struct CreateGroupMint<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    /// CHECK: Validated in instruction
    #[account(mut)]
    pub mint: Signer<'info>,
    pub token_program: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}

/// Create a mint that serves as a group (collection) for member tokens.
/// The GroupPointer tells clients which account holds the group state.
pub fn create_group_mint(ctx: Context<CreateGroupMint>) -> Result<()> {
    // TODO: Calculate space for mint with GroupPointer extension
    // TODO: Create the account
    // TODO: Initialize GroupPointer (pointing to the mint itself)
    //   with authority = payer, group_address = mint
    // TODO: Initialize the mint
    // TODO: Initialize the group data on the mint
    //   (max_size for maximum number of members)

    Ok(())
}

/// Initialize the token group with a max size.
/// This sets how many member tokens can be part of this group.
pub fn initialize_group(
    ctx: Context<CreateGroupMint>,
    max_size: u32,
) -> Result<()> {
    // TODO: Call spl_token_group_interface::instruction::initialize_group
    //   with the mint as the group account
    // TODO: Set update_authority for future modifications

    Ok(())
}`,
    solution: `use anchor_lang::prelude::*;
use anchor_lang::solana_program::program::invoke;
use spl_token_2022::{
    extension::{
        group_pointer::instruction::initialize as init_group_pointer,
        ExtensionType,
    },
    instruction::initialize_mint,
};
use spl_token_group_interface::instruction::initialize_group;

declare_id!("Grp1111111111111111111111111111111111111111");

#[derive(Accounts)]
pub struct CreateGroupMint<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    /// CHECK: Validated in instruction
    #[account(mut)]
    pub mint: Signer<'info>,
    pub token_program: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}

pub fn create_group_mint(ctx: Context<CreateGroupMint>) -> Result<()> {
    let extensions = &[ExtensionType::GroupPointer];
    let mint_size = ExtensionType::try_calculate_account_len::<spl_token_2022::state::Mint>(
        extensions,
    )?;

    // Add space for the group state stored on the mint
    let group_state_size = 72; // TokenGroup state: update_authority(32) + mint(32) + size(4) + max_size(4)
    let total_size = mint_size + group_state_size;
    let lamports = Rent::get()?.minimum_balance(total_size);

    anchor_lang::system_program::create_account(
        CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            anchor_lang::system_program::CreateAccount {
                from: ctx.accounts.payer.to_account_info(),
                to: ctx.accounts.mint.to_account_info(),
            },
        ),
        lamports,
        total_size as u64,
        ctx.accounts.token_program.key,
    )?;

    invoke(
        &init_group_pointer(
            ctx.accounts.token_program.key,
            ctx.accounts.mint.key,
            Some(ctx.accounts.payer.key()),
            Some(ctx.accounts.mint.key()),
        )?,
        &[ctx.accounts.mint.to_account_info()],
    )?;

    invoke(
        &initialize_mint(
            ctx.accounts.token_program.key,
            ctx.accounts.mint.key,
            ctx.accounts.payer.key,
            None,
            0,
        )?,
        &[ctx.accounts.mint.to_account_info()],
    )?;

    invoke(
        &initialize_group(
            ctx.accounts.token_program.key,
            ctx.accounts.mint.key,
            ctx.accounts.payer.key,
            Some(ctx.accounts.payer.key()),
            50, // max 50 members
        ),
        &[
            ctx.accounts.mint.to_account_info(),
            ctx.accounts.payer.to_account_info(),
        ],
    )?;

    Ok(())
}`,
    testCases: [
      {
        input: 'create_group_mint(ctx)',
        expectedOutput: 'GroupPointer: groupAddress = <mint>, authority = <payer>',
        description: 'Mint has GroupPointer extension pointing to itself',
      },
      {
        input: 'getTokenGroupState(mint)',
        expectedOutput: 'TokenGroup: maxSize=50, size=0, updateAuthority=<payer>',
        description: 'Group state is initialized with max size and zero current members',
      },
      {
        input: 'addMemberToGroup(groupMint, memberMint, authority)',
        expectedOutput: 'TokenGroup: size incremented to 1, member registered',
        description: 'Member mints can be added to the group up to max size',
      },
    ],
    hints: [
      'GroupPointer + TokenGroup are analogous to MetadataPointer + TokenMetadata. The pointer says where, the data struct holds the state.',
      'Account space must include both the mint+extension space AND the TokenGroup state size.',
      'Initialize order: GroupPointer -> Mint -> Group state. The group init requires the mint to exist.',
    ],
    xpReward: 200,
    estimatedMinutes: 35,
  },

  // ── te-017: GroupMemberPointer ── advanced, rust, 200xp, 35min
  {
    id: 'te-017',
    title: 'GroupMemberPointer Extension',
    description:
      'Create a Token-2022 mint with the GroupMemberPointer extension to designate it as a member of a token group. This mint references its parent group mint, enabling on-chain collection relationships. Together with GroupPointer, this creates a full group/member hierarchy for credential sets, NFT collections, or course modules.',
    difficulty: 'advanced',
    category: 'token-extensions',
    language: 'rust',
    starterCode: `use anchor_lang::prelude::*;
use anchor_lang::solana_program::program::invoke;
use spl_token_2022::{
    extension::ExtensionType,
    instruction::initialize_mint,
};

declare_id!("Mbr1111111111111111111111111111111111111111");

#[derive(Accounts)]
pub struct CreateMemberMint<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    /// CHECK: Validated in instruction
    #[account(mut)]
    pub member_mint: Signer<'info>,
    /// CHECK: The group mint this member belongs to
    #[account(mut)]
    pub group_mint: AccountInfo<'info>,
    pub token_program: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}

/// Create a member mint that belongs to a group.
/// The GroupMemberPointer tells clients which group this token belongs to.
pub fn create_member_mint(ctx: Context<CreateMemberMint>) -> Result<()> {
    // TODO: Calculate space for mint with GroupMemberPointer extension
    //   Plus the TokenGroupMember state
    // TODO: Create the account
    // TODO: Initialize GroupMemberPointer (pointing to the member mint itself)
    // TODO: Initialize the mint
    // TODO: Initialize the member data, linking to the group mint
    //   This also increments the group's member count

    Ok(())
}`,
    solution: `use anchor_lang::prelude::*;
use anchor_lang::solana_program::program::invoke;
use spl_token_2022::{
    extension::{
        group_member_pointer::instruction::initialize as init_member_pointer,
        ExtensionType,
    },
    instruction::initialize_mint,
};
use spl_token_group_interface::instruction::initialize_member;

declare_id!("Mbr1111111111111111111111111111111111111111");

#[derive(Accounts)]
pub struct CreateMemberMint<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    /// CHECK: Validated in instruction
    #[account(mut)]
    pub member_mint: Signer<'info>,
    /// CHECK: The group mint this member belongs to
    #[account(mut)]
    pub group_mint: AccountInfo<'info>,
    pub token_program: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}

pub fn create_member_mint(ctx: Context<CreateMemberMint>) -> Result<()> {
    let extensions = &[ExtensionType::GroupMemberPointer];
    let mint_size = ExtensionType::try_calculate_account_len::<spl_token_2022::state::Mint>(
        extensions,
    )?;

    // TokenGroupMember state: mint(32) + group(32) + member_number(4)
    let member_state_size = 68;
    let total_size = mint_size + member_state_size;
    let lamports = Rent::get()?.minimum_balance(total_size);

    anchor_lang::system_program::create_account(
        CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            anchor_lang::system_program::CreateAccount {
                from: ctx.accounts.payer.to_account_info(),
                to: ctx.accounts.member_mint.to_account_info(),
            },
        ),
        lamports,
        total_size as u64,
        ctx.accounts.token_program.key,
    )?;

    invoke(
        &init_member_pointer(
            ctx.accounts.token_program.key,
            ctx.accounts.member_mint.key,
            Some(ctx.accounts.payer.key()),
            Some(ctx.accounts.member_mint.key()),
        )?,
        &[ctx.accounts.member_mint.to_account_info()],
    )?;

    invoke(
        &initialize_mint(
            ctx.accounts.token_program.key,
            ctx.accounts.member_mint.key,
            ctx.accounts.payer.key,
            None,
            0,
        )?,
        &[ctx.accounts.member_mint.to_account_info()],
    )?;

    invoke(
        &initialize_member(
            ctx.accounts.token_program.key,
            ctx.accounts.member_mint.key,
            ctx.accounts.member_mint.key,
            ctx.accounts.group_mint.key,
            ctx.accounts.payer.key,
        ),
        &[
            ctx.accounts.member_mint.to_account_info(),
            ctx.accounts.group_mint.to_account_info(),
            ctx.accounts.payer.to_account_info(),
        ],
    )?;

    Ok(())
}`,
    testCases: [
      {
        input: 'create_member_mint(ctx) with valid group_mint',
        expectedOutput: 'GroupMemberPointer: memberAddress = <member_mint>',
        description: 'Member mint has GroupMemberPointer pointing to itself',
      },
      {
        input: 'getTokenGroupMemberState(member_mint)',
        expectedOutput: 'TokenGroupMember: group=<group_mint>, memberNumber=1',
        description: 'Member state references the parent group and has a member number',
      },
      {
        input: 'getTokenGroupState(group_mint) after adding member',
        expectedOutput: 'TokenGroup: size=1 (incremented from 0)',
        description: 'Group member count is incremented when a new member is added',
      },
    ],
    hints: [
      'GroupMemberPointer is the member-side counterpart to GroupPointer. Each member mint points to its own member state.',
      'Initializing a member also modifies the group mint (increments size), so group_mint must be passed as mutable.',
      'The group update_authority must sign the initialize_member instruction to authorize adding a member.',
    ],
    xpReward: 200,
    estimatedMinutes: 35,
  },

  // ── te-018: Token Wrapping ── advanced, typescript, 200xp, 40min
  {
    id: 'te-018',
    title: 'Token Wrapping: Legacy to Token-2022',
    description:
      'Implement token wrapping to convert legacy SPL tokens into Token-2022 tokens with extensions. Create a wrapping vault that holds legacy tokens and mints equivalent Token-2022 tokens with metadata. This pattern enables adding extensions (metadata, transfer fees, etc.) to existing tokens.',
    difficulty: 'advanced',
    category: 'token-extensions',
    language: 'typescript',
    starterCode: `import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
} from '@solana/web3.js';
import {
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  ExtensionType,
  getMintLen,
  createInitializeMintInstruction,
  createInitializeMetadataPointerInstruction,
  createMintToInstruction,
  createTransferInstruction,
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountInstruction,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import {
  createInitializeInstruction,
} from '@solana/spl-token-metadata';

/**
 * Create the Token-2022 wrapper mint with metadata.
 * This mint represents the "wrapped" version of a legacy token.
 */
export async function createWrapperMint(
  connection: Connection,
  payer: Keypair,
  legacyMint: PublicKey,
  name: string,
  symbol: string,
): Promise<Keypair> {
  const wrapperMintKeypair = Keypair.generate();

  // TODO: Create a Token-2022 mint with MetadataPointer + TokenMetadata
  // TODO: The metadata should include a reference to the legacy mint
  //   as an additional field: ["wrappedMint", legacyMint.toBase58()]
  // TODO: Mint authority should be a PDA derived from the wrapper program

  return wrapperMintKeypair;
}

/**
 * Wrap legacy tokens: deposit legacy tokens into vault,
 * mint equivalent Token-2022 tokens to the user.
 */
export async function wrapTokens(
  connection: Connection,
  payer: Keypair,
  legacyMint: PublicKey,
  wrapperMint: PublicKey,
  wrapperMintAuthority: PublicKey,
  amount: bigint,
): Promise<void> {
  // TODO: Transfer legacy tokens from user's ATA to the vault ATA
  // TODO: Mint equivalent amount of wrapper tokens to user's Token-2022 ATA
  // NOTE: In production, the mint instruction would be signed by
  //   a PDA via CPI, not directly by a keypair
}

/**
 * Unwrap Token-2022 tokens: burn wrapper tokens,
 * release legacy tokens from vault back to user.
 */
export async function unwrapTokens(
  connection: Connection,
  payer: Keypair,
  legacyMint: PublicKey,
  wrapperMint: PublicKey,
  amount: bigint,
): Promise<void> {
  // TODO: Burn wrapper tokens from user's Token-2022 ATA
  // TODO: Transfer legacy tokens from vault back to user's legacy ATA
}`,
    solution: `import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
} from '@solana/web3.js';
import {
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  ExtensionType,
  getMintLen,
  createInitializeMintInstruction,
  createInitializeMetadataPointerInstruction,
  createMintToInstruction,
  createTransferInstruction,
  createBurnInstruction,
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountInstruction,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TYPE_SIZE,
  LENGTH_SIZE,
} from '@solana/spl-token';
import {
  createInitializeInstruction,
  createUpdateFieldInstruction,
  pack,
  TokenMetadata,
} from '@solana/spl-token-metadata';

export async function createWrapperMint(
  connection: Connection,
  payer: Keypair,
  legacyMint: PublicKey,
  name: string,
  symbol: string,
): Promise<Keypair> {
  const wrapperMintKeypair = Keypair.generate();

  const tokenMetadata: TokenMetadata = {
    mint: wrapperMintKeypair.publicKey,
    name,
    symbol,
    uri: '',
    updateAuthority: payer.publicKey,
    additionalMetadata: [['wrappedMint', legacyMint.toBase58()]],
  };

  const mintBaseSpace = getMintLen([ExtensionType.MetadataPointer]);
  const metadataSpace = TYPE_SIZE + LENGTH_SIZE + pack(tokenMetadata).length;
  const totalSpace = mintBaseSpace + metadataSpace;
  const lamports = await connection.getMinimumBalanceForRentExemption(totalSpace);

  const tx = new Transaction().add(
    SystemProgram.createAccount({
      fromPubkey: payer.publicKey,
      newAccountPubkey: wrapperMintKeypair.publicKey,
      space: totalSpace,
      lamports,
      programId: TOKEN_2022_PROGRAM_ID,
    }),
    createInitializeMetadataPointerInstruction(
      wrapperMintKeypair.publicKey,
      payer.publicKey,
      wrapperMintKeypair.publicKey,
      TOKEN_2022_PROGRAM_ID,
    ),
    createInitializeMintInstruction(
      wrapperMintKeypair.publicKey,
      9,
      payer.publicKey,
      null,
      TOKEN_2022_PROGRAM_ID,
    ),
    createInitializeInstruction({
      programId: TOKEN_2022_PROGRAM_ID,
      mint: wrapperMintKeypair.publicKey,
      metadata: wrapperMintKeypair.publicKey,
      name,
      symbol,
      uri: '',
      mintAuthority: payer.publicKey,
      updateAuthority: payer.publicKey,
    }),
    createUpdateFieldInstruction({
      programId: TOKEN_2022_PROGRAM_ID,
      metadata: wrapperMintKeypair.publicKey,
      updateAuthority: payer.publicKey,
      field: 'wrappedMint',
      value: legacyMint.toBase58(),
    }),
  );

  await connection.sendTransaction(tx, [payer, wrapperMintKeypair]);

  return wrapperMintKeypair;
}

export async function wrapTokens(
  connection: Connection,
  payer: Keypair,
  legacyMint: PublicKey,
  wrapperMint: PublicKey,
  wrapperMintAuthority: PublicKey,
  amount: bigint,
): Promise<void> {
  const userLegacyAta = getAssociatedTokenAddressSync(
    legacyMint,
    payer.publicKey,
    false,
    TOKEN_PROGRAM_ID,
  );

  const vaultAta = getAssociatedTokenAddressSync(
    legacyMint,
    wrapperMintAuthority,
    true,
    TOKEN_PROGRAM_ID,
  );

  const userWrapperAta = getAssociatedTokenAddressSync(
    wrapperMint,
    payer.publicKey,
    false,
    TOKEN_2022_PROGRAM_ID,
  );

  const tx = new Transaction();

  tx.add(
    createAssociatedTokenAccountInstruction(
      payer.publicKey,
      userWrapperAta,
      payer.publicKey,
      wrapperMint,
      TOKEN_2022_PROGRAM_ID,
    ),
  );

  tx.add(
    createTransferInstruction(
      userLegacyAta,
      vaultAta,
      payer.publicKey,
      amount,
      [],
      TOKEN_PROGRAM_ID,
    ),
  );

  tx.add(
    createMintToInstruction(
      wrapperMint,
      userWrapperAta,
      payer.publicKey,
      amount,
      [],
      TOKEN_2022_PROGRAM_ID,
    ),
  );

  await connection.sendTransaction(tx, [payer]);
}

export async function unwrapTokens(
  connection: Connection,
  payer: Keypair,
  legacyMint: PublicKey,
  wrapperMint: PublicKey,
  amount: bigint,
): Promise<void> {
  const userWrapperAta = getAssociatedTokenAddressSync(
    wrapperMint,
    payer.publicKey,
    false,
    TOKEN_2022_PROGRAM_ID,
  );

  const userLegacyAta = getAssociatedTokenAddressSync(
    legacyMint,
    payer.publicKey,
    false,
    TOKEN_PROGRAM_ID,
  );

  const tx = new Transaction();

  tx.add(
    createBurnInstruction(
      userWrapperAta,
      wrapperMint,
      payer.publicKey,
      amount,
      [],
      TOKEN_2022_PROGRAM_ID,
    ),
  );

  // In production: vault transfer would be via PDA CPI
  // Here simplified for demonstration
  tx.add(
    createTransferInstruction(
      userLegacyAta, // vault ATA in production
      userLegacyAta,
      payer.publicKey,
      amount,
      [],
      TOKEN_PROGRAM_ID,
    ),
  );

  await connection.sendTransaction(tx, [payer]);
}`,
    testCases: [
      {
        input: 'createWrapperMint(conn, payer, legacyMint, "Wrapped SOL", "wSOL22")',
        expectedOutput: 'Token-2022 mint with metadata: wrappedMint=<legacyMint>',
        description: 'Wrapper mint stores a reference to the original legacy mint in metadata',
      },
      {
        input: 'wrapTokens(conn, payer, legacyMint, wrapperMint, auth, 1000n)',
        expectedOutput: 'Legacy ATA -1000, vault +1000, wrapper ATA +1000',
        description: 'Wrapping deposits legacy tokens and mints equivalent wrapper tokens',
      },
      {
        input: 'unwrapTokens(conn, payer, legacyMint, wrapperMint, 500n)',
        expectedOutput: 'Wrapper ATA burned 500, legacy ATA +500 from vault',
        description: 'Unwrapping burns wrapper tokens and releases legacy tokens',
      },
    ],
    hints: [
      'Token wrapping maintains a 1:1 backing ratio. The vault must always hold legacy tokens equal to the wrapper mint supply.',
      'Use different program IDs for legacy (TOKEN_PROGRAM_ID) and wrapper (TOKEN_2022_PROGRAM_ID) token operations.',
      'In production, the vault and mint authority should be a PDA so wrapping/unwrapping is trustless via CPI.',
    ],
    xpReward: 200,
    estimatedMinutes: 40,
  },

  // ── te-019: Realloc for New Extensions ── advanced, typescript, 200xp, 35min
  {
    id: 'te-019',
    title: 'Realloc: Adding Extensions to Existing Mints',
    description:
      'Reallocate a Token-2022 mint account to add new extensions after creation. Token-2022 supports reallocating mint accounts to accommodate additional extensions that were not included at creation time. This uses the Reallocate instruction to grow the account and then initializes the new extension.',
    difficulty: 'advanced',
    category: 'token-extensions',
    language: 'typescript',
    starterCode: `import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
} from '@solana/web3.js';
import {
  TOKEN_2022_PROGRAM_ID,
  ExtensionType,
  createReallocateInstruction,
  createInitializeMintCloseAuthorityInstruction,
  getMint,
} from '@solana/spl-token';

/**
 * Add MintCloseAuthority extension to an existing Token-2022 mint
 * that was created without it.
 *
 * @param connection - Solana connection
 * @param payer - Fee payer (also provides additional rent)
 * @param mint - Existing Token-2022 mint address
 * @param mintAuthority - Current mint authority (must sign)
 * @param closeAuthority - The new close authority
 */
export async function addCloseAuthorityToMint(
  connection: Connection,
  payer: Keypair,
  mint: PublicKey,
  mintAuthority: Keypair,
  closeAuthority: PublicKey,
): Promise<void> {
  // TODO: Reallocate the mint account to include MintCloseAuthority extension
  //   The reallocate instruction:
  //   - Increases account space for the new extension
  //   - Transfers additional rent from payer
  //   - Requires the mint authority to sign
  // TODO: Initialize the MintCloseAuthority extension on the reallocated space
  // TODO: Send both instructions in a single transaction
}

/**
 * Add multiple extensions to an existing mint in a single reallocation.
 */
export async function addMultipleExtensions(
  connection: Connection,
  payer: Keypair,
  mint: PublicKey,
  mintAuthority: Keypair,
  extensionTypes: ExtensionType[],
): Promise<void> {
  // TODO: Reallocate for all extensions at once
  // TODO: Initialize each extension in order
  // NOTE: Some extensions may have dependencies on others
}`,
    solution: `import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
} from '@solana/web3.js';
import {
  TOKEN_2022_PROGRAM_ID,
  ExtensionType,
  createReallocateInstruction,
  createInitializeMintCloseAuthorityInstruction,
  getMint,
} from '@solana/spl-token';

export async function addCloseAuthorityToMint(
  connection: Connection,
  payer: Keypair,
  mint: PublicKey,
  mintAuthority: Keypair,
  closeAuthority: PublicKey,
): Promise<void> {
  const reallocateIx = createReallocateInstruction(
    mint,
    payer.publicKey,
    [ExtensionType.MintCloseAuthority],
    mintAuthority.publicKey,
    undefined,
    TOKEN_2022_PROGRAM_ID,
  );

  const initCloseAuthIx = createInitializeMintCloseAuthorityInstruction(
    mint,
    closeAuthority,
    TOKEN_2022_PROGRAM_ID,
  );

  const transaction = new Transaction().add(reallocateIx, initCloseAuthIx);

  await connection.sendTransaction(transaction, [payer, mintAuthority]);
}

export async function addMultipleExtensions(
  connection: Connection,
  payer: Keypair,
  mint: PublicKey,
  mintAuthority: Keypair,
  extensionTypes: ExtensionType[],
): Promise<void> {
  const reallocateIx = createReallocateInstruction(
    mint,
    payer.publicKey,
    extensionTypes,
    mintAuthority.publicKey,
    undefined,
    TOKEN_2022_PROGRAM_ID,
  );

  const transaction = new Transaction().add(reallocateIx);

  // Each extension needs its own initialization instruction
  // after reallocation. The caller must add these separately
  // based on the extension types and their parameters.

  await connection.sendTransaction(transaction, [payer, mintAuthority]);
}`,
    testCases: [
      {
        input: 'addCloseAuthorityToMint(conn, payer, existingMint, mintAuth, closeAuth)',
        expectedOutput: 'Mint account reallocated, MintCloseAuthority: <closeAuth>',
        description: 'MintCloseAuthority extension is added to an existing mint',
      },
      {
        input: 'getMint(conn, mint, undefined, TOKEN_2022_PROGRAM_ID) after realloc',
        expectedOutput: 'Mint data intact, new extension present, rent-exempt',
        description: 'Existing mint data is preserved after reallocation',
      },
      {
        input: 'addCloseAuthorityToMint(conn, payer, mint, wrongAuth, closeAuth)',
        expectedOutput: 'Error: Signature verification failed for mint authority',
        description: 'Only the mint authority can authorize reallocation',
      },
    ],
    hints: [
      'createReallocateInstruction handles both space increase and additional rent transfer in a single instruction.',
      'The mint authority must sign the reallocate instruction. After realloc, initialize the extension immediately.',
      'Not all extensions can be added after creation. Some (like NonTransferable) must be set at mint creation time.',
    ],
    xpReward: 200,
    estimatedMinutes: 35,
  },

  // ── te-020: Multi-Extension Mint Creation ── beginner, typescript, 50xp, 15min
  {
    id: 'te-020',
    title: 'Multi-Extension Mint Creation',
    description:
      'Create a Token-2022 mint with multiple extensions enabled simultaneously. Combine NonTransferable, PermanentDelegate, MintCloseAuthority, and MetadataPointer in a single mint -- the pattern used by Superteam Academy for soulbound XP tokens. Understanding extension composition is essential for production Token-2022 work.',
    difficulty: 'beginner',
    category: 'token-extensions',
    language: 'typescript',
    starterCode: `import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
} from '@solana/web3.js';
import {
  TOKEN_2022_PROGRAM_ID,
  ExtensionType,
  getMintLen,
  createInitializeMintInstruction,
  createInitializeNonTransferableMintInstruction,
  createInitializePermanentDelegateInstruction,
  createInitializeMintCloseAuthorityInstruction,
  createInitializeMetadataPointerInstruction,
} from '@solana/spl-token';

/**
 * Create a soulbound XP token mint with multiple extensions:
 * - NonTransferable: tokens cannot be transferred (soulbound)
 * - PermanentDelegate: authority can burn from any account
 * - MintCloseAuthority: mint can be closed if needed
 * - MetadataPointer: points to mint for on-chain metadata
 *
 * @param connection - Solana connection
 * @param payer - Transaction fee payer
 * @param authority - The admin authority for delegate and close
 * @returns The mint keypair
 */
export async function createSoulboundXpMint(
  connection: Connection,
  payer: Keypair,
  authority: PublicKey,
): Promise<Keypair> {
  const mintKeypair = Keypair.generate();

  // TODO: List all four extensions for space calculation
  // TODO: Calculate total space with getMintLen
  // TODO: Get rent-exempt balance
  // TODO: Build transaction with correct instruction order:
  //   1. SystemProgram.createAccount
  //   2-5. All extension initialization instructions (before mint init!)
  //   6. createInitializeMintInstruction
  // TODO: Send and confirm

  return mintKeypair;
}`,
    solution: `import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
} from '@solana/web3.js';
import {
  TOKEN_2022_PROGRAM_ID,
  ExtensionType,
  getMintLen,
  createInitializeMintInstruction,
  createInitializeNonTransferableMintInstruction,
  createInitializePermanentDelegateInstruction,
  createInitializeMintCloseAuthorityInstruction,
  createInitializeMetadataPointerInstruction,
} from '@solana/spl-token';

export async function createSoulboundXpMint(
  connection: Connection,
  payer: Keypair,
  authority: PublicKey,
): Promise<Keypair> {
  const mintKeypair = Keypair.generate();

  const extensions = [
    ExtensionType.NonTransferable,
    ExtensionType.PermanentDelegate,
    ExtensionType.MintCloseAuthority,
    ExtensionType.MetadataPointer,
  ];

  const mintSpace = getMintLen(extensions);
  const lamports = await connection.getMinimumBalanceForRentExemption(mintSpace);

  const transaction = new Transaction().add(
    SystemProgram.createAccount({
      fromPubkey: payer.publicKey,
      newAccountPubkey: mintKeypair.publicKey,
      space: mintSpace,
      lamports,
      programId: TOKEN_2022_PROGRAM_ID,
    }),
    createInitializeNonTransferableMintInstruction(
      mintKeypair.publicKey,
      TOKEN_2022_PROGRAM_ID,
    ),
    createInitializePermanentDelegateInstruction(
      mintKeypair.publicKey,
      authority,
      TOKEN_2022_PROGRAM_ID,
    ),
    createInitializeMintCloseAuthorityInstruction(
      mintKeypair.publicKey,
      authority,
      TOKEN_2022_PROGRAM_ID,
    ),
    createInitializeMetadataPointerInstruction(
      mintKeypair.publicKey,
      authority,
      mintKeypair.publicKey,
      TOKEN_2022_PROGRAM_ID,
    ),
    createInitializeMintInstruction(
      mintKeypair.publicKey,
      0,
      payer.publicKey,
      null,
      TOKEN_2022_PROGRAM_ID,
    ),
  );

  await connection.sendTransaction(transaction, [payer, mintKeypair]);

  return mintKeypair;
}`,
    testCases: [
      {
        input: 'createSoulboundXpMint(connection, payer, authority)',
        expectedOutput: 'Mint with 4 extensions: NonTransferable, PermanentDelegate, MintCloseAuthority, MetadataPointer',
        description: 'Mint has all four extensions enabled simultaneously',
      },
      {
        input: 'transfer(mint, fromAta, toAta, owner, 100)',
        expectedOutput: 'Error: NonTransferable prevents transfer',
        description: 'Tokens are soulbound and cannot be transferred',
      },
      {
        input: 'burnChecked(connection, anyAta, mint, authority, 50, 0)',
        expectedOutput: 'Burn successful via PermanentDelegate',
        description: 'Authority can burn XP from any account via PermanentDelegate',
      },
    ],
    hints: [
      'Pass all extension types as an array to getMintLen to calculate the total space needed.',
      'ALL extension initialization instructions must come BEFORE createInitializeMintInstruction. Order among extensions does not matter.',
      'This is the exact pattern used by Superteam Academy for soulbound XP tokens: non-transferable + authority-burnable + closable + metadata-ready.',
    ],
    xpReward: 50,
    estimatedMinutes: 15,
  },
];
