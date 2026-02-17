import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { createHmac } from "crypto";

function isValidSignature(
  body: string,
  signature: string,
  secret: string,
): boolean {
  const hmac = createHmac("sha256", secret);
  hmac.update(body);
  const digest = hmac.digest("hex");
  return signature === digest;
}

export async function POST(request: NextRequest) {
  const signature = request.headers.get("sanity-webhook-signature");
  const secret = process.env.SANITY_WEBHOOK_SECRET;

  if (!signature || !secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rawBody = await request.text();

  if (!isValidSignature(rawBody, signature, secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const body = JSON.parse(rawBody);
  const type = body?._type as string | undefined;

  if (type === "course" || type === "module" || type === "lesson") {
    revalidateTag("courses", "max");
  }
  if (type === "track") {
    revalidateTag("tracks", "max");
  }
  if (type === "instructor") {
    revalidateTag("instructors", "max");
  }

  return NextResponse.json({ revalidated: true });
}
