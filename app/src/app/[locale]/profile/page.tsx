import { redirect } from "@/i18n/routing";

export default async function ProfileRedirect({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect({ href: "/profile/me", locale });
}
