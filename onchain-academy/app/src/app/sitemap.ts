import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://superteam-academy.vercel.app/en",
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
  ];
}
