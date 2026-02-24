"use client";

import { motion } from "motion/react";
import type { CredentialAsset } from "@/lib/credentials";

export function CredentialCard({
  credential,
  index = 0,
}: {
  credential: CredentialAsset;
  index?: number;
}) {
  const attrs = credential.content?.metadata?.attributes ?? [];
  const trackId = attrs.find((a) => a.trait_type === "track_id")?.value;
  const level = attrs.find((a) => a.trait_type === "level")?.value;
  const coursesCompleted = attrs.find((a) => a.trait_type === "courses_completed")?.value;
  const totalXp = attrs.find((a) => a.trait_type === "total_xp")?.value;
  const name = credential.content?.metadata?.name ?? "Credential";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.1 }}
      className="group relative overflow-hidden rounded-2xl border border-solana-purple/20 bg-surface p-px"
    >
      {/* Shimmer border */}
      <div className="absolute inset-0 rounded-2xl bg-[conic-gradient(from_180deg,transparent_60%,#9945FF_80%,#14F195_90%,transparent_100%)] opacity-0 transition-opacity duration-500 group-hover:opacity-60" />

      <div className="relative rounded-2xl bg-surface p-5">
        <div className="mb-4 flex items-start justify-between">
          <div className="flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-solana-purple/60">
              Soulbound Credential
            </p>
            <h3 className="mt-1 text-base font-bold text-content">{name}</h3>
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-solana-green/10 border border-solana-green/20">
            <svg className="h-4 w-4 text-solana-green" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {trackId && (
            <div className="rounded-lg bg-card px-3 py-2">
              <p className="text-[10px] uppercase tracking-wider text-content-muted">Track</p>
              <p className="font-mono text-sm font-bold text-content-secondary">{trackId}</p>
            </div>
          )}
          {level && (
            <div className="rounded-lg bg-card px-3 py-2">
              <p className="text-[10px] uppercase tracking-wider text-content-muted">Level</p>
              <p className="font-mono text-sm font-bold text-content-secondary">{level}</p>
            </div>
          )}
          {coursesCompleted && (
            <div className="rounded-lg bg-card px-3 py-2">
              <p className="text-[10px] uppercase tracking-wider text-content-muted">Courses</p>
              <p className="font-mono text-sm font-bold text-content-secondary">{coursesCompleted}</p>
            </div>
          )}
          {totalXp && (
            <div className="rounded-lg bg-card px-3 py-2">
              <p className="text-[10px] uppercase tracking-wider text-content-muted">XP</p>
              <p className="font-mono text-sm font-bold text-solana-green">{totalXp}</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
