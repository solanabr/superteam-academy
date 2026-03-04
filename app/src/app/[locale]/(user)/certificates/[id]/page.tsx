import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";

type Props = { params: Promise<{ id: string }> };

export default async function CertificatePage({ params }: Props): Promise<ReactNode> {
  const { id } = await params;
  const t = await getTranslations("certificates");

  return (
    <div className="container mx-auto space-y-3 px-4 py-8 md:px-6">
      <h1 className="text-2xl font-semibold text-foreground">
        {t("title")}: {id}
      </h1>
    </div>
  );
}
