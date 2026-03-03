import { notFound } from "next/navigation";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Award01Icon,
  Share01Icon,
  Download01Icon,
  ArrowRight02Icon,
  SecurityCheckIcon,
  LinkSquare01Icon,
} from "@hugeicons/core-free-icons";
import { credentialService, userService } from "@/lib/services";
import { getTranslations } from "next-intl/server";

function truncateAddress(address: string) {
  return `${address.slice(0, 8)}...${address.slice(-8)}`;
}

export default async function CertificatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const credential = await credentialService.getCredential(id);

  if (!credential) notFound();

  const t = await getTranslations();
  const profile = await userService.getProfile();

  return (
    <div className="py-4">
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          {t("certificates.heading")}
        </h1>
      </div>

      <div className="mx-auto max-w-2xl">
        {/* Certificate card */}
        <Card className="animate-fade-in">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
              <HugeiconsIcon icon={Award01Icon} size={32} strokeWidth={1.5} color="currentColor" />
            </div>
            <CardTitle className="text-2xl">{credential.track}</CardTitle>
            <div className="mt-2 flex items-center justify-center gap-2">
              <Badge variant="secondary">
                {t("certificates.credentialLevel")} {credential.level}
              </Badge>
            </div>
          </CardHeader>

          <CardContent>
            <div className="flex flex-col gap-4">
              {/* Details */}
              <div className="rounded-lg border border-border p-4">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t("certificates.track")}</span>
                    <span className="font-medium text-foreground">{credential.track}</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t("certificates.issuedTo")}</span>
                    <span className="font-medium text-foreground">
                      {profile.username ?? truncateAddress(profile.wallet)}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t("certificates.issuedAt")}</span>
                    <span className="font-medium text-foreground">
                      {new Date(credential.issuedAt).toLocaleDateString()}
                    </span>
                  </div>
                  {credential.mintAddress && (
                    <>
                      <Separator />
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{t("certificates.mintAddress")}</span>
                        <span className="font-mono text-xs font-medium text-foreground">
                          {truncateAddress(credential.mintAddress)}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Verification badges */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <HugeiconsIcon icon={SecurityCheckIcon} size={14} strokeWidth={2} color="currentColor" />
                  <span>{t("certificates.verifiedOnChain")}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <HugeiconsIcon icon={LinkSquare01Icon} size={14} strokeWidth={2} color="currentColor" />
                  <span>{t("certificates.soulbound")}</span>
                </div>
              </div>

              <Separator />

              {/* Actions */}
              <div className="flex flex-col gap-2 sm:flex-row">
                {credential.mintAddress && (
                  <a
                    href={`https://explorer.solana.com/address/${credential.mintAddress}?cluster=devnet`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border border-input bg-background px-2.5 text-sm font-medium ring-offset-background transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                  >
                    {t("certificates.viewOnExplorer")}
                    <HugeiconsIcon icon={ArrowRight02Icon} size={14} data-icon="inline-end" />
                  </a>
                )}
                <Button variant="outline" size="lg" className="flex-1">
                  <HugeiconsIcon icon={Share01Icon} size={14} color="currentColor" />
                  {t("certificates.shareCredential")}
                </Button>
                <Button variant="outline" size="lg" className="flex-1">
                  <HugeiconsIcon icon={Download01Icon} size={14} color="currentColor" />
                  {t("certificates.downloadCertificate")}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
