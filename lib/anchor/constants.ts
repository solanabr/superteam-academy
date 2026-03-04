import { PublicKey } from '@solana/web3.js';

/**
 * On-chain Academy Program Configuration
 */

const DEFAULT_PROGRAM_ID = 'ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf';

function resolveProgramId(): PublicKey {
  const configuredId =
    process.env.NEXT_PUBLIC_ANCHOR_PROGRAM_ID ||
    process.env.ANCHOR_PROGRAM_ID ||
    DEFAULT_PROGRAM_ID;

  try {
    return new PublicKey(configuredId);
  } catch (error) {
    console.warn(
      `Invalid program id "${configuredId}", falling back to ${DEFAULT_PROGRAM_ID}`,
      error
    );
    return new PublicKey(DEFAULT_PROGRAM_ID);
  }
}

export const PROGRAM_ID = resolveProgramId();

export const TOKEN_2022_PROGRAM_ID = new PublicKey('TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb');

export const MPL_CORE_PROGRAM_ID = new PublicKey('CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d');

/**
 * Devnet Deployment IDs (for reference)
 */
export const DEVNET = {
  CONFIG_PDA: new PublicKey('He7zEv5PBMg96zqhqZUghjJqDKjXi3MZGZyAPT86o5wM'),
  XP_MINT: new PublicKey('DkEZUnfkvh8RTSmASY2zdjrzCn7sGvgX6n45ygyi2tAd'),
  AUTHORITY: new PublicKey('6HJo2VY5NgAeTWcNq22qU6EKfsdcUPCEmC1fu1e3hvQ1'),
  MOCK_COURSE: new PublicKey('4kNo8Q5ybj6a8xWrwssQRPK9UH359kqma8H5QF5fhwC6'),
  MOCK_TRACK_COLLECTION: new PublicKey('HgbTmCi4wUWAWLx4LD6zJ2AQdayaCe7mVfhJpGwXfeVX'),
};

/**
 * PDA Seed prefixes
 */
export const PDA_SEEDS = {
  CONFIG: 'config',
  COURSE: 'course',
  ENROLLMENT: 'enrollment',
  MINTER: 'minter',
  ACHIEVEMENT: 'achievement',
  ACHIEVEMENT_RECEIPT: 'achievement_receipt',
} as const;

/**
 * XP Configuration
 */
export const XP_DECIMALS = 0; // Token-2022 with no decimals (whole numbers only)

/**
 * Lesson bitmap size: 256 bits (4 x u64)
 */
export const MAX_LESSONS = 256;
