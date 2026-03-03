import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { getCategories } from "@/lib/forum";
import { getTranslations } from "next-intl/server";
import { NewThreadForm } from "./NewThreadForm";

export const metadata: Metadata = {
  title: "New Thread",
  description: "Start a new discussion in the Superteam Academy community.",
};

export default async function NewThreadPage() {
  const [categories, t] = await Promise.all([
    getCategories(),
    getTranslations("newThread"),
  ]);

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs font-mono text-muted-foreground mb-8">
        <Link
          href="/community"
          className="hover:text-foreground transition-colors"
        >
          {t("breadcrumbCommunity")}
        </Link>
        <span>/</span>
        <span className="text-foreground">{t("breadcrumbNew")}</span>
      </nav>

      <div className="bg-card border border-border rounded-lg p-6">
        <div className="mb-6">
          <h1 className="font-mono text-xl font-bold text-foreground mb-1">
            {t("pageTitle")}
          </h1>
          <p className="text-xs text-muted-foreground">{t("pageSubtitle")}</p>
        </div>

        {categories.length === 0 ? (
          <div className="text-center py-8">
            <p className="font-mono text-sm text-muted-foreground">
              {t("loadError")}
            </p>
          </div>
        ) : (
          <NewThreadForm categories={categories} />
        )}
      </div>
    </div>
  );
}
