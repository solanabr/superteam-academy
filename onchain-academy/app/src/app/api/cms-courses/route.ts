import { NextResponse } from "next/server";

type CmsCourse = {
  slug: string;
  title: string;
  description: string;
  difficulty: string;
  durationHours: number;
  xpReward: number;
  track: string;
  thumbnailUrl: string;
};

const SANITY_API_VERSION = "v2023-10-01";

export async function GET() {
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";
  if (!projectId || projectId === "your-project-id") {
    return NextResponse.json({ courses: [] as CmsCourse[] });
  }

  const query = `*[_type == "course"]{
    "slug": slug.current,
    title,
    description,
    difficulty,
    durationHours,
    xpReward,
    track,
    thumbnailUrl
  }`;
  const url = `https://${projectId}.api.sanity.io/${SANITY_API_VERSION}/data/query/${dataset}?query=${encodeURIComponent(query)}`;

  try {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) {
      return NextResponse.json({ courses: [] as CmsCourse[] });
    }
    const json = (await response.json()) as { result?: CmsCourse[] };
    const courses = (json.result ?? []).filter((course) => Boolean(course.slug));
    return NextResponse.json({ courses });
  } catch {
    return NextResponse.json({ courses: [] as CmsCourse[] });
  }
}

