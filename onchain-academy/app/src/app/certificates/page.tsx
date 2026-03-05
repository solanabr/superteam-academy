"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ExternalLink, ShieldCheck, Sparkles } from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocale } from "@/providers/locale-provider";
import { learningProgressService } from "@/services/learning-progress-service";
import { MOCK_CREDENTIALS } from "@/data/mock-credentials";
import type { Credential } from "@/types/domain";

export default function CertificatesPage(): React.JSX.Element {
  const { t } = useLocale();
  const { publicKey } = useWallet();
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">(
    "idle",
  );
  const isDemo = !publicKey;

  useEffect(() => {
    if (!publicKey) {
      setCredentials([]);
      setStatus("idle");
      return;
    }

    setStatus("loading");
    void learningProgressService
      .getCredentials(publicKey.toBase58())
      .then((rows) => {
        setCredentials(rows);
        setStatus("ready");
      })
      .catch(() => {
        setCredentials([]);
        setStatus("error");
      });
  }, [publicKey]);

  const displayCredentials = isDemo ? MOCK_CREDENTIALS : credentials;

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="space-y-2">
        <h1 className="font-display text-3xl font-semibold">
          {t("certificatesPage.title")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("certificatesPage.subtitle")}
        </p>
      </div>

      {isDemo ? (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="flex items-center gap-3 py-4 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4 shrink-0 text-primary" />
            <span>
              {t("certificatesPage.demoPreview") ??
                "Preview — connect your wallet to see your real credentials."}
            </span>
          </CardContent>
        </Card>
      ) : null}

      {status === "loading" ? (
        <Card>
          <CardContent className="py-8 text-sm text-muted-foreground">
            {t("certificatesPage.loading")}
          </CardContent>
        </Card>
      ) : null}

      {status === "error" ? (
        <Card>
          <CardContent className="py-8 text-sm text-[var(--semantic-error)]">
            {t("certificatesPage.error")}
          </CardContent>
        </Card>
      ) : null}

      {!isDemo && status === "ready" && credentials.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-sm text-muted-foreground">
            {t("certificatesPage.empty")}
          </CardContent>
        </Card>
      ) : null}

      {displayCredentials.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {displayCredentials.map((credential) => (
            <Card
              key={credential.credentialId}
              className="border-border/50 transition-shadow hover:shadow-lg"
            >
              <CardHeader className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base">
                    {credential.title}
                  </CardTitle>
                  <ShieldCheck
                    className={`h-4 w-4 shrink-0 ${credential.verified ? "text-primary" : "text-muted-foreground"}`}
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">{credential.track}</Badge>
                  <Badge variant="outline">
                    {t("certificatesPage.level")} {credential.level}
                  </Badge>
                  {credential.verified ? (
                    <Badge
                      variant="outline"
                      className="border-primary/30 text-primary"
                    >
                      {t("certificatePage.verified") ?? "Verified"}
                    </Badge>
                  ) : null}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <p className="line-clamp-1 font-mono text-xs text-muted-foreground">
                    {credential.mintAddress}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {credential.totalXp.toLocaleString()} XP &middot;{" "}
                    {credential.coursesCompleted}{" "}
                    {credential.coursesCompleted === 1 ? "course" : "courses"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="flex-1" asChild>
                    <Link href={`/certificates/${credential.credentialId}`}>
                      {t("certificatesPage.view")}
                    </Link>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    asChild
                  >
                    <a
                      href={credential.explorerUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {t("certificatesPage.verify")}{" "}
                      <ExternalLink className="ml-1 h-3 w-3" />
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}
    </div>
  );
}
