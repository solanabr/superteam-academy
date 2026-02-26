import { NextRequest, NextResponse } from "next/server";
import { getCourses } from "@/sanity/lib/queries";

/**
 * GET /api/courses/list?locale=en
 * Lightweight courses listing used by client-side components (dashboard recommendations).
 * Uses the same Sanity cache as the SSR courses page.
 */
export async function GET(request: NextRequest) {
    const locale = request.nextUrl.searchParams.get("locale") ?? "en";
    try {
        const courses = await getCourses(locale);
        return NextResponse.json(
            { courses },
            { headers: { "Cache-Control": "s-maxage=300, stale-while-revalidate=60" } }
        );
    } catch (error: any) {
        console.error("GET /api/courses/list error:", error?.message ?? error);
        return NextResponse.json({ courses: [] }, { status: 200 });
    }
}
