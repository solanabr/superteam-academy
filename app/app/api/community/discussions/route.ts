import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { serverAuth } from "@/lib/auth";
import { createDiscussion } from "@/lib/community-cms";
import { syncUserToSanity } from "@/lib/sanity-users";
import type { DiscussionCategory } from "@superteam-academy/cms";

const VALID_CATEGORIES: DiscussionCategory[] = [
	"announcements",
	"technicalQA",
	"projectShowcase",
	"featureRequests",
	"studyGroups",
	"offTopic",
];

const MAX_TITLE_LENGTH = 200;
const MAX_CONTENT_LENGTH = 10_000;
const MAX_TAGS = 5;
const MAX_TAG_LENGTH = 50;

export async function POST(request: Request) {
	const requestHeaders = await headers();
	const session = await serverAuth.api.getSession({ headers: requestHeaders });
	if (!session) {
		return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
	}

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
	}

	if (!body || typeof body !== "object") {
		return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
	}

	const data = body as Record<string, unknown>;

	const title = typeof data.title === "string" ? data.title.trim() : "";
	const content = typeof data.content === "string" ? data.content.trim() : "";
	const category = typeof data.category === "string" ? data.category : "";
	const tags = Array.isArray(data.tags)
		? data.tags
				.filter((t): t is string => typeof t === "string" && t.trim().length > 0)
				.map((t) => t.trim().slice(0, MAX_TAG_LENGTH))
		: [];

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

	const sanityUser = await syncUserToSanity({
		authId: session.user.id,
		name: session.user.name,
		email: session.user.email,
		image: session.user.image || "",
	});

	if(!sanityUser) {
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

	return NextResponse.json({ slug: result.slug }, { status: 201 });
}
