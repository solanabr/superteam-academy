import { SettingsPage } from "@/components/settings/SettingsPage";
import { Navbar } from "@/components/navbar";
import { requireAuthenticatedUser } from "@/lib/server/auth-adapter";
import { getIdentitySnapshotForUser } from "@/lib/server/solana-identity-adapter";

export default async function Page() {
  const user = await requireAuthenticatedUser();
  const snapshot = await getIdentitySnapshotForUser(user);

  return (
    <div>
      <Navbar />
      <SettingsPage
        profile={snapshot?.profile}
        walletAddress={user.walletAddress}
      />
    </div>
  );
}
