import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
    const base = "https://superteam-academy-lms-steel.vercel.app";

    const staticRoutes = [
        { url: base, priority: 1.0, changeFrequency: "weekly" as const },
        { url: `${base}/courses`, priority: 0.9, changeFrequency: "daily" as const },
        { url: `${base}/challenges`, priority: 0.8, changeFrequency: "daily" as const },
        { url: `${base}/community`, priority: 0.8, changeFrequency: "daily" as const },
        { url: `${base}/leaderboard`, priority: 0.7, changeFrequency: "hourly" as const },
        { url: `${base}/dashboard`, priority: 0.7, changeFrequency: "daily" as const },
        { url: `${base}/profile`, priority: 0.6, changeFrequency: "weekly" as const },
        { url: `${base}/settings`, priority: 0.4, changeFrequency: "monthly" as const },
        { url: `${base}/welcome`, priority: 0.5, changeFrequency: "monthly" as const },
    ];

    return staticRoutes.map((route) => ({
        url: route.url,
        lastModified: new Date(),
        changeFrequency: route.changeFrequency,
        priority: route.priority,
    }));
}
