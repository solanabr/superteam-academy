import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getUserByUsername } from "@/lib/data";
import { ProfileClient } from "../profile-client";

export default async function PublicProfilePage({
    params,
}: {
    params: Promise<{ locale: string; username: string }>;
}) {
    const { locale, username } = await params;
    setRequestLocale(locale);

    const profile = await getUserByUsername(username);
    if (!profile) notFound();

    return <ProfileClient profile={profile} isOwnProfile={false} />;
}
