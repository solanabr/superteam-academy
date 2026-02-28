import { NextResponse } from "next/server";
import {
	requireSession,
	parseJsonBody,
	sanityWriteClient,
	sanityReadClient,
} from "@/lib/route-utils";
import { syncUserToSanity } from "@/lib/sanity-users";
import { notesByLessonAndUserQuery } from "@superteam-academy/cms";

const MAX_TITLE_LENGTH = 200;
const MAX_CONTENT_LENGTH = 5000;

export async function GET(request: Request) {
	const auth = await requireSession();
	if (!auth.ok) return auth.response;

	const { searchParams } = new URL(request.url);
	const lessonId = searchParams.get("lessonId");

	if (!lessonId) {
		return NextResponse.json({ error: "lessonId is required" }, { status: 400 });
	}

	const sanityUser = await syncUserToSanity({
		authId: auth.session.user.id,
		name: auth.session.user.name,
		email: auth.session.user.email,
		image: auth.session.user.image || "",
	});

	if (!sanityUser || !sanityReadClient) {
		return NextResponse.json({ notes: [] });
	}

	const notes = await sanityReadClient.fetch(notesByLessonAndUserQuery, {
		lessonId,
		userId: sanityUser._id,
	});

	return NextResponse.json({ notes: notes || [] });
}

export async function POST(request: Request) {
	const auth = await requireSession();
	if (!auth.ok) return auth.response;

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
	}

	const data = parseJsonBody(body);
	if (!data) {
		return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
	}

	const lessonId = typeof data.lessonId === "string" ? data.lessonId.trim() : "";
	const title = typeof data.title === "string" ? data.title.trim() : "";
	const content = typeof data.content === "string" ? data.content.trim() : "";
	const timestamp = typeof data.timestamp === "number" ? data.timestamp : 0;

	if (!lessonId) {
		return NextResponse.json({ error: "lessonId is required" }, { status: 400 });
	}
	if (!title || title.length > MAX_TITLE_LENGTH) {
		return NextResponse.json(
			{ error: "Title is required (max 200 characters)" },
			{ status: 400 }
		);
	}
	if (!content || content.length > MAX_CONTENT_LENGTH) {
		return NextResponse.json(
			{ error: "Content is required (max 5000 characters)" },
			{ status: 400 }
		);
	}

	if (!sanityWriteClient) {
		return NextResponse.json({ error: "CMS not configured" }, { status: 500 });
	}

	const sanityUser = await syncUserToSanity({
		authId: auth.session.user.id,
		name: auth.session.user.name,
		email: auth.session.user.email,
		image: auth.session.user.image || "",
	});

	if (!sanityUser) {
		return NextResponse.json({ error: "Failed to sync user" }, { status: 500 });
	}

	const doc = await sanityWriteClient.create({
		_type: "lessonNote" as const,
		lessonId,
		user: { _type: "reference", _ref: sanityUser._id },
		title,
		content,
		timestamp,
	});

	return NextResponse.json(
		{ note: { _id: doc._id, lessonId, title, content, timestamp } },
		{ status: 201 }
	);
}

export async function PATCH(request: Request) {
	const auth = await requireSession();
	if (!auth.ok) return auth.response;

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
	}

	const data = parseJsonBody(body);
	if (!data) {
		return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
	}

	const noteId = typeof data.noteId === "string" ? data.noteId.trim() : "";
	const title = typeof data.title === "string" ? data.title.trim() : undefined;
	const content = typeof data.content === "string" ? data.content.trim() : undefined;

	if (!noteId) {
		return NextResponse.json({ error: "noteId is required" }, { status: 400 });
	}

	if (!sanityWriteClient || !sanityReadClient) {
		return NextResponse.json({ error: "CMS not configured" }, { status: 500 });
	}

	const sanityUser = await syncUserToSanity({
		authId: auth.session.user.id,
		name: auth.session.user.name,
		email: auth.session.user.email,
		image: auth.session.user.image || "",
	});

	if (!sanityUser) {
		return NextResponse.json({ error: "Failed to sync user" }, { status: 500 });
	}

	// Verify ownership
	const existing = await sanityReadClient.fetch(
		`*[_type == "lessonNote" && _id == $noteId && user._ref == $userId][0]{ _id }`,
		{ noteId, userId: sanityUser._id }
	);

	if (!existing) {
		return NextResponse.json({ error: "Note not found" }, { status: 404 });
	}

	const updates: Record<string, unknown> = {};
	if (title) updates.title = title;
	if (content) updates.content = content;

	await sanityWriteClient.patch(noteId).set(updates).commit();

	return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
	const auth = await requireSession();
	if (!auth.ok) return auth.response;

	const { searchParams } = new URL(request.url);
	const noteId = searchParams.get("noteId");

	if (!noteId) {
		return NextResponse.json({ error: "noteId is required" }, { status: 400 });
	}

	if (!sanityWriteClient || !sanityReadClient) {
		return NextResponse.json({ error: "CMS not configured" }, { status: 500 });
	}

	const sanityUser = await syncUserToSanity({
		authId: auth.session.user.id,
		name: auth.session.user.name,
		email: auth.session.user.email,
		image: auth.session.user.image || "",
	});

	if (!sanityUser) {
		return NextResponse.json({ error: "Failed to sync user" }, { status: 500 });
	}

	// Verify ownership
	const existing = await sanityReadClient.fetch(
		`*[_type == "lessonNote" && _id == $noteId && user._ref == $userId][0]{ _id }`,
		{ noteId, userId: sanityUser._id }
	);

	if (!existing) {
		return NextResponse.json({ error: "Note not found" }, { status: 404 });
	}

	await sanityWriteClient.delete(noteId);

	return NextResponse.json({ success: true });
}
