import { getTranslations } from "next-intl/server";
import { ContentTabs } from "./content-tabs";
import { AchievementsSubview } from "./achievements-subview";
import { QuestsTable } from "./quests-table";
import { PathsTable } from "./paths-table";
import { PinStatusBadge } from "./pin-status-badge";
import {
  getAllQuests,
  getLearningPathsForAdminWithRefs,
} from "@/lib/content/queries";

/**
 * `/admin/content` (#513 WS-C) — one "Content" tab over three read-only bundle
 * views (Quests, Achievements, Paths), plus the relocated achievement on-chain
 * sync (the one write surface here — Quests and Paths are ZERO on-chain).
 *
 * Quests/Paths are fetched here, server-side, straight from the content
 * bundle (`lib/content/queries.ts`) — no client round trip needed since
 * they're static per-deploy content, not on-chain state. Achievements stays a
 * client sub-view: it needs `useAdminStatus()` for on-chain sync status and
 * the sync action, same as before the relocation.
 */
export default async function AdminContentPage() {
  const t = await getTranslations("admin");
  const [questData, paths] = await Promise.all([
    getAllQuests(),
    getLearningPathsForAdminWithRefs(),
  ]);
  const pathTitleById = Object.fromEntries(paths.map((p) => [p._id, p.title]));

  return (
    <section>
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="font-display text-lg font-bold text-text">
          {t("screens.content")}
        </h2>
        <PinStatusBadge />
      </div>
      <p className="mb-6 text-sm text-text-3">{t("contentScreen.intro")}</p>
      <ContentTabs
        questsSlot={<QuestsTable quests={questData.quests} />}
        achievementsSlot={<AchievementsSubview pathTitleById={pathTitleById} />}
        pathsSlot={<PathsTable paths={paths} />}
      />
    </section>
  );
}
