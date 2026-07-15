import { getTranslations } from "next-intl/server";
import { AdminCard } from "@/components/admin/admin-card";
import { AdminTableShell } from "@/components/admin/admin-table-shell";
import type { SanityQuest } from "@/lib/content/queries";

interface QuestsTableProps {
  quests: SanityQuest[];
}

/**
 * Quests sub-view of the Content tab (#513 WS-C) — READ-ONLY, ZERO on-chain.
 * Quests have no sync/deploy action: they're pure content, evaluated against
 * Supabase progress at request time (`/api/quests/daily`), so this is a plain
 * reward-config table, not a mutation surface — do NOT invent a sync here.
 */
export async function QuestsTable({ quests }: QuestsTableProps) {
  const t = await getTranslations("admin.contentScreen.quests");

  return (
    <section>
      <h3 className="mb-1 font-display text-lg font-bold text-text">
        {t("heading")}
      </h3>
      <p className="mb-4 text-sm text-text-3">{t("description")}</p>
      <AdminCard>
        {quests.length === 0 ? (
          <p className="text-sm text-text-3">{t("empty")}</p>
        ) : (
          <AdminTableShell
            columns={[
              { key: "quest", label: t("table.quest") },
              { key: "type", label: t("table.type") },
              { key: "xpReward", label: t("table.xpReward"), align: "right" },
              {
                key: "targetValue",
                label: t("table.targetValue"),
                align: "right",
              },
              { key: "resetType", label: t("table.resetType") },
              { key: "icon", label: t("table.icon"), align: "center" },
            ]}
          >
            {quests.map((quest) => (
              <tr key={quest.id} className="transition-colors hover:bg-subtle">
                <td className="py-3 pr-4 align-top">
                  <div className="font-medium text-text">{quest.name}</div>
                  <div className="text-xs text-text-3">{quest.description}</div>
                </td>
                <td className="py-3 pr-4 align-top text-text-2">
                  {t(`type.${quest.type}`)}
                </td>
                <td className="py-3 pr-4 text-right align-top font-mono text-text-2">
                  {quest.xpReward}
                </td>
                <td className="py-3 pr-4 text-right align-top font-mono text-text-2">
                  {quest.targetValue}
                </td>
                <td className="py-3 pr-4 align-top text-text-2">
                  {t(`resetType.${quest.resetType}`)}
                </td>
                <td className="py-3 text-center align-top text-lg">
                  {quest.icon || "—"}
                </td>
              </tr>
            ))}
          </AdminTableShell>
        )}
      </AdminCard>
    </section>
  );
}
