"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { AdminBadge } from "@/components/admin/admin-badge";
import type { PublishVerdict } from "@/lib/github/publish-pin";

interface PinResponse {
  verdict: PublishVerdict;
}

/**
 * Shared "pinned / drifted" indicator for the admin Content tab (#513 WS-C).
 * Inherits the SAME publish-pin verdict the Courses screen's
 * `PublishPinClient` shows (one bundle SHA, true for every content type —
 * quests/achievements/paths/courses all ship in the one committed bundle) via
 * the EXISTING `GET /api/admin/publish/pin` route. No new endpoint — this is
 * just a second, compact consumer of that one read.
 */
export function PinStatusBadge() {
  const t = useTranslations("admin.contentScreen.pin");
  const [verdict, setVerdict] = useState<PublishVerdict | null>(null);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const res = await fetch("/api/admin/publish/pin");
        if (!res.ok) {
          if (active) setUnavailable(true);
          return;
        }
        const data = (await res.json()) as PinResponse;
        if (active) setVerdict(data.verdict);
      } catch {
        if (active) setUnavailable(true);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  if (unavailable) {
    return <AdminBadge tone="neutral">{t("unavailable")}</AdminBadge>;
  }
  if (!verdict) return null;

  if (verdict.state === "up_to_date") {
    return <AdminBadge tone="success">{t("pinned")}</AdminBadge>;
  }
  if (verdict.state === "behind") {
    return (
      <AdminBadge tone="warning">
        {verdict.commitsBehind == null
          ? t("drifted")
          : t("behind", { count: verdict.commitsBehind })}
      </AdminBadge>
    );
  }
  return <AdminBadge tone="neutral">{t("unknown")}</AdminBadge>;
}
