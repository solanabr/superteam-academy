"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/auth/supabase-client";
import { useWalletStore } from "@/stores/wallet-store";
import { getLearnerId } from "@/lib/learner";
import { backendClient } from "@/lib/backend/client";
import { mockCourses } from "@/domain/mock-data";
import { localLearningProgressService } from "@/services/local-learning-progress-service";

export default function SettingsPage() {
  const { resolvedTheme, setTheme } = useTheme();
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();
  const walletAddress = useWalletStore((state) => state.walletAddress);
  const [authUser, setAuthUser] = useState<{ id: string; email?: string | null } | null>(null);
  const [notifications, setNotifications] = useState(true);
  const [isPublicProfile, setIsPublicProfile] = useState(true);
  const [exporting, setExporting] = useState(false);

  const learnerId = useMemo(() => getLearnerId(walletAddress, authUser ?? undefined), [walletAddress, authUser]);

  useEffect(() => {
    const pref = localStorage.getItem("academy:isPublicProfile");
    if (pref !== null) {
      setIsPublicProfile(pref === "true");
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("academy:isPublicProfile", String(isPublicProfile));
  }, [isPublicProfile]);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      const user = data.session?.user;
      setAuthUser(user ? { id: user.id, email: user.email } : null);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user;
      setAuthUser(user ? { id: user.id, email: user.email } : null);
    });
    return () => subscription.unsubscribe();
  }, [supabase]);

  const handleExportData = async () => {
    setExporting(true);
    try {
      const [profile, streak, activity, leaderboard, progressByCourse] = await Promise.all([
        backendClient.getProfile(learnerId),
        backendClient.getStreak(learnerId),
        backendClient.getActivity(learnerId),
        backendClient.getLeaderboard("all-time"),
        Promise.all(
          mockCourses.map(async (course) => ({
            courseId: course.id,
            progress: await localLearningProgressService.getProgress(learnerId, course.id),
          })),
        ),
      ]);

      const payload = {
        exportedAt: new Date().toISOString(),
        learnerId,
        authUser: authUser ? { id: authUser.id, email: authUser.email ?? null } : null,
        walletAddress: walletAddress ?? null,
        preferences: {
          locale,
          theme: resolvedTheme,
          notifications,
          isPublicProfile,
        },
        profile,
        streak,
        activity,
        leaderboard,
        progressByCourse,
      };

      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `academy-export-${learnerId}-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold">Settings</h1>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="space-y-2">
          <h2 className="text-lg font-medium">Profile</h2>
          <p className="text-sm text-zinc-400">Name, bio, social links, and avatar.</p>
          <Button size="sm" variant="outline">
            Edit profile
          </Button>
        </Card>
        <Card className="space-y-2">
          <h2 className="text-lg font-medium">Accounts</h2>
          <p className="text-sm text-zinc-400">Google/GitHub auth and wallet linking entry point.</p>
          <Button size="sm" variant="outline">
            Manage linked accounts
          </Button>
        </Card>
        <Card className="space-y-4">
          <h2 className="text-lg font-medium">Preferences</h2>
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-400">Theme</span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            >
              {resolvedTheme === "dark" ? "Switch to light" : "Switch to dark"}
            </Button>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-400">Language</span>
            <select
              className="rounded-md border border-white/15 bg-transparent px-2 py-1 text-sm"
              value={locale}
              onChange={(event) => router.replace(pathname, { locale: event.target.value })}
            >
              {routing.locales.map((option) => (
                <option key={option} value={option} className="text-black">
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-400">Notifications</span>
            <button
              type="button"
              className={`h-6 w-11 rounded-full transition-colors ${notifications ? "bg-emerald-500" : "bg-zinc-600"}`}
              onClick={() => setNotifications((value) => !value)}
              aria-label="Toggle notifications"
            >
              <span
                className={`block h-5 w-5 rounded-full bg-white transition-transform ${notifications ? "translate-x-5" : "translate-x-0.5"}`}
              />
            </button>
          </div>
        </Card>
        <Card className="space-y-4">
          <h2 className="text-lg font-medium">Privacy</h2>
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-400">Public profile visibility</span>
            <button
              type="button"
              className={`h-6 w-11 rounded-full transition-colors ${isPublicProfile ? "bg-emerald-500" : "bg-zinc-600"}`}
              onClick={() => setIsPublicProfile((value) => !value)}
              aria-label="Toggle public profile visibility"
            >
              <span
                className={`block h-5 w-5 rounded-full bg-white transition-transform ${isPublicProfile ? "translate-x-5" : "translate-x-0.5"}`}
              />
            </button>
          </div>
          <p className="text-xs text-zinc-500">
            Stored as a frontend preference for MVP. Can be moved to backend profile settings later.
          </p>
          <Button size="sm" variant="outline" onClick={handleExportData} disabled={exporting}>
            {exporting ? "Preparing export..." : "Export my data (JSON)"}
          </Button>
        </Card>
      </div>
    </div>
  );
}
