import type { Metadata } from "next";
import { DashboardPageClient } from "@/components/dashboard/dashboard-page-client";
import { getActiveCourses } from "@/lib/data/queries";

export const metadata: Metadata = {
  title: "Dashboard | Superteam Academy",
  description: "Track your XP, course progress, streak, and achievements.",
};

export default async function DashboardPage() {
  const activeCourses = await getActiveCourses();
  return <DashboardPageClient activeCourses={activeCourses} />;
}
