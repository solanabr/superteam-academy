import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { serverAuth } from "@/lib/auth";
import { createProject } from "@/lib/community-cms";
import { syncUserToSanity } from "@/lib/sanity-users";
import { evaluateContentModeration, enqueueModerationItem } from "@/lib/community-moderation";
import type { ProjectCategory } from "@superteam-academy/cms";

const VALID_CATEGORIES: ProjectCategory[] = ["defi", "nft", "tooling", "gaming", "social", "infra"];

const MAX_TITLE_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 5000;
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
	const description = typeof data.description === "string" ? data.description.trim() : "";
	const category = typeof data.category === "string" ? data.category : "";
	const githubUrl =
		typeof data.githubUrl === "string" && data.githubUrl.trim()
			? data.githubUrl.trim()
			: undefined;
	const liveUrl =
		typeof data.liveUrl === "string" && data.liveUrl.trim() ? data.liveUrl.trim() : undefined;
	const xpReward =
		typeof data.xpReward === "number" && data.xpReward >= 0 ? data.xpReward : undefined;
	const tags = Array.isArray(data.tags)
		? data.tags
				.filter((t): t is string => typeof t === "string" && t.trim().length > 0)
				.map((t) => t.trim().slice(0, MAX_TAG_LENGTH))
		: [];

	if (!title || title.length > MAX_TITLE_LENGTH) {
		return NextResponse.json(
			{ error: "Title is required (max 100 characters)" },
			{ status: 400 }
		);
	}
	if (!description || description.length > MAX_DESCRIPTION_LENGTH) {
		return NextResponse.json(
			{ error: "Description is required (max 5000 characters)" },
			{ status: 400 }
		);
	}
	if (!VALID_CATEGORIES.includes(category as ProjectCategory)) {
		return NextResponse.json({ error: "Invalid category" }, { status: 400 });
	}
	if (tags.length > MAX_TAGS) {
		return NextResponse.json({ error: "Maximum 5 tags allowed" }, { status: 400 });
	}

	const moderation = evaluateContentModeration(
		`${title}\n${description}\n${tags.join(" ")}\n${githubUrl ?? ""}\n${liveUrl ?? ""}`
	);
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

	const result = await createProject({
		title,
		description,
		category: category as ProjectCategory,
		tags,
		authorId: sanityUser._id,
		githubUrl,
		liveUrl,
		xpReward,
	});

	if (!result.success) {
		return NextResponse.json(
			{ error: result.error || "Failed to create project" },
			{ status: 500 }
		);
	}

	if (moderation.status === "needs_review") {
		enqueueModerationItem({
			target: "project",
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
