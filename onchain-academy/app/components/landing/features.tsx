import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { useTranslations } from "next-intl";

export function Features() {
  const t = useTranslations("features");

  const features = [
    {
      icon: "📚",
      title: t("interactiveCourses"),
      description: t("interactiveCoursesDesc"),
    },
    {
      icon: "⛓️",
      title: t("onChainXp"),
      description: t("onChainXpDesc"),
    },
    {
      icon: "🏆",
      title: t("credentialNfts"),
      description: t("credentialNftsDesc"),
    },
    {
      icon: "🔐",
      title: t("decentralized"),
      description: t("decentralizedDesc"),
    },
  ];

  return (
    <section className="border-t border-border bg-muted/30">
      <div className="mx-auto max-w-6xl px-8 py-20 md:py-24">
        <div className="mb-12 max-w-lg">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            {t("heading")}
          </h2>
          <p className="mt-2 text-muted-foreground">
            {t("description")}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, i) => (
            <Card
              key={feature.title}
              className="animate-fade-in border-0 bg-transparent ring-0"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <CardHeader>
                <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary text-xl">
                  {feature.icon}
                </div>
                <CardTitle>{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
