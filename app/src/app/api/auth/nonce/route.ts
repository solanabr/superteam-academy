import { NextResponse } from "next/server";
import crypto from "crypto";

export async function GET() {
  const nonce = crypto.randomBytes(32).toString("base64url");
  return NextResponse.json({ nonce });
}
