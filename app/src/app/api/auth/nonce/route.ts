import { NextResponse } from "next/server";
import { createNonce } from "@/lib/auth/nonce-store";

export async function GET() {
  const nonce = createNonce();
  return NextResponse.json({ nonce });
}
