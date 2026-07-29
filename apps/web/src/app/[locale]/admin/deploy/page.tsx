import { redirect } from "next/navigation";

/**
 * `/admin/deploy` was folded into `/admin/courses` (deploy is step 2 of that
 * screen, not a screen of its own). Kept as a redirect so bookmarks, docs and
 * muscle memory land on the merged screen instead of a 404.
 */
export default async function AdminDeployRedirect(props: {
  params: Promise<{ locale: string }>;
}) {
  const params = await props.params;

  const { locale } = params;

  redirect(`/${locale}/admin/courses`);
}
