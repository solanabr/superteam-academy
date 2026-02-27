import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { serverAuth } from "@/lib/auth";
import { createEvent } from "@/lib/community-cms";
import { evaluateContentModeration, enqueueModerationItem } from "@/lib/community-moderation";
import type { EventType } from "@superteam-academy/cms";

const VALID_TYPES: EventType[] = ["Workshop", "AMA", "Hackathon", "Meetup"];
const TYPE_MAP: Record<string, EventType> = {
	workshop: "Workshop",
	ama: "AMA",
	hackathon: "Hackathon",
	meetup: "Meetup",
};

const MAX_TITLE_LENGTH = 200;
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
	const typeRaw = typeof data.type === "string" ? data.type : "";
	const type =
		TYPE_MAP[typeRaw] ||
		(VALID_TYPES.includes(typeRaw as EventType) ? (typeRaw as EventType) : null);
	const startDate = typeof data.startDate === "string" ? data.startDate.trim() : "";
	const endDate =
		typeof data.endDate === "string" && data.endDate.trim() ? data.endDate.trim() : undefined;
	const timezone = typeof data.timezone === "string" ? data.timezone.trim() : "";
	const isOnline = typeof data.isOnline === "boolean" ? data.isOnline : true;
	const location =
		!isOnline && typeof data.location === "string" ? data.location.trim() : undefined;
	const maxAttendees =
		typeof data.maxAttendees === "number" && data.maxAttendees > 0 ? data.maxAttendees : 0;
	const registrationUrl =
		typeof data.registrationUrl === "string" && data.registrationUrl.trim()
			? data.registrationUrl.trim()
			: undefined;
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
	if (!description || description.length > MAX_DESCRIPTION_LENGTH) {
		return NextResponse.json(
			{ error: "Description is required (max 5000 characters)" },
			{ status: 400 }
		);
	}
	if (!type) {
		return NextResponse.json({ error: "Invalid event type" }, { status: 400 });
	}
	if (!startDate) {
		return NextResponse.json({ error: "Start date is required" }, { status: 400 });
	}
	if (!timezone) {
		return NextResponse.json({ error: "Timezone is required" }, { status: 400 });
	}
	if (tags.length > MAX_TAGS) {
		return NextResponse.json({ error: "Maximum 5 tags allowed" }, { status: 400 });
	}

	const moderation = evaluateContentModeration(
		`${title}\n${description}\n${tags.join(" ")}\n${location ?? ""}`
	);
	if (moderation.status === "rejected") {
		return NextResponse.json(
			{ error: "Content rejected by moderation checks", reasons: moderation.reasons },
			{ status: 400 }
		);
	}

	const result = await createEvent({
		title,
		description,
		type,
		startDate,
		endDate,
		timezone,
		location,
		isOnline,
		maxAttendees,
		registrationUrl,
		tags,
	});

	if (!result.success) {
		return NextResponse.json(
			{ error: result.error || "Failed to create event" },
			{ status: 500 }
		);
	}

	if (moderation.status === "needs_review") {
		enqueueModerationItem({
			target: "event",
			title,
			slug: result.slug,
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
