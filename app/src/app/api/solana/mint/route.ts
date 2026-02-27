
import { 
    Connection, 
    Keypair, 
    PublicKey, 
    clusterApiUrl 
} from '@solana/web3.js';
import { 
    getOrCreateAssociatedTokenAccount, 
    mintTo, 
    TOKEN_PROGRAM_ID 
} from '@solana/spl-token';
import { NextResponse } from 'next/server';

const RPC_URL = process.env.NEXT_PUBLIC_HELIUS_RPC || clusterApiUrl('devnet');
const connection = new Connection(RPC_URL, 'confirmed');

export async function POST(req: Request) {
    try {
        const { walletAddress, amount } = await req.json();
        
        console.log(`[MINT] Request: wallet=${walletAddress}, amount=${amount}`);

        if (!process.env.SOLANA_PRIVATE_KEY || !process.env.NEXT_PUBLIC_XP_MINT_ADDRESS) {
            console.error('[MINT] Missing env vars: SOLANA_PRIVATE_KEY or NEXT_PUBLIC_XP_MINT_ADDRESS');
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
        }

        if (!walletAddress || !amount || amount <= 0) {
            console.error('[MINT] Invalid params:', { walletAddress, amount });
            return NextResponse.json({ error: 'Invalid wallet or amount' }, { status: 400 });
        }

        const secretKey = Uint8Array.from(JSON.parse(process.env.SOLANA_PRIVATE_KEY));
        const authority = Keypair.fromSecretKey(secretKey);
        const mint = new PublicKey(process.env.NEXT_PUBLIC_XP_MINT_ADDRESS);
        const recipient = new PublicKey(walletAddress);

        // Get Recipient's Token Account (or create if needed)
        const recipientTokenAccount = await getOrCreateAssociatedTokenAccount(
            connection,
            authority,
            mint,
            recipient
        );
        console.log(`[MINT] Recipient ATA: ${recipientTokenAccount.address.toString()}`);

        // Mint Tokens
        const tx = await mintTo(
            connection,
            authority,
            mint,
            recipientTokenAccount.address,
            authority,
            amount // 0 decimals, so this is raw amount
        );

        console.log(`[MINT] ✅ Success! TX: ${tx}`);
        return NextResponse.json({ success: true, tx });

    } catch (error: any) {
        console.error("[MINT] ❌ Minting Error:", error.message);
        if (error.logs) console.error("[MINT] TX Logs:", error.logs);
        return NextResponse.json({ error: 'Failed to mint tokens', details: error.message }, { status: 500 });
    }
}
