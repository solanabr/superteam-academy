import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/*/dashboard",
        "/*/profile",
        "/*/settings",
        "/*/certificates",
        "/api/",
      ],
    },
    sitemap: `${process.env.NEXT_PUBLIC_APP_URL || "https://superteam-academy-web.vercel.app"}/sitemap.xml`,
  };
}
