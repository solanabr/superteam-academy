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
        <section className="w-full py-16 bg-zinc-900">
            <div className="mx-auto max-w-7xl px-6">
                <h2 className="text-4xl mb-4 font-game">Explore More</h2>
                <div className="grid grid-cols-2 gap-5">
                    {FEATURES.map((feature) => (
                        <div
                            key={feature.title}
                            className="flex gap-3 p-3 border rounded-xl bg-zinc-900 hover:bg-zinc-800 transition-colors cursor-pointer"
                        >
                            <Image
                                src={feature.icon}
                                alt={feature.title}
                                width={80}
                                height={80}
                            />
                            <div>
                                <h2 className="font-medium text-2xl font-game">
                                    {feature.title}
                                </h2>
                                <p className="font-game text-gray-400">{feature.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
