"use client";

import { useTranslations } from "next-intl";
import { useWallet } from "@solana/wallet-adapter-react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { CreatorStatsCards } from "@/components/creator/creator-stats";
import { CourseAnalytics } from "@/components/creator/course-analytics";

export default function CreatorDashboardPage() {
  const t = useTranslations("creator");
  const tc = useTranslations("common");
  const { publicKey } = useWallet();

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-4 py-8">
          <h1 className="mb-8 text-3xl font-bold text-content">{t("title")}</h1>

          {!publicKey ? (
            <div className="flex min-h-[40vh] items-center justify-center text-content-muted">
              {tc("noWallet")}
            </div>
          ) : (
            <div className="space-y-8">
              <CreatorStatsCards />
              <div>
                <h2 className="mb-4 text-xl font-semibold text-content">
                  {t("course")}s
                </h2>
                <CourseAnalytics />
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
