import { redirect } from "next/navigation";
import { getSessionUserAndRole, canAuthorCourses } from "@/lib/auth/roles";

// The access gate reads the request's auth cookies, so this segment must render
// per-request (never statically prerendered, which would evaluate the gate with
// no user at build time).
export const dynamic = "force-dynamic";

/**
 * Access gate for the teacher authoring area. Unauthenticated → landing;
 * authenticated non-teachers (learners) → dashboard. Only teachers and admins
 * may proceed. Enforced again in the teacher API routes (never trust the layout
 * alone).
 */
export default async function TeachLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await getSessionUserAndRole();

  if (!session) redirect(`/${locale}`);
  if (!canAuthorCourses(session.role)) redirect(`/${locale}/dashboard`);

  return <>{children}</>;
}
