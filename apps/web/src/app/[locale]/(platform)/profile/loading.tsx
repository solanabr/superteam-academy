import { getTranslations } from "next-intl/server";
import { Spinner } from "@/components/ui/spinner";

// Route loading state (#1092) — see (platform)/loading.tsx.
export default async function ProfileLoading() {
  const t = await getTranslations("common");
  return (
    <div
      role="status"
      aria-busy="true"
      className="flex items-center justify-center py-20"
    >
      <Spinner />
      <span className="sr-only">{t("loading")}</span>
    </div>
  );
}
