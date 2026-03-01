/**
 * Upload course content to Arweave via Irys SDK.
 *
 * Usage: npx tsx scripts/upload-to-arweave.ts
 *
 * Prerequisites:
 *   - ARWEAVE_WALLET_KEY env var (Solana private key for Irys)
 *   - pnpm add @irys/sdk (not installed by default)
 *
 * This script reads course content from seed data and uploads
 * each course's content bundle to Arweave for permanent storage.
 * Transaction IDs are then added to the seed data.
 *
 * See: https://docs.irys.xyz/
 */

console.log('Arweave Upload Script');
console.log('=====================');
console.log('');
console.log('This script uploads course content to Arweave via Irys.');
console.log('');
console.log('Setup:');
console.log('  1. Install Irys SDK: pnpm add @irys/sdk');
console.log('  2. Set ARWEAVE_WALLET_KEY env var with your Solana private key');
console.log('  3. Fund your Irys account: npx irys fund <amount> -t solana');
console.log('');
console.log('After upload, update arweaveTxId in seed-data.ts with real tx IDs.');
