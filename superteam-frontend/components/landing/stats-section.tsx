import { Users, BookCheck, Code2, Zap } from "lucide-react";
import { platformStats } from "@/lib/landing-data";

const stats = [
  { label: "Developers", value: platformStats.developers, icon: Users },
  {
    label: "Courses Completed",
    value: platformStats.coursesCompleted,
    icon: BookCheck,
  },
  {
    label: "Challenges Solved",
    value: platformStats.challengesSolved,
    icon: Code2,
  },
  { label: "XP Awarded", value: platformStats.xpAwarded, icon: Zap },
];

export function StatsSection() {
  return (
    <section className="border-y border-border bg-card/50">
      <div className="mx-auto max-w-7xl px-4 py-12 lg:px-6">
        <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="flex flex-col items-center text-center"
            >
              <stat.icon className="mb-3 h-6 w-6 text-primary" />
              <p className="text-2xl font-bold text-foreground lg:text-3xl">
                {stat.value}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
