"use client";

import Image from "next/image";

const FEATURES = [
    {
        title: "Quiz Pack",
        desc: "Practice what you learned with bite-sized code challenges.",
        icon: "/tree.png",
    },
    {
        title: "Video Courses",
        desc: "Learn with structured video lessons taught step-by-step.",
        icon: "/game.png",
    },
    {
        title: "Community Projects",
        desc: "Build real-world apps by collaborating with the community.",
        icon: "/growth.png",
    },
    {
        title: "Explore dApps",
        desc: "Explore prebuilt apps to kickstart your learning journey.",
        icon: "/start-up.png",
    },
];

export function FeaturesSection() {
    return (
        <section className="w-full py-16 sm:py-20 bg-background">
            <div className="mx-auto max-w-7xl px-4 sm:px-6">

                <h2 className="text-3xl sm:text-4xl md:text-5xl mb-8 font-game">
                    Explore More
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {FEATURES.map((feature) => (
                        <div
                            key={feature.title}
                            className="flex gap-4 p-5 border border-white/10 rounded-2xl bg-card hover:bg-accent transition-all duration-300 cursor-pointer hover:-translate-y-1"
                        >
                            <div className="flex-shrink-0">
                                <Image
                                    src={feature.icon}
                                    alt={feature.title}
                                    width={60}
                                    height={60}
                                    className="w-12 h-12 sm:w-14 sm:h-14"
                                />
                            </div>

                            <div>
                                <h3 className="font-medium text-xl sm:text-2xl font-game">
                                    {feature.title}
                                </h3>
                                <p className="font-game text-sm sm:text-base text-muted-foreground mt-1">
                                    {feature.desc}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}