import { NextRequest, NextResponse } from "next/server";
import { learningProgressService } from "@/lib/learning-progress/service";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        if (!id) {
            return NextResponse.json({ error: "ID required" }, { status: 400 });
        }

        const credential = await learningProgressService.getCredential(id);

        if (!credential) {
            return NextResponse.json({ error: "Credential not found" }, { status: 404 });
        }

        return NextResponse.json(credential);
    } catch (e) {
        console.error("Failed to fetch credential:", e);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
