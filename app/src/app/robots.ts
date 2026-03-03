import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
    const base = "https://superteam-academy-lms-steel.vercel.app";
    return {
        rules: {
            userAgent: "*",
            allow: "/",
            disallow: ["/api/", "/admin/"],
        },
        sitemap: `${base}/sitemap.xml`,
    };
}
