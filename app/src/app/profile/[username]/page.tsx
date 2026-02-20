"use client";

import { use, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { PlatformLayout } from "@/components/layout";
import { XPDisplay } from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabaseProfileService } from "@/services";
import { mockXPService } from "@/services";
import type { UserProfile, XPBalance } from "@/types";
import { Calendar, Zap, User } from "lucide-react";

export default function UserProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = use(params);
  const t = useTranslations("profile");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [balance, setBalance] = useState<XPBalance | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const p = await supabaseProfileService.getProfileByUsername(username);
      setProfile(p);
      if (p) {
        const xp = await mockXPService.getBalanceByUserId(p.id);
        setBalance(xp);
      }
      setLoading(false);
    }
    load();
  }, [username]);

  if (loading) {
    return (
      <PlatformLayout>
        <div className="container mx-auto px-4 py-12 max-w-2xl space-y-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
          <Skeleton className="h-20" />
        </div>
      </PlatformLayout>
    );
  }

  if (!profile) {
    return (
      <PlatformLayout>
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
          <User className="h-12 w-12 text-muted-foreground/30" />
          <p className="text-muted-foreground">User not found</p>
        </div>
      </PlatformLayout>
    );
  }

  return (
    <PlatformLayout>
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <div className="flex items-center gap-5 mb-8">
          <Avatar className="h-16 w-16">
            <AvatarImage src={profile.avatarUrl ?? undefined} />
            <AvatarFallback className="text-xl">
              {profile.displayName.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{profile.displayName}</h1>
              {balance && (
                <Badge variant="secondary" className="text-xs gap-1">
                  <Zap className="h-3 w-3" />
                  Level {balance.level}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              @{profile.username}
            </p>
          </div>
        </div>

        {profile.bio && (
          <p className="text-sm text-muted-foreground mb-6">{profile.bio}</p>
        )}

        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-8">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {t("memberSince")}{" "}
            {new Date(profile.joinedAt).toLocaleDateString()}
          </span>
          {profile.walletAddress && (
            <span className="font-mono">
              {profile.walletAddress.slice(0, 4)}...
              {profile.walletAddress.slice(-4)}
            </span>
          )}
        </div>

        {balance && <XPDisplay xp={balance.amount} />}

        <div className="grid grid-cols-2 gap-4 mt-8">
          <div className="rounded-xl border bg-card p-4 text-center">
            <p className="text-2xl font-bold">{balance?.amount ?? 0}</p>
            <p className="text-xs text-muted-foreground">{t("totalXp")}</p>
          </div>
          <div className="rounded-xl border bg-card p-4 text-center">
            <p className="text-2xl font-bold">{balance?.level ?? 0}</p>
            <p className="text-xs text-muted-foreground">{t("level")}</p>
          </div>
        </div>
      </div>
    </PlatformLayout>
  );
}
