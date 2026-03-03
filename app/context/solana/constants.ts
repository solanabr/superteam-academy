/**
 * Solana program constants for Superteam Academy.
 *
 * These are the on-chain addresses for the deployed program,
 * XP mint, and associated token programs.
 */
import { PublicKey } from '@solana/web3.js';

/** Superteam Academy on-chain program ID */
export const PROGRAM_ID = new PublicKey(
    process.env.NEXT_PUBLIC_PROGRAM_ID ||
    (process.env.NODE_ENV === 'production'
        ? (() => { throw new Error('NEXT_PUBLIC_PROGRAM_ID must be set in production'); })()
        : 'ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf')
);

/** XP token mint address (Token-2022, soulbound) */
export const XP_MINT = new PublicKey(
    process.env.NEXT_PUBLIC_XP_MINT ||
    (process.env.NODE_ENV === 'production'
        ? (() => { throw new Error('NEXT_PUBLIC_XP_MINT must be set in production'); })()
        : 'xpXPUjkfk7t4AJF1tYUoyAYxzuM5DhinZWS1WjfjAu3')
);

/** Token-2022 program ID */
export const TOKEN_2022_PROGRAM_ID = new PublicKey(
    'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb'
);

/** Metaplex Core program ID */
export const MPL_CORE_PROGRAM_ID = new PublicKey(
    'CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d'
);
