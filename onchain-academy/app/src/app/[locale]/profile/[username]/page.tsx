import Image from "next/image";
import { Card } from "@/components/ui/card";
import { supabaseRest } from "@/lib/backend/server-supabase";
import { DEFAULT_AVATAR_SRC, normalizeAvatarUrl } from "@/lib/avatar";

type Props = {
  params: Promise<{ username: string }>;
};

export default async function PublicProfilePage({ params }: Props) {
  const { username } = await params;
  const [profile] =
    (await supabaseRest.select<{
      learner_id: string;
      username: string | null;
      bio: string | null;
      role: string | null;
      country: string | null;
      avatar_url: string | null;
      updated_at: string;
    }>({
      table: "academy_user_profiles",
      select: "learner_id,username,bio,role,country,avatar_url,updated_at",
      filters: { username: `eq.${username}` },
      limit: 1,
    })) ?? [];

  const user = profile?.learner_id
    ? (
        await supabaseRest.select<{
          learner_id: string;
          created_at: string;
          display_name: string | null;
        }>({
          table: "academy_users",
          select: "learner_id,created_at,display_name",
          filters: { learner_id: `eq.${profile.learner_id}` },
          limit: 1,
        })
      )?.[0]
    : null;

  const visibility = profile?.learner_id
    ? (
        await supabaseRest.select<{ learner_id: string; is_public: boolean }>({
          table: "academy_profile_visibility",
          select: "learner_id,is_public",
          filters: { learner_id: `eq.${profile.learner_id}` },
          limit: 1,
        })
      )?.[0]
    : null;
  const isPublic = visibility?.is_public ?? true;

  const completions = profile?.learner_id
    ? (
        await supabaseRest.select<{ learner_id: string }>({
          table: "academy_lesson_completions",
          select: "learner_id",
          filters: { learner_id: `eq.${profile.learner_id}` },
        })
      ) ?? []
    : [];

  const avatarSrc = normalizeAvatarUrl(profile?.avatar_url) || DEFAULT_AVATAR_SRC;
  const displayName = profile?.username || user?.display_name || username;
  const joinedAt = user?.created_at ? new Date(user.created_at).toLocaleDateString() : "Unknown";

  if (!profile || !isPublic) {
    return (
      <div className="space-y-6">
        <Card>
          <h1 className="text-2xl font-semibold">Profile is private</h1>
          <p className="mt-2 text-zinc-300">This learner has hidden their public profile.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex items-center gap-4">
          <Image
            src={avatarSrc}
            alt={`${displayName} avatar`}
            width={72}
            height={72}
            className="h-[72px] w-[72px] rounded-full border border-white/10 object-cover"
          />
          <div>
            <h1 className="text-3xl font-semibold">@{displayName}</h1>
            <p className="mt-1 text-zinc-400">
              {profile?.role || "Builder"}{profile?.country ? ` · ${profile.country}` : ""} · Joined {joinedAt}
            </p>
          </div>
        </div>
        <p className="mt-4 text-zinc-300">
          {profile?.bio || "This learner has not added a public bio yet."}
        </p>
      </Card>
      <Card>
        <h2 className="text-xl font-medium">Learning Snapshot</h2>
        <p className="mt-2 text-sm text-zinc-300">
          Completed lessons: {completions.length}
        </p>
      </Card>
    </div>
  );
}
