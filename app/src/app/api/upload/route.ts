import { NextRequest, NextResponse } from "next/server";
import { serverClient } from "@/sanity/lib/server-client";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get("file") as File;
        const wallet = formData.get("wallet") as string;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        if (!wallet) {
            return NextResponse.json({ error: "Wallet address is required" }, { status: 400 });
        }

        // Verify user is professor or admin
        const user = await prisma.user.findUnique({
            where: { walletAddress: wallet },
            select: { role: true },
        });

        if (!user || (user.role !== "professor" && user.role !== "admin")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        // Upload to Sanity
        const buffer = await file.arrayBuffer();
        const asset = await serverClient.assets.upload("image", Buffer.from(buffer), {
            filename: file.name,
            contentType: file.type,
        });

        return NextResponse.json({
            success: true,
            assetId: asset._id,
            url: asset.url,
        });
    } catch (error: any) {
        console.error("Upload error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to upload image" },
            { status: 500 }
        );
    }
}
