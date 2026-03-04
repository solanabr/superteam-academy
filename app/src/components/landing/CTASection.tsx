"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { useI18n } from "@/components/providers/I18nProvider";

export function CTASection() {
  const { t } = useI18n();
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  return (
    <section ref={sectionRef} className="mb-20">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={isInView ? { opacity: 1, scale: 1 } : {}}
        transition={{ duration: 0.6 }}
        className="relative w-full rounded-[2.5rem] bg-[#111111] overflow-hidden px-8 py-20 md:py-32 text-center"
      >
        {/* Decorative blur */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-900/20 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-5xl md:text-7xl lg:text-8xl font-semibold text-white tracking-tighter leading-none mb-8"
          >
            {t("landing.ctaTitle")}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-neutral-400 text-lg md:text-xl mb-10 max-w-lg leading-relaxed"
          >
            {t("landing.ctaSubtitle")}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col md:flex-row items-center gap-4 w-full justify-center"
          >
            <Link
              href="/courses"
              className="px-10 py-4 bg-white text-black rounded-full text-base font-bold hover:bg-neutral-200 hover:scale-105 transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.15)] min-w-[200px] text-center"
            >
              {t("common.startLearning")}
            </Link>
            <Link
              href="/courses"
              className="px-10 py-4 bg-transparent border border-neutral-700 text-white rounded-full text-base font-semibold hover:border-white transition-all duration-300 min-w-[200px] text-center"
            >
              {t("common.exploreCourses")}
            </Link>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
