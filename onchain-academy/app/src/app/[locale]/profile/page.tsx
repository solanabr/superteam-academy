"use client";

import Image from "next/image";
import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { Link } from "@/i18n/navigation";
import { CredentialsCard } from "@/components/wallet/credentials-card";
import { Button } from "@/components/ui/button";
import { getSupabaseBrowserClient } from "@/lib/auth/supabase-client";
import { useWalletStore } from "@/stores/wallet-store";
import { getLearnerId } from "@/lib/learner";
import { backendClient } from "@/lib/backend/client";
import { mockCourses } from "@/domain/mock-data";
import { localLearningProgressService } from "@/services/local-learning-progress-service";
import { getTotalXpFromProgress } from "@/lib/scoring";
import { syncAuthIdentity } from "@/lib/auth/sync-auth";
import { DEFAULT_AVATAR_SRC, normalizeAvatarUrl } from "@/lib/avatar";
import { emitProfileUpdated } from "@/lib/profile-sync";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { achievementService } from "@/services/achievement-service";

type EditableProfile = {
  username: string;
  avatarUrl: string;
  bio: string;
  country: string;
  role: string;
  email: string;
  walletAddress: string;
};

export default function ProfilePage() {
  const connected = useWalletStore((state) => state.connected);
  const walletAddress = useWalletStore((state) => state.walletAddress);
  const { disconnect } = useWallet();
  const { setVisible: setWalletModalVisible } = useWalletModal();
  const [authUser, setAuthUser] = useState<{ id: string; email?: string | null } | null>(null);
  const [authResolved, setAuthResolved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [totalXp, setTotalXp] = useState(0);
  const [coursesStarted, setCoursesStarted] = useState(0);
  const [completedLessons, setCompletedLessons] = useState(0);
  const [streakDays, setStreakDays] = useState(0);
  const [achievements, setAchievements] = useState<string[]>([]);
  const [completedCourses, setCompletedCourses] = useState<Array<{ id: string; title: string; percent: number }>>([]);
  const [isPublicProfile, setIsPublicProfile] = useState(true);
  const [walletLinking, setWalletLinking] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [profile, setProfile] = useState<EditableProfile>({
    username: "",
    avatarUrl: "",
    bio: "",
    country: "",
    role: "",
    email: "",
    walletAddress: "",
  });

  const supabase = getSupabaseBrowserClient();

  useEffect(() => {
    if (!supabase) {
      setAuthResolved(true);
      return;
    }
    supabase.auth
      .getSession()
      .then(({ data }) => {
        const user = data.session?.user;
        setAuthUser(user ? { id: user.id, email: user.email } : null);
      })
      .finally(() => setAuthResolved(true));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user;
      setAuthUser(user ? { id: user.id, email: user.email } : null);
    });
    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const learnerId = useMemo(() => getLearnerId(walletAddress, authUser ?? undefined), [walletAddress, authUser]);

  useEffect(() => {
    const load = async () => {
      if (!authResolved) return;
      setLoading(true);
      try {
        const [remoteProfile, streak] = await Promise.all([
          backendClient.getProfile(learnerId),
          localLearningProgressService.getStreakData(learnerId),
        ]);

        const progressEntries = await Promise.all(
          mockCourses.map(async (course) => {
            const progress = await localLearningProgressService.getProgress(learnerId, course.id);
            return { course, progress };
          }),
        );
        const progressMap = Object.fromEntries(
          progressEntries.map(({ course, progress }) => [course.id, progress ?? null]),
        );
        const completed = progressEntries.reduce(
          (sum, { progress }) => sum + (progress?.completedLessonIds.length ?? 0),
          0,
        );
        const started = progressEntries.filter(({ progress }) => (progress?.percentComplete ?? 0) > 0).length;
        setCompletedLessons(completed);
        setCoursesStarted(started);
        setTotalXp(getTotalXpFromProgress(mockCourses, progressMap));
        setStreakDays(streak.current);
        setCompletedCourses(
          progressEntries
            .map(({ course, progress }) => ({
              id: course.id,
              title: course.title,
              percent: progress?.percentComplete ?? 0,
            }))
            .filter((item) => item.percent > 0)
            .sort((a, b) => b.percent - a.percent),
        );

        const [achievementIds, visibility] = await Promise.all([
          achievementService.listAchievements(learnerId),
          backendClient.getProfileVisibility(learnerId),
        ]);
        setAchievements(achievementIds);
        if (visibility) {
          setIsPublicProfile(visibility.isPublic);
        }

        if (remoteProfile) {
          setIsComplete(remoteProfile.isComplete);
          setProfile({
            username: remoteProfile.username ?? "",
            avatarUrl: normalizeAvatarUrl(remoteProfile.avatarUrl),
            bio: remoteProfile.bio ?? "",
            country: remoteProfile.country ?? "",
            role: remoteProfile.role ?? "",
            email: remoteProfile.email ?? authUser?.email ?? "",
            walletAddress: remoteProfile.walletAddress ?? "",
          });
        } else {
          setProfile((current) => ({ ...current, email: authUser?.email ?? current.email }));
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [authResolved, authUser?.id, authUser?.email, learnerId]);

  const buildProfilePayload = (overrides?: Partial<EditableProfile>) => {
    const next = { ...profile, ...(overrides ?? {}) };
    return {
      learnerId,
      displayName: next.username.trim(),
      email: (authUser?.email ?? next.email.trim()) || null,
      walletAddress: next.walletAddress || null,
      username: next.username.trim(),
      avatarUrl: normalizeAvatarUrl(next.avatarUrl),
      bio: next.bio.trim(),
      country: next.country.trim(),
      role: next.role.trim(),
    };
  };

  const handleSaveProfile = async () => {
    if (!profile.username.trim()) {
      alert("Username is required.");
      return;
    }
    setSaving(true);
    try {
      const result = await backendClient.upsertProfile(buildProfilePayload());
      if (!result?.ok) {
        alert(result?.error ?? "Could not save profile.");
        return;
      }
      setIsComplete(result.profile.isComplete);
      setProfile((current) => ({
        ...current,
        username: result.profile.username ?? current.username,
        email: result.profile.email ?? current.email,
        walletAddress: result.profile.walletAddress ?? current.walletAddress,
        avatarUrl: result.profile.avatarUrl ?? current.avatarUrl,
        bio: result.profile.bio ?? current.bio,
        country: result.profile.country ?? current.country,
        role: result.profile.role ?? current.role,
      }));
      emitProfileUpdated();
      alert("Profile saved.");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;
    if (!authUser?.id) {
      alert("Sign in first, then upload your avatar.");
      return;
    }
    if (!supabase) {
      alert("Supabase is not configured for storage uploads.");
      return;
    }
    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("Avatar must be 5MB or smaller.");
      return;
    }

    setAvatarUploading(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "png";
      const path = `${authUser.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, {
        cacheControl: "3600",
        upsert: true,
        contentType: file.type,
      });
      if (uploadError) {
        const status = (uploadError as { statusCode?: number }).statusCode;
        if (status === 404 || /bucket/i.test(uploadError.message)) {
          alert("Avatar upload failed: storage bucket 'avatars' is missing. Create it in Supabase Storage first.");
          return;
        }
        alert(`Avatar upload failed: ${uploadError.message}`);
        return;
      }

      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      const publicUrl = data.publicUrl;
      if (!publicUrl) {
        alert("Avatar uploaded, but public URL could not be generated.");
        return;
      }
      const normalizedPublicUrl = normalizeAvatarUrl(publicUrl);

      setProfile((current) => ({ ...current, avatarUrl: normalizedPublicUrl }));

      if (!profile.username.trim()) {
        alert("Avatar uploaded. Add username and click Save profile.");
        return;
      }

      const saveResult = await backendClient.upsertProfile(
        buildProfilePayload({
          avatarUrl: publicUrl,
        }),
      );
      if (!saveResult?.ok) {
        alert(saveResult?.error ?? "Avatar uploaded, but profile save failed.");
        return;
      }
      setIsComplete(saveResult.profile.isComplete);
      setProfile((current) => ({
        ...current,
        avatarUrl: normalizeAvatarUrl(saveResult.profile.avatarUrl) || normalizedPublicUrl,
      }));
      emitProfileUpdated();
      alert("Avatar uploaded and saved.");
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleLinkWallet = async () => {
    if (!authUser) {
      alert("Sign in first, then link your wallet.");
      return;
    }
    setWalletLinking(true);
    try {
      const linkedWallet = walletAddress;
      if (!linkedWallet) {
        setWalletModalVisible(true);
        alert("Select and connect a wallet from the modal, then click Link Solana wallet again.");
        return;
      }
      if (!linkedWallet) {
        alert("Wallet connection failed.");
        return;
      }

      await syncAuthIdentity({
        authUser,
        walletAddress: linkedWallet,
        profileName: profile.username || undefined,
        authMethod: "wallet",
      });

      const result = await backendClient.upsertProfile({
        ...buildProfilePayload({ walletAddress: linkedWallet }),
      });
      if (!result?.ok) {
        alert(result?.error ?? "Could not link wallet.");
        return;
      }
      setIsComplete(result.profile.isComplete);
      setProfile((current) => ({ ...current, walletAddress: result.profile.walletAddress ?? linkedWallet ?? "" }));
      emitProfileUpdated();
      alert("Wallet linked and saved to Supabase.");
    } finally {
      setWalletLinking(false);
    }
  };

  const handleToggleVisibility = async () => {
    const next = !isPublicProfile;
    setIsPublicProfile(next);
    const result = await backendClient.upsertProfileVisibility({ learnerId, isPublic: next });
    if (!result) {
      setIsPublicProfile(!next);
      alert("Could not update visibility right now.");
    }
  };

  return (
    <div className="bg-background min-h-screen pb-32 pt-8 md:pt-12 text-foreground">
      <div className="mx-auto max-w-[1100px] px-4 md:px-8 space-y-8">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-[40px] md:text-[52px] font-semibold tracking-[-0.03em] text-white leading-none">
              Your profile
            </h1>
            <p className="mt-3 text-[17px] text-white/50">
              Keep this complete to unlock course enrollment and personalized leaderboard identity.
            </p>
          </div>
          <div className={`rounded-full px-4 py-2 text-[12px] font-semibold border ${isComplete ? "bg-[#e8f5e9]/10 text-[#4caf50] border-[#4caf50]/30" : "bg-[#fff4e5]/10 text-[#ff9800] border-[#ff9800]/30"}`}>
            {isComplete ? "Profile complete" : "Profile incomplete"}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total XP", value: totalXp.toLocaleString() },
            { label: "Courses started", value: String(coursesStarted) },
            { label: "Lessons done", value: String(completedLessons) },
            { label: "Streak", value: `${streakDays} days` },
          ].map((item) => (
            <div key={item.label} className="bg-surface border border-white/10 rounded-[20px] p-5 apple-shadow">
              <p className="text-[12px] uppercase tracking-[0.12em] text-white/50 font-semibold">{item.label}</p>
              <p className="text-[26px] font-semibold tracking-[-0.02em] mt-2 text-white">{item.value}</p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-[1.2fr,1fr] gap-6">
          <div className="bg-surface border border-white/10 rounded-[28px] p-6 md:p-7 apple-shadow">
            <h2 className="text-[24px] font-semibold tracking-[-0.02em] text-white">Public identity</h2>
            <p className="mt-2 text-[14px] text-white/50">Only username is required. Keep it simple.</p>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <input
                value={profile.username}
                onChange={(event) => setProfile((p) => ({ ...p, username: event.target.value }))}
                placeholder="Username *"
                className="h-11 rounded-[14px] bg-background border border-white/10 px-3 text-[14px] text-white placeholder:text-white/30 outline-none focus:border-white/30"
              />
              <input
                value={authUser?.email ?? profile.email}
                readOnly
                disabled
                placeholder="Email (from your account)"
                className="h-11 rounded-[14px] bg-white/5 border border-white/10 px-3 text-[14px] text-white/70 placeholder:text-white/30 cursor-not-allowed"
              />
              <div className="rounded-[14px] bg-background border border-white/10 px-3 py-3 md:col-span-2">
                <p className="text-[12px] uppercase tracking-[0.12em] text-white/50 font-semibold">Avatar</p>
                <div className="mt-3 flex items-center gap-3">
                  <Image
                    src={normalizeAvatarUrl(profile.avatarUrl) || DEFAULT_AVATAR_SRC}
                    alt="Profile avatar"
                    width={48}
                    height={48}
                    className="h-12 w-12 rounded-full object-cover border border-white/10"
                  />
                  <label className="inline-flex h-9 cursor-pointer items-center rounded-full border border-white/10 px-4 text-[13px] text-white/80 hover:bg-white/5">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarUpload}
                      disabled={avatarUploading || saving}
                    />
                    {avatarUploading ? "Uploading..." : "Upload image"}
                  </label>
                </div>
              </div>
              <input
                value={profile.role}
                onChange={(event) => setProfile((p) => ({ ...p, role: event.target.value }))}
                placeholder="Role (e.g. Solidity dev)"
                className="h-11 rounded-[14px] bg-background border border-white/10 px-3 text-[14px] text-white placeholder:text-white/30 outline-none focus:border-white/30"
              />
              <input
                value={profile.country}
                onChange={(event) => setProfile((p) => ({ ...p, country: event.target.value }))}
                placeholder="Country"
                className="h-11 rounded-[14px] bg-background border border-white/10 px-3 text-[14px] text-white placeholder:text-white/30 outline-none focus:border-white/30"
              />
              <textarea
                value={profile.bio}
                onChange={(event) => setProfile((p) => ({ ...p, bio: event.target.value }))}
                placeholder="Short bio"
                className="md:col-span-2 min-h-[110px] rounded-[14px] bg-background border border-white/10 px-3 py-2 text-[14px] text-white placeholder:text-white/30 outline-none focus:border-white/30 resize-none"
              />
            </div>
            <div className="mt-5 flex items-center gap-3">
              <Button variant="default" onClick={handleSaveProfile} disabled={loading || saving}>
                {saving ? "Saving..." : "Save profile"}
              </Button>
              <span className="text-[12px] text-white/50">{loading ? "Loading profile..." : "Changes sync to Supabase."}</span>
            </div>
          </div>

          <div className="bg-surface border border-white/10 rounded-[28px] p-6 md:p-7 apple-shadow">
            <h2 className="text-[24px] font-semibold tracking-[-0.02em] text-white">On-chain credentials</h2>
            <p className="mt-2 mb-5 text-[14px] text-white/50">Your verified credential view from wallet identity.</p>
            <div className="mb-5 rounded-[14px] border border-white/5 bg-background p-4">
              <p className="text-[12px] uppercase tracking-[0.12em] text-white/50 font-semibold">Wallet link status</p>
              <p className="mt-2 text-[14px] text-white">
                {profile.walletAddress
                  ? `Linked: ${profile.walletAddress.slice(0, 4)}...${profile.walletAddress.slice(-4)}`
                  : "No wallet linked yet. Link a Solana wallet to enroll in courses."}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleLinkWallet} disabled={walletLinking}>
                  {walletLinking ? "Linking..." : "Link Solana wallet"}
                </Button>
                {connected && walletAddress ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => disconnect().catch(() => undefined)}
                  >
                    Disconnect wallet
                  </Button>
                ) : null}
              </div>
            </div>
            <CredentialsCard wallet={profile.walletAddress || learnerId} />
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-surface border border-white/10 rounded-[28px] p-6 md:p-7 apple-shadow">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-[24px] font-semibold tracking-[-0.02em] text-white">Achievements</h2>
              <span className="text-[12px] uppercase tracking-[0.12em] text-white/50">{achievements.length} unlocked</span>
            </div>
            {achievements.length === 0 ? (
              <p className="mt-4 text-[14px] text-white/50">No achievements yet. Complete lessons and keep a streak to unlock badges.</p>
            ) : (
              <div className="mt-4 flex flex-wrap gap-2">
                {achievements.map((badge) => (
                  <span
                    key={badge}
                    className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[12px] font-semibold text-white/80"
                  >
                    {badge}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="bg-surface border border-white/10 rounded-[28px] p-6 md:p-7 apple-shadow">
            <h2 className="text-[24px] font-semibold tracking-[-0.02em] text-white">Completed courses</h2>
            {completedCourses.length === 0 ? (
              <p className="mt-4 text-[14px] text-white/50">Start your first course to populate this section.</p>
            ) : (
              <div className="mt-4 space-y-2">
                {completedCourses.slice(0, 6).map((course) => (
                  <div key={course.id} className="rounded-[14px] border border-white/10 bg-background px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[14px] font-medium text-white">{course.title}</p>
                      <span className="text-[12px] text-white/50">{course.percent}%</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-surface border border-white/10 rounded-[28px] p-6 md:p-7 apple-shadow">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-[24px] font-semibold tracking-[-0.02em] text-white">Public profile visibility</h2>
              <p className="mt-1 text-[14px] text-white/50">
                {isPublicProfile
                  ? "Your public profile is discoverable."
                  : "Your public profile is hidden."}
              </p>
            </div>
            <button
              type="button"
              onClick={handleToggleVisibility}
              className={`h-7 w-12 rounded-full transition-colors ${isPublicProfile ? "bg-emerald-500" : "bg-zinc-600"}`}
              aria-label="Toggle public profile visibility"
            >
              <span
                className={`block h-6 w-6 rounded-full bg-white transition-transform ${isPublicProfile ? "translate-x-6" : "translate-x-0.5"}`}
              />
            </button>
          </div>
          <div className="mt-4">
            <Link
              href={`/profile/${profile.username || "me"}`}
              className="text-[13px] text-white/70 hover:text-white underline-offset-2 hover:underline"
            >
              Open public profile
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
