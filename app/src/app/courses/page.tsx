"use client";

import { CourseList } from "@/components/CourseList";
import { useWallet } from "@solana/wallet-adapter-react";
import { useLanguage } from "@/context/LanguageContext";

export default function CoursesPage() {
  const { connected } = useWallet();
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-6 py-10 space-y-8">

        {!connected && (
          <div className="mb-4 text-center space-y-1">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              {t("courses.exploreTitle")}
            </h1>
            <p className="text-muted-foreground text-base max-w-2xl mx-auto leading-relaxed">
              {t("courses.exploreSubtitle")}
            </p>
          </div>
        )}

        {connected && (
          <div className="mb-4 space-y-1">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              {t("courses.catalogTitle")}
            </h1>
            <p className="text-muted-foreground text-sm max-w-xl leading-relaxed">
              {t("courses.catalogSubtitle")}
            </p>
          </div>
        )}

        <CourseList />
      </main>
    </div>
  );
}