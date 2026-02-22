"use client";

import { XpStatCard } from "@/components/xp-stat-card";
import { CourseProgress } from "@/components/course-progress";
import { StreakCard } from "@/components/streak-card";
import { useUser } from "@/hooks/useUser";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, Loader2 } from "lucide-react";

export default function DashboardPage() {
  const { userDb, enrollments, loading } = useUser();

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      </div>

      <XpStatCard />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4 space-y-4">
            <h3 className="text-xl font-semibold">My Learning</h3>
            
            {loading ? (
                <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
            ) : enrollments.length > 0 ? (
                enrollments.map((enrollment) => (
                    <CourseProgress key={enrollment.courseId} courseId={enrollment.courseId} />
                ))
            ) : (
                <div className="p-8 border rounded-lg text-center bg-muted/20">
                    <p className="mb-4 text-muted-foreground">You haven't started any courses yet.</p>
                    <Link href="/courses">
                        <Button>Explore Courses <ArrowRight className="ml-2 h-4 w-4"/></Button>
                    </Link>
                </div>
            )}
        </div>

        <div className="col-span-3 space-y-4">
            <h3 className="text-xl font-semibold">Activity</h3>
            <StreakCard />
        </div>
      </div>
    </div>
  );
}