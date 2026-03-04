import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";

export default async function NotFound() {
  const t = await getTranslations("errors");

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-xl border border-border/50 bg-card p-10 text-center space-y-6">
        <p className="text-7xl font-bold gradient-text" aria-hidden="true">
          404
        </p>

        <div className="space-y-2">
          <h1 className="text-xl font-semibold">{t("notFound")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("notFoundDescription")}
          </p>
        </div>

        <div className="pt-2">
          <Button variant="default" size="lg" asChild>
            <Link href="/">{t("goHome")}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
