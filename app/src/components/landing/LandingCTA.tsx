"use client";

import { Link } from "@/i18n/routing";
import { ArrowRight } from "lucide-react";

export function LandingCTA() {
    return (
        <div className="mt-32 mb-20 z-10">
            <Link
                href="/login"
                className="h-14 px-10 bg-solana hover:bg-[#10d482] hover:scale-105 transition-all duration-300 text-black font-display font-bold text-lg rounded-sm flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(20,241,149,0.3)] inline-flex items-center"
            >
                <span>Start Compiling</span>
                <ArrowRight size={20} className="text-void ml-3" />
            </Link>
        </div>
    );
}
