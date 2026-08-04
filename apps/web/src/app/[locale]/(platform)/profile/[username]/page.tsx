import { getTranslations } from "next-intl/server";
import { UserCircle } from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/server";
import { fetchPublicProfile } from "@/lib/profile/profile-data";
import { ProfileBody } from "@/components/gamification/profile-body";
import { ProfileBackButton } from "./profile-back-button";

export default async function PublicProfilePage(props: {
  params: Promise<{ username: string }>;
}) {
  const params = await props.params;
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
      <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
        <UserCircle
          size={48}
          weight="duotone"
          className="text-text-3"
          aria-hidden="true"
        />
        <h2 className="font-display text-lg font-black tracking-[-0.25px]">
          {t("userNotFound")}
        </h2>
        <p className="text-text-3">{t("userNotFoundDescription")}</p>
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
      />
    </div>
  );
}
