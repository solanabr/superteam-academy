
import { Connection, Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import { Program, AnchorProvider, BN } from "@coral-xyz/anchor";
import { createClient } from "next-sanity";
// @ts-ignore
import onchainAcademyIdl from "../src/lib/idl/onchain_academy.json";
import bs58 from "bs58";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const SANITY_PROJECT_ID = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const SANITY_DATASET = process.env.NEXT_PUBLIC_SANITY_DATASET;
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || "https://api.devnet.solana.com";
const ADMIN_WALLET_KEY = process.env.ADMIN_WALLET_PRIVATE_KEY || process.env.BACKEND_WALLET_PRIVATE_KEY;

if (!ADMIN_WALLET_KEY) {
    console.error("ADMIN_WALLET_PRIVATE_KEY is required");
    process.exit(1);
}

const sanityClient = createClient({
    projectId: SANITY_PROJECT_ID as string,
    dataset: SANITY_DATASET as string,
    apiVersion: "2024-01-01",
    useCdn: false,
});

async function syncCourse(slug: string) {
    console.log(`Syncing Course: ${slug}...`);

    const course = await sanityClient.fetch(`*[_type == "course" && slug.current == $slug][0]`, { slug });
    if (!course) {
        console.error("Course not found in Sanity");
        return;
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

    console.log("Creating/Ensuring course on-chain...");

    try {
        const tx = await program.methods
            .createCourse({
                courseId: slug,
                creator: adminWallet.publicKey,
                version: 1,
                lessonCount: 20,
                difficulty: 1,
                xpPerLesson: 50,
                trackId: 1,
                trackLevel: 1,
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

        console.log("Course Created! Tx:", tx);
    } catch (err: any) {
        console.error("Failed to create course:", err.message);
    }
}

const slugArg = process.argv[2];
if (!slugArg) {
    console.log("Usage: ts-node scripts/sync-course.ts <slug>");
} else {
    syncCourse(slugArg);
}
