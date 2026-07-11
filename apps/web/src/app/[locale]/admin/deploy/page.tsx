import { getTranslations } from "next-intl/server";
import { DeployClient } from "./deploy-client";

/**
 * `/admin/deploy` — the on-chain deploy surface (course + achievement sync
 * tables), moved from the stacked admin page (SP3-A Task 3).
 */
export default async function AdminDeployPage() {
  const t = await getTranslations("admin");

  return (
    <section>
      <h2 className="mb-4 font-display text-lg font-bold text-text">
        {t("screens.deploy")}
      </h2>
      <DeployClient />
    </section>
  );
}
