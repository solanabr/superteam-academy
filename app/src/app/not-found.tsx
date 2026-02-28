"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export default function NotFound() {
  const t = useTranslations("errors");

  return (
    <div className="relative flex min-h-screen flex-col">
      <Header />
      <main className="flex flex-1 flex-col items-center justify-center px-4 text-center">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/10">
          <span className="text-4xl font-bold text-primary">404</span>
        </div>
        <h1 className="mt-6 font-heading text-3xl font-bold">{t("notFound.title")}</h1>
        <p className="mt-3 max-w-md text-muted-foreground">
          {t("notFound.description")}
        </p>
        <div className="mt-8 flex gap-4">
          <Link
            href="/"
            className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {t("notFound.goHome")}
          </Link>
          <Link
            href="/courses"
            className="rounded-xl border border-border px-6 py-3 text-sm font-semibold transition-colors hover:bg-muted"
          >
            {t("notFound.browseCourses")}
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
