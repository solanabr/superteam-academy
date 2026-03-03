"use client";

import { useTranslations } from "next-intl";
import {
  AnimatedSection,
  StaggerChildren,
  StaggerItem,
} from "./animated-section";

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.NEXT_PUBLIC_SERVER_URL ||
  "https://academy.superteam.fun";

function stripProtocol(url: string) {
  return url.replace(/^https?:\/\//, "");
}

const SCREENSHOTS = [
  { key: "dashboard", gradient: "from-st-green-dark to-primary/30" },
  { key: "lesson", gradient: "from-brazil-blue/30 to-st-green-dark" },
  { key: "leaderboard", gradient: "from-brazil-gold/20 to-st-green-dark" },
] as const;

export function AppScreenshots() {
  const t = useTranslations("landing.screenshots");
  const baseHost = stripProtocol(APP_URL);

  return (
    <AnimatedSection>
      <section className="bg-card/30">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="font-heading text-3xl font-bold sm:text-4xl">
              {t("sectionTitle")}
            </h2>
            <p className="mt-3 text-lg text-muted-foreground">
              {t("sectionSubtitle")}
            </p>
          </div>

          <StaggerChildren className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {SCREENSHOTS.map(({ key, gradient }) => (
              <StaggerItem key={key}>
                <div className="group perspective-container">
                  <div className="rounded-xl border border-border bg-[#1a2e20] overflow-hidden transition-all duration-500 group-hover:[transform:perspective(1000px)_rotateY(-3deg)_rotateX(2deg)] group-hover:shadow-2xl group-hover:shadow-primary/10">
                    {/* Browser chrome */}
                    <div className="flex items-center gap-2 border-b border-border/50 px-3 py-2">
                      <div className="flex gap-1.5">
                        <div className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]/70" />
                        <div className="h-2.5 w-2.5 rounded-full bg-[#febc2e]/70" />
                        <div className="h-2.5 w-2.5 rounded-full bg-[#28c840]/70" />
                      </div>
                      <div className="flex-1 mx-2 rounded-md bg-white/5 px-3 py-1 text-[10px] text-muted-foreground font-mono truncate">
                        {baseHost}/{key}
                      </div>
                    </div>

                    {/* Screenshot placeholder */}
                    <div
                      className={`relative aspect-[16/10] bg-gradient-to-br ${gradient}`}
                    >
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6">
                        <ScreenPlaceholder type={key} />
                        <span className="text-xs font-medium text-foreground/40">
                          {t(`${key}.label`)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerChildren>
        </div>
      </section>
    </AnimatedSection>
  );
}

function ScreenPlaceholder({ type }: { type: string }) {
  if (type === "dashboard") {
    return (
      <div className="w-full max-w-[200px] space-y-2">
        <div className="flex gap-2">
          <div className="h-12 flex-1 rounded-lg bg-white/5" />
          <div className="h-12 flex-1 rounded-lg bg-white/5" />
          <div className="h-12 flex-1 rounded-lg bg-white/5" />
        </div>
        <div className="h-20 w-full rounded-lg bg-white/5" />
        <div className="flex gap-2">
          <div className="h-8 flex-1 rounded-lg bg-primary/10" />
          <div className="h-8 flex-1 rounded-lg bg-brazil-gold/10" />
        </div>
      </div>
    );
  }
  if (type === "lesson") {
    return (
      <div className="w-full max-w-[200px] space-y-2">
        <div className="h-3 w-3/4 rounded bg-white/10" />
        <div className="h-3 w-full rounded bg-white/5" />
        <div className="h-3 w-5/6 rounded bg-white/5" />
        <div className="mt-3 h-16 w-full rounded-lg bg-white/5 border border-white/5" />
        <div className="h-8 w-24 rounded-lg bg-primary/20" />
      </div>
    );
  }
  return (
    <div className="w-full max-w-[200px] space-y-2">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-full bg-white/10" />
          <div className="h-3 flex-1 rounded bg-white/5" />
          <div className="h-3 w-10 rounded bg-brazil-gold/15" />
        </div>
      ))}
    </div>
  );
}
