import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { fetchPublicProfile } from "@/lib/profile/profile-data";
import { ProfileBody } from "@/components/gamification/profile-body";
import { ProfileBackButton } from "./profile-back-button";

export default async function PublicProfilePage({
  params,
}: {
  params: { username: string };
}) {
  const username = decodeURIComponent(params.username);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const profile = await fetchPublicProfile(
    supabase,
    username,
    user?.id ?? null
  );

  if (!profile) {
    const t = await getTranslations("profile");
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p
          className="mb-3 font-display text-4xl font-black text-text-3"
          aria-hidden="true"
        >
          ?
        </p>
        <h2 className="mb-2 text-xl font-semibold">{t("userNotFound")}</h2>
        <p className="text-text-3">{t("userNotFoundDescription")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <ProfileBackButton />
      <ProfileBody
        user={profile.user}
        stats={profile.stats}
        content={profile.content}
      />
    </div>
  );
}
