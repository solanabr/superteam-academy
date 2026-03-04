"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { useI18n } from "@/components/providers/I18nProvider";

export function FeaturesSection() {
  const { t } = useI18n();
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  return (
    <section ref={sectionRef} className="rounded-[2rem] md:rounded-[3rem] bg-[#111111] text-white p-8 md:p-16 lg:p-24 overflow-hidden relative">
      {/* Decorative blur */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-neutral-800/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 relative z-10">
        {/* Left -- Copy */}
        <div className="flex flex-col justify-center">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="mb-8 flex items-center gap-2 text-neutral-400 text-sm font-medium tracking-wide uppercase"
          >
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
            Platform
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl md:text-7xl font-semibold tracking-tighter leading-tight mb-8"
          >
            {t("landing.featuresTitle")}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl md:text-2xl text-neutral-400 max-w-md leading-relaxed"
          >
            {t("landing.featuresSubtitle")}
          </motion.p>
        </div>

        {/* Right -- Feature Card */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="relative mt-8 lg:mt-0 group"
        >
          <div className="bg-[#1A1A1A] border border-neutral-800 rounded-2xl p-6 md:p-8 shadow-2xl relative transition-transform duration-500 ease-out group-hover:scale-[1.02]">
            {/* Tabs */}
            <div className="flex justify-between text-xs text-neutral-500 mb-8 font-medium tracking-wide">
              <div className="flex gap-6">
                <span className="text-white border-b border-white pb-1">
                  Features
                </span>
                <span className="hover:text-neutral-300 cursor-pointer transition-colors">
                  Stack
                </span>
                <span className="hover:text-neutral-300 cursor-pointer transition-colors">
                  Rewards
                </span>
              </div>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-4 h-4"
              >
                <circle cx="12" cy="12" r="1" />
                <circle cx="19" cy="12" r="1" />
                <circle cx="5" cy="12" r="1" />
              </svg>
            </div>

            {/* Feature List */}
            <div className="space-y-6 mb-8">
              <FeatureItem
                icon="code"
                title={t("landing.featureEditor")}
                description={t("landing.featureEditorDesc")}
              />
              <FeatureItem
                icon="trophy"
                title={t("landing.featureCredentials")}
                description={t("landing.featureCredentialsDesc")}
              />
              <FeatureItem
                icon="zap"
                title={t("landing.featureXP")}
                description={t("landing.featureXPDesc")}
              />
            </div>

            {/* Inner card */}
            <div className="bg-[#222] rounded-xl p-8 border border-neutral-700 relative overflow-hidden shadow-inner">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white to-transparent opacity-20" />
              <div className="flex justify-between text-xs font-medium text-neutral-500 mb-8">
                <span className="text-white">Community Stats</span>
                <span>Devnet</span>
              </div>
              <div className="flex gap-1.5 h-10 mb-8 items-end justify-center">
                <div className="w-1.5 bg-neutral-600 h-4 rounded-full" />
                <div className="w-1.5 bg-neutral-600 h-6 rounded-full" />
                <div className="w-1.5 bg-white h-full rounded-full shadow-[0_0_15px_rgba(255,255,255,0.5)] animate-pulse" />
                <div className="w-1.5 bg-neutral-700 h-8 rounded-full" />
                <div className="w-1.5 bg-neutral-800 h-3 rounded-full" />
              </div>
              <div className="text-5xl font-mono text-white mb-2 text-center tracking-widest font-light">
                3,847
              </div>
              <div className="text-neutral-500 text-sm mb-8 text-center">
                Builders Learning
              </div>
              <button className="w-full py-3.5 bg-white text-black text-sm font-bold rounded-full hover:bg-neutral-200 hover:scale-[1.02] active:scale-95 transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                View Leaderboard
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function FeatureItem({
  icon,
  title,
  description,
}: {
  icon: "code" | "trophy" | "zap";
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-4 items-start">
      <div className="w-10 h-10 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center flex-shrink-0">
        {icon === "code" && (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-white"
          >
            <polyline points="16 18 22 12 16 6" />
            <polyline points="8 6 2 12 8 18" />
          </svg>
        )}
        {icon === "trophy" && (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-white"
          >
            <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
            <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
            <path d="M4 22h16" />
            <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
            <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
            <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
          </svg>
        )}
        {icon === "zap" && (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-white"
          >
            <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z" />
          </svg>
        )}
      </div>
      <div>
        <h4 className="text-sm font-semibold text-white mb-1">{title}</h4>
        <p className="text-xs text-neutral-400 leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}
