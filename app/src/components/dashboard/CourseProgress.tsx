
"use client";

import { motion } from "framer-motion";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";

interface CourseProgressProps {
  courses: any[];
  completedLessons: string[];
}

export function CourseProgress({ courses, completedLessons }: CourseProgressProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white flex items-center gap-3">
        My Courses <span className="bg-[#1E1E24] text-[10px] px-2 py-0.5 rounded text-gray-500 uppercase">{courses.length}</span>
      </h2>
      
      <div className="grid sm:grid-cols-2 gap-4">
        {courses.map((course, index) => {
          const totalLessons = course.modules.reduce((acc: any, m: any) => acc + m.lessons.length, 0);
          let completedCount = 0;
          let earnedXP = 0;
          let totalXP = 0;

          course.modules.forEach((m: any) => {
            m.lessons.forEach((l: any) => {
              totalXP += l.xp;
              if (completedLessons.includes(l.id)) {
                completedCount++;
                earnedXP += l.xp;
              }
            });
          });

          const percent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

          return (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="bg-[#0A0A0F]/50 border border-[#2E2E36] rounded-[2rem] p-6 group hover:border-[#9945FF]/30 transition-all overflow-hidden relative"
            >
              {/* Thumbnail Placeholder/Image */}
              <div className="aspect-video w-full bg-[#1E1E24] rounded-2xl mb-4 overflow-hidden relative">
                 {course.image ? (
                   <img src={course.image} alt={course.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                 ) : (
                   <div className="w-full h-full flex items-center justify-center text-[#2E2E36]">
                      <Play className="h-12 w-12" />
                   </div>
                 )}
                 <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              </div>

              <h3 className="text-lg font-bold text-white mb-2 group-hover:text-[#9945FF] transition-colors">{course.title}</h3>
              
              <div className="flex justify-between text-[11px] text-gray-500 mb-2">
                <span>{earnedXP}/{totalXP} XP</span>
                <span className="text-[#14F195] font-bold">{percent}%</span>
              </div>

              <div className="w-full bg-[#1E1E24] h-1.5 rounded-full overflow-hidden mb-6">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${percent}%` }}
                  className="bg-[#14F195] h-full"
                />
              </div>

              <Button asChild className="w-full rounded-2xl bg-white text-black hover:bg-gray-200 h-10 font-bold text-xs uppercase tracking-wider">
                <Link href={`/courses/${course.slug}`}>
                  {percent === 100 ? "Review Course" : "Continue Learning →"}
                </Link>
              </Button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
