import { NextResponse } from "next/server";
import { headers } from "next/headers";
import type { UserSettings } from "@superteam-academy/cms";

import { serverAuth } from "@/lib/auth";
import { getUserByAuthId } from "@/lib/sanity-users";
import { writeClient } from "@/lib/cms-context";

export async function GET() {
	const requestHeaders = await headers();
	const session = await serverAuth.api.getSession({ headers: requestHeaders });
	if (!session) {
		return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
	}

	const user = await getUserByAuthId(session.user.id);
	if (!user) {
		return NextResponse.json({ error: "User not found" }, { status: 404 });
	}

	return NextResponse.json({
		profile: {
			name: user.name,
			email: user.email,
			username: user.username ?? "",
			bio: user.bio ?? "",
			location: user.location ?? "",
			website: user.website ?? "",
			image: user.image ?? "",
		},
		settings: user.settings ?? {},
	});
}

const VALID_SECTIONS = new Set(["notifications", "privacy", "appearance", "language", "wallet"]);

export async function PATCH(request: Request) {
	const requestHeaders = await headers();
	const session = await serverAuth.api.getSession({ headers: requestHeaders });
	if (!session) {
		return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
	}

	if (!writeClient) {
		return NextResponse.json({ error: "CMS not configured" }, { status: 503 });
	}

	const user = await getUserByAuthId(session.user.id);
	if (!user) {
		return NextResponse.json({ error: "User not found" }, { status: 404 });
	}

	const body = (await request.json()) as Record<string, unknown>;

	const patch: Record<string, unknown> = {};

	if (typeof body.name === "string") patch.name = body.name.trim();
	if (typeof body.email === "string") patch.email = body.email.trim();
	if (typeof body.username === "string") patch.username = body.username.trim();
	if (typeof body.bio === "string") patch.bio = body.bio.trim();
	if (typeof body.location === "string") patch.location = body.location.trim();
	if (typeof body.website === "string") patch.website = body.website.trim();
	if (typeof body.image === "string") patch.image = body.image;

	if (body.settings && typeof body.settings === "object") {
		const incoming = body.settings as Record<string, unknown>;
		const current: UserSettings = user.settings ?? {};
		const merged: Record<string, unknown> = { ...current };

		for (const key of Object.keys(incoming)) {
			if (!VALID_SECTIONS.has(key)) continue;
			if (incoming[key] && typeof incoming[key] === "object") {
				merged[key] = {
					...(current[key as keyof UserSettings] as Record<string, unknown> | undefined),
					...(incoming[key] as Record<string, unknown>),
				};
			}
		}

		patch.settings = merged;
	}

	if (Object.keys(patch).length === 0) {
		return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
	}

	await writeClient.patch(user._id).set(patch).commit();

	return NextResponse.json({ ok: true });
}
