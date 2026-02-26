"use client";

type Props = {
    icon: string;
    title: string;
    description?: string;
    claimed: boolean;
    size?: "sm" | "md" | "lg";
};

const SIZE_MAP = {
    sm: { hex: "w-14 h-16", iconText: "text-2xl", labelText: "text-[9px]" },
    md: { hex: "w-20 h-24", iconText: "text-3xl", labelText: "text-[10px]" },
    lg: { hex: "w-24 h-28", iconText: "text-4xl", labelText: "text-xs" },
};

export function AchievementBadge({
    icon,
    title,
    description,
    claimed,
    size = "md",
}: Props) {
    const s = SIZE_MAP[size];

    return (
        <div
            className={`flex flex-col items-center gap-2 group transition-all duration-300 ${claimed ? "" : "opacity-30 grayscale"
                }`}
            title={description ? `${title}: ${description}${claimed ? " ✓" : ""}` : title}
        >
            <div className="relative">
                <div
                    className={`hexagon-container relative ${s.hex} transition-transform group-hover:scale-110 duration-300 ${claimed ? "drop-shadow-[0_0_10px_rgba(20,241,149,0.25)]" : ""
                        }`}
                >
                    <div className="hexagon-inner absolute inset-0 bg-gradient-to-br from-gray-800 to-black p-[1px]">
                        <div
                            className={`absolute inset-0 hexagon opacity-90 ${claimed
                                    ? "bg-gradient-to-br from-solana to-emerald-900"
                                    : "bg-gradient-to-br from-gray-700 to-gray-900"
                                }`}
                        ></div>
                        <div className="absolute inset-[2px] bg-void hexagon flex items-center justify-center">
                            <span className={s.iconText}>{icon}</span>
                        </div>
                    </div>
                </div>

                {claimed && (
                    <div className="absolute -top-1 -right-1 size-5 bg-solana rounded-full flex items-center justify-center border-2 border-void shadow-[0_0_8px_rgba(20,241,149,0.6)]">
                        <span className="material-symbols-outlined text-[11px] text-void font-bold">
                            check
                        </span>
                    </div>
                )}
            </div>

            <span
                className={`${s.labelText} font-mono uppercase tracking-wider font-bold text-center ${claimed ? "text-solana" : "text-text-muted"
                    }`}
            >
                {title}
            </span>
        </div>
    );
}
