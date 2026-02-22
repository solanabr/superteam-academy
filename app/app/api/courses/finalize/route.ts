import { NextResponse } from "next/server";
import { Keypair, PublicKey, Transaction } from "@solana/web3.js";
import { buildFinalizeCourseInstruction } from "@superteam/anchor";
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
		const { courseId } = body as { courseId?: string };
		if (!courseId) {
			return NextResponse.json({ error: "courseId is required" }, { status: 400 });
		}

		const connection = getSolanaConnection();
		const client = getAcademyClient();
		const programId = getProgramId();
		const backendKeypair = loadBackendSigner();
		const learner = new PublicKey(wallet);

		const [config, course] = await Promise.all([
			client.fetchConfig(),
			client.fetchCourse(courseId),
		]);

		if (!config) {
			return NextResponse.json({ error: "Config not found" }, { status: 500 });
		}
		if (!course) {
			return NextResponse.json({ error: "Course not found" }, { status: 404 });
		}

		const xpMint = config.xpMint;
		const learnerTokenAccount = findToken2022ATA(learner, xpMint);
		const creatorTokenAccount = findToken2022ATA(course.creator, xpMint);

		const ix = buildFinalizeCourseInstruction({
			courseId,
			learner,
			learnerTokenAccount,
			creatorTokenAccount,
			creator: course.creator,
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
		console.error("finalize_course error:", error);
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}
