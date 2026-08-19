import { getTranslations } from "next-intl/server";
import { Spinner } from "@/components/ui/spinner";

// Route loading state (#1092) — gives the router a prefetchable shell so
// navigation commits instantly instead of freezing on the previous page.
// Owner decision: the app's standard spinner, not skeletons.
export default async function PlatformLoading() {
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
