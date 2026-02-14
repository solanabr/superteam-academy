"use client";

import { useMemo } from "react";
import { useI18n } from "@/lib/i18n/provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type CertificatePageProps = {
  params: {
    id: string;
  };
};

export default function CertificatePage({ params }: CertificatePageProps): JSX.Element {
  const { t } = useI18n();
  const explorerUrl = useMemo(
    () => `https://explorer.solana.com/address/${encodeURIComponent(params.id)}?cluster=devnet`,
    [params.id]
  );

  const handleShare = async (): Promise<void> => {
    const shareUrl = `${window.location.origin}/certificates/${params.id}`;
    if (navigator.share) {
      await navigator.share({
        title: "Superteam Academy Certificate",
        text: "Verify my Solana learning certificate.",
        url: shareUrl
      });
      return;
    }

    await navigator.clipboard.writeText(shareUrl);
  };

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-10">
      <h1 className="text-3xl font-bold">{t("certificate.title")}</h1>
      <Card>
        <CardHeader>
          <CardTitle>{t("certificate.credentialTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border bg-gradient-to-r from-purple-500/20 to-cyan-500/20 p-8 text-center">
            <p className="text-xl font-semibold">Certificate ID: {params.id}</p>
            <p className="text-sm text-muted-foreground">{t("certificate.issuedOnDevnet")}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <a href={explorerUrl} target="_blank" rel="noreferrer">
                {t("certificate.verifyOnChain")}
              </a>
            </Button>
            <Button variant="outline" onClick={handleShare}>
              {t("certificate.share")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
