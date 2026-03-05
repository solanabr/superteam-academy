import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { levelBadgeClasses } from "@/lib/utils";
import { useTranslations, useLocale } from "next-intl";

const paths = [
  {
    title: "Solana Fundamentals",
    description:
      "Accounts, transactions, PDAs, and the Solana programming model from scratch.",
    lessons: 12,
    xp: 1200,
    level: "Beginner",
    slug: "solana-fundamentals",
  },
  {
    title: "Anchor Development",
    description:
      "Build, test, and deploy Solana programs using the Anchor framework.",
    lessons: 16,
    xp: 2400,
    level: "Intermediate",
    slug: "anchor-development",
  },
  {
    title: "Token Engineering",
    description:
      "Token-2022 extensions, Metaplex Core, soulbound tokens, and token economics.",
    lessons: 10,
    xp: 2000,
    level: "Advanced",
    slug: "token-engineering",
  },
];

export function LearningPaths() {
  const t = useTranslations();
  const locale = useLocale();

  return (
    <section>
      <div className="mx-auto max-w-6xl px-8 py-20 md:py-24">
        <div className="mb-12 flex items-end justify-between">
          <div className="max-w-lg">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
              {t("learningPaths.heading")}
            </h2>
            <p className="mt-2 text-muted-foreground">
              {t("learningPaths.description")}
            </p>
          </div>
          <Link href={`/${locale}/courses`} className="hidden md:block">
            <Button variant="ghost" size="sm">
              {t("common.viewAll")}
              <span aria-hidden="true" className="ml-1">→</span>
            </Button>
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {paths.map((path, i) => (
            <Card
              key={path.slug}
              className="animate-fade-in flex flex-col"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <CardHeader className="flex-1">
                <CardTitle>{path.title}</CardTitle>
                <CardDescription className="line-clamp-2">{path.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={`border-transparent ${levelBadgeClasses(path.level)}`}>{path.level}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {t("common.lessons", { count: path.lessons })}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {t("common.xp", { amount: path.xp.toLocaleString() })}
                  </span>
                </div>
              </CardContent>
              <CardFooter>
                <Link href={`/${locale}/courses/${path.slug}`} className="w-full">
                  <Button variant="outline" size="lg" className="w-full">
                    {t("common.startLearning")}
                    <span aria-hidden="true" className="ml-1">→</span>
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>

        <div className="mt-6 text-center md:hidden">
          <Link href={`/${locale}/courses`}>
            <Button variant="ghost" size="sm">
              {t("common.viewAllCourses")}
              <span aria-hidden="true" className="ml-1">→</span>
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
