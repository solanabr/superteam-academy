"use client";

import { Target } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ChallengesPage() {
    const t = useTranslations("common");

    return (
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-10 text-center">
            <div className="inline-flex items-center gap-2 bg-yellow-400/10 border border-yellow-400/20 rounded-full px-4 sm:px-5 py-2 mb-4 sm:mb-6">
                <Target className="h-4 w-4 text-yellow-400 shrink-0" />
                <span className="font-game text-base sm:text-lg text-yellow-400">{t("challenges")}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-game mb-2 sm:mb-3 px-2">
                Bite-sized <span className="text-yellow-400">Challenges</span>
            </h1>
            <p className="font-game text-lg sm:text-xl text-muted-foreground mb-6 sm:mb-8 px-2">
                Practice what you learned with code challenges. Coming soon.
            </p>
            <Button asChild variant="outline" className="font-game">
                <Link href="/courses">Browse courses</Link>
            </Button>
        </div>
    );
}
