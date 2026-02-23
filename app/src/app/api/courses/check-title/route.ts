
import { NextRequest, NextResponse } from "next/server";
import { serverClient } from "@/sanity/lib/server-client";

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const title = searchParams.get("title");
    const id = searchParams.get("id"); // Optional, for edit mode

    if (!title) {
        return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    try {
        // Generate slug from title exactly like creation/update logic
        const slug = title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "")
            .slice(0, 96);

        // Check for existing courses with the same title OR the same slug
        // We exclude the current document ID if provided
        const query = `*[_type == "course" && (title == $title || slug.current == $slug) && _id != $id][0] { _id }`;
        const existing = await serverClient.fetch(query, { title, slug, id: id || "" });

        return NextResponse.json({
            unique: !existing,
            message: existing ? "A course with this name or slug already exists." : "Course name is available."
        });
    } catch (error: any) {
        console.error("Error checking title uniqueness:", error);
        return NextResponse.json({ error: "Failed to check title uniqueness" }, { status: 500 });
    }
}
