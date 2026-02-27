"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { GraduationCap } from "@phosphor-icons/react";
import type { Certificate } from "@superteam-lms/types";
import { createClient } from "@/lib/supabase/client";
import { CertificateCard } from "@/components/certificates/certificate-card";
import { getCoursesByIds } from "@/lib/sanity/queries";
import { CERTIFICATE_STYLES as CS } from "@/lib/styles/styleClasses";

export default function CertificatesPage() {
  const t = useTranslations("certificates");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [subtitleMap, setSubtitleMap] = useState<Map<string, string>>(
    new Map()
  );
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

        if (certs && certs.length > 0) {
          const mapped = certs.map((cert) => ({
            id: cert.id,
            userId: cert.user_id,
            courseId: cert.course_id,
            courseTitle: cert.course_title,
            mintAddress: cert.mint_address ?? "",
            metadataUri: cert.metadata_uri ?? "",
            mintedAt: new Date(cert.minted_at),
          }));
          setCertificates(mapped);

          // Fetch course data from Sanity for learning path + difficulty
          const courseIds = [...new Set(mapped.map((c) => c.courseId))];
          const courses = await getCoursesByIds(courseIds);
          const sMap = new Map<string, string>();
          for (const course of courses) {
            const parts: string[] = [];
            if (course.learningPath) parts.push(course.learningPath);
            if (course.difficulty) {
              parts.push(
                course.difficulty.charAt(0).toUpperCase() +
                  course.difficulty.slice(1)
              );
            }
            if (parts.length > 0) {
              sMap.set(course._id, parts.join(" · "));
            }
          }
          setSubtitleMap(sMap);
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
      {/* Page header */}
      <div>
        <h1 className="font-display text-[30px] font-extrabold leading-[1.2] tracking-[-0.5px] text-text">
          {t("pageTitle")}
        </h1>
        <p className="mt-2 font-body text-[15px] text-text-3">
          {t("pageSubtitle")}
        </p>
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
            className="text-text-3"
            aria-hidden="true"
          />
          <p className="text-center font-body text-[15px] text-text-3">
            {t("noCertificates")}
          </p>
        </div>
      ) : (
        <div className={CS.full.grid}>
          {certificates.map((cert, i) => (
            <Link
              key={cert.id}
              href={`/${locale}/certificates/${cert.id}`}
              className="h-full"
              style={{ "--i": i } as React.CSSProperties}
            >
              <CertificateCard
                certificate={cert}
                recipientName={recipientName}
                subtitle={subtitleMap.get(cert.courseId)}
                variant="full"
              />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
