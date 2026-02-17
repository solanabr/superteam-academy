"use client";

import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { ArrowRight, Clock, BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { learningPaths, courses } from "@/lib/mock-data";
import { useWalletAuth } from "@/components/providers/wallet-auth-provider";

export function PathsSection() {
  const { connected } = useWallet();
  const { setVisible } = useWalletModal();
  const { isAuthenticated, isLoading, loginWithWallet } = useWalletAuth();

  const handleUnlockClick = () => {
    if (!connected) {
      try {
        setTimeout(() => {
          try {
            setVisible(true);
          } catch (err) {
            console.error("Failed to open wallet modal:", err);
            if (
              typeof window !== "undefined" &&
              (window as any).solana?.isPhantom
            ) {
              (window as any).solana.connect().catch(() => undefined);
            }
          }
        }, 100);
      } catch (err) {
        console.error("Wallet connection error:", err);
      }
      return;
    }
    void loginWithWallet().catch(() => undefined);
  };

  return (
    <section className="py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 lg:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground lg:text-4xl text-balance">
            Structured Learning Paths
          </h2>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto text-pretty">
            Follow curated tracks designed to take you from beginner to expert
            with clear progression and real-world projects.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {learningPaths.map((path) => {
            const pathCourses = path.courses.map(
              (slug) => courses.find((c) => c.slug === slug)!,
            );
            const avgProgress = Math.round(
              pathCourses.reduce((acc, c) => acc + c.progress, 0) /
                pathCourses.length,
            );

            return (
              <div
                key={path.title}
                className="group rounded-xl border border-border bg-card p-6 transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">
                      {path.title}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                      {path.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {path.totalDuration}
                  </span>
                  <span className="flex items-center gap-1">
                    <BookOpen className="h-3.5 w-3.5" />
                    {path.courses.length} courses
                  </span>
                  <Badge variant="outline" className="text-xs border-border">
                    {path.difficulty}
                  </Badge>
                </div>

                {/* Course list */}
                <div className="space-y-2 mb-4">
                  {pathCourses.map((course, i) => (
                    <div
                      key={course.slug}
                      className="flex items-center gap-3 rounded-lg bg-secondary/50 px-3 py-2"
                    >
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/20 text-[10px] font-semibold text-primary">
                        {i + 1}
                      </span>
                      <span className="text-sm text-foreground truncate">
                        {course.title}
                      </span>
                      {course.progress > 0 && (
                        <span className="ml-auto text-xs text-primary shrink-0">
                          {course.progress}%
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                {/* Progress */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-muted-foreground">
                      Progress
                    </span>
                    <span className="text-xs font-medium text-foreground">
                      {avgProgress}%
                    </span>
                  </div>
                  <Progress
                    value={avgProgress}
                    className="h-1.5 bg-secondary [&>div]:bg-primary"
                  />
                </div>

                {isAuthenticated ? (
                  <Link href="/courses">
                    <Button
                      variant="ghost"
                      className="w-full justify-between text-muted-foreground hover:text-foreground hover:bg-secondary"
                    >
                      {avgProgress > 0 ? "Continue Path" : "Start Path"}
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                ) : (
                  <Button
                    variant="ghost"
                    className="w-full justify-between text-muted-foreground hover:text-foreground hover:bg-secondary"
                    disabled={isLoading}
                    onClick={handleUnlockClick}
                  >
                    {isLoading ? "Authorizing..." : "Connect Wallet to Unlock"}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
