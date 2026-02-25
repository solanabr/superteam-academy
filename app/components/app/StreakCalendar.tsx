"use client";

import Image from "next/image";

interface StreakCalendarProps {
    currentStreak: number;
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function StreakCalendar({ currentStreak }: StreakCalendarProps) {
    // Show which days have active streak (simple: last N days from today)
    const today = new Date().getDay(); // 0=Sun, 1=Mon...
    // Convert to Mon=0 based index
    const todayIdx = today === 0 ? 6 : today - 1;

    return (
        <div className="p-4 border-4 rounded-2xl mt-6">
            <h2 className="font-game text-2xl mb-3">Weekly Streak</h2>
            <div className="flex gap-3 justify-between">
                {DAYS.map((day, i) => {
                    // A day is "active" if it's within the current streak window
                    const isActive = i <= todayIdx && todayIdx - i < currentStreak;
                    const isToday = i === todayIdx;

                    return (
                        <div key={day} className="flex flex-col items-center gap-1">
                            <div
                                className={`relative transition-all ${isActive
                                        ? "scale-110"
                                        : "grayscale opacity-30"
                                    }`}
                            >
                                <Image
                                    src="/fire.png"
                                    alt="fire"
                                    width={32}
                                    height={32}
                                />
                            </div>
                            <span
                                className={`font-game text-sm ${isToday
                                        ? "text-yellow-400"
                                        : isActive
                                            ? "text-white"
                                            : "text-gray-600"
                                    }`}
                            >
                                {day}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
