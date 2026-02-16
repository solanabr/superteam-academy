import ProfilePageComponent from "@/components/profile/ProfilePageComponent";
import { Navbar } from "@/components/navbar";
import { requireAuthenticatedUser } from "@/lib/server/auth-adapter";

export default async function Page() {
    await requireAuthenticatedUser();

    return (
        <div>
            <Navbar />
            <ProfilePageComponent />
        </div>
    );
}
