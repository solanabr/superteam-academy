import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/** Teacher area entry point — send authors straight to their course list. */
export default async function TeachPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/teach/courses`);
}
