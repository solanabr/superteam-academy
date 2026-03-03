import type { Metadata } from "next";
import {
  getAdminStats,
  getRecentSignups,
  getRecentThreads,
  getCourseStats,
} from "@/lib/admin";
import { AdminClient } from "./AdminClient";

export const metadata: Metadata = {
  title: "Admin Dashboard",
  description: "Superteam Academy admin panel",
};

export default async function AdminPage() {
  const [stats, recentSignups, recentThreads, courseStats] = await Promise.all([
    getAdminStats(),
    getRecentSignups(5),
    getRecentThreads(5),
    getCourseStats(),
  ]);

  return (
    <AdminClient
      stats={stats}
      recentSignups={recentSignups}
      recentThreads={recentThreads}
      courseStats={courseStats}
    />
  );
}
