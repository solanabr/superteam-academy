"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { GraduationCap } from "@phosphor-icons/react";
import type { Certificate } from "@superteam-lms/types";
import { createClient } from "@/lib/supabase/client";
import { CertificateCard } from "@/components/certificates/certificate-card";
import { CERTIFICATE_STYLES as CS } from "@/lib/styles/styleClasses";

export default function CertificatesPage() {
  const t = useTranslations("certificates");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [recipientName, setRecipientName] = useState<string>("");

  useEffect(() => {
    async function fetchCertificates() {
      try {
        const supabase = createClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const user = session?.user ?? null;

        if (!user) {
          setIsLoading(false);
          return;
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("username")
          .eq("id", user.id)
          .single();

        if (profile) {
          setRecipientName(profile.username);
        }

        const { data: certs } = await supabase
          .from("certificates")
          .select("*")
          .eq("user_id", user.id)
          .order("minted_at", { ascending: false });

        if (certs) {
          setCertificates(
            certs.map((cert) => ({
              id: cert.id,
              userId: cert.user_id,
              courseId: cert.course_id,
              courseTitle: cert.course_title,
              mintAddress: cert.mint_address ?? "",
              metadataUri: cert.metadata_uri ?? "",
              mintedAt: new Date(cert.minted_at),
            }))
          );
        }

        setIsLoading(false);
      } catch {
        setCertificates([]);
        setIsLoading(false);
      }
    }

    fetchCertificates();
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-black tracking-[-0.5px]">
          {t("pageTitle")}
        </h1>
        <p className="mt-2 text-text-3">{t("pageSubtitle")}</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div
            className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"
            aria-hidden="true"
          />
          <span className="sr-only">{tCommon("loading")}</span>
        </div>
      ) : certificates.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-16">
          <GraduationCap
            size={48}
            weight="duotone"
            className="text-accent"
            aria-hidden="true"
          />
          <p className="text-center text-lg text-text-3">
            {t("noCertificates")}
          </p>
        </div>
      ) : (
        <div className={CS.full.grid}>
          {certificates.map((cert) => (
            <Link key={cert.id} href={`/${locale}/certificates/${cert.id}`}>
              <CertificateCard
                certificate={cert}
                recipientName={recipientName}
                variant="full"
              />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
