import { NextRequest, NextResponse } from "next/server";
import { isAdminWallet } from "@/lib/admin";
import { sanityWriteClient } from "@/sanity/write-client";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const wallet = request.headers.get("X-Wallet-Address");
  if (!wallet || !isAdminWallet(wallet)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  if (!sanityWriteClient) {
    return NextResponse.json(
      { error: "SANITY_API_TOKEN not configured" },
      { status: 500 },
    );
  }

  const { id } = await params;
  const { published } = await request.json();
  const updated = await sanityWriteClient
    .patch(id)
    .set({ published: !!published })
    .commit();
  return NextResponse.json({ _id: updated._id, published: updated.published });
}
