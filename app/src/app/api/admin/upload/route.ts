import { NextRequest, NextResponse } from "next/server";
import { isAdminWallet } from "@/lib/admin";
import { sanityWriteClient } from "@/sanity/write-client";

export async function POST(request: NextRequest) {
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

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const asset = await sanityWriteClient.assets.upload("image", buffer, {
    filename: file.name,
    contentType: file.type,
  });

  return NextResponse.json({ assetId: asset._id, url: asset.url });
}
