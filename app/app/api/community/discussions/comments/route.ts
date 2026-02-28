import { NextResponse } from "next/server";
import { createComment } from "@/lib/community-cms";
import { syncUserToSanity } from "@/lib/sanity-users";
import { evaluateContentModeration, enqueueModerationItem } from "@/lib/community-moderation";
import { requireSession, parseJsonBody } from "@/lib/route-utils";

const MAX_COMMENT_LENGTH = 5000;

export async function POST(request: Request) {
	const auth = await requireSession();
	if (!auth.ok) return auth.response;
	const session = auth.session;

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

	const discussionId = typeof data.discussionId === "string" ? data.discussionId.trim() : "";
	const content = typeof data.content === "string" ? data.content.trim() : "";

	if (!discussionId) {
		return NextResponse.json({ error: "discussionId is required" }, { status: 400 });
	}
	if (!content || content.length > MAX_COMMENT_LENGTH) {
		return NextResponse.json(
			{ error: "Content is required (max 5000 characters)" },
			{ status: 400 }
		);
	}

	const moderation = evaluateContentModeration(content);
	if (moderation.status === "rejected") {
		return NextResponse.json(
			{ error: "Content rejected by moderation checks", reasons: moderation.reasons },
			{ status: 400 }
		);
	}

	const sanityUser = await syncUserToSanity({
		authId: session.user.id,
		name: session.user.name,
		email: session.user.email,
		image: session.user.image || "",
	});

	if (!sanityUser) {
		return NextResponse.json({ error: "Failed to sync user" }, { status: 500 });
	}

	const result = await createComment({
		discussionId,
		content,
		authorId: sanityUser._id,
	});

	if (!result.success) {
		return NextResponse.json(
			{ error: result.error || "Failed to create comment" },
			{ status: 500 }
		);
	}

	if (moderation.status === "needs_review") {
		enqueueModerationItem({
			target: "comment",
			title: content.slice(0, 100),
			slug: result.commentId,
			authorId: sanityUser._id,
			decision: moderation,
		});
	}

	return NextResponse.json(
		{ commentId: result.commentId, moderationStatus: moderation.status },
		{ status: 201 }
	);
}
