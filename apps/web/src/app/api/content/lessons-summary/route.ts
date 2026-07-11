import { NextRequest, NextResponse } from "next/server";
import { parseIds } from "../params";
import { getLessonsByIds } from "@/lib/content/queries";

/**
 * Public lesson SUMMARIES by id — the client-side face of `getLessonsByIds`
 * (dashboard recent-activity titles). Returns ONLY `{_id, title, slug}` — never
 * the full `Lesson` shape (`blocks[]` carries solutions/tests and stays behind
 * the `server-only` bundle store).
 */
export async function GET(request: NextRequest) {
  const ids = parseIds(request.nextUrl.searchParams.get("ids"), false);
  if (ids instanceof NextResponse) return ids;
  try {
    // Explicit re-projection: even if the underlying fn ever grew extra fields,
    // this route serves EXACTLY the summary keys and nothing else (answer-key
    // guard — the shape-lock test asserts adversarial extras are stripped).
    const lessons = (await getLessonsByIds(ids)).map(
      ({ _id, title, slug }) => ({ _id, title, slug })
    );
    return NextResponse.json({ lessons });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch lessons" },
      { status: 500 }
    );
  }
}
