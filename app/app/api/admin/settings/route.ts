import { type NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { serverAuth } from "@/lib/auth";
import { isUserSuperAdmin } from "@/lib/sanity-users";
import { createSanityClient } from "@superteam-academy/cms";

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

const SETTINGS_DOC_ID = "platformSettings";

export async function GET() {
	const requestHeaders = await headers();
	const session = await serverAuth.api.getSession({ headers: requestHeaders });

	if (!session) {
		return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
	}

	const superAdmin = await isUserSuperAdmin(session.user.id, session.user.email);
	if (!superAdmin) {
		return NextResponse.json(
			{ error: "Only super admins can access settings" },
			{ status: 403 }
		);
	}

	const client = sanityReadClient();
	if (!client) {
		return NextResponse.json({ error: "Sanity not configured" }, { status: 500 });
	}

	const settings = await client.fetch(`*[_type == "platformSettings" && _id == $id][0]`, {
		id: SETTINGS_DOC_ID,
	});

	return NextResponse.json({
		settings: settings ?? {
			platformName: "Superteam Academy",
			maintenanceMode: false,
			enrollmentOpen: true,
			maxCoursesPerUser: 10,
			defaultXpPerLesson: 50,
		},
	});
}

export async function PATCH(request: NextRequest) {
	const requestHeaders = await headers();
	const session = await serverAuth.api.getSession({ headers: requestHeaders });

	if (!session) {
		return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
	}

	const superAdmin = await isUserSuperAdmin(session.user.id, session.user.email);
	if (!superAdmin) {
		return NextResponse.json(
			{ error: "Only super admins can modify settings" },
			{ status: 403 }
		);
	}

	const client = sanityWriteClient();
	if (!client) {
		return NextResponse.json({ error: "Sanity write token not configured" }, { status: 500 });
	}

	const body = (await request.json()) as Record<string, unknown>;
	const allowedFields = [
		"platformName",
		"maintenanceMode",
		"enrollmentOpen",
		"maxCoursesPerUser",
		"defaultXpPerLesson",
	];

	const patch: Record<string, unknown> = {};
	for (const key of allowedFields) {
		if (key in body) {
			patch[key] = body[key];
		}
	}

	const existing = await client.fetch(`*[_type == "platformSettings" && _id == $id][0]._id`, {
		id: SETTINGS_DOC_ID,
	});

	if (existing) {
		const updated = await client.patch(SETTINGS_DOC_ID).set(patch).commit();
		return NextResponse.json({ settings: updated });
	}

	const created = await client.createOrReplace({
		_id: SETTINGS_DOC_ID,
		_type: "platformSettings",
		...patch,
	});

	return NextResponse.json({ settings: created });
}
