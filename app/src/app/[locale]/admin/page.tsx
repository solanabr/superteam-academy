"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useTranslations } from "next-intl";
import {
  BookOpen,
  Users,
  Award,
  Shield,
  Settings,
  BarChart3,
  Layers,
  Lock,
  LogOut,
  ChevronDown,
  ChevronUp,
  Database,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdminGuard } from "@/components/admin/admin-guard";
import { StatsCards } from "@/components/admin/stats-cards";
import { CourseTable } from "@/components/admin/course-table";
import { UserTable } from "@/components/admin/user-table";
import { AnalyticsCharts } from "@/components/admin/analytics-charts";
import { ModerationList } from "@/components/admin/moderation-list";
import { PlatformSettings } from "@/components/admin/platform-settings";
import { CmsIntegration } from "@/components/admin/cms-integration";
import { useAdmin } from "@/lib/hooks/use-admin";

type SectionId =
  | "courses"
  | "users"
  | "credentials"
  | "analytics"
  | "moderation"
  | "cms"
  | "settings";

export default function AdminDashboard() {
  const t = useTranslations("admin");
  const { connected, publicKey } = useWallet();
  const { logout } = useAdmin();
  const [expandedSection, setExpandedSection] = useState<SectionId | null>(
    "courses",
  );

  const toggleSection = (id: SectionId) => {
    setExpandedSection(expandedSection === id ? null : id);
  };

  return (
    <AdminGuard>
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
                  {t("title")}
                </h1>
              </div>
              <p className="text-sm text-[var(--c-text-2)]">
                {t("subtitle")}
              </p>
            </div>
            {connected && publicKey && (
              <div className="hidden md:flex items-center gap-2">
                <div className="flex items-center gap-2 rounded-[2px] border border-[var(--c-border-subtle)] bg-[var(--c-bg-card)] px-3 py-2">
                  <Lock className="h-4 w-4 text-[#00FFA3]" />
                  <span className="font-mono text-xs text-[var(--c-text-2)]">
                    {publicKey.toBase58().slice(0, 4)}...
                    {publicKey.toBase58().slice(-4)}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={logout}
                  className="gap-1.5 text-[var(--c-text-2)] hover:text-[#EF4444]"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  {t("logout")}
                </Button>
              </div>
            )}
          </div>

          {/* Stats Grid — real on-chain data */}
          <StatsCards />

          {/* Management Sections */}
          <h2 className="text-lg font-semibold text-[var(--c-text)] mb-4">
            {t("management")}
          </h2>
          <div className="space-y-3">
            {/* Course Management */}
            <AdminSection
              id="courses"
              title={t("courseManagement")}
              desc={t("courseManagementDesc")}
              icon={BookOpen}
              expanded={expandedSection === "courses"}
              onToggle={() => toggleSection("courses")}
            >
              <CourseTable />
            </AdminSection>

            {/* User Management */}
            <AdminSection
              id="users"
              title={t("userManagement")}
              desc={t("userManagementDesc")}
              icon={Users}
              expanded={expandedSection === "users"}
              onToggle={() => toggleSection("users")}
            >
              <UserTable />
            </AdminSection>

            {/* Credential Issuance */}
            <AdminSection
              id="credentials"
              title={t("credentialIssuance")}
              desc={t("credentialIssuanceDesc")}
              icon={Award}
              expanded={expandedSection === "credentials"}
              onToggle={() => toggleSection("credentials")}
            >
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs text-[var(--c-text-2)]">
                  {t("credentialIssuanceInfo")}
                </p>
              </div>
            </AdminSection>

            {/* Analytics */}
            <AdminSection
              id="analytics"
              title={t("analytics")}
              desc={t("analyticsDesc")}
              icon={BarChart3}
              expanded={expandedSection === "analytics"}
              onToggle={() => toggleSection("analytics")}
            >
              <AnalyticsCharts />
            </AdminSection>

            {/* Content Moderation */}
            <AdminSection
              id="moderation"
              title={t("contentModeration")}
              desc={t("contentModerationDesc")}
              icon={Shield}
              expanded={expandedSection === "moderation"}
              onToggle={() => toggleSection("moderation")}
            >
              <ModerationList />
            </AdminSection>

            {/* CMS Integration */}
            <AdminSection
              id="cms"
              title={t("cmsIntegration")}
              desc={t("cmsIntegrationDesc")}
              icon={Database}
              expanded={expandedSection === "cms"}
              onToggle={() => toggleSection("cms")}
            >
              <CmsIntegration />
            </AdminSection>

            {/* Platform Settings */}
            <AdminSection
              id="settings"
              title={t("platformSettings")}
              desc={t("platformSettingsDesc")}
              icon={Settings}
              expanded={expandedSection === "settings"}
              onToggle={() => toggleSection("settings")}
            >
              <PlatformSettings />
            </AdminSection>
          </div>
        </div>
      </div>
    </AdminGuard>
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

