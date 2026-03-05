"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Hero } from "@/components/landing/hero";
import { LearningPaths } from "@/components/landing/learning-paths";
import { InteractiveTeaser } from "@/components/landing/interactive-teaser";
import { Gamification } from "@/components/landing/gamification";
import { Credentials } from "@/components/landing/credentials";
import { Community } from "@/components/landing/community";
import { CTASection } from "@/components/landing/cta-section";

export function HomeGateway() {
    const { isAuthenticated } = useAuth();
    const router = useRouter();
    const wasAuthenticated = useRef(false);

    useEffect(() => {
        // If user just signed in (transition from false → true), redirect to dashboard
        if (isAuthenticated && !wasAuthenticated.current) {
            router.push("/dashboard");
        }
        wasAuthenticated.current = isAuthenticated;
    }, [isAuthenticated, router]);

    return (
        <div className="min-h-screen">
            <Header />
            <main>
                <Hero />
                <LearningPaths />
                <InteractiveTeaser />
                <Gamification />
                <Credentials />
                <Community />
                <CTASection />
            </main>
            <Footer />
        </div>
    );
}
