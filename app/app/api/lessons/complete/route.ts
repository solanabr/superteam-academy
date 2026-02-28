import { NextResponse } from "next/server";
import { PublicKey, SystemProgram, Transaction, TransactionInstruction } from "@solana/web3.js";
import { buildCompleteLessonInstruction, isLessonCompleted } from "@superteam-academy/anchor";
import {
	findToken2022ATA,
	TOKEN_2022_PROGRAM_ID,
	ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@superteam-academy/solana";
import { getLinkedWallet } from "@/lib/auth";
import { getAcademyClient, getProgramId, getSolanaConnection } from "@/lib/academy";
import { loadBackendSigner } from "@/lib/route-utils";

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

		const [config, course, enrollment] = await Promise.all([
			client.fetchConfig(),
			client.fetchCourse(courseId),
			client.fetchEnrollment(courseId, learner),
		]);
		if (!config) {
			return NextResponse.json({ error: "Config not found" }, { status: 500 });
		}
		if (!course || !course.isActive) {
			return NextResponse.json({ error: "Course not found or inactive" }, { status: 404 });
		}
		if (!enrollment) {
			return NextResponse.json({ error: "Not enrolled in this course" }, { status: 403 });
		}
		if (lessonIndex >= course.lessonCount) {
			return NextResponse.json({ error: "Invalid lesson index" }, { status: 400 });
		}
		if (isLessonCompleted(enrollment.lessonFlags, lessonIndex)) {
			return NextResponse.json({ error: "Lesson already completed" }, { status: 409 });
		}

		const xpMint = config.xpMint;
		const learnerTokenAccount = findToken2022ATA(learner, xpMint);

		const tx = new Transaction();

		// Ensure the learner's Token-2022 ATA exists (CreateIdempotent = instruction index 1)
		const ataInfo = await connection.getAccountInfo(learnerTokenAccount);
		if (!ataInfo) {
			const createAtaIx = new TransactionInstruction({
				programId: ASSOCIATED_TOKEN_PROGRAM_ID,
				keys: [
					{ pubkey: backendKeypair.publicKey, isSigner: true, isWritable: true },
					{ pubkey: learnerTokenAccount, isSigner: false, isWritable: true },
					{ pubkey: learner, isSigner: false, isWritable: false },
					{ pubkey: xpMint, isSigner: false, isWritable: false },
					{ pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
					{ pubkey: TOKEN_2022_PROGRAM_ID, isSigner: false, isWritable: false },
				],
				data: Buffer.from([1]), // CreateIdempotent
			});
			tx.add(createAtaIx);
		}

		const ix = buildCompleteLessonInstruction({
			courseId,
			lessonIndex,
			learner,
			learnerTokenAccount,
			xpMint,
			backendSigner: backendKeypair.publicKey,
			programId,
		});

		tx.add(ix);
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
