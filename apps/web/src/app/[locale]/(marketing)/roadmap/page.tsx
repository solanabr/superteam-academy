import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Footer } from "@/components/layout/footer";
import {
  ROADMAP_NEXT,
  ROADMAP_SHIPPED,
  formatRoadmapDate,
} from "@/lib/marketing/roadmap";

export const metadata: Metadata = {
  title: "Roadmap — Superteam Academy",
  description:
    "What shipped and when, and what Superteam Academy is building next. Every shipped entry is dated and checkable against the open-source history.",
};

/**
 * The public roadmap (#876). A dated cadence is the deliverable — an undated
 * feature list is not — so every SHIPPED entry prints the day the work landed
 * on main, and the PLANNED entries deliberately print no date at all (a public
 * date goes up only once the owner has confirmed it).
 *
 * Server component: the entries are static, the only per-locale work is date
 * formatting and copy lookup.
 */
export default async function RoadmapPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "roadmap" });

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <div className="container max-w-4xl px-4 py-12 sm:py-16 md:py-24">
          <h1 className="font-display text-3xl font-black tracking-tight sm:text-5xl">
            {t("title")}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-text-2">
            {t("subtitle")}
          </p>
          <a
            href="https://github.com/solanabr/superteam-academy/commits/main"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-block text-sm font-semibold text-primary underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            {t("repoLink")} {"↗"}
          </a>

          {/* ── Shipped — dated, newest first ── */}
          <section aria-labelledby="roadmap-shipped" className="mt-12">
            <h2
              id="roadmap-shipped"
              className="font-mono text-xs font-bold uppercase tracking-widest text-text-3"
            >
              {t("shippedTitle")}
            </h2>
            <ol className="mt-5 space-y-4">
              {ROADMAP_SHIPPED.map((entry) => (
                <li
                  key={entry.id}
                  className="card-chunky flex flex-col gap-3 p-5 sm:flex-row sm:gap-6"
                >
                  <time
                    dateTime={entry.date}
                    className="shrink-0 font-mono text-xs font-bold uppercase tracking-wider text-primary sm:w-40 sm:pt-1"
                  >
                    {formatRoadmapDate(entry.date, locale)}
                  </time>
                  <div className="min-w-0">
                    <h3 className="font-display text-lg font-black leading-snug">
                      {t(`items.${entry.id}.title`)}
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-text-2">
                      {t(`items.${entry.id}.body`)}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          {/* ── Next up — deliberately undated ── */}
          <section aria-labelledby="roadmap-next" className="mt-12">
            <h2
              id="roadmap-next"
              className="font-mono text-xs font-bold uppercase tracking-widest text-text-3"
            >
              {t("nextTitle")}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-text-3">
              {t("nextNote")}
            </p>
            <ol className="mt-5 space-y-4">
              {ROADMAP_NEXT.map((entry) => (
                <li
                  key={entry.id}
                  className="rounded-[var(--r-md)] border-[2.5px] border-dashed border-border p-5"
                >
                  <h3 className="font-display text-lg font-black leading-snug">
                    {t(`items.${entry.id}.title`)}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-text-2">
                    {t(`items.${entry.id}.body`)}
                  </p>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
