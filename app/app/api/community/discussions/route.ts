import { NextResponse } from "next/server";
import { createDiscussion } from "@/lib/community-cms";
import { syncUserToSanity } from "@/lib/sanity-users";
import { evaluateContentModeration, enqueueModerationItem } from "@/lib/community-moderation";
import {
	requireSession,
	MAX_TITLE_LENGTH,
	MAX_TAGS,
	parseTags,
	parseJsonBody,
} from "@/lib/route-utils";
import type { DiscussionCategory } from "@superteam-academy/cms";

const VALID_CATEGORIES: DiscussionCategory[] = [
	"announcements",
	"technicalQA",
	"projectShowcase",
	"featureRequests",
	"studyGroups",
	"offTopic",
];

const MAX_CONTENT_LENGTH = 10_000;

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

	const title = typeof data.title === "string" ? data.title.trim() : "";
	const content = typeof data.content === "string" ? data.content.trim() : "";
	const category = typeof data.category === "string" ? data.category : "";
	const tags = parseTags(data.tags);

	if (!title || title.length > MAX_TITLE_LENGTH) {
		return NextResponse.json(
			{ error: "Title is required (max 200 characters)" },
			{ status: 400 }
		);
	}
	if (!content || content.length > MAX_CONTENT_LENGTH) {
		return NextResponse.json(
			{ error: "Content is required (max 10000 characters)" },
			{ status: 400 }
		);
	}
	if (!VALID_CATEGORIES.includes(category as DiscussionCategory)) {
		return NextResponse.json({ error: "Invalid category" }, { status: 400 });
	}
	if (tags.length > MAX_TAGS) {
		return NextResponse.json({ error: "Maximum 5 tags allowed" }, { status: 400 });
	}

	const moderation = evaluateContentModeration(`${title}\n${content}\n${tags.join(" ")}`);
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

	const result = await createDiscussion({
		title,
		content,
		category: category as DiscussionCategory,
		tags,
		authorId: sanityUser._id,
	});

	if (!result.success) {
		return NextResponse.json(
			{ error: result.error || "Failed to create discussion" },
			{ status: 500 }
		);
	}

	if (moderation.status === "needs_review") {
		enqueueModerationItem({
			target: "discussion",
			title,
			slug: result.slug,
			authorId: sanityUser._id,
			decision: moderation,
		});
	}

	return NextResponse.json(
		{
			slug: result.slug,
			moderationStatus: moderation.status,
			moderationReasons: moderation.reasons,
		},
		{ status: 201 }
	);
}
