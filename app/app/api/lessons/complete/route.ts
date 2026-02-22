import { NextResponse } from "next/server";
import { Keypair, PublicKey, Transaction } from "@solana/web3.js";
import { buildCompleteLessonInstruction } from "@superteam/anchor";
import { findToken2022ATA } from "@superteam/solana";
import { getLinkedWallet } from "@/lib/auth";
import { getAcademyClient, getProgramId, getSolanaConnection } from "@/lib/academy";

function loadBackendSigner(): Keypair {
	const secret = process.env.BACKEND_SIGNER_SECRET_KEY;
	if (!secret) throw new Error("BACKEND_SIGNER_SECRET_KEY is required");
	return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(secret)));
}

export async function POST(request: Request) {
	try {
		const wallet = await getLinkedWallet();
		if (!wallet) {
			return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
		}

		const body = await request.json();
		const { courseId, lessonIndex } = body as { courseId?: string; lessonIndex?: number };
		if (!courseId || lessonIndex == null || lessonIndex < 0) {
			return NextResponse.json(
				{ error: "courseId and lessonIndex are required" },
				{ status: 400 }
			);
		}

		const connection = getSolanaConnection();
		const client = getAcademyClient();
		const programId = getProgramId();
		const backendKeypair = loadBackendSigner();
		const learner = new PublicKey(wallet);

		const config = await client.fetchConfig();
		if (!config) {
			return NextResponse.json({ error: "Config not found" }, { status: 500 });
		}
		const xpMint = config.xpMint;
		const learnerTokenAccount = findToken2022ATA(learner, xpMint);

		const ix = buildCompleteLessonInstruction({
			courseId,
			lessonIndex,
			learner,
			learnerTokenAccount,
			xpMint,
			backendSigner: backendKeypair.publicKey,
			programId,
		});

		const tx = new Transaction().add(ix);
		tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
		tx.feePayer = backendKeypair.publicKey;
		tx.sign(backendKeypair);

		const signature = await connection.sendRawTransaction(tx.serialize());
		await connection.confirmTransaction(signature, "confirmed");

		return NextResponse.json({ signature });
	} catch (error) {
		console.error("complete_lesson error:", error);
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}
