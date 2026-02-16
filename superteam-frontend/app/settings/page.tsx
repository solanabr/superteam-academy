import { SettingsPage } from "@/components/settings/SettingsPage";
import { Navbar } from "@/components/navbar";
import { requireAuthenticatedUser } from "@/lib/server/auth-adapter";

export default async function Page() {
    await requireAuthenticatedUser();

    return (
        <div>
            <Navbar />
            <SettingsPage />
        </div>
    );
}
