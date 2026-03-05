import { getTranslations, getLocale } from "next-intl/server";
import { getAllChallenges } from "@/services/cms";
import { ChallengesGrid } from "./challenges-grid";

export default async function ChallengesPage() {
  const t = await getTranslations("challenges");
  const locale = await getLocale();
  const challenges = await getAllChallenges(locale);
  return (
    <div className="container py-8">
      <header className="mb-10 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-[hsl(var(--brand-logo-green))] drop-shadow-md">
          {t("title")}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("subtitle")}</p>
      </header>
      <ChallengesGrid challenges={challenges} />
    </div>
  );
}
