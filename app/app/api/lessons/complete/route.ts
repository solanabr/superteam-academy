import { NextResponse } from "next/server";
import { Transaction } from "@solana/web3.js";
import { buildCompleteLessonInstruction, isLessonCompleted } from "@superteam-academy/anchor";
import { initOnchainRoute, signAndSendTransaction, ensureToken2022ATA } from "@/lib/route-utils";

export async function POST(request: Request) {
	try {
		const init = await initOnchainRoute();
		if (!init.ok) return init.response;
		const { learner, client, programId, backendKeypair } = init;

		const body = await request.json();
		const { courseId, lessonIndex } = body as { courseId?: string; lessonIndex?: number };
		if (!courseId || lessonIndex == null || lessonIndex < 0) {
			return NextResponse.json(
				{ error: "courseId and lessonIndex are required" },
				{ status: 400 }
			);
		}

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

		const tx = new Transaction();
		const learnerTokenAccount = await ensureToken2022ATA(
			tx,
			learner,
			config.xpMint,
			backendKeypair
		);

		const ix = buildCompleteLessonInstruction({
			courseId,
			lessonIndex,
			learner,
			learnerTokenAccount,
			xpMint: config.xpMint,
			backendSigner: backendKeypair.publicKey,
			programId,
		});

		tx.add(ix);
		const signature = await signAndSendTransaction(tx, backendKeypair);
		return NextResponse.json({ signature });
	} catch (error) {
		console.error("complete_lesson error:", error);
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}
