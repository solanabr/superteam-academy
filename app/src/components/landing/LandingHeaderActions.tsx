"use client";

import { Link } from "@/i18n/routing";

export function LandingHeaderActions() {
    return (
        <div className="flex items-center gap-6">
            <Link
                href="/login"
                className="font-code text-xs font-bold uppercase tracking-widest bg-solana text-[#0A0A0B] px-6 py-2.5 rounded-full hover:bg-solana-accent transition-all duration-300 shadow-[0_4px_20px_rgba(20,241,149,0.3)] hover:scale-105 active:scale-95"
            >
                Launch App
            </Link>
        </div>
    );
}
