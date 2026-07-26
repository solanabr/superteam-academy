import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { fetchOwnProfile } from "@/lib/profile/profile-data";
import { ProfileBody } from "@/components/gamification/profile-body";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const profile = user ? await fetchOwnProfile(supabase, user.id) : null;

  if (!profile) {
    const t = await getTranslations("profile");
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="mb-4 font-display text-4xl font-black text-primary">?</p>
        <h2 className="mb-2 text-xl font-semibold">{t("signInToView")}</h2>
        <p className="text-text-3">{t("signInDescription")}</p>
      </div>
    );
  }

  return (
    <ProfileBody
      user={profile.user}
      stats={profile.stats}
      content={profile.content}
      showVisibilityBadge
      streak={profile.streak}
    />
  );
}
