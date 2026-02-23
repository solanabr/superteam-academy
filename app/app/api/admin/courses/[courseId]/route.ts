import { type NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { serverAuth } from "@/lib/auth";
import { isUserAdmin } from "@/lib/sanity-users";
import { createSanityClient } from "@superteam-academy/cms";
import { courseFields, moduleFields, lessonFields } from "@superteam-academy/cms/queries";

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

type RouteParams = { params: Promise<{ courseId: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
	const { courseId } = await params;
	const requestHeaders = await headers();
	const session = await serverAuth.api.getSession({ headers: requestHeaders });

	if (!session) {
		return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
	}

	const admin = await isUserAdmin(session.user.id);
	if (!admin) {
		return NextResponse.json({ error: "Forbidden" }, { status: 403 });
	}

	const client = sanityReadClient();
	if (!client) {
		return NextResponse.json({ error: "Sanity not configured" }, { status: 500 });
	}

	const course = await client.fetch(
		`*[_type == "course" && (_id == $courseId || slug.current == $courseId)][0] {
			${courseFields},
			"modules": *[_type == "module" && references(^._id)] | order(order asc) {
				${moduleFields},
				"lessons": *[_type == "lesson" && references(^._id)] | order(order asc) {
					${lessonFields}
				}
			}
		}`,
		{ courseId }
	);

	if (!course) {
		return NextResponse.json({ error: "Course not found" }, { status: 404 });
	}

	return NextResponse.json({ course });
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
	const { courseId } = await params;
	const requestHeaders = await headers();
	const session = await serverAuth.api.getSession({ headers: requestHeaders });

	if (!session) {
		return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
	}

	const admin = await isUserAdmin(session.user.id);
	if (!admin) {
		return NextResponse.json({ error: "Forbidden" }, { status: 403 });
	}

	const client = sanityWriteClient();
	if (!client) {
		return NextResponse.json({ error: "Sanity write token not configured" }, { status: 500 });
	}

	const body = (await request.json()) as Record<string, unknown>;
	const allowedFields = [
		"title",
		"description",
		"level",
		"duration",
		"xpReward",
		"track",
		"published",
	];
	const patch: Record<string, unknown> = {};

	for (const key of allowedFields) {
		if (key in body) {
			patch[key] = body[key];
		}
	}

	if (patch.title && typeof patch.title === "string") {
		patch.slug = {
			_type: "slug",
			current: (patch.title as string)
				.toLowerCase()
				.replace(/[^a-z0-9]+/g, "-")
				.replace(/^-|-$/g, ""),
		};
	}

	const updated = await client.patch(courseId).set(patch).commit();
	return NextResponse.json({ course: updated });
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
	const { courseId } = await params;
	const requestHeaders = await headers();
	const session = await serverAuth.api.getSession({ headers: requestHeaders });

	if (!session) {
		return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
	}

	const admin = await isUserAdmin(session.user.id);
	if (!admin) {
		return NextResponse.json({ error: "Forbidden" }, { status: 403 });
	}

	const client = sanityWriteClient();
	if (!client) {
		return NextResponse.json({ error: "Sanity write token not configured" }, { status: 500 });
	}

	// Delete related modules and lessons first
	const modules = await client.fetch<Array<{ _id: string }>>(
		`*[_type == "module" && references($courseId)]{ _id }`,
		{ courseId }
	);

	for (const mod of modules) {
		const lessons = await client.fetch<Array<{ _id: string }>>(
			`*[_type == "lesson" && references($moduleId)]{ _id }`,
			{ moduleId: mod._id }
		);
		for (const lesson of lessons) {
			await client.delete(lesson._id);
		}
		await client.delete(mod._id);
	}

	await client.delete(courseId);
	return NextResponse.json({ success: true });
}
