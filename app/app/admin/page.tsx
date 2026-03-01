"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { mockCourses, mockLeaderboard } from "@/lib/mockData";
import { formatXP } from "@/lib/utils";
import { cn } from "@/lib/utils";
import {
  Users, BookOpen, Zap, Trophy, TrendingUp,
  Settings, Shield, BarChart3, Eye, Trash2,
  Plus, Search, CheckCircle, XCircle
} from "lucide-react";

const ADMIN_PASSWORD = "superteam2024";

const mockUsers = [
  { id: 1, email: "alice@solana.dev", wallet: "7xKXtg...AsU", xp: 15420, level: 12, courses: 4, joined: "Jan 2024", status: "active" },
  { id: 2, email: "bob@anchor.dev", wallet: "9WzDXw...WM", xp: 12800, level: 11, courses: 3, joined: "Feb 2024", status: "active" },
  { id: 3, email: "carol@defi.dev", wallet: "3FZbgi...3q", xp: 11200, level: 10, courses: 5, joined: "Jan 2024", status: "active" },
  { id: 4, email: "dave@nft.dev", wallet: "5Q544f...j1", xp: 9800, level: 9, courses: 2, joined: "Mar 2024", status: "suspended" },
  { id: 5, email: "eve@rust.dev", wallet: "DezXAZ...63", xp: 8900, level: 9, courses: 3, joined: "Feb 2024", status: "active" },
];

const mockStats = {
  totalUsers: 1240,
  activeToday: 47,
  totalXPDistributed: 2847000,
  coursesCompleted: 3420,
  avgSessionTime: "24min",
  retentionRate: "68%",
};

const tabs = ["Overview", "Users", "Courses", "Analytics"];

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("Overview");
  const [search, setSearch] = useState("");

  function handleLogin() {
    if (password === ADMIN_PASSWORD) {
      setAuthenticated(true);
      setError("");
    } else {
      setError("Invalid password");
    }
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-[#020202] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm mx-4 border border-[#1a1a1a] bg-[#0a0a0a]"
        >
          <div className="px-8 py-6 border-b border-[#1a1a1a]">
            <div className="flex items-center gap-3 mb-2">
              <Shield className="w-5 h-5 text-[#9945ff]" />
              <h1 className="font-display font-black text-2xl uppercase">ADMIN ACCESS</h1>
            </div>
            <p className="text-[10px] font-mono text-[#444] uppercase tracking-widest">
              Restricted area — authorized personnel only
            </p>
          </div>
          <div className="p-8 space-y-4">
            <div>
              <label className="text-[9px] font-mono text-[#444] uppercase tracking-widest mb-2 block">
                Admin Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleLogin()}
                placeholder="Enter admin password..."
                className="w-full bg-[#020202] border border-[#1a1a1a] px-4 py-3 text-sm font-mono text-[#f5f5f0] placeholder-[#333] focus:outline-none focus:border-[#9945ff] transition-colors"
              />
              {error && (
                <p className="text-[10px] font-mono text-[#ff3366] mt-2">{error}</p>
              )}
            </div>
            <button
              onClick={handleLogin}
              className="w-full py-3 bg-[#9945ff] text-white font-mono text-[10px] uppercase tracking-widest hover:bg-[#8835ef] transition-colors"
            >
              Access Dashboard →
            </button>
            <p className="text-[9px] font-mono text-[#333] text-center">
              Hint: superteam2024
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  const filteredUsers = mockUsers.filter(u =>
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.wallet.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#020202]">

      {/* Header */}
      <div className="border-b border-[#1a1a1a] bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-[#9945ff]" />
              <div>
                <h1 className="font-display font-black text-2xl uppercase tracking-tighter">ADMIN DASHBOARD</h1>
                <p className="text-[9px] font-mono text-[#444] uppercase tracking-widest">Superteam Academy Control Panel</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-[#14f195] animate-pulse" />
              <span className="text-[10px] font-mono text-[#14f195]">System Online</span>
              <button
                onClick={() => setAuthenticated(false)}
                className="ml-4 px-4 py-2 border border-[#ff3366]/20 text-[#ff3366] font-mono text-[9px] uppercase tracking-widest hover:bg-[#ff3366]/10 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-[#1a1a1a]">
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex">
            {tabs.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-6 py-4 text-[10px] font-mono uppercase tracking-widest border-r border-[#1a1a1a] transition-colors",
                  activeTab === tab
                    ? "text-[#9945ff] bg-[#0a0a0a] border-b-2 border-b-[#9945ff]"
                    : "text-[#444] hover:text-[#f5f5f0] hover:bg-[#0a0a0a]"
                )}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8">

        {/* Overview Tab */}
        {activeTab === "Overview" && (
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { label: "Total Users", value: mockStats.totalUsers.toLocaleString(), icon: Users, color: "text-[#9945ff]", border: "border-[#9945ff]/20 bg-[#9945ff]/5" },
                { label: "Active Today", value: mockStats.activeToday.toString(), icon: TrendingUp, color: "text-[#14f195]", border: "border-[#14f195]/20 bg-[#14f195]/5" },
                { label: "XP Distributed", value: formatXP(mockStats.totalXPDistributed), icon: Zap, color: "text-[#f5a623]", border: "border-[#f5a623]/20 bg-[#f5a623]/5" },
                { label: "Courses Completed", value: mockStats.coursesCompleted.toLocaleString(), icon: BookOpen, color: "text-[#ff3366]", border: "border-[#ff3366]/20 bg-[#ff3366]/5" },
                { label: "Avg Session", value: mockStats.avgSessionTime, icon: BarChart3, color: "text-[#9945ff]", border: "border-[#9945ff]/20 bg-[#9945ff]/5" },
                { label: "Retention Rate", value: mockStats.retentionRate, icon: Trophy, color: "text-[#14f195]", border: "border-[#14f195]/20 bg-[#14f195]/5" },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={cn("border p-6", stat.border)}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-[10px] font-mono text-[#444] uppercase tracking-widest">{stat.label}</div>
                    <stat.icon className={cn("w-4 h-4", stat.color)} />
                  </div>
                  <div className={cn("font-display font-black text-4xl", stat.color)}>{stat.value}</div>
                </motion.div>
              ))}
            </div>

            {/* Recent Activity */}
            <div className="border border-[#1a1a1a]">
              <div className="px-6 py-4 border-b border-[#1a1a1a] bg-[#0a0a0a]">
                <div className="text-[10px] font-mono text-[#333] uppercase tracking-widest">Recent Activity</div>
              </div>
              <div className="divide-y divide-[#1a1a1a]">
                {[
                  { action: "New user registered", user: "alice@solana.dev", time: "2m ago", type: "user" },
                  { action: "Course completed", user: "bob@anchor.dev", time: "15m ago", type: "course" },
                  { action: "Achievement unlocked", user: "carol@defi.dev", time: "1h ago", type: "achievement" },
                  { action: "Daily challenge solved", user: "eve@rust.dev", time: "2h ago", type: "challenge" },
                  { action: "New user registered", user: "dave@nft.dev", time: "3h ago", type: "user" },
                ].map((activity, i) => (
                  <div key={i} className="flex items-center justify-between px-6 py-4 hover:bg-[#0a0a0a] transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        activity.type === "user" ? "bg-[#9945ff]" :
                        activity.type === "course" ? "bg-[#14f195]" :
                        activity.type === "achievement" ? "bg-[#f5a623]" : "bg-[#ff3366]"
                      )} />
                      <span className="text-xs font-mono text-[#f5f5f0] uppercase">{activity.action}</span>
                      <span className="text-[10px] font-mono text-[#444]">{activity.user}</span>
                    </div>
                    <span className="text-[10px] font-mono text-[#333]">{activity.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === "Users" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#444]" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search users..."
                  className="pl-9 pr-4 py-2.5 bg-[#0a0a0a] border border-[#1a1a1a] text-xs font-mono text-[#f5f5f0] placeholder-[#333] focus:outline-none focus:border-[#9945ff] transition-colors w-72"
                />
              </div>
              <div className="text-[10px] font-mono text-[#444] uppercase">
                {filteredUsers.length} users
              </div>
            </div>

            <div className="border border-[#1a1a1a] overflow-hidden">
              <div className="grid grid-cols-6 gap-4 px-6 py-3 bg-[#0a0a0a] border-b border-[#1a1a1a]">
                {["User", "Wallet", "XP", "Level", "Status", "Actions"].map(h => (
                  <div key={h} className="text-[9px] font-mono text-[#333] uppercase tracking-widest">{h}</div>
                ))}
              </div>
              <div className="divide-y divide-[#1a1a1a]">
                {filteredUsers.map((user, i) => (
                  <motion.div
                    key={user.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="grid grid-cols-6 gap-4 px-6 py-4 hover:bg-[#0a0a0a] transition-colors items-center"
                  >
                    <div>
                      <div className="text-xs font-mono text-[#f5f5f0] truncate">{user.email}</div>
                      <div className="text-[9px] font-mono text-[#444]">Joined {user.joined}</div>
                    </div>
                    <div className="text-[10px] font-mono text-[#9945ff]">{user.wallet}</div>
                    <div className="text-[10px] font-mono text-[#14f195] font-bold">{formatXP(user.xp)}</div>
                    <div className="text-[10px] font-mono text-[#f5f5f0]">Level {user.level}</div>
                    <div>
                      <span className={cn(
                        "text-[9px] font-mono px-2 py-1 border uppercase",
                        user.status === "active"
                          ? "border-[#14f195]/30 text-[#14f195] bg-[#14f195]/5"
                          : "border-[#ff3366]/30 text-[#ff3366] bg-[#ff3366]/5"
                      )}>
                        {user.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="w-7 h-7 flex items-center justify-center border border-[#1a1a1a] text-[#444] hover:border-[#9945ff] hover:text-[#9945ff] transition-colors">
                        <Eye className="w-3 h-3" />
                      </button>
                      <button className="w-7 h-7 flex items-center justify-center border border-[#1a1a1a] text-[#444] hover:border-[#ff3366] hover:text-[#ff3366] transition-colors">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Courses Tab */}
        {activeTab === "Courses" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="text-[10px] font-mono text-[#444] uppercase">{mockCourses.length} courses</div>
              <button className="flex items-center gap-2 px-5 py-2.5 bg-[#9945ff] text-white font-mono text-[10px] uppercase tracking-widest hover:bg-[#8835ef] transition-colors">
                <Plus className="w-3.5 h-3.5" />
                Add Course
              </button>
            </div>
            <div className="border border-[#1a1a1a] overflow-hidden">
              <div className="grid grid-cols-5 gap-4 px-6 py-3 bg-[#0a0a0a] border-b border-[#1a1a1a]">
                {["Course", "Track", "Difficulty", "Enrolled", "Actions"].map(h => (
                  <div key={h} className="text-[9px] font-mono text-[#333] uppercase tracking-widest">{h}</div>
                ))}
              </div>
              <div className="divide-y divide-[#1a1a1a]">
                {mockCourses.map((course, i) => (
                  <motion.div
                    key={course.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="grid grid-cols-5 gap-4 px-6 py-4 hover:bg-[#0a0a0a] transition-colors items-center"
                  >
                    <div>
                      <div className="text-xs font-mono text-[#f5f5f0] font-bold uppercase">{course.title}</div>
                      <div className="text-[9px] font-mono text-[#444]">{course.lessons} lessons · {course.duration}</div>
                    </div>
                    <div className="text-[10px] font-mono text-[#9945ff] truncate">{course.track}</div>
                    <div>
                      <span className={cn(
                        "text-[9px] font-mono px-2 py-1 border uppercase",
                        course.difficulty === 1 ? "border-[#14f195]/30 text-[#14f195]" :
                        course.difficulty === 2 ? "border-[#f5a623]/30 text-[#f5a623]" :
                        "border-[#ff3366]/30 text-[#ff3366]"
                      )}>
                        {course.difficulty === 1 ? "Beginner" : course.difficulty === 2 ? "Intermediate" : "Advanced"}
                      </span>
                    </div>
                    <div className="text-[10px] font-mono text-[#f5f5f0]">{(course.enrolled ?? 0).toLocaleString()}</div>
                    <div className="flex items-center gap-2">
                      <button className="w-7 h-7 flex items-center justify-center border border-[#1a1a1a] text-[#444] hover:border-[#9945ff] hover:text-[#9945ff] transition-colors">
                        <Eye className="w-3 h-3" />
                      </button>
                      <button className="w-7 h-7 flex items-center justify-center border border-[#1a1a1a] text-[#444] hover:border-[#14f195] hover:text-[#14f195] transition-colors">
                        <Settings className="w-3 h-3" />
                      </button>
                      <button className="w-7 h-7 flex items-center justify-center border border-[#1a1a1a] text-[#444] hover:border-[#ff3366] hover:text-[#ff3366] transition-colors">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === "Analytics" && (
          <div className="space-y-8">
            {/* XP Distribution */}
            <div className="border border-[#1a1a1a]">
              <div className="px-6 py-4 border-b border-[#1a1a1a] bg-[#0a0a0a]">
                <div className="text-[10px] font-mono text-[#333] uppercase tracking-widest">XP Distribution by Course</div>
              </div>
              <div className="p-6 space-y-4">
                {mockCourses.map((course, i) => (
                  <div key={course.id}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-mono text-[#f5f5f0] uppercase">{course.title}</span>
                      <span className="text-[10px] font-mono text-[#9945ff]">{course.xp.toLocaleString()} XP</span>
                    </div>
                    <div className="h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-[#9945ff] to-[#14f195] rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${(course.xp / 2500) * 100}%` }}
                        transition={{ duration: 0.8, delay: i * 0.1 }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Learners */}
            <div className="border border-[#1a1a1a]">
              <div className="px-6 py-4 border-b border-[#1a1a1a] bg-[#0a0a0a]">
                <div className="text-[10px] font-mono text-[#333] uppercase tracking-widest">Top Learners</div>
              </div>
              <div className="divide-y divide-[#1a1a1a]">
                {mockLeaderboard.slice(0, 5).map((entry, i) => (
                  <div key={i} className="flex items-center gap-6 px-6 py-4 hover:bg-[#0a0a0a] transition-colors">
                    <span className="font-display font-black text-2xl text-[#333] w-8">#{entry.rank}</span>
                    <div className="flex-1">
                      <div className="text-xs font-mono text-[#f5f5f0] uppercase">{entry.wallet}</div>
                      <div className="text-[9px] font-mono text-[#444]">Level {entry.level}</div>
                    </div>
                    <div className="text-[10px] font-mono text-[#9945ff] font-bold">{formatXP(entry.xp)} XP</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}