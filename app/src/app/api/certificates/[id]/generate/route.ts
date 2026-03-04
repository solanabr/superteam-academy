import { NextRequest } from "next/server";
import { and, eq, isNull } from "drizzle-orm";
import { require_auth } from "@/lib/api/guard";
import { api_error } from "@/lib/api/response";
import { db } from "@/lib/db";
import { course_enrollments, lesson_progress, wallets } from "@/lib/db/schema";
import { fetch_credential_nfts } from "@/lib/services/blockchain-service";
import { get_course_by_slug } from "@/lib/services/course-service";

type Params = Promise<{ id: string }>;

export async function GET(_request: NextRequest, { params }: { params: Params }): Promise<Response> {
  const result = await require_auth();
  if (result.response) return result.response;

  const { session } = result;
  const { id } = await params;

  const course = await get_course_by_slug(id, false);
  if (!course) {
    return api_error("Course not found", 404);
  }

  const all_lessons = course.modules.flatMap((module_item) => module_item.lessons);
  if (all_lessons.length === 0) {
    return api_error("Course has no lessons to complete", 400);
  }

  const [enrollment] = await db
    .select()
    .from(course_enrollments)
    .where(
      and(
        eq(course_enrollments.user_id, session.sub),
        eq(course_enrollments.course_slug, course.slug),
        isNull(course_enrollments.closed_at),
      ),
    )
    .limit(1);

  if (!enrollment) {
    return api_error("User is not enrolled in this course", 403);
  }

  const lesson_slugs = all_lessons.map((lesson_item) => lesson_item.slug);

  const progress_rows = await db
    .select({
      lesson_slug: lesson_progress.lesson_slug,
      completed: lesson_progress.completed,
    })
    .from(lesson_progress)
    .where(
      and(eq(lesson_progress.user_id, session.sub), eq(lesson_progress.course_slug, course.slug)),
    );

  const completed_set = new Set(
    progress_rows.filter((row) => row.completed).map((row) => row.lesson_slug),
  );

  const all_completed = lesson_slugs.every((slug) => completed_set.has(slug));

  if (!all_completed) {
    return api_error("Course not fully completed", 403);
  }

  const [wallet] = await db
    .select()
    .from(wallets)
    .where(eq(wallets.user_id, session.sub))
    .limit(1);

  if (!wallet) {
    return api_error("Wallet not linked", 400);
  }

  const credentials = await fetch_credential_nfts(wallet.public_key);

  if (!Array.isArray(credentials) || credentials.length === 0) {
    return api_error("No credential NFT found for this wallet", 403);
  }

  const user_name = session.email;
  const course_name = course.title;
  const date_str = new Date().toLocaleDateString("en-US");
  const primary_credential = credentials[0] as { mint_address?: string | null };
  const mint_address = primary_credential.mint_address ?? wallet.public_key;
  const explorer_url = `https://explorer.solana.com/address/${mint_address}?cluster=devnet`;

  const svg = `
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="630" fill="#0b0b0f"/>
  <rect x="60" y="60" width="1080" height="510" fill="#111827" stroke="#4b5563" stroke-width="2"/>
  <text x="600" y="150" fill="#e5e7eb" font-size="32" font-family="system-ui" text-anchor="middle">
    Superteam Academy
  </text>
  <text x="600" y="220" fill="#f9fafb" font-size="28" font-family="system-ui" text-anchor="middle">
    Certificate of Completion
  </text>
  <text x="600" y="290" fill="#facc15" font-size="24" font-family="system-ui" text-anchor="middle">
    ${user_name}
  </text>
  <text x="600" y="330" fill="#9ca3af" font-size="18" font-family="system-ui" text-anchor="middle">
    has successfully completed
  </text>
  <text x="600" y="370" fill="#f9fafb" font-size="22" font-family="system-ui" text-anchor="middle">
    ${course_name}
  </text>
  <text x="600" y="420" fill="#9ca3af" font-size="16" font-family="system-ui" text-anchor="middle">
    ${date_str} · Mint: ${mint_address}
  </text>
  <text x="600" y="460" fill="#60a5fa" font-size="14" font-family="system-ui" text-anchor="middle">
    ${explorer_url}
  </text>
</svg>
`;

  return new Response(svg, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml",
      "Content-Disposition": `attachment; filename="certificate-${course.slug}.svg"`,
      "Cache-Control": "no-store",
    },
  });
}

