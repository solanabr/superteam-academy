"use client";

import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

export function HeroSection() {
  const t = useTranslations("Landing");

  return (
    <section className="relative overflow-hidden pb-32 pt-24">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(139,92,246,0.22),transparent_35%),radial-gradient(circle_at_80%_10%,rgba(236,72,153,0.2),transparent_30%),radial-gradient(circle_at_50%_80%,rgba(6,182,212,0.16),transparent_35%)]" />
      <div className="pointer-events-none absolute inset-0 [background-image:linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] [background-size:44px_44px]" />

      <div className="container relative z-10 px-4 text-center md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-5xl space-y-7"
        >
          <div className="inline-flex items-center rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-200 backdrop-blur">
            <span className="mr-2 flex h-2 w-2 rounded-full bg-emerald-400" />
            {t("devnetLive")}
          </div>

          <h1 className="bg-gradient-to-r from-purple-300 via-fuchsia-400 to-cyan-300 bg-clip-text pb-2 text-5xl font-extrabold tracking-tight text-transparent md:text-7xl">
            {t("title")}
          </h1>

          <p className="mx-auto max-w-3xl text-lg text-zinc-300 md:text-xl">{t("subtitle")}</p>

          <div className="flex flex-col justify-center gap-4 pt-2 sm:flex-row">
            <Link href="/courses">
              <Button size="lg" className="h-12 w-full gap-2 border border-fuchsia-400/30 bg-gradient-to-r from-purple-600 to-fuchsia-600 px-8 text-lg shadow-[0_0_35px_rgba(192,132,252,0.5)] transition-transform hover:scale-[1.02] sm:w-auto">
                {t("start")} <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="#features">
              <Button size="lg" variant="outline" className="h-12 w-full border-cyan-300/40 bg-zinc-900/60 px-8 text-lg text-cyan-100 backdrop-blur hover:bg-zinc-800 sm:w-auto">
                {t("features_explore")}
              </Button>
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mx-auto mt-16 max-w-4xl overflow-hidden rounded-2xl border border-white/10 bg-black/40 shadow-[0_0_70px_rgba(139,92,246,0.25)] backdrop-blur-xl"
        >
          <div className="flex items-center gap-2 border-b border-white/10 bg-zinc-900/70 px-4 py-3">
            <div className="flex gap-1.5">
              <div className="h-3 w-3 rounded-full bg-rose-500/90" />
              <div className="h-3 w-3 rounded-full bg-amber-400/90" />
              <div className="h-3 w-3 rounded-full bg-emerald-400/90" />
            </div>
            <span className="ml-2 font-mono text-xs text-zinc-400">onchain-academy/programs/onchain-academy/src/instructions/reward_xp.rs</span>
          </div>
          <div className="overflow-x-auto p-6 text-left font-mono text-sm text-cyan-100">
            <pre>
{`pub fn reward_xp(ctx: Context<RewardXp>, amount: u64) -> Result<()> {
    let learner = &mut ctx.accounts.learner;
    learner.total_xp = learner.total_xp.checked_add(amount)
        .ok_or(AcademyError::MathOverflow)?;

    emit!(XpRewarded {
        learner: learner.user,
        amount,
        new_total: learner.total_xp,
    });

    Ok(())
}`}
            </pre>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
