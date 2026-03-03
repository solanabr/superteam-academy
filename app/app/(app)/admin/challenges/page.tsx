"use client";

import { PageHeader } from "@/components/app";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAllChallenges, useSeasons } from "@/hooks";
import type { ChallengeItem } from "@/hooks/useChallenges";
import type { SeasonItem } from "@/hooks/useSeasons";
import {
  createChallenge,
  createSeason,
  syncSanityChallenges,
  syncChallengeConfigFromSanity,
  updateChallenge,
  updateSeason,
  type BackendApiResponse,
  type CreateChallengeParams,
  type CreateSeasonParams,
} from "@/lib/services/backend-api";
import { useAdminAuth } from "@/providers/AdminAuthProvider";
import { useQueryClient } from "@tanstack/react-query";
import { ExternalLink, Link2, Pencil } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type CompletionRow = {
  wallet: string;
  challengeId: number;
  completionDay: string;
  completedAt: string;
  submissionLink: string | null;
  challengeTitle: string;
  challengeSlug: string;
};

const STUDIO_BASE = typeof window !== "undefined" ? `${window.location.origin}/studio` : "";

export default function AdminChallengesPage() {
  const { token } = useAdminAuth();
  const queryClient = useQueryClient();
  const { data: seasonsData, isLoading: seasonsLoading } = useSeasons();
  const { data: challengesData, isLoading: challengesLoading } = useAllChallenges();
  const seasons = seasonsData ?? [];
  const challenges = challengesData?.challenges ?? [];

  const [seasonForm, setSeasonForm] = useState<CreateSeasonParams>({
    slug: "",
    name: "",
    description: "",
    startAt: "",
    endAt: "",
  });
  const [challengeForm, setChallengeForm] = useState<CreateChallengeParams>({
    slug: "",
    title: "",
    description: "",
    type: "daily",
    config: {},
    xpReward: 50,
  });
  const [submitting, setSubmitting] = useState(false);
  const [editingSeasonId, setEditingSeasonId] = useState<number | null>(null);
  const [editingSeasonSlug, setEditingSeasonSlug] = useState("");
  const [editingChallengeId, setEditingChallengeId] = useState<number | null>(null);
  const [editingChallengeSlug, setEditingChallengeSlug] = useState("");
  const [completions, setCompletions] = useState<CompletionRow[]>([]);
  const [completionsLoading, setCompletionsLoading] = useState(false);
  const [removingKey, setRemovingKey] = useState<string | null>(null);

  async function createSeasonStub(payload: {
    slug: string;
    name: string;
    startAt: string;
    endAt: string;
    description?: string;
  }): Promise<string | null> {
    const res = await fetch("/api/sanity/create-season-stub", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    const data = (await res.json()) as { _id?: string; error?: string };
    if (!res.ok || data.error) throw new Error(data.error ?? "Failed to create season in Sanity");
    return data._id ?? null;
  }

  async function createChallengeStub(payload: {
    slug: string;
    title: string;
    type: string;
    xpReward?: number;
    description?: string;
    config?: Record<string, unknown>;
  }): Promise<string | null> {
    const res = await fetch("/api/sanity/create-challenge-stub", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    const data = (await res.json()) as { _id?: string; error?: string };
    if (!res.ok || data.error) throw new Error(data.error ?? "Failed to create challenge in Sanity");
    return data._id ?? null;
  }

  async function handleCreateSeason(e: React.FormEvent) {
    e.preventDefault();
    if (!token) {
      toast.error("Admin login required");
      return;
    }
    setSubmitting(true);
    try {
      const res = await createSeason(seasonForm, token);
      if ((res as { error?: string }).error) throw new Error((res as { error: string }).error);
      const id = (res as { id?: number }).id;
      try {
        const sanityId = await createSeasonStub({
          slug: seasonForm.slug,
          name: seasonForm.name,
          startAt: seasonForm.startAt,
          endAt: seasonForm.endAt,
          description: seasonForm.description || undefined,
        });
        if (sanityId && id) await updateSeason({ id, sanityId }, token);
      } catch (stubErr) {
        const msg = stubErr instanceof Error ? stubErr.message : String(stubErr);
        toast.warning("Season created in DB; Sanity stub failed.", { description: msg });
      }
      toast.success("Season created. Edit details in Sanity Studio.");
      setSeasonForm({ slug: "", name: "", description: "", startAt: "", endAt: "" });
      void queryClient.invalidateQueries({ queryKey: ["seasons"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create season");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCreateChallenge(e: React.FormEvent) {
    e.preventDefault();
    if (!token) {
      toast.error("Admin login required");
      return;
    }
    setSubmitting(true);
    try {
      const res = await createChallenge(challengeForm, token);
      if ((res as { error?: string }).error) throw new Error((res as { error: string }).error);
      const id = (res as { id?: number }).id;
      try {
        const sanityId = await createChallengeStub({
          slug: challengeForm.slug,
          title: challengeForm.title,
          type: challengeForm.type,
          xpReward: challengeForm.xpReward,
          description: challengeForm.description || undefined,
          config: Object.keys(challengeForm.config ?? {}).length ? challengeForm.config : undefined,
        });
        if (sanityId && id) await updateChallenge({ id, sanityId }, token);
      } catch (stubErr) {
        const msg = stubErr instanceof Error ? stubErr.message : String(stubErr);
        toast.warning("Challenge created in DB; Sanity stub failed.", { description: msg });
      }
      toast.success("Challenge created. Edit details in Sanity Studio.");
      setChallengeForm({
        slug: "",
        title: "",
        description: "",
        type: "daily",
        config: {},
        xpReward: 50,
      });
      void queryClient.invalidateQueries({ queryKey: ["challenges"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create challenge");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSaveSeasonSlug(season: SeasonItem) {
    if (!token || editingSeasonSlug.trim() === season.slug) {
      setEditingSeasonId(null);
      return;
    }
    setSubmitting(true);
    try {
      await updateSeason({ id: season.id, slug: editingSeasonSlug.trim() }, token);
      toast.success("Slug updated");
      setEditingSeasonId(null);
      void queryClient.invalidateQueries({ queryKey: ["seasons"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update slug");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSaveChallengeSlug(challenge: ChallengeItem) {
    if (!token || editingChallengeSlug.trim() === challenge.slug) {
      setEditingChallengeId(null);
      return;
    }
    setSubmitting(true);
    try {
      await updateChallenge({ id: challenge.id, slug: editingChallengeSlug.trim() }, token);
      toast.success("Slug updated");
      setEditingChallengeId(null);
      void queryClient.invalidateQueries({ queryKey: ["challenges"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update slug");
    } finally {
      setSubmitting(false);
    }
  }

  useEffect(() => {
    if (!token) {
      setCompletions([]);
      return;
    }
    setCompletionsLoading(true);
    fetch("/api/challenges/completions", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data: { completions?: CompletionRow[]; error?: string }) => {
        if (data.error) return;
        setCompletions(data.completions ?? []);
      })
      .catch(() => setCompletions([]))
      .finally(() => setCompletionsLoading(false));
  }, [token]);

  async function handleRemoveCompletion(row: CompletionRow) {
    if (!token) return;
    const key = `${row.wallet}-${row.challengeId}-${row.completionDay}`;
    setRemovingKey(key);
    try {
      const res = await fetch("/api/challenges/remove-completion", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          wallet: row.wallet,
          challengeId: row.challengeId,
          completionDay: row.completionDay,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok || data.error) throw new Error(data.error ?? "Failed to remove");
      toast.success("Submission removed.");
      setCompletions((prev) =>
        prev.filter(
          (r) =>
            !(r.wallet === row.wallet && r.challengeId === row.challengeId && r.completionDay === row.completionDay)
        )
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove submission");
    } finally {
      setRemovingKey(null);
    }
  }

  async function handleSyncFromSanity() {
    if (!token) {
      toast.error("Admin login required");
      return;
    }
    setSubmitting(true);
    try {
      const res = (await syncSanityChallenges(token)) as BackendApiResponse & {
        seasonsCreated?: number;
        seasonsUpdated?: number;
        challengesCreated?: number;
        challengesUpdated?: number;
      };
      if (res.error) throw new Error(res.error);

      const cfgRes = (await syncChallengeConfigFromSanity(
        token
      )) as BackendApiResponse & { updated?: number };
      if (cfgRes.error) throw new Error(cfgRes.error);

      const createdS = (res as { seasonsCreated?: number }).seasonsCreated ?? 0;
      const updatedS = (res as { seasonsUpdated?: number }).seasonsUpdated ?? 0;
      const createdC = (res as { challengesCreated?: number }).challengesCreated ?? 0;
      const updatedC = (res as { challengesUpdated?: number }).challengesUpdated ?? 0;
      const cfgUpdated = (cfgRes as { updated?: number }).updated ?? 0;
      const parts: string[] = [];
      if (createdS || updatedS) {
        const s: string[] = [];
        if (createdS) s.push(`${createdS} new`);
        if (updatedS) s.push(`${updatedS} updated`);
        parts.push(`Seasons: ${s.join(", ")}`);
      }
      if (createdC || updatedC) {
        const s: string[] = [];
        if (createdC) s.push(`${createdC} new`);
        if (updatedC) s.push(`${updatedC} updated`);
        parts.push(`Challenges: ${s.join(", ")}`);
      }
      if (cfgUpdated) {
        parts.push(`Configs: ${cfgUpdated} updated`);
      }

      if (parts.length) {
        toast.success(`Synced with Sanity. ${parts.join("; ")}.`);
      } else {
        toast.info("Synced with Sanity. No seasons or challenges in Studio.", {
          description: "Backend uses SANITY_PROJECT_ID and SANITY_DATASET — ensure they match your app's Sanity project. Create stubs from this page first, or add docs in Studio.",
        });
      }
      void queryClient.invalidateQueries({ queryKey: ["seasons"] });
      void queryClient.invalidateQueries({ queryKey: ["challenges"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to sync from Sanity");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="space-y-1">
          <PageHeader
            title="Challenges & Seasons"
            subtitle="Create here to get a stub in Sanity; edit slug and details below. Open Studio to fill in content."
          />
          {completions.length > 0 && (
            <p className="font-game text-xs text-yellow-400">
              {completions.length} challenge submission
              {completions.length === 1 ? "" : "s"} to review.
            </p>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          className="font-game"
          disabled={submitting}
          onClick={handleSyncFromSanity}
        >
          Sync from Sanity
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="p-4 sm:p-6 rounded-2xl border-4 border-border bg-card">
          <h2 className="font-game text-2xl mb-4">Seasons</h2>
          {seasonsLoading ? (
            <p className="font-game text-muted-foreground text-sm">Loading…</p>
          ) : seasons.length === 0 ? (
            <p className="font-game text-muted-foreground text-sm">No seasons yet. Create one to get a stub in Sanity.</p>
          ) : (
            <ul className="space-y-4 mb-6">
              {seasons.map((s) => (
                <li key={s.id} className="font-game text-sm rounded-xl border-2 border-border bg-muted/30 p-3 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{s.name}</span>
                    {s.fromSanity && (
                      <span className="text-[10px] uppercase tracking-wide rounded-full border px-2 py-0.5 text-muted-foreground">
                        From Sanity
                      </span>
                    )}
                    <span className="text-muted-foreground">{s.status}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-muted-foreground">Slug:</span>
                    {editingSeasonId === s.id ? (
                      <div className="flex items-center gap-1">
                        <Input
                          className="font-mono h-8 w-40"
                          value={editingSeasonSlug}
                          onChange={(e) => setEditingSeasonSlug(e.target.value)}
                        />
                        <Button size="sm" onClick={() => handleSaveSeasonSlug(s)} disabled={submitting}>
                          Save
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingSeasonId(null)}>
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <>
                        <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{s.slug}</code>
                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => { setEditingSeasonId(s.id); setEditingSeasonSlug(s.slug); }}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                      </>
                    )}
                  </div>
                  {s.description && <p className="text-muted-foreground text-xs">{s.description}</p>}
                  <p className="text-xs text-muted-foreground">
                    {s.startAt.slice(0, 10)} → {s.endAt.slice(0, 10)} · {s.challengeCount} challenge{s.challengeCount === 1 ? "" : "s"}
                  </p>
                  {s.sanityId && (
                    <a
                      href={`${STUDIO_BASE}/desk/season;${s.sanityId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-yellow-400 hover:underline"
                    >
                      Edit in Sanity <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </li>
              ))}
            </ul>
          )}
          <form onSubmit={handleCreateSeason} className="space-y-3">
            <Label className="font-game">New season (creates stub in Sanity)</Label>
            <Input
              placeholder="Slug (e.g. summer-2025)"
              value={seasonForm.slug}
              onChange={(e) => setSeasonForm((f) => ({ ...f, slug: e.target.value }))}
              className="font-game"
            />
            <Input
              placeholder="Name"
              value={seasonForm.name}
              onChange={(e) => setSeasonForm((f) => ({ ...f, name: e.target.value }))}
              className="font-game"
            />
            <Input
              placeholder="Start (YYYY-MM-DD)"
              value={seasonForm.startAt}
              onChange={(e) => setSeasonForm((f) => ({ ...f, startAt: e.target.value }))}
              className="font-game"
            />
            <Input
              placeholder="End (YYYY-MM-DD)"
              value={seasonForm.endAt}
              onChange={(e) => setSeasonForm((f) => ({ ...f, endAt: e.target.value }))}
              className="font-game"
            />
            <Button type="submit" variant="pixel" className="font-game" disabled={submitting}>
              Create season
            </Button>
          </form>
        </div>

        <div className="p-4 sm:p-6 rounded-2xl border-4 border-border bg-card">
          <h2 className="font-game text-2xl mb-4">Challenges</h2>
          {challengesLoading ? (
            <p className="font-game text-muted-foreground text-md">Loading…</p>
          ) : challenges.length === 0 ? (
            <p className="font-game text-muted-foreground text-md">No challenges yet. Create one to get a stub in Sanity.</p>
          ) : (
            <ul className="space-y-4 mb-6">
              {challenges.map((ch) => (
                <li key={ch.id} className="font-game text-md rounded-xl border-2 border-border bg-muted/30 p-3 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-md">{ch.title}</span>
                    {ch.fromSanity && (
                      <span className="text-md uppercase tracking-wide rounded-full border px-2 py-0.5 text-muted-foreground">
                        From Sanity
                      </span>
                    )}
                    <span className="text-yellow-400">{ch.xpReward} XP</span>
                    <span className="text-xs text-muted-foreground">
                      {ch.type === "daily"
                        ? "Daily"
                        : ch.type === "seasonal"
                        ? "Seasonal"
                        : ch.type === "sponsored"
                        ? "Sponsored"
                        : ch.type}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-muted-foreground">Slug:</span>
                    {editingChallengeId === ch.id ? (
                      <div className="flex items-center gap-1">
                        <Input
                          className="font-mono h-8 w-40"
                          value={editingChallengeSlug}
                          onChange={(e) => setEditingChallengeSlug(e.target.value)}
                        />
                        <Button size="sm" onClick={() => handleSaveChallengeSlug(ch)} disabled={submitting}>
                          Save
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingChallengeId(null)}>
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <>
                        <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{ch.slug}</code>
                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => { setEditingChallengeId(ch.id); setEditingChallengeSlug(ch.slug); }}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                      </>
                    )}
                  </div>
                  {ch.description && <p className="text-muted-foreground text-xs">{ch.description}</p>}
                  <p className="text-xs text-muted-foreground">
                    Type: {ch.type}
                    {ch.seasonName && ` · Season: ${ch.seasonName}`}
                    {(ch.startsAt || ch.endsAt) && ` · ${ch.startsAt?.slice(0, 10) ?? "—"} → ${ch.endsAt?.slice(0, 10) ?? "—"}`}
                  </p>
                  {ch.config && Object.keys(ch.config).length > 0 && (
                    <pre className="text-[10px] bg-muted rounded p-1.5 overflow-x-auto">{JSON.stringify(ch.config)}</pre>
                  )}
                  {ch.sanityId && (
                    <a
                      href={`${STUDIO_BASE}/desk/challenge;${ch.sanityId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-md text-yellow-400 hover:underline"
                    >
                      Edit in Sanity <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </li>
              ))}
            </ul>
          )}
          <form onSubmit={handleCreateChallenge} className="space-y-3">
            <Label className="font-game text-lg">New challenge (creates stub in Sanity)</Label>
            <Input
              placeholder="Slug (e.g. complete-one-lesson)"
              value={challengeForm.slug}
              onChange={(e) => setChallengeForm((f) => ({ ...f, slug: e.target.value }))}
              className="font-game text-md"
            />
            <Input
              placeholder="Title"
              value={challengeForm.title}
              onChange={(e) => setChallengeForm((f) => ({ ...f, title: e.target.value }))}
              className="font-game text-md"
            />
            <select
              value={challengeForm.type}
              onChange={(e) =>
                setChallengeForm((f) => ({
                  ...f,
                  type: e.target.value as "daily" | "seasonal" | "sponsored",
                }))
              }
              className="border border-input rounded-md bg-background px-3 py-2 font-game w-full text-md"
            >
              <option value="daily">Daily</option>
              <option value="seasonal">Seasonal</option>
              <option value="sponsored">Sponsored</option>
            </select>
            <Input
              type="number"
              placeholder="XP reward"
              value={challengeForm.xpReward ?? ""}
              onChange={(e) =>
                setChallengeForm((f) => ({ ...f, xpReward: parseInt(e.target.value, 10) || 0 }))
              }
              className="font-game text-md"
            />
            <Button type="submit" variant="pixel" className="font-game" disabled={submitting}>
              Create challenge
            </Button>
          </form>
        </div>
      </div>

      <div className="p-4 sm:p-6 rounded-2xl border-4 border-border bg-card">
        <h2 className="font-game text-2xl mb-4">Challenge submissions</h2>
        <p className="font-game text-sm text-muted-foreground mb-4">
          Verify submission links and remove invalid completions. Removing deletes the completion record (user will need to re-complete).
        </p>
        {completionsLoading ? (
          <p className="font-game text-muted-foreground text-sm">Loading…</p>
        ) : completions.length === 0 ? (
          <p className="font-game text-muted-foreground text-sm">No completions yet.</p>
        ) : (
          <ul className="space-y-3">
            {completions.map((row) => {
              const key = `${row.wallet}-${row.challengeId}-${row.completionDay}`;
              const isRemoving = removingKey === key;
              return (
                <li
                  key={key}
                  className="font-game text-sm rounded-xl border-2 border-border bg-muted/30 p-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4"
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="font-medium">{row.challengeTitle}</p>
                    <p className="text-xs text-muted-foreground">
                      <span className="font-mono">{row.wallet.slice(0, 8)}…{row.wallet.slice(-6)}</span>
                      {" · "}
                      {row.completionDay}
                      {" · "}
                      {new Date(row.completedAt).toLocaleString()}
                    </p>
                    {row.submissionLink && (
                      <a
                        href={row.submissionLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-yellow-400 hover:underline break-all"
                      >
                        <Link2 className="h-3 w-3 shrink-0" />
                        {row.submissionLink}
                      </a>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="font-game shrink-0"
                    disabled={isRemoving}
                    onClick={() => handleRemoveCompletion(row)}
                  >
                    {isRemoving ? "Removing…" : "Remove (invalid)"}
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
