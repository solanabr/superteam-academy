import { NextResponse } from "next/server";
import crypto from "node:crypto";

export async function GET() {
	const nonce = crypto.randomBytes(32).toString("base64url");
	const domain = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

	return NextResponse.json({ nonce, domain });
}
