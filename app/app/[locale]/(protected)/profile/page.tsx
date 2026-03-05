import { setRequestLocale } from "next-intl/server";
import { getCurrentUser } from "@/lib/data";
import { ProfileClient } from "./profile-client";

export default async function ProfilePage({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    setRequestLocale(locale);

    const profile = await getCurrentUser();
    return <ProfileClient profile={profile} isOwnProfile />;
}
