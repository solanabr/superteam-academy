'use client';

import Link from 'next/link';
import { useWallet } from '@solana/wallet-adapter-react';
import { useState, useEffect } from 'react';
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';
import { learningProgressService } from '@/lib/services';
import { courses } from '@/lib/data/courses';
import type { AchievementReceipt, Credential } from '@/lib/services/types';

const SKILL_LABELS: Record<string, string> = {
  rust: 'Rust',
  anchor: 'Anchor',
  frontend: 'Frontend',
  security: 'Security',
  defi: 'DeFi',
};

/** Stub skill levels 0–100 derived from progress; production: from credentials or CMS */
function useSkillRadarData(wallet: string | null) {
  const [data, setData] = useState<{ subject: string; value: number; fullMark: number }[]>([]);
  useEffect(() => {
    if (!wallet) {
      setData([]);
      return;
    }
    learningProgressService.getProgress(wallet).then((p) => {
      const completed = p.completedLessons ?? {};
      const totalDone = Object.values(completed).flat().length;
      const totalLessons = courses.reduce((s, c) => s + c.lessons.length, 0);
      const base = totalLessons > 0 ? Math.min(100, Math.round((totalDone / totalLessons) * 100)) : 0;
      setData(
        Object.keys(SKILL_LABELS).map((key) => ({
          subject: SKILL_LABELS[key],
          value: Math.min(100, base + Math.floor(Math.random() * 20)),
          fullMark: 100,
        }))
      );
    });
  }, [wallet]);
  return data;
}

export function ProfileContent() {
  const { publicKey } = useWallet();
  const [achievements, setAchievements] = useState<AchievementReceipt[]>([]);
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [progress, setProgress] = useState<Record<string, string[]>>({});
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const radarData = useSkillRadarData(publicKey?.toBase58() ?? null);

  useEffect(() => {
    if (!publicKey) return;
    const wallet = publicKey.toBase58();
    learningProgressService.getAchievements(wallet).then(setAchievements);
    learningProgressService.getCredentials(wallet).then(setCredentials);
    learningProgressService.getProgress(wallet).then((p) => setProgress(p.completedLessons ?? {}));
  }, [publicKey]);

  if (!publicKey) return null;

  const walletShort = `${publicKey.toBase58().slice(0, 4)}...${publicKey.toBase58().slice(-4)}`;
  const completedCourses = courses.filter((c) => (progress[c.id] ?? []).length === c.lessons.length && c.lessons.length > 0);

  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-border/50 bg-surface p-6" aria-labelledby="profile-header">
        <div id="profile-header" className="flex flex-wrap items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/20 text-2xl" aria-hidden>
            👤
          </div>
          <div>
            <p className="text-title font-semibold text-[rgb(var(--text))]">{walletShort}</p>
            <p className="text-caption text-[rgb(var(--text-muted))]">Wallet address · Edit in Settings</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-caption text-[rgb(var(--text-muted))]">Profile:</span>
            <button
              type="button"
              onClick={() => setVisibility((v) => (v === 'public' ? 'private' : 'public'))}
              className="rounded-lg border border-border/50 bg-surface-elevated px-3 py-1.5 text-caption font-medium text-[rgb(var(--text))] transition hover:bg-surface focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:outline-none"
              aria-pressed={visibility === 'public'}
            >
              {visibility === 'public' ? 'Public' : 'Private'}
            </button>
          </div>
        </div>
      </section>

      {radarData.length > 0 && (
        <section className="rounded-xl border border-border/50 bg-surface p-6" aria-labelledby="skill-radar-heading">
          <h2 id="skill-radar-heading" className="text-body mb-4 font-semibold text-[rgb(var(--text))]">
            Skill radar
          </h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgb(71 85 105)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgb(148 163 184)', fontSize: 12 }} />
                <PolarRadiusAxis angle={90} tick={{ fill: 'rgb(148 163 184)', fontSize: 10 }} />
                <Radar name="Level" dataKey="value" stroke="rgb(20 184 166)" fill="rgb(20 184 166)" fillOpacity={0.3} />
                <Tooltip contentStyle={{ background: 'rgb(30 41 59)', border: '1px solid rgb(71 85 105)', borderRadius: 8 }} />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      <section>
        <h2 className="text-title mb-4 font-semibold text-[rgb(var(--text))]">Achievements</h2>
        {achievements.length > 0 ? (
          <div className="flex flex-wrap gap-3">
            {achievements.map((a) => (
              <div
                key={a.achievementId}
                className="flex items-center gap-3 rounded-xl border border-border/50 bg-surface px-4 py-3"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-chart-3/20 text-lg" aria-hidden>🏅</span>
                <div>
                  <p className="text-body font-medium text-[rgb(var(--text))]">{a.name}</p>
                  <p className="text-caption text-[rgb(var(--text-muted))]">+{a.xpReward} XP</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-body text-[rgb(var(--text-muted))]">No achievements yet. Complete lessons to earn badges.</p>
        )}
      </section>

      <section>
        <h2 className="text-title mb-4 font-semibold text-[rgb(var(--text))]">On-chain credentials</h2>
        {credentials.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {credentials.map((c) => (
              <div key={c.mint} className="rounded-xl border border-border/50 bg-surface p-5">
                <p className="text-body font-medium text-[rgb(var(--text))]">{c.track}</p>
                <p className="text-caption text-[rgb(var(--text-muted))]">Level {c.level} · {c.totalXp} XP</p>
                {c.verificationUrl && (
                  <a href={c.verificationUrl} target="_blank" rel="noopener noreferrer" className="text-caption mt-2 inline-block text-accent hover:underline">
                    Verify →
                  </a>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-body text-[rgb(var(--text-muted))]">Complete courses to earn on-chain credentials (Metaplex Core NFTs).</p>
        )}
      </section>

      <section>
        <h2 className="text-title mb-4 font-semibold text-[rgb(var(--text))]">Completed courses</h2>
        {completedCourses.length > 0 ? (
          <ul className="space-y-2">
            {completedCourses.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/courses/${c.slug}`}
                  className="block rounded-lg border border-border/50 bg-surface px-4 py-3 font-medium text-[rgb(var(--text))] transition hover:border-accent/40 hover:text-accent focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:outline-none"
                >
                  {c.title} ✓
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-body text-[rgb(var(--text-muted))]">No courses completed yet. Finish all lessons in a course to list it here.</p>
        )}
      </section>
    </div>
  );
}
