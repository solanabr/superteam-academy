import { NextRequest, NextResponse } from "next/server";
import { serverClient } from "@/sanity/lib/server-client";
import { prisma } from "@/lib/db";
import { Connection, Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import { Program, AnchorProvider } from "@coral-xyz/anchor";
// @ts-ignore
import onchainAcademyIdl from "@/lib/idl/onchain_academy.json";
import bs58 from "bs58";
import { withFallbackRPC } from "@/lib/solana-connection";

const RPC_URL = process.env.NEXT_PUBLIC_HELIUS_RPC_URL || process.env.NEXT_PUBLIC_RPC_URL || "https://api.devnet.solana.com";
const BACKEND_WALLET_KEY = process.env.BACKEND_WALLET_PRIVATE_KEY;

/**
 * POST /api/courses/[id]/publish
 * Publish a course (set published: true)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { wallet } = body;

    if (!wallet || typeof wallet !== "string") {
      return NextResponse.json({ error: "Wallet address is required" }, { status: 400 });
    }

    // Verify user and permissions
    const user = await prisma.user.findUnique({
      where: { walletAddress: wallet },
      select: { id: true, role: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get course to check ownership and gather data for on-chain
    const course = await serverClient.fetch(
      `*[_type == "course" && _id == $id][0] { 
        createdBy,
        "lessonCount": count(modules[]->lessons[]->_id)
      }`,
      { id }
    );

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Only creator or admin can publish (students and other professors are blocked)
    const canPublish =
      user.role === "admin" ||
      course.createdBy?.userId === user.id;

    if (!canPublish) {
      return NextResponse.json(
        { error: "You don't have permission to publish this course" },
        { status: 403 }
      );
    }

    // Publish: set published to true
    // Sanity handles draft/published versions automatically
    // We patch by query to update both draft and published if they exist
    const publishedId = id.startsWith("drafts.") ? id.replace("drafts.", "") : id;

    // Auto-sync to blockchain if not already explicitly done, or as part of this step
    if (BACKEND_WALLET_KEY && process.env.NEXT_PUBLIC_USE_ONCHAIN === "true") {
      try {
        await withFallbackRPC(async (connection) => {
          const backendWallet = Keypair.fromSecretKey(bs58.decode(BACKEND_WALLET_KEY));

          const provider = new AnchorProvider(
            connection,
            // @ts-ignore
            { publicKey: backendWallet.publicKey, signTransaction: async (tx) => { tx.sign(backendWallet); return tx; }, signAllTransactions: async (txs) => { txs.forEach(t => t.sign(backendWallet)); return txs; } },
            AnchorProvider.defaultOptions()
          );

          const program = new Program(onchainAcademyIdl as any, provider);

          const [coursePda] = PublicKey.findProgramAddressSync(
            [Buffer.from("course"), Buffer.from(publishedId)],
            program.programId
          );
          const [configPda] = PublicKey.findProgramAddressSync(
            [Buffer.from("config")],
            program.programId
          );

          // Check if course account already exists
          const courseAccountInfo = await connection.getAccountInfo(coursePda);

          if (!courseAccountInfo) {
            console.log(`Creating course on-chain: ${publishedId}`);
            const creatorPubkey = new PublicKey(wallet);
            const lessonCount = course.lessonCount || 1;

            const tx = await program.methods
              .createCourse({
                courseId: publishedId.substring(0, 32),
                creator: creatorPubkey,
                contentTxId: Array(32).fill(0),
                lessonCount: lessonCount,
                difficulty: 1,
                xpPerLesson: 100,
                trackId: 1,
                trackLevel: 1,
                prerequisite: null,
                creatorRewardXp: 500,
                minCompletionsForReward: 10,
              } as any)
              .accounts({
                course: coursePda,
                config: configPda,
                authority: backendWallet.publicKey,
                systemProgram: SystemProgram.programId,
              } as any)
              .transaction();

            tx.feePayer = backendWallet.publicKey;
            tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
            tx.sign(backendWallet);

            const sig = await connection.sendRawTransaction(tx.serialize());
            await connection.confirmTransaction(sig);
            console.log("On-chain course created, tx signature:", sig);
          }
        });
      } catch (onchainError) {
        console.error("Failed to sync course on-chain during publish:", onchainError);
        // We log the error but still proceed with Sanity publishing to unblock user
        // An ideal system might enqueue this for retry.
      }
    }

    // Update both draft and published versions
    await Promise.all([
      serverClient.patch(publishedId).set({ published: true }).commit().catch(() => null),
      serverClient.patch(`drafts.${publishedId}`).set({ published: true }).commit().catch(() => null),
    ]);

    return NextResponse.json({ success: true, published: true });
  } catch (error: any) {
    console.error("Error publishing course:", error);

    if (error.message?.includes("Insufficient permissions") || error.statusCode === 403) {
      return NextResponse.json(
        {
          error: "API token lacks write permissions. Please create a new token with Editor role in Sanity dashboard (Settings → API → Tokens). See docs/SANITY_TOKEN_SETUP.md for details.",
          details: error.message
        },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Failed to publish course" },
      { status: 500 }
    );
  }
}
