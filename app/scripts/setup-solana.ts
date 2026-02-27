
import { 
    Connection, 
    Keypair, 
    LAMPORTS_PER_SOL, 
    clusterApiUrl 
} from '@solana/web3.js';
import { 
    createMint, 
    getOrCreateAssociatedTokenAccount, 
    mintTo, 
    TOKEN_PROGRAM_ID 
} from '@solana/spl-token';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// Connect to Devnet
const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');

async function main() {
    console.log("🚀 Starting Solana Devnet Setup...");

    // 1. Load Authority from .env or generate new
    let authority;
    if (process.env.SOLANA_PRIVATE_KEY) {
        const secretKey = Uint8Array.from(JSON.parse(process.env.SOLANA_PRIVATE_KEY));
        authority = Keypair.fromSecretKey(secretKey);
        console.log(`\n🔑 Using Existing Authority Wallet: ${authority.publicKey.toBase58()}`);
    } else {
        authority = Keypair.generate();
        console.log(`\n🔑 Generated New Authority Wallet: ${authority.publicKey.toBase58()}`);
        console.log(`🔒 Secret Key: [${authority.secretKey.toString()}]`);
    }

    // Check balance
    const balance = await connection.getBalance(authority.publicKey);
    console.log(`💰 Balance: ${balance / LAMPORTS_PER_SOL} SOL`);
    
    if (balance < 0.1 * LAMPORTS_PER_SOL) {
         console.log("\n💧 Requesting Airdrop...");
         try {
            const airdropSignature = await connection.requestAirdrop(
                authority.publicKey,
                2 * LAMPORTS_PER_SOL
            );
            await connection.confirmTransaction(airdropSignature);
            console.log("✅ Airdrop successful!");
         } catch (e) {
            console.error("❌ Airdrop failed. Please fund manually.");
            return;
         }
    }

    // 3. Create the XP Token Mint
    console.log("\ncoin Creating XP Token Mint...");
    const mint = await createMint(
        connection,
        authority,
        authority.publicKey, // Mint Authority
        authority.publicKey, // Freeze Authority
        0, // Decimals (0 because XP is whole numbers)
        undefined,
        undefined,
        TOKEN_PROGRAM_ID
    );

    console.log(`\n✅ XP Token Mint Created: ${mint.toBase58()}`);

    // 4. Create an Associated Token Account for the Authority (optional, but good for testing)
    const authorityTokenAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        authority,
        mint,
        authority.publicKey
    );
    console.log(`📦 Authority Token Account: ${authorityTokenAccount.address.toBase58()}`);

    // 5. Mint some initial tokens to Authority
    console.log("\n💸 Minting 1,000,000 XP to Authority...");
    await mintTo(
        connection,
        authority,
        mint,
        authorityTokenAccount.address,
        authority,
        1000000
    );
    console.log("✅ Initial Supply Minted!");

    // 6. Generate .env snippet
    console.log("\n\n--------------------------------------------------");
    console.log("📝 ADD THIS TO YOUR .env.local FILE:");
    console.log("--------------------------------------------------");
    console.log(`NEXT_PUBLIC_XP_MINT_ADDRESS=${mint.toBase58()}`);
    console.log(`SOLANA_PRIVATE_KEY=[${authority.secretKey.toString()}]`);
    console.log("--------------------------------------------------");
}

main().catch(err => {
    console.error(err);
});
