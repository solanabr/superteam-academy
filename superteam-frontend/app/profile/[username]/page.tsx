import ProfilePageComponent from "@/components/profile/ProfilePageComponent";
import { Navbar } from "@/components/navbar";
import { requireAuthenticatedUser } from "@/lib/server/auth-adapter";

export default async function Page({ params }: { params: { username: string } }) {
    await requireAuthenticatedUser();

    return (
        <div>
            <Navbar />
            <ProfilePageComponent username={params.username} />
        </div>
    );
}
