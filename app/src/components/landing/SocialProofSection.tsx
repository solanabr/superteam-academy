"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { useI18n } from "@/components/providers/I18nProvider";

function AnimatedNumber({ value, inView }: { value: number; inView: boolean }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!inView) return;

    let start = 0;
    const end = value;
    const duration = 2000;
    const incrementTime = duration / end;
    
    const timer = setInterval(() => {
      start += 1;
      setCount(start);
      if (start >= end) {
        clearInterval(timer);
      }
    }, incrementTime);

    return () => clearInterval(timer);
  }, [inView, value]);

  return <span>{count.toLocaleString()}</span>;
}

export function SocialProofSection() {
  const { t } = useI18n();
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  return (
    <section ref={sectionRef} className="py-12 md:py-24 relative">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-8"
      >
        <div className="max-w-2xl">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-xs font-semibold tracking-widest text-neutral-500 uppercase mb-4"
          >
            Community
          </motion.div>
          <h2 className="md:text-5xl lg:text-6xl leading-[1.1] text-4xl font-semibold text-neutral-900 dark:text-white tracking-tighter">
            {t("landing.socialProofTitle")}
          </h2>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
        {/* Highlighted Stat Card */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative bg-[#a5b4fc] rounded-3xl p-8 flex flex-col min-h-[360px] hover:scale-[1.01] transition-transform duration-300"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-black" />
            <span className="text-sm font-medium text-neutral-800">
              Active Learners
            </span>
          </div>
          <div className="text-5xl md:text-6xl font-semibold text-black tracking-tighter mb-1 mt-auto">
            <AnimatedNumber value={3847} inView={isInView} />{" "}
            <span className="text-sm font-sans font-medium tracking-normal align-middle opacity-60">
              BUILDERS
            </span>
          </div>
          <div className="mt-8">
            <Link
              href="/courses"
              className="w-full py-4 bg-white text-black text-sm font-bold rounded-full hover:bg-neutral-50 transition-colors uppercase tracking-wide block text-center"
            >
              Join Them
            </Link>
          </div>
        </motion.div>

        {/* Courses Stat */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="bg-neutral-50 dark:bg-neutral-900 rounded-3xl p-8 flex flex-col min-h-[360px] hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors duration-300"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full border border-neutral-400" />
            <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
              Courses Available
            </span>
          </div>
          <div className="text-5xl md:text-6xl font-semibold text-black dark:text-white tracking-tighter mb-1 mt-auto">
            <AnimatedNumber value={24} inView={isInView} />{" "}
            <span className="text-sm font-sans font-medium tracking-normal align-middle opacity-60">
              COURSES
            </span>
          </div>
          <div className="mt-8">
            <Link
              href="/courses"
              className="w-full py-4 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-black dark:text-white text-sm font-bold rounded-full hover:border-black dark:hover:border-white transition-colors uppercase tracking-wide shadow-sm block text-center"
            >
              {t("common.exploreCourses")}
            </Link>
          </div>
        </motion.div>

        {/* Credentials Stat */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="bg-neutral-50 dark:bg-neutral-900 rounded-3xl p-8 flex flex-col min-h-[360px] hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors duration-300"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full border border-neutral-400" />
            <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
              On-Chain Credentials
            </span>
          </div>
          <div className="text-5xl md:text-6xl font-semibold text-black dark:text-white tracking-tighter mb-1 mt-auto">
            <AnimatedNumber value={1200} inView={isInView} />{" "}
            <span className="text-sm font-sans font-medium tracking-normal align-middle opacity-60">
              ISSUED
            </span>
          </div>
          <div className="mt-8">
            <Link
              href="/leaderboard"
              className="w-full py-4 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-black dark:text-white text-sm font-bold rounded-full hover:border-black dark:hover:border-white transition-colors uppercase tracking-wide shadow-sm block text-center"
            >
              View Leaderboard
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
