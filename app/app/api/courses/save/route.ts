import { NextResponse } from "next/server";
import { headers } from "next/headers";

import { serverAuth } from "@/lib/auth";
import { getUserByAuthId } from "@/lib/sanity-users";
import { writeClient } from "@/lib/cms-context";

export async function POST(request: Request) {
	const requestHeaders = await headers();
	const session = await serverAuth.api.getSession({ headers: requestHeaders });
	if (!session) {
		return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
	}

	const body = (await request.json()) as Record<string, unknown>;
	const courseId = typeof body.courseId === "string" ? body.courseId.trim() : null;
	if (!courseId) {
		return NextResponse.json({ error: "courseId is required" }, { status: 400 });
	}

	if (!writeClient) {
		return NextResponse.json({ error: "CMS not configured" }, { status: 503 });
	}

	const user = await getUserByAuthId(session.user.id);
	if (!user) {
		return NextResponse.json({ error: "User not found" }, { status: 404 });
	}

	const savedCourses = user.savedCourses ?? [];
	const isSaved = savedCourses.includes(courseId);

	const updatedCourses = isSaved
		? savedCourses.filter((id) => id !== courseId)
		: [...savedCourses, courseId];

	await writeClient.patch(user._id).set({ savedCourses: updatedCourses }).commit();

	return NextResponse.json({ saved: !isSaved, savedCourses: updatedCourses });
}

export async function GET() {
	const requestHeaders = await headers();
	const session = await serverAuth.api.getSession({ headers: requestHeaders });
	if (!session) {
		return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
	}

	const user = await getUserByAuthId(session.user.id);
	if (!user) {
		return NextResponse.json({ savedCourses: [] });
	}

	return NextResponse.json({ savedCourses: user.savedCourses ?? [] });
}
