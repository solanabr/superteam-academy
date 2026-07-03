import { getTranslations } from "next-intl/server";

export default async function TeachPage() {
  const t = await getTranslations("teacher.area");

  return (
    <section aria-labelledby="teach-heading" className="mx-auto max-w-3xl">
      <h1
        id="teach-heading"
        className="font-display text-2xl font-bold text-[var(--text)]"
      >
        {t("title")}
      </h1>
      <p className="mt-2 text-sm text-[var(--text-3)]">{t("subtitle")}</p>

      <div className="mt-8 rounded-lg border border-[var(--border)] bg-[var(--card)] p-6 shadow-card">
        <h2 className="font-display text-lg font-bold text-[var(--text)]">
          {t("comingSoonTitle")}
        </h2>
        <p className="mt-2 text-sm text-[var(--text-2)]">
          {t("comingSoonBody")}
        </p>
      </div>
    </section>
  );
}
