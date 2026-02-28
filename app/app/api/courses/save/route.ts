import { NextResponse } from "next/server";

import { getUserByAuthId } from "@/lib/sanity-users";
import { requireSession, sanityWriteClient } from "@/lib/route-utils";

export async function POST(request: Request) {
	const auth = await requireSession();
	if (!auth.ok) return auth.response;

	const body = (await request.json()) as Record<string, unknown>;
	const courseId = typeof body.courseId === "string" ? body.courseId.trim() : null;
	if (!courseId) {
		return NextResponse.json({ error: "courseId is required" }, { status: 400 });
	}

	if (!sanityWriteClient) {
		return NextResponse.json({ error: "CMS not configured" }, { status: 503 });
	}

	const user = await getUserByAuthId(auth.session.user.id);
	if (!user) {
		return NextResponse.json({ error: "User not found" }, { status: 404 });
	}

	const savedCourses = user.savedCourses ?? [];
	const isSaved = savedCourses.includes(courseId);

	const updatedCourses = isSaved
		? savedCourses.filter((id) => id !== courseId)
		: [...savedCourses, courseId];

	await sanityWriteClient.patch(user._id).set({ savedCourses: updatedCourses }).commit();

	return NextResponse.json({ saved: !isSaved, savedCourses: updatedCourses });
}

export async function GET() {
	const auth = await requireSession();
	if (!auth.ok) return auth.response;

	const user = await getUserByAuthId(auth.session.user.id);
	if (!user) {
		return NextResponse.json({ savedCourses: [] });
	}

	return NextResponse.json({ savedCourses: user.savedCourses ?? [] });
}
