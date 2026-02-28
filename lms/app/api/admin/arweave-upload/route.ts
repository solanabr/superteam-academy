import { NextRequest, NextResponse } from "next/server";
import { uploadJson } from "@/lib/arweave";

export async function POST(req: NextRequest) {
  const adminSecret = req.headers.get("x-admin-secret");
  if (!adminSecret || adminSecret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { type, data } = await req.json();
  if (!type || !data) {
    return NextResponse.json(
      { error: "missing type or data" },
      { status: 400 },
    );
  }

  const validTypes = ["course-content", "credential-metadata"];
  if (!validTypes.includes(type)) {
    return NextResponse.json(
      { error: `invalid type, must be one of: ${validTypes.join(", ")}` },
      { status: 400 },
    );
  }

  const tags = [
    { name: "App-Name", value: "Superteam-Academy" },
    { name: "Content-Kind", value: type },
  ];

  const result = await uploadJson(data, tags);
  return NextResponse.json({ txId: result.txId, url: result.url });
}
