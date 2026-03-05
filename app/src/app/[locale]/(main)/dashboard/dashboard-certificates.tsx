"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Award, ArrowRight } from "lucide-react";
import { useMintCertificate } from "@/hooks/use-mint-certificate";
import type { CertificateData } from "@/types/certificate";

function truncateId(id: string): string {
  if (!id || id.length <= 12) return id || "—";
  return `${id.slice(0, 6)}...${id.slice(-4)}`;
}

export function DashboardCertificates() {
  const { connected } = useAuth();
  const t = useTranslations("dashboard");
  const tCert = useTranslations("certificate");
  const { getCertificates } = useMintCertificate();
  const [certs, setCerts] = useState<CertificateData[]>([]);

  useEffect(() => {
    if (!connected) return;
    setCerts(getCertificates());
  }, [connected, getCertificates]);

  if (!connected) return null;
  if (certs.length === 0) return null;

  const display = certs.slice(0, 3);

  return (
    <section className="mb-8">
      <h2 className="mb-4 text-center text-xl font-semibold text-[hsl(var(--brand-logo-green))] drop-shadow-md">
        {t("myCertificates")}
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {display.map((cert) => (
          <Link
            key={cert.courseSlug}
            href={`/certificates/${cert.courseSlug}`}
            className="rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <Card className="h-full overflow-hidden transition-all hover:border-primary/50 hover:shadow-md">
              {/* Gradient bar */}
              <div className="gradient-solana h-1.5 w-full" />

              <CardHeader className="flex flex-row items-start gap-3 pb-2 pt-4">
                <div className="gradient-solana flex h-10 w-10 shrink-0 items-center justify-center rounded-full shadow-sm">
                  <Award className="h-5 w-5 text-white" strokeWidth={1.5} />
                </div>
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-base leading-tight">
                    {cert.courseTitle}
                  </CardTitle>
                  {cert.track && (
                    <span className="mt-1 inline-block rounded-full bg-primary/20 px-2.5 py-0.5 text-xs font-medium text-primary">
                      {cert.track}
                    </span>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-1.5 pb-4">
                <p className="text-xs text-muted-foreground">
                  {tCert("completedOn")}:{" "}
                  <span className="font-medium text-foreground">
                    {new Date(cert.mintedAt).toLocaleDateString()}
                  </span>
                </p>
                {cert.txSig && (
                  <p className="text-xs text-muted-foreground">
                    Tx:{" "}
                    <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">
                      {truncateId(cert.txSig)}
                    </code>
                  </p>
                )}
                <p className="pt-1 text-xs font-medium text-sky-600">
                  {tCert("viewCertificate")}{" "}
                  <ArrowRight className="inline h-3 w-3" />
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
      {certs.length > 3 && (
        <div className="mt-4 text-center">
          <Link
            href="/certificates"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-sky-600 hover:underline"
          >
            {t("viewAll")} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}
    </section>
  );
}
