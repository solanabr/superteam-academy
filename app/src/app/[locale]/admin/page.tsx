"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  BookOpen,
  Users,
  Award,
  TrendingUp,
  Shield,
  Settings,
  BarChart3,
  Layers,
  Lock,
  ChevronDown,
  ChevronUp,
  Plus,
  Search,
  Eye,
  Edit2,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { TRACK_LABELS, TRACK_COLORS } from "@/lib/constants";
import { courses } from "@/lib/services/courses";
import type { Track } from "@/lib/services/types";

const ADMIN_STATS = [
  {
    label: "Total Courses",
    value: String(courses.length),
    icon: BookOpen,
    change: `${courses.length} published`,
  },
  { label: "Active Learners", value: "1,247", icon: Users, change: "+18% MoM" },
  {
    label: "Credentials Issued",
    value: "342",
    icon: Award,
    change: "+56 this week",
  },
  {
    label: "Total XP Distributed",
    value: "847K",
    icon: TrendingUp,
    change: "+12% MoM",
  },
];

const DEMO_LEARNERS = [
  {
    wallet: "7Rq1...dK4f",
    name: "SolDev.eth",
    xp: 2800,
    level: 5,
    courses: 4,
    streak: 12,
  },
  {
    wallet: "9nQE...GFJk",
    name: "RustBuilder",
    xp: 1900,
    level: 4,
    courses: 3,
    streak: 7,
  },
  {
    wallet: "4zMM...ncDU",
    name: "AnchorFan",
    xp: 1200,
    level: 3,
    courses: 2,
    streak: 3,
  },
  {
    wallet: "CrED...r7QR",
    name: "DeFiExplorer",
    xp: 800,
    level: 2,
    courses: 1,
    streak: 1,
  },
  {
    wallet: "Hx7P...mK9s",
    name: "WebDev42",
    xp: 500,
    level: 1,
    courses: 1,
    streak: 0,
  },
];

const DEMO_CREDENTIALS_LOG = [
  {
    learner: "7Rq1...dK4f",
    track: "rust" as Track,
    level: 2,
    issuedAt: "2025-12-15",
    tx: "5xKm...9pQw",
  },
  {
    learner: "9nQE...GFJk",
    track: "anchor" as Track,
    level: 1,
    issuedAt: "2026-01-10",
    tx: "3bYn...7rLs",
  },
  {
    learner: "4zMM...ncDU",
    track: "frontend" as Track,
    level: 1,
    issuedAt: "2026-01-28",
    tx: "8kPq...2mXv",
  },
  {
    learner: "CrED...r7QR",
    track: "defi" as Track,
    level: 1,
    issuedAt: "2026-02-05",
    tx: "Lp4R...6wDs",
  },
];

type SectionId =
  | "courses"
  | "users"
  | "credentials"
  | "analytics"
  | "moderation"
  | "settings";

export default function AdminDashboard() {
  const { connected, publicKey } = useWallet();
  const [expandedSection, setExpandedSection] = useState<SectionId | null>(
    "courses",
  );
  const [searchQuery, setSearchQuery] = useState("");

  const toggleSection = (id: SectionId) => {
    setExpandedSection(expandedSection === id ? null : id);
  };

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-[2px] border border-[var(--c-border-subtle)] bg-[var(--c-bg-card)]">
                <Layers className="h-5 w-5 text-[#00FFA3]" />
              </div>
              <h1 className="text-2xl font-bold text-[var(--c-text)]">
                Admin Dashboard
              </h1>
              <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20">
                Preview
              </Badge>
            </div>
            <p className="text-sm text-[var(--c-text-2)]">
              Platform administration and content management
            </p>
          </div>
          {connected && publicKey && (
            <div className="hidden md:flex items-center gap-2 rounded-[2px] border border-[var(--c-border-subtle)] bg-[var(--c-bg-card)] px-3 py-2">
              <Lock className="h-4 w-4 text-[#00FFA3]" />
              <span className="font-mono text-xs text-[var(--c-text-2)]">
                {publicKey.toBase58().slice(0, 4)}...
                {publicKey.toBase58().slice(-4)}
              </span>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-10">
          {ADMIN_STATS.map((stat) => (
            <div
              key={stat.label}
              className="rounded-[2px] border border-[var(--c-border-subtle)] bg-[var(--c-bg-card)] p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <stat.icon className="h-5 w-5 text-[var(--c-text-2)]" />
                <span className="font-mono text-xs text-[#00FFA3]">
                  {stat.change}
                </span>
              </div>
              <p className="text-2xl font-bold text-[var(--c-text)] font-mono">
                {stat.value}
              </p>
              <p className="text-xs text-[var(--c-text-2)] mt-1">
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        {/* Management Sections */}
        <h2 className="text-lg font-semibold text-[var(--c-text)] mb-4">
          Management
        </h2>
        <div className="space-y-3">
          {/* Course Management */}
          <AdminSection
            id="courses"
            title="Course Management"
            desc="Create, edit, and publish courses and lessons"
            icon={BookOpen}
            expanded={expandedSection === "courses"}
            onToggle={() => toggleSection("courses")}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 flex-1 max-w-xs">
                <Search className="h-4 w-4 text-[var(--c-text-2)]" />
                <Input
                  placeholder="Search courses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
              <Button size="sm" className="gap-1.5">
                <Plus className="h-3.5 w-3.5" /> New Course
              </Button>
            </div>
            <div className="border border-[var(--c-border-subtle)] rounded-[2px] overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[var(--c-bg-elevated)] text-[var(--c-text-2)] text-xs uppercase tracking-wider">
                    <th className="px-4 py-2.5 text-left font-medium">
                      Course
                    </th>
                    <th className="px-4 py-2.5 text-left font-medium">Track</th>
                    <th className="px-4 py-2.5 text-center font-medium">
                      Lessons
                    </th>
                    <th className="px-4 py-2.5 text-center font-medium">XP</th>
                    <th className="px-4 py-2.5 text-center font-medium">
                      Status
                    </th>
                    <th className="px-4 py-2.5 text-right font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--c-border-subtle)]">
                  {courses
                    .filter(
                      (c) =>
                        !searchQuery ||
                        c.title
                          .toLowerCase()
                          .includes(searchQuery.toLowerCase()),
                    )
                    .map((course) => (
                      <tr
                        key={course.id}
                        className="hover:bg-[var(--c-bg-elevated)]/50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="font-medium text-[var(--c-text)]">
                            {course.title}
                          </div>
                          <div className="text-xs text-[var(--c-text-2)] mt-0.5 line-clamp-1">
                            {course.description}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className="text-xs font-mono"
                            style={{ color: TRACK_COLORS[course.track] }}
                          >
                            {TRACK_LABELS[course.track]}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center font-mono text-[var(--c-text-2)]">
                          {course.lessonCount}
                        </td>
                        <td className="px-4 py-3 text-center font-mono text-[#00FFA3]">
                          {course.xpReward}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant="beginner" className="text-[10px]">
                            Published
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              className="p-1.5 rounded hover:bg-[var(--c-border-subtle)] text-[var(--c-text-2)] hover:text-[var(--c-text)] transition-colors"
                              aria-label="View course"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </button>
                            <button
                              className="p-1.5 rounded hover:bg-[var(--c-border-subtle)] text-[var(--c-text-2)] hover:text-[var(--c-text)] transition-colors"
                              aria-label="Edit course"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </AdminSection>

          {/* User Management */}
          <AdminSection
            id="users"
            title="User Management"
            desc="View learner profiles, XP history, and credentials"
            icon={Users}
            expanded={expandedSection === "users"}
            onToggle={() => toggleSection("users")}
          >
            <div className="border border-[var(--c-border-subtle)] rounded-[2px] overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[var(--c-bg-elevated)] text-[var(--c-text-2)] text-xs uppercase tracking-wider">
                    <th className="px-4 py-2.5 text-left font-medium">
                      Learner
                    </th>
                    <th className="px-4 py-2.5 text-center font-medium">XP</th>
                    <th className="px-4 py-2.5 text-center font-medium">
                      Level
                    </th>
                    <th className="px-4 py-2.5 text-center font-medium">
                      Courses
                    </th>
                    <th className="px-4 py-2.5 text-center font-medium">
                      Streak
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--c-border-subtle)]">
                  {DEMO_LEARNERS.map((learner) => (
                    <tr
                      key={learner.wallet}
                      className="hover:bg-[var(--c-bg-elevated)]/50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium text-[var(--c-text)]">
                          {learner.name}
                        </div>
                        <div className="text-xs font-mono text-[var(--c-text-2)]">
                          {learner.wallet}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center font-mono text-[#00FFA3]">
                        {learner.xp.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-center font-mono text-[var(--c-text)]">
                        {learner.level}
                      </td>
                      <td className="px-4 py-3 text-center font-mono text-[var(--c-text-2)]">
                        {learner.courses}
                      </td>
                      <td className="px-4 py-3 text-center font-mono text-[var(--c-text-2)]">
                        {learner.streak}d
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </AdminSection>

          {/* Credential Issuance */}
          <AdminSection
            id="credentials"
            title="Credential Issuance"
            desc="Mint and manage ZK Compressed credentials (Light Protocol)"
            icon={Award}
            expanded={expandedSection === "credentials"}
            onToggle={() => toggleSection("credentials")}
          >
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs text-[var(--c-text-2)]">
                Recent credential issuances
              </p>
              <Button size="sm" variant="outline" className="gap-1.5">
                <Plus className="h-3.5 w-3.5" /> Issue Credential
              </Button>
            </div>
            <div className="border border-[var(--c-border-subtle)] rounded-[2px] overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[var(--c-bg-elevated)] text-[var(--c-text-2)] text-xs uppercase tracking-wider">
                    <th className="px-4 py-2.5 text-left font-medium">
                      Learner
                    </th>
                    <th className="px-4 py-2.5 text-left font-medium">Track</th>
                    <th className="px-4 py-2.5 text-center font-medium">
                      Level
                    </th>
                    <th className="px-4 py-2.5 text-left font-medium">
                      Issued
                    </th>
                    <th className="px-4 py-2.5 text-left font-medium">Tx</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--c-border-subtle)]">
                  {DEMO_CREDENTIALS_LOG.map((cred, i) => (
                    <tr
                      key={i}
                      className="hover:bg-[var(--c-bg-elevated)]/50 transition-colors"
                    >
                      <td className="px-4 py-3 font-mono text-xs text-[var(--c-text)]">
                        {cred.learner}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="text-xs font-mono"
                          style={{ color: TRACK_COLORS[cred.track] }}
                        >
                          {TRACK_LABELS[cred.track]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center font-mono text-[var(--c-text-2)]">
                        {cred.level}
                      </td>
                      <td className="px-4 py-3 text-xs text-[var(--c-text-2)]">
                        {cred.issuedAt}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-[#00FFA3]">
                        {cred.tx}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </AdminSection>

          {/* Analytics */}
          <AdminSection
            id="analytics"
            title="Analytics Dashboard"
            desc="Course completion rates, engagement metrics"
            icon={BarChart3}
            expanded={expandedSection === "analytics"}
            onToggle={() => toggleSection("analytics")}
          >
            <div className="grid gap-4 sm:grid-cols-3">
              <MetricCard
                label="Avg. Completion Rate"
                value="68%"
                sub="across all courses"
                color="#00FFA3"
              />
              <MetricCard
                label="Daily Active Learners"
                value="187"
                sub="past 7-day avg"
                color="#03E1FF"
              />
              <MetricCard
                label="Avg. Session Duration"
                value="24m"
                sub="per learner"
                color="#CA9FF5"
              />
            </div>
            <div className="mt-4 rounded-[2px] border border-[var(--c-border-subtle)] bg-[var(--c-bg-card)] p-4">
              <h4 className="text-xs font-medium text-[var(--c-text-2)] uppercase tracking-wider mb-3">
                Enrollments (last 7 days)
              </h4>
              <div className="flex items-end gap-1 h-24">
                {[45, 62, 38, 71, 55, 89, 67].map((val, i) => (
                  <div
                    key={i}
                    className="flex-1 flex flex-col items-center gap-1"
                  >
                    <div
                      className="w-full rounded-t-[1px] bg-[#00FFA3]/20 border-t-2 border-[#00FFA3] transition-all"
                      style={{ height: `${val}%` }}
                    />
                    <span className="text-[9px] font-mono text-[var(--c-text-2)]">
                      {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </AdminSection>

          {/* Content Moderation */}
          <AdminSection
            id="moderation"
            title="Content Moderation"
            desc="Review submissions, manage challenge solutions"
            icon={Shield}
            expanded={expandedSection === "moderation"}
            onToggle={() => toggleSection("moderation")}
          >
            <div className="text-center py-8">
              <Shield className="h-8 w-8 text-[var(--c-text-2)]/30 mx-auto mb-3" />
              <p className="text-sm text-[var(--c-text-2)]">
                No pending items for review
              </p>
              <p className="text-xs text-[var(--c-text-dim)] mt-1">
                Submissions will appear here when learners submit code
                challenges
              </p>
            </div>
          </AdminSection>

          {/* Platform Settings */}
          <AdminSection
            id="settings"
            title="Platform Settings"
            desc="Configure XP rates, season management, backend signer"
            icon={Settings}
            expanded={expandedSection === "settings"}
            onToggle={() => toggleSection("settings")}
          >
            <div className="space-y-4">
              <SettingRow
                label="Daily XP Cap"
                value="500 XP"
                description="Maximum XP earnable per learner per day"
              />
              <SettingRow
                label="Current Season"
                value="Season 1"
                description="Active season for XP minting"
              />
              <SettingRow
                label="Backend Signer"
                value="Bx9f...K3qR"
                description="Rotatable signer stored in Config PDA"
                mono
              />
              <SettingRow
                label="Credential Type"
                value="ZK Compressed (Light)"
                description="Verifiable on-chain credentials via Light Protocol"
              />
            </div>
          </AdminSection>
        </div>

        {/* Architecture Note */}
        <div className="mt-10 rounded-[2px] border border-[var(--c-border-subtle)] bg-[var(--c-bg-card)]/50 p-6">
          <h3 className="text-sm font-semibold text-[var(--c-text)] mb-2">
            Architecture Note
          </h3>
          <p className="text-xs text-[var(--c-text-2)] leading-relaxed">
            The admin dashboard connects to the on-chain Superteam Academy
            program via the platform authority (Squads multisig). Admin actions
            like course creation, credential issuance, and season management
            invoke program instructions signed by the backend signer stored in
            the Config PDA. Full implementation follows the{" "}
            <span className="text-[#00FFA3] font-mono">
              IMPLEMENTATION_ORDER.md
            </span>{" "}
            build phases.
          </p>
        </div>
      </div>
    </div>
  );
}

function AdminSection({
  id,
  title,
  desc,
  icon: Icon,
  expanded,
  onToggle,
  children,
}: {
  id: string;
  title: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[2px] border border-[var(--c-border-subtle)] bg-[var(--c-bg-card)] overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-5 hover:bg-[var(--c-bg-elevated)]/30 transition-colors cursor-pointer"
        aria-expanded={expanded}
        aria-controls={`admin-section-${id}`}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-[2px] border border-[var(--c-border-subtle)] bg-[var(--c-border-subtle)]/20">
            <Icon className="h-4 w-4 text-[var(--c-text-2)]" />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-semibold text-[var(--c-text)]">
              {title}
            </h3>
            <p className="text-xs text-[var(--c-text-2)]">{desc}</p>
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-[var(--c-text-2)]" />
        ) : (
          <ChevronDown className="h-4 w-4 text-[var(--c-text-2)]" />
        )}
      </button>
      {expanded && (
        <div
          id={`admin-section-${id}`}
          className="px-5 pb-5 border-t border-[var(--c-border-subtle)] pt-4"
        >
          {children}
        </div>
      )}
    </div>
  );
}

function MetricCard({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string;
  sub: string;
  color: string;
}) {
  return (
    <div className="rounded-[2px] border border-[var(--c-border-subtle)] bg-[var(--c-bg-card)] p-4">
      <p className="text-xs text-[var(--c-text-2)] mb-1">{label}</p>
      <p className="text-2xl font-bold font-mono" style={{ color }}>
        {value}
      </p>
      <p className="text-[10px] text-[var(--c-text-dim)] mt-1">{sub}</p>
    </div>
  );
}

function SettingRow({
  label,
  value,
  description,
  mono,
}: {
  label: string;
  value: string;
  description: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-[var(--c-border-subtle)] last:border-b-0">
      <div>
        <p className="text-sm font-medium text-[var(--c-text)]">{label}</p>
        <p className="text-xs text-[var(--c-text-2)] mt-0.5">{description}</p>
      </div>
      <span
        className={`text-sm text-[var(--c-text-em)] ${mono ? "font-mono" : ""}`}
      >
        {value}
      </span>
    </div>
  );
}
