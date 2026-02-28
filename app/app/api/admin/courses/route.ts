import { type NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { serverAuth } from "@/lib/auth";
import { isUserAdmin } from "@/lib/sanity-users";
import { createSanityClient } from "@superteam-academy/cms";
import { courseFields } from "@superteam-academy/cms/queries";

function sanityWriteClient() {
	const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
	const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production";
	const token = process.env.SANITY_API_WRITE_TOKEN;
	if (!projectId || !token) return null;
	return createSanityClient({ projectId, dataset, token, useCdn: false });
}

function sanityReadClient() {
	const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
	const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production";
	const token = process.env.SANITY_API_READ_TOKEN;
	if (!projectId || !token) return null;
	return createSanityClient({ projectId, dataset, token, useCdn: false });
}

export async function GET() {
	const requestHeaders = await headers();
	const session = await serverAuth.api.getSession({ headers: requestHeaders });

	if (!session) {
		return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
	}

	const admin = await isUserAdmin(session.user.id, session.user.email);
	if (!admin) {
		return NextResponse.json({ error: "Forbidden" }, { status: 403 });
	}

	const client = sanityReadClient();
	if (!client) {
		return NextResponse.json({ error: "Sanity not configured" }, { status: 500 });
	}

	// Fetch ALL courses (including unpublished)
	const courses = await client.fetch(
		`*[_type == "course"] | order(_createdAt desc) {
			${courseFields},
			"moduleCount": count(*[_type == "module" && references(^._id)]),
			"lessonCount": count(*[_type == "lesson" && references(*[_type == "module" && references(^._id)][]._id)])
		}`
	);

	return NextResponse.json({ courses });
}

export async function POST(request: NextRequest) {
	const requestHeaders = await headers();
	const session = await serverAuth.api.getSession({ headers: requestHeaders });

	if (!session) {
		return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
	}

	const admin = await isUserAdmin(session.user.id, session.user.email);
	if (!admin) {
		return NextResponse.json({ error: "Forbidden" }, { status: 403 });
	}

	const client = sanityWriteClient();
	if (!client) {
		return NextResponse.json({ error: "Sanity write token not configured" }, { status: 500 });
	}

	const body = (await request.json()) as {
		title: string;
		description?: string;
		level: string;
		duration?: string;
		xpReward: number;
		track?: string;
		published?: boolean;
		modules?: Array<{
			title: string;
			description?: string;
			order: number;
			lessons: Array<{
				title: string;
				order: number;
				xpReward: number;
				duration?: string;
			}>;
		}>;
	};

	if (!body.title) {
		return NextResponse.json({ error: "Title is required" }, { status: 400 });
	}

	const slug = body.title
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-|-$/g, "");

	// Create the course document
	const course = await client.create({
		_type: "course",
		title: body.title,
		slug: { _type: "slug", current: slug },
		description: body.description ?? "",
		level: body.level || "beginner",
		duration: body.duration ?? "",
		xpReward: body.xpReward || 100,
		track: body.track ?? "",
		published: body.published ?? false,
		onchainStatus: "draft",
	});

	// Create modules and lessons
	if (body.modules && body.modules.length > 0) {
		for (const mod of body.modules) {
			const moduleDoc = await client.create({
				_type: "module",
				title: mod.title,
				slug: {
					_type: "slug",
					current: mod.title
						.toLowerCase()
						.replace(/[^a-z0-9]+/g, "-")
						.replace(/^-|-$/g, ""),
				},
				description: mod.description ?? "",
				order: mod.order,
				course: { _ref: course._id },
			});

			for (const lesson of mod.lessons) {
				await client.create({
					_type: "lesson",
					title: lesson.title,
					slug: {
						_type: "slug",
						current: lesson.title
							.toLowerCase()
							.replace(/[^a-z0-9]+/g, "-")
							.replace(/^-|-$/g, ""),
					},
					order: lesson.order,
					xpReward: lesson.xpReward,
					duration: lesson.duration ?? "",
					module: { _ref: moduleDoc._id },
				});
			}
		}
	}

	return NextResponse.json({ course }, { status: 201 });
}
