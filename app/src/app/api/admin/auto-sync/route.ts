import { NextRequest, NextResponse } from "next/server";
import { Connection, Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import { Program, AnchorProvider } from "@coral-xyz/anchor";
// @ts-ignore
import onchainAcademyIdl from "@/lib/idl/onchain_academy.json";
import bs58 from "bs58";

const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || "https://api.devnet.solana.com";
const ADMIN_WALLET_KEY = process.env.ADMIN_WALLET_PRIVATE_KEY || process.env.BACKEND_WALLET_PRIVATE_KEY;

export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get("Authorization");
        const webhookSecret = process.env.SANITY_WEBHOOK_SECRET;

        // If a secret is configured in .env, enforce it via Bearer token
        if (webhookSecret && authHeader !== `Bearer ${webhookSecret}`) {
            return NextResponse.json({ error: "Unauthorized Sandbox Webhook" }, { status: 401 });
        }

        const body = await req.json();

        // Sanity Webhook triggers can be customized via GROQ projections to send specific fields.
        // We expect a simple body mapping to the slug and optional lesson details:
        // e.g. { "slug": "intro-to-solana", "lessonCount": 10 }

        // Sanity's default payload often nests fields depending on projection. Support direct slug or nested sanity slug.current.
        const slug = typeof body.slug === 'string' ? body.slug : body.slug?.current;
        const lessonCount = body.lessonCount || 20;
        const trackId = body.trackId || 1;

        if (!slug) {
            return NextResponse.json({ error: "Course slug is strictly required to generate PDA." }, { status: 400 });
        }

        if (!ADMIN_WALLET_KEY) {
            return NextResponse.json({ error: "Backend server wallet not configured" }, { status: 500 });
        }

        const connection = new Connection(RPC_URL, "confirmed");
        const adminWallet = Keypair.fromSecretKey(bs58.decode(ADMIN_WALLET_KEY as string));

        const provider = new AnchorProvider(
            connection,
            // @ts-ignore
            { publicKey: adminWallet.publicKey, signTransaction: async (tx) => { tx.sign(adminWallet); return tx; }, signAllTransactions: async (txs) => { txs.forEach(t => t.sign(adminWallet)); return txs; } },
            AnchorProvider.defaultOptions()
        );

        const program = new Program(onchainAcademyIdl as any, provider);

        const [coursePda] = PublicKey.findProgramAddressSync(
            [Buffer.from("course"), Buffer.from(slug)],
            program.programId
        );

        const [configPda] = PublicKey.findProgramAddressSync([Buffer.from("config")], program.programId);

        console.log(`Received Sanity Webhook. Auto-Syncing Course on-chain: ${slug} (${lessonCount} lessons)...`);

        try {
            const tx = await program.methods
                .createCourse({
                    courseId: slug,
                    creator: adminWallet.publicKey,
                    version: 1,
                    lessonCount: lessonCount,
                    difficulty: 1, // Defaulting for auto-sync
                    xpPerLesson: 50,
                    trackId: trackId,
                    trackLevel: 1, // Defaulting for auto-sync
                    prerequisite: null,
                    creatorRewardXp: 500,
                    minCompletionsForReward: 10
                })
                .accounts({
                    config: configPda,
                    course: coursePda,
                    authority: adminWallet.publicKey,
                    systemProgram: SystemProgram.programId
                } as any)
                .signers([adminWallet])
                .rpc();

            console.log(`Course Auto-Synced Successfully! Tx: ${tx}`);
            return NextResponse.json({ success: true, signature: tx, coursePda: coursePda.toBase58() });
        } catch (err: any) {
            console.warn(`Course auto-sync bounded failure (already initialized?) for ${slug}:`, err.message);
            // Return 200 with success false instead of throwing 500 so Sanity does not continuously retry failing webhooks on existing courses
            return NextResponse.json({ success: false, message: err.message });
        }
    } catch (error: any) {
        console.error("Sanity Webhook Auto-Sync Error:", error);
        return NextResponse.json({ error: error.message || "Failed to process auto-sync webhook" }, { status: 500 });
    }
}
