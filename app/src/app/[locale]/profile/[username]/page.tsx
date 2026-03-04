import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { ArrowLeft, User, Award, BookOpen, Star, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { truncateAddress, formatXp, getLevel } from "@/lib/utils";
import type { TokenHolder, HeliusAsset } from "@/lib/solana/helius";

type Props = { params: Promise<{ locale: string; username: string }> };

/** Solana base58 addresses are 32–44 chars, alphanumeric (no 0/O/I/l). */
function isWalletAddress(s: string): boolean {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(s);
}

async function fetchXpForOwner(
  owner: string,
  baseUrl: string
): Promise<number | null> {
  try {
    const res = await fetch(`${baseUrl}/api/helius/leaderboard`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const holders = (await res.json()) as TokenHolder[];
    const entry = holders.find(
      (h) => h.owner.toLowerCase() === owner.toLowerCase()
    );
    return entry?.amount ?? 0;
  } catch {
    return null;
  }
}

async function fetchCredentials(
  owner: string,
  baseUrl: string
): Promise<HeliusAsset[]> {
  try {
    const res = await fetch(
      `${baseUrl}/api/helius/credentials?owner=${encodeURIComponent(owner)}`,
      { next: { revalidate: 30 } }
    );
    if (!res.ok) return [];
    return (await res.json()) as HeliusAsset[];
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: Props) {
  const { locale, username } = await params;
  const t = await getTranslations({ locale, namespace: "profile" });
  return {
    title: `${username} — ${t("publicProfile.publicProfile")}`,
    description: t("publicProfile.metaDescription", { username }),
  };
}

export default async function PublicProfilePage({ params }: Props) {
  const { locale, username } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "profile" });

  const isWallet = isWalletAddress(username);

  // Determine base URL for internal API calls (server-side fetch needs absolute URL)
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000");

  // Fetch on-chain data only for wallet addresses
  const [xp, credentials] = isWallet
    ? await Promise.all([
        fetchXpForOwner(username, baseUrl),
        fetchCredentials(username, baseUrl),
      ])
    : [null, []];

  const level = xp != null ? getLevel(xp) : null;
  const displayName = isWallet ? truncateAddress(username) : username;

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 space-y-6">
      {/* Back link */}
      <Link href="/profile">
        <Button variant="ghost" size="sm" className="gap-1.5 -ml-2">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {t("publicProfile.backToProfile")}
        </Button>
      </Link>

      {/* Hero card */}
      <Card>
        <CardContent className="p-8">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
            <Avatar className="h-20 w-20 shrink-0">
              <AvatarFallback className="bg-primary/10 text-2xl">
                <User className="h-10 w-10 text-primary" aria-hidden="true" />
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 space-y-3 text-center sm:text-left">
              <div className="space-y-1">
                <h1 className="text-2xl font-bold">{displayName}</h1>
                {isWallet && (
                  <p className="text-xs text-muted-foreground font-mono break-all">
                    {username}
                  </p>
                )}
              </div>

              {isWallet && xp != null && (
                <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                  <Badge variant="secondary" className="gap-1.5">
                    <Zap className="h-3 w-3" aria-hidden="true" />
                    {t("totalXp")}: {formatXp(xp)}
                  </Badge>
                  {level !== null && level > 0 && (
                    <Badge variant="outline" className="gap-1.5">
                      <Star className="h-3 w-3" aria-hidden="true" />
                      Level {level}
                    </Badge>
                  )}
                </div>
              )}

              {!isWallet && (
                <p className="text-sm text-muted-foreground">
                  {t("publicProfile.publicProfileDescription")}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {isWallet ? (
        /* On-chain data sections */
        <div className="grid gap-4 sm:grid-cols-2">
          {/* XP & Level card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Zap className="h-5 w-5" aria-hidden="true" />
                {t("totalXp")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {xp != null ? (
                <>
                  <p className="text-3xl font-bold">{formatXp(xp)}</p>
                  {level !== null && (
                    <p className="text-sm text-muted-foreground">
                      Level {level}
                    </p>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Could not load XP data.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Credentials card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Award className="h-5 w-5" aria-hidden="true" />
                {t("credentials")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {credentials.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {t("noCredentials")}
                </p>
              ) : (
                <ul className="space-y-2">
                  {credentials.map((cred) => (
                    <li
                      key={cred.id}
                      className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
                    >
                      <Award className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                      <span className="truncate font-medium">
                        {cred.content.metadata.name}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              {credentials.length > 0 && (
                <p className="mt-3 text-xs text-muted-foreground">
                  {credentials.length}{" "}
                  {credentials.length === 1 ? "credential" : "credentials"} earned
                </p>
              )}
            </CardContent>
          </Card>

          {/* Achievements count card */}
          <Card className="sm:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <BookOpen className="h-5 w-5" aria-hidden="true" />
                {t("publicProfile.achievementsSection")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <span className="text-3xl font-bold">{credentials.length}</span>
                <span className="text-sm text-muted-foreground">
                  {credentials.length === 1
                    ? "credential NFT earned"
                    : "credential NFTs earned"}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        /* Stub sections for non-wallet usernames */
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <BookOpen className="h-5 w-5" aria-hidden="true" />
                {t("publicProfile.coursesSection")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {t("publicProfile.publicProfileDescription")}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Award className="h-5 w-5" aria-hidden="true" />
                {t("publicProfile.achievementsSection")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {t("publicProfile.publicProfileDescription")}
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
