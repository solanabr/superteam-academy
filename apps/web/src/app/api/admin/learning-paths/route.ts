import "server-only";

import { revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import {
  requireAdminAuth,
  adminUnauthorizedResponse,
  AdminAuthError,
} from "@/lib/admin/auth";
import {
  getLearningPathsForAdmin,
  getCoursesForPathPicker,
  COURSES_CACHE_TAG,
} from "@/lib/sanity/queries";
import { setLearningPathCourses } from "@/lib/sanity/admin-mutations";

// Reads the admin cookie + writes to Sanity — never statically prerender.
export const dynamic = "force-dynamic";

function guard(req: NextRequest): NextResponse | null {
  try {
    requireAdminAuth(req);
    return null;
  } catch (e) {
    if (e instanceof AdminAuthError) return adminUnauthorizedResponse();
    throw e;
  }
}

/** GET — learning paths (+ current course ids) and the assignable course list. */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const denied = guard(req);
  if (denied) return denied;
  const [paths, courses] = await Promise.all([
    getLearningPathsForAdmin(),
    getCoursesForPathPicker(),
  ]);
  return NextResponse.json({ paths, courses });
}

/** PUT { pathId, courseIds } — set a path's full course membership. */
export async function PUT(req: NextRequest): Promise<NextResponse> {
  const denied = guard(req);
  if (denied) return denied;

  let pathId: string;
  let courseIds: string[];
  try {
    const body = (await req.json()) as {
      pathId?: unknown;
      courseIds?: unknown;
    };
    if (typeof body.pathId !== "string" || body.pathId.length === 0) {
      return NextResponse.json(
        { error: "pathId is required" },
        { status: 400 }
      );
    }
    if (
      !Array.isArray(body.courseIds) ||
      body.courseIds.some((id) => typeof id !== "string")
    ) {
      return NextResponse.json(
        { error: "courseIds must be an array of strings" },
        { status: 400 }
      );
    }
    pathId = body.pathId;
    // De-dupe, drop empties, and reject Sanity drafts.
    courseIds = Array.from(
      new Set((body.courseIds as string[]).map((id) => id.trim()))
    ).filter((id) => id.length > 0 && !id.startsWith("drafts."));
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Validate the pathId is actually a learning path (not an arbitrary doc id).
  const paths = await getLearningPathsForAdmin();
  if (!paths.some((p) => p._id === pathId)) {
    return NextResponse.json(
      { error: "Learning path not found" },
      { status: 404 }
    );
  }
  // Validate every course id exists in the assignable set.
  const validIds = new Set((await getCoursesForPathPicker()).map((c) => c._id));
  if (courseIds.some((id) => !validIds.has(id))) {
    return NextResponse.json(
      { error: "One or more courses are not assignable" },
      { status: 400 }
    );
  }

  try {
    await setLearningPathCourses(pathId, courseIds);
    // Learning-path sections render on /courses (catalog); purge that cache.
    revalidateTag(COURSES_CACHE_TAG);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[admin/learning-paths] update failed:", err);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}
