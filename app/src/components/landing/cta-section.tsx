"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CTASection() {
  const t = useTranslations("landing.cta");

  return (
    <section className="py-20 md:py-28">
      <div className="container px-4">
        <div className="relative mx-auto max-w-4xl overflow-hidden rounded-3xl bg-gradient-to-r from-primary to-accent p-8 md:p-16 text-center">
          {/* Background decoration */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute left-0 top-0 h-full w-full bg-[linear-gradient(to_right,rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:40px_40px]" />
          </div>

          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl">
            {t("title")}
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg text-white/80">
            {t("subtitle")}
          </p>
          <div className="mt-10">
            <Button
              asChild
              size="xl"
              variant="secondary"
              className="gap-2 bg-white text-primary hover:bg-white/90"
            >
              <Link href="/courses">
                {t("button")}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
