"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useI18n } from "@/components/providers/I18nProvider";
import { getLearningProgressService } from "@/lib/services/learning-progress";
import { getOnChainReadService } from "@/lib/services/onchain-read";
import { createClient } from "@/lib/supabase/client";
import type { Credential, Enrollment } from "@/lib/types/learning";
import Link from "next/link";

export default function CertificatesPage() {
  const { user, loading: authLoading } = useAuth();
  const { t } = useI18n();
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [completedEnrollments, setCompletedEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const currentUser = user;

    async function fetchCertificates() {
      setLoading(true);
      try {
        const supabase = createClient();
        const learningService = getLearningProgressService();
        const onChainService = getOnChainReadService();

        // Fetch enrollments to find completed courses
        const enrollments = await learningService.getEnrollments(currentUser.id);
        const completed = enrollments.filter((e) => e.completedAt !== null);
        setCompletedEnrollments(completed);

        // Fetch on-chain credentials if wallet linked
        const { data: wallets } = await supabase
          .from("linked_wallets")
          .select("wallet_address, is_primary")
          .eq("user_id", currentUser.id)
          .eq("is_primary", true)
          .limit(1);

        if (wallets && wallets.length > 0) {
          try {
            const creds = await onChainService.getCredentials(wallets[0].wallet_address);
            setCredentials(creds);
          } catch (error) {
            console.error("Error fetching on-chain credentials:", error);
          }
        }
      } catch (error) {
        console.error("Error fetching certificates:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchCertificates();
  }, [user]);

  if (authLoading || loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-neutral-300 dark:border-neutral-600 border-t-neutral-900 dark:border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6">
        <h1 className="text-2xl font-semibold">{t("common.signIn")}</h1>
        <Link href="/auth/sign-in" className="px-6 py-3 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-full text-sm font-semibold hover:bg-neutral-700 dark:hover:bg-neutral-200 transition-all">
          {t("common.signIn")}
        </Link>
      </div>
    );
  }

  const hasCertificates = credentials.length > 0 || completedEnrollments.length > 0;

  return (
    <div className="mx-auto space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight mb-2">
          {t("certificate.title")}s
        </h1>
        <p className="text-neutral-500 dark:text-neutral-400">
          {t("profile.credentialsDesc")}
        </p>
      </div>

      {!hasCertificates ? (
        /* Empty State */
        <div className="py-20 text-center rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-700">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-neutral-400">
              <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
              <path d="M9 18h6" />
              <path d="M10 22h4" />
            </svg>
          </div>
          <p className="text-neutral-400 text-lg mb-1">{t("certificate.noCertificates")}</p>
          <p className="text-neutral-400 text-sm mb-6">
            {t("certificate.noCertificatesDesc")}
          </p>
          <Link
            href="/courses"
            className="inline-block px-5 py-2.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-full text-xs font-semibold hover:bg-neutral-700 dark:hover:bg-neutral-200 transition-all"
          >
            {t("common.browseCourses")}
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {/* On-Chain Credentials */}
          {credentials.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-lg font-semibold">On-Chain Credentials</h2>
                <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full">
                  Verified
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {credentials.map((cred) => (
                  <Link
                    key={cred.mintAddress}
                    href={`/certificates/${cred.mintAddress}`}
                    className="group p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-neutral-300 dark:hover:border-neutral-700 hover:shadow-lg transition-all"
                  >
                    <div className="aspect-video rounded-xl bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-800 dark:to-neutral-700 mb-4 overflow-hidden flex items-center justify-center">
                      {cred.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={cred.imageUrl} alt={cred.trackName} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      ) : (
                        <div className="text-4xl">&#127942;</div>
                      )}
                    </div>
                    <h3 className="font-semibold text-sm mb-1 group-hover:text-neutral-700 dark:group-hover:text-neutral-300 transition-colors">{cred.trackName}</h3>
                    <p className="text-xs text-neutral-400">Level {cred.level}</p>
                    <div className="flex items-center gap-1 mt-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      <span className="text-[10px] text-green-600 dark:text-green-400 font-medium">On-chain verified</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Completed Courses (earned certificates) */}
          {completedEnrollments.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-4">Course Completions</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {completedEnrollments.map((enrollment) => (
                  <Link
                    key={enrollment.id}
                    href={`/certificates/${enrollment.id}`}
                    className="group p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-neutral-300 dark:hover:border-neutral-700 hover:shadow-lg transition-all"
                  >
                    <div className="aspect-video rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 border border-neutral-100 dark:border-neutral-800 mb-4 flex items-center justify-center">
                      <div className="text-center">
                        <span className="text-2xl font-semibold tracking-tight text-neutral-300 dark:text-neutral-600">Caminho.</span>
                      </div>
                    </div>
                    <h3 className="font-semibold text-sm mb-1 group-hover:text-neutral-700 dark:group-hover:text-neutral-300 transition-colors">
                      {enrollment.courseTitle}
                    </h3>
                    <p className="text-xs text-neutral-400">
                      Completed {enrollment.completedAt ? new Date(enrollment.completedAt).toLocaleDateString() : ""}
                    </p>
                    <p className="text-xs text-neutral-400 mt-1">
                      {enrollment.completedLessons}/{enrollment.totalLessons} lessons
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
