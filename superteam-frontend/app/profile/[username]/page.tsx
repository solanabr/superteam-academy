
import ProfilePageComponent from "@/components/profile/ProfilePageComponent";
import { Navbar } from "@/components/navbar";

export default function Page({ params }: { params: { username: string } }) {
    return (
        <div>
            <Navbar />
            <ProfilePageComponent username={params.username} />
        </div>
    );
}
