import { getTranslations } from "next-intl/server";

// Gated by the teacher-role check in layout.tsx (reads auth cookies) — render
// per-request, never as static HTML.
export const dynamic = "force-dynamic";

export default async function TeachPage() {
  const t = await getTranslations("teach");

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-bold text-text">{t("title")}</h1>
      <p className="mt-2 text-text-2">{t("subtitle")}</p>

      <div className="mt-6 rounded-lg border border-border bg-card p-6 text-sm text-text-3 shadow-card">
        {t("comingSoon")}
      </div>
    </div>
  );
}
