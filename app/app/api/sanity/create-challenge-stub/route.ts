import { NextRequest, NextResponse } from "next/server";
import { getSanityWriteClient, verifyAdminToken } from "../_shared";

export async function POST(request: NextRequest) {
  const auth = request.headers.get("authorization");
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token || !(await verifyAdminToken(token))) {
    return NextResponse.json({ error: "Admin JWT required" }, { status: 401 });
  }

  let body: {
    slug?: string;
    title?: string;
    description?: string;
    type?: string;
    xpReward?: number;
    config?: Record<string, unknown>;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    body = {};
  }

  const slug = (body.slug ?? "").trim();
  const title = (body.title ?? "").trim();
  const type = (body.type ?? "").trim();
  if (!slug || !title || (type !== "daily" && type !== "seasonal" && type !== "sponsored")) {
    return NextResponse.json(
      { error: "slug, title, type(daily|seasonal|sponsored) are required" },
      { status: 400 }
    );
  }

  try {
    const client = getSanityWriteClient();
    const doc = await client.create({
      _type: "challenge",
      slug: { _type: "slug", current: slug },
      title,
      description: body.description?.trim() || undefined,
      type,
      xpReward: typeof body.xpReward === "number" ? body.xpReward : 0,
      config: body.config ?? {},
    } as unknown as { _type: string });

    return NextResponse.json({ _id: (doc as { _id: string })._id });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to create challenge";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

