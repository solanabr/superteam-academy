import { getTranslations } from "next-intl/server";
import { Spinner } from "@/components/ui/spinner";

// The shared route loading state (#1092) — every loading.tsx re-exports this
// as its default. The file-per-route boilerplate exists only because Next
// keys instant loading states (and dynamic-route prefetching) on a loading.tsx
// being physically present in the segment; the UI is one pattern on purpose.
// Owner decision: the app's standard spinner, not skeletons.
export default async function RouteLoading() {
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
