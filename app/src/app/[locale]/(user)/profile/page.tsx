"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useAPIQuery, useAPIMutation } from "@/lib/api/useAPI";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth-store";
import { Link } from "@/i18n/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";

const cardClass =
  "rounded-none border-2 border-border bg-card shadow-[3px_3px_0_0_hsl(var(--foreground)_/_0.15)]";

type ProfileData = {
  user_id: string;
  email: string;
  name: string | null;
  image_url: string | null;
  role: string;
  wallet_public_key: string | null;
  linked_connections: { provider: string }[];
  xp: { total_xp: number; level: number };
  streak: {
    current_streak_days: number;
    longest_streak_days: number;
    last_activity_at: string | null;
  };
  achievement_count: number;
  leaderboard_rank: number | null;
};

function levelProgress(totalXp: number, level: number): number {
  const nextLevelXp = (level + 1) * (level + 1) * 100;
  const currentLevelFloorXp = level * level * 100;
  const inLevelXp = totalXp - currentLevelFloorXp;
  const inLevelRange = nextLevelXp - currentLevelFloorXp;
  if (inLevelRange <= 0) return 100;
  return Math.max(0, Math.min(100, (inLevelXp / inLevelRange) * 100));
}

export default function ProfilePage() {
  const t = useTranslations("profile");
  const tCommon = useTranslations("common");
  const queryClient = useQueryClient();
  const session = useAuthStore((s) => s.session);
  const isLoaded = useAuthStore((s) => s.is_loaded);

  const { data: profile, isPending } = useAPIQuery<ProfileData>({
    queryKey: ["profile"],
    path: "/api/user/profile",
    enabled: Boolean(session),
  });

  const patchMutation = useAPIMutation<{ ok: boolean }, { name?: string; image_url?: string | null }>(
    "patch",
    "/api/user/profile",
  );

  const [name, setName] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  useEffect(() => {
    if (profile) {
      setName(profile.name ?? "");
      setImageUrl(profile.image_url ?? "");
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await patchMutation.mutateAsync({
      ...(name.trim() && { name: name.trim() }),
      image_url: imageUrl.trim() || null,
    });
    await queryClient.invalidateQueries({ queryKey: ["profile"] });
  };

  if (!isLoaded || !session) return null;

  return (
    <div className="container mx-auto space-y-8 p-4 md:p-6">
      <h1 className="text-2xl font-bold text-foreground">{t("title")}</h1>

      {isPending && (
        <div className="h-32 animate-pulse rounded-none border-2 border-border bg-muted" />
      )}

      {!isPending && profile && (
        <>
          <Card className={cardClass}>
            <CardHeader>
              <CardTitle className="text-lg">{t("editProfile")}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <Avatar className="size-20 rounded-none border-2 border-border">
                    {profile.image_url ? (
                      <img
                        src={profile.image_url}
                        alt=""
                        className="size-full object-cover"
                      />
                    ) : (
                      <AvatarFallback className="rounded-none text-2xl font-bold">
                        {(profile.name || profile.email).charAt(0).toUpperCase()}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="flex-1 space-y-3">
                    <div>
                      <Label htmlFor="profile-name">{t("displayName")}</Label>
                      <Input
                        id="profile-name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="mt-1 rounded-none border-2"
                        placeholder={profile.email}
                      />
                    </div>
                    <div>
                      <Label htmlFor="profile-image">{t("avatarUrl")}</Label>
                      <Input
                        id="profile-image"
                        type="url"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        className="mt-1 rounded-none border-2"
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                </div>
                <Button
                  type="submit"
                  disabled={patchMutation.isPending}
                  className="rounded-none border-2 border-foreground"
                >
                  {patchMutation.isPending ? tCommon("loading") : t("save")}
                </Button>
                {patchMutation.isSuccess && (
                  <span className="ml-2 text-sm text-primary">{t("saved")}</span>
                )}
              </form>
            </CardContent>
          </Card>

          <Card className={cardClass}>
            <CardHeader>
              <CardTitle className="text-lg">{t("linkedAccounts")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between rounded-none border-2 border-border p-3">
                <span className="font-medium">{t("email")}</span>
                <span className="text-sm text-muted-foreground">{profile.email}</span>
              </div>
              <div className="flex items-center justify-between rounded-none border-2 border-border p-3">
                <span className="font-medium">{t("wallet")}</span>
                <span className="text-sm text-muted-foreground">
                  {profile.wallet_public_key
                    ? `${profile.wallet_public_key.slice(0, 4)}…${profile.wallet_public_key.slice(-4)}`
                    : t("notConnected")}
                </span>
              </div>
              {profile.linked_connections.map((c) => (
                <div
                  key={c.provider}
                  className="flex items-center justify-between rounded-none border-2 border-border p-3"
                >
                  <span className="font-medium capitalize">{c.provider}</span>
                  <span className="text-sm text-primary">{t("connected")}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className={cardClass}>
            <CardHeader>
              <CardTitle className="text-lg">{t("xp")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-2xl font-bold">
                {profile.xp.total_xp} XP · {t("level")} {profile.xp.level}
              </p>
              <Progress
                value={levelProgress(profile.xp.total_xp, profile.xp.level)}
                className="h-2"
              />
            </CardContent>
          </Card>

          <Card className={cardClass}>
            <CardHeader>
              <CardTitle className="text-lg">{t("streak")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-semibold">
                {profile.streak.current_streak_days} days · Longest:{" "}
                {profile.streak.longest_streak_days}
              </p>
            </CardContent>
          </Card>

          <Card className={cardClass}>
            <CardHeader>
              <CardTitle className="text-lg">{t("achievements")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-bold">{profile.achievement_count}</p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
