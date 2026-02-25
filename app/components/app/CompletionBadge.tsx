"use client";

import Image from "next/image";

interface CompletionBadgeProps {
    courseTitle: string;
    isCompleted: boolean;
    children: React.ReactNode; // The original course card content
}

export function CompletionBadge({
    courseTitle,
    isCompleted,
    children,
}: CompletionBadgeProps) {
    if (!isCompleted) {
        return <>{children}</>;
    }

    return (
        <div className="group [perspective:1000px]">
            <div className="relative transition-all duration-700 [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)]">
                {/* Front — the normal course card */}
                <div className="[backface-visibility:hidden]">{children}</div>

                {/* Back — golden badge */}
                <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] flex flex-col items-center justify-center gap-3 border-4 border-yellow-400 rounded-2xl bg-zinc-900">
                    <div className="animate-badge-shake">
                        <Image
                            src="/badge.png"
                            alt="Badge"
                            width={80}
                            height={80}
                        />
                    </div>
                    <h3 className="font-game text-2xl text-yellow-400 text-center px-4">
                        {courseTitle}
                    </h3>
                    <p className="font-game text-lg text-gray-400">Completed! 🎉</p>
                </div>
            </div>
        </div>
    );
}
