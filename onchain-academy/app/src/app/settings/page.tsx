"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import bs58 from "bs58";
import { signIn, signOut, useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  User,
  Mail,
  Wallet,
  Link as LinkIcon,
  Save,
  Github,
  Twitter,
  Download,
  Shield,
  Globe,
  LogOut,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch } from "@/lib/api-client";
import type { Locale } from "@/types/domain";
import { useLocale } from "@/providers/locale-provider";

type LinkedAccountsResponse = {
  userId: string;
  wallets: Array<{ address: string; isPrimary: boolean }>;
  providers: Array<{ provider: string; providerAccountId: string }>;
};

type WalletNonceResponse = {
  message: string;
};

type UserProfileResponse = {
  id: string;
  username: string | null;
  displayName: string | null;
  email: string | null;
  bio: string | null;
  avatarUrl: string | null;
  twitterUrl: string | null;
  githubUrl: string | null;
  language: Locale;
  theme: "light" | "dark" | "system";
  profileVisibility: "public" | "private";
};

export default function SettingsPage(): React.JSX.Element {
  const { data: session, status } = useSession();
  const wallet = useWallet();
  const { theme, setTheme } = useTheme();
  const { locale, setLocale, t } = useLocale();

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [twitterUrl, setTwitterUrl] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [email, setEmail] = useState("");
  const [profileVisibility, setProfileVisibility] = useState<
    "public" | "private"
  >("public");
  const [links, setLinks] = useState<LinkedAccountsResponse | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [linking, setLinking] = useState<"wallet" | "google" | "github" | null>(
    null,
  );
  const [notice, setNotice] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isExporting, setIsExporting] = useState(false);

  const baseUserId = useMemo(() => {
    if (session?.user?.id) {
      return session.user.id;
    }
    if (wallet.publicKey) {
      return wallet.publicKey.toBase58();
    }
    return null;
  }, [session?.user?.id, wallet.publicKey]);

  const linkedWalletAddress = useMemo(() => {
    const primary = links?.wallets.find((item) => item.isPrimary);
    return primary?.address ?? links?.wallets[0]?.address ?? null;
  }, [links]);

  const googleLinked = useMemo(
    () =>
      Boolean(
        links?.providers.some((provider) => provider.provider === "google"),
      ),
    [links],
  );

  const githubLinked = useMemo(
    () =>
      Boolean(
        links?.providers.some((provider) => provider.provider === "github"),
      ),
    [links],
  );

  const loadProfile = useCallback(
    async (userId: string): Promise<void> => {
      try {
        const profile = await apiFetch<UserProfileResponse>(
          `/user/profile/${encodeURIComponent(userId)}`,
        );
        if (profile.displayName) {
          setName(profile.displayName);
        }
        setBio(profile.bio ?? "");
        setEmail(profile.email ?? "");
        setAvatarUrl(profile.avatarUrl ?? "");
        setTwitterUrl(profile.twitterUrl ?? "");
        setGithubUrl(profile.githubUrl ?? "");
        setProfileVisibility(profile.profileVisibility);
        setLocale(profile.language);
        setTheme(profile.theme);
      } catch {
        // Keep local defaults if profile is unavailable.
      }
    },
    [setLocale, setTheme],
  );

  useEffect(() => {
    setEmail(session?.user?.email ?? "");
  }, [session?.user?.email]);

  useEffect(() => {
    if (!baseUserId) {
      setLinks(null);
      return;
    }

    void refreshLinks(baseUserId);
    void loadProfile(baseUserId);
  }, [baseUserId, loadProfile]);

  async function refreshLinks(userId: string): Promise<void> {
    try {
      const result = await apiFetch<LinkedAccountsResponse>(
        `/auth/account/links/${encodeURIComponent(userId)}`,
      );
      setLinks(result);
    } catch {
      setLinks({ userId, wallets: [], providers: [] });
    }
  }

  async function handleSaveProfile(): Promise<void> {
    if (!baseUserId) {
      setError("Connect a wallet or sign in to save profile settings.");
      return;
    }

    if (!session?.backendToken) {
      setError("Sign in first to save profile settings.");
      return;
    }

    try {
      setIsSaving(true);
      setError("");
      setNotice("");

      await apiFetch<UserProfileResponse>(
        `/user/profile/${encodeURIComponent(baseUserId)}`,
        {
          method: "PUT",
          body: JSON.stringify({
            displayName: name,
            email: email || undefined,
            bio: bio || undefined,
            avatarUrl: avatarUrl || undefined,
            twitterUrl: twitterUrl || undefined,
            githubUrl: githubUrl || undefined,
            language: locale,
            theme:
              (theme as "light" | "dark" | "system" | undefined) ?? "system",
            profileVisibility,
          }),
          ...(session?.backendToken ? { token: session.backendToken } : {}),
        },
      );

      setNotice("Profile preferences saved.");
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not save profile settings.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleRequestExport(): Promise<void> {
    if (!baseUserId || !session?.backendToken) {
      setError("Sign in first to request export.");
      return;
    }

    try {
      setIsExporting(true);
      setError("");
      const response = await apiFetch<{
        status: "accepted";
        requestId: string;
        message: string;
      }>("/user/export", {
        method: "POST",
        body: JSON.stringify({}),
        token: session.backendToken,
      });
      setNotice(`${response.message} (${response.requestId.slice(0, 8)}...)`);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Failed to request data export.",
      );
    } finally {
      setIsExporting(false);
    }
  }

  async function handleWalletSignIn(): Promise<void> {
    if (!wallet.publicKey || !wallet.signMessage) {
      setError("Connect a wallet that supports message signing to continue.");
      return;
    }

    try {
      setLinking("wallet");
      setError("");
      setNotice("");

      const nonceResponse = await apiFetch<WalletNonceResponse>(
        "/auth/wallet/nonce",
        {
          method: "POST",
          body: JSON.stringify({ walletAddress: wallet.publicKey.toBase58() }),
        },
      );

      const signature = await wallet.signMessage(
        new TextEncoder().encode(nonceResponse.message),
      );
      const result = await signIn("wallet", {
        walletAddress: wallet.publicKey.toBase58(),
        signature: bs58.encode(signature),
        redirect: false,
      });

      if (result?.error) {
        throw new Error(result.error);
      }

      setNotice("Wallet authenticated successfully.");
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Wallet authentication failed",
      );
    } finally {
      setLinking(null);
    }
  }

  async function handleLinkWallet(): Promise<void> {
    if (!wallet.publicKey) {
      setError("Connect a wallet first.");
      return;
    }

    if (!session?.backendToken) {
      setError("Sign in first before linking a wallet.");
      return;
    }

    try {
      setLinking("wallet");
      setError("");
      setNotice("");

      await apiFetch<{ linked: boolean }>("/auth/account/link-wallet", {
        method: "POST",
        body: JSON.stringify({
          walletAddress: wallet.publicKey.toBase58(),
          isPrimary: true,
        }),
        token: session.backendToken,
      });

      setNotice("Wallet linked successfully.");
      if (session.user.id) {
        await refreshLinks(session.user.id);
      }
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not link wallet",
      );
    } finally {
      setLinking(null);
    }
  }

  function startOAuthLink(provider: "google" | "github"): void {
    setLinking(provider);
    void signIn(provider, { callbackUrl: "/settings" })
      .then((result) => {
        if (result?.error) {
          setError(result.error);
        }
      })
      .finally(() => {
        setLinking(null);
      });
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-20">
      <header className="pt-8 pb-4 border-b border-border/40">
        <h1 className="font-display text-4xl font-bold tracking-tight text-foreground mb-2">
          {t("settingsPage.title")}
        </h1>
        <p className="text-muted-foreground">{t("settingsPage.subtitle")}</p>
      </header>

      {notice ? (
        <Card className="border-primary/40 bg-primary/5 px-4 py-3 text-sm text-primary">
          {notice}
        </Card>
      ) : null}
      {error ? (
        <Card className="border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </Card>
      ) : null}

      <div className="grid md:grid-cols-[1fr_320px] gap-8">
        <div className="space-y-6">
          <Card className="bg-background/40 backdrop-blur-md border-border/50 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />{" "}
                {t("settingsPage.publicProfile")}
              </CardTitle>
              <CardDescription>
                {t("settingsPage.publicProfileDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="name">{t("settingsPage.displayName")}</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="max-w-md bg-background"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">{t("settingsPage.biography")}</Label>
                <textarea
                  id="bio"
                  value={bio}
                  onChange={(event) => setBio(event.target.value)}
                  rows={4}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="avatarUrl" className="flex items-center gap-2">
                  <User className="h-4 w-4" /> Avatar URL
                </Label>
                <Input
                  id="avatarUrl"
                  type="url"
                  value={avatarUrl}
                  onChange={(event) => setAvatarUrl(event.target.value)}
                  placeholder="https://..."
                  className="max-w-md bg-background"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="githubUrl"
                    className="flex items-center gap-2"
                  >
                    <Github className="h-4 w-4" /> GitHub URL
                  </Label>
                  <Input
                    id="githubUrl"
                    type="url"
                    value={githubUrl}
                    onChange={(event) => setGithubUrl(event.target.value)}
                    placeholder="https://github.com/username"
                    className="bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="twitterUrl"
                    className="flex items-center gap-2"
                  >
                    <Twitter className="h-4 w-4" /> Twitter / X URL
                  </Label>
                  <Input
                    id="twitterUrl"
                    type="url"
                    value={twitterUrl}
                    onChange={(event) => setTwitterUrl(event.target.value)}
                    placeholder="https://x.com/username"
                    className="bg-background"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" /> {t("settingsPage.contactEmail")}
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="max-w-md bg-background"
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />{" "}
                  {t("settingsPage.profileVisibility")}
                </Label>
                <div className="flex gap-2">
                  <Button
                    variant={
                      profileVisibility === "public" ? "secondary" : "outline"
                    }
                    size="sm"
                    onClick={() => setProfileVisibility("public")}
                  >
                    {t("settingsPage.visibilityPublic")}
                  </Button>
                  <Button
                    variant={
                      profileVisibility === "private" ? "secondary" : "outline"
                    }
                    size="sm"
                    onClick={() => setProfileVisibility("private")}
                  >
                    {t("settingsPage.visibilityPrivate")}
                  </Button>
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t border-border/40 py-4 flex justify-end">
              <Button onClick={handleSaveProfile} disabled={isSaving}>
                {isSaving ? (
                  t("settingsPage.saving")
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />{" "}
                    {t("settingsPage.saveChanges")}
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>

          <Card className="bg-background/40 backdrop-blur-md border-border/50 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-secondary" />{" "}
                {t("settingsPage.preferencesTitle")}
              </CardTitle>
              <CardDescription>
                {t("settingsPage.preferencesDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>{t("settingsPage.theme")}</Label>
                <div className="flex gap-2">
                  <Button
                    variant={theme === "system" ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => setTheme("system")}
                  >
                    {t("settingsPage.themeSystem")}
                  </Button>
                  <Button
                    variant={theme === "dark" ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => setTheme("dark")}
                  >
                    {t("settingsPage.themeDark")}
                  </Button>
                  <Button
                    variant={theme === "light" ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => setTheme("light")}
                  >
                    {t("settingsPage.themeLight")}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t("settingsPage.language")}</Label>
                <div className="flex gap-2">
                  <Button
                    variant={locale === "en" ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => setLocale("en")}
                  >
                    EN
                  </Button>
                  <Button
                    variant={locale === "pt-BR" ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => setLocale("pt-BR")}
                  >
                    PT-BR
                  </Button>
                  <Button
                    variant={locale === "es" ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => setLocale("es")}
                  >
                    ES
                  </Button>
                </div>
              </div>
              <Button variant="outline" className="justify-start w-full">
                {t("settingsPage.notifications")}
              </Button>
              <Button
                variant="outline"
                className="justify-start w-full"
                disabled={isExporting}
                onClick={handleRequestExport}
              >
                <Download className="h-4 w-4 mr-2" />{" "}
                {isExporting
                  ? t("settingsPage.requesting")
                  : t("settingsPage.requestExport")}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6 md:sticky md:top-24 md:self-start">
          <Card className="bg-background/40 backdrop-blur-md border-border/50 shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <LinkIcon className="h-4 w-4" />{" "}
                {t("settingsPage.linkedAccounts")}
              </CardTitle>
              <CardDescription>
                {t("settingsPage.linkedAccountsDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 rounded-xl border border-border/50 bg-background/50 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold">
                      {t("settingsPage.wallet")}
                    </span>
                  </div>
                  {linkedWalletAddress ? (
                    <Badge
                      variant="outline"
                      className="text-primary border-primary/30"
                    >
                      {t("settingsPage.linked")}
                    </Badge>
                  ) : (
                    <Badge variant="outline">
                      {t("settingsPage.notLinked")}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground font-mono">
                  {linkedWalletAddress ??
                    (wallet.publicKey
                      ? wallet.publicKey.toBase58()
                      : t("settingsPage.noWalletConnected"))}
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={linking === "wallet"}
                    onClick={handleWalletSignIn}
                  >
                    {t("settingsPage.signIn")}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={linking === "wallet" || !wallet.publicKey}
                    onClick={handleLinkWallet}
                  >
                    {t("settingsPage.link")}
                  </Button>
                </div>
              </div>

              <div className="p-3 rounded-xl border border-border/50 bg-background/50 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <svg
                      viewBox="0 0 24 24"
                      className="h-4 w-4"
                      aria-hidden="true"
                    >
                      <path
                        fill="currentColor"
                        d="M21.8 10.2h-9.6v3.9h5.5c-.2 1.3-1.5 3.9-5.5 3.9-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.9 3.6 14.8 2.8 12.2 2.8 6.9 2.8 2.6 7.1 2.6 12.4s4.3 9.6 9.6 9.6c5.5 0 9.2-3.9 9.2-9.4 0-.6-.1-1-.2-1.4z"
                      />
                    </svg>
                    <span className="text-sm font-semibold">Google</span>
                  </div>
                  {googleLinked ? (
                    <Badge
                      variant="outline"
                      className="text-primary border-primary/30"
                    >
                      {t("settingsPage.linked")}
                    </Badge>
                  ) : (
                    <Badge variant="outline">
                      {t("settingsPage.notLinked")}
                    </Badge>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={linking === "google"}
                  onClick={() => startOAuthLink("google")}
                >
                  {t("settingsPage.linkGoogle")}
                </Button>
              </div>

              <div className="p-3 rounded-xl border border-border/50 bg-background/50 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Github className="h-4 w-4" />
                    <span className="text-sm font-semibold">GitHub</span>
                  </div>
                  {githubLinked ? (
                    <Badge
                      variant="outline"
                      className="text-primary border-primary/30"
                    >
                      {t("settingsPage.linked")}
                    </Badge>
                  ) : (
                    <Badge variant="outline">
                      {t("settingsPage.notLinked")}
                    </Badge>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={linking === "github"}
                  onClick={() => startOAuthLink("github")}
                >
                  {t("settingsPage.linkGithub")}
                </Button>
              </div>

              <div className="pt-2 border-t border-border/40">
                {status === "authenticated" ? (
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-destructive hover:text-destructive"
                    onClick={() => void signOut({ callbackUrl: "/settings" })}
                  >
                    <LogOut className="h-4 w-4 mr-2" />{" "}
                    {t("settingsPage.signOut")}
                  </Button>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    {t("settingsPage.signInToManage")}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-destructive/30 bg-destructive/5 shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-destructive text-sm font-bold uppercase tracking-wider">
                {t("settingsPage.dangerZone")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-4">
                {t("settingsPage.dangerDesc")}
              </p>
              <Button
                variant="destructive"
                size="sm"
                className="w-full font-bold"
              >
                {t("settingsPage.deleteAccount")}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
