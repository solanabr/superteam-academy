import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { PublicKey } from "@solana/web3.js";

import { serverAuth, getLinkedWallet } from "@/lib/auth";
import { getCourseById } from "@/lib/cms";
import { cmsContext } from "@/lib/cms-context";
import { getAcademyClient } from "@/lib/academy";
import { syncUserToSanity } from "@/lib/sanity-users";

const MIN_RATING = 1;
const MAX_RATING = 5;

function parsePayload(
	payload: unknown
): { courseId: string; rating: number; comment: string } | null {
	if (!payload || typeof payload !== "object") return null;
	const data = payload as Record<string, unknown>;
	if (typeof data.courseId !== "string") return null;
	if (typeof data.rating !== "number") return null;
	if (typeof data.comment !== "string") return null;
	const rating = Math.max(MIN_RATING, Math.min(MAX_RATING, Math.round(data.rating)));
	const comment = data.comment.trim();
	if (!comment) return null;
	return { courseId: data.courseId, rating, comment };
}

export async function POST(request: Request) {
	const requestHeaders = await headers();
	const session = await serverAuth.api.getSession({ headers: requestHeaders });
	if (!session) {
		return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
	}

	const payload = parsePayload(await request.json());
	if (!payload) {
		return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
	}

	if (!cmsContext.writeClient) {
		return NextResponse.json({ error: "Reviews are unavailable" }, { status: 503 });
	}

	const course = await getCourseById(payload.courseId);
	if (!course) {
		return NextResponse.json({ error: "Course not found" }, { status: 404 });
	}

	const wallet = await getLinkedWallet();
	if (!wallet) {
		return NextResponse.json({ error: "Wallet not linked" }, { status: 403 });
	}

	const academyClient = getAcademyClient();
	try {
		const enrollment = await academyClient.fetchEnrollment(
			payload.courseId,
			new PublicKey(wallet)
		);
		if (!enrollment) {
			return NextResponse.json({ error: "Not enrolled" }, { status: 403 });
		}
	} catch (error) {
		console.error("Enrollment check failed", error);
		return NextResponse.json({ error: "Enrollment check failed" }, { status: 500 });
	}

	const syncPayload: {
		authId: string;
		name: string;
		email: string;
		walletAddress?: string;
		image?: string;
	} = {
		authId: session.user.id,
		name: session.user.name,
		email: session.user.email,
		walletAddress: wallet,
	};

	if (session.user.image) {
		syncPayload.image = session.user.image;
	}

	const sanityUser = await syncUserToSanity(syncPayload);

	const createdAt = new Date().toISOString();
	const reviewDoc: {
		_type: "courseReview";
		course: { _type: "reference"; _ref: string };
		rating: number;
		comment: string;
		createdAt: string;
		helpful: number;
		authorName: string;
		user?: { _type: "reference"; _ref: string };
	} = {
		_type: "courseReview",
		course: { _type: "reference", _ref: course._id },
		rating: payload.rating,
		comment: payload.comment,
		createdAt,
		helpful: 0,
		authorName: session.user.name,
	};

	if (sanityUser) {
		reviewDoc.user = { _type: "reference", _ref: sanityUser._id };
	}

	let reviewId = "";
	try {
		const created = await cmsContext.writeClient.create(reviewDoc);
		reviewId = created._id;
	} catch (error) {
		console.error("Review creation failed", error);
		return NextResponse.json({ error: "Review creation failed" }, { status: 500 });
	}

	return NextResponse.json({
		id: reviewId,
		user: {
			name: session.user.name,
			avatar: session.user.image ?? "",
		},
		rating: payload.rating,
		date: createdAt,
		comment: payload.comment,
		helpful: 0,
	});
}
