import { redirect } from "next/navigation";

/**
 * `/admin/publish` was folded into `/admin/courses` (publish is step 1 of that
 * screen, not a screen of its own). Kept as a redirect so bookmarks, docs and
 * muscle memory land on the merged screen instead of a 404.
 */
export default function AdminPublishRedirect({
  params: { locale },
}: {
  params: { locale: string };
}) {
  redirect(`/${locale}/admin/courses`);
}
