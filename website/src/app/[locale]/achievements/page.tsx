"use client";

import { AchievementList } from "@/components/achievements/AchievementList";
import { Link } from "@/i18n/routing";

export default function AchievementsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-text-muted hover:text-white transition-colors mb-4"
        >
          <span className="material-symbols-outlined notranslate text-sm">arrow_back</span>
          <span className="text-sm font-medium">Back to Dashboard</span>
        </Link>
        <h1 className="font-display text-text-primary text-2xl font-semibold">Achievements</h1>
        <p className="text-text-secondary mt-2 text-sm">
          Unlock achievements to earn XP and show off your progress.
        </p>
      </div>

      <AchievementList />
    </div>
  );
}
