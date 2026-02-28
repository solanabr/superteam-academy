import { type NextRequest, NextResponse } from "next/server";
import { requireRole, sanityReadClient, sanityWriteClient } from "@/lib/route-utils";

const SETTINGS_DOC_ID = "platformSettings";

export async function GET() {
	const auth = await requireRole("superadmin");
	if (!auth.ok) return auth.response;

	const client = sanityReadClient;
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
	const auth = await requireRole("superadmin");
	if (!auth.ok) return auth.response;

	const client = sanityWriteClient;
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
