"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/hooks/useUser";
import { useWallet } from "@solana/wallet-adapter-react";
import { signIn, signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Wallet, LogOut, Unlink, Sparkles } from "lucide-react";
import { FaGithub } from "react-icons/fa";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";

const WalletButton = dynamic(() => import("@/components/WalletButton"), { ssr: false });

export default function SettingsPage() {
  const { publicKey } = useWallet();
  const { data: session, update: updateSession } = useSession();
  const { userDb, loading: userLoading, refetchUser } = useUser();
  const t = useTranslations("SettingsPage");

  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({ username: "", bio: "" });

  useEffect(() => {
    if (userDb) {
      setFormData({ username: userDb.username || "", bio: userDb.bio || "" });
    }
  }, [userDb]);

  const linkWallet = async () => {
    if (!publicKey || !session) return;
    try {
      const res = await fetch("/api/user/link-wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress: publicKey.toString() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }

      toast.success(t("walletLinked"));
      await updateSession({ walletAddress: publicKey.toString() });
      await refetchUser();
    } catch (error: any) {
      toast.error(error.message || t("genericError"));
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/user/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress: publicKey?.toString(), username: formData.username, bio: formData.bio }),
      });

      if (!res.ok) throw new Error("Failed to update");

      toast.success(t("profileUpdated"));
      await refetchUser();
    } catch (_error) {
      toast.error(t("updateError"));
    } finally {
      setSaving(false);
    }
  };

  const unlinkProvider = async (provider: string) => {
    try {
      const res = await fetch("/api/auth/unlink", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider }),
      });

      if (!res.ok) throw new Error("Failed to unlink");

      toast.success(t("providerDisconnected", { provider }));
      await refetchUser();
    } catch (_error) {
      toast.error(t("disconnectError"));
    }
  };

  if (userLoading) {
    return (
      <div className="flex justify-center p-10">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  const githubDisplayName =
    userDb?.githubHandle || (session?.user?.name && userDb?.accounts?.some((a: any) => a.provider === "github") ? session.user.name : null);
  const isUsernameLocked = !!userDb?.username && userDb.username.trim() !== "";

  return (
    <div className="mx-auto max-w-3xl space-y-8 py-8">
      <div className="rounded-2xl border border-white/10 bg-[radial-gradient(circle_at_top,rgba(168,85,247,0.2),transparent_55%)] p-6 backdrop-blur-md">
        <h1 className="bg-gradient-to-r from-purple-200 via-fuchsia-300 to-cyan-200 bg-clip-text text-3xl font-bold text-transparent">{t("title")}</h1>
        <p className="mt-2 text-zinc-400">{t("subtitle")}</p>
      </div>

      <Card className="border-white/10 bg-black/25 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Wallet className="h-5 w-5 text-cyan-300" /> {t("walletTitle")}</CardTitle>
          <CardDescription>{t("walletDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between rounded-xl border border-white/10 bg-zinc-950/60 p-4">
            <div>
              <p className="font-medium">{t("solanaWallet")}</p>
              <p className="text-sm text-muted-foreground">
                {userDb?.walletAddress ? `${userDb.walletAddress.slice(0, 6)}...${userDb.walletAddress.slice(-4)}` : t("notLinked")}
              </p>
            </div>

            <div className="flex flex-col items-end gap-2">
              {session && publicKey && (!userDb?.walletAddress || userDb.walletAddress !== publicKey.toString()) ? (
                <Button size="sm" onClick={linkWallet} className="bg-gradient-to-r from-purple-600 to-fuchsia-600">
                  {t("linkCurrentWallet")}
                </Button>
              ) : null}
              <WalletButton />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-black/25 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-fuchsia-300" /> {t("profileTitle")}</CardTitle>
          <CardDescription>{t("profileDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveProfile} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username">{t("username")}</Label>
              <Input
                id="username"
                placeholder={t("usernamePlaceholder")}
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                disabled={isUsernameLocked}
                className={isUsernameLocked ? "cursor-not-allowed bg-muted text-muted-foreground" : ""}
              />
              {isUsernameLocked && <p className="text-xs text-amber-400">{t("usernameLocked")}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">{t("bio")}</Label>
              <Textarea
                id="bio"
                placeholder={t("bioPlaceholder")}
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>{t("githubAccount")}</Label>
              {githubDisplayName ? (
                <div className="flex items-center justify-between rounded-md border border-white/10 bg-muted/20 p-3">
                  <div className="flex items-center gap-2">
                    <FaGithub className="h-5 w-5" />
                    <span className="font-medium">{githubDisplayName}</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => unlinkProvider("github")} type="button" className="text-muted-foreground hover:text-destructive">
                    <Unlink className="mr-2 h-4 w-4" /> {t("disconnect")}
                  </Button>
                </div>
              ) : (
                <Button variant="outline" className="w-full justify-start gap-2" onClick={() => signIn("github")} type="button">
                  <FaGithub /> {t("connectGithub")}
                </Button>
              )}
            </div>

            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={saving} className="border border-cyan-300/30 bg-gradient-to-r from-cyan-700 to-blue-700">
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t("saveProfile")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {session && (
        <div className="flex justify-end">
          <Button variant="ghost" className="text-muted-foreground hover:text-rose-300" onClick={() => signOut()}>
            <LogOut className="mr-2 h-4 w-4" /> {t("signOut")}
          </Button>
        </div>
      )}
    </div>
  );
}
