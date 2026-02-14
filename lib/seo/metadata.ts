import type { Metadata } from "next";

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export function createPageMetadata(title: string, description: string, path = "/"): Metadata {
  const url = new URL(path, appUrl).toString();
  const image = new URL("/opengraph-image", appUrl).toString();

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      images: [{ url: image, width: 1200, height: 630 }],
      type: "website"
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image]
    },
    alternates: {
      canonical: url
    }
  };
}
