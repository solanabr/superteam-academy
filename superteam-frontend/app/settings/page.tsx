import { Suspense } from "react";
import { SettingsPage } from "@/components/settings/SettingsPage";
import { requireAuthenticatedUser } from "@/lib/server/auth-adapter";
import { getIdentitySnapshotForUser } from "@/lib/server/solana-identity-adapter";
import { getLinkedStatusForWallet } from "@/lib/server/account-linking";
import { getConfiguredProviders } from "@/lib/server/auth-config";

async function SettingsContent() {
  const user = await requireAuthenticatedUser();
  const snapshot = await getIdentitySnapshotForUser(user);
  const linkedAccounts = getLinkedStatusForWallet(user.walletAddress);
  const configuredProviders = getConfiguredProviders();

  return (
    <SettingsPage
      profile={snapshot?.profile}
      walletAddress={user.walletAddress}
      initialLinkedAccounts={linkedAccounts}
      configuredProviders={configuredProviders}
    />
  );
}

export default function Page() {
  return (
    <Suspense>
      <SettingsContent />
    </Suspense>
  );
}
