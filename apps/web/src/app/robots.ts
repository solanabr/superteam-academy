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
    sitemap: "https://superteam-lms.vercel.app/sitemap.xml",
  };
}
