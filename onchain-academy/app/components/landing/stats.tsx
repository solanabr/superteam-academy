import { useTranslations } from "next-intl";

export function Stats() {
  const t = useTranslations("stats");

  const stats = [
    { label: t("courses"), value: "12+" },
    { label: t("lessons"), value: "150+" },
    { label: t("xpDistributed"), value: "2.4M" },
    { label: t("credentialsIssued"), value: "850+" },
  ];

  return (
    <section className="border-y border-border">
      <div className="mx-auto max-w-6xl px-8 py-16">
        <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
          {stats.map((stat, i) => (
            <div
              key={stat.label}
              className="animate-fade-in text-center"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                {stat.value}
              </div>
              <div className="mt-1 text-sm text-muted-foreground">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
