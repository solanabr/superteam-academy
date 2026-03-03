import { NextResponse } from "next/server";
import { Transaction } from "@solana/web3.js";
import { buildFinalizeCourseInstruction, countCompletedLessons } from "@superteam-academy/anchor";
import { findToken2022ATA } from "@superteam-academy/solana";
import { initOnchainRoute, signAndSendTransaction } from "@/lib/route-utils";

export async function POST(request: Request) {
	try {
		const init = await initOnchainRoute();
		if (!init.ok) return init.response;
		const { learner, client, programId, backendKeypair } = init;

		const body = await request.json();
		const { courseId } = body as { courseId?: string };
		if (!courseId) {
			return NextResponse.json({ error: "courseId is required" }, { status: 400 });
		}

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

		const enrollment = await client.fetchEnrollment(courseId, learner);
		if (!enrollment) {
			return NextResponse.json({ error: "Not enrolled in this course" }, { status: 403 });
		}
		if (enrollment.completedAt) {
			return NextResponse.json({ error: "Course already finalized" }, { status: 409 });
		}
		const completed = countCompletedLessons(enrollment.lessonFlags);
		if (completed < course.lessonCount) {
			return NextResponse.json(
				{ error: `Not all lessons completed (${completed}/${course.lessonCount})` },
				{ status: 400 }
			);
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
		const signature = await signAndSendTransaction(tx, backendKeypair);
		return NextResponse.json({ signature });
	} catch (error) {
		console.error("finalize_course error:", error);
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}
