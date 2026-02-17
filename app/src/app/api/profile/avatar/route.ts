import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/auth-guard";
import { avatarService } from "@/services/avatar";
import {
    AVATAR_MAX_SIZE,
    AVATAR_ALLOWED_TYPES,
} from "@/lib/validations/profile";

export async function POST(request: NextRequest) {
    const { error, session } = await requireAuth();
    if (error) return error;

    let formData: FormData;
    try {
        formData = await request.formData();
    } catch {
        return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
    }

    const file = formData.get("file");
    if (!file || !(file instanceof File)) {
        return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size > AVATAR_MAX_SIZE) {
        return NextResponse.json({ error: "File too large" }, { status: 413 });
    }

    if (
        !AVATAR_ALLOWED_TYPES.includes(
            file.type as (typeof AVATAR_ALLOWED_TYPES)[number],
        )
    ) {
        return NextResponse.json({ error: "Invalid file type" }, { status: 415 });
    }

    try {
        const result = await avatarService.uploadAvatar(session.user.id, file);
        return NextResponse.json(result);
    } catch (err) {
        console.error("Avatar upload error:", err);
        return NextResponse.json(
            { error: "Upload failed" },
            { status: 500 },
        );
    }
}
