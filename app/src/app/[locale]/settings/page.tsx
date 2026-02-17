import { auth } from "@/lib/auth";
import { profileService } from "@/services/profile";
import { redirect } from "@/i18n/routing";
import SettingsForm from "./settings-form";

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    redirect({ href: "/auth/signin", locale });
    return null;
  }

  const profile = await profileService.getProfileById(session.user.id);
  if (!profile) {
    redirect({ href: "/auth/signin", locale });
    return null;
  }

  // Extract linked accounts and wallet from session
  const sessionData = session as unknown as Record<string, unknown>;
  const linkedAccounts = (sessionData.linkedAccounts as string[]) ?? [];
  const walletAddress = sessionData.walletAddress as string | undefined;

  return (
    <SettingsForm
      initialProfile={profile}
      linkedAccounts={linkedAccounts}
      walletAddress={walletAddress}
    />
  );
}
