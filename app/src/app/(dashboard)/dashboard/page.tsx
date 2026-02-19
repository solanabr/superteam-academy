// app/src/app/(dashboard)/dashboard/page.tsx
import { XpStatCard } from "@/components/xp-stat-card";
import { CourseProgress } from "@/components/course-progress";
import { StreakCard } from "@/components/streak-card";

export default function DashboardPage() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      </div>

      {/* Блок статистики XP и Уровня */}
      <XpStatCard />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Левая колонка: Прогресс курсов (занимает 4/7 ширины) */}
        <div className="col-span-4 space-y-4">
            <h3 className="text-xl font-semibold">My Learning</h3>
            {/* Хардкодим ID курса, который мы создали (anchor-101) */}
            <CourseProgress courseId="anchor-101" />
        </div>

        {/* Правая колонка: Стрики и Активность (занимает 3/7 ширины) */}
        <div className="col-span-3 space-y-4">
            <h3 className="text-xl font-semibold">Activity</h3>
            <StreakCard />
        </div>
      </div>
    </div>
  );
}