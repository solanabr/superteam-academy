import { redirect } from "next/navigation";

/**
 * `/admin/content` was folded into `/admin/courses` (#1136): quests,
 * achievements and paths ship in the same bundle and deploy through the same
 * sync, so they are step 3 of that screen, not a screen of their own. Kept as
 * a redirect so bookmarks, docs and muscle memory land on the merged screen
 * instead of a 404.
 */
export default async function AdminContentRedirect(props: {
  params: Promise<{ locale: string }>;
}) {
  const params = await props.params;

  const { locale } = params;

  redirect(`/${locale}/admin/courses`);
}
