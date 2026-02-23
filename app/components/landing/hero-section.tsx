import { getTranslations } from "next-intl/server";

export async function HeroSection() {
  const t = await getTranslations("landing");

  return (
    <section className="relative overflow-hidden py-20 sm:py-32">
      {/* Grid background */}
      <div className="absolute inset-0 -z-10">
        <div
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(var(--text-primary) 1px, transparent 1px), linear-gradient(90deg, var(--text-primary) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
        <div className="absolute left-1/2 top-1/4 -z-10 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-solana-purple/10 blur-[120px]" />
        <div className="absolute right-1/4 top-1/2 -z-10 h-[400px] w-[400px] rounded-full bg-solana-cyan/8 blur-[100px]" />
      </div>

      <div className="mx-auto max-w-7xl px-4 text-center">
        <div>
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-solana-purple">
            {t("badge")}
          </p>
          <h1 className="mx-auto max-w-4xl text-4xl font-black leading-[1.1] tracking-tight text-content sm:text-6xl lg:text-7xl">
            {t("titlePre")}{" "}
            <span className="bg-solana-gradient bg-clip-text text-transparent">
              {t("titleHighlight")}
            </span>{" "}
            {t("titlePost")}
          </h1>
        </div>

        <p className="animate-fade-in-up mx-auto mt-6 max-w-2xl text-lg text-content-secondary sm:text-xl">
          {t("subtitle")}
        </p>

        <div className="animate-fade-in-up mx-auto mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center [animation-delay:150ms]">
          <a
            href="#catalog"
            className="rounded-xl bg-solana-gradient px-8 py-3.5 text-sm font-bold text-white transition-all hover:opacity-90 hover:scale-[1.02] active:scale-[0.98]"
          >
            {t("cta")}
          </a>
          <a
            href="#features"
            className="rounded-xl border border-edge px-8 py-3.5 text-sm font-semibold text-content-secondary transition-colors hover:text-content hover:border-edge"
          >
            {t("ctaSecondary")}
          </a>
        </div>

        <div className="animate-fade-in-up mx-auto mt-16 grid max-w-2xl grid-cols-3 gap-8 [animation-delay:300ms]">
          {[
            { value: t("stat1Value"), label: t("stat1Label") },
            { value: t("stat2Value"), label: t("stat2Label") },
            { value: t("stat3Value"), label: t("stat3Label") },
          ].map((stat) => (
            <div key={stat.label}>
              <p className="font-mono text-3xl font-black text-content sm:text-4xl">
                {stat.value}
              </p>
              <p className="mt-1 text-xs uppercase tracking-wider text-content-muted">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
