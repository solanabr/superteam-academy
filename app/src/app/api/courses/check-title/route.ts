
import { NextRequest, NextResponse } from "next/server";
import { serverClient } from "@/sanity/lib/server-client";

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const title = searchParams.get("title");

    if (!title) {
        return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    try {
        // Check for existing courses with the same title (case-insensitive-ish in GROQ or just direct match)
        // We check for exact title match to prevent exact duplicates
        const query = `*[_type == "course" && title == $title][0] { _id }`;
        const existing = await serverClient.fetch(query, { title });

        return NextResponse.json({
            unique: !existing,
            message: existing ? "A course with this name already exists." : "Course name is available."
        });
    } catch (error: any) {
        console.error("Error checking title uniqueness:", error);
        return NextResponse.json({ error: "Failed to check title uniqueness" }, { status: 500 });
    }
}
