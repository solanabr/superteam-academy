"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function LandingCTA() {
    const { ready, authenticated, login } = usePrivy();
    const router = useRouter();

    return (
        <div className="mt-32 mb-20 z-10">
            <Button
                onClick={() => {
                    if (!ready) return;
                    if (authenticated) {
                        router.push("/dashboard");
                    } else {
                        login();
                    }
                }}
                disabled={!ready}
                variant="default"
                size="lg"
                className="h-14 px-10 bg-solana hover:bg-[#10d482] hover:scale-105 transition-all duration-300 text-black font-display font-bold text-lg rounded-sm flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(20,241,149,0.3)] disabled:opacity-50"
            >
                <span>{authenticated ? "Dashboard" : "Start Compiling"}</span>
                <span className="material-symbols-outlined notranslate text-xl text-void">arrow_forward</span>
            </Button>
        </div>
    );
}
