import { getTranslations } from "next-intl/server";
import { UserCircle } from "@phosphor-icons/react/dist/ssr";
import { getAuthClaims } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { fetchOwnProfile } from "@/lib/profile/profile-data";
import { ProfileBody } from "@/components/gamification/profile-body";
import { ProfileBackButton } from "@/components/profile/profile-back-button";

export default async function ProfilePage() {
  const supabase = await createClient();
  const claims = await getAuthClaims();

  const profile = claims ? await fetchOwnProfile(supabase, claims.sub) : null;

  if (!profile) {
    const t = await getTranslations("profile");
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
        <UserCircle
          size={48}
          weight="duotone"
          className="text-text-3"
          aria-hidden="true"
        />
        <h2 className="font-display text-lg font-black tracking-[-0.25px]">
          {t("signInToView")}
        </h2>
        <p className="text-text-3">{t("signInDescription")}</p>
      </div>
    );
  }

  return (
    <div>
      <ProfileBackButton className="mb-6" />
      <ProfileBody
        user={profile.user}
        stats={profile.stats}
        content={profile.content}
        showVisibilityBadge
        streak={profile.streak}
      />
    </div>
  );
}
