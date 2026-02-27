
import { Connection, PublicKey, Keypair } from '@solana/web3.js';
import { getMint } from '@solana/spl-token';
import dotenv from 'dotenv';
import path from 'path';

// Load env from app/.env.local
dotenv.config({ path: '.env.local' });

const RPC = 'https://devnet.helius-rpc.com/?api-key=b68b97dc-101d-4736-9368-2a9ffec93463';

async function main() {
    console.log("Checking Mint Authority...");

    const privateKeyString = process.env.SOLANA_PRIVATE_KEY;
    if (!privateKeyString) {
        throw new Error("SOLANA_PRIVATE_KEY not found in .env.local");
    }

    const mintAddressString = process.env.NEXT_PUBLIC_XP_MINT_ADDRESS;
    if (!mintAddressString) {
        throw new Error("NEXT_PUBLIC_XP_MINT_ADDRESS not found in .env.local");
    }

    // 1. Derive Authority Public Key
    const secretKey = Uint8Array.from(JSON.parse(privateKeyString));
    const authorityKeypair = Keypair.fromSecretKey(secretKey);
    console.log(`Configured Authority: ${authorityKeypair.publicKey.toBase58()}`);

    // 2. Fetch Mint Info
    const connection = new Connection(RPC, 'confirmed');
    const mintPubkey = new PublicKey(mintAddressString);
    const mintInfo = await getMint(connection, mintPubkey);
    
    console.log(`Mint Address:       ${mintAddressString}`);
    console.log(`On-Chain Authority: ${mintInfo.mintAuthority?.toBase58()}`);

    // 3. Compare
    if (mintInfo.mintAuthority?.toBase58() === authorityKeypair.publicKey.toBase58()) {
        console.log("✅ MATCH! This key CAN mint tokens.");
    } else {
        console.error("❌ MISMATCH! This key CANNOT mint tokens.");
        console.error("You need to use the Private Key of the wallet that created this token.");
    }
}

main().catch(console.error);
