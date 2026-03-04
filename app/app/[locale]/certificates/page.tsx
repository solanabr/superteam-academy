import Link from "next/link";
import { getTranslations, getLocale } from "next-intl/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { Award01Icon, ArrowRight02Icon } from "@hugeicons/core-free-icons";
import { credentialService, userService } from "@/lib/services";
import { levelBadgeClasses } from "@/lib/utils";

function truncateAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function getLevelName(level: number, t: (key: string) => string): string {
  switch (level) {
    case 1: return t("certificates.levelBeginner");
    case 2: return t("certificates.levelIntermediate");
    case 3: return t("certificates.levelAdvanced");
    default: return t("certificates.levelBeginner");
  }
}

function getLevelKey(level: number): string {
  switch (level) {
    case 1: return "Beginner";
    case 2: return "Intermediate";
    case 3: return "Advanced";
    default: return "Beginner";
  }
}

export default async function CertificatesPage() {
  const t = await getTranslations();
  const locale = await getLocale();
  const credentials = await credentialService.getCredentials();
  await userService.getProfile();

  return (
    <div className="py-4">
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          {t("certificates.heading")}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {t("certificates.description")}
        </p>
      </div>

      {credentials.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <HugeiconsIcon icon={Award01Icon} size={32} strokeWidth={1.5} color="currentColor" />
          </div>
          <h3 className="text-lg font-semibold">{t("certificates.noCertificates")}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("certificates.noCertificatesDesc")}
          </p>
          <Link href={`/${locale}/courses`}>
            <Button className="mt-4">
              {t("certificates.browseCourses")}
              <HugeiconsIcon icon={ArrowRight02Icon} size={16} />
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {credentials.map((credential) => (
            <Link key={credential.id} href={`/${locale}/certificates/${credential.id}`}>
              <Card className="transition-colors hover:border-primary/50 hover:bg-muted/50">
                <CardHeader className="flex flex-row items-center gap-4 pb-2">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <HugeiconsIcon icon={Award01Icon} size={24} strokeWidth={1.5} color="currentColor" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-base">{credential.track}</CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {t("certificates.credentialLevel")} {credential.level}
                    </p>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <Badge className={levelBadgeClasses(getLevelKey(credential.level))}>
                      {getLevelName(credential.level, t)}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(credential.issuedAt).toLocaleDateString()}
                    </span>
                  </div>
                  {credential.mintAddress && (
                    <p className="mt-3 font-mono text-xs text-muted-foreground">
                      {truncateAddress(credential.mintAddress)}
                    </p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
