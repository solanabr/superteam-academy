"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  BookOpen,
  Users,
  Zap,
  TrendingUp,
  Plus,
  Edit,
  Shield,
  Activity,
} from "lucide-react";
import { PageLayout } from "@/components/layout/page-layout";
import { Button } from "@/components/ui/button";
import { MOCK_COURSES, MOCK_LEADERBOARD } from "@/lib/mock-data";
import { formatXP } from "@/lib/utils/xp";
import { cn } from "@/lib/utils/cn";

const statCards = [
  { label: "Total Users", value: "5,247", icon: Users, color: "#9945FF", change: "+12%" },
  { label: "Active Courses", value: String(MOCK_COURSES.length), icon: BookOpen, color: "#14F195", change: "+2" },
  { label: "Total XP Awarded", value: "2.1M", icon: Zap, color: "#00C2FF", change: "+340K" },
  { label: "Enrollments (30d)", value: "1,892", icon: TrendingUp, color: "#FF6B35", change: "+8%" },
];

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "courses" | "users">("overview");

  return (
    <PageLayout>
      <div className="min-h-screen pt-20 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8 pt-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-4 w-4 text-[#9945FF]" />
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Admin Dashboard
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold">Platform Analytics</h1>
              <p className="text-muted-foreground text-sm mt-1">
                Course management and user analytics
              </p>
            </div>
            <Button variant="gradient" size="sm" className="gap-2 hidden sm:flex">
              <Plus className="h-4 w-4" />
              New Course
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
            {statCards.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bento-card p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${stat.color}18` }}
                  >
                    <stat.icon className="h-4 w-4" style={{ color: stat.color }} />
                  </div>
                  <span className="text-[10px] font-semibold text-[#14F195]">{stat.change}</span>
                </div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
              </motion.div>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            {(["overview", "courses", "users"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize",
                  activeTab === tab
                    ? "bg-[#9945FF]/15 text-[#9945FF] border border-[#9945FF]/30"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                )}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Content */}
          {activeTab === "overview" && (
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="bento-card p-5">
                <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-[#9945FF]" />
                  Top Courses by Enrollment
                </h3>
                <div className="space-y-3">
                  {MOCK_COURSES.slice(0, 5).map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-white/[0.03]"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                          style={{ backgroundColor: `${c.track.color}18` }}
                        >
                          {c.track.icon}
                        </div>
                        <div>
                          <p className="text-sm font-medium truncate max-w-[200px]">{c.title}</p>
                          <p className="text-xs text-muted-foreground">{c.difficulty}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold">{c.enrolledCount.toLocaleString()}</p>
                        <p className="text-[10px] text-muted-foreground">enrolled</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bento-card p-5">
                <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-[#14F195]" />
                  Top Learners (XP)
                </h3>
                <div className="space-y-3">
                  {MOCK_LEADERBOARD.slice(0, 5).map((u) => (
                    <div
                      key={u.userId}
                      className="flex items-center justify-between p-3 rounded-lg bg-white/[0.03]"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#9945FF] to-[#14F195] flex items-center justify-center text-xs font-bold text-white">
                          {u.username.slice(0, 2).toUpperCase()}
                        </div>
                        <p className="text-sm font-medium">{u.username}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-[#14F195]">{formatXP(u.xp)}</p>
                        <p className="text-[10px] text-muted-foreground">Level {u.level}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "courses" && (
            <div className="bento-card overflow-hidden">
              <div className="p-4 border-b border-white/[0.07] flex items-center justify-between">
                <h3 className="font-semibold">Course Management</h3>
                <Button variant="glass" size="sm" className="gap-1">
                  <Plus className="h-3 w-3" />
                  Add
                </Button>
              </div>
              <div className="divide-y divide-white/[0.06]">
                {MOCK_COURSES.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between p-4 hover:bg-white/[0.03] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                        style={{ backgroundColor: `${c.track.color}18` }}
                      >
                        {c.track.icon}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{c.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {c.enrolledCount} enrolled · {c.rating} ★
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="gap-1">
                      <Edit className="h-3 w-3" />
                      Edit
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "users" && (
            <div className="bento-card p-6 text-center">
              <Users className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
              <p className="text-muted-foreground text-sm">User management integration coming soon.</p>
              <p className="text-xs text-muted-foreground mt-1">
                Connect to your auth backend or indexer for full user analytics.
              </p>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
