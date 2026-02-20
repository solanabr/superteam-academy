import { NextRequest, NextResponse } from "next/server";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { Program, AnchorProvider } from "@coral-xyz/anchor";
// @ts-ignore
import onchainAcademyIdl from "@/lib/idl/onchain_academy.json";
import bs58 from "bs58";

const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || "https://api.devnet.solana.com";
const BACKEND_WALLET_KEY = process.env.BACKEND_WALLET_PRIVATE_KEY;

export async function POST(req: NextRequest) {
    try {
        const { wallet, xpAmount } = await req.json();

        if (!BACKEND_WALLET_KEY) return NextResponse.json({ error: "Backend wallet missing" }, { status: 500 });
        if (!wallet || !xpAmount) return NextResponse.json({ error: "Missing required fields" }, { status: 400 });

        const connection = new Connection(RPC_URL, "confirmed");
        const backendWallet = Keypair.fromSecretKey(bs58.decode(BACKEND_WALLET_KEY));

        const provider = new AnchorProvider(
            connection,
            // @ts-ignore
            { publicKey: backendWallet.publicKey, signTransaction: async (tx) => { tx.sign(backendWallet); return tx; }, signAllTransactions: async (txs) => { txs.forEach(t => t.sign(backendWallet)); return txs; } },
            AnchorProvider.defaultOptions()
        );

        const program = new Program(onchainAcademyIdl as any, provider);
        const learner = new PublicKey(wallet);

        const [configPda] = PublicKey.findProgramAddressSync([Buffer.from("config")], program.programId);
        const [minterPda] = PublicKey.findProgramAddressSync([Buffer.from("minter"), backendWallet.publicKey.toBuffer()], program.programId);

        const config = await (program.account as any).Config.fetch(configPda);
        const learnerTokenAccount = (await connection.getTokenAccountsByOwner(learner, { mint: config.xpMint })).value[0]?.pubkey;

        if (!learnerTokenAccount) {
            return NextResponse.json({ error: "Learner has no XP Token Account" }, { status: 400 });
        }

        const tx = await program.methods
            .rewardXp(new (program.provider as any).anchor.BN(xpAmount))
            .accounts({
                config: configPda,
                minterRecord: minterPda,
                xpMint: config.xpMint,
                recipientTokenAccount: learnerTokenAccount,
                minter: backendWallet.publicKey,
                tokenProgram: new PublicKey("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"), // Token-2022
            } as any)
            .transaction();

        tx.feePayer = backendWallet.publicKey;
        tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
        tx.sign(backendWallet);

        const sig = await connection.sendRawTransaction(tx.serialize());
        await connection.confirmTransaction(sig);

        return NextResponse.json({ success: true, signature: sig });

    } catch (error: any) {
        console.error("Claim Bonus Error:", error);
        return NextResponse.json({ error: error.message || "Failed to claim bonus" }, { status: 500 });
    }
}
