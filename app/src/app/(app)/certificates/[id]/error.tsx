"use client";

import { RouteError } from "@/components/ui/route-error";
import { Award } from "lucide-react";

export default function CertificateError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <RouteError
      error={error}
      reset={reset}
      icon={Award}
      titleKey="routes.certificate.title"
      descriptionKey="routes.certificate.description"
      backHref="/profile"
      backLabelKey="goToProfile"
    />
  );
}
