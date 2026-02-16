import ProfilePageComponent from "@/components/profile/ProfilePageComponent";
import { Navbar } from "@/components/navbar";
import { requireAuthenticatedUser } from "@/lib/server/auth-adapter";
import { getIdentitySnapshotForUser } from "@/lib/server/solana-identity-adapter";

export default async function Page() {
    const user = await requireAuthenticatedUser();
    const snapshot = await getIdentitySnapshotForUser(user);

    return (
        <div>
            <Navbar />
            <ProfilePageComponent identity={snapshot} />
        </div>
    );
}
