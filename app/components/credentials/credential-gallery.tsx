"use client";

import { useCredentials } from "@/hooks/use-credentials";
import { CredentialCard } from "./credential-card";
import { CardSkeleton } from "@/components/ui/skeleton";
import { useTranslations } from "next-intl";

export function CredentialGallery() {
  const { data: credentials, isLoading } = useCredentials();
  const t = useTranslations("profile");

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  if (!credentials?.length) {
    return (
      <p className="py-8 text-center text-sm text-content-muted">
        {t("noCredentials")}
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {credentials.map((c, i) => (
        <CredentialCard key={c.id} credential={c} index={i} />
      ))}
    </div>
  );
}
