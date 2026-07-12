import { redirect } from "next/navigation";

/**
 * `/admin/deploy` was folded into `/admin/courses` (deploy is step 2 of that
 * screen, not a screen of its own). Kept as a redirect so bookmarks, docs and
 * muscle memory land on the merged screen instead of a 404.
 */
export default function AdminDeployRedirect({
  params: { locale },
}: {
  params: { locale: string };
}) {
  redirect(`/${locale}/admin/courses`);
}
