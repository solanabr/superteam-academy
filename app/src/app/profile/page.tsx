"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { MeshGradient } from "@/components/MeshGradient";
import { GridPattern } from "@/components/GridPattern";
import {
  Trophy, Zap, Flame,
  Calendar, Link as LinkIcon, Twitter, Github, Globe,
  Shield, Star, Code, Lock, ExternalLink
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { getXPBalance, calculateLevel, getCredentials } from "@/lib/blockchain";
import { useLearningService } from "@/contexts/ServicesContext";
import { Credential } from "@/types";
import { useI18n } from "@/components/I18nProvider";

const COMPLETED_COURSES = [
  { id: "anchor-fundamentals", title: "Anchor Fundamentals", completedAt: "2026-01-15", xp: 1200 },
];

const SKILLS = [
  { name: "Rust", level: 75 },
  { name: "Anchor", level: 65 },
  { name: "Solana", level: 70 },
  { name: "Frontend", level: 55 },
  { name: "Security", level: 40 },
];

export default function ProfilePage() {
  const { t } = useI18n();
  const { connected, publicKey } = useWallet();
  const learningService = useLearningService();

  const [stats, setStats] = useState({
    xp: 0,
    level: 1,
    achievements: 3,
  });

  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(true);

  const loadUserData = useCallback(async () => {
    if (!publicKey) return;

    try {
      setLoading(true);

      // Fetch real XP from blockchain
      const xp = await getXPBalance(publicKey);
      const level = calculateLevel(xp);

      // Fetch real credentials from blockchain
      const creds = await getCredentials(publicKey);

      setStats({
        xp,
        level,
        achievements: 3,
      });

      setCredentials(creds);
    } catch (error) {
      console.error("Error loading user data:", error);
    } finally {
      setLoading(false);
    }
  }, [publicKey]);

  useEffect(() => {
    if (connected && publicKey) {
      loadUserData();
    }
  }, [connected, publicKey, loadUserData]);

  if (!connected) {
    return (
      <div className="min-h-screen bg-black text-white relative">
        <MeshGradient />
        <GridPattern />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-semibold mb-4">{t("nav.connectWallet")}</h1>
            <p className="text-white/60 mb-8">{t("lesson.enrollToUnlock")}</p>
            <Link href="/" className="px-6 py-3 bg-white text-black rounded-md font-medium hover:bg-white/90 transition-colors">
              Go Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white relative">
      <MeshGradient />
      <GridPattern />

      <main className="pt-14 relative z-10">
        <div className="max-w-4xl mx-auto px-6 py-12">
          {/* Profile Header */}
          <div className="flex flex-col md:flex-row gap-8 mb-12">
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-4xl font-bold text-black border-4 border-black ring-2 ring-yellow-400/20">
              {publicKey?.toString().slice(0, 2).toUpperCase()}
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-4 mb-2">
                <h1 className="text-3xl font-semibold">{t("profile.solanaDev")}</h1>
                <span className="px-3 py-1 bg-yellow-400/20 text-yellow-400 rounded-full text-sm font-medium">
                  {t("dashboard.level")} {stats.level}
                </span>
              </div>

              <p className="text-white/60 mb-4">
                {t("profile.bio")}
              </p>

              <div className="flex flex-wrap gap-4 text-sm text-white/40 mb-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {t("profile.joined", { date: "January 2026" })}
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  {stats.xp.toLocaleString()} XP
                </div>
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4" />
                  {t("profile.achievementsCount", { count: stats.achievements })}
                </div>
              </div>

              <div className="flex gap-3">
                <a href="#" className="p-2 bg-white/5 rounded-md hover:bg-white/10 transition-colors">
                  <Twitter className="w-4 h-4" />
                </a>
                <a href="#" className="p-2 bg-white/5 rounded-md hover:bg-white/10 transition-colors">
                  <Github className="w-4 h-4" />
                </a>
                <a href="#" className="p-2 bg-white/5 rounded-md hover:bg-white/10 transition-colors">
                  <Globe className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>

          {/* Credentials (cNFTs) - REAL DATA FROM BLOCKCHAIN */}
          <section className="mb-12">
            <h2 className="text-xl font-semibold mb-6">{t("profile.credentials")}</h2>
            {credentials.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-4">
                {credentials.map((cred) => (
                  <div
                    key={cred.id}
                    className="bg-white/5 border border-white/10 rounded-xl p-6 flex items-center gap-4"
                  >
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                      <Shield className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium">{cred.track}</h3>
                      <p className="text-white/40 text-sm">{t("dashboard.level")} {cred.level}</p>
                      <p className="text-white/40 text-sm">{cred.xp} XP earned</p>
                    </div>
                    <a
                      href={`https://explorer.solana.com/address/${cred.mintAddress}?cluster=devnet`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-white/5 rounded-md hover:bg-white/10 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center text-white/40">
                {t("profile.noCredentials")}
              </div>
            )}
          </section>

          {/* Skills */}
          <section className="mb-12">
            <h2 className="text-xl font-semibold mb-6">{t("profile.skills")}</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {SKILLS.map((skill) => (
                <div key={skill.name} className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <div className="flex justify-between mb-2">
                    <span className="font-medium">{skill.name}</span>
                    <span className="text-white/40">{skill.level}%</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full"
                      style={{ width: `${skill.level}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Completed Courses */}
          <section>
            <h2 className="text-xl font-semibold mb-6">{t("profile.completedCourses")}</h2>
            <div className="space-y-4">
              {COMPLETED_COURSES.map((course) => (
                <div
                  key={course.id}
                  className="bg-white/5 border border-white/10 rounded-xl p-6 flex items-center justify-between"
                >
                  <div>
                    <h3 className="font-medium mb-1">{course.title}</h3>
                    <p className="text-white/40 text-sm">Completed {course.completedAt}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-yellow-400 font-medium">{course.xp} XP</div>
                    <Link
                      href={`/certificates/${course.id}`}
                      className="text-white/40 text-sm hover:text-white"
                    >
                      {t("profile.viewCertificate")}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
