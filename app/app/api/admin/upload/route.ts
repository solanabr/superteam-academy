import { type NextRequest, NextResponse } from "next/server";
import { requireAdmin, sanityWriteClient } from "@/lib/route-utils";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export async function POST(request: NextRequest) {
	const auth = await requireAdmin();
	if (!auth.ok) return auth.response;

	const client = sanityWriteClient;
	if (!client) {
		return NextResponse.json({ error: "Sanity write client not configured" }, { status: 503 });
	}

	const formData = await request.formData();
	const file = formData.get("file") as File | null;

	if (!file) {
		return NextResponse.json({ error: "No file provided" }, { status: 400 });
	}

	if (!ALLOWED_TYPES.has(file.type)) {
		return NextResponse.json(
			{ error: "Invalid file type. Allowed: JPEG, PNG, WebP, GIF" },
			{ status: 400 }
		);
	}

	if (file.size > MAX_FILE_SIZE) {
		return NextResponse.json({ error: "File too large. Maximum size is 5MB" }, { status: 400 });
	}

	const buffer = Buffer.from(await file.arrayBuffer());
	const asset = await client.assets.upload("image", buffer, {
		filename: file.name,
		contentType: file.type,
	});

	return NextResponse.json({
		asset: {
			_id: asset._id,
			_type: "image",
			asset: { _ref: asset._id, _type: "reference" },
			url: asset.url,
		},
	});
}
