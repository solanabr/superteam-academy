import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type CertificateItem = {
  id: string;
  course_title: string;
  minted_at: string | null;
};

export default async function CertificatesPage(): Promise<ReactNode> {
  const t = await getTranslations("certificates");

  const certificate_items: CertificateItem[] = [];

  if (certificate_items.length === 0) {
    return (
      <div className="container mx-auto space-y-4 p-4 md:p-6">
        <h1 className="text-2xl font-bold text-foreground">{t("title")}</h1>
        <p className="max-w-xl text-sm text-muted-foreground">
          {t("description")}
        </p>
        <Card className="mt-4 rounded-none border-2 border-dashed border-border bg-muted/40 p-6 shadow-[3px_3px_0_0_hsl(var(--foreground)/0.08)]">
          <CardHeader className="p-0">
            <CardTitle className="text-base font-semibold text-foreground">
              {t("emptyTitle")}
            </CardTitle>
          </CardHeader>
          <CardContent className="mt-2 flex flex-wrap items-center justify-between gap-3 p-0">
            <p className="text-sm text-muted-foreground">
              {t("emptyDescription")}
            </p>
            <Link href="/courses">
              <Button
                type="button"
                variant="outline"
                className="rounded-none border-2 border-foreground"
              >
                {t("goToCourses")}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-6 p-4 md:p-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold text-foreground">{t("title")}</h1>
        <p className="max-w-xl text-sm text-muted-foreground">
          {t("description")}
        </p>
      </header>

      <section
        aria-label={t("title")}
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        {certificate_items.map((certificate) => (
          <Card
            key={certificate.id}
            className="flex h-full flex-col rounded-none border-2 border-border bg-card shadow-[3px_3px_0_0_hsl(var(--foreground)/0.15)]"
          >
            <CardHeader className="space-y-1 p-4 pb-2">
              <CardTitle className="text-base font-semibold text-foreground">
                {certificate.course_title}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col justify-between gap-3 p-4 pt-2">
              <div className="space-y-1 text-xs text-muted-foreground">
                {certificate.minted_at && (
                  <p>
                    <span className="font-semibold text-foreground">
                      {t("mintedOn")}
                    </span>{" "}
                    {new Date(certificate.minted_at).toLocaleDateString()}
                  </p>
                )}
              </div>
              <div className="mt-2">
                <Link href={`/certificates/${certificate.id}`}>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full rounded-none border-2 border-foreground text-sm font-semibold"
                  >
                    {t("viewDetails")}
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}

