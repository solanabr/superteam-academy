import { getTranslations } from "next-intl/server";
import { AdminCard } from "@/components/admin/admin-card";
import { EventsPanel } from "@/components/admin/events-panel";

/**
 * `/admin/events` — events and workshops: their redeem codes, the window each
 * code is live for, and the on-chain badge a redemption mints. Data comes
 * client-side from the requireAdmin-gated `/api/admin/events`.
 */
export default async function AdminEventsPage() {
  const t = await getTranslations("admin");

  return (
    <section>
      <h2 className="mb-4 font-display text-lg font-bold text-text">
        {t("screens.events")}
      </h2>
      <AdminCard>
        <EventsPanel />
      </AdminCard>
    </section>
  );
}
