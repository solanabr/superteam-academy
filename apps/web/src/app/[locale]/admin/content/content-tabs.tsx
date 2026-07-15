"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ContentTabsProps {
  questsSlot: ReactNode;
  achievementsSlot: ReactNode;
  pathsSlot: ReactNode;
}

/**
 * Sub-view switch for the admin Content tab (#513 WS-C): Quests / Achievements
 * / Paths share ONE "Content" nav entry rather than three top-level sections —
 * none has Courses-scale write surface (plan decision). Built on the existing
 * Radix-backed `Tabs` primitive (`components/ui/tabs.tsx`) instead of
 * hand-rolled tab markup, so keyboard nav (arrow keys) and the full ARIA
 * tablist/tab/tabpanel wiring come for free.
 *
 * Each sub-view is rendered by the server-component parent (`page.tsx`) —
 * Quests/Paths are plain server components, Achievements is a client
 * component that needs `useAdminStatus()` — and handed in as a slot; this
 * component only arranges them into tabs.
 */
export function ContentTabs({
  questsSlot,
  achievementsSlot,
  pathsSlot,
}: ContentTabsProps) {
  const t = useTranslations("admin.contentScreen.tabs");

  return (
    <Tabs defaultValue="achievements">
      <TabsList>
        <TabsTrigger value="quests">{t("quests")}</TabsTrigger>
        <TabsTrigger value="achievements">{t("achievements")}</TabsTrigger>
        <TabsTrigger value="paths">{t("paths")}</TabsTrigger>
      </TabsList>
      <TabsContent value="quests">{questsSlot}</TabsContent>
      <TabsContent value="achievements">{achievementsSlot}</TabsContent>
      <TabsContent value="paths">{pathsSlot}</TabsContent>
    </Tabs>
  );
}
